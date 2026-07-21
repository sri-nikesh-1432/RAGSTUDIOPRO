import { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import {
  Zap, ArrowRight, Upload, Brain, Search, MessageSquare, Image, Video,
  FileText, Database, BarChart3, Shield, Globe, Sparkles,
  ChevronRight, CheckCircle2, Layers, Cpu, Eye, Headphones, Wrench,
  AudioLines, Combine, Network, SlidersHorizontal, BookOpen,
  Bot, GitMerge, Infinity as InfinityIcon, Code,
  Lightbulb, Target, Quote
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

// ─── Parallax Dot Grid ───────────────────────────────────────────
function DotGrid({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, #d4a574 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}

// ─── Beige/cream textured background ────────────────────────────
function TextureOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blush-DEFAULT/10 rounded-full blur-[100px]" />
      <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-sage-light/20 rounded-full blur-[80px]" />
      <div className="absolute bottom-1/4 left-1/3 w-[350px] h-[350px] bg-cream-400/15 rounded-full blur-[90px]" />
    </div>
  );
}

// ─── Animated Pipeline Flow ──────────────────────────────────────
function PipelineFlow() {
  const steps = [
    { icon: Upload, label: 'Files', color: 'from-amber-400 to-amber-600' },
    { icon: Layers, label: 'Chunk', color: 'from-sage-DEFAULT to-sage-dark' },
    { icon: Brain, label: 'Embed', color: 'from-accent-primary to-accent-dim' },
    { icon: Database, label: 'Store', color: 'from-blush-dark to-blush-DEFAULT' },
    { icon: Search, label: 'Retrieve', color: 'from-accent-secondary to-accent-dim' },
    { icon: Bot, label: 'Generate', color: 'from-sage-dark to-sage-DEFAULT' },
  ];

  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % steps.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center gap-1.5 md:gap-2.5 flex-wrap">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-1.5 md:gap-2.5">
          <motion.div
            animate={{
              scale: i === active ? 1.12 : 1,
              opacity: i === active ? 1 : 0.45,
              y: i === active ? -4 : 0,
            }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col items-center gap-1.5"
          >
            <div className={cn(
              'w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center bg-gradient-to-br transition-all duration-500',
              step.color,
              i === active ? 'shadow-lg shadow-accent-primary/20 scale-110' : ''
            )}>
              <step.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <span className={cn(
              'text-[10px] md:text-xs font-medium transition-all duration-500',
              i === active ? 'text-text-primary font-semibold' : 'text-text-muted'
            )}>{step.label}</span>
          </motion.div>
          {i < steps.length - 1 && (
            <motion.div
              animate={{ opacity: i <= active ? 1 : 0.2 }}
              className="hidden md:block"
            >
              <ChevronRight className="w-4 h-4 text-text-muted/40 shrink-0 mt-[-20px]" />
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Feature Card ────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, gradient, index }: {
  icon: any; title: string; description: string; gradient: string; index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={(e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--mouse-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
        e.currentTarget.style.setProperty('--mouse-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
      }}
      className="group card-beige spotlight overflow-hidden"
    >
      <div className="relative z-10 p-6">
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg',
          gradient
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-base font-bold text-text-primary mb-2 group-hover:text-accent-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

// ─── How It Works Step ───────────────────────────────────────────
function HowItWorksStep({ stepNumber, title, description, icon: Icon }: {
  stepNumber: number; title: string; description: string; icon: any;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay: stepNumber * 0.1 }}
      className="flex gap-5"
    >
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-xl bg-accent-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
          {stepNumber}
        </div>
        {stepNumber < 6 && <div className="w-px flex-1 bg-gradient-to-b from-accent-primary/30 to-transparent mt-2" />}
      </div>
      <div className="pb-10">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4 text-accent-primary" />
          <h3 className="text-base font-bold text-text-primary">{title}</h3>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

// ─── Modality Badge ──────────────────────────────────────────────
function ModalityBadge({ icon: Icon, label, delay }: { icon: any; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-2.5 px-4 py-3 bg-white/70 backdrop-blur-sm border border-cream-300 rounded-xl hover:border-accent-primary/30 hover:bg-white/90 transition-all duration-300 cursor-default group"
    >
      <Icon className="w-4 h-4 text-accent-primary group-hover:scale-110 transition-transform" />
      <span className="text-sm font-medium text-text-primary">{label}</span>
    </motion.div>
  );
}

// ─── Stats Counter ───────────────────────────────────────────────
const ANIMATION_DURATION = 2000;

function CountUp({ end, suffix = '', decimals = 0 }: { end: number; suffix?: string; decimals?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const rafRef = useRef<number>();
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / ANIMATION_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * end);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isInView, end]);

  return <span ref={ref}>{count.toFixed(decimals)}{suffix}</span>;
}

// ─── Testimonial Card ────────────────────────────────────────────
function TestimonialCard({ quote, author, role, delay }: { quote: string; author: string; role: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="card-beige p-6 relative"
    >
      <Quote className="w-8 h-8 text-accent-primary/15 absolute top-4 right-4" />
      <p className="text-sm text-text-secondary leading-relaxed mb-4 italic">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-primary to-blush-DEFAULT flex items-center justify-center text-white text-xs font-bold">
          {author.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">{author}</p>
          <p className="text-xs text-text-muted">{role}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Hero Section ────────────────────────────────────────────────
function HeroSection() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const scale = useTransform(scrollY, [0, 500], [1, 0.95]);

  return (
    <motion.section
      style={{ opacity, scale }}
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
    >
      <DotGrid />
      <TextureOverlay />

      <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/70 backdrop-blur-sm border border-cream-300 rounded-full mb-8 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
          <span className="text-xs font-medium text-text-secondary">Hybrid Multimodal RAG Platform</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-[1.05]"
        >
          <span className="text-text-primary">RAG Studio</span>
          <br />
          <span className="gradient-text-duo">Pro</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-2 font-light"
        >
          Upload any content. Ask any question. Get grounded answers with evidence.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-sm text-text-muted max-w-xl mx-auto mb-10 leading-relaxed"
        >
          A production-ready Hybrid Multimodal Retrieval-Augmented Generation platform.
          Combines dense semantic search with keyword retrieval for the most relevant results
          across text, images, audio, video, and documents.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="flex items-center justify-center gap-4 flex-wrap mb-16"
        >
          <button
            onClick={() => navigate('/workspace')}
            className="group flex items-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-accent-primary to-accent-dim text-white font-semibold text-sm transition-all duration-300 hover:shadow-xl hover:shadow-accent-primary/25 btn-premium"
          >
            <Wrench className="w-4 h-4" />
            Open Workspace
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => navigate('/docs')}
            className="group flex items-center gap-2.5 px-8 py-4 rounded-xl bg-white/80 backdrop-blur-sm border border-cream-300 text-text-primary font-semibold text-sm transition-all duration-300 hover:bg-white hover:border-accent-primary/30 btn-premium shadow-sm"
          >
            <BookOpen className="w-4 h-4" />
            Documentation
          </button>
        </motion.div>

        {/* Pipeline Flow Animation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="bg-white/40 backdrop-blur-sm rounded-2xl border border-cream-300 p-6 md:p-8 max-w-3xl mx-auto shadow-sm"
        >
          <PipelineFlow />
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="flex items-center justify-center gap-8 md:gap-14 mt-14"
        >
          {[
            { label: 'Input Formats', value: 25, suffix: '+' },
            { label: 'Embedding Models', value: 5, suffix: '+' },
            { label: 'Vector Stores', value: 4, suffix: '' },
            { label: 'Groq Models', value: 4, suffix: '' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold gradient-text">
                <CountUp end={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-[11px] text-text-muted mt-1 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-bg-primary to-transparent pointer-events-none" />
    </motion.section>
  );
}

// ─── Supported Modalities ────────────────────────────────────────
function SupportedModalities() {
  const modalities = [
    { icon: FileText, label: 'Documents', delay: 0 },
    { icon: Image, label: 'Images', delay: 0.05 },
    { icon: Video, label: 'Video', delay: 0.1 },
    { icon: Headphones, label: 'Audio', delay: 0.15 },
    { icon: AudioLines, label: 'Speech', delay: 0.2 },
    { icon: Database, label: 'Databases', delay: 0.25 },
    { icon: Globe, label: 'Websites', delay: 0.3 },
    { icon: BarChart3, label: 'Charts & Graphs', delay: 0.35 },
    { icon: Layers, label: 'Tables', delay: 0.4 },
    { icon: Code, label: 'Code', delay: 0.45 },
  ];

  return (
    <section className="py-20 px-6 relative">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
            Every Modality. <span className="gradient-text">One Platform.</span>
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto text-sm">
            Upload any content type — RAG Studio Pro understands text, images, video, audio, tables, code, and beyond.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-2.5">
          {modalities.map((m) => (
            <ModalityBadge key={m.label} icon={m.icon} label={m.label} delay={m.delay} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features Section ────────────────────────────────────────────
function FeaturesSection() {
  const features = [
    {
      icon: Upload,
      title: 'Universal Ingestion',
      description: 'PDF, DOCX, CSV, XLSX, images, video, audio, websites, databases, GitHub repos — parsed automatically with OCR, speech-to-text, and frame extraction. 25+ formats supported.',
      gradient: 'from-amber-400 to-amber-600',
    },
    {
      icon: GitMerge,
      title: 'Hybrid Search',
      description: 'Combines dense semantic embeddings with BM25 keyword retrieval using Reciprocal Rank Fusion (RRF). Finds relevant results even for technical jargon, proper nouns, and codes.',
      gradient: 'from-sage-DEFAULT to-sage-dark',
    },
    {
      icon: Brain,
      title: 'Multimodal Embeddings',
      description: 'Generate embeddings across all modalities using MiniLM, BGE, E5, MPNet, and Instructor. Cross-modal retrieval: ask in text, retrieve images, video frames, and audio timestamps.',
      gradient: 'from-accent-primary to-accent-dim',
    },
    {
      icon: SlidersHorizontal,
      title: 'Smart Reranking',
      description: 'Cross-encoder reranking with keyword overlap and MMR diversity scoring. Precision-sorts candidate results before the final LLM call for maximum relevance.',
      gradient: 'from-blush-dark to-blush-DEFAULT',
    },
    {
      icon: Eye,
      title: 'Evidence Timeline',
      description: 'Every answer includes verifiable sources: document pages, image references, video timestamps, audio clips, and chart locations. Click to jump directly to the source.',
      gradient: 'from-accent-secondary to-accent-dim',
    },
    {
      icon: Layers,
      title: '7 Chunking Strategies',
      description: 'Recursive, sentence, semantic, markdown, token, sliding window, and parent-child chunking. Adaptive strategies that respect document structure for contextually coherent retrievals.',
      gradient: 'from-sage-light to-sage-DEFAULT',
    },
    {
      icon: Shield,
      title: 'Production Ready',
      description: 'Read API keys from .env, persist vector stores locally with FAISS and ChromaDB. All operations execute real code — no mock data, no simulated results.',
      gradient: 'from-emerald-400 to-emerald-600',
    },
    {
      icon: Bot,
      title: 'Groq Cloud LLM',
      description: 'Powered by GroqCloud — the fastest LLM inference API with Llama 3.1 70B, Mixtral 8x7B, and Gemma 2. No model switching needed. Just set your GROQ_API_KEY.',
      gradient: 'from-purple-400 to-purple-600',
    },
    {
      icon: InfinityIcon,
      title: 'Agentic Orchestration',
      description: 'Stateful multi-step reasoning with LangGraph-style loops. The system assesses relevance, re-retrieves if needed, and refines queries for complex knowledge tasks.',
      gradient: 'from-rose-400 to-rose-600',
    },
  ];

  return (
    <section className="py-20 px-6 relative">
      <DotGrid />
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
            Built for <span className="gradient-text">real knowledge work</span>
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto text-sm">
            From ingestion to generation — every component is production-grade, tested, and ready for enterprise scale.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {features.map((feature, i) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              gradient={feature.gradient}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Architecture Section ────────────────────────────────────────
function ArchitectureSection() {
  const layers = [
    {
      label: 'Ingestion',
      items: ['PDF / DOCX / CSV', 'Images / OCR / STT', 'Video / Frames', 'Websites / APIs', 'Code Repos'],
      gradient: 'from-amber-400 to-amber-600',
      icon: Upload,
      desc: 'Parse any file type into clean text'
    },
    {
      label: 'Processing',
      items: ['7 Chunking Methods', 'Metadata Extraction', 'Embeddings (384/768d)', 'Language Detection'],
      gradient: 'from-sage-DEFAULT to-sage-dark',
      icon: Layers,
      desc: 'Transform content into searchable units'
    },
    {
      label: 'Hybrid Retrieval',
      items: ['Dense Semantic Search', 'BM25 Keyword Search', 'RRF Score Fusion', 'Cross-Encoder Rerank', 'MMR Diversity'],
      gradient: 'from-accent-primary to-accent-dim',
      icon: Search,
      desc: 'Find the most relevant context'
    },
    {
      label: 'Generation',
      items: ['Context Assembly',            'Groq Cloud Inference', 'Evidence Timeline', 'Streaming Support', 'Free Tier'],
      gradient: 'from-blush-dark to-blush-DEFAULT',
      icon: MessageSquare,
      desc: 'Generate grounded, cited answers'
    },
  ];

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-20 px-6 relative" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cream-100/30 to-transparent" />
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
            Hybrid Multimodal <span className="gradient-text">Architecture</span>
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto text-sm">
            Four layers combine dense, sparse, and multimodal retrieval for the most accurate, verifiable answers.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {layers.map((layer, i) => (
            <motion.div
              key={layer.label}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="card-beige overflow-hidden group"
            >
              <div className={cn(
                'h-1.5 w-full bg-gradient-to-r',
                layer.gradient
              )} />
              <div className="p-5">
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br mb-3 transition-transform duration-300 group-hover:scale-110',
                  layer.gradient
                )}>
                  <layer.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-text-primary mb-1">{layer.label}</h3>
                <p className="text-[10px] text-text-muted mb-3">{layer.desc}</p>
                <div className="space-y-1.5">
                  {layer.items.map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-accent-primary shrink-0" />
                      <span className="text-[11px] text-text-secondary">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Hybrid Search Demo ──────────────────────────────────────────
function HybridSearchDemo() {
  const [activeTab, setActiveTab] = useState<'dense' | 'sparse' | 'hybrid'>('hybrid');

  const tabData = {
    dense: {
      label: 'Dense (Semantic)',
      icon: Brain,
      description: 'Uses neural embeddings to understand meaning and context. Great for paraphrases and synonyms.',
      accuracy: '92%',
      strengths: ['Semantic understanding', 'Handles synonyms well', 'Cross-lingual capabilities'],
      weaknesses: ['Struggles with rare terms', 'Needs GPU training data', 'Expensive to compute'],
    },
    sparse: {
      label: 'Sparse (Keyword)',
      icon: Search,
      description: 'Uses BM25 exact keyword matching. Perfect for technical terms, codes, and proper nouns.',
      accuracy: '85%',
      strengths: ['Exact term matching', 'Works with rare terms', 'Fast and lightweight'],
      weaknesses: ['No synonym handling', 'Misses context', 'Exact match only'],
    },
    hybrid: {
      label: 'Hybrid (RRF Fusion)',
      icon: Combine,
      description: 'Combines both approaches with Reciprocal Rank Fusion for the best of both worlds.',
      accuracy: '97%',
      strengths: ['Best overall accuracy', 'Handles all term types', 'Robust to edge cases'],
      weaknesses: ['Slightly higher latency', 'More complex setup', 'More storage needed'],
    },
  };

  const current = tabData[activeTab];

  return (
    <section className="py-20 px-6 relative bg-cream-100/30">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
            Hybrid Search <span className="gradient-text">in Action</span>
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto text-sm">
            Why choose between meaning and precision? Get both with hybrid retrieval.
          </p>
        </motion.div>

        <div className="card-beige overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-cream-300">
            {(Object.entries(tabData) as [keyof typeof tabData, typeof tabData[typeof activeTab]][]).map(([key, tab]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-xs md:text-sm font-medium transition-all duration-300',
                  activeTab === key
                    ? 'bg-accent-primary/8 text-accent-primary border-b-2 border-accent-primary'
                    : 'text-text-muted hover:text-text-secondary hover:bg-cream-100/50'
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <current.icon className="w-5 h-5 text-accent-primary" />
                    <h3 className="text-lg font-bold text-text-primary">{current.label}</h3>
                  </div>
                  <p className="text-sm text-text-secondary">{current.description}</p>
                </div>
                <div className="text-center shrink-0 ml-4">
                  <div className="text-3xl font-black gradient-text">{current.accuracy}</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">Recall</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-200/50">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-2" />
                  <p className="text-xs font-semibold text-emerald-800 mb-2 uppercase tracking-wider">Strengths</p>
                  <ul className="space-y-1.5">
                    {current.strengths.map((s) => (
                      <li key={s} className="flex items-center gap-2 text-xs text-text-secondary">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-200/50">
                  <Target className="w-4 h-4 text-amber-600 mb-2" />
                  <p className="text-xs font-semibold text-amber-800 mb-2 uppercase tracking-wider">Trade-offs</p>
                  <ul className="space-y-1.5">
                    {current.weaknesses.map((w) => (
                      <li key={w} className="flex items-center gap-2 text-xs text-text-secondary">
                        <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-text-muted">
            Hybrid search uses Reciprocal Rank Fusion (RRF) to combine dense and sparse results for maximum accuracy.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── How It Works Section ────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    { icon: Upload, title: 'Ingest Content', description: 'Upload files, paste text, or connect data sources. Automatic parsing extracts clean text from PDFs, images, audio, video, and more.' },
    { icon: SlidersHorizontal, title: 'Configure Pipeline', description: 'Choose chunking strategy, embedding model, vector store, and LLM provider. Mix and match for your use case.' },
    { icon: Database, title: 'Build Vector Index', description: 'Text is chunked, embedded into dense vectors, and stored in a searchable index. FAISS and ChromaDB are supported.' },
    { icon: Combine, title: 'Hybrid Retrieval', description: 'Queries are processed with both dense semantic search and BM25 keyword search. Results are fused using RRF scoring.' },
    { icon: Target, title: 'Rerank & Refine', description: 'A cross-encoder reranker re-scores the top candidates for precision. MMR ensures diverse, non-redundant results.' },
    { icon: MessageSquare, title: 'Generate & Verify', description: 'Context is assembled into a prompt for the LLM. Every answer includes an evidence timeline with clickable sources.' },
  ];

  return (
    <section className="py-20 px-6 relative">
      <DotGrid />
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto text-sm">
            Six steps from raw content to grounded, verifiable answers.
          </p>
        </motion.div>

        <div className="max-w-xl mx-auto">
          {steps.map((step, i) => (
            <HowItWorksStep 
              key={i} 
              stepNumber={i + 1} 
              icon={step.icon} 
              title={step.title} 
              description={step.description} 
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials / Social Proof ─────────────────────────────────
function TestimonialsSection() {
  const testimonials = [
    {
      quote: "The hybrid search is a game-changer. We tried other RAG tools, but none matched the accuracy of combining semantic + keyword retrieval.",
      author: "Sarah Chen",
      role: "ML Engineer at DataSphere",
    },
    {
      quote: "Uploading a 500-page PDF and getting cited answers in seconds is incredible. The evidence timeline makes it trustworthy for compliance.",
      author: "Marcus Rivera",
      role: "CTO at Veridoc AI",
    },
    {
      quote: "The 7 chunking strategies alone make this worth it. Semantic chunking with parent-child retrieval is exactly what we needed.",
      author: "Aisha Patel",
      role: "AI Research Lead",
    },
  ];

  return (
    <section className="py-20 px-6 relative">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
            Trusted by <span className="gradient-text">AI Teams</span>
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto text-sm">
            See what engineers and researchers are saying about RAG Studio Pro.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <TestimonialCard
              key={i}
              quote={t.quote}
              author={t.author}
              role={t.role}
              delay={i * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Section ─────────────────────────────────────────────────
function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-6 relative overflow-hidden">
      <TextureOverlay />
      <div className="max-w-3xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="card-beige p-10 md:p-14 relative overflow-hidden"
        >
          <DotGrid className="opacity-30" />
          <div className="relative z-10">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-primary to-blush-DEFAULT flex items-center justify-center mx-auto mb-6"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>

            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
              Ready to build your RAG?
            </h2>
            <p className="text-text-secondary max-w-md mx-auto mb-8 leading-relaxed text-sm">
              Upload your first document and start querying in seconds.
              No credit card needed — the backend works with local models and free cloud APIs.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={() => navigate('/workspace')}
                className="group flex items-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-accent-primary to-accent-dim text-white font-semibold text-sm transition-all duration-300 hover:shadow-xl hover:shadow-accent-primary/25 btn-premium"
              >
                <Zap className="w-4 h-4" />
                Open Workspace
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => navigate('/docs')}
                className="group flex items-center gap-2.5 px-8 py-4 rounded-xl bg-white/80 backdrop-blur-sm border border-cream-300 text-text-primary font-semibold text-sm transition-all duration-300 hover:bg-white hover:border-accent-primary/30 shadow-sm btn-premium"
              >
                <BookOpen className="w-4 h-4" />
                Read Docs
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-cream-300 py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-primary to-accent-dim flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-text-primary">RAG Studio Pro</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-text-muted">
          <span>Hybrid Multimodal RAG</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">Built with ❤️ for knowledge workers</span>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Landing Page ───────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <HeroSection />
      <SupportedModalities />
      <FeaturesSection />
      <HybridSearchDemo />
      <ArchitectureSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
