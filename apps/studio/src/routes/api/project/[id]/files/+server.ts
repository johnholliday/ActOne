/**
 * T053: POST /api/project/[id]/files
 *
 * Create or delete source files within a project.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { db } from '$lib/server/db.js';
import { projects, sourceFiles } from '@repo/shared/db';
import { eq, and } from 'drizzle-orm';

const fileOperationSchema = z.object({
  action: z.enum(['create', 'delete']),
  filePath: z.string().min(1).max(255),
  content: z.string().optional(),
  isEntry: z.boolean().optional(),
});

export const POST: RequestHandler = async ({ params, request, locals }) => {
  const { session, user } = locals;
  if (!session || !user) {
    error(401, 'Unauthorized');
  }

  const projectId = params.id;
  if (!projectId) {
    error(400, 'Missing project ID');
  }

  // Verify project exists and user owns it
  const [project] = await db
    .select({ id: projects.id, userId: projects.userId })
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) {
    error(404, 'Project not found');
  }

  if (project.userId !== user.id) {
    error(403, 'Forbidden');
  }

  const body = await request.json();
  const parsed = fileOperationSchema.safeParse(body);
  if (!parsed.success) {
    error(400, `Invalid request: ${parsed.error.message}`);
  }

  const { action, filePath, content, isEntry } = parsed.data;

  if (action === 'create') {
    // Check for duplicate file path
    const [existing] = await db
      .select({ id: sourceFiles.id })
      .from(sourceFiles)
      .where(
        and(
          eq(sourceFiles.projectId, projectId),
          eq(sourceFiles.filePath, filePath),
        ),
      );

    if (existing) {
      error(409, `File already exists: ${filePath}`);
    }

    await db.insert(sourceFiles).values({
      projectId,
      filePath,
      content: content ?? '',
      isEntry: isEntry ?? false,
    });

    // Update project modified timestamp
    await db
      .update(projects)
      .set({ modifiedAt: new Date() })
      .where(eq(projects.id, projectId));

    return json({ filePath, action: 'create' });
  }

  if (action === 'delete') {
    // Don't allow deleting the entry file
    const [file] = await db
      .select({ id: sourceFiles.id, isEntry: sourceFiles.isEntry })
      .from(sourceFiles)
      .where(
        and(
          eq(sourceFiles.projectId, projectId),
          eq(sourceFiles.filePath, filePath),
        ),
      );

    if (!file) {
      error(404, `File not found: ${filePath}`);
    }

    if (file.isEntry) {
      error(400, 'Cannot delete the entry file');
    }

    await db
      .delete(sourceFiles)
      .where(eq(sourceFiles.id, file.id));

    // Update project modified timestamp
    await db
      .update(projects)
      .set({ modifiedAt: new Date() })
      .where(eq(projects.id, projectId));

    return json({ filePath, action: 'delete' });
  }

  error(400, `Unknown action: ${action}`);
};
