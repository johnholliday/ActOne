/**
 * T085: Claude Max subscription text backend.
 *
 * Uses the Claude Max subscription API (same Anthropic endpoint, subscription billing).
 * All responses Zod-validated per Constitution VII.
 */

import { z } from 'zod';
import type { CostEstimate } from '@actone/shared';
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

/** Zod schema for Claude streaming delta. */
const ClaudeDeltaSchema = z.object({
  type: z.string(),
  delta: z.object({
    type: z.string().optional(),
    text: z.string().optional(),
  }).optional(),
  usage: z.object({
    output_tokens: z.number().optional(),
  }).optional(),
});

export class ClaudeMaxBackend implements TextBackend {
  readonly id = 'claude-max';
  readonly name = 'Claude Max (Subscription)';
  private sessionToken: string;
  private model = 'claude-sonnet-4-6';

  constructor(sessionToken: string) {
    this.sessionToken = sessionToken;
  }

  async *generate(context: GenerationContext): AsyncGenerator<StreamChunk, GenerationComplete> {
    const startTime = Date.now();
    let fullText = '';
    let totalTokens = 0;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.sessionToken,
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
      throw new Error(`Claude Max error (${response.status}): ${await response.text()}`);
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
            const parsed = ClaudeDeltaSchema.parse(raw);

            if (parsed.delta?.text) {
              const chunk = StreamChunkSchema.parse({
                text: parsed.delta.text,
              });
              fullText += chunk.text;
              totalTokens++;
              yield chunk;
            }

            if (parsed.usage?.output_tokens) {
              totalTokens = parsed.usage.output_tokens;
            }
          } catch (e) {
            if (e instanceof z.ZodError) {
              console.warn('Skipping malformed Claude Max event:', e.message);
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

    return GenerationCompleteSchema.parse({
      fullText,
      totalTokens,
      durationMs,
      actualCostUsd: 0, // Subscription-based = no per-call cost
    });
  }

  async estimateCost(context: GenerationContext): Promise<CostEstimate> {
    const promptTokens = Math.ceil(this.buildPrompt(context).length / 4);
    return {
      estimatedCostUsd: 0, // Subscription-based
      estimatedTokens: promptTokens + 2000,
    };
  }

  async checkAvailability(): Promise<AvailabilityResult> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.sessionToken,
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
      concurrentRequests: 3,
    };
  }

  private buildPrompt(context: GenerationContext): string {
    // Rich format — similar to Claude API backend
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
        if (p.personality.length > 0) {
          const traits = p.personality.map((t) => `${t.name}:${t.value}`).join(', ');
          parts.push(`  Personality: ${traits}`);
        }
      }
    }

    if (context.worldRules.length > 0) {
      parts.push(`\nWorld rules: ${context.worldRules.join('; ')}`);
    }

    if (context.themeStatements.length > 0) {
      parts.push(`\nThemes: ${context.themeStatements.join('; ')}`);
    }

    if (context.precedingSceneSummary) {
      parts.push(`\nPreceding: ${context.precedingSceneSummary}`);
    }

    if (context.interactionPattern) {
      parts.push(`\nInteraction pattern: ${context.interactionPattern}`);
    }

    return parts.join('\n');
  }
}
