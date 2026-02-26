/**
 * T122: GET /api/publishing/preview
 *
 * Returns HTML preview of manuscript per contracts/api-endpoints.md §4.
 */

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db.js';
import { projects, draftVersions, sourceFiles } from '@repo/shared/db';
import { eq, and } from 'drizzle-orm';
import { generateHtmlPreview } from '$lib/publishing/html-preview.js';
import { assembleManuscript } from '$lib/publishing/manuscript-assembler.js';
import type { DraftVersion } from '$lib/ai/draft-manager.js';

export const GET: RequestHandler = async ({ url }) => {
  const projectId = url.searchParams.get('projectId');
  if (!projectId) {
    error(400, 'Missing projectId parameter');
  }

  // Load project
  const projectRows = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  const project = projectRows[0];
  if (!project) {
    error(404, 'Project not found');
  }

  // Load accepted drafts
  const drafts = await db
    .select()
    .from(draftVersions)
    .where(
      and(
        eq(draftVersions.projectId, projectId),
        eq(draftVersions.status, 'accepted'),
      ),
    );

  // Load source files for scene order
  const files = await db
    .select()
    .from(sourceFiles)
    .where(eq(sourceFiles.projectId, projectId));

  const sceneNameRegex = /scene\s+"([^"]+)"/g;
  const sceneOrder: string[] = [];
  for (const file of files) {
    let match: RegExpExecArray | null;
    while ((match = sceneNameRegex.exec(file.content)) !== null) {
      if (match[1] && !sceneOrder.includes(match[1])) {
        sceneOrder.push(match[1]);
      }
    }
  }

  // Adapt DB drafts to DraftVersion interface
  const draftVersionsList: DraftVersion[] = drafts.map((d) => ({
    id: d.id,
    sceneName: d.sceneName,
    paragraphIndex: d.paragraphIndex,
    content: d.content,
    status: d.status as DraftVersion['status'],
    backend: d.backend,
    model: d.model,
    temperature: d.temperature,
    tokenCount: d.tokenCount,
    costUsd: d.costUsd,
    createdAt: d.createdAt.toISOString(),
  }));

  const manuscript = assembleManuscript(
    project.title,
    project.authorName ?? 'Unknown Author',
    draftVersionsList,
    sceneOrder,
  );

  const html = generateHtmlPreview(manuscript);

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};
