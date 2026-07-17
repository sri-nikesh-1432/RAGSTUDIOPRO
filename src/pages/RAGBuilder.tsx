import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Layers, Brain, Database, Search, MessageSquare,
  CheckCircle2, AlertCircle, Zap, X,
  BarChart3, Target, Trash2
} from 'lucide-react';
import { cn, formatNumber } from '../lib/utils';
import { useAppStore } from '../store/appStore';
import {
  parseAPI, chunkAPI, embedAPI, vectorAPI, retrieveAPI, llmAPI, healthAPI
} from '../services/api';

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

// ─── Animated Pipeline Step Indicator ────────────────────────────
function PipelineIndicator({ steps, activeStep, completedSteps }: {
  steps: { name: string; icon: any; color: string }[];
  activeStep: number;
  completedSteps: Set<number>;
}) {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {steps.map((step, i) => {
        const isComplete = completedSteps.has(i);
        const isActive = activeStep === i;
        return (
          <div key={step.name} className="flex items-center">
            <motion.div
              animate={{ scale: isActive ? 1.15 : 1, opacity: isActive ? 1 : isComplete ? 0.8 : 0.4 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300',
                isComplete ? 'bg-emerald-500' : isActive ? `bg-gradient-to-br ${step.color}` : 'bg-bg-tertiary'
              )}
            >
              {isComplete ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              ) : (
                <step.icon className="w-3.5 h-3.5 text-white" />
              )}
            </motion.div>
            {i < steps.length - 1 && (
              <div className={cn(
                'w-6 h-0.5 mx-1 rounded-full transition-colors duration-300',
                isComplete ? 'bg-emerald-400' : 'bg-border-primary'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Left Panel: Knowledge Base ──────────────────────────────────
function KnowledgeBasePanel({ store, fileInputRef, onFileUpload, parseResult }: {
  store: any;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  parseResult: any;
}) {
  return (
    <div className="w-72 shrink-0 border-r border-border-primary bg-bg-secondary flex flex-col h-full">
      <div className="p-4 border-b border-border-primary">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-accent-primary" />
          <span className="text-sm font-semibold text-text-primary">Knowledge Base</span>
        </div>
        <input ref={fileInputRef} type="file" multiple accept="*/*" onChange={onFileUpload} className="hidden" />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent-primary text-white text-sm font-medium hover:shadow-lg hover:shadow-accent-primary/20 transition-all"
        >
          <Upload className="w-4 h-4" />
          Upload Files
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {store.parsedFiles.length === 0 && !store.currentText.trim() ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
              <FileText className="w-7 h-7 text-text-muted" />
            </div>
            <p className="text-sm font-medium text-text-secondary mb-1">No files uploaded</p>
            <p className="text-xs text-text-muted leading-relaxed">Upload documents, images, videos, or paste text to start building your knowledge base</p>
          </div>
        ) : (
          <AnimatePresence>
            {store.parsedFiles.map((file: any, i: number) => (
              <motion.div
                key={file.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.05 }}
                className="group bg-bg-elevated rounded-xl p-3 border border-border-primary hover:border-accent-primary/30 transition-all"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-accent-glow flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-accent-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-text-primary truncate">{file.name}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{file.type.toUpperCase()} • {formatNumber(file.words)} words</p>
                    {file.pages && <p className="text-[10px] text-text-muted">{file.pages} pages</p>}
                  </div>
                  <button onClick={() => store.removeParsedFile(file.name)} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {parseResult && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700">Parsed Successfully</span>
            </div>
            <div className="space-y-1 text-[10px] text-text-secondary">
              <div>{formatNumber(parseResult.characters || 0)} characters</div>
              <div>{formatNumber(parseResult.words || 0)} words</div>
              {parseResult.pages && <div>{parseResult.pages} pages</div>}
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        {store.chunks.length > 0 && (
          <div className="bg-bg-elevated rounded-xl p-3 border border-border-primary space-y-2">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Pipeline Stats</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <div className="text-sm font-bold text-accent-primary">{store.chunks.length}</div>
                <div className="text-[9px] text-text-muted">Chunks</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-emerald-500">{store.totalVectors}</div>
                <div className="text-[9px] text-text-muted">Vectors</div>
              </div>
            </div>
          </div>
        )}

        {/* Text Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Or Paste Text</label>
          <textarea
            value={store.currentText}
            onChange={(e) => store.setCurrentText(e.target.value)}
            placeholder="Paste your text here..."
            className="w-full h-24 bg-bg-elevated rounded-xl border border-border-primary px-3 py-2 text-xs text-text-primary resize-none focus:outline-none focus:border-accent-primary transition-colors placeholder:text-text-muted"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Center Panel: Pipeline Steps ────────────────────────────────
function PipelinePanel({ store, activeStep, setActiveStep, steps, stepProcessing, handlers, buildComplete, error }: {
  store: any;
  activeStep: number;
  setActiveStep: (s: number) => void;
  steps: { name: string; icon: any; color: string }[];
  stepProcessing: Record<number, boolean>;
  handlers: any;
  buildComplete: boolean;
  error: string | null;
}) {
  const [localChunkMethod, setLocalChunkMethod] = useState(store.chunkMethod);
  const [localEmbedModel, setLocalEmbedModel] = useState(store.embeddingModel);
  const [localVectorDB, setLocalVectorDB] = useState(store.vectorStore);
  const [retrievalQuery, setRetrievalQuery] = useState('');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Pipeline Indicator Bar */}
      <div className="border-b border-border-primary bg-bg-secondary/50">
        <PipelineIndicator steps={steps} activeStep={activeStep} completedSteps={
          new Set([
            ...(store.parsedFiles.length > 0 ? [0] : []),
            ...(store.chunks.length > 0 ? [1] : []),
            ...(store.totalVectors > 0 ? [2, 3] : []),
            ...(buildComplete ? [4] : []),
          ])
        } />
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Error Banner */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/20 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => {}} className="p-1 hover:bg-red-500/10 rounded-lg"><X className="w-3 h-3" /></button>
          </motion.div>
        )}

        {/* Step 1: Ingestion */}
        {activeStep === 0 && (
          <StepContent title="Ingestion" icon={Upload} color="from-blue-500 to-cyan-500"
            description="Upload files or paste text to begin">
            <div className="space-y-3">
              {store.parsedFiles.length > 0 ? (
                <div className="space-y-2">
                  {store.parsedFiles.map((f: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated border border-border-primary">
                      <FileText className="w-5 h-5 text-accent-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary truncate">{f.name}</p>
                        <p className="text-xs text-text-muted">{formatNumber(f.characters)} chars • {formatNumber(f.words)} words</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-tertiary text-center py-6">Upload files from the left panel or paste text</p>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => handlers.completeIngestion()}
                disabled={store.parsedFiles.length === 0 && !store.currentText.trim()}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  store.parsedFiles.length > 0 || store.currentText.trim()
                    ? 'bg-emerald-500 text-white hover:shadow-lg hover:shadow-emerald-500/25'
                    : 'bg-bg-tertiary text-text-muted cursor-not-allowed'
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                Complete Ingestion
              </motion.button>
            </div>
          </StepContent>
        )}

        {/* Step 2: Chunking */}
        {activeStep === 1 && (
          <StepContent title="Chunking" icon={Layers} color="from-cyan-500 to-teal-500"
            description="Split content into searchable chunks">
            <div className="space-y-4">
              <div className="space-y-1.5">
                {chunkingMethods.map((m) => (
                  <button key={m.id} onClick={() => { setLocalChunkMethod(m.id); store.setChunkMethod(m.id); }}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left',
                      localChunkMethod === m.id ? 'bg-accent-glow border-accent-primary/20' : 'bg-bg-elevated border-border-primary hover:border-border-secondary'
                    )}>
                    <div>
                      <div className="text-sm font-medium text-text-primary">{m.name}</div>
                      <div className="text-[10px] text-text-tertiary">{m.desc}</div>
                    </div>
                    {localChunkMethod === m.id && <CheckCircle2 className="w-4 h-4 text-accent-primary shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Size: {store.chunkSize}</label>
                  <input type="range" min={100} max={2000} step={100} value={store.chunkSize}
                    onChange={(e) => store.setChunkSize(Number(e.target.value))} className="w-full accent-accent-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Overlap: {store.chunkOverlap}</label>
                  <input type="range" min={0} max={200} step={10} value={store.chunkOverlap}
                    onChange={(e) => store.setChunkOverlap(Number(e.target.value))} className="w-full accent-accent-primary" />
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handlers.handleChunk}
                disabled={!store.currentText || stepProcessing[1]}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {stepProcessing[1] ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Layers className="w-4 h-4" />}
                Generate Chunks
              </motion.button>
            </div>
          </StepContent>
        )}

        {/* Step 3: Embeddings */}
        {activeStep === 2 && (
          <StepContent title="Embeddings" icon={Brain} color="from-teal-500 to-emerald-500"
            description="Convert chunks into dense vectors">
            <div className="space-y-3">
              {embeddingModels.map((m) => (
                <button key={m.id} onClick={() => { setLocalEmbedModel(m.id); store.setEmbeddingModel(m.id); }}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left',
                    localEmbedModel === m.id ? 'bg-accent-glow border-accent-primary/20' : 'bg-bg-elevated border-border-primary hover:border-border-secondary'
                  )}>
                  <div>
                    <div className="text-sm font-medium text-text-primary">{m.name}</div>
                    <div className="text-[10px] text-text-tertiary">{m.dims}d • {m.speed}</div>
                  </div>
                  {localEmbedModel === m.id && <CheckCircle2 className="w-4 h-4 text-accent-primary shrink-0" />}
                </button>
              ))}
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handlers.handleEmbed}
                disabled={store.chunks.length === 0 || stepProcessing[2]}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {stepProcessing[2] ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Brain className="w-4 h-4" />}
                Generate Embeddings
              </motion.button>
            </div>
          </StepContent>
        )}

        {/* Step 4: Vector Store */}
        {activeStep === 3 && (
          <StepContent title="Vector Store" icon={Database} color="from-emerald-500 to-green-500"
            description="Store embeddings for fast retrieval">
            <div className="space-y-3">
              {vectorDBs.map((db) => (
                <button key={db.id} onClick={() => { setLocalVectorDB(db.id); store.setVectorStore(db.id); }}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left',
                    localVectorDB === db.id ? 'bg-accent-glow border-accent-primary/20' : 'bg-bg-elevated border-border-primary hover:border-border-secondary'
                  )}>
                  <div>
                    <div className="text-sm font-medium text-text-primary">{db.name}</div>
                    <div className="text-[10px] text-text-tertiary">{db.desc}</div>
                  </div>
                  {localVectorDB === db.id && <CheckCircle2 className="w-4 h-4 text-accent-primary shrink-0" />}
                </button>
              ))}
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handlers.handleStore}
                disabled={!store.totalVectors || stepProcessing[3]}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {stepProcessing[3] ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Database className="w-4 h-4" />}
                Store Vectors
              </motion.button>
            </div>
          </StepContent>
        )}

        {/* Step 5: Retrieval */}
        {activeStep === 4 && (
          <StepContent title="Retrieval" icon={Search} color="from-green-500 to-lime-500"
            description="Search the vector database">
            <div className="space-y-4">
              <div className="flex gap-2">
                <input value={retrievalQuery} onChange={(e) => setRetrievalQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlers.handleTestRetrieval(retrievalQuery)}
                  placeholder="Test query..." className="flex-1 bg-bg-elevated rounded-xl border border-border-primary px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary placeholder:text-text-muted" />
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => handlers.handleTestRetrieval(retrievalQuery)}
                  disabled={!buildComplete || !retrievalQuery.trim()}
                  className="px-4 py-2.5 rounded-xl bg-accent-primary text-white disabled:opacity-50 transition-all"
                >
                  <Search className="w-4 h-4" />
                </motion.button>
              </div>
              {handlers.retrievalResults.length > 0 && (
                <div className="space-y-2">
                  {handlers.retrievalResults.map((r: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-bg-elevated rounded-xl p-3 border border-border-primary">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono text-accent-primary">#{r.rank}</span>
                        <span className="text-xs text-text-muted">{(r.score * 100).toFixed(1)}%</span>
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-2">{r.text}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </StepContent>
        )}

        {/* Step 6: Generation */}
        {activeStep === 5 && (
          <StepContent title="Generation" icon={MessageSquare} color="from-lime-500 to-yellow-500"
            description="Generate grounded answers with evidence">
            <div className="space-y-4">
              <div className="bg-bg-elevated rounded-xl border border-border-primary p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-text-primary">LLM Provider</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-glow text-accent-secondary">.env</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[{ id: 'groq', name: 'Groq' }, { id: 'ollama', name: 'Ollama' }, { id: 'openai', name: 'OpenAI' }, { id: 'anthropic', name: 'Claude' },
                    { id: 'google', name: 'Gemini' }, { id: 'deepseek', name: 'DeepSeek' }, { id: 'qwen', name: 'Qwen' }, { id: 'mistral', name: 'Mistral' }].map((p) => (
                    <button key={p.id} onClick={() => store.setLlmProvider(p.id)}
                      className={cn(
                        'px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all',
                        store.llmProvider === p.id ? 'bg-accent-primary text-white' : 'bg-bg-secondary text-text-secondary hover:text-text-primary border border-border-primary'
                      )}>{p.name}</button>
                  ))}
                </div>
              </div>
            </div>
          </StepContent>
        )}

        {/* Step 7: Analytics */}
        {activeStep === 6 && (
          <StepContent title="Analytics" icon={BarChart3} color="from-yellow-500 to-orange-500"
            description="Pipeline performance metrics">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Chunks', value: store.chunks.length, color: 'text-cyan-500' },
                { label: 'Vectors', value: store.totalVectors, color: 'text-emerald-500' },
                { label: 'Queries', value: store.totalQueries, color: 'text-amber-500' },
                { label: 'Files', value: store.parsedFiles.length, color: 'text-blue-500' },
              ].map((m) => (
                <div key={m.label} className="bg-bg-elevated rounded-xl p-4 border border-border-primary text-center">
                  <div className={cn('text-2xl font-bold', m.color)}>{m.value}</div>
                  <div className="text-xs text-text-muted mt-1">{m.label}</div>
                </div>
              ))}
            </div>
          </StepContent>
        )}
      </div>
    </div>
  );
}

// ─── Step Content Wrapper ────────────────────────────────────────
function StepContent({ title, icon: Icon, color, description, children }: {
  title: string; icon: any; color: string; description: string; children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="bg-bg-secondary rounded-2xl border border-border-primary overflow-hidden">
      <div className="p-5 border-b border-border-primary">
        <div className="flex items-center gap-3 mb-2">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br', color)}>
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

// ─── Right Panel: Chat + Evidence Timeline ───────────────────────
function ChatPanel({ store, query, setQuery, sendQuery, isSearching, buildComplete }: {
  store: any;
  query: string;
  setQuery: (q: string) => void;
  sendQuery: () => void;
  isSearching: boolean;
  buildComplete: boolean;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [store.chatMessages]);

  return (
    <div className="w-80 shrink-0 border-l border-border-primary bg-bg-secondary flex flex-col h-full">
      <div className="p-4 border-b border-border-primary">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="w-4 h-4 text-accent-primary" />
          <span className="text-sm font-semibold text-text-primary">Chat</span>
        </div>
        <p className="text-[10px] text-text-muted">
          {buildComplete ? '🟢 Pipeline ready' : 'Complete pipeline to chat'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {store.chatMessages.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-7 h-7 text-text-muted" />
            </div>
            <p className="text-sm font-medium text-text-secondary mb-1">Ask anything</p>
            <p className="text-xs text-text-muted leading-relaxed">Questions about your uploaded documents will be answered with evidence from your knowledge base</p>
          </div>
        )}

        <AnimatePresence>
          {store.chatMessages.map((msg: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={cn('rounded-2xl p-3.5 text-sm', msg.role === 'user' ? 'bg-accent-primary/10 ml-6' : 'bg-bg-elevated mr-6')}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  {msg.role === 'user' ? 'You' : 'RAG'}
                </span>
              </div>
              <div className="text-text-secondary leading-relaxed whitespace-pre-wrap text-[13px]">{msg.content}</div>

              {/* Metadata */}
              {msg.metadata && (
                <div className="mt-2 pt-2 border-t border-border-primary flex flex-wrap gap-2 text-[10px] text-text-muted">
                  {msg.metadata.chunks && <span>{msg.metadata.chunks} chunks</span>}
                  {msg.metadata.latency && <span>{msg.metadata.latency}</span>}
                  {msg.metadata.confidence !== undefined && <span>{(msg.metadata.confidence * 100).toFixed(0)}% confidence</span>}
                </div>
              )}

              {/* Evidence Timeline */}
              {msg.metadata?.evidence && msg.metadata.evidence.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border-primary">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Target className="w-3 h-3 text-accent-primary" />
                    <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider">Evidence</span>
                  </div>
                  <div className="space-y-1">
                    {msg.metadata.evidence.map((ev: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-bg-primary/50 hover:bg-bg-hover transition-colors cursor-pointer group">
                        <span className="text-[10px] font-mono text-accent-primary shrink-0 mt-0.5">#{ev.rank}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-medium text-text-primary truncate">{ev.source}</span>
                            {ev.page && <span className="text-[9px] px-1 py-0.5 rounded bg-accent-glow text-accent-secondary">p.{ev.page}</span>}
                            <span className="text-[9px] text-text-muted ml-auto shrink-0">{(ev.score * 100).toFixed(0)}%</span>
                          </div>
                          <p className="text-[10px] text-text-tertiary line-clamp-1 mt-0.5 group-hover:text-text-secondary transition-colors">{ev.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isSearching && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-text-tertiary">
            <div className="w-3 h-3 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            Searching and generating...
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border-primary">
        <div className="flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendQuery()}
            disabled={!buildComplete}
            placeholder={buildComplete ? 'Ask a question...' : 'Complete pipeline first'}
            className="flex-1 bg-bg-elevated rounded-xl border border-border-primary px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary disabled:opacity-50 transition-colors" />
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={sendQuery}
            disabled={!buildComplete || !query.trim() || isSearching}
            className="px-3 py-2.5 rounded-xl bg-accent-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-dim transition-all"
          >
            <MessageSquare className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
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
  const [pipelineStartTime, setPipelineStartTime] = useState<number>(0);
  const [stepTimings, setStepTimings] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    healthAPI.check().then(() => store.setBackendConnected(true)).catch(() => store.setBackendConnected(false));
  }, []);

  const steps = [
    { name: 'Ingestion', icon: Upload, color: 'from-blue-500 to-cyan-500' },
    { name: 'Chunking', icon: Layers, color: 'from-cyan-500 to-teal-500' },
    { name: 'Embeddings', icon: Brain, color: 'from-teal-500 to-emerald-500' },
    { name: 'Vector Store', icon: Database, color: 'from-emerald-500 to-green-500' },
    { name: 'Retrieval', icon: Search, color: 'from-green-500 to-lime-500' },
    { name: 'Generation', icon: MessageSquare, color: 'from-lime-500 to-yellow-500' },
    { name: 'Analytics', icon: BarChart3, color: 'from-yellow-500 to-orange-500' },
  ];

  // ─── Handlers ────────────────────────────────────────────────
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

  const handleChunk = async () => {
    if (!store.currentText) { setError('No text to chunk.'); return; }
    setStepProcessing(p => ({ ...p, 1: true })); setError(null);
    const start = Date.now();
    try {
      const result = await chunkAPI.chunk({ text: store.currentText, method: store.chunkMethod, chunk_size: store.chunkSize, overlap: store.chunkOverlap });
      if (result.success) { store.setChunks(result.chunks); setChunkResult(result); setStepTimings(t => ({ ...t, chunk: Date.now() - start })); setActiveStep(2); }
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
      if (embeddings.success) { setEmbedResult(embeddings); setStepTimings(t => ({ ...t, embed: Date.now() - start })); setActiveStep(3); }
      else setError(embeddings.error || 'Embedding failed');
    } catch (err: any) { setError(err.message); }
    finally { setStepProcessing(p => ({ ...p, 2: false })); }
  };

  const handleStore = async () => {
    if (!embedResult) { setError('No embeddings to store.'); return; }
    setStepProcessing(p => ({ ...p, 3: true })); setError(null);
    try {
      await vectorAPI.add({
        ids: store.chunks.map((c: any) => c.id), embeddings: embedResult.embeddings,
        texts: store.chunks.map((c: any) => c.text), metadata: store.chunks.map((c: any) => c.metadata),
        collection: store.collectionName, store_type: store.vectorStore, dimensions: embedResult.dimensions
      });
      store.setTotalVectors(embedResult.count);
      setBuildComplete(true); setBuildTimeMs(Date.now() - (pipelineStartTime || Date.now()));
      setActiveStep(4);
    } catch (err: any) { setError(err.message); }
    finally { setStepProcessing(p => ({ ...p, 3: false })); }
  };

  const handleTestRetrieval = async (q: string) => {
    if (!q.trim() || !buildComplete) return;
    setStepProcessing(p => ({ ...p, 4: true })); setError(null);
    try {
      const retrieval = await retrieveAPI.search({ query: q, top_k: 5, collection: store.collectionName, store_type: store.vectorStore, use_reranker: true, embedding_model: store.embeddingModel });
      if (retrieval.success) { setRetrievalResults(retrieval.results); }
      else setError('Retrieval failed');
    } catch (err: any) { setError(err.message); }
    finally { setStepProcessing(p => ({ ...p, 4: false })); }
  };

  const sendQuery = async () => {
    if (!query.trim() || !buildComplete) return;
    const userMsg = { role: 'user' as const, content: query };
    store.addChatMessage(userMsg); setQuery(''); setIsSearching(true); setError(null);
    try {
      const retrieval = await retrieveAPI.search({ query, top_k: 5, collection: store.collectionName, store_type: store.vectorStore, use_reranker: true, embedding_model: store.embeddingModel });
      if (retrieval.success) {
        setRetrievalResults(retrieval.results); store.incrementQueries();
        const evidenceSources = retrieval.results.map((r: any, idx: number) => ({
          rank: idx + 1, score: r.score, text: r.text,
          source: r.metadata?.source || 'Unknown source', page: r.metadata?.page, chunk_id: r.id, metadata: r.metadata,
        }));
        const generation = await llmAPI.generate({ query, context: retrieval.results.map((r: any) => r.text), provider: store.llmProvider, model: store.llmModel });
        if (generation.success) {
          setGenerationResult(generation);
          store.addChatMessage({ role: 'assistant', content: generation.answer, metadata: {
            chunks: retrieval.results.length,
            sources: retrieval.results.map((r: any) => r.metadata?.source || 'unknown').filter((s: string, i: number, a: string[]) => a.indexOf(s) === i),
            latency: `${(retrieval.timing.total_ms / 1000).toFixed(2)}s`,
            confidence: retrieval.results[0]?.score || 0,
            evidence: evidenceSources
          }});
        } else {
          let errorMsg = generation.error || 'LLM not available';
          if (errorMsg.includes('getaddrinfo') || errorMsg.includes('DNS') || errorMsg.includes('network')) {
            errorMsg = 'Network error: Cannot reach the LLM API. Check your internet connection and .env configuration.';
          }
          store.addChatMessage({ role: 'assistant', content: `I found relevant chunks but couldn't generate an answer: ${errorMsg}` });
        }
      }
    } catch (err: any) { store.addChatMessage({ role: 'assistant', content: `Error: ${err.message}` }); }
    finally { setIsSearching(false); }
  };

  const handlers = {
    completeIngestion, handleChunk, handleEmbed, handleStore,
    handleTestRetrieval, retrievalResults, generationResult,
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Workspace Header */}
      <div className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-border-primary bg-bg-secondary/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-text-primary">Workspace</h1>
          </div>
          <div className="h-4 w-px bg-border-primary mx-1" />
          <span className="text-[10px] text-text-muted">
            {store.backendConnected ? '🟢 Connected' : '🔴 Offline'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveStep(6)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-primary transition-all">
            <BarChart3 className="w-3 h-3" /> Analytics
          </button>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Knowledge Base */}
        <KnowledgeBasePanel store={store} fileInputRef={fileInputRef} onFileUpload={handleFileUpload} parseResult={parseResult} />

        {/* Center: Pipeline */}
        <PipelinePanel
          store={store} activeStep={activeStep} setActiveStep={setActiveStep}
          steps={steps} stepProcessing={stepProcessing} handlers={handlers}
          buildComplete={buildComplete} error={error}
        />

        {/* Right: Chat + Evidence */}
        <ChatPanel store={store} query={query} setQuery={setQuery} sendQuery={sendQuery} isSearching={isSearching} buildComplete={buildComplete} />
      </div>
    </div>
  );
}
