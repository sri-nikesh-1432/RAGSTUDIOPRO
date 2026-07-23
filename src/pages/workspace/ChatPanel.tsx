import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Target, X, ChevronDown, ChevronUp,
  Sparkles, Clock, Zap, BarChart3, List, Layers, Search,
  Maximize2, Minimize2
} from 'lucide-react';
import { cn, formatNumber } from '../../lib/utils';

// ─── Chat Panel ─────────────────────────────────────────────────
interface ChatPanelProps {
  chatMessages: any[];
  isSearching: boolean;
  buildComplete: boolean;
  query: string;
  setQuery: (q: string) => void;
  sendQuery: () => void;
  pipelineStatus: string;
  pipelineProgress: number;
}

export function ChatPanel({
  chatMessages, isSearching, buildComplete,
  query, setQuery, sendQuery,
  pipelineStatus, pipelineProgress
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showSources, setShowSources] = useState(true);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (collapsed) {
    return (
      <div className="w-10 shrink-0 border-l border-border-primary bg-bg-secondary flex flex-col items-center py-3 gap-3">
        <button onClick={() => setCollapsed(false)} className="p-1.5 rounded-lg hover:bg-bg-hover transition-all relative">
          <MessageSquare className="w-4 h-4 text-accent-primary" />
          {chatMessages.length > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent-primary text-[7px] text-white flex items-center justify-center font-bold">
              {chatMessages.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 shrink-0 border-l border-border-primary bg-bg-secondary flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border-primary bg-bg-secondary/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-accent-primary" />
            <span className="text-sm font-semibold text-text-primary">Chat</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCollapsed(true)} className="p-1 rounded-lg hover:bg-bg-hover transition-all">
              <X className="w-3 h-3 text-text-muted" />
            </button>
          </div>
        </div>
        {/* Pipeline status indicator */}
        <div className="flex items-center gap-2 text-[10px] text-text-muted">
          <div className={cn(
            'w-1.5 h-1.5 rounded-full',
            buildComplete ? 'bg-emerald-500' : pipelineStatus === 'running' ? 'bg-amber-500 animate-pulse' : 'bg-text-muted'
          )} />
          <span>{buildComplete ? 'Pipeline ready' : pipelineStatus === 'running' ? 'Processing...' : 'Awaiting pipeline'}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rag-panel-scroll p-3 space-y-3">
        {chatMessages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-sm font-medium text-text-secondary mb-1">Ask anything</p>
            <p className="text-[10px] text-text-muted leading-relaxed px-4">
              {buildComplete
                ? 'Ask questions about your documents. Answers include evidence from your knowledge base.'
                : 'Complete the pipeline steps first to enable chat.'}
            </p>
          </div>
        )}

        <AnimatePresence>
          {chatMessages.map((msg: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                'rounded-2xl p-3 text-sm',
                msg.role === 'user' ? 'bg-accent-primary/10 ml-4' : 'bg-bg-elevated mr-4'
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  {msg.role === 'user' ? 'You' : 'RAG'}
                </span>
                {msg.metadata?.latency && (
                  <span className="text-[9px] text-text-tertiary flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {msg.metadata.latency}
                  </span>
                )}
              </div>
              <div className="text-text-secondary leading-relaxed whitespace-pre-wrap text-[13px]">
                {msg.content}
              </div>

              {/* Metadata badges */}
              {msg.metadata && (
                <div className="mt-2 pt-2 border-t border-border-primary flex flex-wrap gap-1.5 text-[9px] text-text-muted">
                  {msg.metadata.chunks && (
                    <span className="px-1.5 py-0.5 rounded bg-accent-glow text-accent-primary">{msg.metadata.chunks} chunks</span>
                  )}
                  {msg.metadata.confidence !== undefined && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">{(msg.metadata.confidence * 100).toFixed(0)}% confident</span>
                  )}
                </div>
              )}

              {/* Evidence */}
              {msg.metadata?.evidence && msg.metadata.evidence.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border-primary">
                  <button
                    onClick={() => setShowSources(!showSources)}
                    className="flex items-center gap-1.5 mb-1.5 text-[10px] font-medium text-accent-primary hover:text-accent-secondary transition-colors"
                  >
                    <Target className="w-3 h-3" />
                    Evidence ({msg.metadata.evidence.length})
                    {showSources ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <AnimatePresence>
                    {showSources && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="space-y-1 overflow-hidden">
                        {msg.metadata.evidence.map((ev: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-bg-primary/50 hover:bg-bg-hover transition-colors cursor-pointer group">
                            <span className="text-[10px] font-mono text-accent-primary shrink-0 mt-0.5">#{ev.rank}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-medium text-text-primary truncate">{ev.source}</span>
                                {ev.page && <span className="text-[8px] px-1 py-0.5 rounded bg-accent-glow text-accent-secondary">p.{ev.page}</span>}
                              </div>
                              <p className="text-[9px] text-text-tertiary line-clamp-1 mt-0.5 group-hover:text-text-secondary transition-colors">{ev.text}</p>
                            </div>
                            <span className="text-[8px] text-text-muted shrink-0">{(ev.score * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isSearching && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent-glow border border-accent-primary/20 text-[11px] text-accent-primary">
            <div className="w-3 h-3 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            Searching and generating...
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-3 py-3 border-t border-border-primary bg-bg-secondary/80">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendQuery()}
            disabled={!buildComplete}
            placeholder={buildComplete ? 'Ask a question...' : 'Complete pipeline first'}
            className="flex-1 bg-bg-elevated rounded-xl border border-border-primary px-3 py-2.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary disabled:opacity-50 transition-colors"
          />
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={sendQuery}
            disabled={!buildComplete || !query.trim() || isSearching}
            className="px-3 py-2.5 rounded-xl bg-gradient-to-br from-accent-primary to-accent-dim text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all"
          >
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Expandable Logs */}
      <div className="shrink-0 border-t border-border-primary">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="w-full flex items-center gap-2 px-4 py-2 text-[10px] text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
        >
          <List className="w-3 h-3" />
          Pipeline Logs
          {showLogs ? <ChevronDown className="w-3 h-3 ml-auto" /> : <ChevronUp className="w-3 h-3 ml-auto" />}
        </button>
        <AnimatePresence>
          {showLogs && (
            <motion.div initial={{ height: 0 }} animate={{ height: 80 }} exit={{ height: 0 }}
              className="overflow-y-auto bg-bg-primary/50 border-t border-border-primary">
              <div className="p-3 space-y-1.5 text-[9px] font-mono text-text-tertiary">
                <div className="flex items-center gap-2"><span className="text-emerald-500">●</span> Pipeline initialized</div>
                {buildComplete && <div className="flex items-center gap-2"><span className="text-emerald-500">●</span> Generation complete</div>}
                <div className="flex items-center gap-2 text-text-muted"><span className="text-accent-primary">●</span> Waiting for queries...</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
