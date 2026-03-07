/**
 * T052: POST /api/project/lifecycle
 *
 * Advances lifecycle stage, validates transition, captures snapshot.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { db } from '$lib/server/db.js';
import { projects, sourceFiles, snapshots, snapshotFiles } from '@actone/shared/db';
import { eq } from 'drizzle-orm';
import { isValidTransition } from '@actone/shared';
import type { LifecycleStage } from '@actone/shared';
import { generateSnapshotTag, aggregateStats } from '$lib/project/snapshots.js';

const lifecycleSchema = z.object({
  projectId: z.string().uuid(),
  targetStage: z.enum(['draft', 'revision', 'final', 'published']),
  notes: z.string().max(500).optional(),
});

export const POST: RequestHandler = async ({ request, locals }) => {
  const { session, user } = locals;
  if (!session || !user) {
    error(401, 'Unauthorized');
  }

  const body = await request.json();
  const parsed = lifecycleSchema.safeParse(body);
  if (!parsed.success) {
    error(400, `Invalid request: ${parsed.error.message}`);
  }

  const { projectId, targetStage, notes } = parsed.data;

  // Fetch project
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) {
    error(404, 'Project not found');
  }

  if (project.userId !== user.id) {
    error(403, 'Forbidden');
  }

  const currentStage = project.lifecycleStage as LifecycleStage;

  // Validate transition
  if (!isValidTransition(currentStage, targetStage)) {
    error(400, `Invalid transition from ${currentStage} to ${targetStage}`);
  }

  // Already at target
  if (currentStage === targetStage) {
    error(409, `Project is already at stage: ${targetStage}`);
  }

  // Fetch all source files for snapshot
  const files = await db
    .select({ filePath: sourceFiles.filePath, content: sourceFiles.content })
    .from(sourceFiles)
    .where(eq(sourceFiles.projectId, projectId));

  const stats = aggregateStats(files);
  const tag = generateSnapshotTag(currentStage);

  // Create snapshot
  const [snapshot] = await db
    .insert(snapshots)
    .values({
      projectId,
      tag,
      stage: currentStage,
      wordCount: stats.wordCount,
      sceneCount: stats.sceneCount,
      characterCount: stats.characterCount,
      notes: notes ?? null,
    })
    .returning({ id: snapshots.id });

  if (!snapshot) {
    error(500, 'Failed to create snapshot');
  }

  // Save snapshot files
  if (files.length > 0) {
    await db.insert(snapshotFiles).values(
      files.map((f) => ({
        snapshotId: snapshot.id,
        filePath: f.filePath,
        content: f.content,
      })),
    );
  }

  // Update project stage
  await db
    .update(projects)
    .set({
      lifecycleStage: targetStage,
      modifiedAt: new Date(),
    })
    .where(eq(projects.id, projectId));

  return json({
    previousStage: currentStage,
    currentStage: targetStage,
    snapshotId: snapshot.id,
  });
};
