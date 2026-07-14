import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Clock, Target, Zap, Activity,
  Cpu, HardDrive, MemoryStick, ArrowUpRight, ArrowDownRight,
  RefreshCcw, AlertCircle, Database, Layers, Brain
} from 'lucide-react';
import { cn, formatNumber } from '../lib/utils';
import { analyticsAPI, pipelineAPI } from '../services/api';

interface PipelineRun {
  run_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  total_duration_ms: number;
  steps: any[];
  analytics: Record<string, any>;
}

interface SystemInfo {
  cpu_count?: number;
  memory_total_gb?: number;
  memory_used_gb?: number;
  memory_percent?: number;
  disk_total_gb?: number;
  disk_used_gb?: number;
  disk_percent?: number;
  python_version?: string;
  platform?: string;
  uptime_seconds?: number;
}

interface SessionInfo {
  parsed_files: number;
  cached_chunks: number;
  cached_embeddings: number;
  active_stores: number;
}

// ─── Metric Card ──────────────────────────────────────────────────
function MetricCard({ label, value, icon: Icon, color, subtext }: {
  label: string; value: string | number; icon: any; color: string; subtext?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-secondary rounded-xl border border-border-primary p-4 hover:border-border-secondary transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br', color)}>
          <Icon className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
        </div>
      </div>
      <div className="text-2xl font-bold text-text-primary mb-0.5">{value}</div>
      <div className="text-xs text-text-tertiary">{label}</div>
      {subtext && <div className="text-[10px] text-text-muted mt-1">{subtext}</div>}
    </motion.div>
  );
}

// ─── Resource Bar ─────────────────────────────────────────────────
function ResourceBar({ label, value, max, unit, icon: Icon, color }: {
  label: string; value: number; max: number; unit: string; icon: any; color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="bg-bg-elevated rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-text-tertiary" />
        <span className="text-xs text-text-secondary">{label}</span>
      </div>
      <div className="text-lg font-bold text-text-primary mb-2">
        {typeof value === 'number' ? value.toFixed(1) : value} <span className="text-xs font-normal text-text-tertiary">{unit}</span>
      </div>
      <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          className={cn('h-full rounded-full', color)}
        />
      </div>
    </div>
  );
}

// ─── Pipeline Run Row ─────────────────────────────────────────────
function PipelineRunRow({ run, index }: { run: PipelineRun; index: number }) {
  const duration = run.total_duration_ms ? `${(run.total_duration_ms / 1000).toFixed(1)}s` : '—';
  const chunks = run.analytics?.vectors_stored || 0;
  const model = run.analytics?.embedding_model || '—';
  const startTime = new Date(run.started_at).toLocaleString();

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.03 }}
      className="border-b border-border-primary/50 hover:bg-bg-hover/50 transition-colors"
    >
      <td className="px-4 py-3 text-xs text-text-secondary font-mono">{run.run_id.slice(0, 8)}</td>
      <td className="px-4 py-3">
        <span className={cn(
          'text-xs font-medium px-2 py-0.5 rounded-full',
          run.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
          run.status === 'failed' ? 'bg-red-500/10 text-red-400' :
          'bg-amber-500/10 text-amber-400'
        )}>
          {run.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-text-tertiary">{startTime}</td>
      <td className="px-4 py-3 text-xs font-mono text-text-secondary">{duration}</td>
      <td className="px-4 py-3 text-xs font-mono text-text-secondary">{chunks}</td>
      <td className="px-4 py-3 text-xs text-text-tertiary">{model}</td>
    </motion.tr>
  );
}

// ─── Empty State ──────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="text-center py-16">
      <Icon className="w-12 h-12 text-text-muted mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-tertiary max-w-md mx-auto">{description}</p>
    </div>
  );
}

// ─── Main Analytics ───────────────────────────────────────────────
export default function Analytics() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sys, session, runs] = await Promise.allSettled([
        analyticsAPI.system(),
        analyticsAPI.session(),
        pipelineAPI.runs(),
      ]);

      if (sys.status === 'fulfilled') setSystemInfo(sys.value);
      if (session.status === 'fulfilled') setSessionInfo(session.value);
      if (runs.status === 'fulfilled') setPipelineRuns(runs.value.runs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Compute aggregate stats from real pipeline runs
  const totalRuns = pipelineRuns.length;
  const completedRuns = pipelineRuns.filter(r => r.status === 'completed').length;
  const totalChunks = pipelineRuns.reduce((sum, r) => sum + (r.analytics?.vectors_stored || 0), 0);
  const avgDuration = totalRuns > 0
    ? pipelineRuns.reduce((sum, r) => sum + (r.total_duration_ms || 0), 0) / totalRuns
    : 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border-primary bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Analytics</h1>
              <p className="text-xs text-text-tertiary">Track all your RAG pipelines and system performance</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-bg-elevated text-text-secondary hover:text-text-primary transition-all"
          >
            <RefreshCcw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Total Pipeline Runs" value={totalRuns} icon={Layers} color="from-violet-500 to-purple-600" />
          <MetricCard label="Completed" value={completedRuns} icon={Target} color="from-emerald-500 to-teal-500" />
          <MetricCard label="Total Chunks Stored" value={formatNumber(totalChunks)} icon={Database} color="from-blue-500 to-cyan-500" />
          <MetricCard label="Avg Duration" value={avgDuration > 0 ? `${(avgDuration / 1000).toFixed(1)}s` : '—'} icon={Clock} color="from-amber-500 to-orange-500" />
        </div>

        {/* Session & System */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Session Info */}
          <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Current Session</h3>
            {sessionInfo ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bg-elevated rounded-lg p-3">
                  <div className="text-lg font-bold text-accent-primary">{sessionInfo.parsed_files}</div>
                  <div className="text-xs text-text-tertiary">Files Parsed</div>
                </div>
                <div className="bg-bg-elevated rounded-lg p-3">
                  <div className="text-lg font-bold text-accent-primary">{sessionInfo.cached_chunks}</div>
                  <div className="text-xs text-text-tertiary">Cached Chunks</div>
                </div>
                <div className="bg-bg-elevated rounded-lg p-3">
                  <div className="text-lg font-bold text-accent-primary">{sessionInfo.cached_embeddings}</div>
                  <div className="text-xs text-text-tertiary">Cached Embeddings</div>
                </div>
                <div className="bg-bg-elevated rounded-lg p-3">
                  <div className="text-lg font-bold text-accent-primary">{sessionInfo.active_stores}</div>
                  <div className="text-xs text-text-tertiary">Active Vector Stores</div>
                </div>
              </div>
            ) : (
              <EmptyState icon={Activity} title="No session data" description="Start building a pipeline to see session analytics." />
            )}
          </div>

          {/* System Resources */}
          <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-4">System Resources</h3>
            {systemInfo ? (
              <div className="grid grid-cols-2 gap-3">
                <ResourceBar label="CPU" value={systemInfo.cpu_count || 0} max={systemInfo.cpu_count || 1} unit="cores" icon={Cpu} color="bg-blue-500" />
                <ResourceBar label="Memory" value={systemInfo.memory_used_gb || 0} max={systemInfo.memory_total_gb || 1} unit="GB" icon={MemoryStick} color="bg-purple-500" />
                <ResourceBar label="Disk" value={systemInfo.disk_used_gb || 0} max={systemInfo.disk_total_gb || 1} unit="GB" icon={HardDrive} color="bg-amber-500" />
                <div className="bg-bg-elevated rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-3.5 h-3.5 text-text-tertiary" />
                    <span className="text-xs text-text-secondary">Python</span>
                  </div>
                  <div className="text-sm font-bold text-text-primary">{systemInfo.python_version || '—'}</div>
                  <div className="text-[10px] text-text-muted truncate">{systemInfo.platform || ''}</div>
                </div>
              </div>
            ) : (
              <EmptyState icon={Cpu} title="No system data" description="System info will appear once the backend reports metrics." />
            )}
          </div>
        </div>

        {/* Pipeline Runs History */}
        <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
          <div className="p-4 border-b border-border-primary flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Pipeline Run History</h3>
            <span className="text-xs text-text-tertiary">{totalRuns} run{totalRuns !== 1 ? 's' : ''}</span>
          </div>
          {pipelineRuns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-primary">
                    {['Run ID', 'Status', 'Started', 'Duration', 'Vectors', 'Model'].map(h => (
                      <th key={h} className="text-left text-[10px] font-medium text-text-tertiary px-4 py-2 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pipelineRuns.map((run, i) => (
                    <PipelineRunRow key={run.run_id} run={run} index={i} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Layers}
              title="No pipeline runs yet"
              description="Build a RAG pipeline in the Builder page to see your run history and analytics here."
            />
          )}
        </div>
      </div>
    </div>
  );
}
