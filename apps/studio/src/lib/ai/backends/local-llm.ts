/**
 * T084: Local LLM text backend.
 *
 * Connects to an OpenAI-compatible local server (e.g., llama.cpp, Ollama, LM Studio).
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

/** Zod schema for OpenAI-compatible streaming chunk. */
const OpenAIChunkSchema = z.object({
  choices: z.array(z.object({
    delta: z.object({
      content: z.string().optional(),
    }).optional(),
    finish_reason: z.string().nullable().optional(),
  })),
  usage: z.object({
    prompt_tokens: z.number().optional(),
    completion_tokens: z.number().optional(),
    total_tokens: z.number().optional(),
  }).optional(),
});

export class LocalLlmBackend implements TextBackend {
  readonly id = 'local-llm';
  readonly name = 'Local LLM';
  private baseUrl: string;
  private model: string;

  constructor(baseUrl = 'http://localhost:11434', model = 'default') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
  }

  async *generate(context: GenerationContext): AsyncGenerator<StreamChunk, GenerationComplete> {
    const startTime = Date.now();
    let fullText = '';
    let totalTokens = 0;

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
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
      throw new Error(`Local LLM error (${response.status}): ${await response.text()}`);
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
            const parsed = OpenAIChunkSchema.parse(raw);
            const content = parsed.choices[0]?.delta?.content;

            if (content) {
              const chunk = StreamChunkSchema.parse({ text: content });
              fullText += chunk.text;
              totalTokens++;
              yield chunk;
            }

            if (parsed.usage?.total_tokens) {
              totalTokens = parsed.usage.total_tokens;
            }
          } catch (e) {
            if (e instanceof z.ZodError) {
              console.warn('Skipping malformed local LLM event:', e.message);
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
      actualCostUsd: 0, // Local = free
    });
  }

  async estimateCost(context: GenerationContext): Promise<CostEstimate> {
    const promptTokens = Math.ceil(this.buildPrompt(context).length / 4);
    return {
      estimatedCostUsd: 0,
      estimatedTokens: promptTokens + 2000,
    };
  }

  async checkAvailability(): Promise<AvailabilityResult> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      return AvailabilitySchema.parse({
        available: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      });
    } catch (e) {
      return AvailabilitySchema.parse({
        available: false,
        error: e instanceof Error ? e.message : 'Connection failed',
      });
    }
  }

  getCapabilities() {
    return {
      maxContextTokens: 8192,
      streaming: true,
      concurrentRequests: 1,
    };
  }

  private buildPrompt(context: GenerationContext): string {
    // Concise format for local/small models
    const parts: string[] = [];
    parts.push(`Write prose: "${context.sceneName}" (${context.sceneType})`);
    if (context.location) parts.push(`Setting: ${context.location}`);
    if (context.pacing) parts.push(`Pacing: ${context.pacing}`);

    if (context.participants.length > 0) {
      const names = context.participants.map((p) => {
        const traits = p.personality.slice(0, 3).map((t) => t.name).join(', ');
        return `${p.name}: ${traits}`;
      });
      parts.push(`Characters: ${names.join('; ')}`);
    }

    return parts.join('\n');
  }
}
