import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Layers, FileText, Brain, Database, Search, MessageSquare,
  Globe, BarChart3, Shield, AlertCircle, ChevronDown, ChevronRight,
  Image, Video, Headphones, Cpu, Eye, BookOpen, ArrowRight, CheckCircle2,
  Target, Network, GitBranch, BookMarked
} from 'lucide-react';
import { cn } from '../lib/utils';

// ─── Section Data ────────────────────────────────────────────────
const sections = [
  { id: 'what-is-rag', title: 'What is RAG?', icon: Zap },
  { id: 'pipeline', title: 'The Pipeline', icon: Layers },
  { id: 'multimodal-rag', title: 'Multimodal RAG', icon: Globe },
  { id: 'ingestion', title: 'Ingestion', icon: FileText },
  { id: 'chunking', title: 'Chunking', icon: Layers },
  { id: 'embeddings', title: 'Embeddings', icon: Brain },
  { id: 'vector-stores', title: 'Vector Databases', icon: Database },
  { id: 'retrieval', title: 'Retrieval', icon: Search },
  { id: 'generation', title: 'Generation', icon: MessageSquare },
  { id: 'speech-rag', title: 'Speech RAG', icon: Headphones },
  { id: 'vision-rag', title: 'Vision RAG', icon: Eye },
  { id: 'graph-rag', title: 'Graph RAG', icon: Network },
  { id: 'agentic-rag', title: 'Agentic RAG', icon: Cpu },
  { id: 'providers', title: 'LLM Providers', icon: Globe },
  { id: 'evidence', title: 'Evidence Timeline', icon: Target },
  { id: 'best-practices', title: 'Best Practices', icon: Shield },
  { id: 'faq', title: 'FAQ', icon: AlertCircle },
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
          <Icon className="w-4.5 h-4.5 text-accent-primary" style={{ width: 18, height: 18 }} />
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

// ─── Main Documentation ──────────────────────────────────────────
export default function Documentation() {
  const [activeSection, setActiveSection] = useState('what-is-rag');

  return (
    <div className="min-h-screen flex">
      {/* Sidebar Navigation */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-border-primary bg-bg-secondary/50 h-screen sticky top-0 overflow-y-auto">
        <div className="p-4 border-b border-border-primary">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent-primary" />
            <span className="text-sm font-bold text-text-primary">Documentation</span>
          </div>
          <p className="text-[10px] text-text-muted mt-1">Multimodal RAG Platform</p>
        </div>
        <nav className="p-3 space-y-0.5">
          {sections.map((s) => (
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
          {/* What is RAG */}
          <DocSection id="what-is-rag" title="What is RAG?" icon={Zap} defaultOpen>
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
          <DocSection id="chunking" title="Chunking" icon={Layers}>
            <p className="text-sm text-text-secondary leading-relaxed">
              Chunking splits parsed content into manageable pieces for embedding. Chunk size and overlap directly affect retrieval quality.
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
          </DocSection>

          {/* Embeddings */}
          <DocSection id="embeddings" title="Embeddings" icon={Brain}>
            <p className="text-sm text-text-secondary leading-relaxed">
              Embeddings are dense vector representations that capture the semantic meaning of content. Similar content produces similar vectors.
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
            <CodeBlock code={`# Cosine Similarity
cos(A, B) = (A · B) / (|A| × |B|)

# Result: -1 (opposite) to 1 (identical)
# Most RAG systems threshold at 0.7+`} />
          </DocSection>

          {/* Vector Stores */}
          <DocSection id="vector-stores" title="Vector Databases" icon={Database}>
            <p className="text-sm text-text-secondary leading-relaxed">
              Vector databases store, index, and query high-dimensional vectors efficiently. They enable fast similarity search across millions of embeddings.
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

          {/* Retrieval */}
          <DocSection id="retrieval" title="Retrieval" icon={Search}>
            <p className="text-sm text-text-secondary leading-relaxed">
              When a user asks a question, the retriever generates a query embedding, searches the vector database, and returns the Top-K most relevant chunks.
            </p>
            <h4 className="text-sm font-semibold text-text-primary mt-4">Search Strategies</h4>
            <div className="space-y-3 mt-2">
              <div className="bg-bg-elevated rounded-xl p-4 border border-border-primary">
                <h5 className="text-sm font-semibold text-text-primary mb-1">Semantic Search</h5>
                <p className="text-sm text-text-secondary">Finds content based on meaning, not exact keywords. "How to fix a car" matches "automotive repair guide."</p>
              </div>
              <div className="bg-bg-elevated rounded-xl p-4 border border-border-primary">
                <h5 className="text-sm font-semibold text-text-primary mb-1">Hybrid Search</h5>
                <p className="text-sm text-text-secondary">Combines semantic (vector) search with keyword (BM25) search. Catches both meaning and exact terms.</p>
              </div>
              <div className="bg-bg-elevated rounded-xl p-4 border border-border-primary">
                <h5 className="text-sm font-semibold text-text-primary mb-1">Cross-Modal Retrieval</h5>
                <p className="text-sm text-text-secondary">Text query retrieves relevant images, video frames, audio timestamps, and chart data from the same vector store.</p>
              </div>
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
              All API keys are read from the .env file on the backend. The frontend never exposes or stores API keys. Users can switch providers through the Builder interface without touching configuration.
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
                { icon: FileText, label: 'Document Page', example: '📄 Page 12 of "Research Paper.pdf"' },
                { icon: Image, label: 'Image Reference', example: '🖼 Image #4 — "Chart of Revenue"' },
                { icon: Video, label: 'Video Timestamp', example: '🎥 Video at 05:23 — "Doctor enters"' },
                { icon: BarChart3, label: 'Chart Location', example: '📊 Chart on slide 18' },
                { icon: Headphones, label: 'Audio Timestamp', example: '🔊 Audio at 12:41 — "Speaker discusses AI"' },
                { icon: Layers, label: 'Table Reference', example: '📋 Table 3 — "Q4 Financial Results"' },
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
            </div>
          </DocSection>

          {/* FAQ */}
          <DocSection id="faq" title="FAQ" icon={AlertCircle}>
            <div className="space-y-4">
              {[
                { q: 'Do I need API keys to use RAG Studio Pro?', a: 'No. The backend reads all secrets from the .env file. The Builder interface lets you select providers without entering keys manually.' },
                { q: 'What file formats are supported?', a: 'PDF, DOCX, TXT, CSV, XLSX, PPTX, Markdown, HTML, JSON, images (PNG/JPEG/WEBP), video (MP4/AVI/MOV), audio (MP3/WAV/FLAC), ZIP archives, URLs, and more.' },
                { q: 'Can I use it offline?', a: 'Yes. With Ollama running locally, you can use open-source models (Llama 3, Mistral, Phi) without any internet connection. Vector stores persist locally.' },
                { q: 'How does the Evidence Timeline work?', a: 'Every retrieval result includes source metadata (page number, frame index, audio timestamp). The generation step maps its answer to these sources, creating a clickable evidence trail.' },
                { q: 'Is my data private?', a: 'Yes. All processing happens locally on your machine. Documents are parsed, chunked, and embedded locally. Vector stores persist in your project directory. No data is sent to external services unless you configure a cloud LLM provider.' },
                { q: 'Can I switch between vector stores?', a: 'Yes. RAG Studio Pro supports FAISS and ChromaDB. You can switch between them in the Builder, and your data persists across sessions.' },
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
