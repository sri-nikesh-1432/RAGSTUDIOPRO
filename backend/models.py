"""
RAG Studio Pro - Data Models
All Pydantic models for the backend API.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime


# ─── Enums ─────────────────────────────────────────────────────────

class ChunkingMethod(str, Enum):
    RECURSIVE = "recursive"
    SENTENCE = "sentence"
    MARKDOWN = "markdown"
    TOKEN = "token"
    SEMANTIC = "semantic"
    SLIDING_WINDOW = "sliding_window"
    PARENT_CHILD = "parent_child"


class EmbeddingModel(str, Enum):
    MINILM = "all-MiniLM-L6-v2"
    BGE = "BAAI/bge-small-en-v1.5"
    E5 = "intfloat/e5-small-v2"
    MPNET = "all-mpnet-base-v2"
    INSTRUCTOR = "hkunlp/instructor-small"


class VectorStoreType(str, Enum):
    FAISS_FLAT = "faiss_flat"
    FAISS_HNSW = "faiss_hnsw"
    FAISS_IVF = "faiss_ivf"
    CHROMADB = "chromadb"


class LLMProvider(str, Enum):
    OLLAMA = "ollama"
    OPENAI = "openai"


class PipelineStepStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


# ─── File Parsing ──────────────────────────────────────────────────

class FileParseRequest(BaseModel):
    file_path: str
    extract_metadata: bool = True


class FileParseResult(BaseModel):
    success: bool
    file_name: str
    file_type: str
    file_size: int = 0
    text: str = ""
    metadata: Dict[str, Any] = {}
    pages: int = 0
    words: int = 0
    characters: int = 0
    language: str = "unknown"
    error: Optional[str] = None


class FileUploadResult(BaseModel):
    success: bool
    file_path: str
    file_name: str
    file_type: str
    file_size: int
    text_preview: str = ""
    metadata: Dict[str, Any] = {}


# ─── Chunking ──────────────────────────────────────────────────────

class ChunkingRequest(BaseModel):
    text: str
    method: ChunkingMethod = ChunkingMethod.RECURSIVE
    chunk_size: int = Field(default=500, ge=50, le=5000)
    overlap: int = Field(default=50, ge=0, le=500)
    # Parent-child specific
    parent_chunk_size: int = Field(default=2000, ge=500, le=10000)
    child_chunk_size: int = Field(default=200, ge=50, le=1000)


class Chunk(BaseModel):
    id: str
    text: str
    index: int
    start_char: int = 0
    end_char: int = 0
    metadata: Dict[str, Any] = {}
    parent_id: Optional[str] = None  # For parent-child chunking


class ChunkingResult(BaseModel):
    success: bool
    chunks: List[Chunk]
    count: int
    method: str
    chunk_size: int
    overlap: int
    total_chars: int
    avg_chunk_size: float = 0
    error: Optional[str] = None


# ─── Embeddings ────────────────────────────────────────────────────

class EmbeddingRequest(BaseModel):
    texts: List[str]
    model: EmbeddingModel = EmbeddingModel.MINILM


class EmbeddingResult(BaseModel):
    success: bool
    embeddings: List[List[float]]
    dimensions: int
    count: int
    model: str
    download_time_ms: float = 0
    inference_time_ms: float = 0
    error: Optional[str] = None


class EmbeddingModelInfo(BaseModel):
    name: str
    display_name: str
    dimensions: int
    description: str
    downloaded: bool = False
    size_mb: float = 0


# ─── Vector Store ──────────────────────────────────────────────────

class VectorStoreConfig(BaseModel):
    store_type: VectorStoreType = VectorStoreType.FAISS_FLAT
    collection_name: str = "default"
    persist_directory: Optional[str] = None


class VectorEntry(BaseModel):
    id: str
    chunk_id: str
    embedding: List[float]
    metadata: Dict[str, Any] = {}
    text: str = ""


class VectorStoreStats(BaseModel):
    total_vectors: int
    dimensions: int
    store_type: str
    collection_name: str
    index_type: str = ""
    memory_usage_mb: float = 0


class VectorSearchResult(BaseModel):
    id: str
    chunk_id: str
    text: str
    score: float
    rank: int
    metadata: Dict[str, Any] = {}


# ─── Retrieval ─────────────────────────────────────────────────────

class RetrievalRequest(BaseModel):
    query: str
    top_k: int = Field(default=5, ge=1, le=100)
    collection: str = "default"
    use_reranker: bool = True
    min_score: float = Field(default=0.0, ge=0.0, le=1.0)
    store_type: VectorStoreType = VectorStoreType.FAISS_FLAT


class RetrievalResult(BaseModel):
    success: bool
    results: List[VectorSearchResult]
    query: str
    query_embedding_time_ms: float = 0
    search_time_ms: float = 0
    rerank_time_ms: float = 0
    total_time_ms: float = 0
    total_vectors_searched: int = 0
    error: Optional[str] = None


# ─── LLM Generation ───────────────────────────────────────────────

class GenerationRequest(BaseModel):
    query: str
    context: List[str] = []
    provider: LLMProvider = LLMProvider.OLLAMA
    model: str = "llama3.2"
    system_prompt: Optional[str] = None
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=1024, ge=1, le=4096)
    api_key: Optional[str] = None  # For OpenAI
    base_url: Optional[str] = None  # For custom Ollama URL


class GenerationResult(BaseModel):
    success: bool
    answer: str
    model: str
    provider: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    prompt_build_time_ms: float = 0
    generation_time_ms: float = 0
    total_time_ms: float = 0
    system_prompt_used: str = ""
    full_prompt: str = ""
    error: Optional[str] = None


# ─── Pipeline Debug ────────────────────────────────────────────────

class PipelineStep(BaseModel):
    step_id: str
    name: str
    status: PipelineStepStatus = PipelineStepStatus.PENDING
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_ms: float = 0
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = {}


class PipelineRun(BaseModel):
    run_id: str
    steps: List[PipelineStep]
    status: str = "running"
    started_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    total_duration_ms: float = 0
    analytics: Dict[str, Any] = {}


class PipelineRunRequest(BaseModel):
    file_path: str
    chunking_method: ChunkingMethod = ChunkingMethod.RECURSIVE
    chunk_size: int = 500
    overlap: int = 50
    embedding_model: EmbeddingModel = EmbeddingModel.MINILM
    vector_store: VectorStoreType = VectorStoreType.FAISS_FLAT
    collection_name: str = "default"
    llm_provider: LLMProvider = LLMProvider.OLLAMA
    llm_model: str = "llama3.2"
    query: str = ""
    api_key: Optional[str] = None


# ─── Analytics ─────────────────────────────────────────────────────

class PipelineAnalytics(BaseModel):
    # Timing
    parse_time_ms: float = 0
    chunk_time_ms: float = 0
    embed_time_ms: float = 0
    store_time_ms: float = 0
    retrieve_time_ms: float = 0
    generation_time_ms: float = 0
    total_time_ms: float = 0

    # Counts
    file_pages: int = 0
    file_words: int = 0
    file_characters: int = 0
    chunk_count: int = 0
    embedding_count: int = 0
    embedding_dimensions: int = 0
    vectors_stored: int = 0
    retrieval_results: int = 0

    # Token usage
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

    # System
    memory_usage_mb: float = 0
    embedding_model: str = ""
    chunking_method: str = ""
    vector_store_type: str = ""
    llm_model: str = ""
    llm_provider: str = ""


# ─── Project System ────────────────────────────────────────────────

class ProjectConfig(BaseModel):
    name: str
    description: str = ""
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    chunking_method: ChunkingMethod = ChunkingMethod.RECURSIVE
    chunk_size: int = 500
    overlap: int = 50
    embedding_model: EmbeddingModel = EmbeddingModel.MINILM
    vector_store: VectorStoreType = VectorStoreType.FAISS_FLAT
    collection_name: str = "default"
    llm_provider: LLMProvider = LLMProvider.OLLAMA
    llm_model: str = "llama3.2"
    files: List[str] = []


class ProjectInfo(BaseModel):
    name: str
    path: str
    description: str = ""
    created_at: str = ""
    updated_at: str = ""
    file_count: int = 0
    chunk_count: int = 0
    vector_count: int = 0


class ProjectSaveRequest(BaseModel):
    name: str
    description: str = ""
    config: Optional[ProjectConfig] = None
    files_data: Optional[Dict[str, Any]] = None


# ─── System ────────────────────────────────────────────────────────

class SystemInfo(BaseModel):
    platform: str
    python_version: str
    torch_available: bool = False
    cuda_available: bool = False
    gpu_name: Optional[str] = None
    total_memory_mb: float = 0
    cpu_count: int = 0
    installed_packages: Dict[str, str] = {}
    ollama_available: bool = False
    ollama_models: List[str] = []


class OllamaModel(BaseModel):
    name: str
    size: str = ""
    modified: str = ""


class OllamaStatus(BaseModel):
    available: bool
    url: str = "http://localhost:11434"
    models: List[OllamaModel] = []
    error: Optional[str] = None
