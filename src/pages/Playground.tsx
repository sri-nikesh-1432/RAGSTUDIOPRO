import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Layers, Database, Search, MessageSquare, Sparkles,
  ChevronDown, Play, RotateCcw, Zap, Hash, FileText,
  Settings2, ArrowRight, CheckCircle2, AlertCircle, Clock, RefreshCcw
} from 'lucide-react';
import { cn, estimateTokens } from '../lib/utils';
import { useAppStore } from '../store/appStore';
import { chunkAPI, embedAPI, retrieveAPI, llmAPI, healthAPI, vectorAPI } from '../services/api';

const experiments = [
  { id: 'prompt-engineering', title: 'Prompt Engineering', icon: MessageSquare, color: 'from-violet-500 to-purple-600', description: 'Experiment with different prompting strategies' },
  { id: 'token-counter', title: 'Token Counter', icon: Hash, color: 'from-amber-500 to-orange-500', description: 'See how text gets tokenized' },
  { id: 'context-window', title: 'Context Window', icon: FileText, color: 'from-blue-500 to-cyan-500', description: 'Visualize context window limits' },
  { id: 'rag-pipeline-sim', title: 'RAG Pipeline Sim', icon: Zap, color: 'from-emerald-500 to-teal-500', description: 'Simulate a full RAG pipeline' },
];

// ─── Prompt Engineering ────────────────────────────────────────────
function PromptEngineering() {
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant. Answer questions based on the provided context.');
  const [userPrompt, setUserPrompt] = useState('What is RAG?');
  const [context, setContext] = useState('RAG (Retrieval-Augmented Generation) combines information retrieval with text generation to produce more accurate and grounded responses.');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(256);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAnswer, setGeneratedAnswer] = useState('');
  const [tokenUsage, setTokenUsage] = useState<any>(null);
  const store = useAppStore();

  const promptTemplates = [
    { name: 'Basic QA', system: 'Answer the question based on the context.', user: 'Question: {question}\n\nContext: {context}' },
    { name: 'Chain of Thought', system: 'Think step by step before answering.', user: 'Question: {question}\n\nContext: {context}\n\nLet me think step by step:' },
    { name: 'Structured Output', system: 'Answer in JSON format with "answer", "confidence", and "sources" fields.', user: 'Question: {question}\n\nContext: {context}' },
    { name: 'Few-Shot', system: 'Answer based on context. Use the format below.', user: 'Example: What is X?\nAnswer: X is...\n\nQuestion: {question}\nAnswer:' },
  ];

  const fullPrompt = `${systemPrompt}\n\n---\n\nContext:\n${context}\n\n---\n\nUser: ${userPrompt}\n\nAssistant:`;

  const generateAnswer = async () => {
    setIsGenerating(true);
    setGeneratedAnswer('');
    setTokenUsage(null);
    try {
      const result = await llmAPI.generate({
        query: userPrompt,
        context: [context],
        provider: store.llmProvider,
        model: store.llmModel,
        system_prompt: systemPrompt,
        temperature,
        max_tokens: maxTokens,
        api_key: store.openaiApiKey || undefined,
      });
      if (result.success) {
        setGeneratedAnswer(result.answer);
        setTokenUsage({
          prompt_tokens: result.prompt_tokens,
          completion_tokens: result.completion_tokens,
          total_tokens: result.total_tokens,
          time_ms: result.total_time_ms,
        });
      } else {
        setGeneratedAnswer(`Error: ${result.error}`);
      }
    } catch (err: any) {
      setGeneratedAnswer(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
        <label className="text-xs font-medium text-text-secondary mb-3 block">Quick Templates</label>
        <div className="flex gap-2 flex-wrap">
          {promptTemplates.map((t) => (
            <button key={t.name} onClick={() => { setSystemPrompt(t.system); setUserPrompt(t.user); }}
              className="px-3 py-1.5 rounded-lg bg-bg-elevated text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all">{t.name}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
          <label className="text-xs font-medium text-text-secondary mb-2 block">System Prompt</label>
          <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full h-32 bg-bg-elevated rounded-lg border border-border-primary px-4 py-3 text-sm text-text-primary font-mono resize-none focus:outline-none focus:border-accent-primary" />
        </div>
        <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
          <label className="text-xs font-medium text-text-secondary mb-2 block">User Prompt</label>
          <textarea value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)}
            className="w-full h-32 bg-bg-elevated rounded-lg border border-border-primary px-4 py-3 text-sm text-text-primary font-mono resize-none focus:outline-none focus:border-accent-primary" />
        </div>
      </div>

      <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
        <label className="text-xs font-medium text-text-secondary mb-2 block">Retrieved Context</label>
        <textarea value={context} onChange={(e) => setContext(e.target.value)}
          className="w-full h-24 bg-bg-elevated rounded-lg border border-border-primary px-4 py-3 text-sm text-text-primary font-mono resize-none focus:outline-none focus:border-accent-primary" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
          <label className="text-xs font-medium text-text-secondary mb-2 block">Temperature: {temperature}</label>
          <input type="range" min={0} max={2} step={0.1} value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} className="w-full accent-accent-primary" />
        </div>
        <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
          <label className="text-xs font-medium text-text-secondary mb-2 block">Max Tokens: {maxTokens}</label>
          <input type="range" min={64} max={2048} step={64} value={maxTokens} onChange={(e) => setMaxTokens(Number(e.target.value))} className="w-full accent-accent-primary" />
        </div>
      </div>

      <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-medium text-text-secondary">Full Prompt Preview</label>
          <div className="flex items-center gap-3 text-[10px] text-text-tertiary">
            <span>{fullPrompt.length} chars</span>
            <span>{estimateTokens(fullPrompt)} tokens</span>
          </div>
        </div>
        <pre className="bg-bg-elevated rounded-lg p-4 text-xs text-text-secondary font-mono whitespace-pre-wrap overflow-auto max-h-60">{fullPrompt}</pre>
      </div>

      <button onClick={generateAnswer} disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent-primary text-white font-medium text-sm hover:shadow-lg hover:shadow-accent-primary/25 transition-all disabled:opacity-50">
        {isGenerating ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Answer</>}
      </button>

      {generatedAnswer && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-bg-secondary rounded-xl border border-border-primary p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-accent-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Generated Answer</h3>
          </div>
          <div className="bg-bg-elevated rounded-lg p-4 text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{generatedAnswer}</div>
          {tokenUsage && (
            <div className="mt-3 flex items-center gap-4 text-[10px] text-text-tertiary">
              <span>📊 Tokens: {tokenUsage.total_tokens}</span>
              <span>⏱️ Latency: {(tokenUsage.time_ms / 1000).toFixed(2)}s</span>
              <span>📝 Prompt: {tokenUsage.prompt_tokens}</span>
              <span>💬 Completion: {tokenUsage.completion_tokens}</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ─── Token Counter ─────────────────────────────────────────────────
function TokenCounter() {
  const [input, setInput] = useState('The quick brown fox jumps over the lazy dog. RAG combines retrieval with generation for better AI responses.');

  const tokenEstimate = Math.ceil(input.length / 4);
  const words = input.split(/\s+/).filter(Boolean).length;
  const sentences = input.split(/[.!?]+/).filter(Boolean).length;
  const chars = input.length;

  const simulatedTokens = useMemo(() => {
    const tokens: { text: string; color: string }[] = [];
    const words = input.split(/(\s+)/);
    const colors = ['bg-violet-500/20', 'bg-blue-500/20', 'bg-cyan-500/20', 'bg-emerald-500/20', 'bg-amber-500/20', 'bg-rose-500/20'];
    let ci = 0;
    for (const word of words) {
      if (/^\s+$/.test(word)) {
        tokens.push({ text: word, color: 'bg-transparent' });
      } else {
        if (word.length > 6) {
          const mid = Math.floor(word.length / 2);
          tokens.push({ text: word.slice(0, mid), color: colors[ci % colors.length] });
          tokens.push({ text: word.slice(mid), color: colors[(ci + 1) % colors.length] });
          ci += 2;
        } else {
          tokens.push({ text: word, color: colors[ci % colors.length] });
          ci++;
        }
      }
    }
    return tokens;
  }, [input]);

  return (
    <div className="space-y-4">
      <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
        <label className="text-xs font-medium text-text-secondary mb-2 block">Enter text to tokenize</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)}
          className="w-full h-28 bg-bg-elevated rounded-lg border border-border-primary px-4 py-3 text-sm text-text-primary resize-none focus:outline-none focus:border-accent-primary" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Characters', value: chars, icon: 'Aa' },
          { label: 'Words', value: words, icon: 'W' },
          { label: 'Sentences', value: sentences, icon: 'S' },
          { label: 'Est. Tokens', value: tokenEstimate, icon: 'T' },
        ].map((s) => (
          <div key={s.label} className="bg-bg-secondary rounded-lg border border-border-primary p-3 text-center">
            <div className="text-xs text-text-tertiary mb-1">{s.icon}</div>
            <div className="text-lg font-bold text-accent-primary">{s.value}</div>
            <div className="text-[10px] text-text-tertiary">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
        <h3 className="text-xs font-medium text-text-secondary mb-3">Tokenized Output (Simulated BPE)</h3>
        <div className="flex flex-wrap gap-1">
          {simulatedTokens.map((t, i) => (
            <span key={i} className={cn('px-2 py-1 rounded text-xs font-mono', t.color, t.color === 'bg-transparent' ? 'text-text-muted' : 'text-text-primary')}>{t.text}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Context Window Visualizer ─────────────────────────────────────
function ContextWindowVisualizer() {
  const [windowSize, setWindowSize] = useState(4096);
  const [systemTokens, setSystemTokens] = useState(200);
  const [contextTokens, setContextTokens] = useState(1500);
  const [historyTokens, setHistoryTokens] = useState(800);

  const used = systemTokens + contextTokens + historyTokens;
  const remaining = Math.max(0, windowSize - used);
  const usagePercent = (used / windowSize) * 100;

  const sections = [
    { label: 'System Prompt', tokens: systemTokens, color: 'bg-violet-500' },
    { label: 'Retrieved Context', tokens: contextTokens, color: 'bg-blue-500' },
    { label: 'Chat History', tokens: historyTokens, color: 'bg-cyan-500' },
    { label: 'Available for Response', tokens: remaining, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
        <label className="text-xs font-medium text-text-secondary mb-2 block">Context Window Size</label>
        <div className="flex gap-2">
          {[2048, 4096, 8192, 16384, 32768, 128000].map((size) => (
            <button key={size} onClick={() => setWindowSize(size)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', windowSize === size ? 'bg-accent-primary text-white' : 'bg-bg-elevated text-text-secondary hover:text-text-primary')}>
              {size >= 1000 ? `${size / 1000}K` : size}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-primary">Window Usage</h3>
          <span className={cn('text-sm font-mono font-bold', usagePercent > 90 ? 'text-red-400' : usagePercent > 70 ? 'text-amber-400' : 'text-emerald-400')}>
            {usagePercent.toFixed(1)}%
          </span>
        </div>
        <div className="h-8 bg-bg-elevated rounded-lg overflow-hidden flex">
          {sections.map((s, i) => (
            <motion.div key={s.label} initial={{ width: 0 }} animate={{ width: `${(s.tokens / windowSize) * 100}%` }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={cn('h-full relative group', s.color)} style={{ minWidth: s.tokens > 0 ? '2px' : '0' }}>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-bg-elevated rounded text-[10px] text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-border-primary">
                {s.tokens} tokens
              </div>
            </motion.div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 mt-3">
          {sections.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className={cn('w-3 h-3 rounded-sm', s.color)} />
              <span className="text-[10px] text-text-tertiary">{s.label}: {s.tokens} tokens</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'System Prompt', value: systemTokens, set: setSystemTokens },
          { label: 'Retrieved Context', value: contextTokens, set: setContextTokens },
          { label: 'Chat History', value: historyTokens, set: setHistoryTokens },
        ].map((s) => (
          <div key={s.label} className="bg-bg-secondary rounded-xl border border-border-primary p-4">
            <label className="text-xs font-medium text-text-secondary mb-2 block">{s.label}</label>
            <div className="flex items-center gap-3">
              <input type="range" min={0} max={windowSize / 2} value={s.value} onChange={(e) => s.set(Number(e.target.value))} className="flex-1 accent-accent-primary" />
              <span className="text-xs font-mono text-accent-primary w-12 text-right">{s.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RAG Pipeline Simulator (Real Backend) ─────────────────────────
function RAGPipelineSimulator() {
  const store = useAppStore();
  const [query, setQuery] = useState('What is RAG?');
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [stepResults, setStepResults] = useState<Record<number, any>>({});
  const [finalAnswer, setFinalAnswer] = useState('');
  const [error, setError] = useState('');

  const steps = [
    { name: 'File Parsing', icon: '📄', detail: 'Parsing document...' },
    { name: 'Chunking', icon: '✂️', detail: 'Splitting into chunks...' },
    { name: 'Embedding', icon: '🧠', detail: 'Generating vectors...' },
    { name: 'Vector Storage', icon: '🗄️', detail: 'Saving to index...' },
    { name: 'Retrieval', icon: '🔍', detail: 'Finding relevant chunks...' },
    { name: 'Generation', icon: '🤖', detail: 'Generating response...' },
  ];

  const runPipeline = async () => {
    if (!store.currentText) {
      setError('No text loaded. Go to RAG Builder to upload a file first.');
      return;
    }

    setIsRunning(true);
    setCurrentStep(0);
    setStepResults({});
    setFinalAnswer('');
    setError('');

    try {
      // Step 1: Parse
      setStepResults(prev => ({ ...prev, 0: { status: 'running' } }));
      await new Promise(r => setTimeout(r, 500));
      setStepResults(prev => ({ ...prev, 0: { status: 'done', result: `${store.currentText.length} characters parsed` } }));

      // Step 2: Chunk
      setCurrentStep(1);
      setStepResults(prev => ({ ...prev, 1: { status: 'running' } }));
      const chunks = await chunkAPI.chunk({ text: store.currentText, method: store.chunkMethod, chunk_size: store.chunkSize, overlap: store.chunkOverlap });
      setStepResults(prev => ({ ...prev, 1: { status: chunks.success ? 'done' : 'error', result: chunks.success ? `${chunks.count} chunks created` : chunks.error } }));

      // Step 3: Embed
      setCurrentStep(2);
      setStepResults(prev => ({ ...prev, 2: { status: 'running' } }));
      const embeddings = await embedAPI.generate({ texts: chunks.chunks.map((c: any) => c.text), model: store.embeddingModel });
      setStepResults(prev => ({ ...prev, 2: { status: embeddings.success ? 'done' : 'error', result: embeddings.success ? `${embeddings.count} embeddings (${embeddings.dimensions}d)` : embeddings.error } }));

      // Step 4: Store
      setCurrentStep(3);
      setStepResults(prev => ({ ...prev, 3: { status: 'running' } }));
      await vectorAPI.add({ ids: chunks.chunks.map((c: any) => c.id), embeddings: embeddings.embeddings, texts: chunks.chunks.map((c: any) => c.text), collection: store.collectionName, store_type: store.vectorStore, dimensions: embeddings.dimensions });
      setStepResults(prev => ({ ...prev, 3: { status: 'done', result: `Stored in ${store.vectorStore}` } }));

      // Step 5: Retrieve
      setCurrentStep(4);
      setStepResults(prev => ({ ...prev, 4: { status: 'running' } }));
      const retrieval = await retrieveAPI.search({ query, collection: store.collectionName, store_type: store.vectorStore, top_k: 5, embedding_model: store.embeddingModel });
      setStepResults(prev => ({ ...prev, 4: { status: retrieval.success ? 'done' : 'error', result: retrieval.success ? `${retrieval.results.length} results found in ${retrieval.timing.total_ms.toFixed(0)}ms` : 'Retrieval failed' } }));

      // Step 6: Generate
      setCurrentStep(5);
      setStepResults(prev => ({ ...prev, 5: { status: 'running' } }));
      if (retrieval.success && retrieval.results.length > 0) {
        const generation = await llmAPI.generate({ query, context: retrieval.results.map((r: any) => r.text), provider: store.llmProvider, model: store.llmModel, api_key: store.openaiApiKey || undefined });
        if (generation.success) {
          setFinalAnswer(generation.answer);
          setStepResults(prev => ({ ...prev, 5: { status: 'done', result: `${generation.total_tokens} tokens in ${generation.total_time_ms.toFixed(0)}ms` } }));
        } else {
          setStepResults(prev => ({ ...prev, 5: { status: 'error', result: generation.error } }));
          setFinalAnswer(`LLM Error: ${generation.error}`);
        }
      } else {
        setStepResults(prev => ({ ...prev, 5: { status: 'error', result: 'No context available' } }));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
        <label className="text-xs font-medium text-text-secondary mb-2 block">Your Query</label>
        <div className="flex gap-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-bg-elevated rounded-lg border border-border-primary px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
            placeholder="Ask a question..." />
          <button onClick={runPipeline} disabled={isRunning || !store.currentText}
            className={cn('flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all',
              isRunning ? 'bg-accent-dim text-white/50 cursor-not-allowed' : 'bg-accent-primary text-white hover:shadow-lg hover:shadow-accent-primary/25')}>
            {isRunning ? <Clock className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isRunning ? 'Running...' : 'Run Pipeline'}
          </button>
        </div>
        {!store.currentText && <p className="text-[10px] text-amber-400 mt-2">⚠️ No text loaded. Upload a file in RAG Builder first.</p>}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Pipeline Execution</h3>
        <div className="space-y-3">
          {steps.map((s, i) => {
            const result = stepResults[i];
            const status = !result ? 'pending' : result.status === 'running' ? 'running' : result.status === 'done' ? 'done' : 'error';
            return (
              <motion.div key={s.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={cn('flex items-center gap-4 p-3 rounded-lg border transition-all',
                  status === 'done' ? 'bg-emerald-500/10 border-emerald-500/20' :
                  status === 'error' ? 'bg-red-500/10 border-red-500/20' :
                  status === 'running' ? 'bg-accent-glow border-accent-primary/20 animate-pulse' :
                  'bg-bg-elevated border-border-primary')}>
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm',
                  status === 'done' ? 'bg-emerald-500 text-white' :
                  status === 'error' ? 'bg-red-500 text-white' :
                  status === 'running' ? 'bg-accent-primary text-white' :
                  'bg-bg-hover text-text-muted')}>
                  {status === 'done' ? '✓' : status === 'error' ? '✗' : status === 'running' ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-text-primary">{s.icon} {s.name}</div>
                  <div className="text-xs text-text-tertiary">{status === 'running' ? s.detail : result?.result || 'Waiting...'}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {finalAnswer && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-bg-secondary rounded-xl border border-border-primary p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-accent-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Generated Response</h3>
          </div>
          <div className="bg-bg-elevated rounded-lg p-4 text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{finalAnswer}</div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Playground ───────────────────────────────────────────────
export default function Playground() {
  const [activeExperiment, setActiveExperiment] = useState('prompt-engineering');
  const store = useAppStore();

  useEffect(() => {
    healthAPI.check().then(() => store.setBackendConnected(true)).catch(() => store.setBackendConnected(false));
  }, []);

  const renderExperiment = () => {
    switch (activeExperiment) {
      case 'prompt-engineering': return <PromptEngineering />;
      case 'token-counter': return <TokenCounter />;
      case 'context-window': return <ContextWindowVisualizer />;
      case 'rag-pipeline-sim': return <RAGPipelineSimulator />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="border-b border-border-primary bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Playground</h1>
              <p className="text-xs text-text-tertiary">Experiment with RAG concepts interactively</p>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          <div className="w-64 shrink-0">
            <div className="space-y-1 sticky top-20">
              {experiments.map((exp) => (
                <button key={exp.id} onClick={() => setActiveExperiment(exp.id)}
                  className={cn('w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left',
                    activeExperiment === exp.id ? 'bg-accent-glow border border-accent-primary/20' : 'hover:bg-bg-hover border border-transparent')}>
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br shrink-0', exp.color)}>
                    <exp.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className={cn('text-sm font-medium truncate', activeExperiment === exp.id ? 'text-accent-secondary' : 'text-text-primary')}>{exp.title}</div>
                    <div className="text-[10px] text-text-tertiary truncate">{exp.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={activeExperiment} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {renderExperiment()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
