/**
 * T094: PUT /api/draft/update
 *
 * Updates draft status: accept, reject, or set to editing.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { db } from '$lib/server/db.js';
import { draftVersions } from '@actone/shared/db';
import { eq } from 'drizzle-orm';

const updateSchema = z.object({
  draftId: z.string().uuid(),
  status: z.enum(['pending', 'accepted', 'rejected', 'editing']),
});

export const PUT: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    error(400, `Invalid request: ${parsed.error.message}`);
  }

  const { draftId, status } = parsed.data;

  const result = await db
    .update(draftVersions)
    .set({ status })
    .where(eq(draftVersions.id, draftId))
    .returning({ id: draftVersions.id, status: draftVersions.status });

  if (result.length === 0) {
    error(404, 'Draft not found');
  }

  return json(result[0]);
};
