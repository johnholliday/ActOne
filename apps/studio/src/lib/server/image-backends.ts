/**
 * Server-side image backend registry.
 *
 * Instantiates image backends from environment variables and provides
 * a registry for the API endpoints to dispatch generation requests.
 */

import { env } from '$env/dynamic/private';
import type { ImageBackend, ImageGenOptions, ImageResult } from '$lib/ai/backends/midjourney.js';
import { MidjourneyBackend } from '$lib/ai/backends/midjourney.js';
import { DalleBackend } from '$lib/ai/backends/dalle.js';
import { FluxBackend } from '$lib/ai/backends/flux.js';
import { LocalSdBackend } from '$lib/ai/backends/local-sd.js';

export type { ImageBackend, ImageGenOptions, ImageResult };

export interface ImageBackendInfo {
  id: string;
  name: string;
  type: 'image';
  available: boolean;
  capabilities: { maxResolution: number; referenceImages: boolean };
}

class ImageBackendRegistry {
  private backends = new Map<string, ImageBackend>();
  private capabilities = new Map<
    string,
    { maxResolution: number; referenceImages: boolean }
  >();

  register(
    backend: ImageBackend,
    caps: { maxResolution: number; referenceImages: boolean },
  ): void {
    this.backends.set(backend.id, backend);
    this.capabilities.set(backend.id, caps);
  }

  get(id: string): ImageBackend | undefined {
    return this.backends.get(id);
  }

  async listAll(): Promise<ImageBackendInfo[]> {
    const results: ImageBackendInfo[] = [];
    for (const backend of this.backends.values()) {
      const availability = await backend.checkAvailability();
      const caps = this.capabilities.get(backend.id) ?? {
        maxResolution: 1024,
        referenceImages: false,
      };
      results.push({
        id: backend.id,
        name: backend.name,
        type: 'image',
        available: availability.available,
        capabilities: caps,
      });
    }
    return results;
  }

  getIds(): string[] {
    return Array.from(this.backends.keys());
  }
}

export const imageBackendRegistry = new ImageBackendRegistry();

// Register backends based on available environment variables
function initializeBackends(): void {
  const mjProxyUrl = env.MIDJOURNEY_PROXY_URL;
  const mjApiKey = env.MIDJOURNEY_API_KEY;
  if (mjProxyUrl && mjApiKey) {
    imageBackendRegistry.register(
      new MidjourneyBackend(mjProxyUrl, mjApiKey),
      { maxResolution: 2048, referenceImages: false },
    );
  }

  const openaiKey = env.OPENAI_API_KEY;
  if (openaiKey) {
    imageBackendRegistry.register(
      new DalleBackend(openaiKey),
      { maxResolution: 1792, referenceImages: false },
    );
  }

  const fluxUrl = env.FLUX_API_URL;
  const fluxKey = env.FLUX_API_KEY;
  if (fluxUrl && fluxKey) {
    imageBackendRegistry.register(
      new FluxBackend(fluxUrl, fluxKey),
      { maxResolution: 2048, referenceImages: true },
    );
  }

  const sdUrl = env.LOCAL_SD_URL;
  if (sdUrl) {
    imageBackendRegistry.register(
      new LocalSdBackend(sdUrl),
      { maxResolution: 2048, referenceImages: true },
    );
  }
}

initializeBackends();
