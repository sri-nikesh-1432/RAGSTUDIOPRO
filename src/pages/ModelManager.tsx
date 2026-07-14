import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Download, Trash2, RefreshCcw, HardDrive, Zap,
  CheckCircle2, AlertCircle, Clock, Settings2, Layers,
  Brain, Database, BarChart3, ArrowUpRight, ExternalLink,
  Plus, Search, Filter, Grid3X3, List, Server, Wifi, WifiOff
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppStore } from '../store/appStore';
import { embedAPI, llmAPI, healthAPI, analyticsAPI } from '../services/api';

const tabs = [
  { id: 'llm', label: 'LLM Models', icon: Brain },
  { id: 'embeddings', label: 'Embedding Models', icon: Layers },
  { id: 'datasets', label: 'Projects', icon: Database },
  { id: 'benchmarks', label: 'System', icon: BarChart3 },
];

// ─── Model Card ────────────────────────────────────────────────────
function ModelCard({ model, type }: { model: any; type: 'llm' | 'embedding' }) {
  const store = useAppStore();

  const selectModel = () => {
    if (type === 'llm') {
      store.setLlmModel(model.id);
    } else {
      store.setEmbeddingModel(model.id);
    }
  };

  const isSelected = type === 'llm' ? store.llmModel === model.id : store.embeddingModel === model.id;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={cn('bg-bg-secondary rounded-xl border p-4 hover:border-border-secondary transition-all',
        isSelected ? 'border-accent-primary/50 bg-accent-glow/30' : 'border-border-primary')}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center',
            type === 'llm' ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-cyan-500')}>
            {type === 'llm' ? <Brain className="w-5 h-5 text-white" /> : <Layers className="w-5 h-5 text-white" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{model.name}</h3>
            <p className="text-[10px] text-text-tertiary">{model.provider || model.display_name || ''}</p>
          </div>
        </div>
        {isSelected && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent-primary/20 text-accent-primary">Selected</span>}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-bg-elevated rounded-lg px-3 py-1.5">
          <div className="text-[10px] text-text-tertiary">Size</div>
          <div className="text-xs font-medium text-text-primary">{model.size}</div>
        </div>
        <div className="bg-bg-elevated rounded-lg px-3 py-1.5">
          <div className="text-[10px] text-text-tertiary">{type === 'llm' ? 'Parameters' : 'Dimensions'}</div>
          <div className="text-xs font-medium text-text-primary">{type === 'llm' ? (model.params || '-') : `${model.dims}d`}</div>
        </div>
      </div>

      {type === 'embedding' && (
        <div className="flex gap-2 mb-3">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-elevated text-text-tertiary">Speed: {model.speed}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-elevated text-text-tertiary">Quality: {model.quality}</span>
        </div>
      )}

      <button onClick={selectModel}
        className={cn('w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all',
          isSelected ? 'bg-accent-primary text-white' : 'bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-bg-hover')}>
        {isSelected ? <><CheckCircle2 className="w-3 h-3" /> Active</> : <><Settings2 className="w-3 h-3" /> Select</>}
      </button>
    </motion.div>
  );
}

// ─── System Info ───────────────────────────────────────────────────
function SystemInfo() {
  const [sysInfo, setSysInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.system().then(setSysInfo).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-text-tertiary">Loading system info...</div>;
  if (!sysInfo) return <div className="text-center py-8 text-text-tertiary">Could not load system info</div>;

  const resources = [
    { label: 'CPU Cores', value: sysInfo.cpu_count || 'N/A', icon: Cpu, color: 'bg-blue-500' },
    { label: 'Python', value: sysInfo.python_version || 'N/A', icon: Server, color: 'bg-emerald-500' },
    { label: 'Platform', value: sysInfo.platform || 'N/A', icon: HardDrive, color: 'bg-amber-500' },
    { label: 'PyTorch', value: sysInfo.torch_version || 'Not installed', icon: Zap, color: 'bg-violet-500' },
    { label: 'CUDA', value: sysInfo.cuda_available ? 'Available' : 'Not available', icon: Cpu, color: sysInfo.cuda_available ? 'bg-emerald-500' : 'bg-red-500' },
    { label: 'GPU', value: sysInfo.gpu_name || 'None', icon: Zap, color: 'bg-cyan-500' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-4">System Resources</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {resources.map((res) => (
            <div key={res.label} className="bg-bg-elevated rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <res.icon className="w-3.5 h-3.5 text-text-tertiary" />
                <span className="text-xs text-text-secondary">{res.label}</span>
              </div>
              <div className="text-sm font-bold text-text-primary">{res.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Model Manager ────────────────────────────────────────────
export default function ModelManager() {
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState('llm');
  const [llmModels, setLlmModels] = useState<any[]>([]);
  const [embedModels, setEmbedModels] = useState<any[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<{ available: boolean; models: any[] }>({ available: false, models: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch embedding models
    embedAPI.models().then((r) => setEmbedModels(r.models)).catch(() => {});
    // Fetch LLM models from Ollama + OpenAI
    llmAPI.ollamaStatus().then((status) => {
      setOllamaStatus(status);
      const ollamaModels = (status.models || []).map((m: any) => ({
        id: m.name,
        name: m.name,
        provider: 'Ollama (Local)',
        size: m.size ? `${(m.size / 1e9).toFixed(1)}GB` : 'Unknown',
        params: '-',
        local: true,
      }));
      const openaiModels = [
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', size: 'API', params: '-', local: false },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', size: 'API', params: '-', local: false },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', size: 'API', params: '-', local: false },
      ];
      setLlmModels([...ollamaModels, ...openaiModels]);
    }).catch(() => {
      setLlmModels([
        { id: 'llama3.2', name: 'Llama 3.2', provider: 'Ollama (not connected)', size: '2.0GB', params: '3B', local: true },
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', size: 'API', params: '-', local: false },
      ]);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <div className="border-b border-border-primary bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Model Manager</h1>
              <p className="text-xs text-text-tertiary">Manage AI models, embeddings, and datasets</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-elevated">
              <div className={cn('w-2 h-2 rounded-full', ollamaStatus.available ? 'bg-emerald-400 animate-pulse' : 'bg-red-400')} />
              <span className="text-xs text-text-secondary">{ollamaStatus.available ? 'Ollama Connected' : 'Ollama Offline'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-1 mb-6 bg-bg-secondary rounded-xl p-1 border border-border-primary w-fit">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id ? 'bg-accent-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover')}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-text-tertiary">Loading models...</div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {activeTab === 'llm' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {llmModels.map((m) => <ModelCard key={m.id} model={m} type="llm" />)}
                </div>
              )}
              {activeTab === 'embeddings' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {embedModels.map((m) => <ModelCard key={m.name} model={{ id: m.name, ...m }} type="embedding" />)}
                </div>
              )}
              {activeTab === 'datasets' && (
                <div className="text-center py-12 text-text-tertiary">
                  <Database className="w-12 h-12 mx-auto mb-3 text-text-muted" />
                  <p className="text-sm">Projects are managed in the RAG Builder</p>
                  <p className="text-xs mt-1">Build a pipeline to create vector collections</p>
                </div>
              )}
              {activeTab === 'benchmarks' && <SystemInfo />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
