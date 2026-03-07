/**
 * Local Hono route handlers for draft management.
 * Routes: list, update
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '$lib/server/db.js';
import { draftVersions } from '@actone/shared/db';
import { eq, and, desc } from 'drizzle-orm';

export const draftRoutes = new Hono()

  /* GET /list — List draft versions for a project */
  .get('/list', async (c) => {
    const projectId = c.req.query('projectId');
    if (!projectId) return c.json({ message: 'Missing projectId parameter' }, 400);

    const sceneName = c.req.query('sceneName');

    const conditions = sceneName
      ? and(eq(draftVersions.projectId, projectId), eq(draftVersions.sceneName, sceneName))
      : eq(draftVersions.projectId, projectId);

    const drafts = await db
      .select()
      .from(draftVersions)
      .where(conditions)
      .orderBy(desc(draftVersions.createdAt));

    return c.json(drafts);
  })

  /* PUT /update — Update draft status */
  .put('/update', async (c) => {
    const body = await c.req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ message: `Invalid request: ${parsed.error.message}` }, 400);
    }

    const { draftId, status } = parsed.data;

    const result = await db
      .update(draftVersions)
      .set({ status })
      .where(eq(draftVersions.id, draftId))
      .returning({ id: draftVersions.id, status: draftVersions.status });

    if (result.length === 0) return c.json({ message: 'Draft not found' }, 404);

    return c.json(result[0]);
  });

const updateSchema = z.object({
  draftId: z.string().uuid(),
  status: z.enum(['pending', 'accepted', 'rejected', 'editing']),
});
