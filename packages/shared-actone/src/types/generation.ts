// ── Generation Types ─────────────────────────────────────────────────

/** Request payload for AI prose generation */
export interface GenerationRequest {
  projectId: string;
  sceneName: string;
  backendId: string;
  temperature: number;
  pacing: string;
}

/** Server-sent event types for generation streaming */
export interface GenerationStreamEvent {
  type: 'chunk' | 'done' | 'error' | 'cost';
  text?: string;
  tokenCount?: number;
  fullText?: string;
  totalTokens?: number;
  durationMs?: number;
  error?: string;
  actualCostUsd?: number;
}

/** Pre-generation cost estimate */
export interface CostEstimate {
  estimatedCostUsd: number;
  estimatedTokens: number;
}

/** Available AI backend descriptor */
export interface BackendInfo {
  id: string;
  name: string;
  type: 'text' | 'image';
  available: boolean;
  capabilities: {
    maxContextTokens: number;
    streaming: boolean;
    concurrentRequests: number;
  };
}
