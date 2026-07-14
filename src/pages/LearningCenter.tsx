import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Brain, Database, Search, Layers, MessageSquare,
  ChevronDown, ArrowRight, Zap, Sparkles, Target, GitBranch,
  Shield, TrendingUp, GitCompare, FileText, Globe, Cpu
} from 'lucide-react';
import { cn, estimateTokens, formatNumber } from '../lib/utils';

// ─── Learning Modules Data ────────────────────────────────────────
const learningModules = [
  {
    id: 'chunking',
    title: 'Chunking Simulator',
    icon: Layers,
    color: 'from-cyan-500 to-blue-500',
    description: 'See how documents get split into chunks in real-time',
  },
  {
    id: 'embeddings',
    title: 'Embedding Visualizer',
    icon: Brain,
    color: 'from-purple-500 to-violet-500',
    description: 'Visualize how text becomes numbers',
  },
  {
    id: 'vectordb',
    title: 'Vector DB Explorer',
    icon: Database,
    color: 'from-emerald-500 to-teal-500',
    description: 'Explore how vectors are stored and queried',
  },
  {
    id: 'similarity',
    title: 'Cosine Similarity',
    icon: Target,
    color: 'from-amber-500 to-orange-500',
    description: 'Understand how similarity is calculated',
  },
  {
    id: 'retrieval',
    title: 'Retrieval Explorer',
    icon: Search,
    color: 'from-rose-500 to-pink-500',
    description: 'See how relevant chunks are found',
  },
  {
    id: 'ragvft',
    title: 'RAG vs Fine-Tuning',
    icon: GitCompare,
    color: 'from-indigo-500 to-blue-500',
    description: 'Compare approaches side by side',
  },
];

// ─── Sample Document ──────────────────────────────────────────────
const sampleDocument = `Retrieval-Augmented Generation (RAG) is a technique that combines information retrieval with text generation. It was introduced by Facebook AI Research in 2020 to address the limitations of large language models.

RAG operates in several stages. First, documents are ingested and processed. The text is extracted, cleaned, and prepared for chunking. This step is crucial because the quality of input directly affects the quality of retrieval.

Next, the text is chunked into smaller segments. Common strategies include fixed-size chunking, sentence-based chunking, and semantic chunking. The choice of chunking strategy affects how well the system can retrieve relevant information.

After chunking, each chunk is converted into a dense vector embedding using models like Sentence-BERT or OpenAI's text-embedding-ada-002. These embeddings capture the semantic meaning of the text in a high-dimensional space.

The embeddings are then stored in a vector database such as FAISS, ChromaDB, Pinecone, or Weaviate. These databases are optimized for fast similarity search across millions of vectors.

When a user asks a question, the query is also converted into an embedding. The vector database then finds the most similar chunks using metrics like cosine similarity or Euclidean distance.

The retrieved chunks are combined with the original query and sent to a language model. The LLM uses this augmented context to generate a more accurate and grounded response.

RAG addresses several key problems with pure LLM approaches. It reduces hallucination by grounding responses in real documents. It provides up-to-date information beyond the training cutoff. It enables access to private or domain-specific knowledge. And it provides source attribution for transparency.

The quality of a RAG system depends on several factors: chunk size and overlap, embedding model quality, vector database configuration, retrieval strategy, and the language model used for generation.

Evaluation metrics for RAG include precision (how many retrieved chunks are relevant), recall (how many relevant chunks were retrieved), F1 score (harmonic mean of precision and recall), and faithfulness (how well the generation matches the retrieved context).`;

// ─── Chunking Simulator ───────────────────────────────────────────
function ChunkingSimulator() {
  const [chunkSize, setChunkSize] = useState(200);
  const [overlap, setOverlap] = useState(50);
  const [chunkingMethod, setChunkingMethod] = useState<'fixed' | 'sentence' | 'semantic'>('fixed');

  const chunks = useMemo(() => {
    if (chunkingMethod === 'fixed') {
      const result: string[] = [];
      let start = 0;
      while (start < sampleDocument.length) {
        const end = Math.min(start + chunkSize, sampleDocument.length);
        result.push(sampleDocument.slice(start, end));
        start = end - overlap;
        if (start + overlap >= sampleDocument.length) break;
      }
      return result;
    } else if (chunkingMethod === 'sentence') {
      const sentences = sampleDocument.match(/[^.!?]+[.!?]+/g) || [sampleDocument];
      const result: string[] = [];
      let current = '';
      for (const s of sentences) {
        if (current.length + s.length > chunkSize && current.length > 0) {
          result.push(current.trim());
          current = '';
        }
        current += s;
      }
      if (current.trim()) result.push(current.trim());
      return result;
    } else {
      // Semantic (paragraph-based)
      const paragraphs = sampleDocument.split(/\n\s*\n/);
      const result: string[] = [];
      let current = '';
      for (const p of paragraphs) {
        if (current.length + p.length > chunkSize && current.length > 0) {
          result.push(current.trim());
          current = '';
        }
        current += p + '\n\n';
      }
      if (current.trim()) result.push(current.trim());
      return result;
    }
  }, [chunkSize, overlap, chunkingMethod]);

  const colors = [
    'bg-violet-500/20 border-violet-500/30',
    'bg-blue-500/20 border-blue-500/30',
    'bg-cyan-500/20 border-cyan-500/30',
    'bg-emerald-500/20 border-emerald-500/30',
    'bg-amber-500/20 border-amber-500/30',
    'bg-rose-500/20 border-rose-500/30',
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
          <label className="text-xs font-medium text-text-secondary mb-2 block">Chunk Size (chars)</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={50}
              max={500}
              value={chunkSize}
              onChange={(e) => setChunkSize(Number(e.target.value))}
              className="flex-1 accent-accent-primary"
            />
            <span className="text-sm font-mono text-accent-primary w-12 text-right">{chunkSize}</span>
          </div>
        </div>

        <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
          <label className="text-xs font-medium text-text-secondary mb-2 block">Overlap (chars)</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={Math.min(100, chunkSize / 2)}
              value={overlap}
              onChange={(e) => setOverlap(Number(e.target.value))}
              className="flex-1 accent-accent-primary"
            />
            <span className="text-sm font-mono text-accent-primary w-12 text-right">{overlap}</span>
          </div>
        </div>

        <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
          <label className="text-xs font-medium text-text-secondary mb-2 block">Method</label>
          <div className="flex gap-2">
            {(['fixed', 'sentence', 'semantic'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setChunkingMethod(m)}
                className={cn(
                  'flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  chunkingMethod === m
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
                )}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Characters', value: formatNumber(sampleDocument.length) },
          { label: 'Chunks Generated', value: chunks.length.toString() },
          { label: 'Avg Chunk Size', value: chunks.length > 0 ? formatNumber(Math.round(chunks.reduce((s, c) => s + c.length, 0) / chunks.length)) : '0' },
          { label: 'Est. Tokens', value: formatNumber(estimateTokens(sampleDocument)) },
        ].map((stat) => (
          <div key={stat.label} className="bg-bg-secondary rounded-lg border border-border-primary p-3 text-center">
            <div className="text-lg font-bold text-accent-primary">{stat.value}</div>
            <div className="text-[10px] text-text-tertiary">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Chunks Display */}
      <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Generated Chunks</h3>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {chunks.map((chunk, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'rounded-lg border p-3 transition-all hover:scale-[1.01]',
                colors[i % colors.length]
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-text-primary">Chunk {String(i + 1).padStart(3, '0')}</span>
                <div className="flex items-center gap-3 text-[10px] text-text-tertiary">
                  <span>{chunk.length} chars</span>
                  <span>{estimateTokens(chunk)} tokens</span>
                  <span>{chunk.split(' ').length} words</span>
                </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">{chunk}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Embedding Visualizer ─────────────────────────────────────────
function EmbeddingVisualizer() {
  const [inputText, setInputText] = useState('The cat sat on the mat');
  const [dimensions, setDimensions] = useState<384 | 768 | 1024>(384);
  const [showMatrix, setShowMatrix] = useState(false);

  const embedding = useMemo(() => {
    const result: number[] = [];
    let seed = 0;
    for (let i = 0; i < inputText.length; i++) {
      seed = ((seed << 5) - seed + inputText.charCodeAt(i)) | 0;
    }
    for (let i = 0; i < dimensions; i++) {
      seed = ((seed * 1103515245 + 12345) & 0x7fffffff);
      result.push((seed / 0x7fffffff) * 2 - 1);
    }
    const norm = Math.sqrt(result.reduce((s, v) => s + v * v, 0));
    return result.map(v => v / norm);
  }, [inputText, dimensions]);

  const sampleTexts = [
    'The cat sat on the mat',
    'A feline rested on the rug',
    'Dogs are loyal companions',
    'Machine learning is fascinating',
    'The weather is nice today',
  ];

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
        <label className="text-xs font-medium text-text-secondary mb-2 block">Input Text</label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full h-20 bg-bg-elevated rounded-lg border border-border-primary px-4 py-3 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-accent-primary"
          placeholder="Enter text to embed..."
        />
        <div className="flex gap-2 mt-3 flex-wrap">
          {sampleTexts.map((text) => (
            <button
              key={text}
              onClick={() => setInputText(text)}
              className="px-3 py-1 rounded-full bg-bg-elevated text-[10px] text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all"
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      {/* Dimensions */}
      <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
        <label className="text-xs font-medium text-text-secondary mb-3 block">Embedding Dimensions</label>
        <div className="flex gap-2">
          {[384, 768, 1024].map((d) => (
            <button
              key={d}
              onClick={() => setDimensions(d as any)}
              className={cn(
                'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                dimensions === d
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Visualization */}
      <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-primary">Vector Visualization</h3>
          <button
            onClick={() => setShowMatrix(!showMatrix)}
            className="px-3 py-1 rounded-lg bg-bg-elevated text-xs text-text-secondary hover:text-text-primary transition-all"
          >
            {showMatrix ? 'Show Graph' : 'Show Matrix'}
          </button>
        </div>

        {showMatrix ? (
          <div className="bg-bg-elevated rounded-lg p-4 overflow-auto max-h-[300px]">
            <div className="grid gap-[1px]" style={{ gridTemplateColumns: `repeat(${Math.min(20, dimensions)}, 1fr)` }}>
              {embedding.slice(0, dimensions).slice(0, 200).map((val, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-sm transition-colors"
                  style={{
                    backgroundColor: val > 0
                      ? `rgba(139, 92, 246, ${Math.min(Math.abs(val), 1)})`
                      : `rgba(239, 68, 68, ${Math.min(Math.abs(val), 1)})`,
                  }}
                  title={`[${i}] = ${val.toFixed(4)}`}
                />
              ))}
            </div>
            <p className="text-[10px] text-text-tertiary mt-2">
              Showing first {Math.min(200, dimensions)} dimensions. Purple = positive, Red = negative.
            </p>
          </div>
        ) : (
          <div className="bg-bg-elevated rounded-lg p-4">
            {/* Bar chart visualization */}
            <div className="flex items-end gap-[1px] h-32">
              {embedding.slice(0, dimensions).slice(0, 100).map((val, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm transition-all hover:opacity-100 opacity-70"
                  style={{
                    height: `${Math.abs(val) * 100}%`,
                    backgroundColor: val > 0 ? '#8b5cf6' : '#ef4444',
                    minHeight: '2px',
                  }}
                  title={`dim[${i}] = ${val.toFixed(4)}`}
                />
              ))}
            </div>
            <p className="text-[10px] text-text-tertiary mt-2 text-center">
              First 100 dimensions of the {dimensions}-dimensional embedding
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg-secondary rounded-lg border border-border-primary p-3 text-center">
          <div className="text-lg font-bold text-accent-primary">{dimensions}</div>
          <div className="text-[10px] text-text-tertiary">Dimensions</div>
        </div>
        <div className="bg-bg-secondary rounded-lg border border-border-primary p-3 text-center">
          <div className="text-lg font-bold text-accent-primary">{inputText.length}</div>
          <div className="text-[10px] text-text-tertiary">Characters</div>
        </div>
        <div className="bg-bg-secondary rounded-lg border border-border-primary p-3 text-center">
          <div className="text-lg font-bold text-accent-primary">{estimateTokens(inputText)}</div>
          <div className="text-[10px] text-text-tertiary">Est. Tokens</div>
        </div>
      </div>
    </div>
  );
}

// ─── Cosine Similarity Explorer ───────────────────────────────────
function CosineSimilarityExplorer() {
  const [textA, setTextA] = useState('The cat sat on the mat');
  const [textB, setTextB] = useState('A feline rested on the rug');

  const getEmbedding = (text: string): number[] => {
    const result: number[] = [];
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
      seed = ((seed << 5) - seed + text.charCodeAt(i)) | 0;
    }
    for (let i = 0; i < 64; i++) {
      seed = ((seed * 1103515245 + 12345) & 0x7fffffff);
      result.push((seed / 0x7fffffff) * 2 - 1);
    }
    const norm = Math.sqrt(result.reduce((s, v) => s + v * v, 0));
    return result.map(v => v / norm);
  };

  const embA = getEmbedding(textA);
  const embB = getEmbedding(textB);

  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < embA.length; i++) {
    dotProduct += embA[i] * embB[i];
    normA += embA[i] * embA[i];
    normB += embB[i] * embB[i];
  }
  const cosineSim = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  const angle = Math.acos(Math.max(-1, Math.min(1, cosineSim))) * (180 / Math.PI);

  const pairs = [
    { a: 'The cat sat on the mat', b: 'A feline rested on the rug', expected: 'High' },
    { a: 'The cat sat on the mat', b: 'Dogs are loyal companions', expected: 'Medium' },
    { a: 'The cat sat on the mat', b: 'Quantum physics is complex', expected: 'Low' },
  ];

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
          <label className="text-xs font-medium text-text-secondary mb-2 block">Text A</label>
          <textarea
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            className="w-full h-20 bg-bg-elevated rounded-lg border border-border-primary px-4 py-3 text-sm text-text-primary resize-none focus:outline-none focus:border-accent-primary"
          />
        </div>
        <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
          <label className="text-xs font-medium text-text-secondary mb-2 block">Text B</label>
          <textarea
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            className="w-full h-20 bg-bg-elevated rounded-lg border border-border-primary px-4 py-3 text-sm text-text-primary resize-none focus:outline-none focus:border-accent-primary"
          />
        </div>
      </div>

      {/* Result */}
      <div className="bg-bg-secondary rounded-xl border border-border-primary p-6">
        <div className="flex items-center justify-center gap-8">
          {/* Angle Visualization */}
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Background circle */}
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              {/* Vector A */}
              <line x1="50" y1="50" x2="50" y2="5" stroke="#8b5cf6" strokeWidth="2" />
              <text x="50" y="3" textAnchor="middle" fill="#8b5cf6" fontSize="6" fontWeight="bold">A</text>
              {/* Vector B (rotated based on angle) */}
              <line
                x1="50" y1="50"
                x2={50 + 45 * Math.sin(angle * Math.PI / 180)}
                y2={50 - 45 * Math.cos(angle * Math.PI / 180)}
                stroke="#06b6d4" strokeWidth="2"
              />
              <text
                x={50 + 48 * Math.sin(angle * Math.PI / 180)}
                y={50 - 48 * Math.cos(angle * Math.PI / 180)}
                textAnchor="middle" fill="#06b6d4" fontSize="6" fontWeight="bold"
              >B</text>
              {/* Arc showing angle */}
              <path
                d={`M 50 35 A 15 15 0 0 1 ${50 + 15 * Math.sin(angle * Math.PI / 180)} ${50 - 15 * Math.cos(angle * Math.PI / 180)}`}
                fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" strokeDasharray="2,2"
              />
            </svg>
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold gradient-text mb-1">{(cosineSim * 100).toFixed(1)}%</div>
            <div className="text-sm text-text-secondary">Cosine Similarity</div>
            <div className="text-xs text-text-tertiary mt-1">Angle: {angle.toFixed(1)}°</div>
          </div>
        </div>

        {/* Formula */}
        <div className="mt-6 bg-bg-elevated rounded-lg p-4 font-mono text-xs text-text-secondary">
          <div className="text-text-tertiary mb-2">Formula:</div>
          <div>cos(A, B) = (A · B) / (|A| × |B|)</div>
          <div className="mt-2">
            <span className="text-accent-primary">Dot Product:</span> {dotProduct.toFixed(4)}
          </div>
          <div>
            <span className="text-accent-primary">|A|:</span> {Math.sqrt(normA).toFixed(4)} | <span className="text-accent-primary">|B|:</span> {Math.sqrt(normB).toFixed(4)}
          </div>
        </div>
      </div>

      {/* Preset Pairs */}
      <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Try These Pairs</h3>
        <div className="space-y-2">
          {pairs.map((pair, i) => {
            const eA = getEmbedding(pair.a);
            const eB = getEmbedding(pair.b);
            let dp = 0, nA = 0, nB = 0;
            for (let j = 0; j < eA.length; j++) { dp += eA[j] * eB[j]; nA += eA[j] * eA[j]; nB += eB[j] * eB[j]; }
            const sim = dp / (Math.sqrt(nA) * Math.sqrt(nB));
            return (
              <button
                key={i}
                onClick={() => { setTextA(pair.a); setTextB(pair.b); }}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-bg-elevated hover:bg-bg-hover transition-all text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-text-primary truncate">"{pair.a}" ↔ "{pair.b}"</div>
                  <div className="text-[10px] text-text-tertiary">Expected: {pair.expected} similarity</div>
                </div>
                <div className="text-sm font-bold text-accent-primary ml-4">{(sim * 100).toFixed(1)}%</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── RAG vs Fine-Tuning Comparison ────────────────────────────────
function RAGvsFTComparison() {
  const comparisons = [
    { aspect: 'Knowledge Updates', rag: 'Real-time, dynamic', ft: 'Requires retraining', ragScore: 10, ftScore: 3, winner: 'rag' },
    { aspect: 'Cost', rag: 'Lower (no training)', ft: 'High (GPU hours)', ragScore: 9, ftScore: 3, winner: 'rag' },
    { aspect: 'Hallucination', rag: 'Grounded in sources', ft: 'Can hallucinate', ragScore: 8, ftScore: 5, winner: 'rag' },
    { aspect: 'Depth of Knowledge', rag: 'Surface-level retrieval', ft: 'Deep understanding', ragScore: 6, ftScore: 9, winner: 'ft' },
    { aspect: 'Style Control', rag: 'Limited', ft: 'Excellent', ragScore: 4, ftScore: 9, winner: 'ft' },
    { aspect: 'Latency', rag: 'Higher (retrieval step)', ft: 'Lower', ragScore: 5, ftScore: 8, winner: 'ft' },
    { aspect: 'Transparency', rag: 'Source citations', ft: 'Black box', ragScore: 9, ftScore: 3, winner: 'rag' },
    { aspect: 'Domain Adaptation', rag: 'Easy (add documents)', ft: 'Hard (need data + training)', ragScore: 9, ftScore: 4, winner: 'rag' },
  ];

  return (
    <div className="space-y-4">
      {comparisons.map((c, i) => (
        <motion.div
          key={c.aspect}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-bg-secondary rounded-xl border border-border-primary p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text-primary">{c.aspect}</span>
            <span className={cn(
              'text-[10px] px-2 py-0.5 rounded-full font-medium',
              c.winner === 'rag' ? 'bg-accent-glow text-accent-secondary' : 'bg-emerald-500/20 text-emerald-400'
            )}>
              {c.winner === 'rag' ? 'RAG wins' : 'Fine-tuning wins'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-text-tertiary">RAG</span>
                <span className="text-[10px] font-mono text-accent-primary">{c.ragScore}/10</span>
              </div>
              <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${c.ragScore * 10}%` }}
                  className="h-full bg-accent-primary rounded-full"
                  transition={{ delay: i * 0.05 + 0.2 }}
                />
              </div>
              <p className="text-[10px] text-text-tertiary mt-1">{c.rag}</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-text-tertiary">Fine-tuning</span>
                <span className="text-[10px] font-mono text-emerald-400">{c.ftScore}/10</span>
              </div>
              <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${c.ftScore * 10}%` }}
                  className="h-full bg-emerald-500 rounded-full"
                  transition={{ delay: i * 0.05 + 0.2 }}
                />
              </div>
              <p className="text-[10px] text-text-tertiary mt-1">{c.ft}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main Learning Center ─────────────────────────────────────────
export default function LearningCenter() {
  const [activeModule, setActiveModule] = useState('chunking');

  const renderModule = () => {
    switch (activeModule) {
      case 'chunking': return <ChunkingSimulator />;
      case 'embeddings': return <EmbeddingVisualizer />;
      case 'similarity': return <CosineSimilarityExplorer />;
      case 'ragvft': return <RAGvsFTComparison />;
      case 'vectordb': return (
        <div className="bg-bg-secondary rounded-xl border border-border-primary p-8 text-center">
          <Database className="w-12 h-12 text-accent-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Vector Database Explorer</h3>
          <p className="text-sm text-text-secondary">Connect to a vector database (FAISS, ChromaDB, Qdrant) to explore stored vectors, run similarity searches, and visualize storage patterns.</p>
          <p className="text-xs text-text-tertiary mt-4">Start the Python backend to enable this feature.</p>
        </div>
      );
      case 'retrieval': return (
        <div className="bg-bg-secondary rounded-xl border border-border-primary p-8 text-center">
          <Search className="w-12 h-12 text-accent-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Retrieval Explorer</h3>
          <p className="text-sm text-text-secondary">Upload documents, build an index, and see how semantic search retrieves the most relevant chunks for any query.</p>
          <p className="text-xs text-text-tertiary mt-4">Start the Python backend to enable this feature.</p>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border-primary bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-dim flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Learning Center</h1>
              <p className="text-xs text-text-tertiary">Interactive modules to understand every stage of RAG</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Module Sidebar */}
          <div className="w-64 shrink-0">
            <div className="space-y-1 sticky top-20">
              {learningModules.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => setActiveModule(mod.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left',
                    activeModule === mod.id
                      ? 'bg-accent-glow border border-accent-primary/20'
                      : 'hover:bg-bg-hover border border-transparent'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br shrink-0',
                    mod.color
                  )}>
                    <mod.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className={cn(
                      'text-sm font-medium truncate',
                      activeModule === mod.id ? 'text-accent-secondary' : 'text-text-primary'
                    )}>
                      {mod.title}
                    </div>
                    <div className="text-[10px] text-text-tertiary truncate">{mod.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Module Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModule}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderModule()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
