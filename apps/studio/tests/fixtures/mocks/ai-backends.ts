/**
 * Mock AI backend implementations for testing.
 *
 * Provides mock text and image providers that return configurable
 * responses without making real API calls. These match sanyam's
 * LlmProvider and ImageProvider interfaces.
 */

import { vi } from 'vitest';
import type { CostEstimate } from '@actone/shared';

// ── Types matching sanyam LlmProvider ─────────────────────────────────

export interface StreamChunk {
  text: string;
  done: boolean;
}

export interface CompletionResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  metadata?: Record<string, unknown>;
}

export interface GenerateContext {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
}

export interface LlmProvider {
  readonly id: string;
  readonly name: string;
  generate(ctx: GenerateContext): AsyncGenerator<StreamChunk, CompletionResult>;
  estimateCost(ctx: GenerateContext): Promise<{
    inputTokens: number;
    estimatedCostUsd: number;
    providerId: string;
  }>;
  checkAvailability(): Promise<{ available: boolean; error?: string }>;
}

// ── Types matching sanyam ImageProvider ────────────────────────────────

export interface ImageGenerateRequest {
  prompt: string;
  width?: number;
  height?: number;
}

export interface ImageGenerateResult {
  images: Array<{ data: string; format: string; mimeType: string }>;
  providerId: string;
}

export interface ImageProvider {
  readonly id: string;
  readonly name: string;
  generate(request: ImageGenerateRequest): Promise<ImageGenerateResult>;
  checkAvailability(): Promise<{ available: boolean; error?: string }>;
  getBackendInfo(): { id: string; name: string };
}

// ── Legacy types for backward compat in tests ─────────────────────────

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

// ── Configurable responses ────────────────────────────────────────────

interface MockTextConfig {
  chunks?: Array<{ text: string }>;
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
  imageResult?: ImageGenerateResult;
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

// ── Mock text provider (sanyam LlmProvider interface) ─────────────────

export const mockTextBackend: LlmProvider = {
  id: 'mock-text',
  name: 'Mock Text Backend',

  async *generate(
    _ctx: GenerateContext,
  ): AsyncGenerator<StreamChunk, CompletionResult> {
    const chunks = _textConfig.chunks ?? [
      { text: 'The morning ' },
      { text: 'light filtered ' },
      { text: 'through the windows.' },
    ];

    for (const chunk of chunks) {
      yield { text: chunk.text, done: false };
    }

    return {
      text: _textConfig.fullText ?? chunks.map((c) => c.text).join(''),
      inputTokens: 0,
      outputTokens: _textConfig.totalTokens ?? 10,
      metadata: {
        durationMs: _textConfig.durationMs ?? 500,
        actualCostUsd: _textConfig.costUsd ?? 0.005,
      },
    };
  },

  estimateCost: vi.fn(async (_ctx: GenerateContext) => {
    const est = _textConfig.estimatedCost ?? {
      estimatedCostUsd: 0.005,
      estimatedTokens: 500,
    };
    return {
      inputTokens: est.estimatedTokens,
      estimatedCostUsd: est.estimatedCostUsd,
      providerId: 'mock-text',
    };
  }),

  checkAvailability: vi.fn(async () => ({
    available: _textConfig.available ?? true,
    error: _textConfig.error,
  })),
};

// ── Mock image provider (sanyam ImageProvider interface) ───────────────

export const mockImageBackend: ImageProvider = {
  id: 'mock-image',
  name: 'Mock Image Backend',

  generate: vi.fn(
    async (_request: ImageGenerateRequest): Promise<ImageGenerateResult> => {
      return (
        _imageConfig.imageResult ?? {
          images: [
            {
              data: 'https://mock.example.com/image.png',
              format: 'url',
              mimeType: 'image/png',
            },
          ],
          providerId: 'mock-image',
        }
      );
    },
  ),

  checkAvailability: vi.fn(
    async (): Promise<{ available: boolean; error?: string }> => ({
      available: _imageConfig.available ?? true,
      error: _imageConfig.error,
    }),
  ),

  getBackendInfo: () => ({
    id: 'mock-image',
    name: 'Mock Image Backend',
  }),
};
