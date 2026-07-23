import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Layers, Brain, Database, Search, MessageSquare,
  CheckCircle2, AlertCircle, Zap, X,
  BarChart3, Target, Trash2, Folder,
  Headphones, Film, ChevronLeft, ChevronRight, Globe, Key
} from 'lucide-react';
import { cn, formatNumber } from '../lib/utils';
import { useAppStore } from '../store/appStore';
import {
  parseAPI, chunkAPI, embedAPI, vectorAPI, retrieveAPI, llmAPI, healthAPI, uploadAPI, scrapeAPI
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

// ─── File Category Helpers ──────────────────────────────────────
type FileCategory = 'text' | 'audio' | 'video';

interface UploadCategoryConfig {
  key: FileCategory;
  label: string;
  icon: any;
  accept: string;
  color: string;
  fromColor: string;
  toColor: string;
  borderColor: string;
  bgColor: string;
  hoverBg: string;
  description: string;
}

const UPLOAD_CATEGORIES: UploadCategoryConfig[] = [
  {
    key: 'text',
    label: 'Documents & Text',
    icon: FileText,
    accept: '.txt,.md,.pdf,.docx,.doc,.csv,.tsv,.html,.htm,.json,.jsonl,.xml,.svg,.pptx,.ppt,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.bmp,.tiff,.webp,.zip',
    color: 'text-blue-500',
    fromColor: 'from-blue-500',
    toColor: 'to-cyan-500',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/5',
    hoverBg: 'hover:bg-blue-500/10',
    description: 'PDFs, Word, Excel, Images, Code, ZIPs',
  },
  {
    key: 'audio',
    label: 'Audio Files',
    icon: Headphones,
    accept: '.mp3,.wav,.ogg,.flac,.aac,.m4a,.wma,.opus',
    color: 'text-purple-500',
    fromColor: 'from-purple-500',
    toColor: 'to-pink-500',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-500/5',
    hoverBg: 'hover:bg-purple-500/10',
    description: 'MP3, WAV, FLAC, AAC, M4A, OGG',
  },
  {
    key: 'video',
    label: 'Video Files',
    icon: Film,
    accept: '.mp4,.avi,.mkv,.mov,.wmv,.flv,.webm,.m4v,.mpg,.mpeg',
    color: 'text-rose-500',
    fromColor: 'from-rose-500',
    toColor: 'to-orange-500',
    borderColor: 'border-rose-500/30',
    bgColor: 'bg-rose-500/5',
    hoverBg: 'hover:bg-rose-500/10',
    description: 'MP4, AVI, MKV, MOV, WebM, FLV',
  },
];

const TEXT_EXTENSIONS = new Set(UPLOAD_CATEGORIES[0].accept.split(','));
const AUDIO_EXTENSIONS = new Set(UPLOAD_CATEGORIES[1].accept.split(','));
const VIDEO_EXTENSIONS = new Set(UPLOAD_CATEGORIES[2].accept.split(','));

function getFileCategory(fileName: string): FileCategory {
  const ext = '.' + fileName.split('.').pop()?.toLowerCase();
  if (AUDIO_EXTENSIONS.has(ext)) return 'audio';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  return 'text';
}

function getCategoryConfig(category: FileCategory): UploadCategoryConfig {
  return UPLOAD_CATEGORIES.find(c => c.key === category)!;
}

// ─── Animated Pipeline Step Indicator ────────────────────────────
function PipelineIndicator({ steps, activeStep, completedSteps, onStepClick }: {
  steps: { name: string; icon: any; color: string }[];
  activeStep: number;
  completedSteps: Set<number>;
  onStepClick?: (stepIndex: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {steps.map((step, i) => {
        const isComplete = completedSteps.has(i);
        const isActive = activeStep === i;
        const isClickable = isComplete || isActive;
        return (
          <div key={step.name} className="flex items-center">
            <motion.button
              onClick={() => isClickable && onStepClick?.(i)}
              disabled={!isClickable}
              animate={{ scale: isActive ? 1.15 : 1, opacity: isActive ? 1 : isComplete ? 0.8 : 0.4 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300',
                isClickable ? 'cursor-pointer hover:ring-2 hover:ring-accent-primary/30' : 'cursor-default',
                isComplete ? 'bg-emerald-500' : isActive ? `bg-gradient-to-br ${step.color}` : 'bg-bg-tertiary'
              )}
              title={step.name}
            >
              {isComplete ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              ) : (
                <step.icon className="w-3.5 h-3.5 text-white" />
              )}
            </motion.button>
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

// ─── Upload Zone Component ─────────────────────────────────────────
function UploadZone({ config, fileInputRef, onUpload, isUploading, uploadProgress, fileCount }: {
  config: UploadCategoryConfig;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  uploadProgress: string;
  fileCount: number;
}) {
  return (
    <div className={cn(
      'rounded-xl border-2 border-dashed p-4 transition-all',
      config.borderColor,
      config.bgColor,
      config.hoverBg
    )}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={config.accept}
        onChange={onUpload}
        className="hidden"
      />
      <div className="flex flex-col items-center text-center gap-2">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br',
          config.fromColor, config.toColor
        )}>
          <config.icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold text-text-primary">{config.label}</p>
          <p className="text-[9px] text-text-muted mt-0.5">{config.description}</p>
        </div>

        {isUploading ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60">
            <div className="w-3.5 h-3.5 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] text-accent-primary font-medium">Uploading...</span>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all border',
              'bg-white/70 text-text-secondary hover:text-text-primary border-transparent hover:border-current'
            )}
          >
            <Upload className="w-3 h-3" />
            Browse Files
          </button>
        )}

        {uploadProgress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="w-full px-2 py-1 rounded-lg bg-white/40"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 border-2 border-accent-primary border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="text-[9px] text-text-tertiary truncate">{uploadProgress}</span>
            </div>
          </motion.div>
        )}

        {fileCount > 0 && (
          <span className="text-[9px] font-medium text-text-muted">
            {fileCount} file{fileCount !== 1 ? 's' : ''} uploaded
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Left Panel: Knowledge Base ──────────────────────────────────
function KnowledgeBasePanel({ store, textInputRef, audioInputRef, videoInputRef,
  onTextUpload, onAudioUpload, onVideoUpload, parseResult,
  isUploading, uploadProgress, uploadingCategory, onScrapeUrl }: {
  store: any;
  textInputRef: React.RefObject<HTMLInputElement>;
  audioInputRef: React.RefObject<HTMLInputElement>;
  videoInputRef: React.RefObject<HTMLInputElement>;
  onTextUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  parseResult: any;
  isUploading: boolean;
  uploadProgress: string;
  uploadingCategory: FileCategory | null;
  onScrapeUrl: (url: string) => void;
}) {
  // Group files by category
  const textFiles = store.parsedFiles.filter((f: any) => getFileCategory(f.name) === 'text');
  const audioFiles = store.parsedFiles.filter((f: any) => getFileCategory(f.name) === 'audio');
  const videoFiles = store.parsedFiles.filter((f: any) => getFileCategory(f.name) === 'video');

  return (
    <div className="w-80 shrink-0 border-r border-border-primary bg-bg-secondary flex flex-col h-full">
      <div className="p-4 border-b border-border-primary space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-accent-primary" />
          <span className="text-sm font-semibold text-text-primary">Knowledge Base</span>
          {store.parsedFiles.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-glow text-accent-primary font-medium ml-auto">
              {store.parsedFiles.length}
            </span>
          )}
        </div>

        {/* 3 Upload Zones */}
        <UploadZone
          config={getCategoryConfig('text')}
          fileInputRef={textInputRef}
          onUpload={onTextUpload}
          isUploading={isUploading && uploadingCategory === 'text'}
          uploadProgress={uploadingCategory === 'text' ? uploadProgress : ''}
          fileCount={textFiles.length}
        />
        <UploadZone
          config={getCategoryConfig('audio')}
          fileInputRef={audioInputRef}
          onUpload={onAudioUpload}
          isUploading={isUploading && uploadingCategory === 'audio'}
          uploadProgress={uploadingCategory === 'audio' ? uploadProgress : ''}
          fileCount={audioFiles.length}
        />
        <UploadZone
          config={getCategoryConfig('video')}
          fileInputRef={videoInputRef}
          onUpload={onVideoUpload}
          isUploading={isUploading && uploadingCategory === 'video'}
          uploadProgress={uploadingCategory === 'video' ? uploadProgress : ''}
          fileCount={videoFiles.length}
        />
      </div>

      <div className="flex-1 overflow-y-auto rag-panel-scroll p-3 space-y-3">
        {store.parsedFiles.length === 0 && !store.currentText.trim() ? (
          <div className="text-center py-10 px-4">
            <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
              <Folder className="w-7 h-7 text-text-muted" />
            </div>
            <p className="text-sm font-medium text-text-secondary mb-1">No files uploaded</p>
            <p className="text-xs text-text-muted leading-relaxed">Upload documents, audio, or video files from the sections above to start building your knowledge base</p>
          </div>
        ) : (
          <>
            {/* Files grouped by category */}
            {[
              { category: 'text' as FileCategory, files: textFiles, label: 'Documents', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
              { category: 'audio' as FileCategory, files: audioFiles, label: 'Audio', icon: Headphones, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
              { category: 'video' as FileCategory, files: videoFiles, label: 'Video', icon: Film, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
            ].map(group => group.files.length > 0 ? (
              <div key={group.category} className="space-y-1.5">
                <div className="flex items-center gap-1.5 px-1">
                  <group.icon className={cn('w-3 h-3', group.color)} />
                  <span className={cn('text-[10px] font-semibold uppercase tracking-wider', group.color)}>
                    {group.label}
                  </span>
                  <span className={cn('text-[9px] px-1 rounded', group.bg, group.color)}>
                    {group.files.length}
                  </span>
                </div>
                <AnimatePresence>
                  {group.files.map((file: any, i: number) => (
                    <motion.div
                      key={file.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.03 }}
                      className={cn(
                        'group bg-bg-elevated rounded-xl p-2.5 border transition-all',
                        group.border,
                        'hover:border-opacity-60'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', group.bg)}>
                          <group.icon className={cn('w-3.5 h-3.5', group.color)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium text-text-primary truncate">{file.name}</p>
                          <p className="text-[9px] text-text-muted mt-0.5 flex items-center gap-1">
                            <span>{formatNumber(file.characters)} chars</span>
                            {file.words > 0 && <><span>•</span><span>{formatNumber(file.words)} words</span></>}
                            {file.size > 0 && <><span>•</span><span>{(file.size / (1024 * 1024)).toFixed(1)}MB</span></>}
                          </p>
                        </div>
                        <button onClick={() => store.removeParsedFile(file.name)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/10 transition-all">
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : null)}

            {/* Parse Result */}
            {parseResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-700">Last parse successful</span>
                </div>
                <div className="space-y-0.5 text-[10px] text-text-secondary">
                  <div>{formatNumber(parseResult.characters || 0)} characters • {formatNumber(parseResult.words || 0)} words</div>
                  {parseResult.pages && <div>{parseResult.pages} pages</div>}
                </div>
              </motion.div>
            )}

            {/* Pipeline Stats */}
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

            {/* URL Scraper */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3 h-3" />
                Or Paste URL
              </label>
              <div className="flex gap-1.5">
                <input
                  id="url-input"
                  placeholder="https://example.com/article..."
                  className="flex-1 bg-bg-elevated rounded-lg border border-border-primary px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary transition-colors placeholder:text-text-muted"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('url-input') as HTMLInputElement;
                    if (!input?.value.trim()) return;
                    onScrapeUrl(input.value.trim());
                    input.value = '';
                  }}
                  className="px-3 py-2 rounded-lg bg-gradient-to-br from-accent-primary to-accent-dim text-white text-xs font-medium hover:shadow-md transition-all flex items-center gap-1"
                >
                  <Globe className="w-3 h-3" />
                  Fetch
                </button>
              </div>
              <p className="text-[8px] text-text-muted">Fetches and parses web content in real-time</p>
            </div>

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
          </>
        )}
      </div>
    </div>
  );
}

// ─── Center Panel: Pipeline Steps ────────────────────────────────
function PipelinePanel({ store, activeStep, setActiveStep, steps, stepProcessing, handlers, buildComplete, error, onSetQuery, queryValue }: {
  store: any;
  activeStep: number;
  setActiveStep: (s: number) => void;
  steps: { name: string; icon: any; color: string }[];
  stepProcessing: Record<number, boolean>;
  handlers: any;
  buildComplete: boolean;
  error: string | null;
  onSetQuery?: (q: string) => void;
  queryValue?: string;
}) {
  const [localChunkMethod, setLocalChunkMethod] = useState(store.chunkMethod);
  const [localEmbedModel, setLocalEmbedModel] = useState(store.embeddingModel);
  const [localVectorDB, setLocalVectorDB] = useState(store.vectorStore);
  const [retrievalQuery, setRetrievalQuery] = useState('');

  // Determine which steps are reachable
  const completedSteps = new Set([
    ...(store.parsedFiles.length > 0 ? [0] : []),
    ...(store.chunks.length > 0 ? [1] : []),
    ...(store.totalVectors > 0 ? [2, 3] : []),
    ...(buildComplete ? [4, 5, 6] : []),
  ]);

  const totalSteps = steps.length;
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === totalSteps - 1;

  const goToNextStep = () => {
    if (activeStep < totalSteps - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const goToPrevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (completedSteps.has(stepIndex) || stepIndex === activeStep) {
      setActiveStep(stepIndex);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Pipeline Indicator Bar */}
      <div className="border-b border-border-primary bg-bg-secondary/50">
        <PipelineIndicator steps={steps} activeStep={activeStep} completedSteps={completedSteps} onStepClick={goToStep} />
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto rag-panel-scroll p-6 space-y-4">
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
                <div className="space-y-1.5">
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
                disabled={store.chunks.length === 0 || stepProcessing[3]}
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
            description="Generate answers using Groq Cloud LLM">
            <div className="space-y-4">
              {/* API Key Input */}
              <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="w-3.5 h-3.5 text-accent-primary" />
                  <span className="text-[10px] font-semibold text-text-primary uppercase tracking-wider">API Key (Optional)</span>
                </div>
                <div className="flex gap-2">
                <input
                  id="api-key-input"
                  name="api-key"
                  type="password"
                  placeholder="Enter your GROQ_API_KEY here (or set in backend/.env)"
                  className="flex-1 bg-white rounded-lg border border-border-primary px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary transition-colors placeholder:text-text-muted"
                />
                  <button
                    onClick={() => {
                      const input = document.getElementById('api-key-input') as HTMLInputElement;
                      if (input) {
                        input.type = input.type === 'password' ? 'text' : 'password';
                      }
                    }}
                    className="px-2 rounded-lg border border-border-primary bg-white hover:bg-bg-hover transition-all text-text-muted"
                    title="Toggle visibility"
                  >
                    👁
                  </button>
                </div>
                <p className="text-[9px] text-text-muted mt-1.5">
                  No .env file needed — enter your key here for the current session. 
                  Get a free key at <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-accent-primary underline">console.groq.com/keys</a>
                </p>
              </div>

              <div className="bg-gradient-to-br from-accent-primary/5 to-accent-dim/5 rounded-xl border border-accent-primary/20 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-dim flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-text-primary">Groq Cloud</span>
                    <div className="flex items-center gap-2 mt-0.5">
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
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border',
                        store.llmModel === m.id
                          ? 'bg-accent-primary text-white border-accent-primary shadow-sm'
                          : 'bg-white/60 text-text-secondary hover:text-text-primary border-border-primary hover:border-accent-primary/30'
                      )}>
                      <span>{m.name}</span>
                      <span className="text-[9px] opacity-60">({m.speed})</span>
                      {m.badge && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-bold">{m.badge}</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Chat in Generation Step */}
              {buildComplete && (
                <div className="bg-bg-elevated rounded-xl border border-border-primary p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-3.5 h-3.5 text-accent-primary" />
                    <span className="text-[10px] font-semibold text-text-primary uppercase tracking-wider">Quick Test</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="gen-query"
                      placeholder="Ask a question about your documents..."
                      className="flex-1 bg-white rounded-lg border border-border-primary px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary transition-colors placeholder:text-text-muted"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const input = document.getElementById('gen-query') as HTMLInputElement;
                          if (input?.value.trim()) {
                            const q = input.value.trim();
                            onSetQuery?.(q);
                            input.value = '';
                            setTimeout(() => handlers.handleTestRetrieval(q), 100);
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('gen-query') as HTMLInputElement;
                        if (input?.value.trim()) {
                          const q = input.value.trim();
                          onSetQuery?.(q);
                          input.value = '';
                          setTimeout(() => handlers.handleTestRetrieval(q), 100);
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-accent-primary text-white text-xs font-medium hover:shadow-md transition-all"
                    >
                      <Search className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
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

      {/* Previous / Next Navigation */}
      <div className="shrink-0 px-4 py-3 border-t border-border-primary bg-bg-secondary/80 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <motion.button
            whileHover={!isFirstStep ? { scale: 1.02 } : {}}
            whileTap={!isFirstStep ? { scale: 0.98 } : {}}
            onClick={goToPrevStep}
            disabled={isFirstStep}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all',
              isFirstStep
                ? 'bg-bg-tertiary text-text-muted cursor-not-allowed opacity-50'
                : 'bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-primary hover:border-accent-primary/30'
            )}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </motion.button>

          {/* Step indicator text */}
          <span className="text-[10px] text-text-muted font-medium">
            Step {activeStep + 1} of {totalSteps}
          </span>

          <motion.button
            whileHover={!isLastStep ? { scale: 1.02 } : {}}
            whileTap={!isLastStep ? { scale: 0.98 } : {}}
            onClick={goToNextStep}
            disabled={isLastStep}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all',
              isLastStep
                ? 'bg-bg-tertiary text-text-muted cursor-not-allowed opacity-50'
                : 'bg-accent-primary text-white hover:shadow-md hover:shadow-accent-primary/25'
            )}
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>
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
      <div className="flex-1 overflow-y-auto rag-panel-scroll p-4 space-y-4">
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadingCategory, setUploadingCategory] = useState<FileCategory | null>(null);
  const [pipelineStartTime, setPipelineStartTime] = useState<number>(0);
  const [stepTimings, setStepTimings] = useState<Record<string, number>>({});

  // 3 separate file input refs
  const textInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  // ─── File size limits ────────────────────────────────────────
  const MAX_UPLOAD_SIZE_MB = 100;

  // ─── Active jobs (for async upload polling) ──────────────────
  // Use a ref to avoid re-creating the polling interval on every state change
  const activeJobsRef = useRef<{[jobId: string]: { file: File; category: FileCategory; controller: AbortController }}>({});
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Poll active jobs ────────────────────────────────────────
  useEffect(() => {
    // Clear any existing interval before creating a new one
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

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

          // Update progress display
          setUploadProgress(`${job.stage_label} ${jobInfo.file.name}`);

          if (job.status === 'completed' && job.result) {
            // File processing complete - add to store
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
                // Accumulate text from multiple uploaded files instead of replacing
                const existing = store.currentText;
                if (existing && existing.trim()) {
                  store.setCurrentText(existing + '\n\n--- ' + (result.file_name || jobInfo.file.name) + ' ---\n\n' + result.text);
                } else {
                  store.setCurrentText(result.text);
                }
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
          // Poll failed - job might have expired, remove it
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
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);  // Empty deps — interval reads from ref, never needs re-creation



  // ─── Streaming upload handler (non-blocking, true streaming) ─
  const handleCategoryUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, category: FileCategory) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);
    setIsUploading(true);
    setUploadingCategory(category);

    // Abort any existing in-progress uploads before starting new ones
    const existing = activeJobsRef.current;
    Object.values(existing).forEach(j => {
      try { j.controller.abort(); } catch {}
    });

    const newJobs: {[jobId: string]: { file: File; category: FileCategory; controller: AbortController }} = {};

    for (const file of Array.from(files)) {
      if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
        setError(`File "${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max upload size is ${MAX_UPLOAD_SIZE_MB}MB.`);
        continue;
      }

      setUploadProgress(`Uploading ${file.name}...`);

      // Timeout for upload request (10 min for large files)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000);

      try {
        // Send file as raw binary — browser streams it natively without main-thread blocking
        const result = await uploadAPI.streamUpload(file, controller.signal);
        clearTimeout(timeoutId);

        if (result.status === 'failed') {
          setError(result.error || `Upload failed for ${file.name}`);
          continue;
        }

        // Track this job for polling
        newJobs[result.job_id] = { file, category, controller };
        setUploadProgress(`Queued ${file.name} for processing...`);

      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          setError(`Upload timed out or was cancelled for ${file.name}. Try a smaller file.`);
        } else {
          setError(err.message || `Upload failed for ${file.name}`);
        }
      }
    }

    // Add all started jobs to active polling set (via ref)
    const merged = { ...activeJobsRef.current, ...newJobs };
    activeJobsRef.current = merged;

    // If no jobs were started, reset state immediately
    if (Object.keys(newJobs).length === 0) {
      setIsUploading(false);
      setUploadingCategory(null);
      setUploadProgress('');
    }

    // Clear the input value so re-uploading same file triggers onChange
    if (category === 'text' && textInputRef.current) textInputRef.current.value = '';
    if (category === 'audio' && audioInputRef.current) audioInputRef.current.value = '';
    if (category === 'video' && videoInputRef.current) videoInputRef.current.value = '';
  }, [store]);

  // Cleanup active jobs on unmount
  useEffect(() => {
    return () => {
      const jobs = activeJobsRef.current;
      Object.values(jobs).forEach(j => {
        try { j.controller.abort(); } catch {}
      });
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const onTextUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleCategoryUpload(e, 'text'), [handleCategoryUpload]);
  const onAudioUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleCategoryUpload(e, 'audio'), [handleCategoryUpload]);
  const onVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleCategoryUpload(e, 'video'), [handleCategoryUpload]);

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

  const handleScrapeUrl = async (url: string) => {
    if (!url.trim()) { setError('Please enter a URL'); return; }
    setStepProcessing(p => ({ ...p, 0: true }));
    setError(null);
    try {
      const result = await scrapeAPI.scrapeUrl(url);
      if (result.success) {
        store.addParsedFile({
          name: result.file_name,
          text: result.text,
          type: 'text',
          size: result.characters,
          words: result.words,
          characters: result.characters,
          metadata: { ...result.metadata, source: url, scraped: true },
        });
        // Accumulate scraped text with existing uploaded files
        const existingText = store.currentText;
        if (existingText && existingText.trim()) {
          store.setCurrentText(existingText + '\n\n--- Scraped: ' + result.title + ' ---\n\n' + result.text);
        } else {
          store.setCurrentText(result.text);
        }
        setParseResult(result);
        setError(null);
      } else {
        setError(result.error || 'Failed to scrape URL');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to scrape URL');
    } finally {
      setStepProcessing(p => ({ ...p, 0: false }));
    }
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
    handleTestRetrieval, handleScrapeUrl, retrievalResults, generationResult,
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
        <KnowledgeBasePanel
          store={store}
          textInputRef={textInputRef}
          audioInputRef={audioInputRef}
          videoInputRef={videoInputRef}
          onTextUpload={onTextUpload}
          onAudioUpload={onAudioUpload}
          onVideoUpload={onVideoUpload}
          parseResult={parseResult}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          uploadingCategory={uploadingCategory}
          onScrapeUrl={handleScrapeUrl}
        />

        {/* Center: Pipeline */}
        <PipelinePanel
          store={store} activeStep={activeStep} setActiveStep={setActiveStep}
          steps={steps} stepProcessing={stepProcessing} handlers={handlers}
          buildComplete={buildComplete} error={error}
          onSetQuery={setQuery} queryValue={query}
        />

        {/* Right: Chat + Evidence */}
        <ChatPanel store={store} query={query} setQuery={setQuery} sendQuery={sendQuery} isSearching={isSearching} buildComplete={buildComplete} />
      </div>
    </div>
  );
}
