/**
 * T082: Backend registry interface and registration pattern.
 *
 * Common interface for text generation backends: generate (streaming),
 * estimate cost, check availability, report capabilities.
 * All external API responses MUST be Zod-validated (Constitution VII).
 */

import { z } from 'zod';
import type { BackendInfo, CostEstimate } from '@repo/shared';

/** Zod schema for validating stream chunk responses from backends. */
export const StreamChunkSchema = z.object({
  text: z.string(),
  tokenCount: z.number().int().nonnegative().optional(),
});
export type StreamChunk = z.infer<typeof StreamChunkSchema>;

/** Zod schema for generation completion response. */
export const GenerationCompleteSchema = z.object({
  fullText: z.string(),
  totalTokens: z.number().int().nonnegative(),
  durationMs: z.number().nonnegative(),
  actualCostUsd: z.number().nonnegative().optional(),
});
export type GenerationComplete = z.infer<typeof GenerationCompleteSchema>;

/** Zod schema for cost estimate response. */
export const CostEstimateSchema = z.object({
  estimatedCostUsd: z.number().nonnegative(),
  estimatedTokens: z.number().int().nonnegative(),
});

/** Zod schema for availability check. */
export const AvailabilitySchema = z.object({
  available: z.boolean(),
  error: z.string().optional(),
});
export type AvailabilityResult = z.infer<typeof AvailabilitySchema>;

/** Generation context assembled from AST. */
export interface GenerationContext {
  sceneName: string;
  sceneType: string;
  location: string;
  atmosphere: Array<{ name: string; value: number }>;
  objective: string;
  participants: Array<{
    name: string;
    nature: string;
    bio: string;
    voice: string;
    personality: Array<{ name: string; value: number }>;
  }>;
  worldRules: string[];
  precedingSceneSummary?: string;
  themeStatements: string[];
  interactionPattern?: string;
  pacing: string;
  temperature: number;
}

/** Common interface for text generation backends. */
export interface TextBackend {
  /** Unique identifier. */
  readonly id: string;

  /** Display name. */
  readonly name: string;

  /** Generate streaming prose from context. Yields Zod-validated chunks. */
  generate(context: GenerationContext): AsyncGenerator<StreamChunk, GenerationComplete>;

  /** Estimate cost before generation. Returns Zod-validated estimate. */
  estimateCost(context: GenerationContext): Promise<CostEstimate>;

  /** Check if the backend is available. Returns Zod-validated result. */
  checkAvailability(): Promise<AvailabilityResult>;

  /** Report backend capabilities. */
  getCapabilities(): {
    maxContextTokens: number;
    streaming: boolean;
    concurrentRequests: number;
  };
}

/** Registry holding all registered text backends. */
class BackendRegistry {
  private backends = new Map<string, TextBackend>();
  private activeId: string | null = null;

  /** Register a text backend. */
  register(backend: TextBackend): void {
    this.backends.set(backend.id, backend);
    if (!this.activeId) {
      this.activeId = backend.id;
    }
  }

  /** Unregister a backend. */
  unregister(id: string): void {
    this.backends.delete(id);
    if (this.activeId === id) {
      this.activeId = this.backends.keys().next().value ?? null;
    }
  }

  /** Get a backend by ID. */
  get(id: string): TextBackend | undefined {
    return this.backends.get(id);
  }

  /** Get the active backend. */
  getActive(): TextBackend | undefined {
    if (!this.activeId) return undefined;
    return this.backends.get(this.activeId);
  }

  /** Set the active backend. */
  setActive(id: string): void {
    if (!this.backends.has(id)) {
      throw new Error(`Backend "${id}" not registered`);
    }
    this.activeId = id;
  }

  /** Get active backend ID. */
  getActiveId(): string | null {
    return this.activeId;
  }

  /** List all registered backends with availability info. */
  async listAll(): Promise<BackendInfo[]> {
    const results: BackendInfo[] = [];
    for (const backend of this.backends.values()) {
      const availability = await backend.checkAvailability();
      const capabilities = backend.getCapabilities();
      results.push({
        id: backend.id,
        name: backend.name,
        type: 'text',
        available: availability.available,
        capabilities,
      });
    }
    return results;
  }

  /** Get all backend IDs. */
  getIds(): string[] {
    return Array.from(this.backends.keys());
  }
}

export const backendRegistry = new BackendRegistry();
