import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Layers, FileText, Brain, Database, Search, MessageSquare,
  Globe, BarChart3, Shield, AlertCircle, ChevronDown, ChevronRight,
  Image, Video, Headphones, Cpu, Eye, BookOpen, CheckCircle2,
  Target, Network, Sparkles, Atom, Binary, MessageCircle, Settings,
  Lightbulb, Gauge
} from 'lucide-react';
import { cn } from '../lib/utils';

// ─── Section Data ────────────────────────────────────────────────
const sections = [
  { id: 'about', title: 'About RAG Studio Pro', icon: Sparkles, category: 'Application' },
  { id: 'what-is-rag', title: 'What is RAG?', icon: Zap, category: 'Core Concepts' },
  { id: 'ai-fundamentals', title: 'AI & Machine Learning', icon: Atom, category: 'Foundations' },
  { id: 'deep-learning', title: 'Deep Learning & Neural Nets', icon: Binary, category: 'Foundations' },
  { id: 'nlp', title: 'Natural Language Processing', icon: MessageCircle, category: 'Foundations' },
  { id: 'llms', title: 'Large Language Models', icon: Cpu, category: 'Foundations' },
  { id: 'transformers', title: 'Transformers & Attention', icon: Settings, category: 'Foundations' },
  { id: 'tokenization', title: 'Tokenization', icon: Layers, category: 'Foundations' },
  { id: 'pipeline', title: 'The RAG Pipeline', icon: Layers, category: 'Core Concepts' },
  { id: 'multimodal-rag', title: 'Multimodal RAG', icon: Globe, category: 'Core Concepts' },
  { id: 'ingestion', title: 'Ingestion', icon: FileText, category: 'Pipeline' },
  { id: 'chunking', title: 'Chunking & Overlap', icon: Layers, category: 'Pipeline' },
  { id: 'embeddings', title: 'Embeddings', icon: Brain, category: 'Pipeline' },
  { id: 'vector-stores', title: 'Vector Databases', icon: Database, category: 'Pipeline' },
  { id: 'similarity', title: 'Cosine Similarity & Search', icon: Search, category: 'Pipeline' },
  { id: 'retrieval', title: 'Retrieval Strategies', icon: Search, category: 'Pipeline' },
  { id: 'generation', title: 'Generation', icon: MessageSquare, category: 'Pipeline' },
  { id: 'prompt-engineering', title: 'Prompt Engineering', icon: Lightbulb, category: 'Advanced' },
  { id: 'hallucinations', title: 'Hallucinations & Context', icon: Shield, category: 'Advanced' },
  { id: 'speech-rag', title: 'Speech RAG', icon: Headphones, category: 'Multimodal' },
  { id: 'vision-rag', title: 'Vision RAG', icon: Eye, category: 'Multimodal' },
  { id: 'graph-rag', title: 'Graph RAG', icon: Network, category: 'Advanced' },
  { id: 'agentic-rag', title: 'Agentic RAG', icon: Cpu, category: 'Advanced' },
  { id: 'providers', title: 'LLM Providers', icon: Globe, category: 'Configuration' },
  { id: 'evidence', title: 'Evidence Timeline', icon: Target, category: 'Features' },
  { id: 'metrics', title: 'Evaluation Metrics', icon: Gauge, category: 'Advanced' },
  { id: 'best-practices', title: 'Best Practices', icon: Shield, category: 'Guide' },
  { id: 'faq', title: 'FAQ', icon: AlertCircle, category: 'Guide' },
];

// ─── Expandable Section ──────────────────────────────────────────
function DocSection({ id, title, icon: Icon, children, defaultOpen = false }: {
  id: string; title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div id={id} className="border border-border-primary rounded-2xl overflow-hidden bg-bg-secondary">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-bg-hover transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-primary/10 to-accent-dim/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-accent-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-text-tertiary" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-border-primary pt-4 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Info Card ───────────────────────────────────────────────────
function InfoCard({ title, children, variant = 'default' }: {
  title: string; children: React.ReactNode; variant?: 'default' | 'tip' | 'warning';
}) {
  const colors = {
    default: 'border-l-accent-primary bg-accent-glow/30',
    tip: 'border-l-emerald-500 bg-emerald-500/5',
    warning: 'border-l-amber-500 bg-amber-500/5',
  };
  return (
    <div className={cn('border-l-4 rounded-xl p-4', colors[variant])}>
      <div className="text-sm font-semibold text-text-primary mb-1">{title}</div>
      <div className="text-sm text-text-secondary leading-relaxed">{children}</div>
    </div>
  );
}

// ─── Comparison Table ────────────────────────────────────────────
function ComparisonTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border-primary">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-primary bg-bg-elevated">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-primary">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border-primary/50 last:border-0 hover:bg-bg-hover/50 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-text-secondary">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Step Card ───────────────────────────────────────────────────
function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-dim flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-white">{number}</span>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-1">{title}</h4>
        <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ─── Code Block ──────────────────────────────────────────────────
function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-bg-primary border border-border-primary rounded-xl p-4 overflow-x-auto text-sm">
      <code className="text-text-secondary font-mono">{code}</code>
    </pre>
  );
}

// ─── Concept Card ────────────────────────────────────────────────
function ConceptCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-elevated rounded-xl p-4 border border-border-primary">
      <h5 className="text-sm font-semibold text-text-primary mb-2">{title}</h5>
      <div className="text-sm text-text-secondary leading-relaxed">{children}</div>
    </div>
  );
}

// ─── Main Documentation ──────────────────────────────────────────
export default function Documentation() {
  const [activeSection, setActiveSection] = useState('about');

  // Group sections by category for sidebar
  const categories = sections.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, typeof sections>);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar Navigation */}
      <aside className="hidden lg:block w-72 shrink-0 border-r border-border-primary bg-bg-secondary/50 h-screen sticky top-0 overflow-y-auto">
        <div className="p-4 border-b border-border-primary">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent-primary" />
            <span className="text-sm font-bold text-text-primary">Documentation</span>
          </div>
          <p className="text-[10px] text-text-muted mt-1">Multimodal RAG Platform</p>
        </div>
        <nav className="p-3 space-y-4">
          {Object.entries(categories).map(([category, items]) => (
            <div key={category}>
              <div className="px-3 mb-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">{category}</div>
              <div className="space-y-0.5">
                {items.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                      activeSection === s.id
                        ? 'bg-accent-glow text-accent-primary font-medium'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                    )}
                  >
                    <s.icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{s.title}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-border-primary bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <h1 className="text-lg font-bold text-text-primary">Documentation</h1>
            <p className="text-xs text-text-tertiary">Everything you need to know about Multimodal RAG</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

          {/* ═══════════════════ APPLICATION ═══════════════════ */}

          {/* About RAG Studio Pro */}
          <DocSection id="about" title="About RAG Studio Pro" icon={Sparkles} defaultOpen>
            <p className="text-sm text-text-secondary leading-relaxed">
              <strong className="text-text-primary">RAG Studio Pro</strong> is a production-ready Multimodal Retrieval-Augmented Generation platform. It transforms any content — text, images, video, audio, documents, charts, diagrams — into a searchable knowledge base, then generates grounded, evidence-backed answers to your questions.
            </p>
            <InfoCard title="Why RAG Studio Pro?" variant="tip">
              Traditional AI chatbots hallucinate, lack source attribution, and cannot access your private data. RAG Studio Pro solves all three problems by retrieving real evidence from your documents before generating answers. Every response includes clickable sources you can verify.
            </InfoCard>
            <h4 className="text-sm font-semibold text-text-primary mt-4">How It Works</h4>
            <div className="space-y-3 mt-2">
              <StepCard number={1} title="Upload" description="Upload any file type — PDFs, images, videos, audio, documents, spreadsheets, code repos, or paste text directly." />
              <StepCard number={2} title="Processing" description="The backend parses content, extracts text/frames/transcripts, runs OCR, and generates structured metadata." />
              <StepCard number={3} title="Chunking" description="Content is split into optimal chunks using configurable algorithms (recursive, semantic, markdown-aware, etc.)." />
              <StepCard number={4} title="Embedding" description="Each chunk is converted into a dense vector using models like MiniLM, BGE, CLIP, or SigLIP." />
              <StepCard number={5} title="Vector Storage" description="Embeddings are stored in FAISS or ChromaDB with full metadata for fast similarity search." />
              <StepCard number={6} title="Retrieval" description="When you ask a question, the system finds the most relevant chunks across all modalities." />
              <StepCard number={7} title="Generation" description="Retrieved context is sent to an LLM (Groq, OpenAI, Ollama, etc.) which generates a grounded answer." />
              <StepCard number={8} title="Evidence Timeline" description="Every answer includes verifiable sources — document pages, video frames, audio timestamps, chart locations." />
            </div>
            <InfoCard title="Key Principles" variant="default">
              <strong>No mock data.</strong> Every operation executes real code. Every button calls the backend. Every chart displays live metrics. If a feature is unfinished, it is disabled rather than faked.
            </InfoCard>
            <h4 className="text-sm font-semibold text-text-primary mt-4">Architecture</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <ConceptCard title="Frontend">
                React + TypeScript + Tailwind CSS + Framer Motion. Zustand for state management. Connects to the FastAPI backend via REST API.
              </ConceptCard>
              <ConceptCard title="Backend">
                Python + FastAPI. Sentence Transformers for embeddings. FAISS/ChromaDB for vector storage. Multi-provider LLM support via environment variables.
              </ConceptCard>
              <ConceptCard title="Privacy">
                All processing happens locally. Documents never leave your machine unless you configure a cloud LLM provider. Vector stores persist in your project directory.
              </ConceptCard>
              <ConceptCard title="Extensibility">
                Modular pipeline: parsers, chunkers, embedders, vector stores, and LLM providers are all pluggable. Add new capabilities by implementing a single interface.
              </ConceptCard>
            </div>
          </DocSection>

          {/* ═══════════════════ FOUNDATIONS ═══════════════════ */}

          {/* AI & Machine Learning */}
          <DocSection id="ai-fundamentals" title="AI & Machine Learning" icon={Atom}>
            <p className="text-sm text-text-secondary leading-relaxed">
              <strong className="text-text-primary">Artificial Intelligence (AI)</strong> is the broad field of creating systems that can perform tasks requiring human-like intelligence — understanding language, recognizing images, making decisions, and learning from data.
            </p>
            <h4 className="text-sm font-semibold text-text-primary mt-4">The AI Hierarchy</h4>
            <div className="space-y-2 mt-2">
              <ConceptCard title="Artificial Intelligence (AI)">
                The umbrella field. Any technique that enables computers to mimic human intelligence. Includes rule-based systems, search algorithms, and machine learning.
              </ConceptCard>
              <ConceptCard title="Machine Learning (ML)">
                A subset of AI where systems learn patterns from data instead of being explicitly programmed. Instead of writing rules like 'if temperature is over 100, then fever,' you feed the model thousands of temperature readings and it learns the pattern itself.
              </ConceptCard>
              <ConceptCard title="Deep Learning (DL)">
                A subset of ML using neural networks with many layers ("deep" architectures). Powers modern breakthroughs: GPT, CLIP, Whisper, Stable Diffusion. Can learn hierarchical features automatically from raw data.
              </ConceptCard>
            </div>
            <InfoCard title="Real-World Analogy" variant="tip">
              Think of AI as "making machines smart," ML as "letting machines learn from experience," and Deep Learning as "using brain-inspired neural networks to learn complex patterns." RAG Studio Pro uses all three: ML for embeddings, Deep Learning for LLMs and vision models, and AI engineering for the retrieval pipeline.
            </InfoCard>
            <h4 className="text-sm font-semibold text-text-primary mt-4">Types of Machine Learning</h4>
            <ComparisonTable
              headers={['Type', 'How it Works', 'RAG Studio Pro Usage']}
              rows={[
                ['Supervised Learning', 'Learns from labeled data (input → output pairs)', 'Embedding models trained on text-image pairs'],
                ['Unsupervised Learning', 'Finds patterns in unlabeled data', 'Clustering similar chunks together'],
                ['Self-Supervised Learning', 'Generates its own labels from data structure', 'LLMs trained to predict next token'],
                ['Transfer Learning', 'Applies knowledge from one task to another', 'Pre-trained models fine-tuned for RAG'],
              ]}
            />
          </DocSection>

          {/* Deep Learning */}
          <DocSection id="deep-learning" title="Deep Learning & Neural Networks" icon={Binary}>
            <p className="text-sm text-text-secondary leading-relaxed">
              <strong className="text-text-primary">Deep Learning</strong> uses artificial neural networks inspired by the human brain. Each "neuron" computes a weighted sum of its inputs, applies a non-linear activation function, and passes the result forward. Stacking millions of these neurons creates networks that can learn incredibly complex patterns.
            </p>
            <h4 className="text-sm font-semibold text-text-primary mt-4">Key Concepts</h4>
            <div className="space-y-2 mt-2">
              <ConceptCard title="Neurons & Layers">
                A neuron takes inputs, multiplies each by a weight, sums them, adds a bias, and applies an activation function (ReLU, sigmoid, etc.). Layers of neurons transform data step by step — early layers detect edges, middle layers detect shapes, later layers detect concepts.
              </ConceptCard>
              <ConceptCard title="Training & Backpropagation">
                The network makes a prediction, calculates how wrong it was (loss), and adjusts weights backwards through the network (backpropagation). This happens millions of times across billions of data points until the network learns the task.
              </ConceptCard>
              <ConceptCard title="Activation Functions">
                Functions like ReLU (max(0, x)), sigmoid (1/(1+e^-x)), and softmax introduce non-linearity. Without them, stacking layers would be equivalent to a single linear transformation — no learning complex patterns possible.
              </ConceptCard>
              <ConceptCard title="Loss Functions">
                Measure how wrong the model's predictions are. Cross-entropy for classification, MSE for regression, contrastive loss for embeddings. The training process minimizes this loss.
              </ConceptCard>
            </div>
            <InfoCard title="Why Deep Learning for RAG?" variant="default">
              Traditional keyword search (TF-IDF, BM25) matches exact words. Deep learning embeddings capture meaning — 'Canine' and 'dog' have identical embeddings despite different words. This semantic understanding is what makes RAG retrieval powerful.
            </InfoCard>
          </DocSection>

          {/* NLP */}
          <DocSection id="nlp" title="Natural Language Processing" icon={MessageCircle}>
            <p className="text-sm text-text-secondary leading-relaxed">
              <strong className="text-text-primary">Natural Language Processing (NLP)</strong> is the branch of AI that deals with understanding, generating, and manipulating human language. RAG Studio Pro relies heavily on NLP for every stage: parsing documents, generating embeddings, retrieving relevant chunks, and generating answers.
            </p>
            <h4 className="text-sm font-semibold text-text-primary mt-4">NLP in the RAG Pipeline</h4>
            <div className="space-y-2 mt-2">
              {[
                { stage: 'Ingestion', task: 'Text extraction, OCR, speech-to-text, language detection' },
                { stage: 'Chunking', task: 'Sentence splitting, semantic segmentation, boundary detection' },
                { stage: 'Embedding', task: 'Converting text to dense vectors that capture meaning' },
                { stage: 'Retrieval', task: 'Semantic search, query understanding, relevance ranking' },
                { stage: 'Generation', task: 'Prompt construction, context injection, answer generation' },
              ].map(({ stage, task }) => (
                <div key={stage} className="bg-bg-elevated rounded-xl p-3 border border-border-primary flex gap-3">
                  <span className="text-xs font-semibold text-accent-primary shrink-0 w-20">{stage}</span>
                  <span className="text-sm text-text-secondary">{task}</span>
                </div>
              ))}
            </div>
            <h4 className="text-sm font-semibold text-text-primary mt-4">Key NLP Techniques</h4>
            <ComparisonTable
              headers={['Technique', 'What it Does', 'RAG Usage']}
              rows={[
                ['Named Entity Recognition', 'Identifies people, places, organizations in text', 'Metadata extraction from documents'],
                ['Sentiment Analysis', 'Determines emotional tone of text', 'Understanding query intent'],
                ['Text Classification', 'Categorizes text into predefined labels', 'Document type detection'],
                ['Summarization', 'Creates concise summaries of long text', 'Chunk previews and evidence summaries'],
                ['Question Answering', 'Extracts answers from context passages', 'Core RAG generation step'],
              ]}
            />
          </DocSection>

          {/* LLMs */}
          <DocSection id="llms" title="Large Language Models" icon={Cpu}>
            <p className="text-sm text-text-secondary leading-relaxed">
              <strong className="text-text-primary">Large Language Models (LLMs)</strong> are neural networks trained on trillions of tokens of text data. They learn to predict the next token in a sequence, which gives them remarkable abilities: answering questions, writing code, translating languages, reasoning about concepts, and generating creative content.
            </p>
            <InfoCard title="How LLMs Generate Text" variant="tip">
              An LLM doesn't "understand" text like humans do. It predicts the most likely next token given all previous tokens. When you ask "What is the capital of France?", it has learned from training data that "Paris" is the most probable continuation. RAG enhances this by providing relevant documents as context, making the predictions grounded in real data rather than just training memorization.
            </InfoCard>
            <h4 className="text-sm font-semibold text-text-primary mt-4">LLM Landscape</h4>
            <ComparisonTable
              headers={['Category', 'Examples', 'Characteristics']}
              rows={[
                ['Open Source', 'Llama 3, Mistral, Phi, Qwen, Gemma', 'Free, runs locally, community-driven'],
                ['Proprietary', 'GPT-4o, Claude 3.5, Gemini Pro', 'Best performance, requires API keys, costs money'],
                ['Small (under 3B)', 'Phi-2, TinyLlama, Gemma 2B', 'Fast, runs on edge devices, limited reasoning'],
                ['Medium (7-13B)', 'Llama 3 8B, Mistral 7B', 'Good balance of speed and quality'],
                ['Large (70B+)', 'Llama 3 70B, GPT-4', 'Best quality, requires powerful hardware or API'],
              ]}
            />
            <h4 className="text-sm font-semibold text-text-primary mt-4">Key LLM Concepts</h4>
            <div className="space-y-2 mt-2">
              <ConceptCard title="Context Window">
                The maximum number of tokens an LLM can process at once. GPT-4o handles 128K tokens, Claude 3.5 handles 200K. RAG must fit retrieved context + user query within this window.
              </ConceptCard>
              <ConceptCard title="Temperature">
                Controls randomness. Temperature 0 = deterministic (same input → same output). Temperature 1 = creative/random. For RAG, use low temperature (0.1-0.3) for factual accuracy.
              </ConceptCard>
              <ConceptCard title="Hallucination">
                When an LLM generates plausible-sounding but factually incorrect information. RAG mitigates this by grounding the LLM in real retrieved documents rather than relying on its training memory.
              </ConceptCard>
              <ConceptCard title="Fine-Tuning vs RAG">
                Fine-tuning modifies the model's weights for a specific task (expensive, requires retraining). RAG keeps the model unchanged and injects relevant context at inference time (cheap, always up-to-date). RAG Studio Pro uses the RAG approach.
              </ConceptCard>
            </div>
          </DocSection>

          {/* Transformers */}
          <DocSection id="transformers" title="Transformers & Attention" icon={Settings}>
            <p className="text-sm text-text-secondary leading-relaxed">
              The <strong className="text-text-primary">Transformer architecture</strong> (introduced in "Attention Is All You Need," 2017) is the foundation of all modern LLMs and embedding models. Its key innovation — the <strong className="text-text-primary">self-attention mechanism</strong> — allows the model to weigh the importance of every word relative to every other word in a sequence.
            </p>
            <h4 className="text-sm font-semibold text-text-primary mt-4">How Self-Attention Works</h4>
            <p className="text-sm text-text-secondary leading-relaxed">
              For each word in a sentence, self-attention computes three vectors: a <strong className="text-text-primary">Query</strong> (what am I looking for?), a <strong className="text-text-primary">Key</strong> (what do I contain?), and a <strong className="text-text-primary">Value</strong> (what information do I provide?). The attention score between two words is the dot product of one's Query with the other's Key, scaled and softmaxed. This produces a weighted sum of all Values — the word's new representation.
            </p>
            <CodeBlock code={`# Simplified Self-Attention\nQ = X @ W_Q  # Query projections\nK = X @ W_K  # Key projections\nV = X @ W_V  # Value projections\n\nattention = softmax(Q @ K.T / sqrt(d_k)) @ V\n\n# "The cat sat on the mat"\n# "cat" attends strongly to "The" and "sat"\n# "mat" attends strongly to "on" and "the"`} />
            <h4 className="text-sm font-semibold text-text-primary mt-4">Transformer Components</h4>
            <div className="space-y-2 mt-2">
              <ConceptCard title="Multi-Head Attention">
                Instead of one attention function, Transformers run multiple attention operations in parallel ("heads"). Each head learns different relationships — one might capture syntax, another semantics, another coreference.
              </ConceptCard>
              <ConceptCard title="Positional Encoding">
                Unlike RNNs, Transformers process all tokens simultaneously. Positional encodings inject sequence order information so the model knows word positions.
              </ConceptCard>
              <ConceptCard title="Feed-Forward Network">
                After attention, each token passes through a small neural network independently. This processes the attention output and adds non-linearity.
              </ConceptCard>
              <ConceptCard title="Layer Normalization & Residual Connections">
                Stabilize training by normalizing activations and adding skip connections that allow gradients to flow through deep networks.
              </ConceptCard>
            </div>
            <InfoCard title="Encoder vs Decoder" variant="default">
              <strong>Encoders</strong> (BERT, sentence-transformers) process the entire input bidirectionally — great for embeddings and understanding. <strong>Decoders</strong> (GPT, Llama) generate text left-to-right — great for generation. <strong>Encoder-Decoder</strong> (T5, BART) do both. RAG Studio Pro uses encoders for embeddings and decoders for generation.
            </InfoCard>
          </DocSection>

          {/* Tokenization */}
          <DocSection id="tokenization" title="Tokenization" icon={Layers}>
            <p className="text-sm text-text-secondary leading-relaxed">
              <strong className="text-text-primary">Tokenization</strong> is the process of breaking text into smaller units (tokens) that models can process. LLMs and embedding models don't work with raw characters — they work with tokens, which can be words, subwords, or characters.
            </p>
            <h4 className="text-sm font-semibold text-text-primary mt-4">Tokenization Methods</h4>
            <ComparisonTable
              headers={['Method', 'How it Works', 'Example']}
              rows={[
                ['Word-level', 'Splits on spaces/punctuation', '"hello world" → ["hello", "world"]'],
                ['Character-level', 'Each character is a token', '"hello" → ["h", "e", "l", "l", "o"]'],
                ['BPE (Byte Pair Encoding)', 'Merges most frequent byte pairs', '"tokenization" → ["token", "ization"]'],
                ['WordPiece', 'Like BPE but uses likelihood', '"playing" → ["play", "##ing"]'],
                ['SentencePiece', 'Language-agnostic, works on raw text', 'Handles any language without pre-tokenization'],
              ]}
            />
            <InfoCard title="Why Tokenization Matters for RAG" variant="tip">
              Chunk size is measured in tokens. A 512-token chunk is roughly 375 words in English but can vary significantly across languages. Understanding tokenization helps you set appropriate chunk sizes and estimate costs when using API-based LLMs that charge per token.
            </InfoCard>
            <CodeBlock code={`# Token count examples\n"Hello, world!" → 4 tokens\n"What is machine learning?" → 6 tokens\n"The quick brown fox jumps over the lazy dog" → 9 tokens\n\n# ~4 characters per token (English average)\n# ~75% of English text, ~50% of code`} />
          </DocSection>

          {/* ═══════════════════ CORE CONCEPTS ═══════════════════ */}

          {/* What is RAG */}
          <DocSection id="what-is-rag" title="What is RAG?" icon={Zap}>
            <p className="text-sm text-text-secondary leading-relaxed">
              <strong className="text-text-primary">Retrieval-Augmented Generation (RAG)</strong> is an AI architecture that combines information retrieval with text generation. Instead of relying solely on an LLM's trained knowledge, RAG retrieves relevant documents from an external knowledge base and uses them as context for generating answers.
            </p>
            <InfoCard title="Why RAG?" variant="tip">
              LLMs have training cutoffs, can hallucinate, and lack domain-specific knowledge. RAG grounds responses in real, verifiable documents — reducing hallucinations and keeping knowledge current without expensive fine-tuning.
            </InfoCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div className="bg-bg-elevated rounded-xl p-4 border border-border-primary">
                <h4 className="text-sm font-semibold text-text-primary mb-2">Without RAG</h4>
                <ul className="space-y-1.5">
                  {['Hallucinations (making things up)', 'Outdated knowledge (training cutoff)', 'No source attribution', 'Cannot access private data'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-bg-elevated rounded-xl p-4 border border-border-primary">
                <h4 className="text-sm font-semibold text-text-primary mb-2">With RAG</h4>
                <ul className="space-y-1.5">
                  {['Grounded in real documents', 'Always current (re-query anytime)', 'Full source attribution', 'Access any private knowledge base'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </DocSection>

          {/* The Pipeline */}
          <DocSection id="pipeline" title="The RAG Pipeline" icon={Layers}>
            <p className="text-sm text-text-secondary leading-relaxed">
              A RAG pipeline transforms raw content into searchable knowledge and generates answers grounded in that knowledge.
            </p>
            <div className="space-y-4 mt-4">
              <StepCard number={1} title="Ingestion" description="Parse documents, extract text, images, tables, metadata, OCR, speech-to-text, video frames." />
              <StepCard number={2} title="Chunking" description="Split content into manageable pieces using recursive character, sentence, markdown, or semantic chunking." />
              <StepCard number={3} title="Embedding" description="Generate dense vector representations using models like all-MiniLM-L6-v2, CLIP, BGE, or SigLIP." />
              <StepCard number={4} title="Vector Storage" description="Store embeddings in FAISS or ChromaDB with metadata, chunk references, and timestamps." />
              <StepCard number={5} title="Retrieval" description="Search the vector database for the most relevant chunks using semantic similarity, hybrid search, or cross-modal retrieval." />
              <StepCard number={6} title="Generation" description="Assemble retrieved context into a prompt, send to the selected LLM, and stream the response with evidence sources." />
            </div>
          </DocSection>

          {/* Multimodal RAG */}
          <DocSection id="multimodal-rag" title="Multimodal RAG" icon={Globe}>
            <p className="text-sm text-text-secondary leading-relaxed">
              Traditional RAG only handles text. <strong className="text-text-primary">Multimodal RAG</strong> extends this to images, video, audio, charts, tables, and diagrams — enabling you to ask questions across all content types and receive the most appropriate output modality.
            </p>
            <ComparisonTable
              headers={['Feature', 'Traditional RAG', 'Multimodal RAG']}
              rows={[
                ['Input', 'Text only', 'Text, images, video, audio, documents'],
                ['Embeddings', 'Text vectors', 'Cross-modal vectors (CLIP, SigLIP)'],
                ['Retrieval', 'Text similarity', 'Cross-modal similarity'],
                ['Output', 'Text only', 'Text, images, timestamps, charts'],
                ['Evidence', 'Document references', 'Pages, frames, timestamps, charts'],
              ]}
            />
            <InfoCard title="How it works" variant="default">
              When a video is uploaded, RAG Studio Pro extracts frames, speech, captions, and metadata. Each modality gets its own embeddings but lives in the same vector store. When you ask "Show the scene where the doctor enters," the retriever finds the matching frame, timestamp, and transcript — all at once.
            </InfoCard>
          </DocSection>

          {/* ═══════════════════ PIPELINE ═══════════════════ */}

          {/* Ingestion */}
          <DocSection id="ingestion" title="Ingestion" icon={FileText}>
            <p className="text-sm text-text-secondary leading-relaxed">
              Ingestion is the process of parsing uploaded content into structured, searchable data. RAG Studio Pro supports 25+ input formats across all modalities.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
              {['PDF', 'DOCX', 'TXT', 'CSV', 'XLSX', 'PPTX', 'Markdown', 'HTML', 'JSON', 'Images (PNG, JPEG, WEBP)', 'Video (MP4, AVI, MOV)', 'Audio (MP3, WAV, FLAC)', 'ZIP Archives', 'YouTube URLs', 'GitHub Repos', 'Websites'].map((f) => (
                <div key={f} className="flex items-center gap-2 px-3 py-2 bg-bg-elevated rounded-lg border border-border-primary">
                  <CheckCircle2 className="w-3 h-3 text-accent-primary shrink-0" />
                  <span className="text-xs text-text-secondary">{f}</span>
                </div>
              ))}
            </div>
            <h4 className="text-sm font-semibold text-text-primary mt-4">Extraction Process</h4>
            <div className="space-y-2 mt-2">
              {['Text extraction with layout preservation', 'OCR for scanned documents and images', 'Table detection and structured extraction', 'Image captioning and object detection', 'Audio transcription with speaker detection', 'Video frame extraction at scene changes', 'Metadata extraction (author, dates, structure)'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                  <ChevronRight className="w-3 h-3 text-accent-primary shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </DocSection>

          {/* Chunking */}
          <DocSection id="chunking" title="Chunking & Overlap" icon={Layers}>
            <p className="text-sm text-text-secondary leading-relaxed">
              Chunking splits parsed content into manageable pieces for embedding. Chunk size and overlap directly affect retrieval quality. <strong className="text-text-primary">Chunk overlap</strong> ensures no context is lost at chunk boundaries — a sentence split across two chunks is partially repeated in both.
            </p>
            <ComparisonTable
              headers={['Strategy', 'How it works', 'Best for']}
              rows={[
                ['Recursive Character', 'Splits by paragraphs, sentences, then characters', 'General documents'],
                ['Sentence', 'Splits at sentence boundaries', 'Natural language text'],
                ['Markdown', 'Splits at markdown headers and sections', 'Technical documentation'],
                ['Token', 'Splits by token count', 'Precise token budgets'],
                ['Sliding Window', 'Overlapping chunks with fixed stride', 'Context-heavy content'],
                ['Parent-Child', 'Small chunks for retrieval, large for context', 'Precise + context'],
                ['Semantic', 'Splits at topic/semantic boundaries', 'Topical documents'],
              ]}
            />
            <InfoCard title="Each chunk includes" variant="tip">
              Chunk ID, character count, word count, token estimate, metadata (source file, page, section), and the original text. No hardcoded chunks — everything is generated from your uploaded content.
            </InfoCard>
            <ConceptCard title="Chunk Overlap">
              When chunk_size=500 and overlap=50, each chunk is 500 characters with 550-character stride. The last 50 characters of chunk N appear as the first 50 characters of chunk N+1. This prevents losing context at boundaries — critical for questions that span chunk boundaries.
            </ConceptCard>
          </DocSection>

          {/* Embeddings */}
          <DocSection id="embeddings" title="Embeddings" icon={Brain}>
            <p className="text-sm text-text-secondary leading-relaxed">
              Embeddings are dense vector representations that capture the semantic meaning of content. Similar content produces similar vectors. This is the mathematical foundation that makes semantic search possible.
            </p>
            <ComparisonTable
              headers={['Model', 'Dimensions', 'Best for']}
              rows={[
                ['all-MiniLM-L6-v2', '384', 'Fast, general-purpose text'],
                ['BGE Small', '384', 'High-quality text retrieval'],
                ['E5 Small', '384', 'Instruction-following embeddings'],
                ['MPNet', '768', 'High-accuracy text similarity'],
                ['CLIP', '512', 'Text + image cross-modal'],
                ['SigLIP', '768', 'Vision-language understanding'],
                ['Instructor', '768', 'Task-specific embeddings'],
              ]}
            />
            <h4 className="text-sm font-semibold text-text-primary mt-4">How Embeddings Work</h4>
            <p className="text-sm text-text-secondary leading-relaxed">
              A text like "What is machine learning?" gets encoded into a 384-dimensional vector (e.g., [0.023, -0.156, 0.089, ...]). When a user asks a similar question, its vector lands nearby in the embedding space. The distance (cosine similarity) between vectors measures relevance.
            </p>
            <CodeBlock code={`# Cosine Similarity\ncos(A, B) = (A · B) / (|A| × |B|)\n\n# Result: -1 (opposite) to 1 (identical)\n# Most RAG systems threshold at 0.7+\n\n# "machine learning" ≈ [0.023, -0.156, 0.089, ...]\n# "ML fundamentals"  ≈ [0.021, -0.148, 0.092, ...]  ← nearby!\n# "cooking recipe"   ≈ [-0.312, 0.445, -0.012, ...] ← far away`} />
          </DocSection>

          {/* Vector Stores */}
          <DocSection id="vector-stores" title="Vector Databases" icon={Database}>
            <p className="text-sm text-text-secondary leading-relaxed">
              Vector databases store, index, and query high-dimensional vectors efficiently. They enable fast similarity search across millions of embeddings — finding the nearest vectors in milliseconds.
            </p>
            <ComparisonTable
              headers={['Store', 'Type', 'Best for']}
              rows={[
                ['FAISS', 'In-memory index', 'Fast local search, large datasets'],
                ['ChromaDB', 'Embedded database', 'Persistent storage, metadata filtering'],
              ]}
            />
            <h4 className="text-sm font-semibold text-text-primary mt-4">Stored Per Vector</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {['Vector ID', 'Chunk ID', 'Metadata', 'Embedding', 'Distance', 'Timestamp'].map((item) => (
                <div key={item} className="flex items-center gap-2 px-3 py-2 bg-bg-elevated rounded-lg border border-border-primary">
                  <CheckCircle2 className="w-3 h-3 text-accent-primary shrink-0" />
                  <span className="text-xs text-text-secondary">{item}</span>
                </div>
              ))}
            </div>
          </DocSection>

          {/* Cosine Similarity */}
          <DocSection id="similarity" title="Cosine Similarity & Search" icon={Search}>
            <p className="text-sm text-text-secondary leading-relaxed">
              <strong className="text-text-primary">Cosine similarity</strong> measures the angle between two vectors, ignoring their magnitude. This makes it ideal for comparing embeddings — two documents about the same topic will have similar vectors regardless of length.
            </p>
            <CodeBlock code={`import numpy as np

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Identical vectors → 1.0
# Orthogonal vectors → 0.0  (completely unrelated)
# Opposite vectors  → -1.0 (opposite meaning)

# In RAG, we typically threshold at 0.7+ for "relevant"`} />
            <h4 className="text-sm font-semibold text-text-primary mt-4">Search Algorithms</h4>
            <ComparisonTable
              headers={['Algorithm', 'Approach', 'Trade-off']}
              rows={[
                ['Brute Force', 'Compare query against every vector', 'Perfect accuracy, slow for millions of vectors'],
                ['IVF (Inverted File)', 'Partition vectors into clusters, search nearby clusters', 'Fast, slight accuracy loss'],
                ['HNSW', 'Hierarchical graph navigation', 'Very fast, good accuracy, higher memory'],
                ['Product Quantization', 'Compress vectors to save memory', 'Faster search, some accuracy loss'],
              ]}
            />
          </DocSection>

          {/* Retrieval */}
          <DocSection id="retrieval" title="Retrieval Strategies" icon={Search}>
            <p className="text-sm text-text-secondary leading-relaxed">
              When a user asks a question, the retriever generates a query embedding, searches the vector database, and returns the Top-K most relevant chunks.
            </p>
            <h4 className="text-sm font-semibold text-text-primary mt-4">Search Strategies</h4>
            <div className="space-y-3 mt-2">
              <ConceptCard title="Semantic Search">
                Finds content based on meaning, not exact keywords. "How to fix a car" matches "automotive repair guide." Powered by embedding similarity.
              </ConceptCard>
              <ConceptCard title="Hybrid Search">
                Combines semantic (vector) search with keyword (BM25) search. Semantic catches meaning, keywords catch exact terms like error codes or proper nouns. Best of both worlds.
              </ConceptCard>
              <ConceptCard title="Cross-Modal Retrieval">
                Text query retrieves relevant images, video frames, audio timestamps, and chart data from the same vector store. Enabled by multi-modal embeddings like CLIP.
              </ConceptCard>
              <ConceptCard title="Reranking">
                After initial retrieval, a cross-encoder re-scores results by jointly processing the query and each candidate. More accurate but slower — used as a second pass.
              </ConceptCard>
            </div>
            <InfoCard title="Retrieved Results Include" variant="tip">
              Similarity score, chunk ID, source document, distance metric, full text context, and evidence source (page number, frame index, audio timestamp).
            </InfoCard>
          </DocSection>

          {/* Generation */}
          <DocSection id="generation" title="Generation" icon={MessageSquare}>
            <p className="text-sm text-text-secondary leading-relaxed">
              The generation step takes retrieved context, constructs a prompt, sends it to the selected LLM, and produces a grounded answer with evidence sources.
            </p>
            <h4 className="text-sm font-semibold text-text-primary mt-4">Generation Flow</h4>
            <div className="space-y-2 mt-2">
              <StepCard number={1} title="Context Assembly" description="Combine retrieved chunks into a structured context block with source references." />
              <StepCard number={2} title="Prompt Construction" description="Insert context and user query into a template optimized for the selected LLM." />
              <StepCard number={3} title="LLM Call" description="Send the prompt to Groq, OpenAI, Anthropic, Google, Ollama, or other configured providers." />
              <StepCard number={4} title="Evidence Timeline" description="Map each part of the answer to its source: document page, image, video frame, audio timestamp." />
              <StepCard number={5} title="Response Assembly" description="Combine the answer, evidence sources, latency metrics, and token usage into the final response." />
            </div>
          </DocSection>

          {/* ═══════════════════ ADVANCED ═══════════════════ */}

          {/* Prompt Engineering */}
          <DocSection id="prompt-engineering" title="Prompt Engineering" icon={Lightbulb}>
            <p className="text-sm text-text-secondary leading-relaxed">
              <strong className="text-text-primary">Prompt engineering</strong> is the art of crafting instructions that guide LLMs to produce desired outputs. In RAG, the prompt must combine the user's question with retrieved context in a way that produces accurate, grounded answers.
            </p>
            <h4 className="text-sm font-semibold text-text-primary mt-4">RAG Prompt Template</h4>
            <CodeBlock code={`System: You are a helpful assistant. Answer the user's question
using ONLY the provided context. If the context doesn't contain
enough information, say so. Always cite your sources.

Context:
{chunk_1} [Source: document.pdf, Page 5]
{chunk_2} [Source: document.pdf, Page 12]
{chunk_3} [Source: notes.md, Section 3]

User Question: {query}`} />
            <h4 className="text-sm font-semibold text-text-primary mt-4">Key Techniques</h4>
            <div className="space-y-2 mt-2">
              <ConceptCard title="Few-Shot Prompting">
                Include examples of desired input-output pairs in the prompt. "Q: What is X? A: X is..." helps the model follow the expected format.
              </ConceptCard>
              <ConceptCard title="Chain-of-Thought">
                Ask the model to "think step by step" before answering. This improves reasoning accuracy for complex questions.
              </ConceptCard>
              <ConceptCard title="Instruction Tuning">
                Use clear, specific instructions: "Answer based ONLY on the provided context. Do not use outside knowledge."
              </ConceptCard>
            </div>
          </DocSection>

          {/* Hallucinations */}
          <DocSection id="hallucinations" title="Hallucinations & Context Windows" icon={Shield}>
            <p className="text-sm text-text-secondary leading-relaxed">
              <strong className="text-text-primary">Hallucination</strong> occurs when an LLM generates plausible but factually incorrect information. This is the #1 problem RAG solves — by grounding the model in real retrieved documents.
            </p>
            <h4 className="text-sm font-semibold text-text-primary mt-4">Types of Hallucination</h4>
            <div className="space-y-2 mt-2">
              <ConceptCard title="Intrinsic Hallucination">
                Contradicts the source material. E.g., the document says "revenue grew 10%" but the LLM says "revenue declined."
              </ConceptCard>
              <ConceptCard title="Extrinsic Hallucination">
                Adds information not present in the source. E.g., the document mentions a meeting but the LLM invents specific attendees.
              </ConceptCard>
              <ConceptCard title="How RAG Reduces Hallucination">
                By providing the LLM with actual document excerpts as context, the model can reference real text instead of relying on its training memory. The Evidence Timeline lets users verify every claim.
              </ConceptCard>
            </div>
            <InfoCard title="Context Window Limits" variant="warning">
              The context window is the maximum tokens an LLM can process. If your retrieved chunks exceed this limit, context is truncated. RAG Studio Pro manages this by limiting the number of retrieved chunks and their combined size to fit within the model's context window.
            </InfoCard>
          </DocSection>

          {/* Speech RAG */}
          <DocSection id="speech-rag" title="Speech RAG" icon={Headphones}>
            <p className="text-sm text-text-secondary leading-relaxed">
              Speech RAG extends RAG to audio content. When audio or video is uploaded, the system transcribes speech, detects speakers, generates timestamps, and creates searchable embeddings.
            </p>
            <h4 className="text-sm font-semibold text-text-primary mt-4">Audio Processing Pipeline</h4>
            <div className="space-y-2 mt-2">
              <StepCard number={1} title="Speech-to-Text" description="Transcribe audio using Whisper or similar models with word-level timestamps." />
              <StepCard number={2} title="Speaker Diarization" description="Detect and label different speakers throughout the audio." />
              <StepCard number={3} title="Topic Segmentation" description="Identify topic boundaries and generate segment summaries." />
              <StepCard number={4} title="Embedding Generation" description="Create embeddings for each segment with timestamp metadata." />
            </div>
            <InfoCard title="Example Query" variant="tip">
              "What did the speaker say about AI at 12:41?" — The system retrieves the exact segment, provides the transcript, speaker label, and a direct timestamp link.
            </InfoCard>
          </DocSection>

          {/* Vision RAG */}
          <DocSection id="vision-rag" title="Vision RAG" icon={Eye}>
            <p className="text-sm text-text-secondary leading-relaxed">
              Vision RAG enables retrieval and understanding of visual content — images, charts, diagrams, video frames, and scanned documents.
            </p>
            <h4 className="text-sm font-semibold text-text-primary mt-4">Image Processing</h4>
            <div className="space-y-2 mt-2">
              {['Object detection and scene description', 'OCR for text within images', 'Chart and graph understanding', 'Diagram and flowchart parsing', 'Mathematical equation recognition', 'Image embeddings via CLIP/SigLIP'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                  <ChevronRight className="w-3 h-3 text-accent-primary shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <h4 className="text-sm font-semibold text-text-primary mt-4">Video Processing</h4>
            <div className="space-y-2 mt-2">
              {['Frame extraction at scene changes', 'Keyframe selection for embedding', 'Object and person tracking', 'Text-in-video detection (OCR)', 'Speech and subtitle extraction', 'Timeline-based retrieval'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                  <ChevronRight className="w-3 h-3 text-accent-primary shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </DocSection>

          {/* Graph RAG */}
          <DocSection id="graph-rag" title="Graph RAG" icon={Network}>
            <p className="text-sm text-text-secondary leading-relaxed">
              Graph RAG uses knowledge graphs to enhance retrieval by modeling entities and their relationships as graph structures, enabling multi-hop reasoning.
            </p>
            <h4 className="text-sm font-semibold text-text-primary mt-4">How Graph RAG Works</h4>
            <div className="space-y-2 mt-2">
              <StepCard number={1} title="Entity Extraction" description="Identify entities (people, places, concepts) and relationships from documents." />
              <StepCard number={2} title="Graph Construction" description="Build a knowledge graph with entities as nodes and relationships as edges." />
              <StepCard number={3} title="Graph-Enhanced Retrieval" description="Traverse the graph to find related entities and context beyond direct similarity." />
              <StepCard number={4} title="Multi-Hop Reasoning" description="Answer questions that require following chains of relationships across the graph." />
            </div>
            <InfoCard title="When to use Graph RAG" variant="default">
              Graph RAG excels at questions like "What projects has Alice worked on with Bob?" or "How does this concept relate to that theory?" — questions that require understanding relationships, not just similarity.
            </InfoCard>
          </DocSection>

          {/* Agentic RAG */}
          <DocSection id="agentic-rag" title="Agentic RAG" icon={Cpu}>
            <p className="text-sm text-text-secondary leading-relaxed">
              Agentic RAG systems use autonomous agents that plan retrieval strategies, decide which tools to use, and iteratively refine their approach based on intermediate results.
            </p>
            <h4 className="text-sm font-semibold text-text-primary mt-4">Agent Capabilities</h4>
            <div className="space-y-2 mt-2">
              {['Plan multi-step retrieval strategies', 'Decide which tools/databases to query', 'Evaluate intermediate results', 'Self-correct and retry with different approaches', 'Chain multiple retrieval and reasoning steps', 'Use external tools (web search, calculators, APIs)'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                  <ChevronRight className="w-3 h-3 text-accent-primary shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </DocSection>

          {/* Evaluation Metrics */}
          <DocSection id="metrics" title="Evaluation Metrics" icon={Gauge}>
            <p className="text-sm text-text-secondary leading-relaxed">
              Evaluating RAG system quality requires measuring both retrieval accuracy and generation quality. RAG Studio Pro tracks these metrics live across every pipeline run.
            </p>
            <h4 className="text-sm font-semibold text-text-primary mt-4">Retrieval Metrics</h4>
            <ComparisonTable
              headers={['Metric', 'Measures', 'Range']}
              rows={[
                ['Precision@K', 'What fraction of top-K results are relevant?', '0 to 1 (higher = better)'],
                ['Recall@K', 'What fraction of all relevant results did we retrieve?', '0 to 1 (higher = better)'],
                ['F1 Score', 'Harmonic mean of precision and recall', '0 to 1 (balances both)'],
                ['NDCG', 'Ranking quality — are the best results at the top?', '0 to 1 (higher = better ranking)'],
                ['MRR', 'Mean Reciprocal Rank — where is the first relevant result?', '0 to 1 (1 = first result is relevant)'],
              ]}
            />
            <h4 className="text-sm font-semibold text-text-primary mt-4">Generation Metrics</h4>
            <ComparisonTable
              headers={['Metric', 'Measures', 'How']}
              rows={[
                ['Answer Relevance', 'Does the answer address the question?', 'LLM-as-judge scoring 1-5'],
                ['Faithfulness', 'Is the answer grounded in the context?', 'Check claims against source chunks'],
                ['Context Precision', 'Were the right chunks retrieved?', 'Compare retrieved vs expected'],
                ['Latency', 'How fast is the end-to-end pipeline?', 'Measured in milliseconds'],
                ['Token Usage', 'How many tokens were consumed?', 'Affects cost and speed'],
              ]}
            />
            <CodeBlock code={`# Example RAG evaluation results\nPrecision@5:  0.80  (4 of 5 results relevant)\nRecall@10:    0.67  (found 2/3 relevant docs)\nF1:           0.73  (harmonic mean)\nNDCG@5:       0.92  (best results ranked first)\nMRR:          1.00  (first result was relevant)\nLatency:      1.2s  (query to answer)\nTokens:       2,340 (context + query + response)`} />
          </DocSection>

          {/* ═══════════════════ CONFIGURATION ═══════════════════ */}

          {/* LLM Providers */}
          <DocSection id="providers" title="LLM Providers" icon={Globe}>
            <p className="text-sm text-text-secondary leading-relaxed">
              RAG Studio Pro supports multiple LLM providers. The active provider is configured via environment variables — users never enter API keys in the UI.
            </p>
            <ComparisonTable
              headers={['Provider', 'Models', 'Setup']}
              rows={[
                ['Groq', 'Llama 3, Mixtral, Gemma', 'Set GROQ_API_KEY in .env'],
                ['OpenAI', 'GPT-4o, GPT-4, GPT-3.5', 'Set OPENAI_API_KEY in .env'],
                ['Anthropic', 'Claude 3.5, Claude 3', 'Set ANTHROPIC_API_KEY in .env'],
                ['Google', 'Gemini Pro, Gemini 1.5', 'Set GOOGLE_API_KEY in .env'],
                ['Ollama', 'Llama 3, Mistral, Phi', 'Install Ollama locally'],
                ['DeepSeek', 'DeepSeek Chat, Coder', 'Set DEEPSEEK_API_KEY in .env'],
                ['Qwen', 'Qwen 2, Qwen 1.5', 'Set QWEN_API_KEY in .env'],
                ['Mistral', 'Mistral Large, Medium', 'Set MISTRAL_API_KEY in .env'],
              ]}
            />
            <InfoCard title="Environment Configuration" variant="tip">
              All API keys are read from the .env file on the backend. The frontend never exposes or stores API keys. Users can switch providers through the Workspace interface without touching configuration.
            </InfoCard>
          </DocSection>

          {/* Evidence Timeline */}
          <DocSection id="evidence" title="Evidence Timeline" icon={Target}>
            <p className="text-sm text-text-secondary leading-relaxed">
              Every answer in RAG Studio Pro includes an Evidence Timeline — a verifiable list of sources that the model used to generate its response.
            </p>
            <h4 className="text-sm font-semibold text-text-primary mt-4">Evidence Sources</h4>
            <div className="space-y-2 mt-2">
              {[
                { icon: FileText, label: 'Document Page', example: 'Page 12 of "Research Paper.pdf"' },
                { icon: Image, label: 'Image Reference', example: 'Image #4 — "Chart of Revenue"' },
                { icon: Video, label: 'Video Timestamp', example: 'Video at 05:23 — "Doctor enters"' },
                { icon: BarChart3, label: 'Chart Location', example: 'Chart on slide 18' },
                { icon: Headphones, label: 'Audio Timestamp', example: 'Audio at 12:41 — "Speaker discusses AI"' },
                { icon: Layers, label: 'Table Reference', example: 'Table 3 — "Q4 Financial Results"' },
              ].map(({ icon: EIcon, label, example }) => (
                <div key={label} className="flex items-center gap-3 bg-bg-elevated rounded-xl p-3 border border-border-primary">
                  <EIcon className="w-4 h-4 text-accent-primary shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-text-primary">{label}</span>
                    <span className="text-xs text-text-tertiary ml-2">{example}</span>
                  </div>
                </div>
              ))}
            </div>
            <InfoCard title="Why Evidence Matters" variant="default">
              Instead of users blindly trusting the AI, they can verify every piece of evidence across text, images, audio, video, and diagrams. Clicking any source jumps directly to the original content.
            </InfoCard>
          </DocSection>

          {/* ═══════════════════ GUIDE ═══════════════════ */}

          {/* Best Practices */}
          <DocSection id="best-practices" title="Best Practices" icon={Shield}>
            <div className="space-y-3">
              <div className="bg-bg-elevated rounded-xl p-4 border border-border-primary">
                <h5 className="text-sm font-semibold text-text-primary mb-1">Chunk Size Matters</h5>
                <p className="text-sm text-text-secondary">Start with 512 tokens, 50 token overlap. Too small loses context, too large adds noise. Experiment with your specific content.</p>
              </div>
              <div className="bg-bg-elevated rounded-xl p-4 border border-border-primary">
                <h5 className="text-sm font-semibold text-text-primary mb-1">Use Hybrid Search</h5>
                <p className="text-sm text-text-secondary">Combine semantic + keyword search for the best results. Semantic catches meaning, keywords catch exact terms.</p>
              </div>
              <div className="bg-bg-elevated rounded-xl p-4 border border-border-primary">
                <h5 className="text-sm font-semibold text-text-primary mb-1">Metadata is Key</h5>
                <p className="text-sm text-text-secondary">Enrich chunks with metadata (source file, page, section, timestamps) for better filtering and evidence attribution.</p>
              </div>
              <div className="bg-bg-elevated rounded-xl p-4 border border-border-primary">
                <h5 className="text-sm font-semibold text-text-primary mb-1">Test End-to-End</h5>
                <p className="text-sm text-text-secondary">Always test with real queries. Upload a document, ask questions, verify the evidence timeline points to correct sources.</p>
              </div>
              <div className="bg-bg-elevated rounded-xl p-4 border border-border-primary">
                <h5 className="text-sm font-semibold text-text-primary mb-1">Use Reranking</h5>
                <p className="text-sm text-text-secondary">Enable the cross-encoder reranker for better retrieval quality. It re-scores results by jointly processing query + document, catching nuances the initial embedding search misses.</p>
              </div>
              <div className="bg-bg-elevated rounded-xl p-4 border border-border-primary">
                <h5 className="text-sm font-semibold text-text-primary mb-1">Start with MiniLM</h5>
                <p className="text-sm text-text-secondary">all-MiniLM-L6-v2 is fast, small (90MB), and good enough for most use cases. Upgrade to MPNet or BGE only if you need higher accuracy.</p>
              </div>
            </div>
          </DocSection>

          {/* FAQ */}
          <DocSection id="faq" title="FAQ" icon={AlertCircle}>
            <div className="space-y-4">
              {[
                { q: 'Do I need API keys to use RAG Studio Pro?', a: 'No. The backend reads all secrets from the .env file. With Ollama running locally, you can use it entirely offline with open-source models.' },
                { q: 'What file formats are supported?', a: 'PDF, DOCX, TXT, CSV, XLSX, PPTX, Markdown, HTML, JSON, images (PNG/JPEG/WEBP), video (MP4/AVI/MOV), audio (MP3/WAV/FLAC), ZIP archives, URLs, and more.' },
                { q: 'Can I use it offline?', a: 'Yes. With Ollama running locally, you can use open-source models (Llama 3, Mistral, Phi) without any internet connection. Vector stores persist locally.' },
                { q: 'How does the Evidence Timeline work?', a: 'Every retrieval result includes source metadata (page number, frame index, audio timestamp). The generation step maps its answer to these sources, creating a clickable evidence trail.' },
                { q: 'Is my data private?', a: 'Yes. All processing happens locally on your machine. Documents are parsed, chunked, and embedded locally. Vector stores persist in your project directory. No data is sent to external services unless you configure a cloud LLM provider.' },
                { q: 'Can I switch between vector stores?', a: 'Yes. RAG Studio Pro supports FAISS and ChromaDB. You can switch between them in the Workspace, and your data persists across sessions.' },
                { q: 'What is the difference between FAISS and ChromaDB?', a: 'FAISS is an in-memory index optimized for speed — great for large datasets. ChromaDB is an embedded database with persistent storage and metadata filtering — great for structured queries.' },
                { q: 'How do I add a new document?', a: 'Go to Workspace → Step 1 (Ingestion) → click the upload area or paste text directly. The backend parses the file and extracts text, metadata, and structure.' },
              ].map(({ q, a }) => (
                <div key={q} className="bg-bg-elevated rounded-xl p-4 border border-border-primary">
                  <h5 className="text-sm font-semibold text-text-primary mb-2">{q}</h5>
                  <p className="text-sm text-text-secondary leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </DocSection>
        </div>
      </main>
    </div>
  );
}
