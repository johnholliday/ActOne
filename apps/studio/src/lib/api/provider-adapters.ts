/**
 * Adapters that bridge ActOne's backend interfaces to sanyam 0.9.0 provider interfaces.
 *
 * sanyam route factories require dependency-injected providers.
 * ActOne has its own backend registries with domain-specific interfaces.
 * These adapters translate between the two.
 */

import type {
  TextBackend,
  GenerationContext,
} from '$lib/ai/backends/backend-registry.js';
import { backendRegistry } from '$lib/ai/backends/backend-registry.js';
import { imageBackendRegistry } from '$lib/server/image-backends.js';
import type {
  ImageBackend as ActOneImageBackend,
  ImageGenOptions,
} from '$lib/server/image-backends.js';

import type {
  LlmProvider,
  AiTextRoutesConfig,
  GenerateContext,
  StreamChunk as SanyamStreamChunk,
  CompletionResult,
} from '@docugenix/sanyam-ai-text';

import type {
  ImageProvider,
  AiImageRoutesConfig,
  ImageGenerateRequest,
  ImageGenerateResult,
} from '@docugenix/sanyam-ai-image';

// ── Text backend adapter ──────────────────────────────────────────────

/**
 * Wraps an ActOne TextBackend as a sanyam LlmProvider.
 *
 * sanyam routes send generic prompts (systemPrompt + userPrompt).
 * The adapter builds a minimal GenerationContext so the TextBackend's
 * buildPrompt() receives the pre-assembled prompt via the objective field,
 * with the system prompt in precedingSceneSummary.
 */
function adaptTextBackend(backend: TextBackend): LlmProvider {
  return {
    id: backend.id,
    name: backend.name,

    checkAvailability: () => backend.checkAvailability(),

    async *generate(
      ctx: GenerateContext,
    ): AsyncGenerator<SanyamStreamChunk, CompletionResult> {
      const genCtx = toGenerationContext(ctx);
      const generator = backend.generate(genCtx);
      let result;

      while (true) {
        const { value, done } = await generator.next();
        if (done) {
          result = value;
          break;
        }
        yield { text: value.text, done: false };
      }

      return {
        text: result?.fullText ?? '',
        inputTokens: 0,
        outputTokens: result?.totalTokens ?? 0,
        metadata: {
          durationMs: result?.durationMs,
          actualCostUsd: result?.actualCostUsd,
        },
      };
    },

    async estimateCost(ctx: GenerateContext) {
      const genCtx = toGenerationContext(ctx);
      const est = await backend.estimateCost(genCtx);
      return {
        inputTokens: est.estimatedTokens,
        estimatedCostUsd: est.estimatedCostUsd,
        providerId: backend.id,
      };
    },
  };
}

/** Map sanyam's generic prompt context to ActOne's domain context. */
function toGenerationContext(ctx: GenerateContext): GenerationContext {
  return {
    sceneName: '',
    sceneType: 'generic',
    location: '',
    atmosphere: [],
    objective: ctx.userPrompt,
    participants: [],
    worldRules: [],
    themeStatements: [],
    pacing: 'moderate',
    temperature: ctx.temperature,
    precedingSceneSummary: ctx.systemPrompt,
  };
}

export function createAiTextConfig(): AiTextRoutesConfig {
  return {
    getProvider: (id: string) => {
      const backend = backendRegistry.get(id);
      return backend ? adaptTextBackend(backend) : undefined;
    },
    getProviders: () =>
      backendRegistry
        .getIds()
        .map((id) => backendRegistry.get(id))
        .filter((b): b is TextBackend => !!b)
        .map(adaptTextBackend),
  };
}

// ── Image backend adapter ─────────────────────────────────────────────

function adaptImageBackend(backend: ActOneImageBackend): ImageProvider {
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

export function createAiImageConfig(): AiImageRoutesConfig {
  return {
    getProvider: (id: string) => {
      const backend = imageBackendRegistry.get(id);
      return backend ? adaptImageBackend(backend) : undefined;
    },
    getProviders: () =>
      imageBackendRegistry
        .getIds()
        .map((id) => imageBackendRegistry.get(id))
        .filter((b): b is ActOneImageBackend => !!b)
        .map(adaptImageBackend),
  };
}
