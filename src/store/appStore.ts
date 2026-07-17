/**
 * RAG Studio Pro - App Store
 * Zustand store for global state management.
 */

import { create } from 'zustand';
import type { Chunk, PipelineRun, PipelineStep } from '../services/api';

// ─── Types ─────────────────────────────────────────────────────────

interface ParsedFile {
  name: string;
  text: string;
  type: string;
  size: number;
  words: number;
  characters: number;
  pages?: number;
  language?: string;
  metadata?: Record<string, any>;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    chunks?: number;
    sources?: string[];
    latency?: string;
    confidence?: number;
    evidence?: Array<{
      rank: number;
      score: number;
      text: string;
      source: string;
      page?: number;
      chunk_id?: string;
      metadata?: Record<string, any>;
    }>;
  };
}

interface AppState {
  // Backend connection
  backendConnected: boolean;
  setBackendConnected: (v: boolean) => void;

  // Parsed files
  parsedFiles: ParsedFile[];
  addParsedFile: (f: ParsedFile) => void;
  removeParsedFile: (name: string) => void;
  clearParsedFiles: () => void;

  // Current text (from file or manual input)
  currentText: string;
  setCurrentText: (t: string) => void;

  // Chunks
  chunks: Chunk[];
  setChunks: (c: Chunk[]) => void;

  // Pipeline config
  chunkMethod: string;
  setChunkMethod: (m: string) => void;
  chunkSize: number;
  setChunkSize: (s: number) => void;
  chunkOverlap: number;
  setChunkOverlap: (o: number) => void;
  embeddingModel: string;
  setEmbeddingModel: (m: string) => void;
  vectorStore: string;
  setVectorStore: (v: string) => void;
  collectionName: string;
  setCollectionName: (n: string) => void;
  llmProvider: string;
  setLlmProvider: (p: string) => void;
  llmModel: string;
  setLlmModel: (m: string) => void;

  // Pipeline execution
  isPipelineRunning: boolean;
  setIsPipelineRunning: (v: boolean) => void;
  currentPipeline: PipelineRun | null;
  setCurrentPipeline: (p: PipelineRun | null) => void;
  pipelineSteps: PipelineStep[];
  setPipelineSteps: (s: PipelineStep[]) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (m: ChatMessage) => void;
  clearChat: () => void;

  // Analytics
  totalChunks: number;
  totalVectors: number;
  totalQueries: number;
  setTotalChunks: (n: number) => void;
  setTotalVectors: (n: number) => void;
  incrementQueries: () => void;

  // Ollama
  ollamaAvailable: boolean;
  ollamaModels: string[];
  setOllamaStatus: (available: boolean, models: string[]) => void;
}

// ─── Store ─────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set) => ({
  // Backend connection
  backendConnected: false,
  setBackendConnected: (v) => set({ backendConnected: v }),

  // Parsed files
  parsedFiles: [],
  addParsedFile: (f) => set((s) => ({ parsedFiles: [...s.parsedFiles, f] })),
  removeParsedFile: (name) => set((s) => ({ parsedFiles: s.parsedFiles.filter((f) => f.name !== name) })),
  clearParsedFiles: () => set({ parsedFiles: [] }),

  // Current text
  currentText: '',
  setCurrentText: (t) => set({ currentText: t }),

  // Chunks
  chunks: [],
  setChunks: (c) => set({ chunks: c }),

  // Pipeline config
  chunkMethod: 'recursive',
  setChunkMethod: (m) => set({ chunkMethod: m }),
  chunkSize: 500,
  setChunkSize: (s) => set({ chunkSize: s }),
  chunkOverlap: 50,
  setChunkOverlap: (o) => set({ chunkOverlap: o }),
  embeddingModel: 'all-MiniLM-L6-v2',
  setEmbeddingModel: (m) => set({ embeddingModel: m }),
  vectorStore: 'faiss_flat',
  setVectorStore: (v) => set({ vectorStore: v }),
  collectionName: 'default',
  setCollectionName: (n) => set({ collectionName: n }),
  llmProvider: 'groq',
  setLlmProvider: (p) => set({ llmProvider: p }),
  llmModel: 'llama-3.1-8b-instant',
  setLlmModel: (m) => set({ llmModel: m }),


  // Pipeline execution
  isPipelineRunning: false,
  setIsPipelineRunning: (v) => set({ isPipelineRunning: v }),
  currentPipeline: null,
  setCurrentPipeline: (p) => set({ currentPipeline: p }),
  pipelineSteps: [],
  setPipelineSteps: (s) => set({ pipelineSteps: s }),

  // Chat
  chatMessages: [],
  addChatMessage: (m) => set((s) => ({ chatMessages: [...s.chatMessages, m] })),
  clearChat: () => set({ chatMessages: [] }),

  // Analytics
  totalChunks: 0,
  totalVectors: 0,
  totalQueries: 0,
  setTotalChunks: (n) => set({ totalChunks: n }),
  setTotalVectors: (n) => set({ totalVectors: n }),
  incrementQueries: () => set((s) => ({ totalQueries: s.totalQueries + 1 })),

  // Ollama
  ollamaAvailable: false,
  ollamaModels: [],
  setOllamaStatus: (available, models) => set({ ollamaAvailable: available, ollamaModels: models }),
}));
