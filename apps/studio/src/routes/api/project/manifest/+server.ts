/**
 * T049: GET /api/project/manifest
 *
 * Returns project metadata, file count, grammar version.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db.js';
import { projects, sourceFiles } from '@repo/shared/db';
import { eq, count } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
  const { session, user } = locals;
  if (!session || !user) {
    error(401, 'Unauthorized');
  }

  const projectId = url.searchParams.get('projectId');
  if (!projectId) {
    error(400, 'Missing projectId parameter');
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) {
    error(404, 'Project not found');
  }

  // Verify ownership
  if (project.userId !== user.id) {
    error(403, 'Forbidden');
  }

  const [fileCountResult] = await db
    .select({ count: count() })
    .from(sourceFiles)
    .where(eq(sourceFiles.projectId, projectId));

  return json({
    id: project.id,
    title: project.title,
    authorName: project.authorName,
    genre: project.genre,
    grammarVersion: project.grammarVersion,
    grammarFingerprint: project.grammarFingerprint,
    compositionMode: project.compositionMode,
    lifecycleStage: project.lifecycleStage,
    publishingMode: project.publishingMode,
    fileCount: fileCountResult?.count ?? 0,
    createdAt: project.createdAt.toISOString(),
    modifiedAt: project.modifiedAt.toISOString(),
  });
};
