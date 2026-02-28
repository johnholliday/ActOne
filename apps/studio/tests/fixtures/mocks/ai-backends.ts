/**
 * Mock AI backend implementations for testing.
 *
 * Provides mock text and image backends that return configurable
 * responses without making real API calls.
 */

import { vi } from 'vitest';
import type { CostEstimate } from '@repo/shared';

// ── Types matching backend-registry.ts ────────────────────────────────

export interface StreamChunk {
  text: string;
  tokenCount?: number;
}

export interface GenerationComplete {
  fullText: string;
  totalTokens: number;
  durationMs: number;
  actualCostUsd?: number;
}

export interface AvailabilityResult {
  available: boolean;
  error?: string;
}

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

export interface TextBackend {
  readonly id: string;
  readonly name: string;
  generate(
    context: GenerationContext,
  ): AsyncGenerator<StreamChunk, GenerationComplete>;
  estimateCost(context: GenerationContext): Promise<CostEstimate>;
  checkAvailability(): Promise<AvailabilityResult>;
  getCapabilities(): {
    maxContextTokens: number;
    streaming: boolean;
    concurrentRequests: number;
  };
}

// ── Types matching midjourney.ts ──────────────────────────────────────

export interface ImageGenOptions {
  width?: number;
  height?: number;
  referenceImageUrl?: string;
  style?: string;
}

export interface ImageResult {
  imageUrl: string;
  width: number;
  height: number;
  cost?: number;
}

export interface ImageBackend {
  readonly id: string;
  readonly name: string;
  generate(prompt: string, options?: ImageGenOptions): Promise<ImageResult>;
  checkAvailability(): Promise<{ available: boolean; error?: string }>;
}

// ── Configurable responses ────────────────────────────────────────────

interface MockTextConfig {
  chunks?: StreamChunk[];
  fullText?: string;
  totalTokens?: number;
  durationMs?: number;
  costUsd?: number;
  estimatedCost?: CostEstimate;
  available?: boolean;
  error?: string;
}

let _textConfig: MockTextConfig = {};

export function configureMockTextBackend(config: MockTextConfig): void {
  _textConfig = config;
}

interface MockImageConfig {
  imageResult?: ImageResult;
  available?: boolean;
  error?: string;
}

let _imageConfig: MockImageConfig = {};

export function configureMockImageBackend(config: MockImageConfig): void {
  _imageConfig = config;
}

export function resetMockAiBackends(): void {
  _textConfig = {};
  _imageConfig = {};
}

// ── Mock text backend ─────────────────────────────────────────────────

export const mockTextBackend: TextBackend = {
  id: 'mock-text',
  name: 'Mock Text Backend',

  async *generate(
    _context: GenerationContext,
  ): AsyncGenerator<StreamChunk, GenerationComplete> {
    const chunks = _textConfig.chunks ?? [
      { text: 'The morning ', tokenCount: 3 },
      { text: 'light filtered ', tokenCount: 3 },
      { text: 'through the windows.', tokenCount: 4 },
    ];

    for (const chunk of chunks) {
      yield chunk;
    }

    return {
      fullText:
        _textConfig.fullText ??
        chunks.map((c) => c.text).join(''),
      totalTokens: _textConfig.totalTokens ?? 10,
      durationMs: _textConfig.durationMs ?? 500,
      actualCostUsd: _textConfig.costUsd ?? 0.005,
    };
  },

  estimateCost: vi.fn(async (_context: GenerationContext): Promise<CostEstimate> => {
    return (
      _textConfig.estimatedCost ?? {
        estimatedCostUsd: 0.005,
        estimatedTokens: 500,
      }
    );
  }),

  checkAvailability: vi.fn(async (): Promise<AvailabilityResult> => {
    return {
      available: _textConfig.available ?? true,
      error: _textConfig.error,
    };
  }),

  getCapabilities: () => ({
    maxContextTokens: 100_000,
    streaming: true,
    concurrentRequests: 5,
  }),
};

// ── Mock image backend ────────────────────────────────────────────────

export const mockImageBackend: ImageBackend = {
  id: 'mock-image',
  name: 'Mock Image Backend',

  generate: vi.fn(
    async (
      _prompt: string,
      _options?: ImageGenOptions,
    ): Promise<ImageResult> => {
      return (
        _imageConfig.imageResult ?? {
          imageUrl: 'https://mock.example.com/image.png',
          width: 1024,
          height: 1024,
          cost: 0.02,
        }
      );
    },
  ),

  checkAvailability: vi.fn(
    async (): Promise<{ available: boolean; error?: string }> => {
      return {
        available: _imageConfig.available ?? true,
        error: _imageConfig.error,
      };
    },
  ),
};
