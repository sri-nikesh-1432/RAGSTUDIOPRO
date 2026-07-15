import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Layers, Brain, Database, Search, MessageSquare,
  ChevronRight, CheckCircle2, AlertCircle, Zap, X, FileCode, Globe,
  BarChart3, Clock
} from 'lucide-react';
import { cn, formatNumber } from '../lib/utils';
import { useAppStore } from '../store/appStore';
import {
  parseAPI, chunkAPI, embedAPI, vectorAPI, retrieveAPI, llmAPI, healthAPI
} from '../services/api';

// ─── File Types ────────────────────────────────────────────────────
const supportedTypes = [
  { ext: '.pdf', icon: FileText, color: 'text-red-400', label: 'PDF' },
  { ext: '.txt', icon: FileText, color: 'text-blue-400', label: 'Text' },
  { ext: '.csv', icon: FileText, color: 'text-emerald-400', label: 'CSV' },
  { ext: '.md', icon: FileText, color: 'text-purple-400', label: 'Markdown' },
  { ext: '.html', icon: Globe, color: 'text-orange-400', label: 'HTML' },
  { ext: '.json', icon: FileCode, color: 'text-yellow-400', label: 'JSON' },
  { ext: '.docx', icon: FileText, color: 'text-blue-300', label: 'DOCX' },
  { ext: '.xlsx', icon: FileText, color: 'text-green-400', label: 'Excel' },
  { ext: '.pptx', icon: FileText, color: 'text-orange-300', label: 'PowerPoint' },
];

// ─── Chunking Methods ──────────────────────────────────────────────
const chunkingMethods = [
  { id: 'recursive', name: 'Recursive Character', desc: 'Splits by separators (\\n\\n, \\n, ., space)' },
  { id: 'sentence', name: 'Sentence-based', desc: 'Groups sentences into chunks' },
  { id: 'semantic', name: 'Semantic Chunking', desc: 'Splits by topic shifts' },
  { id: 'markdown', name: 'Markdown-aware', desc: 'Respects markdown headers' },
  { id: 'token', name: 'Token-based', desc: 'Splits by token count' },
  { id: 'sliding_window', name: 'Sliding Window', desc: 'Fixed window with overlap' },
  { id: 'parent_child', name: 'Parent-Child', desc: 'Hierarchical chunks' },
];

// ─── Embedding Models ──────────────────────────────────────────────
const embeddingModels = [
  { id: 'all-MiniLM-L6-v2', name: 'MiniLM L6', dims: 384, size: '90MB', speed: 'Fast', quality: 'Good' },
  { id: 'BAAI/bge-small-en-v1.5', name: 'BGE Small', dims: 384, size: '130MB', speed: 'Medium', quality: 'Very Good' },
  { id: 'intfloat/e5-small-v2', name: 'E5 Small', dims: 384, size: '130MB', speed: 'Medium', quality: 'Very Good' },
  { id: 'all-mpnet-base-v2', name: 'MPNet Base', dims: 768, size: '420MB', speed: 'Slow', quality: 'Excellent' },
  { id: 'hkunlp/instructor-small', name: 'Instructor', dims: 768, size: '500MB', speed: 'Slow', quality: 'Excellent' },
];

// ─── Vector Databases ──────────────────────────────────────────────
const vectorDBs = [
  { id: 'faiss_flat', name: 'FAISS Flat', desc: 'Exact nearest neighbor search' },
  { id: 'faiss_hnsw', name: 'FAISS HNSW', desc: 'Approximate NN (faster)' },
  { id: 'chromadb', name: 'ChromaDB', desc: 'Open-source embedding DB' },
];

// ─── LLM Providers ─────────────────────────────────────────────────
const freeProviders = [
  {
    id: 'groq', name: 'Groq (Free)', description: 'Ultra-fast inference, no payment needed',
    signupUrl: 'https://console.groq.com/keys',
    models: [
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', speed: 'Very Fast' },
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', speed: 'Fast' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', speed: 'Fast' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B', speed: 'Fast' },
    ],
  },
  {
    id: 'huggingface', name: 'Hugging Face (Free)', description: 'Wide model variety, free API token',
    signupUrl: 'https://huggingface.co/settings/tokens',
    models: [
      { id: 'meta-llama/Llama-3.1-8B-Instruct', name: 'Llama 3.1 8B', speed: 'Medium' },
      { id: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'Mistral 7B', speed: 'Medium' },
      { id: 'HuggingFaceH4/zephyr-7b-beta', name: 'Zephyr 7B', speed: 'Medium' },
      { id: 'microsoft/Phi-3-mini-4k-instruct', name: 'Phi-3 Mini', speed: 'Fast' },
    ],
  },
  {
    id: 'openrouter', name: 'Open Router (Free)', description: 'Auto-select best free model',
    signupUrl: 'https://openrouter.ai/keys',
    models: [
      { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Free)', speed: 'Fast' },
      { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (Free)', speed: 'Fast' },
      { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B (Free)', speed: 'Fast' },
      { id: 'openrouter/free', name: 'Auto (Best Free)', speed: 'Varies' },
    ],
  },
];

const openaiProvider = { id: 'openai', name: 'OpenAI', description: 'GPT models via API (paid)', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'] };



// ─── Action Button Component ───────────────────────────────────────
function ActionButton({ onClick, disabled, loading, children, variant = 'primary' }: {
  onClick: () => void; disabled?: boolean; loading?: boolean; children: React.ReactNode; variant?: 'primary' | 'success' | 'secondary';
}) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all',
        loading && 'opacity-70 cursor-wait',
        disabled && 'opacity-40 cursor-not-allowed',
        variant === 'primary' && 'bg-accent-primary text-white hover:shadow-lg hover:shadow-accent-primary/25',
        variant === 'success' && 'bg-emerald-500 text-white hover:shadow-lg hover:shadow-emerald-500/25',
        variant === 'secondary' && 'bg-bg-elevated text-text-secondary border border-border-primary hover:bg-bg-hover'
      )}
    >
      {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
      {children}
    </motion.button>
  );
}

// ─── Pipeline Analytics Panel ─────────────────────────────────────
function PipelineAnalytics({ parseResult, chunkResult, embedResult, retrievalResults, generationResult, buildComplete, buildTimeMs }: {
  parseResult: any; chunkResult: any; embedResult: any; retrievalResults: any[]; generationResult: any; buildComplete: boolean; buildTimeMs: number;
}) {
  const metrics = [];
  if (parseResult) {
    metrics.push({ label: 'Characters', value: formatNumber(parseResult.characters || 0), icon: FileText, color: 'text-blue-400' });
    metrics.push({ label: 'Words', value: formatNumber(parseResult.words || 0), icon: FileText, color: 'text-cyan-400' });
  }
  if (chunkResult) {
    metrics.push({ label: 'Chunks', value: chunkResult.count || 0, icon: Layers, color: 'text-teal-400' });
    metrics.push({ label: 'Avg Chunk Size', value: `${Math.round(chunkResult.avg_chunk_size || 0)} chars`, icon: Layers, color: 'text-emerald-400' });
    if (chunkResult.processing_time_ms) metrics.push({ label: 'Chunk Time', value: `${chunkResult.processing_time_ms.toFixed(0)}ms`, icon: Clock, color: 'text-amber-400' });
  }
  if (embedResult) {
    metrics.push({ label: 'Embeddings', value: embedResult.count || 0, icon: Brain, color: 'text-violet-400' });
    metrics.push({ label: 'Dimensions', value: `${embedResult.dimensions || 0}d`, icon: Brain, color: 'text-purple-400' });
    if (embedResult.inference_time_ms) metrics.push({ label: 'Embed Time', value: `${embedResult.inference_time_ms.toFixed(0)}ms`, icon: Clock, color: 'text-orange-400' });
  }
  if (retrievalResults.length > 0) {
    const avgScore = retrievalResults.reduce((s, r) => s + (r.score || 0), 0) / retrievalResults.length;
    metrics.push({ label: 'Results', value: retrievalResults.length, icon: Search, color: 'text-green-400' });
    metrics.push({ label: 'Avg Score', value: `${(avgScore * 100).toFixed(1)}%`, icon: Search, color: 'text-lime-400' });
  }
  if (generationResult) {
    metrics.push({ label: 'Tokens', value: generationResult.total_tokens || 0, icon: MessageSquare, color: 'text-yellow-400' });
    if (generationResult.total_time_ms) metrics.push({ label: 'Gen Time', value: `${generationResult.total_time_ms.toFixed(0)}ms`, icon: Clock, color: 'text-rose-400' });
  }
  if (buildComplete && buildTimeMs > 0) metrics.push({ label: 'Total Time', value: `${(buildTimeMs / 1000).toFixed(1)}s`, icon: Zap, color: 'text-accent-primary' });
  if (metrics.length === 0) return null;
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-bg-secondary rounded-xl border border-border-primary p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-accent-primary" />
        <h3 className="text-sm font-semibold text-text-primary">Pipeline Analytics</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="bg-bg-elevated rounded-lg p-2.5 text-center">
            <m.icon className={cn('w-3.5 h-3.5 mx-auto mb-1', m.color)} />
            <div className="text-sm font-bold text-text-primary">{m.value}</div>
            <div className="text-[9px] text-text-tertiary">{m.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Step 7: Full Pipeline Analytics ───────────────────────────────
function Step7Analytics({ parseResult, chunkResult, embedResult, retrievalResults, generationResult, buildTimeMs, chatMessages, stepTimings }: {
  parseResult: any; chunkResult: any; embedResult: any; retrievalResults: any[]; generationResult: any; buildTimeMs: number; chatMessages: any[]; stepTimings: Record<string, number>;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'chunks' | 'retrieval' | 'queries'>('overview');

  const chunkSizes = chunkResult?.chunks?.map((c: any) => c.text?.length || 0) || [];
  const maxChunkSize = Math.max(...chunkSizes, 1);

  return (
    <div className="bg-bg-secondary rounded-xl border border-border-primary p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-4 h-4 text-accent-primary" />
        <h3 className="text-sm font-semibold text-text-primary">Step 7: Pipeline Analytics</h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['overview', 'chunks', 'retrieval', 'queries'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize',
              activeTab === tab ? 'bg-accent-primary text-white' : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
            )}>{tab}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Timing Bar Chart */}
          <div className="bg-bg-elevated rounded-lg p-4">
            <h4 className="text-xs font-semibold text-text-primary mb-3">Pipeline Timing</h4>
            <div className="space-y-2">
              {[
                { label: 'Parse', time: parseResult?.parse_time_ms || stepTimings?.parse || 0, color: 'bg-blue-500' },
                { label: 'Chunk', time: chunkResult?.processing_time_ms || stepTimings?.chunk || 0, color: 'bg-cyan-500' },
                { label: 'Embed', time: embedResult?.inference_time_ms || stepTimings?.embed || 0, color: 'bg-teal-500' },
                { label: 'Store', time: stepTimings?.store || 0, color: 'bg-emerald-500' },
                { label: 'Retrieve', time: retrievalResults.length > 0 ? (retrievalResults[0]?.timing?.total_ms || 0) : 0, color: 'bg-green-500' },
                { label: 'Generate', time: generationResult?.total_time_ms || 0, color: 'bg-yellow-500' },
              ].map((item) => {
                const maxTime = Math.max(buildTimeMs, 1);
                const pct = (item.time / maxTime) * 100;
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-[10px] text-text-tertiary w-16">{item.label}</span>
                    <div className="flex-1 h-4 bg-bg-primary rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(pct, 2)}%` }}
                        className={cn('h-full rounded-full', item.color)} />
                    </div>
                    <span className="text-[10px] text-text-muted w-16 text-right">{item.time.toFixed(0)}ms</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-border-primary flex justify-between text-xs">
              <span className="text-text-tertiary">Total Pipeline Time</span>
              <span className="text-accent-primary font-bold">{(buildTimeMs / 1000).toFixed(1)}s</span>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-bg-elevated rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-400">{formatNumber(parseResult?.characters || 0)}</div>
              <div className="text-[10px] text-text-tertiary">Characters</div>
            </div>
            <div className="bg-bg-elevated rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-teal-400">{chunkResult?.count || 0}</div>
              <div className="text-[10px] text-text-tertiary">Chunks</div>
            </div>
            <div className="bg-bg-elevated rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-violet-400">{embedResult?.count || 0}</div>
              <div className="text-[10px] text-text-tertiary">Embeddings</div>
            </div>
            <div className="bg-bg-elevated rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-yellow-400">{generationResult?.total_tokens || 0}</div>
              <div className="text-[10px] text-text-tertiary">Tokens</div>
            </div>
          </div>
        </div>
      )}

      {/* Chunks Tab */}
      {activeTab === 'chunks' && (
        <div className="space-y-3">
          {chunkResult?.chunks?.length > 0 ? (
            <>
              <div className="bg-bg-elevated rounded-lg p-3">
                <h4 className="text-xs font-semibold text-text-primary mb-2">Chunk Size Distribution</h4>
                <div className="flex items-end gap-[2px] h-20">
                  {chunkSizes.map((size: number, i: number) => (
                    <div key={i} className="flex-1 bg-accent-primary rounded-t-sm transition-all"
                      style={{ height: `${(size / maxChunkSize) * 100}%`, minHeight: '2px' }} />
                  ))}
                </div>
                <div className="flex justify-between mt-1 text-[9px] text-text-muted">
                  <span>Min: {Math.min(...chunkSizes)} chars</span>
                  <span>Avg: {Math.round(chunkSizes.reduce((a: number, b: number) => a + b, 0) / chunkSizes.length)} chars</span>
                  <span>Max: {Math.max(...chunkSizes)} chars</span>
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {chunkResult.chunks.slice(0, 20).map((chunk: any, i: number) => (
                  <div key={i} className="bg-bg-elevated rounded-lg p-3 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-accent-primary font-mono">Chunk #{i + 1}</span>
                      <span className="text-text-tertiary">{chunk.text?.length || 0} chars</span>
                    </div>
                    <p className="text-text-secondary line-clamp-2">{chunk.text}</p>
                  </div>
                ))}
                {chunkResult.chunks.length > 20 && (
                  <p className="text-center text-[10px] text-text-muted">+ {chunkResult.chunks.length - 20} more chunks</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-center text-text-tertiary text-sm py-8">No chunks generated yet. Complete the Chunking step first.</p>
          )}
        </div>
      )}

      {/* Retrieval Tab */}
      {activeTab === 'retrieval' && (
        <div className="space-y-3">
          {retrievalResults.length > 0 ? (
            <>
              <div className="bg-bg-elevated rounded-lg p-3">
                <h4 className="text-xs font-semibold text-text-primary mb-2">Retrieval Scores</h4>
                <div className="space-y-2">
                  {retrievalResults.map((r: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[10px] text-text-muted w-8">#{r.rank}</span>
                      <div className="flex-1 h-3 bg-bg-primary rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(r.score || 0) * 100}%` }}
                          className="h-full bg-accent-primary rounded-full" />
                      </div>
                      <span className="text-[10px] text-text-tertiary w-12 text-right">{((r.score || 0) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {retrievalResults.map((r: any, i: number) => (
                  <div key={i} className="bg-bg-elevated rounded-lg p-3 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-accent-primary font-mono">#{r.rank} — {(r.score * 100).toFixed(1)}% match</span>
                    </div>
                    <p className="text-text-secondary line-clamp-3">{r.text}</p>
                    {r.metadata?.source && <p className="text-[10px] text-text-muted mt-1">Source: {r.metadata.source}</p>}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-text-tertiary text-sm py-8">No retrieval results yet. Send a query after building the pipeline.</p>
          )}
        </div>
      )}

      {/* Queries Tab */}
      {activeTab === 'queries' && (
        <div className="space-y-3">
          {chatMessages.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn('rounded-lg p-3 text-xs', msg.role === 'user' ? 'bg-accent-primary/10' : 'bg-bg-elevated')}>
                  <div className={cn('font-medium mb-1', msg.role === 'user' ? 'text-accent-primary' : 'text-text-primary')}>
                    {msg.role === 'user' ? '🧑 You' : '🤖 RAG'}
                  </div>
                  <p className="text-text-secondary leading-relaxed">{msg.content}</p>
                  {msg.metadata && (
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-text-muted">
                      <span>📄 {msg.metadata.chunks} chunks</span>
                      <span>⏱️ {msg.metadata.latency}</span>
                      {msg.metadata.confidence !== undefined && <span>🎯 {(msg.metadata.confidence * 100).toFixed(0)}%</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (              <p className="text-center text-text-tertiary text-sm py-8">No queries yet. Build the pipeline and start chatting.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Pipeline Step Component ───────────────────────────────────────
function PipelineStepCard({ step, index, isActive, isComplete, onClick, children, actionButton }: {
  step: { name: string; icon: any; color: string }; index: number; isActive: boolean; isComplete: boolean;
  onClick: () => void; children: React.ReactNode; actionButton?: React.ReactNode;
}) {
  return (
    <div className="relative">
      {index > 0 && (
        <div className={cn('absolute left-6 -top-3 w-0.5 h-3', isComplete ? 'bg-accent-primary' : 'bg-border-primary')} />
      )}
      <button onClick={onClick} className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
        isActive ? 'bg-accent-glow border-accent-primary/20' :
        isComplete ? 'bg-emerald-500/5 border-emerald-500/20' :
        'bg-bg-secondary border-border-primary hover:border-border-secondary'
      )}>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', `bg-gradient-to-br ${step.color}`)}>
          {isComplete ? <CheckCircle2 className="w-4 h-4 text-white" /> : <step.icon className="w-4 h-4 text-white" />}
        </div>
        <div className="text-left flex-1">
          <div className="text-sm font-medium text-text-primary">Step {index + 1}: {step.name}</div>
        </div>
        <ChevronRight className={cn('w-4 h-4 transition-transform', isActive && 'rotate-90')} />
      </button>
      <AnimatePresence>
        {isActive && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pt-3 pl-6 space-y-3">
              {children}
              {actionButton && (
                <div className="flex justify-end">
                  {actionButton}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main RAG Builder ──────────────────────────────────────────────
export default function RAGBuilder() {
  const store = useAppStore();
  const [activeStep, setActiveStep] = useState(0);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildComplete, setBuildComplete] = useState(false);
  const [buildTimeMs, setBuildTimeMs] = useState(0);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<any>(null);
  const [chunkResult, setChunkResult] = useState<any>(null);
  const [embedResult, setEmbedResult] = useState<any>(null);
  const [storeResult, setStoreResult] = useState<any>(null);
  const [retrievalResults, setRetrievalResults] = useState<any[]>([]);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaAvailable, setOllamaAvailable] = useState(true);
  const [stepProcessing, setStepProcessing] = useState<Record<number, boolean>>({});
  const [pipelineStartTime, setPipelineStartTime] = useState<number>(0);
  const [stepTimings, setStepTimings] = useState<Record<string, number>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check backend connection and Ollama on mount
  useEffect(() => {
    healthAPI.check().then(() => store.setBackendConnected(true)).catch(() => store.setBackendConnected(false));
    llmAPI.ollamaStatus().then((status: any) => {
      setOllamaAvailable(status.available);
      setOllamaModels(status.models?.map((m: any) => m.name) || []);
    }).catch(() => setOllamaAvailable(false));
  }, []);

  // ─── Step 1: Complete Ingestion ────────────────────────────────
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);
    for (const file of Array.from(files)) {
      try {
        const result = await parseAPI.uploadFile(file);
        if (result.success) {
          store.addParsedFile({ name: result.file_name, text: result.text, type: result.file_type, size: result.file_size, words: result.words || 0, characters: result.characters || 0, pages: result.pages, language: result.language, metadata: result.metadata });
          store.setCurrentText(result.text);
          setParseResult(result);
        } else {
          setError(result.error || 'Failed to parse file');
        }
      } catch (err: any) {
        setError(err.message || 'Upload failed');
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [store]);

  const completeIngestion = () => {
    if (store.parsedFiles.length > 0 || store.currentText.trim()) {
      setPipelineStartTime(Date.now());
      setActiveStep(1);
    }
  };

  // ─── Step 2: Complete Chunking ─────────────────────────────────
  const handleChunk = async () => {
    if (!store.currentText) { setError('No text to chunk. Upload a file first.'); return; }
    setStepProcessing(p => ({ ...p, 1: true }));
    setError(null);
    const start = Date.now();
    try {
      const result = await chunkAPI.chunk({ text: store.currentText, method: store.chunkMethod, chunk_size: store.chunkSize, overlap: store.chunkOverlap });
      if (result.success) { store.setChunks(result.chunks); setChunkResult(result); setStepTimings(t => ({ ...t, chunk: Date.now() - start })); setActiveStep(2); }
      else setError(result.error || 'Chunking failed');
    } catch (err: any) { setError(err.message); }
    finally { setStepProcessing(p => ({ ...p, 1: false })); }
  };

  // ─── Step 3: Complete Embedding ────────────────────────────────
  const handleEmbed = async () => {
    if (store.chunks.length === 0) { setError('No chunks to embed. Complete chunking first.'); return; }
    setStepProcessing(p => ({ ...p, 2: true }));
    setError(null);
    const start = Date.now();
    try {
      const chunkTexts = store.chunks.map((c: any) => c.text);
      const embeddings = await embedAPI.generate({ texts: chunkTexts, model: store.embeddingModel });
      if (embeddings.success) { setEmbedResult(embeddings); setStepTimings(t => ({ ...t, embed: Date.now() - start })); setActiveStep(3); }
      else setError(embeddings.error || 'Embedding failed');
    } catch (err: any) { setError(err.message); }
    finally { setStepProcessing(p => ({ ...p, 2: false })); }
  };

  // ─── Step 4: Complete Vector Store ─────────────────────────────
  const handleStore = async () => {
    if (!embedResult) { setError('No embeddings to store. Complete embedding first.'); return; }
    setStepProcessing(p => ({ ...p, 3: true }));
    setError(null);
    const start = Date.now();
    try {
      const chunkTexts = store.chunks.map((c: any) => c.text);
      const ids = store.chunks.map((c: any) => c.id);
      const metadata = store.chunks.map((c: any) => c.metadata);
      const result = await vectorAPI.add({ ids, embeddings: embedResult.embeddings, texts: chunkTexts, metadata, collection: store.collectionName, store_type: store.vectorStore, dimensions: embedResult.dimensions });
      const storeTime = Date.now() - start;
      setStoreResult(result); setBuildComplete(true); setBuildTimeMs(Date.now() - (pipelineStartTime || Date.now())); setStepTimings(t => ({ ...t, store: storeTime })); setActiveStep(4);
    } catch (err: any) { setError(err.message); }
    finally { setStepProcessing(p => ({ ...p, 3: false })); }
  };

  // ─── Step 5: Test Retrieval ────────────────────────────────────
  const [retrievalQuery, setRetrievalQuery] = useState('');
  const handleTestRetrieval = async () => {
    if (!retrievalQuery.trim() || !buildComplete) return;
    setStepProcessing(p => ({ ...p, 4: true }));
    setError(null);
    try {
      const retrieval = await retrieveAPI.search({ query: retrievalQuery, top_k: 5, collection: store.collectionName, store_type: store.vectorStore, use_reranker: true, embedding_model: store.embeddingModel });
      if (retrieval.success) { setRetrievalResults(retrieval.results); }
      else setError('Retrieval failed');
    } catch (err: any) { setError(err.message); }
    finally { setStepProcessing(p => ({ ...p, 4: false })); }
  };

  // ─── Step 6: Send Query (Retrieve + Generate) ─────────────────
  const sendQuery = async () => {
    if (!query.trim() || !buildComplete) return;
    const userMsg = { role: 'user' as const, content: query };
    store.addChatMessage(userMsg); setQuery(''); setIsSearching(true); setError(null);
    try {
      const retrieval = await retrieveAPI.search({ query, top_k: 5, collection: store.collectionName, store_type: store.vectorStore, use_reranker: true, embedding_model: store.embeddingModel });
      if (retrieval.success) {
        setRetrievalResults(retrieval.results); store.incrementQueries();
        const context = retrieval.results.map((r: any) => r.text);
        let generation;
        generation = await llmAPI.generate({ query, context, provider: store.llmProvider, model: store.llmModel, api_key: store.openaiApiKey || undefined });
        if (generation.success) {
          setGenerationResult(generation);
          store.addChatMessage({ role: 'assistant', content: generation.answer, metadata: { chunks: retrieval.results.length, sources: retrieval.results.map((r: any) => r.metadata?.source || 'unknown').filter((s: string, i: number, a: string[]) => a.indexOf(s) === i), latency: `${(retrieval.timing.total_ms / 1000).toFixed(2)}s`, confidence: retrieval.results[0]?.score || 0 } });
        } else {
          let errorMsg = generation.error || 'LLM not available';
          if (errorMsg.includes('getaddrinfo') || errorMsg.includes('DNS') || errorMsg.includes('network')) {
            errorMsg = `Network error: Cannot reach the LLM API. Check your internet connection, or try Groq (free at console.groq.com/keys).`;
          } else if (errorMsg.includes('not found') || errorMsg.includes('404')) {
            if (store.llmProvider === 'ollama') {
              errorMsg = ollamaModels.length === 0
                ? 'No Ollama models installed. Run "ollama pull llama3.2" in your terminal, or try a free cloud provider (Groq, Hugging Face, Open Router).'
                : `Model "${store.llmModel}" not found. Available models: ${ollamaModels.join(', ')}. Pull it with "ollama pull ${store.llmModel}" or try a free cloud provider.`;
            } else {
              errorMsg += ' Try a different provider or check your API key.';
            }
          }
          store.addChatMessage({ role: 'assistant', content: `I found relevant chunks but couldn't generate an answer: ${errorMsg}` });
        }
      }
    } catch (err: any) { store.addChatMessage({ role: 'assistant', content: `Error: ${err.message}` }); }
    finally { setIsSearching(false); }
  };

  const steps = [
    { name: 'Ingestion', icon: Upload, color: 'from-blue-500 to-cyan-500' },
    { name: 'Chunking', icon: Layers, color: 'from-cyan-500 to-teal-500' },
    { name: 'Embeddings', icon: Brain, color: 'from-teal-500 to-emerald-500' },
    { name: 'Vector Store', icon: Database, color: 'from-emerald-500 to-green-500' },
    { name: 'Retrieval', icon: Search, color: 'from-green-500 to-lime-500' },
    { name: 'Generation', icon: MessageSquare, color: 'from-lime-500 to-yellow-500' },
    { name: 'Analytics', icon: BarChart3, color: 'from-yellow-500 to-orange-500' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border-primary bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><Zap className="w-5 h-5 text-white" /></div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">RAG Builder</h1>
              <p className="text-xs text-text-tertiary">{store.backendConnected ? '🟢 Backend connected' : '🔴 Backend offline'} • Build production-ready RAG pipelines</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveStep(6)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-primary transition-all">
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        <PipelineAnalytics parseResult={parseResult} chunkResult={chunkResult} embedResult={embedResult} retrievalResults={retrievalResults} generationResult={generationResult} buildComplete={buildComplete} buildTimeMs={buildTimeMs} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {/* Step 1: Ingestion */}
            <PipelineStepCard step={steps[0]} index={0} isActive={activeStep === 0} isComplete={store.parsedFiles.length > 0} onClick={() => setActiveStep(0)}
              actionButton={<ActionButton onClick={completeIngestion} disabled={store.parsedFiles.length === 0 && !store.currentText.trim()} variant="success">✓ Complete Ingestion</ActionButton>}>
              <div className="bg-bg-secondary rounded-xl border border-border-primary p-4 space-y-4">
                <input ref={fileInputRef} type="file" multiple accept="*/*" onChange={handleFileUpload} className="hidden" />
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-border-secondary rounded-xl p-8 text-center cursor-pointer hover:border-accent-primary/50 hover:bg-accent-glow/50 transition-all">
                  <Upload className="w-10 h-10 text-text-muted mx-auto mb-3" />
                  <p className="text-sm text-text-secondary mb-1">Drop files here or click to upload</p>
                  <p className="text-xs text-text-tertiary">Any file type supported</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-2 block">Or paste text directly</label>
                  <textarea value={store.currentText} onChange={(e) => store.setCurrentText(e.target.value)} placeholder="Paste your text here..."
                    className="w-full h-24 bg-bg-elevated rounded-lg border border-border-primary px-4 py-3 text-sm text-text-primary resize-none focus:outline-none focus:border-accent-primary" />
                </div>
                {store.parsedFiles.length > 0 && (
                  <div className="space-y-2">
                    {store.parsedFiles.map((file, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-bg-elevated">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-text-primary flex-1 truncate">{file.name}</span>
                        <span className="text-[10px] text-text-tertiary">{file.words} words</span>
                        <button onClick={() => store.removeParsedFile(file.name)} className="text-text-muted hover:text-red-400"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
                {parseResult && (
                  <div className="bg-bg-elevated rounded-lg p-3 text-xs text-text-tertiary space-y-1">
                    <div>📄 {parseResult.file_name} • {parseResult.file_type.toUpperCase()}</div>
                    <div>📝 {formatNumber(parseResult.characters || 0)} chars • {formatNumber(parseResult.words || 0)} words{parseResult.pages ? ` • ${parseResult.pages} pages` : ''}</div>
                  </div>
                )}
              </div>
            </PipelineStepCard>

            {/* Step 2: Chunking */}
            <PipelineStepCard step={steps[1]} index={1} isActive={activeStep === 1} isComplete={store.chunks.length > 0} onClick={() => setActiveStep(1)}
              actionButton={<ActionButton onClick={handleChunk} disabled={!store.currentText} loading={stepProcessing[1]} variant="success">✂️ Generate Chunks</ActionButton>}>
              <div className="bg-bg-secondary rounded-xl border border-border-primary p-4 space-y-4">
                <div className="space-y-2">
                  {chunkingMethods.map((m) => (
                    <button key={m.id} onClick={() => store.setChunkMethod(m.id)} className={cn('w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left', store.chunkMethod === m.id ? 'bg-accent-glow border-accent-primary/20' : 'bg-bg-elevated border-border-primary hover:border-border-secondary')}>
                      <div><div className="text-sm font-medium text-text-primary">{m.name}</div><div className="text-[10px] text-text-tertiary">{m.desc}</div></div>
                      {store.chunkMethod === m.id && <CheckCircle2 className="w-4 h-4 text-accent-primary" />}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-text-secondary mb-2 block">Chunk Size: {store.chunkSize}</label><input type="range" min={100} max={2000} step={100} value={store.chunkSize} onChange={(e) => store.setChunkSize(Number(e.target.value))} className="w-full accent-accent-primary" /></div>
                  <div><label className="text-xs font-medium text-text-secondary mb-2 block">Overlap: {store.chunkOverlap}</label><input type="range" min={0} max={200} step={10} value={store.chunkOverlap} onChange={(e) => store.setChunkOverlap(Number(e.target.value))} className="w-full accent-accent-primary" /></div>
                </div>
                {chunkResult && <div className="bg-bg-elevated rounded-lg p-3 text-xs text-text-tertiary">✂️ {chunkResult.count} chunks • avg {Math.round(chunkResult.avg_chunk_size)} chars • {chunkResult.processing_time_ms?.toFixed(0)}ms</div>}
              </div>
            </PipelineStepCard>

            {/* Step 3: Embeddings */}
            <PipelineStepCard step={steps[2]} index={2} isActive={activeStep === 2} isComplete={!!embedResult} onClick={() => setActiveStep(2)}
              actionButton={<ActionButton onClick={handleEmbed} disabled={store.chunks.length === 0} loading={stepProcessing[2]} variant="success">🧠 Generate Embeddings</ActionButton>}>
              <div className="bg-bg-secondary rounded-xl border border-border-primary p-4 space-y-2">
                {embeddingModels.map((m) => (
                  <button key={m.id} onClick={() => store.setEmbeddingModel(m.id)} className={cn('w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left', store.embeddingModel === m.id ? 'bg-accent-glow border-accent-primary/20' : 'bg-bg-elevated border-border-primary hover:border-border-secondary')}>
                    <div><div className="text-sm font-medium text-text-primary">{m.name}</div><div className="text-[10px] text-text-tertiary">{m.dims}d • {m.size} • {m.speed}</div></div>
                    {store.embeddingModel === m.id && <CheckCircle2 className="w-4 h-4 text-accent-primary" />}
                  </button>
                ))}
                {embedResult && <div className="bg-bg-elevated rounded-lg p-3 text-xs text-text-tertiary">🧠 {embedResult.count} embeddings • {embedResult.dimensions}d • {embedResult.inference_time_ms?.toFixed(0)}ms</div>}
              </div>
            </PipelineStepCard>

            {/* Step 4: Vector Store */}
            <PipelineStepCard step={steps[3]} index={3} isActive={activeStep === 3} isComplete={buildComplete} onClick={() => setActiveStep(3)}
              actionButton={<ActionButton onClick={handleStore} disabled={!embedResult} loading={stepProcessing[3]} variant="success">💾 Store Vectors</ActionButton>}>
              <div className="bg-bg-secondary rounded-xl border border-border-primary p-4 space-y-2">
                {vectorDBs.map((db) => (
                  <button key={db.id} onClick={() => store.setVectorStore(db.id)} className={cn('w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left', store.vectorStore === db.id ? 'bg-accent-glow border-accent-primary/20' : 'bg-bg-elevated border-border-primary hover:border-border-secondary')}>
                    <div><div className="text-sm font-medium text-text-primary">{db.name}</div><div className="text-[10px] text-text-tertiary">{db.desc}</div></div>
                    {store.vectorStore === db.id && <CheckCircle2 className="w-4 h-4 text-accent-primary" />}
                  </button>
                ))}
              </div>
            </PipelineStepCard>

            {/* Step 5: Retrieval */}
            <PipelineStepCard step={steps[4]} index={4} isActive={activeStep === 4} isComplete={retrievalResults.length > 0} onClick={() => setActiveStep(4)}
              actionButton={<ActionButton onClick={handleTestRetrieval} disabled={!buildComplete || !retrievalQuery.trim()} loading={stepProcessing[4]} variant="success">🔍 Test Retrieval</ActionButton>}>
              <div className="bg-bg-secondary rounded-xl border border-border-primary p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-2 block">Test Query</label>
                  <input value={retrievalQuery} onChange={(e) => setRetrievalQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleTestRetrieval()}
                    placeholder="Enter a test query..." className="w-full bg-bg-elevated rounded-lg border border-border-primary px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary" />
                </div>
                {retrievalResults.length > 0 && (
                  <div className="space-y-2">
                    {retrievalResults.map((r: any, i: number) => (
                      <div key={i} className="bg-bg-elevated rounded-lg p-3 text-xs">
                        <div className="flex items-center justify-between mb-1"><span className="text-accent-primary font-mono">#{r.rank}</span><span className="text-text-tertiary">{(r.score * 100).toFixed(1)}% match</span></div>
                        <p className="text-text-secondary line-clamp-2">{r.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PipelineStepCard>

            {/* Step 6: Generation */}
            <PipelineStepCard step={steps[5]} index={5} isActive={activeStep === 5} isComplete={!!generationResult} onClick={() => setActiveStep(5)}>
              <div className="bg-bg-secondary rounded-xl border border-border-primary p-4 space-y-4">
                {/* Query Input */}
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-2 block">Enter your query</label>
                  <div className="flex gap-2">
                    <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendQuery()}
                      placeholder={buildComplete ? 'Type a question to ask your documents...' : 'Complete pipeline steps first...'}
                      disabled={!buildComplete}
                      className="flex-1 bg-bg-elevated rounded-lg border border-border-primary px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary disabled:opacity-50" />
                  </div>
                </div>

                {/* Category 0: Quick Start — Groq Free (Recommended) */}
                <div className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <h4 className="text-xs font-semibold text-green-400">Quick Start: Groq Free</h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 font-bold">Recommended</span>
                  </div>
                  <p className="text-[10px] text-text-tertiary mb-3">Fastest free LLM — no credit card needed. Just paste your free API key below.</p>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-medium text-text-secondary mb-1 block">Groq API Key (free at console.groq.com/keys)</label>
                      <div className="flex gap-2">
                        <input type="password" value={store.openaiApiKey} onChange={(e) => store.setOpenaiApiKey(e.target.value)}
                          placeholder="gsk_..." className="flex-1 bg-bg-elevated rounded-lg border border-border-primary px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary" />
                        <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer"
                          className="shrink-0 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-medium hover:bg-green-500/20 transition-all">
                          Get Free Key
                        </a>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[{ id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B' }, { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' }, { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' }, { id: 'gemma2-9b-it', name: 'Gemma 2 9B' }].map((m) => (
                        <button key={m.id} onClick={() => { store.setLlmProvider('groq'); store.setLlmModel(m.id); }}
                          className={cn('px-3 py-1 rounded-full text-xs transition-all', store.llmModel === m.id && store.llmProvider === 'groq' ? 'bg-green-500 text-white' : 'bg-bg-elevated text-text-secondary hover:text-text-primary')}>{m.name}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => sendQuery()} disabled={!buildComplete || !query.trim() || isSearching || !store.openaiApiKey.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium text-sm hover:shadow-lg hover:shadow-green-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-3">
                    {isSearching ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
                    {isSearching ? 'Generating...' : 'Generate with Groq (Free)'}
                  </button>
                  {!buildComplete && (
                    <p className="text-[10px] text-text-tertiary text-center mt-1">Complete Steps 1-4 first to enable generation</p>
                  )}
                  {buildComplete && !store.openaiApiKey.trim() && (
                    <p className="text-[10px] text-amber-400 text-center mt-1">Paste your free Groq API key above to start generating</p>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-border-primary" />

                {/* Category 1: Free Cloud Models */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h4 className="text-xs font-semibold text-emerald-400">Free Cloud Models</h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">No payment</span>
                  </div>
                  <div className="space-y-2">
                    {freeProviders.map((p) => (
                      <div key={p.id}>
                        <button onClick={() => { store.setLlmProvider(p.id); store.setLlmModel(p.models[0].id); }} className={cn('w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left', store.llmProvider === p.id ? 'bg-accent-glow border-accent-primary/20' : 'bg-bg-elevated border-border-primary hover:border-border-secondary')}>
                          <div><div className="text-sm font-medium text-text-primary">{p.name}</div><div className="text-[10px] text-text-tertiary">{p.description}</div></div>
                          {store.llmProvider === p.id && <CheckCircle2 className="w-4 h-4 text-accent-primary" />}
                        </button>
                        {store.llmProvider === p.id && (
                          <div className="ml-4 mt-2 space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {p.models.map((m) => (
                                <button key={m.id} onClick={() => store.setLlmModel(m.id)} className={cn('px-3 py-1 rounded-full text-xs transition-all', store.llmModel === m.id ? 'bg-accent-primary text-white' : 'bg-bg-elevated text-text-secondary hover:text-text-primary')}>{m.name}</button>
                              ))}
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-text-secondary mb-1 block">API Key (free)</label>
                              <input type="password" value={store.openaiApiKey} onChange={(e) => store.setOpenaiApiKey(e.target.value)} placeholder={`Get free key at ${p.signupUrl}`} className="w-full bg-bg-elevated rounded-lg border border-border-primary px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary" />
                              <a href={p.signupUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent-primary hover:underline">Get free API key →</a>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border-primary" />

                {/* Category 2: Ollama Local */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <h4 className="text-xs font-semibold text-blue-400">Ollama (Local)</h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400">Run locally</span>
                  </div>
                  <button onClick={() => { store.setLlmProvider('ollama'); store.setLlmModel('llama3.2'); }} className={cn('w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left', store.llmProvider === 'ollama' ? 'bg-accent-glow border-accent-primary/20' : 'bg-bg-elevated border-border-primary hover:border-border-secondary')}>
                    <div><div className="text-sm font-medium text-text-primary">Ollama (Local)</div><div className="text-[10px] text-text-tertiary">Run models on your machine • 100% private</div></div>
                    {store.llmProvider === 'ollama' && <CheckCircle2 className="w-4 h-4 text-accent-primary" />}
                  </button>
                  {store.llmProvider === 'ollama' && (
                    <div className="ml-4 mt-2 space-y-2">
                      {ollamaModels.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {ollamaModels.map((m) => (
                            <button key={m} onClick={() => store.setLlmModel(m)} className={cn('px-3 py-1 rounded-full text-xs transition-all', store.llmModel === m ? 'bg-accent-primary text-white' : 'bg-bg-elevated text-text-secondary hover:text-text-primary')}>{m}</button>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs space-y-2">
                          <p className="text-blue-400 font-medium">No models installed yet</p>
                          <p className="text-text-tertiary">Install Ollama and pull a model:</p>
                          <div className="bg-bg-elevated rounded-lg p-2 font-mono text-[10px] text-text-secondary space-y-1">
                            <div><span className="text-text-muted"># 1. Install Ollama</span></div>
                            <div>curl -fsSL https://ollama.com/install.sh | sh</div>
                            <div className="mt-1"><span className="text-text-muted"># 2. Pull a model</span></div>
                            <div>ollama pull llama3.2</div>
                            <div><span className="text-text-muted"># or other models:</span></div>
                            <div>ollama pull mistral</div>
                            <div>ollama pull gemma2</div>
                          </div>
                          <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline text-[10px]">Visit ollama.com for more models →</a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-border-primary" />

                {/* Category 3: OpenAI */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <h4 className="text-xs font-semibold text-amber-400">OpenAI</h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400">Paid API</span>
                  </div>
                  <button onClick={() => { store.setLlmProvider('openai'); store.setLlmModel('gpt-4o-mini'); }} className={cn('w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left', store.llmProvider === 'openai' ? 'bg-accent-glow border-accent-primary/20' : 'bg-bg-elevated border-border-primary hover:border-border-secondary')}>
                    <div><div className="text-sm font-medium text-text-primary">OpenAI</div><div className="text-[10px] text-text-tertiary">GPT models via API • Requires API key</div></div>
                    {store.llmProvider === 'openai' && <CheckCircle2 className="w-4 h-4 text-accent-primary" />}
                  </button>
                  {store.llmProvider === 'openai' && (
                    <div className="ml-4 mt-2 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {openaiProvider.models.map((m) => (
                          <button key={m} onClick={() => store.setLlmModel(m)} className={cn('px-3 py-1 rounded-full text-xs transition-all', store.llmModel === m ? 'bg-accent-primary text-white' : 'bg-bg-elevated text-text-secondary hover:text-text-primary')}>{m}</button>
                        ))}
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-text-secondary mb-1 block">API Key</label>
                        <input type="password" value={store.openaiApiKey} onChange={(e) => store.setOpenaiApiKey(e.target.value)} placeholder="sk-..." className="w-full bg-bg-elevated rounded-lg border border-border-primary px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary" />
                      </div>
                    </div>
                  )}
                </div>

                {generationResult && (
                  <div className="bg-bg-elevated rounded-lg p-3 text-xs text-text-tertiary space-y-1">
                    <div>🤖 {generationResult.model} via {generationResult.provider}</div>
                    <div>📊 Tokens: {generationResult.total_tokens} • Time: {generationResult.total_time_ms?.toFixed(0)}ms</div>
                  </div>
                )}

                {/* Free Model Generate Button for non-free providers */}
                {store.llmProvider !== 'free' && store.llmProvider && (
                  <>
                    <div className="border-t border-border-primary" />
                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                      <p className="text-[10px] text-green-400 mb-2">💡 Want to try without API key? Use the Free Model at the top!</p>
                    </div>
                  </>
                )}
              </div>
            </PipelineStepCard>

            {/* Step 7: Analytics */}
            <PipelineStepCard step={steps[6]} index={6} isActive={activeStep === 6} isComplete={false} onClick={() => setActiveStep(6)}>
              <Step7Analytics parseResult={parseResult} chunkResult={chunkResult} embedResult={embedResult} retrievalResults={retrievalResults} generationResult={generationResult} buildTimeMs={buildTimeMs} chatMessages={store.chatMessages} stepTimings={stepTimings} />
            </PipelineStepCard>
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-1">
            <div className="bg-bg-secondary rounded-xl border border-border-primary h-[calc(100vh-120px)] sticky top-20 flex flex-col">
              <div className="p-4 border-b border-border-primary">
                <h3 className="text-sm font-semibold text-text-primary">Chat with your RAG</h3>
                <p className="text-[10px] text-text-tertiary mt-1">{buildComplete ? '🟢 Pipeline ready - ask anything!' : 'Complete all steps to start chatting'}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {store.chatMessages.length === 0 && (
                  <div className="text-center py-12"><MessageSquare className="w-10 h-10 text-text-muted mx-auto mb-3" /><p className="text-sm text-text-tertiary">No messages yet</p></div>
                )}
                {store.chatMessages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn('rounded-xl p-3 text-sm', msg.role === 'user' ? 'bg-accent-primary/10 ml-8' : 'bg-bg-elevated mr-4')}>
                    <div className="text-text-secondary leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                    {msg.metadata && (
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-text-tertiary">
                        <span>📄 {msg.metadata.chunks} chunks</span>
                        {msg.metadata.sources && <span>📎 {msg.metadata.sources.join(', ')}</span>}
                        <span>⏱️ {msg.metadata.latency}</span>
                        {msg.metadata.confidence !== undefined && <span>🎯 {(msg.metadata.confidence * 100).toFixed(0)}%</span>}
                      </div>
                    )}
                  </motion.div>
                ))}
                {isSearching && <div className="flex items-center gap-2 text-xs text-text-tertiary"><div className="w-3 h-3 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />Searching and generating...</div>}
              </div>
              <div className="p-4 border-t border-border-primary">
                <div className="flex gap-2">
                  <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendQuery()} disabled={!buildComplete} placeholder={buildComplete ? 'Ask a question...' : 'Complete all steps first'} className="flex-1 bg-bg-elevated rounded-lg border border-border-primary px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary disabled:opacity-50" />
                  <button onClick={() => sendQuery()} disabled={!buildComplete || !query.trim() || isSearching} className="px-4 py-2.5 rounded-lg bg-accent-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-dim transition-all"><MessageSquare className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
