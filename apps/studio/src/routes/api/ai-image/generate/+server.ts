/**
 * T108: POST /api/ai-image/generate
 *
 * Builds image prompts from AST data and dispatches to selected image backend
 * per contracts/api-endpoints.md §2.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { db } from '$lib/server/db.js';
import { assets } from '@repo/shared/db';
import { imageBackendRegistry } from '$lib/server/image-backends.js';

const generateImageSchema = z.object({
  projectId: z.string().uuid(),
  type: z.enum(['portrait', 'scene', 'cover', 'style-board', 'chapter-header', 'panel']),
  name: z.string().min(1),
  backendId: z.string().min(1),
  characterName: z.string().optional(),
  sceneName: z.string().optional(),
  panelIndex: z.number().int().optional(),
  pageIndex: z.number().int().optional(),
  prompt: z.string().min(1).optional(),
  width: z.number().int().min(256).max(4096).optional(),
  height: z.number().int().min(256).max(4096).optional(),
  referenceImageUrl: z.string().url().optional(),
});

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const parsed = generateImageSchema.safeParse(body);

  if (!parsed.success) {
    error(400, `Invalid request: ${parsed.error.message}`);
  }

  const backend = imageBackendRegistry.get(parsed.data.backendId);
  if (!backend) {
    error(400, `Unknown backend: ${parsed.data.backendId}`);
  }

  const availability = await backend.checkAvailability();
  if (!availability.available) {
    error(503, `Backend "${parsed.data.backendId}" is not available: ${availability.error ?? 'unavailable'}`);
  }

  // Create asset record first (pending status)
  const assetRows = await db
    .insert(assets)
    .values({
      projectId: parsed.data.projectId,
      type: parsed.data.type,
      name: parsed.data.name,
      prompt: parsed.data.prompt ?? '',
      backend: parsed.data.backendId,
      status: 'pending',
      metadata: {
        width: parsed.data.width ?? 1024,
        height: parsed.data.height ?? 1024,
        characterName: parsed.data.characterName,
        sceneName: parsed.data.sceneName,
        panelIndex: parsed.data.panelIndex,
        pageIndex: parsed.data.pageIndex,
      },
    })
    .returning();

  const asset = assetRows[0]!;

  // Dispatch to backend for actual generation
  try {
    const result = await backend.generate(parsed.data.prompt ?? '', {
      width: parsed.data.width,
      height: parsed.data.height,
      referenceImageUrl: parsed.data.referenceImageUrl,
    });

    return json(
      {
        assetId: asset.id,
        prompt: parsed.data.prompt ?? '',
        status: 'pending' as const,
        storageUrl: result.imageUrl,
      },
      { status: 200 },
    );
  } catch (e) {
    return json(
      {
        assetId: asset.id,
        prompt: parsed.data.prompt ?? '',
        status: 'pending' as const,
        storageUrl: '',
        error: e instanceof Error ? e.message : 'Generation failed',
      },
      { status: 200 },
    );
  }
};
