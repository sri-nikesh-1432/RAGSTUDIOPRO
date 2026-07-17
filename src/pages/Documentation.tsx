import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ChevronDown, ChevronRight, FileText, Layers, Brain, Database,
  Search, MessageSquare, Zap, CheckCircle2, AlertCircle,
  Globe, BarChart3, Shield,
} from 'lucide-react';
import { cn } from '../lib/utils';

// ─── Documentation Sections ──────────────────────────────────────────

const sections = [
  {
    id: 'overview',
    title: 'What is RAG?',
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'pipeline',
    title: 'The RAG Pipeline',
    icon: Layers,
    color: 'from-cyan-500 to-teal-500',
  },
  {
    id: 'ingestion',
    title: 'Document Ingestion',
    icon: FileText,
    color: 'from-teal-500 to-emerald-500',
  },
  {
    id: 'chunking',
    title: 'Chunking Strategies',
    icon: Layers,
    color: 'from-emerald-500 to-green-500',
  },
  {
    id: 'embeddings',
    title: 'Embeddings & Vectorization',
    icon: Brain,
    color: 'from-violet-500 to-purple-500',
  },
  {
    id: 'vectorstore',
    title: 'Vector Databases',
    icon: Database,
    color: 'from-green-500 to-lime-500',
  },
  {
    id: 'retrieval',
    title: 'Retrieval & Search',
    icon: Search,
    color: 'from-lime-500 to-yellow-500',
  },
  {
    id: 'generation',
    title: 'LLM Generation',
    icon: MessageSquare,
    color: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'providers',
    title: 'LLM Providers',
    icon: Globe,
    color: 'from-orange-500 to-rose-500',
  },
  {
    id: 'analytics',
    title: 'Analytics & Metrics',
    icon: BarChart3,
    color: 'from-rose-500 to-pink-500',
  },
  {
    id: 'best-practices',
    title: 'Best Practices',
    icon: Shield,
    color: 'from-indigo-500 to-blue-500',
  },
  {
    id: 'faq',
    title: 'FAQ',
    icon: AlertCircle,
    color: 'from-purple-500 to-pink-500',
  },
];

// ─── Expandable Content Block ────────────────────────────────────────

function ContentBlock({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-bg-hover transition-colors">
        <ChevronDown className={cn('w-4 h-4 text-text-muted transition-transform shrink-0', !open && '-rotate-90')} />
        <span className="text-sm font-semibold text-text-primary">{title}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 text-sm text-text-secondary leading-relaxed">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Step Card ───────────────────────────────────────────────────────

function StepCard({ number, title, description, icon: Icon, color }: {
  number: number; title: string; description: string; icon: any; color: string;
}) {
  return (
    <div className="flex gap-4 p-4 bg-bg-secondary rounded-xl border border-border-primary">
      <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary font-bold">Step {number}</span>
          <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
        </div>
        <p className="text-xs text-text-tertiary leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ─── Code Block ──────────────────────────────────────────────────────

function CodeBlock({ children, title }: { children: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="bg-bg-primary rounded-lg border border-border-primary overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-bg-elevated border-b border-border-primary">
          <span className="text-[10px] font-mono text-text-muted">{title}</span>
          <button onClick={handleCopy} className="text-[10px] text-text-muted hover:text-text-primary transition-colors">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      <pre className="p-3 text-xs text-text-secondary font-mono overflow-x-auto whitespace-pre-wrap">{children}</pre>
    </div>
  );
}

// ─── Info Card ───────────────────────────────────────────────────────

function InfoCard({ title, children, variant = 'info' }: { title: string; children: React.ReactNode; variant?: 'info' | 'warning' | 'tip' }) {
  const styles = {
    info: 'bg-blue-500/5 border-blue-500/20 text-blue-400',
    warning: 'bg-amber-500/5 border-amber-500/20 text-amber-400',
    tip: 'bg-green-500/5 border-green-500/20 text-green-400',
  };
  return (
    <div className={cn('rounded-xl border p-4', styles[variant])}>
      <div className="text-xs font-semibold mb-2">{title}</div>
      <div className="text-xs text-text-secondary leading-relaxed">{children}</div>
    </div>
  );
}

// ─── Comparison Table ────────────────────────────────────────────────

function ComparisonTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border-primary">
            {headers.map((h) => <th key={h} className="text-left px-3 py-2 text-text-muted font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border-primary/50 hover:bg-bg-hover transition-colors">
              {row.map((cell, j) => <td key={j} className="px-3 py-2 text-text-secondary">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Documentation Page ─────────────────────────────────────────

export default function Documentation() {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border-primary bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">RAG Documentation</h1>
              <p className="text-xs text-text-tertiary">Complete guide to Retrieval-Augmented Generation</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Nav */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-1">
              {sections.map((s) => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all text-left',
                    activeSection === s.id
                      ? 'bg-accent-glow text-accent-primary font-medium'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover')}>
                  <s.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div key={activeSection} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-4">

                {/* ═══ OVERVIEW ═══ */}
                {activeSection === 'overview' && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
                      <h2 className="text-xl font-bold text-text-primary mb-3">What is RAG?</h2>
                      <p className="text-sm text-text-secondary leading-relaxed mb-4">
                        <strong className="text-text-primary">Retrieval-Augmented Generation (RAG)</strong> is a technique that
                        enhances Large Language Models (LLMs) by combining them with an external knowledge retrieval system.
                        Instead of relying solely on the model's training data, RAG fetches relevant documents from a knowledge
                        base at query time and uses them as context for generating accurate, grounded answers.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          { icon: Search, title: 'Retrieve', desc: 'Find relevant documents from your knowledge base', color: 'text-blue-400' },
                          { icon: Layers, title: 'Augment', desc: 'Inject retrieved context into the LLM prompt', color: 'text-cyan-400' },
                          { icon: MessageSquare, title: 'Generate', desc: 'LLM produces an answer grounded in real data', color: 'text-teal-400' },
                        ].map((item) => (
                          <div key={item.title} className="bg-bg-elevated rounded-lg p-4 text-center">
                            <item.icon className={cn('w-6 h-6 mx-auto mb-2', item.color)} />
                            <div className="text-sm font-semibold text-text-primary mb-1">{item.title}</div>
                            <div className="text-[10px] text-text-tertiary">{item.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <ContentBlock title="Why RAG Instead of Fine-Tuning?">
                      <ComparisonTable
                        headers={['Aspect', 'RAG', 'Fine-Tuning']}
                        rows={[
                          ['Knowledge Updates', 'Real-time — just add documents', 'Requires retraining'],
                          ['Cost', 'Low — no GPU training needed', 'High — compute + data prep'],
                          ['Hallucination', 'Grounded in retrieved sources', 'Can hallucinate from training'],
                          ['Transparency', 'Cite exact sources', 'Black box reasoning'],
                          ['Data Privacy', 'Data stays in your DB', 'Data embedded in model weights'],
                          ['Time to Deploy', 'Minutes', 'Hours to days'],
                        ]} />
                    </ContentBlock>

                    <ContentBlock title="When to Use RAG">
                      <ul className="space-y-2 text-sm">
                        {[
                          'Your knowledge base changes frequently',
                          'You need to cite sources for generated answers',
                          'You want to answer questions about private/proprietary documents',
                          'You need accurate, up-to-date information (not training cutoff)',
                          'You want to reduce hallucination in LLM outputs',
                          'You need a cost-effective alternative to fine-tuning',
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                            <span className="text-text-secondary">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </ContentBlock>
                  </div>
                )}

                {/* ═══ PIPELINE ═══ */}
                {activeSection === 'pipeline' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-text-primary">The RAG Pipeline</h2>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      A complete RAG pipeline consists of 7 stages, each critical for producing accurate, grounded answers.
                      RAG Studio lets you build, configure, and test each stage independently.
                    </p>

                    <div className="space-y-3">
                      {[
                        { n: 1, title: 'Document Ingestion', desc: 'Upload files (PDF, DOCX, TXT, etc.) or paste text. The system parses the content, extracts text, metadata, and structure.', icon: FileText, color: 'from-blue-500 to-cyan-500' },
                        { n: 2, title: 'Chunking', desc: 'Split documents into smaller, overlapping chunks. This is essential because LLMs have context window limits and retrieval works better on focused passages.', icon: Layers, color: 'from-cyan-500 to-teal-500' },
                        { n: 3, title: 'Embedding', desc: 'Convert each text chunk into a dense vector (array of numbers) using a transformer model. Similar texts produce similar vectors, enabling semantic search.', icon: Brain, color: 'from-teal-500 to-emerald-500' },
                        { n: 4, title: 'Vector Storage', desc: 'Store the embeddings in a vector database (FAISS or ChromaDB). The database indexes vectors for fast similarity search.', icon: Database, color: 'from-emerald-500 to-green-500' },
                        { n: 5, title: 'Retrieval', desc: 'When a user asks a question, embed the query, search the vector DB for the most similar chunks, and optionally rerank them for better relevance.', icon: Search, color: 'from-green-500 to-lime-500' },
                        { n: 6, title: 'Generation', desc: 'Construct a prompt with the retrieved chunks as context, send it to an LLM (Ollama, Groq, OpenAI, etc.), and generate a grounded answer.', icon: MessageSquare, color: 'from-lime-500 to-yellow-500' },
                        { n: 7, title: 'Analytics', desc: 'Track pipeline performance: timing per step, embedding dimensions, retrieval scores, token usage, and overall latency.', icon: BarChart3, color: 'from-yellow-500 to-orange-500' },
                      ].map((step) => (
                        <StepCard key={step.n} number={step.n} title={step.title} description={step.desc} icon={step.icon} color={step.color} />
                      ))}
                    </div>

                    <InfoCard title="How RAG Studio Works" variant="tip">
                      In RAG Builder, you walk through Steps 1-4 to build your pipeline, then use Steps 5-6 to query your documents.
                      The chat interface automatically handles retrieval + generation for each question you ask.
                    </InfoCard>
                  </div>
                )}

                {/* ═══ INGESTION ═══ */}
                {activeSection === 'ingestion' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-text-primary">Document Ingestion</h2>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      The first step of any RAG pipeline is getting your documents into the system. RAG Studio supports
                      a wide range of file formats with real parsing — no mock data, no placeholder files.
                    </p>

                    <ContentBlock title="Supported File Formats">
                      <ComparisonTable
                        headers={['Format', 'Extension', 'Parser', 'Notes']}
                        rows={[
                          ['PDF', '.pdf', 'PyMuPDF', 'Extracts text, images, metadata'],
                          ['Word Document', '.docx, .doc', 'python-docx', 'Paragraphs, tables, headers'],
                          ['Excel', '.xlsx, .xls', 'openpyxl', 'Sheets, rows, formulas as text'],
                          ['PowerPoint', '.pptx, .ppt', 'python-pptx', 'Slide text, notes'],
                          ['CSV / TSV', '.csv, .tsv', 'Python csv', 'Tabular data rows'],
                          ['Plain Text', '.txt', 'Native', 'Direct text read'],
                          ['Markdown', '.md', 'Native', 'Preserves structure'],
                          ['HTML', '.html, .htm', 'BeautifulSoup', 'Strips tags, extracts text'],
                          ['JSON / JSONL', '.json, .jsonl', 'Python json', 'Structured data'],
                          ['XML / SVG', '.xml, .svg', 'xml.etree', 'Node text extraction'],
                          ['Images', '.png, .jpg, .gif, etc.', 'Tesseract OCR', 'Optical character recognition'],
                          ['ZIP Archive', '.zip', 'zipfile', 'Extracts and parses contents'],
                        ]} />
                    </ContentBlock>

                    <ContentBlock title="How Parsing Works">
                      <ol className="space-y-2 text-sm list-decimal pl-4">
                        <li className="text-text-secondary">User uploads a file via the Upload button or pastes text directly</li>
                        <li className="text-text-secondary">The backend detects the file type from the extension</li>
                        <li className="text-text-secondary">The appropriate parser extracts raw text content</li>
                        <li className="text-text-secondary">Metadata is collected: filename, word count, character count, page count, language</li>
                        <li className="text-text-secondary">The parsed text is stored in session memory for the next pipeline step</li>
                      </ol>
                    </ContentBlock>

                    <CodeBlock title="API Endpoint">{"POST /api/parse/upload\nBody: multipart/form-data with 'file' field\n\nResponse:\n{\n  \"success\": true,\n  \"text\": \"Extracted document text...\",\n  \"file_name\": \"report.pdf\",\n  \"file_type\": \"pdf\",\n  \"characters\": 12500,\n  \"words\": 2100,\n  \"pages\": 5\n}"}</CodeBlock>
                  </div>
                )}

                {/* ═══ CHUNKING ═══ */}
                {activeSection === 'chunking' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-text-primary">Chunking Strategies</h2>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      Chunking splits long documents into smaller pieces that fit within an LLM's context window and produce
                      more focused retrieval results. The right chunking strategy depends on your document type and use case.
                    </p>

                    <div className="space-y-3">
                      {[
                        { name: 'Recursive Character', id: 'recursive', desc: 'Splits text by a hierarchy of separators (\\n\\n, \\n, ., space). Best general-purpose method.', best: 'General documents, FAQ pages' },
                        { name: 'Sentence-based', id: 'sentence', desc: 'Groups complete sentences into chunks. Preserves sentence boundaries for natural reading.', best: 'Articles, blog posts, reports' },
                        { name: 'Semantic Chunking', id: 'semantic', desc: 'Detects topic shifts using embedding similarity. Chunks stay topically coherent.', best: 'Long documents with shifting topics' },
                        { name: 'Markdown-aware', id: 'markdown', desc: 'Splits on markdown headers (#, ##, ###). Respects document structure hierarchy.', best: 'Technical docs, README files, wikis' },
                        { name: 'Token-based', id: 'token', desc: 'Splits by approximate token count using tiktoken. Useful for strict context window limits.', best: 'When you need precise token control' },
                        { name: 'Sliding Window', id: 'sliding_window', desc: 'Fixed-size window with character-level overlap. Simple and predictable.', best: 'Sequential data, transcripts' },
                        { name: 'Parent-Child', id: 'parent_child', desc: 'Creates large parent chunks for context and small child chunks for retrieval. Best of both worlds.', best: 'When you need context + precision' },
                      ].map((method) => (
                        <div key={method.id} className="bg-bg-secondary rounded-xl border border-border-primary p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-text-primary">{method.name}</h4>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary font-mono">{method.id}</span>
                          </div>
                          <p className="text-xs text-text-secondary mb-2">{method.desc}</p>
                          <div className="text-[10px] text-text-tertiary">
                            <strong className="text-text-secondary">Best for:</strong> {method.best}
                          </div>
                        </div>
                      ))}
                    </div>

                    <ContentBlock title="Key Parameters">
                      <div className="space-y-2">
                        <div className="bg-bg-elevated rounded-lg p-3">
                          <div className="text-xs font-semibold text-text-primary mb-1">Chunk Size (100-2000 chars)</div>
                          <div className="text-[10px] text-text-tertiary">Target size for each chunk. Smaller chunks = more precise retrieval but less context. Larger chunks = more context but less focused search.</div>
                        </div>
                        <div className="bg-bg-elevated rounded-lg p-3">
                          <div className="text-xs font-semibold text-text-primary mb-1">Overlap (0-200 chars)</div>
                          <div className="text-[10px] text-text-tertiary">Characters shared between adjacent chunks. Prevents information from being split at chunk boundaries. Typical: 10-20% of chunk size.</div>
                        </div>
                      </div>
                    </ContentBlock>

                    <InfoCard title="Pro Tip" variant="tip">
                      In RAG Builder, changing the chunk size or overlap immediately regenerates the chunks so you can
                      see the effect in real-time. Experiment to find the optimal settings for your documents.
                    </InfoCard>
                  </div>
                )}

                {/* ═══ EMBEDDINGS ═══ */}
                {activeSection === 'embeddings' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-text-primary">Embeddings & Vectorization</h2>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      Embedding models convert text into dense numerical vectors (arrays of floats) that capture semantic meaning.
                      Texts with similar meanings produce vectors that are close together in the embedding space.
                    </p>

                    <ContentBlock title="Available Embedding Models">
                      <ComparisonTable
                        headers={['Model', 'Dimensions', 'Size', 'Speed', 'Quality']}
                        rows={[
                          ['all-MiniLM-L6-v2', '384', '90MB', 'Fast', 'Good — great for starting out'],
                          ['BAAI/bge-small-en', '384', '130MB', 'Medium', 'Very Good — strong retrieval'],
                          ['intfloat/e5-small-v2', '384', '130MB', 'Medium', 'Very Good — instruction-aware'],
                          ['all-mpnet-base-v2', '768', '420MB', 'Slow', 'Excellent — highest accuracy'],
                          ['hkunlp/instructor-small', '768', '500MB', 'Slow', 'Excellent — task-specific'],
                        ]} />
                    </ContentBlock>

                    <ContentBlock title="How Embeddings Work">
                      <ol className="space-y-2 text-sm list-decimal pl-4">
                        <li className="text-text-secondary">Each text chunk is tokenized and fed into a transformer neural network</li>
                        <li className="text-text-secondary">The model outputs a fixed-size vector (e.g., 384 or 768 dimensions)</li>
                        <li className="text-text-secondary">Similar texts produce vectors that are close in Euclidean/cosine space</li>
                        <li className="text-text-secondary">At query time, the query is embedded using the same model</li>
                        <li className="text-text-secondary">Similarity search finds the closest vectors (= most relevant chunks)</li>
                      </ol>
                    </ContentBlock>

                    <ContentBlock title="How to Choose a Model">
                      <ul className="space-y-2 text-sm">
                        {[
                          'MiniLM L6: Fast, small, good enough for most use cases. Start here.',
                          'BGE Small: Better retrieval quality at similar speed. Recommended for production.',
                          'E5 Small: Instruction-aware — great when queries are question-like.',
                          'MPNet Base: Highest accuracy but 5x larger. Use when quality matters most.',
                          'Instructor: Best for task-specific embeddings. Can customize for your domain.',
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-accent-primary mt-0.5 shrink-0" />
                            <span className="text-text-secondary">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </ContentBlock>

                    <CodeBlock title="API Endpoint">{"POST /api/embed\nBody: { \"texts\": [\"chunk1\", \"chunk2\"], \"model\": \"all-MiniLM-L6-v2\" }\n\nResponse:\n{\n  \"success\": true,\n  \"embeddings\": [[0.12, -0.34, ...], [0.56, 0.78, ...]],\n  \"dimensions\": 384,\n  \"count\": 2,\n  \"inference_time_ms\": 45.2\n}"}</CodeBlock>
                  </div>
                )}

                {/* ═══ VECTOR STORE ═══ */}
                {activeSection === 'vectorstore' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-text-primary">Vector Databases</h2>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      Vector databases store embedding vectors and provide fast similarity search. RAG Studio supports
                      three backends — all stored locally with full persistence.
                    </p>

                    <div className="space-y-3">
                      {[
                        { name: 'FAISS Flat', id: 'faiss_flat', desc: 'Exact nearest neighbor search using Facebook AI Similarity Search. Returns perfect results but slower on very large datasets.', pros: '100% accurate results', cons: 'Slower with 100K+ vectors', best: 'Small to medium datasets' },
                        { name: 'FAISS HNSW', id: 'faiss_hnsw', desc: 'Approximate nearest neighbor using Hierarchical Navigable Small World graphs. Much faster with slight accuracy trade-off.', pros: 'Very fast search', cons: 'Slight accuracy loss (~95%)', best: 'Large datasets, speed-critical' },
                        { name: 'ChromaDB', id: 'chromadb', desc: 'Purpose-built embedding database with rich metadata filtering, automatic persistence, and simple API.', pros: 'Rich metadata queries', cons: 'Additional dependency', best: 'Metadata-heavy use cases' },
                      ].map((db) => (
                        <div key={db.id} className="bg-bg-secondary rounded-xl border border-border-primary p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Database className="w-4 h-4 text-accent-primary" />
                            <h4 className="text-sm font-semibold text-text-primary">{db.name}</h4>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-bg-elevated text-text-muted font-mono">{db.id}</span>
                          </div>
                          <p className="text-xs text-text-secondary mb-2">{db.desc}</p>
                          <div className="grid grid-cols-3 gap-2 text-[10px]">
                            <div className="bg-green-500/5 rounded p-2"><strong className="text-green-400">Pros:</strong> <span className="text-text-tertiary">{db.pros}</span></div>
                            <div className="bg-red-500/5 rounded p-2"><strong className="text-red-400">Cons:</strong> <span className="text-text-tertiary">{db.cons}</span></div>
                            <div className="bg-blue-500/5 rounded p-2"><strong className="text-blue-400">Best for:</strong> <span className="text-text-tertiary">{db.best}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <ContentBlock title="Vector Store Operations">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { name: 'Add', desc: 'Insert vectors with metadata' },
                          { name: 'Search', desc: 'Find similar vectors' },
                          { name: 'Delete', desc: 'Remove vectors or collections' },
                          { name: 'Stats', desc: 'View collection statistics' },
                        ].map((op) => (
                          <div key={op.name} className="bg-bg-elevated rounded-lg p-3 text-center">
                            <div className="text-xs font-semibold text-text-primary">{op.name}</div>
                            <div className="text-[10px] text-text-tertiary">{op.desc}</div>
                          </div>
                        ))}
                      </div>
                    </ContentBlock>
                  </div>
                )}

                {/* ═══ RETRIEVAL ═══ */}
                {activeSection === 'retrieval' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-text-primary">Retrieval & Search</h2>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      Retrieval is the core of RAG — finding the most relevant document chunks for a user's query.
                      RAG Studio implements a multi-stage retrieval pipeline.
                    </p>

                    <div className="space-y-3">
                      {[
                        { n: 1, title: 'Query Embedding', desc: 'The user\'s question is converted to a vector using the same embedding model used for the documents.', icon: Brain, color: 'from-violet-500 to-purple-500' },
                        { n: 2, title: 'Vector Search', desc: 'The query vector is compared against all stored vectors using cosine similarity. Top 2x results are fetched for reranking.', icon: Database, color: 'from-green-500 to-lime-500' },
                        { n: 3, title: 'Reranking', desc: 'Results are reranked using keyword overlap scoring to boost chunks that match both semantically and lexically.', icon: Search, color: 'from-lime-500 to-yellow-500' },
                        { n: 4, title: 'Top-K Selection', desc: 'The top K results (default 5) are selected and returned with their similarity scores and metadata.', icon: CheckCircle2, color: 'from-yellow-500 to-orange-500' },
                      ].map((step) => (
                        <StepCard key={step.n} number={step.n} title={step.title} description={step.desc} icon={step.icon} color={step.color} />
                      ))}
                    </div>

                    <ContentBlock title="Search Methods">
                      <ComparisonTable
                        headers={['Method', 'How It Works', 'When to Use']}
                        rows={[
                          ['Cosine Similarity', 'Measures angle between vectors. Values close to 1 = very similar.', 'Default for most queries'],
                          ['Keyword Overlap', 'Counts shared words between query and chunk text.', 'Exact term matching (names, codes)'],
                          ['Hybrid Search', 'Combines semantic + keyword with configurable weights.', 'When you need both precision and recall'],
                          ['Reranking', 'Reorders results using a cross-encoder or overlap score.', 'Always — improves final ranking'],
                        ]} />
                    </ContentBlock>

                    <CodeBlock title="API Endpoint">{"POST /api/retrieve\nBody: {\n  \"query\": \"Who is the founder of Tara?\",\n  \"top_k\": 5,\n  \"collection\": \"default\",\n  \"store_type\": \"faiss_flat\",\n  \"use_reranker\": true\n}\n\nResponse:\n{\n  \"success\": true,\n  \"results\": [\n    { \"rank\": 1, \"score\": 0.89, \"text\": \"Tara was founded by...\", \"metadata\": {...} }\n  ],\n  \"timing\": { \"embed_ms\": 12, \"search_ms\": 3, \"rerank_ms\": 1 }\n}"}</CodeBlock>
                  </div>
                )}

                {/* ═══ GENERATION ═══ */}
                {activeSection === 'generation' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-text-primary">LLM Generation</h2>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      The final step: construct a prompt with the retrieved chunks as context and send it to an LLM
                      to generate a grounded answer. RAG Studio supports multiple providers.
                    </p>

                    <ContentBlock title="How RAG Generation Works">
                      <ol className="space-y-2 text-sm list-decimal pl-4">
                        <li className="text-text-secondary">Retrieve relevant chunks from the vector database</li>
                        <li className="text-text-secondary">Build a system prompt: "Answer the question using ONLY the provided context"</li>
                        <li className="text-text-secondary">Format the context: concatenate all retrieved chunk texts</li>
                        <li className="text-text-secondary">Send to the LLM: system prompt + context + user question</li>
                        <li className="text-text-secondary">The LLM generates an answer grounded in the retrieved data</li>
                        <li className="text-text-secondary">Return the answer with token usage and timing metadata</li>
                      </ol>
                    </ContentBlock>

                    <ContentBlock title="Prompt Template">
                      <CodeBlock title="RAG Prompt Structure">{"System: You are a helpful assistant that answers questions using the provided context. If the context doesn't contain enough information, say so clearly. Cite sources when possible.\n\nContext:\n---\n[Chunk 1: Relevant document passage]\n---\n[Chunk 2: Another relevant passage]\n---\n\nQuestion: [User's question]\n\nAnswer:"}</CodeBlock>
                    </ContentBlock>

                    <ContentBlock title="Generation Parameters">
                      <div className="space-y-2">
                        <div className="bg-bg-elevated rounded-lg p-3">
                          <div className="text-xs font-semibold text-text-primary mb-1">Temperature (0.0 - 1.0)</div>
                          <div className="text-[10px] text-text-tertiary">Controls randomness. Lower = more deterministic/focused. Higher = more creative/varied. RAG typically uses 0.3-0.7.</div>
                        </div>
                        <div className="bg-bg-elevated rounded-lg p-3">
                          <div className="text-xs font-semibold text-text-primary mb-1">Max Tokens</div>
                          <div className="text-[10px] text-text-tertiary">Maximum length of the generated response. Default 1024 tokens (~750 words).</div>
                        </div>
                        <div className="bg-bg-elevated rounded-lg p-3">
                          <div className="text-xs font-semibold text-text-primary mb-1">Context Chunks (Top-K)</div>
                          <div className="text-[10px] text-text-tertiary">Number of retrieved chunks to include in the prompt. More chunks = more context but higher token cost. Default 5.</div>
                        </div>
                      </div>
                    </ContentBlock>
                  </div>
                )}

                {/* ═══ PROVIDERS ═══ */}
                {activeSection === 'providers' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-text-primary">LLM Providers</h2>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      RAG Studio supports multiple LLM providers. Choose based on your needs: local privacy,
                      free cloud inference, or premium quality.
                    </p>

                    <div className="space-y-3">
                      {[
                        { name: 'Ollama', desc: 'Run LLMs locally on your machine. 100% private, no API key needed.', models: 'llama3.2, mistral, gemma2, phi3', setup: 'Install Ollama, pull a model', color: 'text-blue-400', tag: 'Local' },
                        { name: 'Groq', desc: 'Ultra-fast inference on Llama, Mixtral, Gemma. Free tier available.', models: 'llama-3.1-8b, llama-3.3-70b, mixtral-8x7b', setup: 'Get free key at console.groq.com', color: 'text-green-400', tag: 'Free' },
                        { name: 'Hugging Face', desc: 'Wide model variety via Inference API. Free token available.', models: 'Llama 3.1, Mistral 7B, Zephyr, Phi-3', setup: 'Get free token at huggingface.co', color: 'text-amber-400', tag: 'Free' },
                        { name: 'OpenRouter', desc: 'Auto-select best free model. Aggregates multiple providers.', models: 'Llama 3.1 Free, Mistral Free, Gemma 2 Free', setup: 'Get key at openrouter.ai', color: 'text-purple-400', tag: 'Free' },
                        { name: 'OpenAI', desc: 'GPT-4o, GPT-4o-mini. Highest quality, paid API.', models: 'gpt-4o, gpt-4o-mini, gpt-3.5-turbo', setup: 'API key from platform.openai.com', color: 'text-rose-400', tag: 'Paid' },
                      ].map((provider) => (
                        <div key={provider.name} className="bg-bg-secondary rounded-xl border border-border-primary p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn('w-2 h-2 rounded-full', provider.color.replace('text-', 'bg-'))} />
                            <h4 className="text-sm font-semibold text-text-primary">{provider.name}</h4>
                            <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold',
                              provider.tag === 'Free' ? 'bg-green-500/10 text-green-400' :
                              provider.tag === 'Local' ? 'bg-blue-500/10 text-blue-400' :
                              'bg-amber-500/10 text-amber-400'
                            )}>{provider.tag}</span>
                          </div>
                          <p className="text-xs text-text-secondary mb-2">{provider.desc}</p>
                          <div className="flex flex-wrap gap-2 text-[10px]">
                            <span className="text-text-muted">Models: <span className="text-text-secondary">{provider.models}</span></span>
                          </div>
                          <div className="text-[10px] text-text-muted mt-1">Setup: {provider.setup}</div>
                        </div>
                      ))}
                    </div>

                    <InfoCard title="Recommended Setup" variant="tip">
                      For quick testing, use Groq (free, fast). For production with privacy requirements, use Ollama locally.
                      For highest quality on important queries, use OpenAI GPT-4o.
                    </InfoCard>
                  </div>
                )}

                {/* ═══ ANALYTICS ═══ */}
                {activeSection === 'analytics' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-text-primary">Analytics & Metrics</h2>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      RAG Studio tracks real metrics at every stage of the pipeline. All values are computed live —
                      no placeholders, no mock data.
                    </p>

                    <ContentBlock title="Tracked Metrics">
                      <ComparisonTable
                        headers={['Metric', 'What It Measures', 'Where']}
                        rows={[
                          ['Parse Time', 'Time to extract text from file', 'Step 1: Ingestion'],
                          ['Chunk Count', 'Number of chunks created', 'Step 2: Chunking'],
                          ['Avg Chunk Size', 'Mean character count per chunk', 'Step 2: Chunking'],
                          ['Chunk Time', 'Time to split document into chunks', 'Step 2: Chunking'],
                          ['Embedding Count', 'Total embeddings generated', 'Step 3: Embeddings'],
                          ['Embedding Dimensions', 'Vector size (384 or 768)', 'Step 3: Embeddings'],
                          ['Embed Time', 'Time to generate all embeddings', 'Step 3: Embeddings'],
                          ['Vector Count', 'Total vectors in store', 'Step 4: Vector Store'],
                          ['Retrieval Score', 'Cosine similarity of top results', 'Step 5: Retrieval'],
                          ['Retrieval Time', 'Total search + rerank time', 'Step 5: Retrieval'],
                          ['Token Usage', 'Prompt + completion tokens', 'Step 6: Generation'],
                          ['Generation Time', 'Time to generate LLM response', 'Step 6: Generation'],
                          ['Total Pipeline Time', 'End-to-end duration', 'Step 7: Analytics'],
                        ]} />
                    </ContentBlock>

                    <ContentBlock title="Pipeline Analytics Dashboard">
                      <p className="mb-2">The Analytics tab (Step 7) provides four views:</p>
                      <ul className="space-y-1 text-xs">
                        {[
                          'Overview: Timing bar chart, summary cards for chars/chunks/embeddings/tokens',
                          'Chunks: Size distribution histogram, individual chunk viewer',
                          'Retrieval: Score bar chart, detailed result cards with source metadata',
                          'Queries: Full chat history with metadata (chunks used, latency, confidence)',
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 text-accent-primary mt-0.5 shrink-0" />
                            <span className="text-text-secondary">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </ContentBlock>
                  </div>
                )}

                {/* ═══ BEST PRACTICES ═══ */}
                {activeSection === 'best-practices' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-text-primary">Best Practices</h2>

                    <ContentBlock title="Chunking">
                      <ul className="space-y-2 text-sm">
                        {[
                          'Start with Recursive Character chunking — it works well for most documents',
                          'Use 500-1000 char chunks for general text, 200-500 for Q&A pairs',
                          'Set overlap to 10-20% of chunk size to prevent information gaps',
                          'Use Markdown-aware chunking for technical documentation',
                          'Test different chunk sizes and see the effect on retrieval quality',
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                            <span className="text-text-secondary">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </ContentBlock>

                    <ContentBlock title="Embeddings">
                      <ul className="space-y-2 text-sm">
                        {[
                          'Use the same embedding model for documents and queries (consistency is critical)',
                          'Start with MiniLM L6 (fast, good quality). Upgrade to MPNet if quality is insufficient',
                          '384 dimensions is usually enough. 768 dimensions adds accuracy but uses more storage',
                          'Embeddings are computed once at index time — they don\'t change unless you re-embed',
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                            <span className="text-text-secondary">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </ContentBlock>

                    <ContentBlock title="Retrieval">
                      <ul className="space-y-2 text-sm">
                        {[
                          'Always enable reranking — it improves result quality at minimal cost',
                          'Use top_k=5 for most queries. Increase to 10 for complex multi-part questions',
                          'If results are poor, try reformulating the query with more specific terms',
                          'Hybrid search (semantic + keyword) works best for queries with specific names/codes',
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                            <span className="text-text-secondary">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </ContentBlock>

                    <ContentBlock title="Generation">
                      <ul className="space-y-2 text-sm">
                        {[
                          'Use temperature 0.3-0.5 for factual questions, 0.7 for creative tasks',
                          'Always instruct the LLM to only use provided context (reduces hallucination)',
                          'If the answer seems wrong, check if the retrieved chunks are actually relevant',
                          'For critical applications, compare answers across multiple LLM providers',
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                            <span className="text-text-secondary">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </ContentBlock>
                  </div>
                )}

                {/* ═══ FAQ ═══ */}
                {activeSection === 'faq' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-text-primary">Frequently Asked Questions</h2>

                    {[
                      { q: 'What files can I upload?', a: 'RAG Studio supports PDF, DOCX, XLSX, PPTX, CSV, TXT, Markdown, HTML, JSON, XML, images (OCR), and ZIP archives. The backend parses each format with specialized parsers.' },
                      { q: 'Do I need an API key?', a: 'For cloud LLM providers (Groq, Hugging Face, OpenAI), yes — free keys are available from Groq and Hugging Face. For Ollama, no key is needed — it runs locally on your machine.' },
                      { q: 'Is my data sent to the cloud?', a: 'With Ollama, everything stays on your machine. With cloud providers, only the retrieved chunks + query are sent for generation — your vector database and documents remain local.' },
                      { q: 'Which chunking method should I use?', a: 'Start with Recursive Character — it works for most document types. Use Markdown-aware for technical docs, Semantic for long documents with topic shifts, and Parent-Child when you need both context and precision.' },
                      { q: 'Why are my retrieval results poor?', a: 'Common causes: wrong embedding model mismatch, chunks too large or too small, or the query doesn\'t match document terminology. Try adjusting chunk size, enabling reranking, or reformulating the query.' },
                      { q: 'How do I improve generation quality?', a: 'Use a larger LLM (e.g., Llama 3.3 70B instead of 8B), increase top_k to include more context, lower temperature for factual accuracy, and ensure your system prompt instructs the LLM to only use provided context.' },
                      { q: 'Can I use RAG Studio for production?', a: 'RAG Studio is designed for building and testing RAG pipelines. For production, export your pipeline configuration and deploy the backend components (parsers, chunkers, embeddings, vector store, LLM) as a service.' },
                      { q: 'What is the difference between FAISS Flat and HNSW?', a: 'FAISS Flat does exact search — it compares your query against every vector. FAISS HNSW uses a graph structure for approximate search — much faster but may miss some results. Use Flat for <100K vectors, HNSW for larger datasets.' },
                    ].map((item, i) => (
                      <FAQItem key={i} question={item.q} answer={item.a} />
                    ))}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FAQ Item ────────────────────────────────────────────────────────

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-bg-hover transition-colors">
        <ChevronDown className={cn('w-4 h-4 text-text-muted transition-transform shrink-0', !open && '-rotate-90')} />
        <span className="text-sm font-medium text-text-primary">{question}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 text-sm text-text-secondary leading-relaxed">{answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
