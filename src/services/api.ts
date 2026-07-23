/**
 * RAG Studio Pro - API Service
 * Connects the React frontend to the FastAPI backend.
 */

const API_BASE = 'http://localhost:8000/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || err.error || `API error ${res.status}`);
  }
  return res.json();
}

// ─── Health ────────────────────────────────────────────────────────

export const healthAPI = {
  check: () => apiFetch<{ status: string; version: string }>('/health'),
  system: () => apiFetch<Record<string, any>>('/system'),
  packages: () => apiFetch<Record<string, boolean>>('/packages'),
};

// ─── File Parsing ──────────────────────────────────────────────────

export interface ParseResult {
  success: boolean;
  text: string;
  file_name: string;
  file_type: string;
  file_size: number;
  characters?: number;
  words?: number;
  pages?: number;
  language?: string;
  metadata?: Record<string, any>;
  error?: string;
}

export const parseAPI = {
  uploadFile: async (file: File, signal?: AbortSignal): Promise<ParseResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/parse/upload`, {
      method: 'POST',
      body: formData,
      signal,
    });
    return res.json();
  },
  parsePath: (filePath: string) =>
    apiFetch<ParseResult>('/parse/path', {
      method: 'POST',
      body: JSON.stringify({ file_path: filePath }),
    }),
  parseText: (text: string, name?: string) =>
    apiFetch<ParseResult>('/parse/text', {
      method: 'POST',
      body: JSON.stringify({ text, name: name || 'manual_input' }),
    }),
  supportedTypes: () => apiFetch<{ types: Record<string, any> }>('/parse/supported'),
};

// ─── Chunking ──────────────────────────────────────────────────────

export interface Chunk {
  id: string;
  text: string;
  index: number;
  start_char: number;
  end_char: number;
  char_count: number;
  word_count: number;
  metadata: Record<string, any>;
}

export interface ChunkingResult {
  success: boolean;
  chunks: Chunk[];
  count: number;
  method: string;
  chunk_size: number;
  overlap: number;
  total_chars: number;
  avg_chunk_size: number;
  processing_time_ms?: number;
  error?: string;
}

export const chunkAPI = {
  chunk: (params: {
    text: string;
    method?: string;
    chunk_size?: number;
    overlap?: number;
  }) =>
    apiFetch<ChunkingResult>('/chunk', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  methods: () => apiFetch<{ methods: Array<{ id: string; name: string; description: string }> }>('/chunk/methods'),
};

// ─── Embeddings ────────────────────────────────────────────────────

export interface EmbeddingModelInfo {
  name: string;
  display_name: string;
  dimensions: number;
  description: string;
  downloaded: boolean;
  size_mb: number;
  speed?: string;
  quality?: string;
}

export interface EmbeddingResult {
  success: boolean;
  embeddings: number[][];
  dimensions: number;
  count: number;
  model: string;
  download_time_ms: number;
  inference_time_ms: number;
  error?: string;
}

export const embedAPI = {
  generate: (params: { texts: string[]; model?: string }) =>
    apiFetch<EmbeddingResult>('/embed', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  models: () => apiFetch<{ models: EmbeddingModelInfo[] }>('/embed/models'),
  modelInfo: (name: string) => apiFetch<EmbeddingModelInfo>(`/embed/model/${name}`),
};

// ─── Vector Store ──────────────────────────────────────────────────

export interface VectorSearchResult {
  id: string;
  score: number;
  rank: number;
  text: string;
  metadata: Record<string, any>;
}

export const vectorAPI = {
  add: (params: {
    ids: string[];
    embeddings: number[][];
    texts?: string[];
    metadata?: Record<string, any>[];
    collection?: string;
    store_type?: string;
    dimensions?: number;
  }) =>
    apiFetch<{ success: boolean; total_vectors: number }>('/vectors/add', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  search: (params: {
    query_embedding: number[];
    collection?: string;
    store_type?: string;
    top_k?: number;
  }) =>
    apiFetch<{ success: boolean; results: VectorSearchResult[] }>('/vectors/search', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  stats: (collection: string, storeType?: string) =>
    apiFetch<Record<string, any>>(`/vectors/stats/${collection}?store_type=${storeType || 'faiss_flat'}`),
  list: () => apiFetch<{ stores: any[] }>('/vectors/list'),
  delete: (collection: string, storeType?: string) =>
    apiFetch<{ success: boolean }>(`/vectors/${collection}?store_type=${storeType || 'faiss_flat'}`, { method: 'DELETE' }),
};

// ─── Retrieval ─────────────────────────────────────────────────────

export interface RetrievalResult {
  success: boolean;
  results: VectorSearchResult[];
  query: string;
  top_k: number;
  total_vectors: number;
  timing: {
    embed_ms: number;
    search_ms: number;
    rerank_ms: number;
    total_ms: number;
  };
}

export const retrieveAPI = {
  search: (params: {
    query: string;
    top_k?: number;
    collection?: string;
    store_type?: string;
    use_reranker?: boolean;
    embedding_model?: string;
  }) =>
    apiFetch<RetrievalResult>('/retrieve', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};

// ─── LLM Generation ───────────────────────────────────────────────

export interface GenerationResult {
  success: boolean;
  answer: string;
  model: string;
  provider: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  generation_time_ms: number;
  total_time_ms: number;
  error?: string;
}

export const llmAPI = {
  generate: (params: {
    query: string;
    context?: string[];
    provider?: string;
    model?: string;
    system_prompt?: string;
    temperature?: number;
    max_tokens?: number;
    api_key?: string;
  }) =>
    apiFetch<GenerationResult>('/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  ollamaStatus: () => apiFetch<{ available: boolean; models: any[] }>('/llm/ollama/status'),
  ollamaModels: () => apiFetch<{ available: boolean; models: any[] }>('/llm/ollama/models'),
};

// ─── Pipeline ──────────────────────────────────────────────────────

export interface PipelineStep {
  step_id: string;
  name: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number;
  input_preview: string;
  output_preview: string;
  input_count: number;
  output_count: number;
  error: string | null;
  metadata: Record<string, any>;
}

export interface PipelineRun {
  run_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  total_duration_ms: number;
  steps: PipelineStep[];
  analytics: Record<string, any>;
}

export const pipelineAPI = {
  run: (params: {
    file_path: string;
    chunking_method?: string;
    chunk_size?: number;
    overlap?: number;
    embedding_model?: string;
    vector_store?: string;
    collection_name?: string;
    llm_provider?: string;
    llm_model?: string;
    query?: string;
    api_key?: string;
  }) =>
    apiFetch<{ success: boolean; run_id: string; pipeline: PipelineRun; result: any }>('/pipeline/run', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  steps: () => apiFetch<{ steps: any[] }>('/pipeline/steps'),
  runs: () => apiFetch<{ runs: any[] }>('/pipeline/runs'),
  runDetail: (runId: string) => apiFetch<PipelineRun>(`/pipeline/run/${runId}`),
  stepDetail: (runId: string, stepId: string) =>
    apiFetch<PipelineStep>(`/pipeline/run/${runId}/step/${stepId}`),
};

// ─── Analytics ─────────────────────────────────────────────────────

export const analyticsAPI = {
  system: () => apiFetch<Record<string, any>>('/analytics/system'),
  session: () => apiFetch<Record<string, any>>('/analytics/session'),
};

// ─── Async Upload Jobs (Streaming) ────────────────────────────────

export interface JobInfo {
  job_id: string;
  file_name: string;
  file_size: number;
  category: string;
  status: string;
  stage: string;
  stage_label: string;
  progress: number;
  error?: string;
  result?: any;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export const uploadAPI = {
  /**
   * Upload a file via raw binary streaming. Returns a job ID immediately.
   * The File object (a Blob) is sent directly as the request body — no FormData,
   * no multipart encoding, no main-thread blocking. The backend reads the raw
   * stream from request.stream() and writes it to disk incrementally.
   */
  streamUpload: async (file: File, signal?: AbortSignal): Promise<{ job_id: string; file_name: string; file_size: number; category: string; status: string; error?: string; message?: string }> => {
    const url = `${API_BASE}/upload/stream?filename=${encodeURIComponent(file.name)}&category=${encodeURIComponent(detectCategory(file.name))}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: file,  // File is a Blob — browser streams it natively, no main-thread blocking
      signal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || err.error || `Upload failed: ${res.status}`);
    }
    return res.json();
  },

  /** Get job status by ID */
  getJobStatus: (jobId: string) =>
    apiFetch<JobInfo>(`/jobs/${jobId}`),

  /** List recent jobs */
  listJobs: (limit?: number) =>
    apiFetch<{ jobs: JobInfo[] }>(`/jobs${limit ? `?limit=${limit}` : ''}`),
};

function detectCategory(fileName: string): string {
  const ext = '.' + fileName.split('.').pop()?.toLowerCase();
  const audioExts = new Set(['.mp3','.wav','.ogg','.flac','.aac','.m4a','.wma','.opus']);
  const videoExts = new Set(['.mp4','.avi','.mkv','.mov','.wmv','.flv','.webm','.m4v','.mpg','.mpeg']);
  if (audioExts.has(ext)) return 'audio';
  if (videoExts.has(ext)) return 'video';
  return 'text';
}

// ─── Web Scraping ──────────────────────────────────────────────────

export interface ScrapeResult {
  success: boolean;
  url: string;
  title: string;
  text: string;
  characters: number;
  words: number;
  content_type: string;
  metadata: Record<string, any>;
  file_name: string;
  error?: string;
}

export const scrapeAPI = {
  /** Fetch and parse content from a URL */
  scrapeUrl: (url: string) =>
    apiFetch<ScrapeResult>('/scrape', {
      method: 'POST',
      body: JSON.stringify({ url, extract_metadata: true }),
    }),
  testConnection: () =>
    apiFetch<{ success: boolean; message: string }>('/scrape/test'),
};

// ─── Projects ──────────────────────────────────────────────────────

export interface ProjectInfo {
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  file_count: number;
  vector_count: number;
  path: string;
  config: Record<string, any>;
}

export const projectAPI = {
  list: () => apiFetch<{ projects: ProjectInfo[] }>('/projects'),
  get: (name: string) => apiFetch<{ success: boolean; config: any; structure: any }>(`/projects/${name}`),
  create: (name: string, description?: string) =>
    apiFetch<{ success: boolean; project: any }>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),
  update: (name: string, config?: any, filesData?: any) =>
    apiFetch<{ success: boolean }>(`/projects/${name}`, {
      method: 'PUT',
      body: JSON.stringify({ config, files_data: filesData }),
    }),
  delete: (name: string) =>
    apiFetch<{ success: boolean }>(`/projects/${name}`, { method: 'DELETE' }),
  export: (name: string) =>
    apiFetch<{ success: boolean; export_path: string; size: number }>(`/projects/${name}/export`, { method: 'POST' }),
};


