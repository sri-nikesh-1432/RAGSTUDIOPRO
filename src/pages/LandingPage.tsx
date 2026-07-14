import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Zap, BookOpen, Brain, Wrench, BarChart3, ArrowRight,
  ChevronDown, Play, Sparkles, Layers, Database, Search,
  MessageSquare, Cpu, FileText, Lightbulb, Rocket, BrainCircuit
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

// ─── Particle Background ──────────────────────────────────────────
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resize();
    window.addEventListener('resize', resize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      hue: number;
    }

    const particles: Particle[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      hue: Math.random() * 60 + 240,
    }));

    const animate = () => {
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > window.innerWidth) p.vx *= -1;
        if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 70%, ${p.opacity})`;
        ctx.fill();

        // Connect nearby particles
        particles.forEach((p2, j) => {
          if (i === j) return;
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}

// ─── RAG Topics Data ────────────────────────────────────────────────
const ragTopics = [
  {
    category: 'Foundations',
    icon: Lightbulb,
    color: 'from-amber-500 to-orange-500',
    items: [
      { name: 'What is AI', content: 'Artificial Intelligence is the simulation of human intelligence by machines. It encompasses everything from simple rule-based systems to complex neural networks that can learn, reason, and make decisions.', depth: 'Core concept' },
      { name: 'Machine Learning', content: 'ML is a subset of AI where systems learn patterns from data without being explicitly programmed. Instead of writing rules, we feed data to algorithms and they learn the rules themselves.', depth: 'Foundation' },
      { name: 'Deep Learning', content: 'Deep Learning uses neural networks with multiple layers (hence "deep") to learn hierarchical representations of data. Each layer extracts increasingly abstract features.', depth: 'Advanced ML' },
      { name: 'NLP', content: 'Natural Language Processing enables computers to understand, interpret, and generate human language. It bridges the gap between human communication and computer understanding.', depth: 'Language AI' },
      { name: 'Generative AI', content: 'GenAI creates new content—text, images, code, music—by learning patterns from training data. Unlike discriminative models that classify, generative models create.', depth: 'Creative AI' },
    ],
  },
  {
    category: 'Language Models',
    icon: BrainCircuit,
    color: 'from-purple-500 to-violet-500',
    items: [
      { name: 'What is LLM', content: 'Large Language Models are neural networks trained on massive text datasets (billions of parameters). They predict the next token in a sequence, enabling text generation, translation, and reasoning.', depth: 'Core' },
      { name: 'How LLM Works', content: 'LLMs use transformer architecture with self-attention mechanisms. They process text as tokens, compute attention weights to understand relationships between words, and generate probabilities for the next token.', depth: 'Mechanism' },
      { name: 'Transformers', content: 'The transformer architecture processes all tokens in parallel using self-attention. It consists of encoder-decoder blocks with multi-head attention and feed-forward networks.', depth: 'Architecture' },
      { name: 'Attention Mechanism', content: 'Attention allows each token to "look at" every other token and compute relevance scores. Self-attention = "How much should this word attend to every other word?"', depth: 'Key concept' },
      { name: 'Tokens & Tokenization', content: 'Text is split into tokens (subwords, words, or characters). Tokenizers like BPE split "unhappiness" into ["un", "happi", "ness"]. Each token maps to a numerical ID.', depth: 'Processing' },
    ],
  },
  {
    category: 'RAG Core',
    icon: Zap,
    color: 'from-violet-500 to-purple-600',
    items: [
      { name: 'What is RAG', content: 'Retrieval-Augmented Generation combines information retrieval with text generation. Instead of relying solely on trained knowledge, RAG retrieves relevant documents and uses them as context for the LLM.', depth: 'Core concept' },
      { name: 'Why RAG Exists', content: 'LLMs have cutoff dates, can hallucinate, and lack domain-specific knowledge. RAG grounds LLM responses in real, verifiable documents—reducing hallucinations and keeping knowledge current.', depth: 'Motivation' },
      { name: 'Problems without RAG', content: 'Without RAG: hallucinations (making things up), outdated knowledge (training cutoff), no source attribution, cannot access private data, and expensive fine-tuning for every domain.', depth: 'Problems' },
      { name: 'Embeddings', content: 'Dense vector representations of text that capture semantic meaning. Similar texts have similar embeddings. "king" - "man" + "woman" ≈ "queen".', depth: 'Foundation' },
      { name: 'Chunking', content: 'Splitting documents into smaller, manageable pieces. Documents → chunks → embeddings → vectors. Chunk size affects retrieval quality—too small loses context, too large adds noise.', depth: 'Technique' },
    ],
  },
  {
    category: 'Vector Operations',
    icon: Database,
    color: 'from-blue-500 to-cyan-500',
    items: [
      { name: 'Vector Databases', content: 'Specialized databases designed to store, index, and query high-dimensional vectors efficiently. They enable fast similarity search across millions of embeddings.', depth: 'Infrastructure' },
      { name: 'Cosine Similarity', content: 'Measures the angle between two vectors: cos(θ) = (A·B) / (|A|×|B|). Returns -1 (opposite) to 1 (identical). Most common metric for semantic search.', depth: 'Math' },
      { name: 'Semantic Search', content: 'Finding information based on meaning rather than exact keywords. "How to fix a car" matches "automotive repair guide" because their embeddings are close in vector space.', depth: 'Search' },
      { name: 'Hybrid Search', content: 'Combining semantic (vector) search with keyword (BM25) search. Semantic catches meaning, keywords catch exact terms. Together they provide more robust retrieval.', depth: 'Advanced search' },
      { name: 'Graph RAG', content: 'Using knowledge graphs to enhance RAG. Entities and relationships are stored as graph structures, enabling multi-hop reasoning and relationship-aware retrieval.', depth: 'Advanced' },
    ],
  },
  {
    category: 'Advanced RAG',
    icon: Rocket,
    color: 'from-emerald-500 to-teal-500',
    items: [
      { name: 'Agentic RAG', content: 'RAG systems with autonomous agents that plan retrieval strategies, decide which tools to use, and iteratively refine their approach based on intermediate results.', depth: 'Cutting edge' },
      { name: 'Multimodal RAG', content: 'Extending RAG beyond text to include images, audio, and video. Documents with charts, diagrams, and multimedia are indexed and retrieved together.', depth: 'Multimodal' },
      { name: 'RAG vs Fine Tuning', content: 'RAG: dynamic knowledge, no retraining, transparent sources. Fine-tuning: deeper behavior changes, consistent style, but static knowledge and expensive.', depth: 'Comparison' },
      { name: 'Evaluation Metrics', content: 'Precision (relevant retrieved), Recall (all relevant found), F1 (harmonic mean), MRR (rank quality), NDCG (ranking relevance), Hit Rate (any relevant found).', depth: 'Quality' },
    ],
  },
];

// ─── Analogy System ────────────────────────────────────────────────
const analogies: Record<string, {
  persona: string;
  emoji: string;
  steps: { name: string; explanation: string; icon: string }[];
}> = {
  '5 Year Old': {
    persona: '5 Year Old',
    emoji: '👶',
    steps: [
      { name: 'Ingestion', explanation: "Mommy reads you a big storybook and remembers all the words inside it.", icon: '📖' },
      { name: 'Chunking', explanation: "She tears the story into small pieces so it's easy to find the right part later.", icon: '✂️' },
      { name: 'Embedding', explanation: "Each piece gets a secret code that tells us what it's about—like a name tag for ideas!", icon: '🏷️' },
      { name: 'Storage', explanation: "All the secret-coded pieces go into a special treasure box (the computer's memory).", icon: '📦' },
      { name: 'Retrieval', explanation: "When you ask a question, the computer finds the pieces that match your question best!", icon: '🔍' },
      { name: 'LLM', explanation: "A super smart robot reads those pieces and tells you the answer in a way you understand.", icon: '🤖' },
      { name: 'Generation', explanation: "The robot writes you a brand new answer using all the pieces it found—like writing a new story!", icon: '✨' },
    ],
  },
  'Cricket Match': {
    persona: 'Cricket Match',
    emoji: '🏏',
    steps: [
      { name: 'Ingestion', explanation: "The coach collects all match footage, player stats, pitch reports, and commentary transcripts.", icon: '📹' },
      { name: 'Chunking', explanation: "Breaking footage into key moments: overs, wickets, partnerships, individual performances.", icon: '🎬' },
      { name: 'Embedding', explanation: "Each moment gets a statistical fingerprint—batting patterns, bowling speeds, field positions.", icon: '📊' },
      { name: 'Storage', explanation: "All fingerprints go into the team's analytics database for quick access.", icon: '🗄️' },
      { name: 'Retrieval', explanation: "Before a match, the coach searches for similar opponent patterns and relevant past performances.", icon: '🔎' },
      { name: 'LLM', explanation: "The analyst AI reads the retrieved data and formulates a match strategy.", icon: '🧠' },
      { name: 'Generation', explanation: "A comprehensive game plan is generated: batting order, bowling changes, field settings.", icon: '📋' },
    ],
  },
  'Hospital': {
    persona: 'Hospital',
    emoji: '🏥',
    steps: [
      { name: 'Ingestion', explanation: "The hospital's records system ingests all patient files, medical journals, lab reports, and imaging data.", icon: '📋' },
      { name: 'Chunking', explanation: "Records are broken into: symptoms, diagnoses, treatments, lab results, imaging findings.", icon: '🔬' },
      { name: 'Embedding', explanation: "Each medical record segment gets a clinical fingerprint encoding disease patterns and symptom relationships.", icon: '🧬' },
      { name: 'Storage', explanation: "All fingerprints are stored in the hospital's secure medical knowledge base.", icon: '🏛️' },
      { name: 'Retrieval', explanation: "When a patient presents symptoms, similar cases and relevant research are instantly retrieved.", icon: '🩺' },
      { name: 'LLM', explanation: "The diagnostic AI analyzes retrieved information alongside the current patient's data.", icon: '⚕️' },
      { name: 'Generation', explanation: "A differential diagnosis with treatment recommendations is generated for the doctor.", icon: '💊' },
    ],
  },
  'Restaurant': {
    persona: 'Restaurant',
    emoji: '🍽️',
    steps: [
      { name: 'Ingestion', explanation: "The chef's system stores all recipes, ingredient lists, customer reviews, and seasonal availability.", icon: '📚' },
      { name: 'Chunking', explanation: "Recipes are split into: ingredients, cooking steps, timing, plating, allergen info.", icon: '🔪' },
      { name: 'Embedding', explanation: "Each recipe element gets a flavor profile fingerprint—taste combinations, cooking methods, cuisines.", icon: '👃' },
      { name: 'Storage', explanation: "All flavor fingerprints go into the kitchen's smart menu system.", icon: '🗄️' },
      { name: 'Retrieval', explanation: "When a customer asks 'something like pasta but gluten-free,' matching alternatives are found.", icon: '🔍' },
      { name: 'LLM', explanation: "The menu AI reads the matches and considers dietary restrictions, seasonality, and preferences.", icon: '🤖' },
      { name: 'Generation', explanation: "A personalized dish recommendation with description, ingredients, and price is generated.", icon: '🍽️' },
    ],
  },
  'Library': {
    persona: 'Library',
    emoji: '📚',
    steps: [
      { name: 'Ingestion', explanation: "The librarian catalogs every book, article, and resource with detailed metadata.", icon: '📖' },
      { name: 'Chunking', explanation: "Books are indexed by chapters, paragraphs, key concepts, and cross-references.", icon: '📑' },
      { name: 'Embedding', explanation: "Each passage gets a semantic fingerprint that captures its meaning and context.", icon: '🏷️' },
      { name: 'Storage', explanation: "All fingerprints are stored in the library's advanced search index.", icon: '🗄️' },
      { name: 'Retrieval', explanation: "When you ask about 'machine learning in healthcare,' relevant passages from multiple books are found.", icon: '🔎' },
      { name: 'LLM', explanation: "The reference librarian AI reads the retrieved passages and synthesizes an answer.", icon: '🤖' },
      { name: 'Generation', explanation: "A comprehensive answer with citations and further reading suggestions is generated.", icon: '📝' },
    ],
  },
  'Netflix': {
    persona: 'Netflix',
    emoji: '🎬',
    steps: [
      { name: 'Ingestion', explanation: "Netflix processes millions of viewing logs, ratings, genre tags, and content metadata daily.", icon: '📥' },
      { name: 'Chunking', explanation: "Content is segmented by: genre, mood, actors, directors, themes, and viewing patterns.", icon: '🎞️' },
      { name: 'Embedding', explanation: "Each show/movie gets a taste fingerprint encoding viewer preferences and content characteristics.", icon: '🎯' },
      { name: 'Storage', explanation: "All fingerprints are stored in Netflix's recommendation engine database.", icon: '💾' },
      { name: 'Retrieval', explanation: "When you finish a show, similar content and complementary recommendations are retrieved.", icon: '🔍' },
      { name: 'LLM', explanation: "The recommendation AI considers your history, the current show, and trending content.", icon: '🧠' },
      { name: 'Generation', explanation: "A personalized 'Because you watched...' list with reasoning for each pick is generated.", icon: '✨' },
    ],
  },
  'Google Maps': {
    persona: 'Google Maps',
    emoji: '🗺️',
    steps: [
      { name: 'Ingestion', explanation: "Maps ingests road data, traffic feeds, business listings, satellite imagery, and user reviews.", icon: '🛰️' },
      { name: 'Chunking', explanation: "Data is split into: road segments, POIs, traffic patterns, reviews, and photos.", icon: '🗺️' },
      { name: 'Embedding', explanation: "Each location gets a spatial-semantic fingerprint encoding what's there and how it relates.", icon: '📍' },
      { name: 'Storage', explanation: "All fingerprints are stored in Google's distributed spatial index.", icon: '🗄️' },
      { name: 'Retrieval', explanation: "When you search 'best coffee near me,' nearby options with ratings and reviews are retrieved.", icon: '🔎' },
      { name: 'LLM', explanation: "The navigation AI analyzes routes, traffic, preferences, and time constraints.", icon: '🧠' },
      { name: 'Generation', explanation: "Turn-by-turn directions with ETAs, alternative routes, and stop suggestions are generated.", icon: '🗺️' },
    ],
  },
  'Search Engine': {
    persona: 'Search Engine',
    emoji: '🔍',
    steps: [
      { name: 'Ingestion', explanation: "The search engine crawls and indexes billions of web pages continuously.", icon: '🕷️' },
      { name: 'Chunking', explanation: "Pages are broken into: titles, headings, paragraphs, links, metadata, and structured data.", icon: '📄' },
      { name: 'Embedding', explanation: "Each page element gets a relevance fingerprint encoding topic, authority, and freshness.", icon: '🏷️' },
      { name: 'Storage', explanation: "All fingerprints are stored in massive distributed indices across data centers.", icon: '🗄️' },
      { name: 'Retrieval', explanation: "When you type a query, the most relevant pages are retrieved using inverted index + semantic search.", icon: '🔎' },
      { name: 'LLM', explanation: "The ranking AI considers relevance, authority, freshness, and user intent.", icon: '🧠' },
      { name: 'Generation', explanation: "A search results page with snippets, knowledge panels, and featured answers is generated.", icon: '📊' },
    ],
  },
  'Airport': {
    persona: 'Airport',
    emoji: '✈️',
    steps: [
      { name: 'Ingestion', explanation: "The airport system ingests flight data, passenger manifests, weather, and air traffic control info.", icon: '📡' },
      { name: 'Chunking', explanation: "Data is split into: flight routes, gate assignments, passenger needs, and operational schedules.", icon: '📋' },
      { name: 'Embedding', explanation: "Each flight/passenger gets a travel fingerprint encoding routes, timing, and preferences.", icon: '🎫' },
      { name: 'Storage', explanation: "All fingerprints are stored in the airport's operational management system.", icon: '🗄️' },
      { name: 'Retrieval', explanation: "When disruptions happen, affected flights and alternative routes are instantly retrieved.", icon: '🔍' },
      { name: 'LLM', explanation: "The operations AI analyzes weather, traffic, and passenger impact to find solutions.", icon: '🧠' },
      { name: 'Generation', explanation: "Rebooking options, gate changes, and passenger notifications are generated.", icon: '📱' },
    ],
  },
};

// ─── Topic Detail Component ────────────────────────────────────────
function TopicCard({ topic, index, onMouseMove }: { topic: any; index: number; onMouseMove?: React.MouseEventHandler }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onMouseMove={onMouseMove}
      className={cn(
        'group relative rounded-xl border transition-all duration-300 cursor-pointer spotlight',
        expanded
          ? 'border-accent-primary/30 bg-bg-elevated glow-sm'
          : 'border-border-primary bg-bg-secondary hover:border-border-secondary hover:bg-bg-tertiary'
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-glow flex items-center justify-center">
              <span className="text-xs font-bold text-accent-primary">{topic.name.charAt(0)}</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">{topic.name}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-elevated text-text-tertiary">
                {topic.depth}
              </span>
            </div>
          </div>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-text-tertiary transition-transform duration-200',
              expanded && 'rotate-180'
            )}
          />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border-primary">
              <p className="text-sm text-text-secondary leading-relaxed mt-3">{topic.content}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Analogy Card ──────────────────────────────────────────────────
function AnalogyCard({ name, data }: { name: string; data: any }) {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="bg-bg-secondary rounded-2xl border border-border-primary overflow-hidden card-premium">
      <div className="p-5 border-b border-border-primary">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{data.emoji}</span>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Explain RAG Like a {name}</h3>
            <p className="text-xs text-text-tertiary">Click each step to see the analogy</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Step Indicators */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {data.steps.map((step: any, i: number) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all btn-premium',
                activeStep === i
                  ? 'bg-accent-primary text-white glow-sm'
                  : 'bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              )}
            >
              <span>{step.icon}</span>
              <span>{step.name}</span>
            </button>
          ))}
        </div>

        {/* Active Step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-bg-tertiary rounded-xl p-5"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">{data.steps[activeStep].icon}</div>
              <div>
                <h4 className="text-base font-semibold text-text-primary mb-2">
                  Step {activeStep + 1}: {data.steps[activeStep].name}
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {data.steps[activeStep].explanation}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-4 flex gap-1">
              {data.steps.map((_: any, i: number) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-all duration-500',
                    i <= activeStep ? 'bg-accent-primary' : 'bg-bg-elevated'
                  )}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-4">
          <button
            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
            disabled={activeStep === 0}
            className="px-4 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-elevated hover:bg-bg-hover transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <button
            onClick={() => setActiveStep(Math.min(data.steps.length - 1, activeStep + 1))}
            disabled={activeStep === data.steps.length - 1}
            className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-accent-primary hover:bg-accent-dim transition-all disabled:opacity-30 disabled:cursor-not-allowed btn-premium"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Hero Section ──────────────────────────────────────────────────
function HeroSection() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);

  return (
    <motion.section
      style={{ opacity, scale }}
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
    >
      {/* Background Effects */}
      <ParticleBackground />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-accent-primary/3 rounded-full blur-[150px]" />

        {/* Animated Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
            animation: 'grid-pulse 8s ease-in-out infinite',
          }}
        />

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#06060b_70%)]" />
      </div>

      <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent-glow border border-accent-primary/20 mb-8 glow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
          <span className="text-xs font-medium text-accent-secondary">The Blender for RAG</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-primary/20 text-accent-primary font-semibold">v1.0</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-[1.05]"
        >
          <span className="text-text-primary">RAG Studio</span>
          <br />
          <span className="gradient-text-hero">Pro</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto mb-4 font-light"
        >
          Understand. Build. Visualize. Optimize.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="text-sm text-text-tertiary max-w-xl mx-auto mb-12 leading-relaxed"
        >
          The world's most interactive platform to learn, build, and master Retrieval-Augmented Generation.
          Every invisible stage made visible.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center gap-4 flex-wrap"
        >
          <button
            onClick={() => navigate('/learn')}
            className="group flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-dim text-white font-semibold text-sm transition-all duration-300 hover:shadow-xl hover:shadow-accent-primary/30 btn-premium glow-md"
          >
            <BookOpen className="w-4 h-4" />
            Start Learning
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => navigate('/builder')}
            className="group flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/30 btn-premium glow-md"
          >
            <Wrench className="w-4 h-4" />
            Start Building
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => navigate('/playground')}
            className="group flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-bg-elevated border border-border-secondary text-text-primary font-semibold text-sm transition-all duration-300 hover:bg-bg-hover hover:border-border-accent btn-premium"
          >
            <Play className="w-4 h-4" />
            Playground
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center gap-10 mt-16"
        >
          {[
            { label: 'RAG Topics', value: '30+' },
            { label: 'Analogies', value: '10+' },
            { label: 'Interactive Tools', value: '6' },
            { label: 'Vector DBs', value: '6' },
          ].map((stat) => (
            <div key={stat.label} className="text-center group">
              <div className="text-2xl font-bold gradient-text">{stat.value}</div>
              <div className="text-[11px] text-text-tertiary mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-primary to-transparent" />
    </motion.section>
  );
}

// ─── RAG Pipeline Visual ──────────────────────────────────────────
function PipelineVisual() {
  const steps = [
    { icon: FileText, label: 'Ingest', desc: 'Parse documents', color: 'from-blue-500 to-cyan-500' },
    { icon: Layers, label: 'Chunk', desc: 'Split text', color: 'from-cyan-500 to-teal-500' },
    { icon: Brain, label: 'Embed', desc: 'Vectorize text', color: 'from-teal-500 to-emerald-500' },
    { icon: Database, label: 'Store', desc: 'Save vectors', color: 'from-emerald-500 to-green-500' },
    { icon: Search, label: 'Retrieve', desc: 'Find relevant', color: 'from-green-500 to-lime-500' },
    { icon: MessageSquare, label: 'Generate', desc: 'Create answer', color: 'from-lime-500 to-yellow-500' },
  ];

  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            The RAG <span className="gradient-text">Pipeline</span>
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto text-base">
            Every step from document to answer — made visible and interactive
          </p>
        </motion.div>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -4 }}
                className={cn(
                  'flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-bg-secondary border border-border-primary cursor-pointer card-premium',
                  'hover:border-border-accent transition-all duration-300 group'
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br transition-transform duration-300 group-hover:scale-110',
                  step.color
                )}>
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold text-text-primary">{step.label}</div>
                  <div className="text-[10px] text-text-tertiary">{step.desc}</div>
                </div>
              </motion.div>
              {i < steps.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.05 }}
                >
                  <ArrowRight className="w-5 h-5 text-text-muted shrink-0" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Spotlight Mouse Handler ─────────────────────────────────────
function handleSpotlightMouseMove(e: React.MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
  e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
}

// ─── Feature Highlights ───────────────────────────────────────────
function FeatureHighlights() {
  const features = [
    {
      icon: BookOpen,
      title: 'Interactive Learning',
      description: 'Chunking simulators, embedding visualizers, and cosine similarity explorers make every concept tangible.',
      color: 'from-violet-500 to-purple-600',
    },
    {
      icon: Wrench,
      title: 'Real RAG Builder',
      description: 'Upload documents, configure pipelines, choose models, and build production-ready RAG systems.',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description: 'Precision, recall, F1, latency tracking, and system resource monitoring in real-time.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Cpu,
      title: 'Model Manager',
      description: 'Download, switch, and benchmark LLM and embedding models locally with Ollama integration.',
      color: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Everything you need to <span className="gradient-text">master RAG</span>
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto text-base">
            From learning concepts to building production pipelines
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              onMouseMove={handleSpotlightMouseMove}
              className="bg-bg-secondary rounded-2xl border border-border-primary p-6 card-premium spotlight group"
            >
              <div className="relative z-10">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br mb-4 transition-transform duration-300 group-hover:scale-110',
                  feature.color
                )}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────
export default function LandingPage() {
  const [selectedAnalogy, setSelectedAnalogy] = useState('Cricket Match');
  const [analogyDropdownOpen, setAnalogyDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAnalogyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <HeroSection />

      {/* Pipeline Visual */}
      <PipelineVisual />

      {/* Feature Highlights */}
      <FeatureHighlights />

      {/* RAG Explained Like Section */}
      <section className="py-24 px-6" id="analogies">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Explain RAG <span className="gradient-text">Like...</span>
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto text-base">
              Choose any analogy and see how RAG works through that lens
            </p>
          </motion.div>

          {/* Analogy Selector */}
          <div className="flex justify-center mb-10">
            <div ref={dropdownRef} className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setAnalogyDropdownOpen(!analogyDropdownOpen)}
                className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-bg-secondary border border-border-secondary hover:border-border-accent transition-all text-text-primary btn-premium glow-sm"
              >
                <span className="text-xl">{analogies[selectedAnalogy]?.emoji}</span>
                <span className="font-semibold">{selectedAnalogy}</span>
                <ChevronDown className={cn(
                  'w-4 h-4 text-text-tertiary transition-transform duration-200',
                  analogyDropdownOpen && 'rotate-180'
                )} />
              </motion.button>

              <AnimatePresence>
                {analogyDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 bg-bg-secondary border border-border-secondary rounded-2xl shadow-2xl overflow-hidden z-50 glass-strong"
                  >
                    <div className="p-2 max-h-80 overflow-y-auto">
                      {Object.entries(analogies).map(([name, data]) => (
                        <button
                          key={name}
                          onClick={() => {
                            setSelectedAnalogy(name);
                            setAnalogyDropdownOpen(false);
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
                            selectedAnalogy === name
                              ? 'bg-accent-glow text-accent-secondary'
                              : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                          )}
                        >
                          <span className="text-xl">{data.emoji}</span>
                          <span className="text-sm font-medium">{name}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Active Analogy */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedAnalogy}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AnalogyCard name={selectedAnalogy} data={analogies[selectedAnalogy]} />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* RAG Topics Grid */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Complete RAG <span className="gradient-text">Knowledge Base</span>
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto text-base">
              Every concept from AI foundations to advanced RAG techniques — click to explore
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ragTopics.map((category, ci) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: ci * 0.1, duration: 0.5 }}
                className="bg-bg-secondary rounded-2xl border border-border-primary overflow-hidden card-premium"
              >
                <div className="p-4 border-b border-border-primary">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br',
                      category.color
                    )}>
                      <category.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary">{category.category}</h3>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  {category.items.map((topic, i) => (
                    <TopicCard key={topic.name} topic={topic} index={i} onMouseMove={handleSpotlightMouseMove} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-border-primary">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2.5 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-dim flex items-center justify-center glow-sm">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-bold text-text-primary">RAG Studio Pro</span>
          </div>
          <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">
            Built for everyone learning RAG. Understand. Build. Visualize. Optimize.
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-text-muted">
            <span>Open Source</span>
            <span>•</span>
            <span>MIT License</span>
            <span>•</span>
            <span>Built with ❤️</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
