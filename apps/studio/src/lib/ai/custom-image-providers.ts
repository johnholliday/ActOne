/**
 * Custom image provider adapters for backends without sanyam equivalents.
 *
 * Adapts Midjourney, Flux, and Local SD backends to sanyam's ImageProvider
 * interface and registers them on the ProviderRegistry.
 */

import type { ProviderRegistry } from '@docugenix/sanyam-ai-provider';
import type {
  ImageProvider,
  ImageGenerateRequest,
  ImageGenerateResult,
} from '@docugenix/sanyam-ai-image';
import type { ImageBackend, ImageGenOptions } from './backends/midjourney.js';
import { MidjourneyBackend } from './backends/midjourney.js';
import { FluxBackend } from './backends/flux.js';
import { LocalSdBackend } from './backends/local-sd.js';

/** Adapt an ActOne ImageBackend to sanyam's ImageProvider interface. */
function adaptImageBackend(backend: ImageBackend): ImageProvider {
  return {
    id: backend.id,
    name: backend.name,

    checkAvailability: () => backend.checkAvailability(),

    getBackendInfo: () => ({
      id: backend.id,
      name: backend.name,
    }),

    async generate(request: ImageGenerateRequest): Promise<ImageGenerateResult> {
      const opts: ImageGenOptions = {
        width: request.width,
        height: request.height,
      };
      const result = await backend.generate(request.prompt, opts);
      return {
        images: [
          {
            data: result.imageUrl,
            format: 'url' as const,
            mimeType: 'image/png',
          },
        ],
        providerId: backend.id,
      };
    },
  };
}

/**
 * Register custom image backends that don't have sanyam provider packages.
 * These are registered manually on the ProviderRegistry alongside
 * auto-discovered providers (Anthropic, OpenAI, Local).
 */
export function registerCustomImageBackends(
  registry: ProviderRegistry,
  env: Record<string, string | undefined>,
): void {
  // Midjourney (proxy-based)
  if (env.MIDJOURNEY_PROXY_URL && env.MIDJOURNEY_API_KEY) {
    registry.registerImage(
      adaptImageBackend(
        new MidjourneyBackend(env.MIDJOURNEY_PROXY_URL, env.MIDJOURNEY_API_KEY),
      ),
    );
  }

  // Flux (model-based with reference image support)
  if (env.FLUX_API_URL && env.FLUX_API_KEY) {
    registry.registerImage(
      adaptImageBackend(new FluxBackend(env.FLUX_API_URL, env.FLUX_API_KEY)),
    );
  }

  // Local Stable Diffusion (Automatic1111 / ComfyUI)
  if (env.LOCAL_SD_URL) {
    registry.registerImage(
      adaptImageBackend(new LocalSdBackend(env.LOCAL_SD_URL)),
    );
  }
}
