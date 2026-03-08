/**
 * Local Hono route handlers for analytics.
 * Routes: snapshot, timeseries
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '$lib/server/db.js';
import { analyticsSnapshots } from '@actone/shared/db';
import { eq, desc } from 'drizzle-orm';

export const analyticsRoutes = new Hono()

  /* POST /snapshot — Capture analytics snapshot */
  .post('/snapshot', async (c) => {
    const body = await c.req.json();
    const parsed = snapshotSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ message: `Invalid request: ${parsed.error.message}` }, 400);
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

    return c.json(
      { id: result[0]!.id, capturedAt: result[0]!.capturedAt?.toISOString() },
      201,
    );
  })

  /* GET /timeseries — Historical analytics snapshots */
  .get('/timeseries', async (c) => {
    const projectId = c.req.query('projectId');
    if (!projectId) return c.json({ message: 'Missing projectId parameter' }, 400);

    const limitParam = c.req.query('limit');
    const limit = limitParam ? Math.max(1, Math.min(parseInt(limitParam, 10) || 50, 500)) : 50;

    const snapshots = await db
      .select()
      .from(analyticsSnapshots)
      .where(eq(analyticsSnapshots.projectId, projectId))
      .orderBy(desc(analyticsSnapshots.capturedAt))
      .limit(limit);

    return c.json({ snapshots });
  });

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
