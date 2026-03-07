/**
 * T102: GET /api/analytics/timeseries
 *
 * Returns historical analytics snapshots for a project per contracts/api-endpoints.md §6.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db.js';
import { analyticsSnapshots } from '@actone/shared/db';
import { eq, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  const projectId = url.searchParams.get('projectId');
  if (!projectId) {
    error(400, 'Missing projectId parameter');
  }

  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Math.max(1, Math.min(parseInt(limitParam, 10) || 50, 500)) : 50;

  const snapshots = await db
    .select()
    .from(analyticsSnapshots)
    .where(eq(analyticsSnapshots.projectId, projectId))
    .orderBy(desc(analyticsSnapshots.capturedAt))
    .limit(limit);

  return json({ snapshots });
};
