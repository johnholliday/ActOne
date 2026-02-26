/**
 * T107: DALL-E image backend (OpenAI cloud API).
 *
 * All API responses Zod-validated per Constitution VII.
 */

import { z } from 'zod';
import type { ImageBackend, ImageGenOptions, ImageResult } from './midjourney.js';

const DalleResponseSchema = z.object({
  data: z.array(z.object({
    url: z.string().url().optional(),
    b64_json: z.string().optional(),
    revised_prompt: z.string().optional(),
  })),
});

export class DalleBackend implements ImageBackend {
  readonly id = 'dalle';
  readonly name = 'DALL-E';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(prompt: string, options?: ImageGenOptions): Promise<ImageResult> {
    const size = this.resolveSize(options?.width, options?.height);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality: 'standard',
      }),
    });

    if (!response.ok) {
      throw new Error(`DALL-E error: ${response.status}`);
    }

    const raw = await response.json();
    const parsed = DalleResponseSchema.parse(raw);

    const image = parsed.data[0];
    if (!image?.url) {
      throw new Error('No image URL in DALL-E response');
    }

    return {
      imageUrl: image.url,
      width: options?.width ?? 1024,
      height: options?.height ?? 1024,
      cost: 0.04, // DALL-E 3 standard pricing
    };
  }

  async checkAvailability(): Promise<{ available: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      return { available: response.ok };
    } catch (e) {
      return { available: false, error: e instanceof Error ? e.message : 'Connection failed' };
    }
  }

  private resolveSize(w?: number, h?: number): string {
    if (w && h && w > h) return '1792x1024';
    if (w && h && h > w) return '1024x1792';
    return '1024x1024';
  }
}
