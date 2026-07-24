import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, RefreshCcw, Trash2, Database, MessageSquare, Layers } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ResetOptions } from './types';

// ─── Reset Dialog ───────────────────────────────────────────────
interface ResetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: (options: ResetOptions) => void;
  variant?: 'reset' | 'new-project';
}

export function ResetDialog({ isOpen, onClose, onReset, variant = 'reset' }: ResetDialogProps) {
  const isNewProject = variant === 'new-project';
  const [options, setOptions] = useState<ResetOptions>(() => ({
    resetPipeline: true,
    removeFiles: variant === 'new-project',
    clearVectors: variant === 'new-project',
    clearChat: variant === 'new-project',
    clearOutputs: variant === 'new-project',
    resetEverything: variant === 'new-project',
  }));

  const handleToggle = (key: keyof ResetOptions | 'resetEverything') => {
    if (key === 'resetEverything') {
      const allTrue = !options.resetEverything;
      setOptions({
        resetPipeline: allTrue,
        removeFiles: allTrue,
        clearVectors: allTrue,
        clearChat: allTrue,
        clearOutputs: allTrue,
        resetEverything: allTrue,
      });
    } else {
      setOptions((prev) => {
        const updated = { ...prev, [key]: !prev[key] };
        // Uncheck "Reset Everything" if any individual option is changed
        updated.resetEverything = false;
        return updated;
      });
    }
  };

  const items = [
    { key: 'resetPipeline' as keyof ResetOptions, label: 'Reset Current Pipeline', desc: 'Clear chunks, embeddings, and step progress', icon: RefreshCcw, color: 'text-amber-500' },
    { key: 'removeFiles' as keyof ResetOptions, label: 'Remove Uploaded Files', desc: 'Delete all uploaded files from the workspace', icon: Trash2, color: 'text-red-500' },
    { key: 'clearVectors' as keyof ResetOptions, label: 'Clear Vector Database', desc: 'Remove all stored vectors from the index', icon: Database, color: 'text-purple-500' },
    { key: 'clearChat' as keyof ResetOptions, label: 'Clear Chat History', desc: 'Delete all conversation messages', icon: MessageSquare, color: 'text-blue-500' },
    { key: 'clearOutputs' as keyof ResetOptions, label: 'Clear Generated Outputs', desc: 'Remove previous responses and analytics', icon: Layers, color: 'text-cyan-500' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-[#fdfcfa] rounded-2xl border border-border-primary shadow-2xl w-full max-w-md mx-4 pointer-events-auto overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border-primary">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', isNewProject ? 'bg-accent-primary/10' : 'bg-red-500/10')}>
                    <RefreshCcw className={cn('w-5 h-5', isNewProject ? 'text-accent-primary' : 'text-red-500')} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-primary">{isNewProject ? 'Start New Project' : 'Reset Workspace'}</h3>
                    <p className="text-xs text-text-muted">{isNewProject ? 'This will clear all current data and start fresh' : 'Select what to reset'}</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-hover transition-all">
                  <X className="w-4 h-4 text-text-muted" />
                </button>
              </div>

              {/* Options */}
              <div className="p-5 space-y-2.5">
                {/* Reset Everything */}
                <button onClick={() => handleToggle('resetEverything')}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border transition-all',
                    options.resetEverything
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-bg-elevated border-border-primary hover:border-red-500/30'
                  )}>
                  <div className={cn(
                    'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                    options.resetEverything ? 'bg-red-500 border-red-500' : 'border-text-muted'
                  )}>
                    {options.resetEverything && <X className="w-3 h-3 text-white" />}
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-sm font-semibold text-text-primary">Reset Everything</div>
                    <div className="text-[10px] text-text-muted">Clear all data and start fresh</div>
                  </div>
                  {options.resetEverything && <RefreshCcw className="w-4 h-4 text-red-500" />}
                </button>

                <div className="border-t border-border-primary my-2" />

                {/* Individual options */}
                {items.map((item) => (
                  <button key={item.key} onClick={() => handleToggle(item.key)}
                    disabled={options.resetEverything}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl border transition-all',
                      options[item.key]
                        ? 'bg-accent-glow border-accent-primary/20'
                        : 'bg-bg-elevated border-border-primary hover:border-accent-primary/20',
                      options.resetEverything && 'opacity-50 cursor-not-allowed'
                    )}>
                    <div className={cn(
                      'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                      options[item.key] ? 'bg-accent-primary border-accent-primary' : 'border-text-muted'
                    )}>
                      {options[item.key] && <X className="w-3 h-3 text-white" />}
                    </div>
                    <item.icon className={cn('w-4 h-4 shrink-0', item.color)} />
                    <div className="text-left flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary truncate">{item.label}</div>
                      <div className="text-[10px] text-text-muted truncate">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 p-5 border-t border-border-primary bg-bg-secondary/50">
                <button onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border-primary text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all">
                  Cancel
                </button>
                <button onClick={() => onReset(options)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:shadow-lg transition-all',
                    isNewProject ? 'bg-gradient-to-r from-accent-primary to-accent-dim hover:shadow-accent-primary/25' : 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-red-500/25'
                  )}
                >
                  <RefreshCcw className="w-4 h-4" />
                  {isNewProject ? 'Start Fresh' : 'Reset'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
