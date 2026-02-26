/**
 * T083: Claude API text backend.
 *
 * Streaming generation via the Anthropic Messages API.
 * All API responses Zod-validated per Constitution VII.
 */

import { z } from 'zod';
import type { CostEstimate } from '@repo/shared';
import {
  StreamChunkSchema,
  GenerationCompleteSchema,
  AvailabilitySchema,
  type TextBackend,
  type GenerationContext,
  type StreamChunk,
  type GenerationComplete,
  type AvailabilityResult,
} from './backend-registry.js';

/** Zod schema for Claude API streaming delta events. */
const ClaudeDeltaSchema = z.object({
  type: z.string(),
  delta: z.object({
    type: z.literal('text_delta').optional(),
    text: z.string().optional(),
  }).optional(),
  usage: z.object({
    input_tokens: z.number().optional(),
    output_tokens: z.number().optional(),
  }).optional(),
});

/** Zod schema for Claude API error responses. */
const ClaudeErrorSchema = z.object({
  type: z.literal('error'),
  error: z.object({
    type: z.string(),
    message: z.string(),
  }),
});

// Claude API pricing (per million tokens, as of 2025)
const PRICING = {
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  'claude-haiku-4-5': { input: 0.80, output: 4.0 },
  'claude-opus-4-6': { input: 15.0, output: 75.0 },
} as const;

const DEFAULT_MODEL = 'claude-sonnet-4-6';

export class ClaudeApiBackend implements TextBackend {
  readonly id = 'claude-api';
  readonly name = 'Claude API';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model ?? DEFAULT_MODEL;
  }

  async *generate(context: GenerationContext): AsyncGenerator<StreamChunk, GenerationComplete> {
    const startTime = Date.now();
    let fullText = '';
    let totalTokens = 0;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        temperature: context.temperature,
        stream: true,
        messages: [
          {
            role: 'user',
            content: this.buildPrompt(context),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Claude API error (${response.status}): ${errorBody}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const raw = JSON.parse(jsonStr);

            // Check for errors
            const errorParse = ClaudeErrorSchema.safeParse(raw);
            if (errorParse.success) {
              throw new Error(`Claude API: ${errorParse.data.error.message}`);
            }

            const parsed = ClaudeDeltaSchema.parse(raw);

            if (parsed.delta?.text) {
              const chunk = StreamChunkSchema.parse({
                text: parsed.delta.text,
                tokenCount: 1, // approximate
              });
              fullText += chunk.text;
              totalTokens += chunk.tokenCount ?? 0;
              yield chunk;
            }

            if (parsed.usage?.output_tokens) {
              totalTokens = parsed.usage.output_tokens;
            }
          } catch (e) {
            if (e instanceof z.ZodError) {
              // Skip malformed events but log
              console.warn('Skipping malformed Claude API event:', e.message);
            } else {
              throw e;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    const durationMs = Date.now() - startTime;
    const modelPricing = PRICING[this.model as keyof typeof PRICING] ?? PRICING[DEFAULT_MODEL];
    const actualCostUsd = (totalTokens / 1_000_000) * modelPricing.output;

    return GenerationCompleteSchema.parse({
      fullText,
      totalTokens,
      durationMs,
      actualCostUsd,
    });
  }

  async estimateCost(context: GenerationContext): Promise<CostEstimate> {
    const promptTokens = this.estimateTokenCount(this.buildPrompt(context));
    const expectedOutputTokens = 2000; // rough estimate
    const modelPricing = PRICING[this.model as keyof typeof PRICING] ?? PRICING[DEFAULT_MODEL];

    const inputCost = (promptTokens / 1_000_000) * modelPricing.input;
    const outputCost = (expectedOutputTokens / 1_000_000) * modelPricing.output;

    return {
      estimatedCostUsd: inputCost + outputCost,
      estimatedTokens: promptTokens + expectedOutputTokens,
    };
  }

  async checkAvailability(): Promise<AvailabilityResult> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        }),
      });

      return AvailabilitySchema.parse({
        available: response.ok || response.status === 400,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      });
    } catch (e) {
      return AvailabilitySchema.parse({
        available: false,
        error: e instanceof Error ? e.message : 'Unknown error',
      });
    }
  }

  getCapabilities() {
    return {
      maxContextTokens: 200_000,
      streaming: true,
      concurrentRequests: 5,
    };
  }

  private buildPrompt(context: GenerationContext): string {
    const parts: string[] = [];
    parts.push(`Write prose for the scene "${context.sceneName}" (${context.sceneType}).`);
    if (context.location) parts.push(`Setting: ${context.location}`);
    if (context.objective) parts.push(`Objective: ${context.objective}`);
    if (context.pacing) parts.push(`Pacing: ${context.pacing}`);

    if (context.participants.length > 0) {
      parts.push('\nCharacters:');
      for (const p of context.participants) {
        parts.push(`- ${p.name} (${p.nature}): ${p.bio}`);
        if (p.voice) parts.push(`  Voice: ${p.voice}`);
      }
    }

    if (context.worldRules.length > 0) {
      parts.push(`\nWorld rules: ${context.worldRules.join('; ')}`);
    }

    if (context.precedingSceneSummary) {
      parts.push(`\nPreceding: ${context.precedingSceneSummary}`);
    }

    return parts.join('\n');
  }

  private estimateTokenCount(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}
