import { motion } from 'framer-motion';
import {
  Upload, Layers, Brain, Database, Search, MessageSquare, BarChart3,
  CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { cn } from '../../lib/utils';

// ─── Pipeline Step Definitions ──────────────────────────────────
export const PIPELINE_STEPS: PipelineStepDef[] = [
  { id: 0, name: 'Ingestion', icon: Upload, color: 'from-blue-500 to-cyan-500', label: 'Upload documents, audio, video, or paste text' },
  { id: 1, name: 'Chunking', icon: Layers, color: 'from-cyan-500 to-teal-500', label: 'Split content into searchable chunks' },
  { id: 2, name: 'Embeddings', icon: Brain, color: 'from-teal-500 to-emerald-500', label: 'Convert chunks into dense vector embeddings' },
  { id: 3, name: 'Vector Store', icon: Database, color: 'from-emerald-500 to-green-500', label: 'Store embeddings for fast similarity search' },
  { id: 4, name: 'Retrieval', icon: Search, color: 'from-green-500 to-lime-500', label: 'Search the vector database for relevant chunks' },
  { id: 5, name: 'Generation', icon: MessageSquare, color: 'from-lime-500 to-yellow-500', label: 'Generate grounded answers using LLM' },
  { id: 6, name: 'Analytics', icon: BarChart3, color: 'from-yellow-500 to-orange-500', label: 'View pipeline performance metrics' },
];

export interface PipelineStepDef {
  id: number;
  name: string;
  icon: any;
  color: string;
  label: string;
}

// ─── Pipeline Timeline ──────────────────────────────────────────
interface PipelineTimelineProps {
  activeStep: number;
  completedSteps: Set<number>;
  failedSteps: Set<number>;
  processingSteps: Set<number>;
  onStepClick: (stepId: number) => void;
  stepTimings?: Record<string, number>;
}

export function PipelineTimeline({
  activeStep,
  completedSteps,
  failedSteps,
  processingSteps,
  onStepClick,
  stepTimings = {},
}: PipelineTimelineProps) {
  return (
    <div className="px-6 py-4 bg-bg-secondary/80 backdrop-blur-sm border-b border-border-primary">
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        {PIPELINE_STEPS.map((step, i) => {
          const isCompleted = completedSteps.has(step.id);
          const isFailed = failedSteps.has(step.id);
          const isProcessing = processingSteps.has(step.id);
          const isActive = activeStep === step.id;
          const isClickable = isCompleted || isActive || isFailed;

          return (
            <div key={step.id} className="flex items-center">
              <motion.button
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                whileHover={isClickable ? { scale: 1.05 } : {}}
                whileTap={isClickable ? { scale: 0.95 } : {}}
                className={cn(
                  'flex flex-col items-center gap-1.5 relative group',
                  !isClickable && 'opacity-40 cursor-not-allowed'
                )}
              >
                {/* Step icon */}
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300',
                  isCompleted && 'bg-emerald-500 shadow-sm shadow-emerald-500/30',
                  isFailed && 'bg-red-500 shadow-sm shadow-red-500/30',
                  isProcessing && `bg-gradient-to-br ${step.color} animate-pulse shadow-sm`,
                  isActive && !isCompleted && !isFailed && !isProcessing && `bg-gradient-to-br ${step.color} shadow-md`,
                  !isActive && !isCompleted && !isFailed && !isProcessing && 'bg-bg-tertiary'
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : isFailed ? (
                    <AlertCircle className="w-4 h-4 text-white" />
                  ) : isProcessing ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <step.icon className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Step name */}
                <span className={cn(
                  'text-[10px] font-medium whitespace-nowrap transition-colors',
                  isActive ? 'text-text-primary font-semibold' : 'text-text-muted',
                  isCompleted && 'text-emerald-600',
                  isFailed && 'text-red-500'
                )}>
                  {step.name}
                </span>

                {/* Timing tooltip */}
                {stepTimings[step.id] && isCompleted && (
                  <span className="text-[8px] text-text-muted -mt-1">
                    {(stepTimings[step.id] / 1000).toFixed(1)}s
                  </span>
                )}

                {/* Hover tooltip */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg bg-bg-elevated border border-border-primary text-[10px] text-text-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20 pointer-events-none">
                  {step.label}
                </div>
              </motion.button>

              {/* Connector line */}
              {i < PIPELINE_STEPS.length - 1 && (
                <div className="w-8 h-px mx-2 relative">
                  <div className={cn(
                    'absolute inset-0 rounded-full transition-all duration-500',
                    completedSteps.has(step.id) ? 'bg-emerald-400' : 'bg-border-primary'
                  )} />
                  {completedSteps.has(step.id) && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      className="absolute inset-0 bg-emerald-400 rounded-full origin-left"
                      style={{ transformOrigin: 'left' }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
