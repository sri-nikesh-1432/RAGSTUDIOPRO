"""
RAG Studio Pro - FastAPI Backend
Complete RAG pipeline with real file parsing, chunking, embeddings, vector store, retrieval, and generation.
"""

import os
import sys
import json
import time
import tracemalloc
import shutil
import tempfile
from pathlib import Path
from datetime import datetime
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

# ─── Local Modules ─────────────────────────────────────────────────
from models import (
    ChunkingRequest, ChunkingMethod, EmbeddingModel, VectorStoreType,
    LLMProvider, RetrievalRequest, GenerationRequest,
    PipelineRunRequest, ProjectSaveRequest, ProjectConfig,
)
from parsers import parse_file, detect_file_type
from chunkers import chunk_text
from embeddings import generate_embeddings, generate_query_embedding, get_all_models, get_model_info
from vectorstore import VectorStoreManager
from retrieval import cosine_similarity, rerank_results, hybrid_search, keyword_search
from llm import LLMGenerator
from pipeline import PipelineTracker, get_system_analytics, PIPELINE_STEP_DEFINITIONS
from projects import (
    create_project, save_project, load_project, delete_project,
    list_projects, save_file_to_project, export_project
)
from jobs import job_manager, STAGES

# ─── Load .env File ────────────────────────────────────────────────

_env_path = Path(__file__).parent / ".env"
try:
    from dotenv import load_dotenv
    if _env_path.exists():
        load_dotenv(str(_env_path))
    else:
        print(f"[ENV] No .env file found at {_env_path}. Using system environment variables.")
        print("   See backend/.env.example for all configurable variables.")
except ImportError:
    print("[WARN] python-dotenv not installed. Run: pip install python-dotenv")

# ─── App Setup ─────────────────────────────────────────────────────

app = FastAPI(
    title="RAG Studio Pro API",
    version="2.0.0",
    description="Complete RAG pipeline with real file parsing, chunking, embeddings, vector store, retrieval, and generation.",
)

# CORS: restrict to known origins in production
ALLOWED_ORIGINS = os.environ.get("RAG_CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# File upload size limit (default 100MB)
MAX_UPLOAD_SIZE = int(os.environ.get("RAG_MAX_UPLOAD_SIZE", 100 * 1024 * 1024))

# ─── Global State ──────────────────────────────────────────────────

vector_manager = VectorStoreManager()
llm_generator = LLMGenerator()
pipeline_tracker = PipelineTracker()

# Streaming upload chunk size (1MB)
STREAM_CHUNK_SIZE = 1024 * 1024

# Store parsed text and chunks in memory for pipeline
session_data: Dict[str, Any] = {
    "parsed_files": {},
    "chunks": {},
    "embeddings": {},
}

# ─── Pre-warm Embedding Model at Startup ─────────────────────────

print("[STARTUP] Pre-warming embedding model (all-MiniLM-L6-v2)...")
try:
    import time as _time
    _warm_start = _time.time()
    from sentence_transformers import SentenceTransformer
    _warm_model = SentenceTransformer('all-MiniLM-L6-v2')
    # Run a quick encode to ensure model is fully initialized
    _warm_model.encode(['Warmup'], normalize_embeddings=True)
    _warm_time = (_time.time() - _warm_start) * 1000
    print(f"[STARTUP] Embedding model loaded in {_warm_time:.0f}ms [OK]")
except Exception as _warm_err:
    print(f"[STARTUP] Could not pre-warm embedding model: {_warm_err}")
    print("[STARTUP] Model will be loaded on first request (may cause delay)")


# ═══════════════════════════════════════════════════════════════════
#  HEALTH & SYSTEM
# ═══════════════════════════════════════════════════════════════════

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "2.0.0", "timestamp": datetime.now().isoformat()}


@app.get("/api/system")
async def get_system():
    return get_system_analytics()


@app.get("/api/packages")
async def check_packages():
    """Check which Python packages are installed."""
    packages = {}
    check_list = [
        "sentence_transformers", "faiss", "chromadb", "pymupdf", "docx",
        "openpyxl", "pptx", "bs4", "pytesseract", "openai", "torch",
        "sklearn", "tiktoken", "whisper",
    ]
    for pkg in check_list:
        try:
            __import__(pkg)
            packages[pkg] = True
        except ImportError:
            packages[pkg] = False
    return packages


# ═══════════════════════════════════════════════════════════════════
#  ENV CONFIGURATION CHECK
# ═══════════════════════════════════════════════════════════════════

@app.get("/api/env")
async def check_env():
    """Check which API keys and config are available from the environment."""
    return {
        "env_file_loaded": _env_path.exists(),
        "providers": {
            "groq": bool(os.environ.get("GROQ_API_KEY", "")),
            "openai": bool(os.environ.get("OPENAI_API_KEY", "")),
            "anthropic": bool(os.environ.get("ANTHROPIC_API_KEY", "")),
            "google": bool(os.environ.get("GOOGLE_API_KEY", "")),
            "huggingface": bool(os.environ.get("HF_API_KEY", "")),
            "openrouter": bool(os.environ.get("OPENROUTER_API_KEY", "")),
            "deepseek": bool(os.environ.get("DEEPSEEK_API_KEY", "")),
            "mistral": bool(os.environ.get("MISTRAL_API_KEY", "")),
            "ollama": bool(os.environ.get("OLLAMA_BASE_URL", "")),
        },
        "settings": {
            "cors_origins": os.environ.get("RAG_CORS_ORIGINS", "default"),
            "max_upload_size_mb": int(os.environ.get("RAG_MAX_UPLOAD_SIZE", str(100 * 1024 * 1024))) / (1024 * 1024),
            "chromadb_path": os.environ.get("RAG_CHROMADB_PATH", "default"),
            "llm_timeout": os.environ.get("RAG_LLM_TIMEOUT", "120"),
        },
    }

# ═══════════════════════════════════════════════════════════════════
#  FILE PARSING
# ═══════════════════════════════════════════════════════════════════

@app.post("/api/parse/upload")
async def parse_uploaded_file(file: UploadFile = File(...)):
    """Parse an uploaded file and extract text."""
    tmp_path = None
    try:
        suffix = os.path.splitext(file.filename or "")[1]
        content = await file.read()

        # Enforce file size limit
        if len(content) > MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large: {len(content)} bytes exceeds limit of {MAX_UPLOAD_SIZE} bytes"
            )

        # Write content first, close, then parse
        tmp_path = os.path.join(tempfile.gettempdir(), f"rag_upload_{hash(str(content))}{suffix}")
        with open(tmp_path, "wb") as f:
            f.write(content)

        # Pass the original filename so we don't return the temp path name
        result = parse_file(tmp_path, original_filename=file.filename or os.path.basename(tmp_path))

        # Cache in session using original filename
        if result.get("success"):
            session_data["parsed_files"][file.filename or result["file_name"]] = result

        return result

    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        # Always cleanup temp file
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass


class ParsePathRequest(BaseModel):
    file_path: str

@app.post("/api/parse/path")
async def parse_file_at_path(request: ParsePathRequest):
    """Parse a file at a local path (for Electron file explorer)."""
    result = parse_file(request.file_path)
    if result.get("success"):
        session_data["parsed_files"][result.get("file_name", request.file_path)] = result
    return result


class ParseTextRequest(BaseModel):
    text: str = ""
    name: str = "manual_input"

@app.post("/api/parse/text")
async def parse_raw_text(request: ParseTextRequest):
    """Parse raw text input (for copy-paste)."""
    text = request.text
    name = request.name

    stats = {}
    if text:
        words = text.split()
        stats = {
            "characters": len(text),
            "words": len(words),
            "lines": len(text.split("\n")),
        }

    result = {
        "success": bool(text),
        "text": text,
        "file_name": name,
        "file_type": "text",
        "file_size": len(text.encode("utf-8")),
        "metadata": {},
        **stats,
    }
    session_data["parsed_files"][name] = result
    return result


@app.get("/api/parse/supported")
async def supported_file_types():
    """List all supported file types."""
    return {
        "types": {
            "pdf": {"extensions": [".pdf"], "parser": "pymupdf"},
            "docx": {"extensions": [".docx", ".doc"], "parser": "python-docx"},
            "xlsx": {"extensions": [".xlsx", ".xls"], "parser": "openpyxl"},
            "pptx": {"extensions": [".pptx", ".ppt"], "parser": "python-pptx"},
            "csv": {"extensions": [".csv", ".tsv"], "parser": "csv"},
            "text": {"extensions": [".txt"], "parser": "native"},
            "markdown": {"extensions": [".md"], "parser": "native"},
            "html": {"extensions": [".html", ".htm"], "parser": "beautifulsoup"},
            "json": {"extensions": [".json", ".jsonl"], "parser": "json"},
            "xml": {"extensions": [".xml", ".svg"], "parser": "xml"},
            "image": {"extensions": [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff", ".webp"], "parser": "pytesseract"},
            "audio": {"extensions": [".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a", ".wma", ".opus"], "parser": "binary"},
            "video": {"extensions": [".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", ".webm", ".m4v", ".mpg", ".mpeg"], "parser": "binary"},
            "zip": {"extensions": [".zip"], "parser": "zipfile"},
        }
    }


# ═══════════════════════════════════════════════════════════════════
#  STREAMING UPLOAD (async, non-blocking for large files)
# ═══════════════════════════════════════════════════════════════════

def _process_upload_background(job_id: str):
    """Background task: parse file, generate embeddings, store vectors.
    Runs in a thread so the upload endpoint returns immediately.
    """
    import gc
    job = job_manager.get_job(job_id)
    if not job:
        return

    try:
        tmp_path = job.tmp_path
        if not tmp_path or not os.path.exists(tmp_path):
            job_manager.fail_job(job_id, "Uploaded file not found on disk")
            return

        job_manager.update_stage(job_id, "parsing")

        # Parse the file - pass original filename so parse_result has the real name, not temp path
        import gc as gc_module
        original_name = job.file_name  # The user's original filename, NOT the temp path
        parse_result = parse_file(tmp_path, original_filename=original_name)

        if not parse_result.get("success"):
            job_manager.fail_job(job_id, parse_result.get("error", "Parse failed"))
            return

        text = parse_result.get("text", "")
        metadata = parse_result.get("metadata", {})

        # Determine category and appropriate processing
        file_type = parse_result.get("file_type", "unknown")
        category = job.category

        # For text-based files: chunk, embed, store
        if category == "text" and text and len(text) > 10:
            job_manager.update_stage(job_id, "generating_embeddings")

            # Chunk the text
            chunk_result = chunk_text(text, method="recursive", chunk_size=500, overlap=50)
            chunks = chunk_result.get("chunks", [])

            if chunks:
                chunk_texts = [c["text"] for c in chunks]

                # Generate embeddings
                embed_result = generate_embeddings(chunk_texts, "all-MiniLM-L6-v2")

                if embed_result.success and embed_result.embeddings:
                    job_manager.update_stage(job_id, "saving_results")

                    # Store in vector DB
                    ids = [c["id"] for c in chunks]
                    meta_list = [c.get("metadata", {}) for c in chunks]
                    store = vector_manager.get_store("faiss_flat", "default", embed_result.dimensions)
                    store.add(ids, embed_result.embeddings, meta_list, texts=chunk_texts)

                    metadata["vector_count"] = store.count()
                    metadata["chunk_count"] = len(chunks)

        # Cache in session
        file_name = parse_result.get("file_name", job.file_name)
        session_data["parsed_files"][file_name] = parse_result

        # Mark job as completed
        job_manager.complete_job(job_id, {
            "success": True,
            "text": text,
            "file_name": file_name,
            "file_type": parse_result.get("file_type", category),
            "file_size": parse_result.get("file_size", job.file_size),
            "characters": parse_result.get("characters", len(text)),
            "words": parse_result.get("words", 0),
            "pages": parse_result.get("pages"),
            "language": parse_result.get("language"),
            "metadata": metadata,
        })

    except Exception as e:
        job_manager.fail_job(job_id, str(e))
    finally:
        # Clean up temp file
        job = job_manager.get_job(job_id)
        if job and job.tmp_path and os.path.exists(job.tmp_path):
            try:
                os.unlink(job.tmp_path)
                job.tmp_path = None
            except Exception:
                pass
        gc.collect()


@app.post("/api/upload/stream")
async def streaming_upload(request: Request, background_tasks: BackgroundTasks,
    filename: str = Query("", alias="filename"),
    category: str = Query("text", alias="category")):
    """Stream a file upload in chunks, return job ID immediately.
    The file is saved to disk incrementally and processed in the background.
    """
    if not filename:
        filename = f"upload_{int(time.time())}"

    # Determine file extension and category
    suffix = os.path.splitext(filename)[1].lower()
    if not category or category not in ("text", "audio", "video"):
        # Auto-detect from extension
        ext_map = {
            ".mp3": "audio", ".wav": "audio", ".ogg": "audio", ".flac": "audio",
            ".aac": "audio", ".m4a": "audio", ".wma": "audio", ".opus": "audio",
            ".mp4": "video", ".avi": "video", ".mkv": "video", ".mov": "video",
            ".wmv": "video", ".flv": "video", ".webm": "video", ".m4v": "video",
            ".mpg": "video", ".mpeg": "video",
        }
        category = ext_map.get(suffix, "text")

    # Create job
    job = job_manager.create_job(filename, 0, category)
    job_manager.update_stage(job.job_id, "saving")

    # Save stream to temp file in chunks (never load entire file into RAM)
    tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix, prefix="rag_stream_")
    tmp_path = tmp_file.name
    total_bytes = 0

    try:
        # Stream the request body in chunks
        async for chunk in request.stream():
            tmp_file.write(chunk)
            total_bytes += len(chunk)

            # Update file size and progress periodically
            if total_bytes % (STREAM_CHUNK_SIZE * 4) == 0:
                job.file_size = total_bytes
                upload_progress = min(90, (total_bytes / max(total_bytes, 1)) * 100)
                job_manager.update_progress(job.job_id, upload_progress)

        tmp_file.close()
        job.file_size = total_bytes

        # Verify file size limit
        if total_bytes > MAX_UPLOAD_SIZE:
            os.unlink(tmp_path)
            job_manager.fail_job(job.job_id,
                f"File too large: {total_bytes} bytes exceeds limit of {MAX_UPLOAD_SIZE} bytes")
            return {
                "job_id": job.job_id,
                "status": "failed",
                "error": f"File exceeds maximum upload size of {MAX_UPLOAD_SIZE // (1024*1024)}MB"
            }

        # Store temp path and schedule background processing
        job.tmp_path = tmp_path
        background_tasks.add_task(_process_upload_background, job.job_id)

        # Return immediately with the job ID
        return {
            "job_id": job.job_id,
            "file_name": filename,
            "file_size": total_bytes,
            "category": category,
            "status": "running",
            "message": "Upload complete. Processing in background.",
        }

    except Exception as e:
        tmp_file.close()
        if os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
        job_manager.fail_job(job.job_id, str(e))
        return {
            "job_id": job.job_id,
            "status": "failed",
            "error": str(e),
        }


# ═══════════════════════════════════════════════════════════════════
#  JOB STATUS (for async upload polling)
# ═══════════════════════════════════════════════════════════════════

@app.get("/api/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Get the status of an async upload processing job."""
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    return job.to_dict()


@app.get("/api/jobs")
async def list_jobs(limit: int = Query(50, ge=1, le=200)):
    """List recent upload processing jobs."""
    job_manager.cleanup_old_jobs()
    return {"jobs": job_manager.list_jobs(limit=limit)}


# ═══════════════════════════════════════════════════════════════════
#  CHUNKING
# ═══════════════════════════════════════════════════════════════════

@app.post("/api/chunk")
async def chunk_document(request: ChunkingRequest):
    """Split text into chunks using various strategies."""
    start = time.time()

    result = chunk_text(
        text=request.text,
        method=request.method.value,
        chunk_size=request.chunk_size,
        overlap=request.overlap,
    )

    elapsed = (time.time() - start) * 1000
    result["processing_time_ms"] = round(elapsed, 2)

    # Cache chunks
    if result.get("success"):
        cache_key = f"{request.method.value}_{request.chunk_size}_{request.overlap}"
        session_data["chunks"][cache_key] = result

    return result


@app.get("/api/chunk/methods")
async def chunking_methods():
    """List all available chunking methods."""
    return {
        "methods": [
            {"id": "recursive", "name": "Recursive Character", "description": "Splits text recursively by separators (\\n\\n, \\n, ., space)"},
            {"id": "sentence", "name": "Sentence", "description": "Groups sentences into chunks of target size"},
            {"id": "markdown", "name": "Markdown", "description": "Splits on markdown headers, respecting document structure"},
            {"id": "token", "name": "Token", "description": "Splits by approximate token count using tiktoken"},
            {"id": "semantic", "name": "Semantic", "description": "Splits on semantic boundaries and topic shifts"},
            {"id": "sliding_window", "name": "Sliding Window", "description": "Fixed-size window with character-level overlap"},
            {"id": "parent_child", "name": "Parent-Child", "description": "Hierarchical chunks: large parents with small children for retrieval"},
        ]
    }


# ═══════════════════════════════════════════════════════════════════
#  EMBEDDINGS
# ═══════════════════════════════════════════════════════════════════

class EmbedRequest(BaseModel):
    texts: List[str]
    model: str = "all-MiniLM-L6-v2"

@app.post("/api/embed")
async def create_embeddings(request: EmbedRequest):
    """Generate embeddings for texts."""
    if not request.texts:
        return {"success": False, "error": "No texts provided"}

    result = generate_embeddings(request.texts, request.model)

    # Cache embeddings
    if result.success:
        session_data["embeddings"][request.model] = {
            "embeddings": result.embeddings,
            "dimensions": result.dimensions,
            "count": result.count,
        }

    return {
        "success": result.success,
        "embeddings": result.embeddings,
        "dimensions": result.dimensions,
        "count": result.count,
        "model": result.model,
        "download_time_ms": result.download_time_ms,
        "inference_time_ms": result.inference_time_ms,
        "error": result.error,
    }


@app.get("/api/embed/models")
async def embedding_models():
    """List available embedding models."""
    return {"models": get_all_models()}


@app.get("/api/embed/model/{model_name}")
async def embedding_model_info(model_name: str):
    """Get info about a specific embedding model."""
    info = get_model_info(model_name)
    if not info:
        raise HTTPException(status_code=404, detail=f"Model {model_name} not found")
    return info


# ═══════════════════════════════════════════════════════════════════
#  VECTOR STORE
# ═══════════════════════════════════════════════════════════════════

class VectorAddRequest(BaseModel):
    ids: List[str]
    embeddings: List[List[float]]
    texts: List[str] = []
    metadata: List[Dict[str, Any]] = []
    collection: str = "default"
    store_type: str = "faiss_flat"
    dimensions: int = 384

@app.post("/api/vectors/add")
async def add_vectors(request: VectorAddRequest):
    """Add vectors to the store."""
    if not request.embeddings:
        return {"success": False, "error": "No embeddings provided"}

    store = vector_manager.get_store(request.store_type, request.collection, request.dimensions)
    store.add(ids=request.ids, vectors=request.embeddings, metadata=request.metadata, texts=request.texts)

    return {
        "success": True,
        "total_vectors": store.count(),
        "collection": request.collection,
        "store_type": request.store_type,
    }


class VectorSearchRequest(BaseModel):
    query_embedding: List[float]
    collection: str = "default"
    store_type: str = "faiss_flat"
    top_k: int = 5

@app.post("/api/vectors/search")
async def search_vectors(request: VectorSearchRequest):
    """Search for similar vectors."""
    if not request.query_embedding:
        return {"success": False, "error": "No query embedding provided"}

    store = vector_manager.get_store(request.store_type, request.collection)
    results = store.search(request.query_embedding, request.top_k)

    return {
        "success": True,
        "results": results,
        "total_vectors": store.count(),
        "collection": request.collection,
    }


@app.get("/api/vectors/stats/{collection}")
async def vector_stats(collection: str, store_type: str = "faiss_flat"):
    """Get vector store statistics."""
    store = vector_manager.get_store(store_type, collection)
    return store.stats()


@app.delete("/api/vectors/{collection}")
async def delete_collection_vectors(collection: str, store_type: str = "faiss_flat"):
    """Delete a vector collection."""
    vector_manager.delete_store(store_type, collection)
    return {"success": True, "deleted": collection}


@app.get("/api/vectors/list")
async def list_vector_stores():
    """List all active vector stores."""
    return {"stores": vector_manager.list_stores()}


# ═══════════════════════════════════════════════════════════════════
#  RETRIEVAL
# ═══════════════════════════════════════════════════════════════════

class RetrieveRequest(BaseModel):
    query: str
    top_k: int = 5
    collection: str = "default"
    store_type: str = "faiss_flat"
    use_reranker: bool = True
    embedding_model: str = "all-MiniLM-L6-v2"

@app.post("/api/retrieve")
async def retrieve(request: RetrieveRequest):
    """Full retrieval pipeline: query → embed → search → rerank."""
    start = time.time()
    query = request.query
    top_k = request.top_k
    collection = request.collection
    store_type = request.store_type
    use_reranker = request.use_reranker
    embedding_model = request.embedding_model

    if not query:
        return {"success": False, "error": "No query provided"}

    # Step 1: Generate query embedding
    embed_start = time.time()
    embed_result = generate_query_embedding(query, embedding_model)
    if not embed_result.success:
        return {"success": False, "error": f"Embedding failed: {embed_result.error}"}
    embed_time = (time.time() - embed_start) * 1000

    # Step 2: Search
    search_start = time.time()
    store = vector_manager.get_store(store_type, collection)
    raw_results = store.search(embed_result.embeddings[0], top_k * 2 if use_reranker else top_k)
    search_time = (time.time() - search_start) * 1000

    # Step 3: Rerank
    rerank_start = time.time()
    if use_reranker and raw_results:
        results = rerank_results(query, raw_results, method="keyword_overlap")
        results = results[:top_k]
    else:
        results = raw_results[:top_k]
    rerank_time = (time.time() - rerank_start) * 1000

    total_time = (time.time() - start) * 1000

    return {
        "success": True,
        "results": results,
        "query": query,
        "top_k": top_k,
        "total_vectors": store.count(),
        "timing": {
            "embed_ms": round(embed_time, 2),
            "search_ms": round(search_time, 2),
            "rerank_ms": round(rerank_time, 2),
            "total_ms": round(total_time, 2),
        },
    }


# ═══════════════════════════════════════════════════════════════════
#  LLM GENERATION
# ═══════════════════════════════════════════════════════════════════

class GenerateRequest(BaseModel):
    query: str
    context: List[str] = []
    provider: str = "ollama"
    model: str = "llama3.2"
    system_prompt: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 1024
    api_key: Optional[str] = None

@app.post("/api/generate")
async def generate(request: GenerateRequest):
    """Generate a response using LLM with RAG context."""
    if not request.query:
        return {"success": False, "error": "No query provided"}

    # Use request body API key first (user-entered), fall back to env var
    api_key = request.api_key or os.environ.get("OPENAI_API_KEY", "")

    result = llm_generator.generate(
        query=request.query,
        context=request.context,
        provider=request.provider,
        model=request.model,
        system_prompt=request.system_prompt,
        temperature=request.temperature,
        max_tokens=request.max_tokens,
        api_key=api_key,
    )

    return result


@app.get("/api/llm/ollama/status")
async def ollama_status():
    """Check if Ollama is running and list models."""
    return llm_generator.check_ollama()


@app.get("/api/llm/ollama/models")
async def ollama_models():
    """List available Ollama models."""
    status = llm_generator.check_ollama()
    return {
        "available": status["available"],
        "models": status["models"],
    }


@app.get("/api/llm/free-providers")
async def free_providers():
    """List free cloud LLM providers and their status."""
    return llm_generator.get_free_providers()


# ═══════════════════════════════════════════════════════════════════
#  FULL RAG PIPELINE
# ═══════════════════════════════════════════════════════════════════

class PipelineRunRequestModel(BaseModel):
    file_path: str = ""
    chunking_method: str = "recursive"
    chunk_size: int = 500
    overlap: int = 50
    embedding_model: str = "all-MiniLM-L6-v2"
    vector_store: str = "faiss_flat"
    collection_name: str = "default"
    llm_provider: str = "ollama"
    llm_model: str = "llama3.2"
    query: str = ""
    api_key: Optional[str] = None
    top_k: int = 5

@app.post("/api/pipeline/run")
async def run_full_pipeline(request: PipelineRunRequestModel):
    """Run the complete RAG pipeline: parse → chunk → embed → store → retrieve → generate."""
    run_id = pipeline_tracker.create_run()
    analytics = {}

    try:
        # Step 1: Parse
        pipeline_tracker.start_step(run_id, "parse", "Starting file parsing...")
        file_path = request.file_path
        parse_result = parse_file(file_path)
        if not parse_result.get("success"):
            pipeline_tracker.fail_step(run_id, "parse", parse_result.get("error", "Parse failed"))
            return {"success": False, "run_id": run_id, "error": parse_result.get("error")}

        text = parse_result.get("text", "")
        analytics["parse_time_ms"] = 0
        analytics["file_pages"] = parse_result.get("pages", 0)
        analytics["file_words"] = parse_result.get("words", 0)
        analytics["file_characters"] = parse_result.get("characters", 0)
        pipeline_tracker.complete_step(run_id, "parse", text[:500], len(text), {
            "file_type": parse_result.get("file_type"),
            "pages": parse_result.get("pages"),
            "words": parse_result.get("words"),
        })

        # Step 2: Chunk
        pipeline_tracker.start_step(run_id, "chunk", f"Chunking {len(text)} characters...")
        chunk_start = time.time()
        chunk_result = chunk_text(
            text=text,
            method=request.chunking_method,
            chunk_size=request.chunk_size,
            overlap=request.overlap,
        )
        analytics["chunk_time_ms"] = round((time.time() - chunk_start) * 1000, 2)
        if not chunk_result.get("success"):
            pipeline_tracker.fail_step(run_id, "chunk", chunk_result.get("error"))
            return {"success": False, "run_id": run_id, "error": chunk_result.get("error")}

        chunks = chunk_result.get("chunks", [])
        chunk_texts = [c["text"] for c in chunks]
        pipeline_tracker.complete_step(run_id, "chunk", chunk_texts[0][:200] if chunk_texts else "", len(chunks), {
            "method": request.chunking_method,
            "chunk_size": request.chunk_size,
            "count": len(chunks),
        })

        # Step 3: Embed
        pipeline_tracker.start_step(run_id, "embed", f"Embedding {len(chunks)} chunks...")
        embed_start = time.time()
        embedding_model = request.embedding_model
        embed_result = generate_embeddings(chunk_texts, embedding_model)
        analytics["embed_time_ms"] = round((time.time() - embed_start) * 1000, 2)
        analytics["embedding_model"] = embedding_model
        if not embed_result.success:
            pipeline_tracker.fail_step(run_id, "embed", embed_result.error)
            return {"success": False, "run_id": run_id, "error": embed_result.error}

        pipeline_tracker.complete_step(run_id, "embed", f"Generated {embed_result.count} embeddings ({embed_result.dimensions}d)", embed_result.count, {
            "model": embedding_model,
            "dimensions": embed_result.dimensions,
        })

        # Step 4: Store
        pipeline_tracker.start_step(run_id, "store", "Storing vectors...")
        store_start = time.time()
        store_type = request.vector_store
        collection = request.collection_name
        ids = [c["id"] for c in chunks]
        metadata = [c.get("metadata", {}) for c in chunks]

        store = vector_manager.get_store(store_type, collection, embed_result.dimensions)
        store.add(ids, embed_result.embeddings, metadata, texts=chunk_texts)
        analytics["store_time_ms"] = round((time.time() - store_start) * 1000, 2)
        analytics["vector_store_type"] = store_type
        analytics["vectors_stored"] = store.count()
        pipeline_tracker.complete_step(run_id, "store", f"Stored {store.count()} vectors in {store_type}", store.count(), {
            "store_type": store_type,
            "collection": collection,
        })

        # Step 5: Retrieve (if query provided)
        query = request.query
        retrieval_results = []
        if query:
            pipeline_tracker.start_step(run_id, "retrieve", f"Searching for: {query[:100]}...")
            retrieve_start = time.time()

            # Embed query
            query_embed = generate_query_embedding(query, embedding_model)
            if query_embed.success:
                raw_results = store.search(query_embed.embeddings[0], request.top_k)
                retrieval_results = rerank_results(query, raw_results, method="keyword_overlap")

            analytics["retrieve_time_ms"] = round((time.time() - retrieve_start) * 1000, 2)
            pipeline_tracker.complete_step(run_id, "retrieve", f"Found {len(retrieval_results)} results", len(retrieval_results), {
                "top_k": request.top_k,
            })

            # Step 6: Build Prompt
            pipeline_tracker.start_step(run_id, "prompt", "Building RAG prompt...")
            context_chunks = [r.get("text", "") for r in retrieval_results]
            pipeline_tracker.complete_step(run_id, "prompt", f"Built prompt with {len(context_chunks)} context chunks", len(context_chunks), {
                "context_length": sum(len(c) for c in context_chunks),
            })

            # Step 7: Generate
            pipeline_tracker.start_step(run_id, "generate", "Generating answer...")
            gen_start = time.time()
            gen_result = llm_generator.generate(
                query=query,
                context=context_chunks,
                provider=request.llm_provider,
                model=request.llm_model,
                api_key=request.api_key or os.environ.get("OPENAI_API_KEY", ""),
            )
            analytics["generation_time_ms"] = round((time.time() - gen_start) * 1000, 2)
            analytics["total_tokens"] = gen_result.get("total_tokens", 0)
            analytics["llm_model"] = request.llm_model
            analytics["llm_provider"] = request.llm_provider

            if gen_result.get("success"):
                pipeline_tracker.complete_step(run_id, "generate", gen_result.get("answer", "")[:500], 1, {
                    "model": gen_result.get("model"),
                    "tokens": gen_result.get("total_tokens"),
                })
            else:
                pipeline_tracker.fail_step(run_id, "generate", gen_result.get("error", "Generation failed"))
        else:
            # Mark retrieve, prompt, generate as skipped
            for step_id in ["retrieve", "prompt", "generate"]:
                pipeline_tracker.start_step(run_id, step_id, "Skipped (no query)")
                pipeline_tracker.complete_step(run_id, step_id, "Skipped", 0)

        # Complete run
        pipeline_tracker.complete_run(run_id, analytics)

        return {
            "success": True,
            "run_id": run_id,
            "pipeline": pipeline_tracker.get_run(run_id),
            "result": {
                "chunks": len(chunks),
                "embeddings": embed_result.count,
                "vectors": store.count(),
                "results": retrieval_results,
                "answer": gen_result.get("answer", "") if query else "",
            },
        }

    except Exception as e:
        pipeline_tracker.fail_step(run_id, "parse", str(e))
        return {"success": False, "run_id": run_id, "error": str(e)}


# ═══════════════════════════════════════════════════════════════════
#  PIPELINE DEBUGGER
# ═══════════════════════════════════════════════════════════════════

@app.get("/api/pipeline/steps")
async def pipeline_steps():
    """Get all pipeline step definitions."""
    return {"steps": PIPELINE_STEP_DEFINITIONS}


@app.get("/api/pipeline/runs")
async def pipeline_runs():
    """List all pipeline runs."""
    return {"runs": pipeline_tracker.list_runs()}


@app.get("/api/pipeline/run/{run_id}")
async def pipeline_run_detail(run_id: str):
    """Get detailed pipeline run info."""
    run = pipeline_tracker.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@app.get("/api/pipeline/run/{run_id}/step/{step_id}")
async def pipeline_step_detail(run_id: str, step_id: str):
    """Get detailed data for a specific pipeline step."""
    data = pipeline_tracker.get_step_data(run_id, step_id)
    if not data:
        raise HTTPException(status_code=404, detail="Step not found")
    return data


# ═══════════════════════════════════════════════════════════════════
#  WEB SCRAPING (fetch & parse URL content in real-time)
# ═══════════════════════════════════════════════════════════════════

class WebScrapeRequest(BaseModel):
    url: str
    extract_metadata: bool = True

@app.post("/api/scrape")
async def scrape_url(request: WebScrapeRequest):
    """Fetch and parse content from a URL for real-time RAG."""
    import httpx
    from bs4 import BeautifulSoup
    
    url = request.url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            resp = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (compatible; RAGStudioPro/2.0)"
            })
            resp.raise_for_status()
            
        content_type = resp.headers.get("content-type", "").lower()
        html = resp.text
        
        soup = BeautifulSoup(html, "html.parser")
        
        # Remove script, style, nav, footer elements
        for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
            tag.decompose()
            
        title = soup.title.string.strip() if soup.title and soup.title.string else url
        
        # Extract main content
        main = soup.find("main") or soup.find("article") or soup.find("body") or soup
        text = main.get_text(separator="\n", strip=True)
        
        # Clean up whitespace
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        clean_text = "\n".join(lines)
        
        metadata = {}
        if request.extract_metadata:
            # Extract metadata
            meta_desc = soup.find("meta", attrs={"name": "description"})
            if meta_desc and meta_desc.get("content"):
                metadata["description"] = meta_desc["content"]
                
            meta_kw = soup.find("meta", attrs={"name": "keywords"})
            if meta_kw and meta_kw.get("content"):
                metadata["keywords"] = meta_kw["content"]
                
            og_image = soup.find("meta", property="og:image")
            if og_image and og_image.get("content"):
                metadata["og_image"] = og_image["content"]
                
            # Get all headings for structure
            headings = []
            for h in soup.find_all(["h1", "h2", "h3"]):
                h_text = h.get_text(strip=True)
                if h_text:
                    headings.append({"level": h.name, "text": h_text})
            metadata["headings"] = headings
            
        words = clean_text.split()
        
        return {
            "success": True,
            "url": url,
            "title": title,
            "text": clean_text,
            "characters": len(clean_text),
            "words": len(words),
            "content_type": content_type,
            "metadata": metadata,
            "file_name": title[:50] + ".txt",
        }
        
    except httpx.TimeoutException:
        return {"success": False, "error": f"Request timed out for {url}"}
    except httpx.HTTPStatusError as e:
        return {"success": False, "error": f"HTTP {e.response.status_code} for {url}"}
    except Exception as e:
        return {"success": False, "error": f"Failed to scrape {url}: {str(e)}"}


@app.get("/api/scrape/test")
async def test_scrape():
    """Quick connectivity test."""
    import httpx
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get("https://httpbin.org/get")
        return {"success": True, "status": resp.status_code, "message": "Internet connection is working"}
    except Exception as e:
        return {"success": False, "error": str(e), "message": "No internet connection or DNS resolution failed"}


# ═══════════════════════════════════════════════════════════════════
#  ANALYTICS
# ═══════════════════════════════════════════════════════════════════

@app.get("/api/analytics/system")
async def analytics_system():
    """Get system performance analytics."""
    return get_system_analytics()


@app.get("/api/analytics/session")
async def analytics_session():
    """Get current session analytics."""
    return {
        "parsed_files": len(session_data["parsed_files"]),
        "cached_chunks": len(session_data["chunks"]),
        "cached_embeddings": len(session_data["embeddings"]),
        "active_stores": len(vector_manager.list_stores()),
    }


# ═══════════════════════════════════════════════════════════════════
#  PROJECTS
# ═══════════════════════════════════════════════════════════════════

@app.get("/api/projects")
async def get_projects():
    """List all projects."""
    return {"projects": list_projects()}


@app.post("/api/projects")
async def create_new_project(request: dict):
    """Create a new project."""
    name = request.get("name", "")
    description = request.get("description", "")
    if not name:
        raise HTTPException(status_code=400, detail="Project name required")
    return create_project(name, description)


@app.get("/api/projects/{name}")
async def get_project(name: str):
    """Load a project."""
    result = load_project(name)
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error"))
    return result


@app.put("/api/projects/{name}")
async def update_project(name: str, request: dict):
    """Save project configuration."""
    return save_project(name, config=request.get("config"), files_data=request.get("files_data"))


@app.delete("/api/projects/{name}")
async def remove_project(name: str):
    """Delete a project."""
    return delete_project(name)


@app.post("/api/projects/{name}/export")
async def export_project_archive(name: str):
    """Export a project as a zip file."""
    import tempfile
    export_dir = tempfile.mkdtemp()
    return export_project(name, os.path.join(export_dir, name))


# ═══════════════════════════════════════════════════════════════════
#  ENTRY POINT
# ═══════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
