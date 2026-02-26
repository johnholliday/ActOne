/**
 * T093: GET /api/draft/list
 *
 * Lists draft versions for a project, optionally filtered by scene.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db.js';
import { draftVersions } from '@repo/shared/db';
import { eq, and, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  const projectId = url.searchParams.get('projectId');
  if (!projectId) {
    error(400, 'Missing projectId parameter');
  }

  const sceneName = url.searchParams.get('sceneName');

  const conditions = sceneName
    ? and(
        eq(draftVersions.projectId, projectId),
        eq(draftVersions.sceneName, sceneName),
      )
    : eq(draftVersions.projectId, projectId);

  const drafts = await db
    .select()
    .from(draftVersions)
    .where(conditions)
    .orderBy(desc(draftVersions.createdAt));

  return json(drafts);
};
