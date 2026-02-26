/**
 * T101: POST /api/analytics/snapshot
 *
 * Captures an analytics snapshot with metrics per contracts/api-endpoints.md §6.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { db } from '$lib/server/db.js';
import { analyticsSnapshots } from '@repo/shared/db';

const snapshotSchema = z.object({
  projectId: z.string().uuid(),
  wordCount: z.number().int().min(0),
  sceneCount: z.number().int().min(0),
  characterCount: z.number().int().min(0),
  metrics: z.object({
    sceneTypeDistribution: z.record(z.number()),
    characterScreenTime: z.record(z.number()),
    pacingRhythm: z.array(z.string()),
  }),
});

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const parsed = snapshotSchema.safeParse(body);

  if (!parsed.success) {
    error(400, `Invalid request: ${parsed.error.message}`);
  }

  const result = await db
    .insert(analyticsSnapshots)
    .values({
      projectId: parsed.data.projectId,
      wordCount: parsed.data.wordCount,
      sceneCount: parsed.data.sceneCount,
      characterCount: parsed.data.characterCount,
      metrics: parsed.data.metrics,
    })
    .returning();

  return json(
    { id: result[0]!.id, capturedAt: result[0]!.capturedAt?.toISOString() },
    { status: 201 },
  );
};
