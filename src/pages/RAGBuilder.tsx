import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Layers, Brain, Database, Search, MessageSquare,
  Play, ChevronRight, CheckCircle2, AlertCircle, Zap, X, FileCode, Globe, BarChart3
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
const llmProviders = [
  { id: 'ollama', name: 'Ollama (Local)', models: ['llama3.2', 'gemma2', 'mistral', 'phi3', 'qwen2.5'], local: true },
  { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'], local: false },
];

// ─── Pipeline Analytics Panel ─────────────────────────────────────
function PipelineAnalytics({ parseResult, chunkResult, embedResult, retrievalResults, generationResult, buildComplete, buildTimeMs }: {
  parseResult: any;
  chunkResult: any;
  embedResult: any;
  retrievalResults: any[];
  generationResult: any;
  buildComplete: boolean;
  buildTimeMs: number;
}) {
  const metrics = [];

  if (parseResult) {
    metrics.push({ label: 'Characters', value: formatNumber(parseResult.characters || 0), icon: FileText, color: 'text-blue-400' });
    metrics.push({ label: 'Words', value: formatNumber(parseResult.words || 0), icon: FileText, color: 'text-cyan-400' });
  }
  if (chunkResult) {
    metrics.push({ label: 'Chunks', value: chunkResult.count || 0, icon: Layers, color: 'text-teal-400' });
    metrics.push({ label: 'Avg Chunk Size', value: `${Math.round(chunkResult.avg_chunk_size || 0)} chars`, icon: Layers, color: 'text-emerald-400' });
    if (chunkResult.processing_time_ms) {
      metrics.push({ label: 'Chunk Time', value: `${chunkResult.processing_time_ms.toFixed(0)}ms`, icon: Clock, color: 'text-amber-400' });
    }
  }
  if (embedResult) {
    metrics.push({ label: 'Embeddings', value: embedResult.count || 0, icon: Brain, color: 'text-violet-400' });
    metrics.push({ label: 'Dimensions', value: `${embedResult.dimensions || 0}d`, icon: Brain, color: 'text-purple-400' });
    if (embedResult.inference_time_ms) {
      metrics.push({ label: 'Embed Time', value: `${embedResult.inference_time_ms.toFixed(0)}ms`, icon: Clock, color: 'text-orange-400' });
    }
  }
  if (retrievalResults.length > 0) {
    const avgScore = retrievalResults.reduce((s, r) => s + (r.score || 0), 0) / retrievalResults.length;
    metrics.push({ label: 'Results', value: retrievalResults.length, icon: Search, color: 'text-green-400' });
    metrics.push({ label: 'Avg Score', value: `${(avgScore * 100).toFixed(1)}%`, icon: Search, color: 'text-lime-400' });
  }
  if (generationResult) {
    metrics.push({ label: 'Tokens', value: generationResult.total_tokens || 0, icon: MessageSquare, color: 'text-yellow-400' });
    if (generationResult.total_time_ms) {
      metrics.push({ label: 'Gen Time', value: `${generationResult.total_time_ms.toFixed(0)}ms`, icon: Clock, color: 'text-rose-400' });
    }
  }
  if (buildComplete && buildTimeMs > 0) {
    metrics.push({ label: 'Total Time', value: `${(buildTimeMs / 1000).toFixed(1)}s`, icon: Zap, color: 'text-accent-primary' });
  }

  if (metrics.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="bg-bg-secondary rounded-xl border border-border-primary p-4"
    >
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

// ─── Pipeline Step Component ───────────────────────────────────────
function PipelineStepCard({
  step, index, isActive, isComplete, onClick, children
}: {
  step: { name: string; icon: any; color: string };
  index: number;
  isActive: boolean;
  isComplete: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {index > 0 && (
        <div className={cn(
          'absolute left-6 -top-3 w-0.5 h-3',
          isComplete ? 'bg-accent-primary' : 'bg-border-primary'
        )} />
      )}
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
          isActive ? 'bg-accent-glow border-accent-primary/20' :
          isComplete ? 'bg-emerald-500/5 border-emerald-500/20' :
          'bg-bg-secondary border-border-primary hover:border-border-secondary'
        )}
      >
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
          `bg-gradient-to-br ${step.color}`
        )}>
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-white" />
          ) : (
            <step.icon className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="text-left flex-1">
          <div className="text-sm font-medium text-text-primary">Step {index + 1}: {step.name}</div>
        </div>
        <ChevronRight className={cn('w-4 h-4 transition-transform', isActive && 'rotate-90')} />
      </button>
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 pl-6">{children}</div>
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
  const [retrievalResults, setRetrievalResults] = useState<any[]>([]);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check backend connection on mount
  useEffect(() => {
    healthAPI.check()
      .then(() => store.setBackendConnected(true))
      .catch(() => store.setBackendConnected(false));
  }, []);

  // ─── File Upload ───────────────────────────────────────────────
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    for (const file of Array.from(files)) {
      try {
        const result = await parseAPI.uploadFile(file);
        if (result.success) {
          store.addParsedFile({
            name: result.file_name,
            text: result.text,
            type: result.file_type,
            size: result.file_size,
            words: result.words || 0,
            characters: result.characters || 0,
            pages: result.pages,
            language: result.language,
            metadata: result.metadata,
          });
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

  // ─── Chunk Text ───────────────────────────────────────────────
  const handleChunk = async () => {
    if (!store.currentText) return;
    setError(null);
    try {
      const result = await chunkAPI.chunk({
        text: store.currentText,
        method: store.chunkMethod,
        chunk_size: store.chunkSize,
        overlap: store.chunkOverlap,
      });
      if (result.success) {
        store.setChunks(result.chunks);
        setChunkResult(result);
      } else {
        setError(result.error || 'Chunking failed');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ─── Build Full Pipeline ──────────────────────────────────────
  const buildPipeline = async () => {
    if (!store.currentText) {
      setError('No text to process. Upload a file or paste text first.');
      return;
    }

    setIsBuilding(true);
    setError(null);
    setRetrievalResults([]);
    setGenerationResult(null);
    const startTime = Date.now();

    try {
      // Step 1: Chunk
      setActiveStep(1);
      const chunks = await chunkAPI.chunk({
        text: store.currentText,
        method: store.chunkMethod,
        chunk_size: store.chunkSize,
        overlap: store.chunkOverlap,
      });
      if (!chunks.success) throw new Error(chunks.error || 'Chunking failed');
      store.setChunks(chunks.chunks);
      setChunkResult(chunks);

      // Step 2: Embed
      setActiveStep(2);
      const chunkTexts = chunks.chunks.map((c: any) => c.text);
      const embeddings = await embedAPI.generate({
        texts: chunkTexts,
        model: store.embeddingModel,
      });
      if (!embeddings.success) throw new Error(embeddings.error || 'Embedding failed');
      setEmbedResult(embeddings);

      // Step 3: Store
      setActiveStep(3);
      const ids = chunks.chunks.map((c: any) => c.id);
      const metadata = chunks.chunks.map((c: any) => c.metadata);
      await vectorAPI.add({
        ids,
        embeddings: embeddings.embeddings,
        texts: chunkTexts,
        metadata,
        collection: store.collectionName,
        store_type: store.vectorStore,
        dimensions: embeddings.dimensions,
      });

      setBuildComplete(true);
      setBuildTimeMs(Date.now() - startTime);
      setActiveStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsBuilding(false);
    }
  };

  // ─── Send Query (Retrieve + Generate) ─────────────────────────
  const sendQuery = async () => {
    if (!query.trim() || !buildComplete) return;

    const userMsg = { role: 'user' as const, content: query };
    store.addChatMessage(userMsg);
    setQuery('');
    setIsSearching(true);
    setError(null);

    try {
      // Retrieve relevant chunks
      const retrieval = await retrieveAPI.search({
        query,
        top_k: 5,
        collection: store.collectionName,
        store_type: store.vectorStore,
        use_reranker: true,
        embedding_model: store.embeddingModel,
      });

      if (retrieval.success) {
        setRetrievalResults(retrieval.results);
        store.incrementQueries();

        // Generate answer
        const context = retrieval.results.map((r: any) => r.text);
        const generation = await llmAPI.generate({
          query,
          context,
          provider: store.llmProvider,
          model: store.llmModel,
          api_key: store.openaiApiKey || undefined,
        });

        if (generation.success) {
          setGenerationResult(generation);
          store.addChatMessage({
            role: 'assistant',
            content: generation.answer,
            metadata: {
              chunks: retrieval.results.length,
              sources: retrieval.results.map((r: any) => r.metadata?.source || 'unknown').filter((s: string, i: number, a: string[]) => a.indexOf(s) === i),
              latency: `${(retrieval.timing.total_ms / 1000).toFixed(2)}s`,
              confidence: retrieval.results[0]?.score || 0,
            },
          });
        } else {
          store.addChatMessage({
            role: 'assistant',
            content: `I found relevant chunks but couldn't generate an answer: ${generation.error || 'LLM not available'}`,
          });
        }
      }
    } catch (err: any) {
      store.addChatMessage({
        role: 'assistant',
        content: `Error: ${err.message}`,
      });
    } finally {
      setIsSearching(false);
    }
  };

  // ─── Pipeline Steps Config ────────────────────────────────────
  const steps = [
    { name: 'Ingestion', icon: Upload, color: 'from-blue-500 to-cyan-500' },
    { name: 'Chunking', icon: Layers, color: 'from-cyan-500 to-teal-500' },
    { name: 'Embeddings', icon: Brain, color: 'from-teal-500 to-emerald-500' },
    { name: 'Vector Store', icon: Database, color: 'from-emerald-500 to-green-500' },
    { name: 'Retrieval', icon: Search, color: 'from-green-500 to-lime-500' },
    { name: 'Generation', icon: MessageSquare, color: 'from-lime-500 to-yellow-500' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border-primary bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">RAG Builder</h1>
              <p className="text-xs text-text-tertiary">
                {store.backendConnected ? '🟢 Backend connected' : '🔴 Backend offline'}
                {' • Build production-ready RAG pipelines'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={buildPipeline}
              disabled={isBuilding || !store.currentText}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all',
                isBuilding
                  ? 'bg-accent-dim text-white/50 cursor-not-allowed'
                  : buildComplete
                  ? 'bg-emerald-500 text-white'
                  : 'bg-accent-primary text-white hover:shadow-lg hover:shadow-accent-primary/25'
              )}
            >
              {isBuilding ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Building...</>
              ) : buildComplete ? (
                <><CheckCircle2 className="w-4 h-4" /> Pipeline Ready</>
              ) : (
                <><Play className="w-4 h-4" /> Build Pipeline</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        {/* Pipeline Analytics - Shows real-time metrics */}
        <PipelineAnalytics
          parseResult={parseResult}
          chunkResult={chunkResult}
          embedResult={embedResult}
          retrievalResults={retrievalResults}
          generationResult={generationResult}
          buildComplete={buildComplete}
          buildTimeMs={buildTimeMs}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline Configuration */}
          <div className="lg:col-span-2 space-y-3">
            {/* Step 1: Ingestion */}
            <PipelineStepCard step={steps[0]} index={0} isActive={activeStep === 0}
              isComplete={store.parsedFiles.length > 0} onClick={() => setActiveStep(0)}>
              <div className="bg-bg-secondary rounded-xl border border-border-primary p-4 space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="*/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border-secondary rounded-xl p-8 text-center cursor-pointer hover:border-accent-primary/50 hover:bg-accent-glow/50 transition-all"
                >
                  <Upload className="w-10 h-10 text-text-muted mx-auto mb-3" />
                  <p className="text-sm text-text-secondary mb-1">Drop files here or click to upload</p>
                  <p className="text-xs text-text-tertiary">Any file type supported</p>
                </div>

                {/* Manual text input */}
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-2 block">Or paste text directly</label>
                  <textarea
                    value={store.currentText}
                    onChange={(e) => store.setCurrentText(e.target.value)}
                    placeholder="Paste your text here..."
                    className="w-full h-24 bg-bg-elevated rounded-lg border border-border-primary px-4 py-3 text-sm text-text-primary resize-none focus:outline-none focus:border-accent-primary"
                  />
                </div>

                {store.parsedFiles.length > 0 && (
                  <div className="space-y-2">
                    {store.parsedFiles.map((file, i) => {
                      const ft = supportedTypes.find(f => f.ext === `.${file.type}`) || supportedTypes[0];
                      return (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-bg-elevated">
                          <ft.icon className={cn('w-4 h-4', ft.color)} />
                          <span className="text-xs text-text-primary flex-1 truncate">{file.name}</span>
                          <span className="text-[10px] text-text-tertiary">{file.words} words</span>
                          <button onClick={() => store.removeParsedFile(file.name)} className="text-text-muted hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {parseResult && (
                  <div className="bg-bg-elevated rounded-lg p-3 text-xs text-text-tertiary space-y-1">
                    <div>📄 {parseResult.file_name} • {parseResult.file_type.toUpperCase()}</div>
                    <div>📝 {formatNumber(parseResult.characters || 0)} chars • {formatNumber(parseResult.words || 0)} words{parseResult.pages ? ` • ${parseResult.pages} pages` : ''}</div>
                    <div>🌐 Language: {parseResult.language || 'unknown'}</div>
                  </div>
                )}
              </div>
            </PipelineStepCard>

            {/* Step 2: Chunking */}
            <PipelineStepCard step={steps[1]} index={1} isActive={activeStep === 1}
              isComplete={store.chunks.length > 0} onClick={() => setActiveStep(1)}>
              <div className="bg-bg-secondary rounded-xl border border-border-primary p-4 space-y-4">
                <div className="space-y-2">
                  {chunkingMethods.map((m) => (
                    <button key={m.id} onClick={() => store.setChunkMethod(m.id)}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left',
                        store.chunkMethod === m.id ? 'bg-accent-glow border-accent-primary/20' : 'bg-bg-elevated border-border-primary hover:border-border-secondary'
                      )}>
                      <div>
                        <div className="text-sm font-medium text-text-primary">{m.name}</div>
                        <div className="text-[10px] text-text-tertiary">{m.desc}</div>
                      </div>
                      {store.chunkMethod === m.id && <CheckCircle2 className="w-4 h-4 text-accent-primary" />}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-2 block">Chunk Size: {store.chunkSize}</label>
                    <input type="range" min={100} max={2000} step={100} value={store.chunkSize}
                      onChange={(e) => store.setChunkSize(Number(e.target.value))} className="w-full accent-accent-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-2 block">Overlap: {store.chunkOverlap}</label>
                    <input type="range" min={0} max={200} step={10} value={store.chunkOverlap}
                      onChange={(e) => store.setChunkOverlap(Number(e.target.value))} className="w-full accent-accent-primary" />
                  </div>
                </div>
                {chunkResult && (
                  <div className="bg-bg-elevated rounded-lg p-3 text-xs text-text-tertiary">
                    ✂️ {chunkResult.count} chunks • avg {Math.round(chunkResult.avg_chunk_size)} chars • {chunkResult.processing_time_ms?.toFixed(0)}ms
                  </div>
                )}
              </div>
            </PipelineStepCard>

            {/* Step 3: Embeddings */}
            <PipelineStepCard step={steps[2]} index={2} isActive={activeStep === 2}
              isComplete={!!embedResult} onClick={() => setActiveStep(2)}>
              <div className="bg-bg-secondary rounded-xl border border-border-primary p-4 space-y-2">
                {embeddingModels.map((m) => (
                  <button key={m.id} onClick={() => store.setEmbeddingModel(m.id)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left',
                      store.embeddingModel === m.id ? 'bg-accent-glow border-accent-primary/20' : 'bg-bg-elevated border-border-primary hover:border-border-secondary'
                    )}>
                    <div>
                      <div className="text-sm font-medium text-text-primary">{m.name}</div>
                      <div className="text-[10px] text-text-tertiary">{m.dims}d • {m.size} • {m.speed}</div>
                    </div>
                    {store.embeddingModel === m.id && <CheckCircle2 className="w-4 h-4 text-accent-primary" />}
                  </button>
                ))}
                {embedResult && (
                  <div className="bg-bg-elevated rounded-lg p-3 text-xs text-text-tertiary">
                    🧠 {embedResult.count} embeddings • {embedResult.dimensions}d • download: {embedResult.download_time_ms?.toFixed(0)}ms • inference: {embedResult.inference_time_ms?.toFixed(0)}ms
                  </div>
                )}
              </div>
            </PipelineStepCard>

            {/* Step 4: Vector Store */}
            <PipelineStepCard step={steps[3]} index={3} isActive={activeStep === 3}
              isComplete={buildComplete} onClick={() => setActiveStep(3)}>
              <div className="bg-bg-secondary rounded-xl border border-border-primary p-4 space-y-2">
                {vectorDBs.map((db) => (
                  <button key={db.id} onClick={() => store.setVectorStore(db.id)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left',
                      store.vectorStore === db.id ? 'bg-accent-glow border-accent-primary/20' : 'bg-bg-elevated border-border-primary hover:border-border-secondary'
                    )}>
                    <div>
                      <div className="text-sm font-medium text-text-primary">{db.name}</div>
                      <div className="text-[10px] text-text-tertiary">{db.desc}</div>
                    </div>
                    {store.vectorStore === db.id && <CheckCircle2 className="w-4 h-4 text-accent-primary" />}
                  </button>
                ))}
              </div>
            </PipelineStepCard>

            {/* Step 5: Retrieval */}
            <PipelineStepCard step={steps[4]} index={4} isActive={activeStep === 4}
              isComplete={retrievalResults.length > 0} onClick={() => setActiveStep(4)}>
              <div className="bg-bg-secondary rounded-xl border border-border-primary p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-2 block">Retrieval Strategy</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Semantic Search', 'Keyword Search', 'Hybrid Search', 'MMR'].map((s) => (
                      <button key={s} className="px-3 py-2 rounded-lg bg-bg-elevated text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all border border-border-primary">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-2 block">Top K: 5</label>
                  <input type="range" min={1} max={20} defaultValue={5} className="w-full accent-accent-primary" />
                </div>
                {retrievalResults.length > 0 && (
                  <div className="space-y-2">
                    {retrievalResults.map((r: any, i: number) => (
                      <div key={i} className="bg-bg-elevated rounded-lg p-3 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-accent-primary font-mono">#{r.rank}</span>
                          <span className="text-text-tertiary">{(r.score * 100).toFixed(1)}% match</span>
                        </div>
                        <p className="text-text-secondary line-clamp-2">{r.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PipelineStepCard>

            {/* Step 6: Generation */}
            <PipelineStepCard step={steps[5]} index={5} isActive={activeStep === 5}
              isComplete={!!generationResult} onClick={() => setActiveStep(5)}>
              <div className="bg-bg-secondary rounded-xl border border-border-primary p-4 space-y-3">
                {llmProviders.map((p) => (
                  <div key={p.id}>
                    <button onClick={() => { store.setLlmProvider(p.id); store.setLlmModel(p.models[0]); }}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left mb-2',
                        store.llmProvider === p.id ? 'bg-accent-glow border-accent-primary/20' : 'bg-bg-elevated border-border-primary hover:border-border-secondary'
                      )}>
                      <div>
                        <div className="text-sm font-medium text-text-primary">{p.name}</div>
                        <div className="text-[10px] text-text-tertiary">{p.local ? 'Local' : 'API'} · {p.models.length} models</div>
                      </div>
                      {store.llmProvider === p.id && <CheckCircle2 className="w-4 h-4 text-accent-primary" />}
                    </button>
                    {store.llmProvider === p.id && (
                      <div className="flex flex-wrap gap-2 ml-4 mb-2">
                        {p.models.map((m) => (
                          <button key={m} onClick={() => store.setLlmModel(m)}
                            className={cn(
                              'px-3 py-1 rounded-full text-xs transition-all',
                              store.llmModel === m ? 'bg-accent-primary text-white' : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
                            )}>{m}</button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {store.llmProvider === 'openai' && (
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-2 block">OpenAI API Key</label>
                    <input type="password" value={store.openaiApiKey} onChange={(e) => store.setOpenaiApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-bg-elevated rounded-lg border border-border-primary px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary" />
                  </div>
                )}
                {generationResult && (
                  <div className="bg-bg-elevated rounded-lg p-3 text-xs text-text-tertiary space-y-1">
                    <div>🤖 {generationResult.model} via {generationResult.provider}</div>
                    <div>📊 Tokens: {generationResult.total_tokens} • Time: {generationResult.total_time_ms?.toFixed(0)}ms</div>
                  </div>
                )}
              </div>
            </PipelineStepCard>
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-1">
            <div className="bg-bg-secondary rounded-xl border border-border-primary h-[calc(100vh-120px)] sticky top-20 flex flex-col">
              <div className="p-4 border-b border-border-primary">
                <h3 className="text-sm font-semibold text-text-primary">Chat with your RAG</h3>
                <p className="text-[10px] text-text-tertiary mt-1">
                  {buildComplete ? '🟢 Pipeline ready - ask anything!' : 'Build the pipeline first to start chatting'}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {store.chatMessages.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare className="w-10 h-10 text-text-muted mx-auto mb-3" />
                    <p className="text-sm text-text-tertiary">No messages yet</p>
                  </div>
                )}
                {store.chatMessages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'rounded-xl p-3 text-sm',
                      msg.role === 'user' ? 'bg-accent-primary/10 ml-8' : 'bg-bg-elevated mr-4'
                    )}>
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
                {isSearching && (
                  <div className="flex items-center gap-2 text-xs text-text-tertiary">
                    <div className="w-3 h-3 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                    Searching and generating...
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border-primary">
                <div className="flex gap-2">
                  <input value={query} onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendQuery()}
                    disabled={!buildComplete}
                    placeholder={buildComplete ? 'Ask a question...' : 'Build pipeline first'}
                    className="flex-1 bg-bg-elevated rounded-lg border border-border-primary px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary disabled:opacity-50" />
                  <button onClick={sendQuery} disabled={!buildComplete || !query.trim() || isSearching}
                    className="px-4 py-2.5 rounded-lg bg-accent-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-dim transition-all">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
