/**
 * T107: Flux image backend (model-based with reference image support).
 *
 * All API responses Zod-validated per Constitution VII.
 */

import { z } from 'zod';
import type { ImageBackend, ImageGenOptions, ImageResult } from './midjourney.js';

const FluxResponseSchema = z.object({
  images: z.array(z.object({
    url: z.string().url(),
    seed: z.number().optional(),
  })),
});

export class FluxBackend implements ImageBackend {
  readonly id = 'flux';
  readonly name = 'Flux';
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  async generate(prompt: string, options?: ImageGenOptions): Promise<ImageResult> {
    const body: Record<string, unknown> = {
      prompt,
      width: options?.width ?? 1024,
      height: options?.height ?? 1024,
      num_outputs: 1,
    };

    if (options?.referenceImageUrl) {
      body['image'] = options.referenceImageUrl;
      body['prompt_strength'] = 0.8;
    }

    const response = await fetch(`${this.apiUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Flux error: ${response.status}`);
    }

    const raw = await response.json();
    const parsed = FluxResponseSchema.parse(raw);

    const image = parsed.images[0];
    if (!image) {
      throw new Error('No image in Flux response');
    }

    return {
      imageUrl: image.url,
      width: options?.width ?? 1024,
      height: options?.height ?? 1024,
    };
  }

  async checkAvailability(): Promise<{ available: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      return { available: response.ok };
    } catch (e) {
      return { available: false, error: e instanceof Error ? e.message : 'Connection failed' };
    }
  }
}
