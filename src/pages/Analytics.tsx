import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Clock, Target, Zap, Activity,
  Cpu, HardDrive, MemoryStick, ArrowUpRight, ArrowDownRight,
  RefreshCcw, Download, Settings2, Layers, Brain
} from 'lucide-react';
import { cn, formatNumber, formatDuration } from '../lib/utils';

// ─── Mock Data ────────────────────────────────────────────────────
const metricsOverview = [
  { label: 'Precision', value: '92.4%', change: '+2.1%', positive: true, icon: Target, color: 'from-violet-500 to-purple-600' },
  { label: 'Recall', value: '88.7%', change: '+1.5%', positive: true, icon: TrendingUp, color: 'from-blue-500 to-cyan-500' },
  { label: 'F1 Score', value: '90.5%', change: '+1.8%', positive: true, icon: Activity, color: 'from-emerald-500 to-teal-500' },
  { label: 'Avg Latency', value: '234ms', change: '-12ms', positive: true, icon: Clock, color: 'from-amber-500 to-orange-500' },
];

const queryHistory = [
  { query: 'What is RAG?', latency: 189, precision: 95, recall: 92, chunks: 3, sources: ['rag_paper.pdf'] },
  { query: 'How does chunking work?', latency: 234, precision: 88, recall: 85, chunks: 4, sources: ['chunking_guide.md'] },
  { query: 'Compare FAISS vs ChromaDB', latency: 312, precision: 91, recall: 87, chunks: 5, sources: ['comparison.pdf', 'docs.md'] },
  { query: 'What are embeddings?', latency: 156, precision: 94, recall: 90, chunks: 2, sources: ['embeddings.pdf'] },
  { query: 'Explain cosine similarity', latency: 178, precision: 96, recall: 93, chunks: 3, sources: ['math.pdf'] },
  { query: 'RAG vs fine-tuning', latency: 267, precision: 89, recall: 86, chunks: 4, sources: ['comparison.pdf'] },
  { query: 'Vector database selection', latency: 298, precision: 87, recall: 84, chunks: 5, sources: ['vdb_guide.md'] },
  { query: 'How to evaluate RAG?', latency: 245, precision: 92, recall: 89, chunks: 3, sources: ['eval.pdf'] },
];

const latencyOverTime = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  latency: 150 + Math.random() * 200 + (i > 8 && i < 18 ? 100 : 0),
  embedding: 30 + Math.random() * 40,
  retrieval: 50 + Math.random() * 80,
  generation: 70 + Math.random() * 120,
}));

const chunkDistribution = [
  { range: '0-100', count: 45 },
  { range: '100-200', count: 120 },
  { range: '200-300', count: 280 },
  { range: '300-400', count: 350 },
  { range: '400-500', count: 200 },
  { range: '500+', count: 85 },
];

const systemResources = [
  { label: 'CPU Usage', value: 34, max: 100, unit: '%', icon: Cpu, color: 'bg-blue-500' },
  { label: 'Memory', value: 2.4, max: 8, unit: 'GB', icon: MemoryStick, color: 'bg-purple-500' },
  { label: 'GPU VRAM', value: 4.2, max: 8, unit: 'GB', icon: Zap, color: 'bg-emerald-500' },
  { label: 'Disk I/O', value: 128, max: 500, unit: 'MB/s', icon: HardDrive, color: 'bg-amber-500' },
];

// ─── Mini Bar Chart ───────────────────────────────────────────────
function MiniBarChart({ data, maxVal, color }: { data: number[]; maxVal: number; color: string }) {
  return (
    <div className="flex items-end gap-[2px] h-16">
      {data.map((val, i) => (
        <div
          key={i}
          className={cn('flex-1 rounded-t-sm transition-all', color)}
          style={{ height: `${(val / maxVal) * 100}%`, minHeight: '2px' }}
        />
      ))}
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────
function MetricCard({ metric }: { metric: typeof metricsOverview[0] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-secondary rounded-xl border border-border-primary p-4 hover:border-border-secondary transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br', metric.color)}>
          <metric.icon className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
        </div>
        <div className={cn(
          'flex items-center gap-1 text-xs font-medium',
          metric.positive ? 'text-emerald-400' : 'text-red-400'
        )}>
          {metric.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {metric.change}
        </div>
      </div>
      <div className="text-2xl font-bold text-text-primary mb-0.5">{metric.value}</div>
      <div className="text-xs text-text-tertiary">{metric.label}</div>
    </motion.div>
  );
}

// ─── Bar Chart Component ──────────────────────────────────────────
function BarChart({ data, labelKey, valueKey, color, title }: {
  data: any[]; labelKey: string; valueKey: string; color: string; title: string;
}) {
  const max = Math.max(...data.map(d => d[valueKey]));
  return (
    <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-4">{title}</h3>
      <div className="flex items-end gap-2 h-40">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(d[valueKey] / max) * 100}%` }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className={cn('w-full rounded-t-md min-h-[2px]', color)}
            />
            <span className="text-[9px] text-text-muted truncate w-full text-center">{d[labelKey]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Line Chart Component ─────────────────────────────────────────
function LineChart({ data, title, lines }: {
  data: any[]; title: string; lines: { key: string; color: string; label: string }[];
}) {
  const max = Math.max(...data.flatMap(d => lines.map(l => d[l.key])));
  const height = 160;
  const width = 100;

  return (
    <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <div className="flex items-center gap-4">
          {lines.map(l => (
            <div key={l.key} className="flex items-center gap-1.5">
              <div className={cn('w-2 h-2 rounded-full', l.color)} />
              <span className="text-[10px] text-text-tertiary">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="relative" style={{ height }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map(pct => (
            <line key={pct} x1="0" y1={height * (1 - pct)} x2={width} y2={height * (1 - pct)}
              stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          ))}
          {/* Lines */}
          {lines.map(line => {
            const points = data.map((d, i) =>
              `${(i / (data.length - 1)) * width},${height - (d[line.key] / max) * height}`
            ).join(' ');
            return (
              <polyline key={line.key} points={points} fill="none"
                stroke={line.color.includes('accent') ? '#8b5cf6' :
                        line.color.includes('blue') ? '#3b82f6' :
                        line.color.includes('emerald') ? '#10b981' :
                        line.color.includes('amber') ? '#f59e0b' : '#64748b'}
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            );
          })}
        </svg>
      </div>
      {/* X-axis labels */}
      <div className="flex justify-between mt-2">
        {data.filter((_, i) => i % 4 === 0).map((d, i) => (
          <span key={i} className="text-[9px] text-text-muted">{d.hour}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Analytics ───────────────────────────────────────────────
export default function Analytics() {
  const [timeRange, setTimeRange] = useState('24h');

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
              <p className="text-xs text-text-tertiary">Monitor RAG pipeline performance</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-bg-elevated rounded-lg p-0.5">
              {['1h', '6h', '24h', '7d', '30d'].map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    timeRange === r ? 'bg-accent-primary text-white' : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <button className="p-2 rounded-lg bg-bg-elevated text-text-secondary hover:text-text-primary transition-all">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Metrics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metricsOverview.map((m) => (
            <MetricCard key={m.label} metric={m} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LineChart
            title="Latency Over Time"
            data={latencyOverTime}
            lines={[
              { key: 'latency', color: 'accent', label: 'Total' },
              { key: 'embedding', color: 'blue', label: 'Embedding' },
              { key: 'retrieval', color: 'emerald', label: 'Retrieval' },
              { key: 'generation', color: 'amber', label: 'Generation' },
            ]}
          />

          <BarChart
            data={chunkDistribution}
            labelKey="range"
            valueKey="count"
            color="bg-accent-primary"
            title="Chunk Size Distribution"
          />
        </div>

        {/* System Resources */}
        <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-4">System Resources</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {systemResources.map((res) => {
              const pct = (res.value / res.max) * 100;
              return (
                <div key={res.label} className="bg-bg-elevated rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <res.icon className="w-3.5 h-3.5 text-text-tertiary" />
                    <span className="text-xs text-text-secondary">{res.label}</span>
                  </div>
                  <div className="text-lg font-bold text-text-primary mb-2">
                    {res.value} <span className="text-xs font-normal text-text-tertiary">{res.unit}</span>
                  </div>
                  <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      className={cn('h-full rounded-full', res.color)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Query History Table */}
        <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
          <div className="p-4 border-b border-border-primary">
            <h3 className="text-sm font-semibold text-text-primary">Query History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-primary">
                  {['Query', 'Latency', 'Precision', 'Recall', 'Chunks', 'Sources'].map(h => (
                    <th key={h} className="text-left text-[10px] font-medium text-text-tertiary px-4 py-2 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {queryHistory.map((q, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border-primary/50 hover:bg-bg-hover/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-text-primary max-w-xs truncate">{q.query}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'text-xs font-mono px-2 py-0.5 rounded-full',
                        q.latency < 200 ? 'bg-emerald-500/10 text-emerald-400' :
                        q.latency < 300 ? 'bg-amber-500/10 text-amber-400' :
                        'bg-red-500/10 text-red-400'
                      )}>
                        {q.latency}ms
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-text-secondary">{q.precision}%</td>
                    <td className="px-4 py-3 text-xs font-mono text-text-secondary">{q.recall}%</td>
                    <td className="px-4 py-3 text-xs font-mono text-text-secondary">{q.chunks}</td>
                    <td className="px-4 py-3 text-[10px] text-text-tertiary">{q.sources.join(', ')}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
