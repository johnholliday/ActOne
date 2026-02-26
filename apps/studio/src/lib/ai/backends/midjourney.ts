/**
 * T107: Midjourney image backend (proxy-based).
 *
 * All API responses Zod-validated per Constitution VII.
 */

import { z } from 'zod';

const MidjourneyResponseSchema = z.object({
  taskId: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  imageUrl: z.string().url().optional(),
  error: z.string().optional(),
});

export interface ImageBackend {
  readonly id: string;
  readonly name: string;
  generate(prompt: string, options?: ImageGenOptions): Promise<ImageResult>;
  checkAvailability(): Promise<{ available: boolean; error?: string }>;
}

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

export class MidjourneyBackend implements ImageBackend {
  readonly id = 'midjourney';
  readonly name = 'Midjourney';
  private proxyUrl: string;
  private apiKey: string;

  constructor(proxyUrl: string, apiKey: string) {
    this.proxyUrl = proxyUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  async generate(prompt: string, options?: ImageGenOptions): Promise<ImageResult> {
    const response = await fetch(`${this.proxyUrl}/imagine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        width: options?.width ?? 1024,
        height: options?.height ?? 1024,
        ref: options?.referenceImageUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`Midjourney error: ${response.status}`);
    }

    const raw = await response.json();
    const parsed = MidjourneyResponseSchema.parse(raw);

    if (parsed.status === 'failed') {
      throw new Error(`Midjourney failed: ${parsed.error ?? 'unknown'}`);
    }

    if (!parsed.imageUrl) {
      throw new Error('No image URL in response');
    }

    return {
      imageUrl: parsed.imageUrl,
      width: options?.width ?? 1024,
      height: options?.height ?? 1024,
    };
  }

  async checkAvailability(): Promise<{ available: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.proxyUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      return { available: response.ok };
    } catch (e) {
      return { available: false, error: e instanceof Error ? e.message : 'Connection failed' };
    }
  }
}
