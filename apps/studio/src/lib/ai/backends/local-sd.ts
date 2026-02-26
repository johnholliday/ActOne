/**
 * T107: Local Stable Diffusion image backend.
 *
 * Connects to a local Automatic1111 / ComfyUI API server.
 * All API responses Zod-validated per Constitution VII.
 */

import { z } from 'zod';
import type { ImageBackend, ImageGenOptions, ImageResult } from './midjourney.js';

const SDResponseSchema = z.object({
  images: z.array(z.string()), // base64-encoded images
  parameters: z.record(z.unknown()).optional(),
  info: z.string().optional(),
});

export class LocalSdBackend implements ImageBackend {
  readonly id = 'local-sd';
  readonly name = 'Local Stable Diffusion';
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:7860') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async generate(prompt: string, options?: ImageGenOptions): Promise<ImageResult> {
    const response = await fetch(`${this.baseUrl}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        width: options?.width ?? 512,
        height: options?.height ?? 512,
        steps: 30,
        cfg_scale: 7,
        sampler_name: 'Euler a',
        batch_size: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Local SD error: ${response.status}`);
    }

    const raw = await response.json();
    const parsed = SDResponseSchema.parse(raw);

    const base64Image = parsed.images[0];
    if (!base64Image) {
      throw new Error('No image in local SD response');
    }

    return {
      imageUrl: `data:image/png;base64,${base64Image}`,
      width: options?.width ?? 512,
      height: options?.height ?? 512,
      cost: 0, // Local = free
    };
  }

  async checkAvailability(): Promise<{ available: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/sdapi/v1/sd-models`, {
        signal: AbortSignal.timeout(5000),
      });
      return { available: response.ok };
    } catch (e) {
      return { available: false, error: e instanceof Error ? e.message : 'Connection failed' };
    }
  }
}
