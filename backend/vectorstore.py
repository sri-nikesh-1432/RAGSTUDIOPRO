"""
RAG Studio Pro - Vector Store Module
Real FAISS + ChromaDB vector stores with persistence.
"""

import os
import json
import time
import hashlib
import pickle
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from pathlib import Path


# ─── FAISS Vector Store ────────────────────────────────────────────

class FAISSVectorStore:
    """FAISS-based vector store with multiple index types."""

    def __init__(self, index_type: str = "flat", dimensions: int = 384):
        self.index_type = index_type
        self.dimensions = dimensions
        self.index = None
        self.vectors = []
        self.metadata = []
        self.ids = []
        self._build_index()

    def _build_index(self):
        """Build FAISS index of the specified type."""
        try:
            import faiss
            import numpy as np

            if self.index_type == "hnsw":
                # HNSW index for approximate nearest neighbors
                self.index = faiss.IndexHNSWFlat(self.dimensions, 32)
                self.index.hnsw.efSearch = 64
            elif self.index_type == "ivf":
                # IVF index (needs training)
                quantizer = faiss.IndexFlatIP(self.dimensions)
                nlist = min(100, max(1, len(self.vectors) // 10))
                self.index = faiss.IndexIVFFlat(quantizer, self.dimensions, max(nlist, 1))
            else:
                # Flat inner product index (exact)
                self.index = faiss.IndexFlatIP(self.dimensions)

        except ImportError:
            self.index = None

    def add(self, ids: List[str], vectors: List[List[float]], metadata: List[Dict] = None, texts: List[str] = None):
        """Add vectors to the store."""
        import numpy as np

        if not vectors:
            return

        np_vectors = np.array(vectors, dtype=np.float32)

        # Normalize for inner product similarity
        norms = np.linalg.norm(np_vectors, axis=1, keepdims=True)
        norms = np.maximum(norms, 1e-8)
        np_vectors = np_vectors / norms

        if self.index is not None:
            if self.index_type == "ivf" and not self.index.is_trained:
                # IVF needs training
                if len(vectors) >= 100:
                    self.index.train(np_vectors)

            if self.index_type != "ivf" or self.index.is_trained:
                self.index.add(np_vectors)

        self.vectors.extend(vectors)
        self.ids.extend(ids)
        meta_list = metadata or [{} for _ in ids]
        # Store text in metadata so search results include it
        if texts:
            for i, m in enumerate(meta_list):
                m_copy = dict(m)
                if i < len(texts):
                    m_copy["text"] = texts[i]
                meta_list[i] = m_copy
        self.metadata.extend(meta_list)

    def search(self, query_vector: List[float], top_k: int = 5) -> List[Dict]:
        """Search for similar vectors."""
        import numpy as np

        if not self.vectors or self.index is None:
            return []

        np_query = np.array([query_vector], dtype=np.float32)
        norm = np.linalg.norm(np_query)
        if norm > 0:
            np_query = np_query / norm

        # For IVF, set nprobe
        if self.index_type == "ivf" and hasattr(self.index, 'nprobe'):
            self.index.nprobe = min(10, max(1, self.index.ntotal // 100))

        k = min(top_k, len(self.vectors))
        if k == 0:
            return []

        distances, indices = self.index.search(np_query, k)

        results = []
        for i, (dist, idx) in enumerate(zip(distances[0], indices[0])):
            if idx < 0 or idx >= len(self.vectors):
                continue
            meta = self.metadata[idx] if idx < len(self.metadata) else {}
            results.append({
                "id": self.ids[idx],
                "score": float(dist),
                "rank": i + 1,
                "vector_index": int(idx),
                "text": meta.get("text", ""),
                "metadata": {k: v for k, v in meta.items() if k != "text"},
            })

        return results

    def get_vector(self, id: str) -> Optional[Dict]:
        """Get a specific vector by ID."""
        try:
            idx = self.ids.index(id)
            return {
                "id": id,
                "embedding": self.vectors[idx],
                "metadata": self.metadata[idx],
            }
        except ValueError:
            return None

    def delete(self, id: str) -> bool:
        """Delete a vector by ID."""
        try:
            idx = self.ids.index(id)
            self.ids.pop(idx)
            self.vectors.pop(idx)
            self.metadata.pop(idx)
            # Rebuild index
            self._build_index()
            if self.vectors:
                self.add(self.ids, self.vectors, self.metadata)
            return True
        except ValueError:
            return False

    def count(self) -> int:
        return len(self.vectors)

    def save(self, directory: str):
        """Persist the store to disk."""
        os.makedirs(directory, exist_ok=True)
        with open(os.path.join(directory, "store.pkl"), "wb") as f:
            pickle.dump({
                "ids": self.ids,
                "vectors": self.vectors,
                "metadata": self.metadata,
                "index_type": self.index_type,
                "dimensions": self.dimensions,
            }, f)

    def load(self, directory: str) -> bool:
        """Load the store from disk."""
        path = os.path.join(directory, "store.pkl")
        if not os.path.exists(path):
            return False
        with open(path, "rb") as f:
            data = pickle.load(f)
        self.ids = data["ids"]
        self.vectors = data["vectors"]
        self.metadata = data["metadata"]
        self.index_type = data.get("index_type", "flat")
        self.dimensions = data.get("dimensions", 384)
        self._build_index()
        if self.vectors:
            import numpy as np
            np_vectors = np.array(self.vectors, dtype=np.float32)
            norms = np.linalg.norm(np_vectors, axis=1, keepdims=True)
            norms = np.maximum(norms, 1e-8)
            np_vectors = np_vectors / norms
            self.index.add(np_vectors)
        return True

    def stats(self) -> Dict:
        return {
            "total_vectors": self.count(),
            "dimensions": self.dimensions,
            "index_type": f"faiss_{self.index_type}",
            "memory_estimate_mb": round(len(self.vectors) * self.dimensions * 4 / 1_000_000, 2),
        }


# ─── ChromaDB Vector Store ─────────────────────────────────────────

class ChromaVectorStore:
    """ChromaDB-based vector store with persistence."""

    def __init__(self, collection_name: str = "default", persist_directory: str = None):
        self.collection_name = collection_name
        self.persist_directory = persist_directory or os.environ.get(
            "RAG_CHROMADB_PATH",
            os.path.join(os.path.expanduser("~"), ".rag-studio-pro", "chromadb")
        )
        self.client = None
        self.collection = None
        self._init_chroma()

    def _init_chroma(self):
        """Initialize ChromaDB client and collection."""
        try:
            import chromadb
            self.client = chromadb.PersistentClient(path=self.persist_directory)
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
        except ImportError:
            self.client = None
            self.collection = None

    def add(self, ids: List[str], embeddings: List[List[float]], texts: List[str], metadata: List[Dict] = None):
        """Add vectors to ChromaDB."""
        if self.collection is None:
            return

        # ChromaDB metadata must be flat dicts with str/int/float/bool values
        chroma_metadata = []
        for m in (metadata or [{} for _ in ids]):
            flat = {}
            for k, v in m.items():
                if isinstance(v, (str, int, float, bool)):
                    flat[k] = v
                else:
                    flat[k] = str(v)
            chroma_metadata.append(flat)

        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=chroma_metadata,
        )

    def search(self, query_embedding: List[float], top_k: int = 5) -> List[Dict]:
        """Search for similar vectors in ChromaDB."""
        if self.collection is None:
            return []

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, self.collection.count() or 1),
        )

        output = []
        if results and results["ids"]:
            for i, id_val in enumerate(results["ids"][0]):
                output.append({
                    "id": id_val,
                    "score": 1 - results["distances"][0][i] if results.get("distances") else 0,
                    "rank": i + 1,
                    "text": results["documents"][0][i] if results.get("documents") else "",
                    "metadata": results["metadatas"][0][i] if results.get("metadatas") else {},
                })

        return output

    def get(self, id: str) -> Optional[Dict]:
        """Get a specific entry by ID."""
        if self.collection is None:
            return None
        result = self.collection.get(ids=[id])
        if result and result["ids"]:
            return {
                "id": result["ids"][0],
                "embedding": result["embeddings"][0] if result.get("embeddings") else None,
                "text": result["documents"][0] if result.get("documents") else "",
                "metadata": result["metadatas"][0] if result.get("metadatas") else {},
            }
        return None

    def delete(self, id: str) -> bool:
        """Delete an entry by ID."""
        if self.collection is None:
            return False
        self.collection.delete(ids=[id])
        return True

    def count(self) -> int:
        if self.collection is None:
            return 0
        return self.collection.count()

    def delete_collection(self):
        """Delete the entire collection."""
        if self.client and self.collection_name:
            try:
                self.client.delete_collection(self.collection_name)
            except Exception:
                pass

    def stats(self) -> Dict:
        return {
            "total_vectors": self.count(),
            "collection_name": self.collection_name,
            "persist_directory": self.persist_directory,
            "store_type": "chromadb",
        }


# ─── Unified Vector Store Manager ──────────────────────────────────

class VectorStoreManager:
    """Manages multiple vector store backends."""

    def __init__(self, persist_directory: str = None):
        self.persist_directory = persist_directory or os.path.join(
            os.path.expanduser("~"), ".rag-studio-pro", "vectors"
        )
        self.stores: Dict[str, Any] = {}

    def get_store(self, store_type: str = "faiss_flat", collection: str = "default", dimensions: int = 384):
        """Get or create a vector store."""
        key = f"{store_type}:{collection}"

        if key in self.stores:
            return self.stores[key]

        if store_type.startswith("faiss"):
            index_type = store_type.replace("faiss_", "")
            store = FAISSVectorStore(index_type=index_type, dimensions=dimensions)
            # Try loading persisted data
            persist_path = os.path.join(self.persist_directory, collection, "faiss")
            if os.path.exists(persist_path):
                store.load(persist_path)
            self.stores[key] = store

        elif store_type == "chromadb":
            persist_path = os.path.join(self.persist_directory, collection, "chroma")
            store = ChromaVectorStore(collection_name=collection, persist_directory=persist_path)
            self.stores[key] = store

        else:
            raise ValueError(f"Unknown store type: {store_type}")

        return store

    def save_store(self, store_type: str, collection: str):
        """Persist a store to disk."""
        key = f"{store_type}:{collection}"
        store = self.stores.get(key)
        if store and hasattr(store, 'save'):
            persist_path = os.path.join(self.persist_directory, collection, "faiss")
            store.save(persist_path)

    def delete_store(self, store_type: str, collection: str):
        """Delete a store."""
        key = f"{store_type}:{collection}"
        store = self.stores.pop(key, None)
        if store and hasattr(store, 'delete_collection'):
            store.delete_collection()

    def list_stores(self) -> List[Dict]:
        """List all active stores."""
        stores = []
        for key, store in self.stores.items():
            store_type, collection = key.split(":", 1)
            stats = store.stats()
            stores.append({
                "store_type": store_type,
                "collection": collection,
                **stats,
            })
        return stores
