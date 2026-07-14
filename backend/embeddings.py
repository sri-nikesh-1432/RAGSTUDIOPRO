"""
RAG Studio Pro - Embeddings Module
Real embedding generation using sentence-transformers with 5 model options.
LRU cache with max 3 models to prevent OOM.
"""

import time
import os
import gc
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from collections import OrderedDict


# ─── Model Registry ────────────────────────────────────────────────

EMBEDDING_MODELS = {
    "all-MiniLM-L6-v2": {
        "name": "all-MiniLM-L6-v2",
        "display_name": "MiniLM L6",
        "dimensions": 384,
        "description": "Fast & lightweight. Good balance of speed and quality.",
        "size_mb": 90,
        "speed": "fast",
        "quality": "good",
    },
    "BAAI/bge-small-en-v1.5": {
        "name": "BAAI/bge-small-en-v1.5",
        "display_name": "BGE Small",
        "dimensions": 384,
        "description": "Best for retrieval tasks. High quality embeddings.",
        "size_mb": 130,
        "speed": "medium",
        "quality": "high",
    },
    "intfloat/e5-small-v2": {
        "name": "intfloat/e5-small-v2",
        "display_name": "E5 Small",
        "dimensions": 384,
        "description": "Excellent for semantic similarity. Instruction-aware.",
        "size_mb": 130,
        "speed": "medium",
        "quality": "high",
    },
    "all-mpnet-base-v2": {
        "name": "all-mpnet-base-v2",
        "display_name": "MPNet Base",
        "dimensions": 768,
        "description": "Highest quality general-purpose model. Slower but better.",
        "size_mb": 420,
        "speed": "slow",
        "quality": "very_high",
    },
    "hkunlp/instructor-small": {
        "name": "hkunlp/instructor-small",
        "display_name": "Instructor Small",
        "dimensions": 768,
        "description": "Task-specific embeddings via instructions.",
        "size_mb": 500,
        "speed": "slow",
        "quality": "very_high",
    },
}


@dataclass
class EmbeddingResult:
    success: bool
    embeddings: List[List[float]]
    dimensions: int
    count: int
    model: str
    download_time_ms: float = 0
    inference_time_ms: float = 0
    error: Optional[str] = None


# ─── Model Cache (LRU, max 3 models) ─────────────────────────────

_MAX_CACHED_MODELS = 3
_model_cache: OrderedDict = OrderedDict()


def _get_model(model_name: str) -> Any:
    """Load or retrieve cached model with LRU eviction."""
    global _model_cache
    if model_name in _model_cache:
        _model_cache.move_to_end(model_name)
        return _model_cache[model_name]

    # Evict oldest if cache full
    while len(_model_cache) >= _MAX_CACHED_MODELS:
        _model_cache.popitem(last=False)
        gc.collect()

    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer(model_name)
        _model_cache[model_name] = model
        return model
    except Exception as e:
        raise RuntimeError(f"Failed to load model {model_name}: {e}")


def is_model_downloaded(model_name: str) -> bool:
    """Check if a model is already downloaded/cached."""
    try:
        from huggingface_hub import try_to_load_from_cache
        result = try_to_load_from_cache(model_name, "config.json")
        return result is not None and not isinstance(result, type(None))
    except Exception:
        return False


def get_model_info(model_name: str) -> Dict[str, Any]:
    """Get info about a model."""
    info = EMBEDDING_MODELS.get(model_name, {})
    if info:
        info["downloaded"] = is_model_downloaded(model_name)
    return info


def get_all_models() -> List[Dict[str, Any]]:
    """Get info about all available models."""
    models = []
    for name, info in EMBEDDING_MODELS.items():
        info_copy = dict(info)
        info_copy["downloaded"] = is_model_downloaded(name)
        models.append(info_copy)
    return models


# ─── Embedding Generation ──────────────────────────────────────────

def generate_embeddings(
    texts: List[str],
    model_name: str = "all-MiniLM-L6-v2",
) -> EmbeddingResult:
    """
    Generate embeddings for a list of texts using sentence-transformers.
    """
    if not texts:
        return EmbeddingResult(
            success=False, embeddings=[], dimensions=0, count=0,
            model=model_name, error="No texts provided"
        )

    try:
        download_start = time.time()
        model = _get_model(model_name)
        download_time = (time.time() - download_start) * 1000

        # For E5 models, prefix with "query: " or "passage: "
        if "e5" in model_name.lower():
            texts = [f"passage: {t}" for t in texts]

        inference_start = time.time()
        embeddings = model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
        inference_time = (time.time() - inference_start) * 1000

        embedding_list = embeddings.tolist()
        dimensions = len(embedding_list[0]) if embedding_list else 0

        return EmbeddingResult(
            success=True,
            embeddings=embedding_list,
            dimensions=dimensions,
            count=len(texts),
            model=model_name,
            download_time_ms=download_time,
            inference_time_ms=inference_time,
        )
    except Exception as e:
        return EmbeddingResult(
            success=False, embeddings=[], dimensions=0, count=0,
            model=model_name, error=str(e)
        )


def generate_query_embedding(
    query: str,
    model_name: str = "all-MiniLM-L6-v2",
) -> EmbeddingResult:
    """Generate embedding for a single query."""
    return generate_embeddings([query], model_name)


def clear_model_cache():
    """Clear cached models to free memory."""
    global _model_cache
    _model_cache.clear()
    gc.collect()
