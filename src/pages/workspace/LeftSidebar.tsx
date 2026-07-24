import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Headphones, Film, Folder, Globe, Trash2,
  Upload, CheckCircle2, Plus, GripVertical, Pencil, X,
  Layers, Database, ChevronRight, Bookmark, Settings2, RefreshCcw,
  History, FolderOpen, Archive, GitMerge, RotateCcw
} from 'lucide-react';
import { cn, formatNumber } from '../../lib/utils';
import type { FileCategory } from './types';

// ─── Types ──────────────────────────────────────────────────────
interface LeftSidebarProps {
  store: any;
  parseResult: any;
  isUploading: boolean;
  uploadProgress: string;
  uploadingCategory: FileCategory | null;
  textInputRef: React.RefObject<HTMLInputElement>;
  audioInputRef: React.RefObject<HTMLInputElement>;
  videoInputRef: React.RefObject<HTMLInputElement>;
  onTextUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onScrapeUrl: (url: string) => void;
  activeStep: number;
  completedSteps: Set<number>;
  buildComplete: boolean;
  onClearCurrentText?: () => void;
  onStartNewProject?: () => void;
}

// ─── File Category Config ───────────────────────────────────────
const UPLOAD_CATEGORIES = [
  { key: 'text' as FileCategory, label: 'Documents', icon: FileText, accept: '.txt,.md,.pdf,.docx,.doc,.csv,.tsv,.html,.htm,.json,.jsonl,.xml,.svg,.pptx,.ppt,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.bmp,.tiff,.webp,.zip', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', fromColor: 'from-blue-500', toColor: 'to-cyan-500' },
  { key: 'audio' as FileCategory, label: 'Audio', icon: Headphones, accept: '.mp3,.wav,.ogg,.flac,.aac,.m4a,.wma,.opus', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30', fromColor: 'from-purple-500', toColor: 'to-pink-500' },
  { key: 'video' as FileCategory, label: 'Video', icon: Film, accept: '.mp4,.avi,.mkv,.mov,.wmv,.flv,.webm,.m4v,.mpg,.mpeg', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30', fromColor: 'from-rose-500', toColor: 'to-orange-500' },
];

function getCategoryConfig(category: FileCategory) {
  return UPLOAD_CATEGORIES.find(c => c.key === category)!;
}

function getFileCategory(fileName: string): FileCategory {
  const ext = '.' + fileName.split('.').pop()?.toLowerCase();
  const audioExts = new Set(['.mp3','.wav','.ogg','.flac','.aac','.m4a','.wma','.opus']);
  const videoExts = new Set(['.mp4','.avi','.mkv','.mov','.wmv','.flv','.webm','.m4v','.mpg','.mpeg']);
  if (audioExts.has(ext)) return 'audio';
  if (videoExts.has(ext)) return 'video';
  return 'text';
}

// ─── Upload Zone ────────────────────────────────────────────────
function UploadZone({ config, fileInputRef, onUpload, isUploading, uploadProgress, fileCount, onReplace }: {
  config: typeof UPLOAD_CATEGORIES[0];
  fileInputRef: React.RefObject<HTMLInputElement>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  uploadProgress: string;
  fileCount: number;
  onReplace?: () => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files.length > 0 && fileInputRef.current) {
          const dt = new DataTransfer();
          for (const f of e.dataTransfer.files) dt.items.add(f);
          fileInputRef.current.files = dt.files;
          onUpload({ target: { files: dt.files } } as any);
        }
      }}
      className={cn(
        'rounded-xl border-2 border-dashed p-2.5 transition-all cursor-pointer group',
        isDragOver ? 'border-accent-primary bg-accent-primary/10 scale-[1.02] shadow-lg shadow-accent-primary/10' : config.border,
        config.bg, 'hover:bg-opacity-80'
      )}
    >
      <input ref={fileInputRef} type="file" multiple accept={config.accept} onChange={onUpload} className="hidden" />
      <div className="flex items-center gap-2.5" onClick={() => fileInputRef.current?.click()}>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br shrink-0', config.fromColor, config.toColor)}>
          <config.icon className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-text-primary">{config.label}</p>
          <p className="text-[9px] text-text-muted truncate mt-0.5">
            {isUploading ? uploadProgress : fileCount > 0 ? `${fileCount} file${fileCount !== 1 ? 's' : ''}` : `Drop or click to upload`}
          </p>
        </div>
        {isUploading ? (
          <div className="w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <Upload className="w-3.5 h-3.5 text-text-muted group-hover:text-accent-primary transition-colors" />
        )}
      </div>
      {/* If files exist, show replace option */}
      {fileCount > 0 && (
        <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-border-primary/50">
          <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-medium text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 transition-all">
            <RefreshCcw className="w-2.5 h-2.5" /> Replace
          </button>
          <span className="text-[8px] text-text-muted">or</span>
          <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-medium text-text-muted hover:text-emerald-600 hover:bg-emerald-500/10 transition-all">
            <Plus className="w-2.5 h-2.5" /> Add More
          </button>
        </div>
      )}
    </div>
  );
}

// ─── File Item ──────────────────────────────────────────────────
function FileItem({ file, index, onRemove, onRename }: {
  file: any;
  index: number;
  onRemove: () => void;
  onRename: (newName: string) => void;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);
  const config = getCategoryConfig(getFileCategory(file.name));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.03 }}
      className="group bg-bg-elevated rounded-xl border border-border-primary hover:border-accent-primary/20 transition-all"
    >
      <div className="flex items-center gap-2 p-2.5">
        <GripVertical className="w-3 h-3 text-text-muted/30 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', config.bg)}>
          <config.icon className={cn('w-3.5 h-3.5', config.color)} />
        </div>
        <div className="min-w-0 flex-1">
          {isRenaming ? (
            <div className="flex items-center gap-1">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                className="flex-1 bg-white rounded border border-accent-primary px-1.5 py-0.5 text-[11px] text-text-primary focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { onRename(newName); setIsRenaming(false); }
                  if (e.key === 'Escape') { setIsRenaming(false); setNewName(file.name); }
                }}
              />
              <button onClick={() => { onRename(newName); setIsRenaming(false); }} className="p-0.5 hover:bg-emerald-500/10 rounded"><CheckCircle2 className="w-3 h-3 text-emerald-500" /></button>
              <button onClick={() => { setIsRenaming(false); setNewName(file.name); }} className="p-0.5 hover:bg-red-500/10 rounded"><X className="w-3 h-3 text-red-400" /></button>
            </div>
          ) : (
            <p className="text-[11px] font-medium text-text-primary truncate">{file.name}</p>
          )}
          <p className="text-[9px] text-text-muted mt-0.5 flex items-center gap-1">
            <span>{formatNumber(file.characters || 0)} chars</span>
            {file.words > 0 && <><span>•</span><span>{formatNumber(file.words)} words</span></>}
          </p>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => { setIsRenaming(true); setNewName(file.name); }}
            className="p-1 rounded-lg hover:bg-accent-primary/10 transition-all">
            <Pencil className="w-3 h-3 text-text-muted hover:text-text-primary" />
          </button>
          <button onClick={onRemove}
            className="p-1 rounded-lg hover:bg-red-500/10 transition-all">
            <Trash2 className="w-3 h-3 text-red-400" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Left Sidebar ───────────────────────────────────────────────
export function LeftSidebar({
  store, parseResult, isUploading, uploadProgress, uploadingCategory,
  textInputRef, audioInputRef, videoInputRef,
  onTextUpload, onAudioUpload, onVideoUpload, onScrapeUrl,
  activeStep, completedSteps, buildComplete,
  onClearCurrentText, onStartNewProject
}: LeftSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showCollections, setShowCollections] = useState(true);
  const [showRecent, setShowRecent] = useState(false);

  if (collapsed) {
    return (
      <div className="w-10 shrink-0 border-r border-border-primary bg-bg-secondary flex flex-col items-center py-3 gap-3">
        <button onClick={() => setCollapsed(false)} className="p-1.5 rounded-lg hover:bg-bg-hover transition-all">
          <ChevronRight className="w-4 h-4 text-text-muted" />
        </button>
        <div className="flex flex-col items-center gap-2 mt-4">
          {UPLOAD_CATEGORIES.map(c => (
            <div key={c.key} className={cn('w-6 h-6 rounded-lg flex items-center justify-center', c.bg)}>
              <c.icon className={cn('w-3 h-3', c.color)} />
            </div>
          ))}
        </div>
        {store.parsedFiles.length > 0 && (
          <div className="mt-auto text-[9px] font-medium text-text-muted">{store.parsedFiles.length}</div>
        )}
      </div>
    );
  }

  const textFiles = store.parsedFiles.filter((f: any) => getFileCategory(f.name) === 'text');
  const audioFiles = store.parsedFiles.filter((f: any) => getFileCategory(f.name) === 'audio');
  const videoFiles = store.parsedFiles.filter((f: any) => getFileCategory(f.name) === 'video');

  const recentProjects = [
    { name: 'Demo RAG Project', date: '2 hours ago', files: 3 },
    { name: 'My Documents', date: 'Yesterday', files: 5 },
  ];

  return (
    <div className="w-72 shrink-0 border-r border-border-primary bg-bg-secondary flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border-primary bg-bg-secondary/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-accent-primary" />
            <span className="text-sm font-semibold text-text-primary">Explorer</span>
          </div>
          <div className="flex items-center gap-1">
            {store.parsedFiles.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-glow text-accent-primary font-medium">
                {store.parsedFiles.length}
              </span>
            )}
            <button onClick={() => setCollapsed(true)} className="p-1 rounded-lg hover:bg-bg-hover transition-all">
              <X className="w-3 h-3 text-text-muted" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto rag-panel-scroll">
        {/* Upload Zones */}
        <div className="p-3 space-y-2 border-b border-border-primary">
          {UPLOAD_CATEGORIES.map(cat => (
            <UploadZone
              key={cat.key}
              config={cat}
              fileInputRef={cat.key === 'text' ? textInputRef : cat.key === 'audio' ? audioInputRef : videoInputRef}
              onUpload={cat.key === 'text' ? onTextUpload : cat.key === 'audio' ? onAudioUpload : onVideoUpload}
              isUploading={isUploading && uploadingCategory === cat.key}
              uploadProgress={uploadingCategory === cat.key ? uploadProgress : ''}
              fileCount={cat.key === 'text' ? textFiles.length : cat.key === 'audio' ? audioFiles.length : videoFiles.length}
            />
          ))}
        </div>

        {/* URL & Text Input */}
        <div className="p-3 border-b border-border-primary space-y-2">
          <button onClick={() => setShowUrlInput(!showUrlInput)}
            className="flex items-center gap-1.5 text-[10px] font-medium text-text-muted hover:text-text-primary transition-colors">
            <Globe className="w-3 h-3" />
            {showUrlInput ? 'Hide URL input' : 'Import from URL'}
          </button>
          <AnimatePresence>
            {showUrlInput && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="flex gap-1.5">
                  <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/article..."
                    className="flex-1 bg-bg-elevated rounded-lg border border-border-primary px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary transition-colors placeholder:text-text-muted"
                    onKeyDown={(e) => { if (e.key === 'Enter' && urlInput.trim()) { onScrapeUrl(urlInput.trim()); setUrlInput(''); } }} />
                  <button onClick={() => { if (urlInput.trim()) { onScrapeUrl(urlInput.trim()); setUrlInput(''); } }}
                    className="px-2.5 py-1.5 rounded-lg bg-accent-primary text-white text-xs font-medium hover:shadow-md transition-all">
                    <Globe className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <textarea value={pasteText} onChange={(e) => { setPasteText(e.target.value); store.setCurrentText(e.target.value); }}
            placeholder="Paste text here..."
            className="w-full h-20 bg-bg-elevated rounded-lg border border-border-primary px-2.5 py-1.5 text-xs text-text-primary resize-none focus:outline-none focus:border-accent-primary transition-colors placeholder:text-text-muted" />
        </div>

        {/* Files List */}
        <div className="p-3 space-y-3">
          {store.parsedFiles.length === 0 && !store.currentText.trim() ? (
            <div className="text-center py-8 px-3">
              <div className="w-14 h-14 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
                <Folder className="w-6 h-6 text-text-muted" />
              </div>
              <p className="text-sm font-medium text-text-secondary mb-1">No files uploaded</p>
              <p className="text-[10px] text-text-muted leading-relaxed">Upload documents, audio, or video to start building your knowledge base</p>
            </div>
          ) : (
            <>
              {[
                { files: textFiles, label: 'Documents', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { files: audioFiles, label: 'Audio', icon: Headphones, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                { files: videoFiles, label: 'Video', icon: Film, color: 'text-rose-500', bg: 'bg-rose-500/10' },
              ].map(group => group.files.length > 0 ? (
                <div key={group.label} className="space-y-1">
                  <div className="flex items-center gap-1.5 px-1">
                    <group.icon className={cn('w-3 h-3', group.color)} />
                    <span className={cn('text-[10px] font-semibold uppercase tracking-wider', group.color)}>{group.label}</span>
                    <span className={cn('text-[9px] px-1 rounded', group.bg, group.color)}>{group.files.length}</span>
                  </div>
                  <AnimatePresence>
                    {group.files.map((file: any, i: number) => (
                      <FileItem
                        key={file.name}
                        file={file}
                        index={i}
                        onRemove={() => store.removeParsedFile(file.name)}
                        onRename={(newName) => {
                          store.removeParsedFile(file.name);
                          store.addParsedFile({ ...file, name: newName });
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : null)}

              {/* Clear / Reset controls */}
              <div className="flex items-center gap-2 pt-1">
                <button onClick={() => { store.setCurrentText(''); setPasteText(''); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all">
                  <Trash2 className="w-2.5 h-2.5" /> Clear Text
                </button>
                {onStartNewProject && (
                  <button onClick={onStartNewProject}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 transition-all ml-auto">
                    <RotateCcw className="w-2.5 h-2.5" /> New Project
                  </button>
                )}
              </div>

              {/* Parse Result */}
              {parseResult && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-700">Parsed</span>
                  </div>
                  <div className="text-[9px] text-text-secondary space-y-0.5">
                    <div>{formatNumber(parseResult.characters || 0)} chars • {formatNumber(parseResult.words || 0)} words</div>
                    {parseResult.pages && <div>{parseResult.pages} pages</div>}
                  </div>
                </motion.div>
              )}

              {/* Pipeline Stats */}
              {(store.chunks.length > 0 || store.totalVectors > 0) && (
                <div className="bg-bg-elevated rounded-xl p-3 border border-border-primary">
                  <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-2">Pipeline Stats</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-accent-glow rounded-lg p-2 text-center">
                      <div className="text-sm font-bold text-accent-primary">{store.chunks.length || '-'}</div>
                      <div className="text-[9px] text-text-muted">Chunks</div>
                    </div>
                    <div className="bg-emerald-500/5 rounded-lg p-2 text-center">
                      <div className="text-sm font-bold text-emerald-500">{store.totalVectors || '-'}</div>
                      <div className="text-[9px] text-text-muted">Vectors</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Collections Section */}
        <div className="border-t border-border-primary">
          <div className="px-4 py-2.5">
            <button onClick={() => setShowCollections(!showCollections)}
              className="w-full flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors">
              <Bookmark className="w-3 h-3" />
              Collections
              <ChevronRight className={cn('w-3 h-3 ml-auto transition-transform duration-200', showCollections && 'rotate-90')} />
            </button>
            <AnimatePresence>
              {showCollections && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <div className="mt-2 space-y-1.5">
                    {[{ name: 'Default', count: store.chunks.length || 0 }, { name: 'All Files', count: store.parsedFiles.length || 0 }].map(c => (
                      <div key={c.name} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-bg-elevated border border-border-primary hover:border-accent-primary/20 transition-all cursor-pointer">
                        <Archive className="w-3 h-3 text-accent-primary" />
                        <span className="text-xs font-medium text-text-primary flex-1">{c.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-glow text-accent-primary font-medium">{c.count}</span>
                      </div>
                    ))}
                    <button className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[10px] font-medium text-text-muted hover:text-accent-primary hover:bg-accent-primary/5 transition-all w-full border border-dashed border-border-primary hover:border-accent-primary/30">
                      <Plus className="w-3 h-3" />
                      New Collection
                    </button>
                    <button className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[10px] font-medium text-text-muted hover:text-accent-primary hover:bg-accent-primary/5 transition-all w-full">
                      <GitMerge className="w-3 h-3" />
                      Merge Collections
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="border-t border-border-primary">
          <div className="px-4 py-2.5">
            <button onClick={() => setShowRecent(!showRecent)}
              className="w-full flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors">
              <History className="w-3 h-3" />
              Recent Projects
              <ChevronRight className={cn('w-3 h-3 ml-auto transition-transform duration-200', showRecent && 'rotate-90')} />
            </button>
            <AnimatePresence>
              {showRecent && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <div className="mt-2 space-y-1.5">
                    {recentProjects.map((p) => (
                      <div key={p.name} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-bg-elevated border border-border-primary hover:border-accent-primary/20 transition-all cursor-pointer">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent-primary/20 to-accent-dim/20 flex items-center justify-center">
                          <FolderOpen className="w-3 h-3 text-accent-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium text-text-primary truncate">{p.name}</p>
                          <div className="flex items-center gap-1.5 text-[8px] text-text-muted">
                            <span>{p.date}</span>
                            <span>•</span>
                            <span>{p.files} files</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="shrink-0 border-t border-border-primary bg-bg-secondary/90">
        {/* Settings */}
        <button className="w-full flex items-center gap-2 px-4 py-2 text-[10px] text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors">
          <Settings2 className="w-3 h-3" />
          Settings
        </button>

        {/* Status */}
        <div className="px-4 py-2 border-t border-border-primary">
          <div className="flex items-center justify-between text-[9px] text-text-muted">
            <span>Step {activeStep + 1}/7</span>
            <div className="flex items-center gap-1.5">
              <span className={cn('w-1.5 h-1.5 rounded-full', buildComplete ? 'bg-emerald-500' : store.parsedFiles.length > 0 ? 'bg-amber-500' : 'bg-text-muted')} />
              <span>{buildComplete ? 'Ready' : store.parsedFiles.length > 0 ? 'Files loaded' : 'Waiting'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
