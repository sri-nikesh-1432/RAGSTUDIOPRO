import { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Zap, ArrowRight, Upload, Brain, Search, MessageSquare, Image, Video,
  FileText, Database, BarChart3, Shield, Globe, Sparkles,
  ChevronRight, CheckCircle2, Layers, Cpu, Eye, Headphones, Wrench
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

// ─── Workflow Animation ──────────────────────────────────────────
function WorkflowAnimation() {
  const steps = [
    { icon: Upload, label: 'Upload', color: 'from-amber-600 to-amber-800' },
    { icon: Brain, label: 'Understand', color: 'from-rose-500 to-rose-700' },
    { icon: Search, label: 'Retrieve', color: 'from-teal-500 to-teal-700' },
    { icon: Cpu, label: 'Reason', color: 'from-indigo-400 to-indigo-600' },
    { icon: MessageSquare, label: 'Output', color: 'from-emerald-500 to-emerald-700' },
  ];

  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 md:gap-3">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-2 md:gap-3">
          <motion.div
            animate={{
              scale: i === active ? 1.1 : 1,
              opacity: i === active ? 1 : 0.5,
            }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col items-center gap-2"
          >
            <div className={cn(
              'w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br transition-all duration-500',
              step.color,
              i === active ? 'shadow-lg shadow-black/10' : ''
            )}>
              <step.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <span className={cn(
              'text-xs font-medium transition-all duration-500',
              i === active ? 'text-text-primary' : 'text-text-muted'
            )}>{step.label}</span>
          </motion.div>
          {i < steps.length - 1 && (
            <ChevronRight className="w-4 h-4 text-text-muted/40 shrink-0 mt-[-20px]" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Feature Card ────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, color, index }: {
  icon: any; title: string; description: string; color: string; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="bg-bg-secondary rounded-2xl border border-border-primary p-6 card-premium group"
    >
      <div className={cn(
        'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br mb-4 transition-transform duration-300 group-hover:scale-110',
        color
      )}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </motion.div>
  );
}

// ─── Modality Badge ──────────────────────────────────────────────
function ModalityBadge({ icon: Icon, label, delay }: { icon: any; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center gap-2 px-4 py-2.5 bg-bg-secondary border border-border-primary rounded-xl"
    >
      <Icon className="w-4 h-4 text-accent-primary" />
      <span className="text-sm font-medium text-text-primary">{label}</span>
    </motion.div>
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

// ─── Hero Section ────────────────────────────────────────────────
function HeroSection() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const scale = useTransform(scrollY, [0, 400], [1, 0.96]);

  return (
    <motion.section
      style={{ opacity, scale }}
      className="relative min-h-[92vh] flex items-center justify-center overflow-hidden"
    >
      {/* Subtle Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-accent-primary/4 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-rose-gold/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'linear-gradient(rgba(176,125,86,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(176,125,86,0.3) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          animation: 'grid-pulse 8s ease-in-out infinite',
        }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#fefcf8_75%)]" />
      </div>

      <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-bg-secondary border border-border-primary rounded-full mb-8"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
          <span className="text-xs font-medium text-text-secondary">Multimodal AI Knowledge Platform</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]"
        >
          <span className="text-text-primary">RAG Studio</span>
          <br />
          <span className="gradient-text-hero">Pro</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto mb-4 font-light"
        >
          Upload any content. Ask any question. Get the answer.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-sm text-text-tertiary max-w-xl mx-auto mb-12 leading-relaxed"
        >
          A production-ready Multimodal Retrieval-Augmented Generation platform.
          Process text, images, video, audio, and documents — retrieve evidence across all modalities.
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
            className="group flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-dim text-white font-semibold text-sm transition-all duration-300 hover:shadow-xl hover:shadow-accent-primary/20 btn-premium"
          >
            <Wrench className="w-4 h-4" />
            Open Workspace
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => navigate('/docs')}
            className="group flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-bg-secondary border border-border-primary text-text-primary font-semibold text-sm transition-all duration-300 hover:bg-bg-hover hover:border-border-secondary btn-premium"
          >
            <FileText className="w-4 h-4" />
            Documentation
          </button>
        </motion.div>

        {/* Workflow Animation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
        >
          <WorkflowAnimation />
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="flex items-center justify-center gap-10 mt-16"
        >
          {[
            { label: 'Input Formats', value: '25+' },
            { label: 'Embedding Models', value: '10+' },
            { label: 'Vector Stores', value: '3' },
            { label: 'LLM Providers', value: '8' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold gradient-text">{stat.value}</div>
              <div className="text-[11px] text-text-tertiary mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-primary to-transparent" />
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
    { icon: Database, label: 'Databases', delay: 0.2 },
    { icon: Globe, label: 'Websites', delay: 0.25 },
    { icon: BarChart3, label: 'Charts & Graphs', delay: 0.3 },
    { icon: Layers, label: 'Tables', delay: 0.35 },
  ];

  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Every modality. <span className="gradient-text">One platform.</span>
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto text-base">
            Upload any content type — RAG Studio Pro understands text, images, video, audio, and beyond.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
      description: 'PDF, DOCX, CSV, XLSX, images, video, audio, websites, databases, GitHub repos — parsed automatically with OCR, speech-to-text, and frame extraction.',
      color: 'from-amber-600 to-amber-800',
    },
    {
      icon: Brain,
      title: 'Multimodal Embeddings',
      description: 'Generate embeddings across all modalities using CLIP, SigLIP, Sentence Transformers, BGE, and more. Store everything in one vector database.',
      color: 'from-rose-500 to-rose-700',
    },
    {
      icon: Search,
      title: 'Cross-Modal Retrieval',
      description: 'Ask a question in text, retrieve relevant images, video frames, audio timestamps, chart data, and document pages — all at once.',
      color: 'from-teal-500 to-teal-700',
    },
    {
      icon: Eye,
      title: 'Evidence Timeline',
      description: 'Every answer includes verifiable sources: document pages, image references, video timestamps, audio clips, chart locations. Click to jump directly.',
      color: 'from-indigo-400 to-indigo-600',
    },
    {
      icon: Shield,
      title: 'Production Ready',
      description: 'Read API keys from .env, persist vector stores locally, support FAISS and ChromaDB. No mock data — every operation executes real code.',
      color: 'from-emerald-500 to-emerald-700',
    },
    {
      icon: Cpu,
      title: 'Multi-Provider LLMs',
      description: 'Groq, OpenAI, Anthropic, Google, Ollama, DeepSeek, Qwen, Mistral — configurable via environment. Switch providers without code changes.',
      color: 'from-purple-500 to-purple-700',
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
            Built for <span className="gradient-text">real knowledge work</span>
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto text-base">
            From ingestion to generation — every step is production-grade.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
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
                <h3 className="text-base font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Architecture Section ────────────────────────────────────────
function ArchitectureSection() {
  const layers = [
    { label: 'Ingestion', items: ['PDF / DOCX / CSV', 'Images / OCR', 'Video / Frames', 'Audio / STT'], color: 'from-amber-600 to-amber-800' },
    { label: 'Processing', items: ['Chunking', 'Embeddings', 'Metadata', 'Vector Store'], color: 'from-rose-500 to-rose-700' },
    { label: 'Retrieval', items: ['Semantic Search', 'Hybrid Search', 'Cross-Modal', 'Reranking'], color: 'from-teal-500 to-teal-700' },
    { label: 'Generation', items: ['Context Assembly', 'LLM Provider', 'Evidence Timeline', 'Streaming'], color: 'from-indigo-400 to-indigo-600' },
  ];

  return (
    <section className="py-24 px-6 relative bg-bg-secondary/50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            The <span className="gradient-text">architecture</span>
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto text-base">
            Four layers, zero compromises. Every component is real, testable, and production-ready.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {layers.map((layer, i) => (
            <motion.div
              key={layer.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-bg-elevated rounded-2xl border border-border-primary p-5"
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br mb-3',
                layer.color
              )}>
                <span className="text-white text-sm font-bold">{i + 1}</span>
              </div>
              <h3 className="text-sm font-semibold text-text-primary mb-3">{layer.label}</h3>
              <div className="space-y-2">
                {layer.items.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-accent-primary shrink-0" />
                    <span className="text-xs text-text-secondary">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
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
    <section className="py-24 px-6 relative">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="bg-bg-secondary rounded-3xl border border-border-primary p-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Ready to build?
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto mb-8 leading-relaxed">
            Upload your first document and start querying in seconds.
            No API keys required — the backend reads from environment configuration.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => navigate('/workspace')}
              className="group flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-dim text-white font-semibold text-sm transition-all duration-300 hover:shadow-xl hover:shadow-accent-primary/20 btn-premium"
            >
              <Zap className="w-4 h-4" />
              Open Workspace
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => navigate('/docs')}
              className="group flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-bg-elevated border border-border-primary text-text-primary font-semibold text-sm transition-all duration-300 hover:bg-bg-hover btn-premium"
            >
              <FileText className="w-4 h-4" />
              Read Docs
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-border-primary py-8 px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent-primary" />
          <span className="text-sm font-semibold text-text-primary">RAG Studio Pro</span>
        </div>
        <p className="text-xs text-text-muted">Production-ready Multimodal RAG Platform</p>
      </div>
    </footer>
  );
}

// ─── Main Landing Page ───────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <SupportedModalities />
      <FeaturesSection />
      <ArchitectureSection />
      <CTASection />
      <Footer />
    </div>
  );
}
