export type FileCategory = 'text' | 'audio' | 'video';

export interface ParsedFile {
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

export interface ChatMessage {
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

export interface ResetOptions {
  resetPipeline: boolean;
  removeFiles: boolean;
  clearVectors: boolean;
  clearChat: boolean;
  clearOutputs: boolean;
  resetEverything: boolean;
}
