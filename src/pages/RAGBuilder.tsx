import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Upload, FileText, Layers, Brain, Database, Search, MessageSquare,
  CheckCircle2, AlertCircle, Zap, X, RefreshCcw, Save, FolderOpen,
  BarChart3, Trash2, Globe, Key, ChevronLeft, ChevronRight,
  Download, Plus, Clock
} from 'lucide-react';
import { cn, formatNumber } from '../lib/utils';
import { useAppStore } from '../store/appStore';
import {
  parseAPI, chunkAPI, embedAPI, vectorAPI, retrieveAPI, llmAPI, healthAPI, uploadAPI, scrapeAPI, projectAPI
} from '../services/api';
import { PipelineTimeline, PIPELINE_STEPS } from './workspace/PipelineTimeline';
import { LeftSidebar } from './workspace/LeftSidebar';
import { ChatPanel } from './workspace/ChatPanel';
import { ResetDialog } from './workspace/ResetDialog';
import type { FileCategory, ResetOptions } from './workspace/types';

// ─── Constants ───────────────────────────────────────────────────
const chunkingMethods = [
  { id: 'recursive', name: 'Recursive Character', desc: 'Splits by separators (\\n\\n, \\n, ., space)' },
  { id: 'sentence', name: 'Sentence-based', desc: 'Groups sentences into chunks' },
  { id: 'semantic', name: 'Semantic Chunking', desc: 'Splits by topic shifts' },
  { id: 'markdown', name: 'Markdown-aware', desc: 'Respects markdown headers' },
  { id: 'token', name: 'Token-based', desc: 'Splits by token count' },
  { id: 'sliding_window', name: 'Sliding Window', desc: 'Fixed window with overlap' },
  { id: 'parent_child', name: 'Parent-Child', desc: 'Hierarchical chunks' },
];

const embeddingModels = [
  { id: 'all-MiniLM-L6-v2', name: 'MiniLM L6', dims: 384, speed: 'Fast' },
  { id: 'BAAI/bge-small-en-v1.5', name: 'BGE Small', dims: 384, speed: 'Medium' },
  { id: 'intfloat/e5-small-v2', name: 'E5 Small', dims: 384, speed: 'Medium' },
  { id: 'all-mpnet-base-v2', name: 'MPNet Base', dims: 768, speed: 'Slow' },
];

const vectorDBs = [
  { id: 'faiss_flat', name: 'FAISS Flat', desc: 'Exact nearest neighbor' },
  { id: 'faiss_hnsw', name: 'FAISS HNSW', desc: 'Approximate NN (faster)' },
  { id: 'chromadb', name: 'ChromaDB', desc: 'Open-source embedding DB' },
];

// ─── Step Content Wrapper ────────────────────────────────────────
function StepCard({ title, icon: Icon, color, description, children }: {
  title: string; icon: any; color: string; description: string; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card-beige overflow-hidden"
    >
      <div className="p-5 border-b border-border-primary bg-gradient-to-r from-transparent via-accent-primary/[0.02] to-transparent">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm', color)}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">{title}</h3>
            <p className="text-xs text-text-muted">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

// ─── Error Recovery Banner ──────────────────────────────────────
function ErrorBanner({ error, onDismiss, onRetry, onSkip, onGoBack }: {
  error: string;
  onDismiss: () => void;
  onRetry?: () => void;
  onSkip?: () => void;
  onGoBack?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/20"
    >
      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-red-600 mb-1">Error</p>
        <p className="text-[11px] text-red-500/80">{error}</p>
        <div className="flex items-center gap-2 mt-2">
          {onRetry && (
            <button onClick={onRetry} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-[10px] font-medium text-red-600 hover:bg-red-500/20 transition-all">
              <RefreshCcw className="w-3 h-3" /> Retry
            </button>
          )}
          {onSkip && (
            <button onClick={onSkip} className="px-2.5 py-1 rounded-lg bg-bg-elevated text-[10px] font-medium text-text-secondary hover:text-text-primary border border-border-primary transition-all">
              Skip Step
            </button>
          )}
          {onGoBack && (
            <button onClick={onGoBack} className="px-2.5 py-1 rounded-lg bg-bg-elevated text-[10px] font-medium text-text-secondary hover:text-text-primary border border-border-primary transition-all">
              Go Back
            </button>
          )}
          <button onClick={() => {
            // Navigate to the current step so user can edit its parameters
            // This dismisses the error and lets the user tweak settings
            onDismiss();
          }} className="px-2.5 py-1 rounded-lg bg-bg-elevated text-[10px] font-medium text-text-secondary hover:text-text-primary border border-border-primary transition-all">
            Edit Parameters
          </button>
        </div>
      </div>
      <button onClick={onDismiss} className="p-1 hover:bg-red-500/10 rounded-lg transition-all shrink-0">
        <X className="w-3 h-3 text-red-400" />
      </button>
    </motion.div>
  );
}

// ─── Main Workspace ──────────────────────────────────────────────
export default function RAGBuilder() {
  const store = useAppStore();
  const [activeStep, setActiveStep] = useState(0);
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
  const [stepProcessing, setStepProcessing] = useState<Record<number, boolean>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadingCategory, setUploadingCategory] = useState<FileCategory | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetDialogVariant, setResetDialogVariant] = useState<'reset' | 'new-project'>('reset');
  const [stepTimings, setStepTimings] = useState<Record<string, number>>({});
  const [pipelineStatus, setPipelineStatus] = useState('idle');
  const [pipelineProgress, setPipelineProgress] = useState(0);

  const textInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // ─── Completion States ──────────────────────────────────────
  const completedSteps = new Set([
    ...(store.parsedFiles.length > 0 ? [0] : []),
    ...(store.chunks.length > 0 ? [1] : []),
    ...(store.totalVectors > 0 ? [2, 3] : []),
    ...(buildComplete ? [4, 5, 6] : []),
  ]);

  const failedSteps = new Set<number>();
  const processingSteps = new Set(
    Object.entries(stepProcessing).filter(([_, v]) => v).map(([k]) => Number(k))
  );

  useEffect(() => {
    healthAPI.check().then(() => store.setBackendConnected(true)).catch(() => store.setBackendConnected(false));
  }, []);

  // ─── Active jobs (for async upload polling) ──────────────────
  const activeJobsRef = useRef<{[jobId: string]: { file: File; category: FileCategory; controller: AbortController }}>({});
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    pollingIntervalRef.current = setInterval(async () => {
      const jobs = activeJobsRef.current;
      const jobIds = Object.keys(jobs);
      if (jobIds.length === 0) return;
      const updated = { ...jobs };
      let changed = false;
      for (const jobId of jobIds) {
        try {
          const job = await uploadAPI.getJobStatus(jobId);
          const jobInfo = updated[jobId];
          if (!jobInfo) continue;
          setUploadProgress(`${job.stage_label} ${jobInfo.file.name}`);
          if (job.status === 'completed' && job.result) {
            const result = job.result;
            if (result.success) {
              store.addParsedFile({
                name: result.file_name || jobInfo.file.name,
                text: result.text || '',
                type: result.file_type || 'binary',
                size: result.file_size || jobInfo.file.size,
                words: result.words || 0,
                characters: result.characters || 0,
                pages: result.pages,
                language: result.language,
                metadata: result.metadata,
              });
              if (result.text) {
                const existing = store.currentText;
                store.setCurrentText(
                  existing && existing.trim()
                    ? existing + '\n\n--- ' + (result.file_name || jobInfo.file.name) + ' ---\n\n' + result.text
                    : result.text
                );
              }
              setParseResult(result);
            } else {
              setError(result.error || `Failed to parse ${jobInfo.file.name}`);
            }
            delete updated[jobId];
            changed = true;
          } else if (job.status === 'failed') {
            setError(job.error || `Failed to process ${jobInfo.file.name}`);
            delete updated[jobId];
            changed = true;
          }
        } catch {
          delete updated[jobId];
          changed = true;
        }
      }
      if (changed) {
        activeJobsRef.current = updated;
        if (Object.keys(updated).length === 0) {
          setIsUploading(false);
          setUploadingCategory(null);
          setUploadProgress('');
        }
      }
    }, 800);
    return () => {
      if (pollingIntervalRef.current) { clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null; }
    };
  }, []);

  const handleCategoryUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, category: FileCategory) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);
    setIsUploading(true);
    setUploadingCategory(category);
    const existing = activeJobsRef.current;
    Object.values(existing).forEach(j => { try { j.controller.abort(); } catch {} });
    const newJobs: {[jobId: string]: { file: File; category: FileCategory; controller: AbortController }} = {};
    for (const file of Array.from(files)) {
      if (file.size > 100 * 1024 * 1024) {
        setError(`File "${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max 100MB.`);
        continue;
      }
      setUploadProgress(`Uploading ${file.name}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000);
      try {
        const result = await uploadAPI.streamUpload(file, controller.signal);
        clearTimeout(timeoutId);
        if (result.status === 'failed') { setError(result.error || `Upload failed for ${file.name}`); continue; }
        newJobs[result.job_id] = { file, category, controller };
      } catch (err: any) {
        clearTimeout(timeoutId);
        setError(err.name === 'AbortError' ? `Upload timed out for ${file.name}.` : err.message || `Upload failed for ${file.name}`);
      }
    }
    activeJobsRef.current = { ...activeJobsRef.current, ...newJobs };
    if (Object.keys(newJobs).length === 0) { setIsUploading(false); setUploadingCategory(null); setUploadProgress(''); }
    if (category === 'text' && textInputRef.current) textInputRef.current.value = '';
    if (category === 'audio' && audioInputRef.current) audioInputRef.current.value = '';
    if (category === 'video' && videoInputRef.current) videoInputRef.current.value = '';
  }, []);

  useEffect(() => {
    return () => {
      Object.values(activeJobsRef.current).forEach(j => { try { j.controller.abort(); } catch {} });
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  const onTextUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleCategoryUpload(e, 'text'), [handleCategoryUpload]);
  const onAudioUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleCategoryUpload(e, 'audio'), [handleCategoryUpload]);
  const onVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleCategoryUpload(e, 'video'), [handleCategoryUpload]);

  // ─── Pipeline Handlers ──────────────────────────────────────
  const completeIngestion = () => {
    if (store.parsedFiles.length > 0 || store.currentText.trim()) {
      setPipelineStatus('running');
      setActiveStep(1);
    }
  };

  const handleChunk = async () => {
    if (!store.currentText) { setError('No text to chunk.'); return; }
    setStepProcessing(p => ({ ...p, 1: true })); setError(null);
    const start = Date.now();
    try {
      const result = await chunkAPI.chunk({ text: store.currentText, method: store.chunkMethod, chunk_size: store.chunkSize, overlap: store.chunkOverlap });
      if (result.success) { store.setChunks(result.chunks); setChunkResult(result); setStepTimings(t => ({ ...t, '1': Date.now() - start })); setActiveStep(2); }
      else setError(result.error || 'Chunking failed');
    } catch (err: any) { setError(err.message); }
    finally { setStepProcessing(p => ({ ...p, 1: false })); }
  };

  const handleEmbed = async () => {
    if (store.chunks.length === 0) { setError('No chunks to embed.'); return; }
    setStepProcessing(p => ({ ...p, 2: true })); setError(null);
    const start = Date.now();
    try {
      const embeddings = await embedAPI.generate({ texts: store.chunks.map((c: any) => c.text), model: store.embeddingModel });
      if (embeddings.success) { setEmbedResult(embeddings); setStepTimings(t => ({ ...t, '2': Date.now() - start })); setActiveStep(3); }
      else setError(embeddings.error || 'Embedding failed');
    } catch (err: any) { setError(err.message); }
    finally { setStepProcessing(p => ({ ...p, 2: false })); }
  };

  const handleStore = async () => {
    if (store.chunks.length === 0 || !embedResult) { setError('No embeddings to store.'); return; }
    setStepProcessing(p => ({ ...p, 3: true })); setError(null);
    const start = Date.now();
    try {
      const result = await vectorAPI.add({
        ids: store.chunks.map((c: any) => c.id),
        embeddings: embedResult.embeddings,
        texts: store.chunks.map((c: any) => c.text),
        collection: store.collectionName,
        store_type: store.vectorStore,
        dimensions: embedResult.dimensions,
      });
      if (result.success) { store.setTotalVectors(result.total_vectors); setStepTimings(t => ({ ...t, '3': Date.now() - start })); setActiveStep(4); setBuildComplete(true); }
      else setError('Failed to store vectors');
    } catch (err: any) { setError(err.message); }
    finally { setStepProcessing(p => ({ ...p, 3: false })); }
  };

  const handleTestRetrieval = async (q: string) => {
    if (!q.trim() || !buildComplete) return;
    setStepProcessing(p => ({ ...p, 4: true })); setError(null);
    try {
      const result = await retrieveAPI.search({ query: q, collection: store.collectionName, store_type: store.vectorStore, top_k: 5, embedding_model: store.embeddingModel });
      if (result.success) { setRetrievalResults(result.results); setStepTimings(t => ({ ...t, '4': result.timing.total_ms })); }
      else setError('Retrieval failed');
    } catch (err: any) { setError(err.message); }
    finally { setStepProcessing(p => ({ ...p, 4: false })); }
  };

  const handleScrapeUrl = async (url: string) => {
    setError(null);
    try {
      const result = await scrapeAPI.scrapeUrl(url);
      if (result.success) {
        store.addParsedFile({ name: result.file_name || result.title, text: result.text, type: 'text', size: result.characters, words: result.words, characters: result.characters });
        store.setCurrentText(store.currentText + (store.currentText ? '\n\n---\n\n' : '') + result.text);
        setParseResult(result);
      } else setError(result.error || 'Failed to scrape URL');
    } catch (err: any) { setError(err.message); }
  };

  const sendQuery = async () => {
    if (!query.trim() || !buildComplete) return;
    setIsSearching(true);
    setError(null);
    store.addChatMessage({ role: 'user', content: query });
    const startTime = Date.now();
    try {
      const retrieval = await retrieveAPI.search({ query, collection: store.collectionName, store_type: store.vectorStore, top_k: 5, embedding_model: store.embeddingModel });
      if (retrieval.success && retrieval.results.length > 0) {
        const gen = await llmAPI.generate({ query, context: retrieval.results.map((r: any) => r.text), provider: store.llmProvider, model: store.llmModel });
        const latency = ((Date.now() - startTime) / 1000).toFixed(1);
        store.addChatMessage({
          role: 'assistant',
          content: gen.success ? gen.answer : `Error: ${gen.error}`,
          metadata: {
            chunks: retrieval.results.length,
            latency: `${latency}s`,
            confidence: retrieval.results.reduce((max: number, r: any) => Math.max(max, r.score || 0), 0),
            evidence: retrieval.results.map((r: any, i: number) => ({
              rank: r.rank || i + 1,
              score: r.score || 0,
              text: r.text,
              source: store.parsedFiles[0]?.name || 'vector_store',
              chunk_id: r.id,
            })),
          },
        });
        store.incrementQueries();
        setStepTimings(t => ({ ...t, '5': Date.now() - startTime }));
      } else {
        store.addChatMessage({ role: 'assistant', content: 'No relevant documents found. Try uploading more files or adjusting your query.', metadata: { chunks: 0, latency: '0s' } });
      }
    } catch (err: any) {
      store.addChatMessage({ role: 'assistant', content: `Error: ${err.message}` });
    }
    setIsSearching(false);
    setQuery('');
    setPipelineStatus('idle');
  };

  // ─── Reset Workspace ─────────────────────────────────────────
  const handleReset = (options: ResetOptions) => {
    if (options.resetPipeline || options.resetEverything) {
      store.setChunks([]);
      store.setTotalVectors(0);
      setChunkResult(null);
      setEmbedResult(null);
      setRetrievalResults([]);
      setGenerationResult(null);
      setBuildComplete(false);
      setBuildTimeMs(0);
      setStepTimings({});
      setActiveStep(0);
    }
    if (options.removeFiles || options.resetEverything) {
      store.clearParsedFiles();
      store.setCurrentText('');
    }
    if (options.clearVectors || options.resetEverything) {
      vectorAPI.delete(store.collectionName, store.vectorStore).catch(() => {});
      store.setTotalVectors(0);
    }
    if (options.clearChat || options.resetEverything) {
      store.clearChat();
    }
    if (options.clearOutputs || options.resetEverything) {
      setParseResult(null);
      setGenerationResult(null);
    }
    setShowResetDialog(false);
    setError(null);
  };

  // ─── Step Navigation ─────────────────────────────────────────
  const goToStep = (stepIndex: number) => {
    if (completedSteps.has(stepIndex) || stepIndex === activeStep) {
      setActiveStep(stepIndex);
      setError(null);
    }
  };

  const goToNextStep = () => {
    if (activeStep < PIPELINE_STEPS.length - 1) setActiveStep(activeStep + 1);
  };

  const goToPrevStep = () => {
    if (activeStep > 0) setActiveStep(activeStep - 1);
  };

  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === PIPELINE_STEPS.length - 1;

  // ─── Project Management ─────────────────────────────────────
  const handleSaveProject = async () => {
    try {
      await projectAPI.create('workspace_' + Date.now(), `Saved at ${new Date().toLocaleString()}`);
      toast.success('Project saved successfully');
    } catch (err: any) {
      toast.error('Failed to save project: ' + err.message);
    }
  };

  const handleOpenProject = async () => {
    try {
      const projects = await projectAPI.list();
      if (projects.projects.length > 0) {
        const latest = projects.projects[0];
        const loaded = await projectAPI.get(latest.name);
        if (loaded.success) {
          toast.success(`Opened project: ${latest.name}`);
        }
      } else {
        toast.error('No saved projects found');
      }
    } catch (err: any) {
      toast.error('Failed to open project: ' + err.message);
    }
  };

  const handleExportProject = async () => {
    try {
      // Build a JSON snapshot of the current workspace state
      const snapshot = {
        name: 'workspace_export_' + Date.now(),
        exportedAt: new Date().toISOString(),
        parsedFiles: store.parsedFiles.map((f: any) => ({
          name: f.name,
          type: f.type,
          size: f.size,
          words: f.words,
          characters: f.characters,
          pages: f.pages,
          language: f.language,
        })),
        currentText: store.currentText.substring(0, 5000), // preview
        textLength: store.currentText.length,
        chunkMethod: store.chunkMethod,
        chunkSize: store.chunkSize,
        chunkOverlap: store.chunkOverlap,
        embeddingModel: store.embeddingModel,
        vectorStore: store.vectorStore,
        collectionName: store.collectionName,
        llmProvider: store.llmProvider,
        llmModel: store.llmModel,
        totalVectors: store.totalVectors,
        totalQueries: store.totalQueries,
        chunks: store.chunks.length,
      };
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rag-studio-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Project exported as JSON');
    } catch (err: any) {
      toast.error('Failed to export project: ' + err.message);
    }
  };

  const handleStartNewProject = () => {
    setResetDialogVariant('new-project');
    setShowResetDialog(true);
  };


  // ─── Render Step Content ─────────────────────────────────────
  const renderStepContent = () => {
    const step = PIPELINE_STEPS[activeStep];

    return (
      <div className="space-y-4">
        {error && (
          <ErrorBanner
            error={error}
            onDismiss={() => setError(null)}
            onRetry={() => { setError(null); setStepProcessing(p => ({ ...p, [activeStep]: false })); }}
            onSkip={() => { setError(null); activeStep < PIPELINE_STEPS.length - 1 && setActiveStep(activeStep + 1); }}
            onGoBack={() => { setError(null); activeStep > 0 && setActiveStep(activeStep - 1); }}
          />
        )}

        {/* Step 0: Ingestion */}
        {activeStep === 0 && (
          <StepCard title="Ingestion" icon={Upload} color="from-blue-500 to-cyan-500"
            description="Upload files, paste text, or import from URL to begin">
            <div className="space-y-4">
              {store.parsedFiles.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {store.parsedFiles.map((f: any, i: number) => (
                    <motion.div key={f.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated border border-border-primary hover:border-accent-primary/20 transition-all group">
                      <FileText className="w-5 h-5 text-accent-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary truncate">{f.name}</p>
                        <p className="text-xs text-text-muted">{formatNumber(f.characters || 0)} chars • {formatNumber(f.words || 0)} words</p>
                      </div>
                      <button onClick={() => store.removeParsedFile(f.name)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-7 h-7 text-text-muted" />
                  </div>
                  <p className="text-sm font-medium text-text-secondary mb-1">No data yet</p>
                  <p className="text-xs text-text-muted">Upload files from the Explorer sidebar, paste text below, or import from a URL</p>
                </div>
              )}

              {/* Paste text area */}
              <textarea
                value={store.currentText}
                onChange={(e) => store.setCurrentText(e.target.value)}
                placeholder="Or paste your text directly here..."
                className="w-full h-28 bg-bg-elevated rounded-xl border border-border-primary px-4 py-3 text-sm text-text-primary resize-none focus:outline-none focus:border-accent-primary transition-colors placeholder:text-text-muted"
              />

              <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={completeIngestion}
                disabled={store.parsedFiles.length === 0 && !store.currentText.trim()}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  store.parsedFiles.length > 0 || store.currentText.trim()
                    ? 'bg-emerald-500 text-white hover:shadow-lg hover:shadow-emerald-500/25'
                    : 'bg-bg-tertiary text-text-muted cursor-not-allowed'
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                Proceed to Chunking
              </motion.button>
            </div>
          </StepCard>
        )}

        {/* Step 1: Chunking */}
        {activeStep === 1 && (
          <StepCard title="Chunking" icon={Layers} color="from-cyan-500 to-teal-500"
            description="Split content into searchable chunks">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {chunkingMethods.map((m) => (
                  <button key={m.id} onClick={() => store.setChunkMethod(m.id)}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl border transition-all text-left',
                      store.chunkMethod === m.id ? 'bg-accent-glow border-accent-primary/30' : 'bg-bg-elevated border-border-primary hover:border-accent-primary/20'
                    )}>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-text-primary">{m.name}</div>
                      <div className="text-[10px] text-text-tertiary truncate">{m.desc}</div>
                    </div>
                    {store.chunkMethod === m.id && <CheckCircle2 className="w-4 h-4 text-accent-primary shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-secondary">Chunk Size</label>
                    <span className="text-xs font-mono text-accent-primary">{store.chunkSize}</span>
                  </div>
                  <input type="range" min={100} max={2000} step={100} value={store.chunkSize}
                    onChange={(e) => store.setChunkSize(Number(e.target.value))} className="w-full accent-accent-primary" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-secondary">Overlap</label>
                    <span className="text-xs font-mono text-accent-primary">{store.chunkOverlap}</span>
                  </div>
                  <input type="range" min={0} max={200} step={10} value={store.chunkOverlap}
                    onChange={(e) => store.setChunkOverlap(Number(e.target.value))} className="w-full accent-accent-primary" />
                </div>
              </div>
              {chunkResult && store.chunks.length > 0 && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className="text-sm font-medium text-emerald-700">{store.chunks.length} chunks created</span></div>
                  <p className="text-[10px] text-text-muted">Using {store.chunkMethod} method with {store.chunkSize} size and {store.chunkOverlap} overlap</p>
                </div>
              )}
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={handleChunk} disabled={!store.currentText || stepProcessing[1]}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                {stepProcessing[1] ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Layers className="w-4 h-4" />}
                {stepProcessing[1] ? 'Chunking...' : 'Generate Chunks'}
              </motion.button>
            </div>
          </StepCard>
        )}

        {/* Step 2: Embeddings */}
        {activeStep === 2 && (
          <StepCard title="Embeddings" icon={Brain} color="from-teal-500 to-emerald-500"
            description="Convert chunks into dense vector representations">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {embeddingModels.map((m) => (
                  <button key={m.id} onClick={() => store.setEmbeddingModel(m.id)}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl border transition-all text-left',
                      store.embeddingModel === m.id ? 'bg-accent-glow border-accent-primary/30' : 'bg-bg-elevated border-border-primary hover:border-accent-primary/20'
                    )}>
                    <div>
                      <div className="text-sm font-medium text-text-primary">{m.name}</div>
                      <div className="text-[10px] text-text-tertiary">{m.dims}d • {m.speed}</div>
                    </div>
                    {store.embeddingModel === m.id && <CheckCircle2 className="w-4 h-4 text-accent-primary shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
              {embedResult && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-700">{embedResult.count} embeddings generated</span>
                  </div>
                  <p className="text-[10px] text-text-muted">Model: {embedResult.model} • {embedResult.dimensions}d • {(embedResult.inference_time_ms / 1000).toFixed(1)}s</p>
                </div>
              )}
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={handleEmbed} disabled={store.chunks.length === 0 || stepProcessing[2]}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                {stepProcessing[2] ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Brain className="w-4 h-4" />}
                {stepProcessing[2] ? 'Generating Embeddings...' : 'Generate Embeddings'}
              </motion.button>
            </div>
          </StepCard>
        )}

        {/* Step 3: Vector Store */}
        {activeStep === 3 && (
          <StepCard title="Vector Store" icon={Database} color="from-emerald-500 to-green-500"
            description="Store embeddings for fast similarity search">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {vectorDBs.map((db) => (
                  <button key={db.id} onClick={() => store.setVectorStore(db.id)}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl border transition-all text-left',
                      store.vectorStore === db.id ? 'bg-accent-glow border-accent-primary/30' : 'bg-bg-elevated border-border-primary hover:border-accent-primary/20'
                    )}>
                    <div>
                      <div className="text-sm font-medium text-text-primary">{db.name}</div>
                      <div className="text-[10px] text-text-tertiary">{db.desc}</div>
                    </div>
                    {store.vectorStore === db.id && <CheckCircle2 className="w-4 h-4 text-accent-primary shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
              <div className="bg-bg-elevated rounded-xl p-3 border border-border-primary">
                <label className="text-xs font-medium text-text-secondary mb-1 block">Collection Name</label>
                <input value={store.collectionName} onChange={(e) => store.setCollectionName(e.target.value)}
                  className="w-full bg-white rounded-lg border border-border-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
                  placeholder="default" />
              </div>
              {store.totalVectors > 0 && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-700">{formatNumber(store.totalVectors)} vectors stored</span>
                  </div>
                  <p className="text-[10px] text-text-muted">Collection: {store.collectionName} • Store: {store.vectorStore}</p>
                </div>
              )}
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={handleStore} disabled={store.chunks.length === 0 || stepProcessing[3]}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                {stepProcessing[3] ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Database className="w-4 h-4" />}
                {stepProcessing[3] ? 'Storing...' : 'Store Vectors'}
              </motion.button>
            </div>
          </StepCard>
        )}

        {/* Step 4: Retrieval */}
        {activeStep === 4 && (
          <StepCard title="Retrieval" icon={Search} color="from-green-500 to-lime-500"
            description="Search the vector database for relevant chunks">
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  id="retrieval-query"
                  placeholder="Enter a test query..."
                  className="flex-1 bg-bg-elevated rounded-xl border border-border-primary px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors placeholder:text-text-muted"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = document.getElementById('retrieval-query') as HTMLInputElement;
                      if (input?.value.trim()) { handleTestRetrieval(input.value.trim()); }
                    }
                  }}
                />
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const input = document.getElementById('retrieval-query') as HTMLInputElement;
                    if (input?.value.trim()) handleTestRetrieval(input.value.trim());
                  }}
                  disabled={stepProcessing[4]}
                  className="px-5 py-3 rounded-xl bg-accent-primary text-white disabled:opacity-50 transition-all flex items-center gap-2">
                  {stepProcessing[4] ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
                  Search
                </motion.button>
              </div>
              {retrievalResults.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-secondary">{retrievalResults.length} results</span>
                    <span className="text-[10px] text-text-muted">Sorted by relevance</span>
                  </div>
                  {retrievalResults.map((r: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-bg-elevated border border-border-primary hover:border-accent-primary/20 transition-all group">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent-glow text-accent-primary text-xs font-bold shrink-0">
                        #{r.rank || i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-1.5 flex-1 rounded-full bg-bg-tertiary overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500/60 transition-all" style={{ width: `${(r.score || 0) * 100}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-emerald-600">{(r.score * 100).toFixed(0)}%</span>
                        </div>
                        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">{r.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </StepCard>
        )}

        {/* Step 5: Generation */}
        {activeStep === 5 && (
          <StepCard title="Generation" icon={MessageSquare} color="from-lime-500 to-yellow-500"
            description="Generate grounded answers using Groq Cloud LLM">
            <div className="space-y-4">
              {/* API Key */}
              <div className="frost-accent rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Key className="w-4 h-4 text-accent-primary" />
                  <span className="text-xs font-semibold text-text-primary">API Key (Optional - set in backend/.env)</span>
                </div>
                <div className="flex gap-2">
                  <input
                    id="api-key-input"
                    name="api-key"
                    type="password"
                    placeholder="Enter GROQ_API_KEY or set in backend/.env"
                    className="flex-1 bg-white rounded-lg border border-border-primary px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary transition-colors placeholder:text-text-muted"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('api-key-input') as HTMLInputElement;
                      if (input) input.type = input.type === 'password' ? 'text' : 'password';
                    }}
                    className="px-3 rounded-lg border border-border-primary bg-white hover:bg-bg-hover transition-all text-text-muted text-xs"
                  >
                    Show
                  </button>
                </div>
              </div>

              {/* Model Selector */}
              <div className="bg-gradient-to-br from-accent-primary/[0.03] to-accent-dim/[0.03] rounded-xl border border-accent-primary/15 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-dim flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-text-primary">Groq Cloud</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-text-muted">Fast inference • Free tier available</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', speed: 'Fastest', badge: 'Recommended' },
                    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', speed: 'Powerful', badge: '' },
                    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', speed: 'Smart', badge: '' },
                    { id: 'gemma2-9b-it', name: 'Gemma 2 9B', speed: 'Balanced', badge: '' },
                  ].map((m) => (
                    <button key={m.id} onClick={() => { store.setLlmProvider('groq'); store.setLlmModel(m.id); }}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border',
                        store.llmModel === m.id
                          ? 'bg-accent-primary text-white border-accent-primary shadow-sm'
                          : 'bg-white/60 text-text-secondary hover:text-text-primary border-border-primary hover:border-accent-primary/30'
                      )}>
                      <span>{m.name}</span>
                      {m.badge && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-bold">{m.badge}</span>}
                    </button>
                  ))}
                </div>
              </div>

              {buildComplete && (
                <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Pipeline ready. Use the Chat panel on the right to ask questions.
                </p>
              )}
            </div>
          </StepCard>
        )}

        {/* Step 6: Analytics */}
        {activeStep === 6 && (
          <StepCard title="Analytics" icon={BarChart3} color="from-yellow-500 to-orange-500"
            description="Pipeline performance metrics and insights">
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Files', value: store.parsedFiles.length, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { label: 'Chunks', value: store.chunks.length, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                  { label: 'Vectors', value: store.totalVectors, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  { label: 'Queries', value: store.totalQueries, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                ].map((m) => (
                  <div key={m.label} className={cn('rounded-xl p-4 border text-center', m.bg, 'border-border-primary')}>
                    <div className={cn('text-2xl font-bold', m.color)}>{formatNumber(m.value)}</div>
                    <div className="text-xs text-text-muted mt-1">{m.label}</div>
                  </div>
                ))}
              </div>
              {Object.keys(stepTimings).length > 0 && (
                <div className="bg-bg-elevated rounded-xl border border-border-primary p-4">
                  <h4 className="text-xs font-semibold text-text-primary mb-3">Step Timings</h4>
                  <div className="space-y-2">
                    {PIPELINE_STEPS.map((s) => {
                      const timing = stepTimings[s.id];
                      if (!timing) return null;
                      return (
                        <div key={s.id} className="flex items-center gap-3">
                          <span className="text-[10px] font-medium w-20 text-text-secondary">{s.name}</span>
                          <div className="flex-1 h-2 rounded-full bg-bg-tertiary overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (timing / 10000) * 100)}%` }}
                              className={cn('h-full rounded-full', s.color.split(' ')[0].replace('from-', 'bg-') || 'bg-accent-primary')}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-text-muted">{(timing / 1000).toFixed(1)}s</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </StepCard>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      {/* Top Navigation Bar */}
      <div className="shrink-0 border-b border-border-primary bg-bg-secondary/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-dim flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-text-primary">Workspace</h1>
                <p className="text-[9px] text-text-muted">RAG Pipeline Builder</p>
              </div>
            </div>
            {/* Project Actions */}
            <div className="flex items-center gap-1.5 ml-4 pl-4 border-l border-border-primary">
              <button onClick={handleSaveProject}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-transparent hover:border-border-primary transition-all">
                <Save className="w-3 h-3" /> Save
              </button>
              <button onClick={handleOpenProject}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-transparent hover:border-border-primary transition-all">
                <FolderOpen className="w-3 h-3" /> Open
              </button>
              <button onClick={handleExportProject}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-transparent hover:border-border-primary transition-all">
                <Download className="w-3 h-3" /> Export
              </button>
              <div className="w-px h-4 bg-border-primary mx-1" />
              <button onClick={handleStartNewProject}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-accent-primary hover:text-accent-secondary hover:bg-accent-glow border border-transparent hover:border-accent-primary/20 transition-all">
                <Plus className="w-3 h-3" /> New Project
              </button>
              <button onClick={() => importInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-transparent hover:border-border-primary transition-all">
                <FolderOpen className="w-3 h-3" /> Import
              </button>
              <input ref={importInputRef} type="file" accept=".json" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    try {
                      const data = JSON.parse(ev.target?.result as string);
                      if (data.collectionName) store.setCollectionName(data.collectionName);
                      if (data.chunkMethod) store.setChunkMethod(data.chunkMethod);
                      if (data.chunkSize) store.setChunkSize(data.chunkSize);
                      if (data.chunkOverlap !== undefined) store.setChunkOverlap(data.chunkOverlap);
                      if (data.embeddingModel) store.setEmbeddingModel(data.embeddingModel);
                      if (data.vectorStore) store.setVectorStore(data.vectorStore);
                      if (data.llmProvider) store.setLlmProvider(data.llmProvider);
                      if (data.llmModel) store.setLlmModel(data.llmModel);
                      toast.success(`Project imported: ${data.name || 'workspace'}`);
                    } catch (parseErr: any) {
                      toast.error('Invalid project file: ' + parseErr.message);
                    }
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium',
              store.backendConnected ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'
            )}>
              <span className={cn('w-1.5 h-1.5 rounded-full', store.backendConnected ? 'bg-emerald-500' : 'bg-red-500')} />
              {store.backendConnected ? 'Connected' : 'Disconnected'}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { setResetDialogVariant('reset'); setShowResetDialog(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/20"
            >
              <RefreshCcw className="w-3 h-3" />
              Reset
            </motion.button>
          </div>
        </div>
      </div>

      {/* Pipeline Timeline */}
      <div className="shrink-0">
        <PipelineTimeline
          activeStep={activeStep}
          completedSteps={completedSteps}
          failedSteps={failedSteps}
          processingSteps={processingSteps}
          onStepClick={goToStep}
          stepTimings={stepTimings}
        />
      </div>

      {/* Three-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar
          store={store}
          parseResult={parseResult}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          uploadingCategory={uploadingCategory}
          textInputRef={textInputRef}
          audioInputRef={audioInputRef}
          videoInputRef={videoInputRef}
          onTextUpload={onTextUpload}
          onAudioUpload={onAudioUpload}
          onVideoUpload={onVideoUpload}
          onScrapeUrl={handleScrapeUrl}
          activeStep={activeStep}
          completedSteps={completedSteps}
          buildComplete={buildComplete}
          onClearCurrentText={() => { store.setCurrentText(''); }}
          onStartNewProject={handleStartNewProject}
        />

        {/* Center Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-bg-secondary/30 to-transparent">
          {/* Step Header */}
          <div className="shrink-0 px-6 py-3 border-b border-border-primary bg-bg-secondary/40">
            <div className="flex items-center justify-between max-w-4xl">
              <div className="flex items-center gap-3">
                {(() => {
                  const StepIcon = PIPELINE_STEPS[activeStep].icon;
                  return (
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br', PIPELINE_STEPS[activeStep].color)}>
                      <StepIcon className="w-4 h-4 text-white" />
                    </div>
                  );
                })()}
                <div>
                  <span className="text-sm font-bold text-text-primary">{PIPELINE_STEPS[activeStep].name}</span>
                  <p className="text-[10px] text-text-muted">{PIPELINE_STEPS[activeStep].label}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-text-muted">
            <Clock className="w-3 h-3" />
            <span>~ {PIPELINE_STEPS[activeStep].estimate}</span>
            <span className="w-px h-3 bg-border-primary" />
            <span>Step {activeStep + 1} of {PIPELINE_STEPS.length}</span>
          </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto rag-panel-scroll p-6">
            <div className="max-w-4xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="shrink-0 px-6 py-3 border-t border-border-primary bg-bg-secondary/80 backdrop-blur-sm">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <motion.button
                whileHover={!isFirstStep ? { scale: 1.02 } : {}}
                whileTap={!isFirstStep ? { scale: 0.98 } : {}}
                onClick={goToPrevStep}
                disabled={isFirstStep}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all',
                  isFirstStep ? 'bg-bg-tertiary text-text-muted cursor-not-allowed opacity-50' : 'bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-primary hover:border-accent-primary/30'
                )}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </motion.button>

              <div className="flex items-center gap-2 text-[10px] text-text-muted">
                <div className="flex items-center gap-1">
                  {PIPELINE_STEPS.map((_, i) => (
                    <div key={i} className={cn(
                      'w-1.5 h-1.5 rounded-full transition-all',
                      completedSteps.has(i) ? 'bg-emerald-500' : i === activeStep ? 'bg-accent-primary' : 'bg-border-primary'
                    )} />
                  ))}
                </div>
              </div>

              <motion.button
                whileHover={!isLastStep ? { scale: 1.02 } : {}}
                whileTap={!isLastStep ? { scale: 0.98 } : {}}
                onClick={goToNextStep}
                disabled={isLastStep}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all',
                  isLastStep ? 'bg-bg-tertiary text-text-muted cursor-not-allowed opacity-50' : 'bg-accent-primary text-white hover:shadow-md hover:shadow-accent-primary/25'
                )}
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Right Chat Panel */}
        <ChatPanel
          chatMessages={store.chatMessages}
          isSearching={isSearching}
          buildComplete={buildComplete}
          query={query}
          setQuery={setQuery}
          sendQuery={sendQuery}
          pipelineStatus={pipelineStatus}
          pipelineProgress={pipelineProgress}
        />
      </div>

      {/* Reset Dialog */}
      <ResetDialog
        key={resetDialogVariant + String(showResetDialog)}
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onReset={handleReset}
        variant={resetDialogVariant}
      />
    </div>
  );
}
