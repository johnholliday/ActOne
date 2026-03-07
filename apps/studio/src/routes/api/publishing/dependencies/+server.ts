/**
 * T123: GET /api/publishing/dependencies
 *
 * Checks if the project has sufficient content for publishing
 * per contracts/api-endpoints.md §4.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db.js';
import { draftVersions, sourceFiles, assets } from '@actone/shared/db';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  const projectId = url.searchParams.get('projectId');
  if (!projectId) {
    error(400, 'Missing projectId parameter');
  }

  // Load all drafts for this project
  const drafts = await db
    .select()
    .from(draftVersions)
    .where(eq(draftVersions.projectId, projectId));

  // Load source files to extract all scene names
  const files = await db
    .select()
    .from(sourceFiles)
    .where(eq(sourceFiles.projectId, projectId));

  const sceneNameRegex = /scene\s+"([^"]+)"/g;
  const allSceneNames = new Set<string>();
  for (const file of files) {
    let match: RegExpExecArray | null;
    while ((match = sceneNameRegex.exec(file.content)) !== null) {
      if (match[1]) allSceneNames.add(match[1]);
    }
  }

  const acceptedDrafts = drafts.filter((d) => d.status === 'accepted');
  const acceptedScenes = new Set(acceptedDrafts.map((d) => d.sceneName));

  const missingScenes = Array.from(allSceneNames).filter(
    (name) => !acceptedScenes.has(name),
  );

  const wordCount = acceptedDrafts.reduce(
    (sum, d) => sum + d.content.split(/\s+/).filter((w) => w.length > 0).length,
    0,
  );

  // Check for approved cover image
  const coverAssets = await db
    .select()
    .from(assets)
    .where(
      and(
        eq(assets.projectId, projectId),
        eq(assets.type, 'cover'),
        eq(assets.status, 'approved'),
      ),
    )
    .limit(1);

  return json({
    ready: acceptedScenes.size > 0 && missingScenes.length === 0,
    acceptedSceneCount: acceptedScenes.size,
    totalSceneCount: allSceneNames.size,
    wordCount,
    missingScenes,
    hasCoverImage: coverAssets.length > 0,
  });
};
