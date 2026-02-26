/**
 * T048: POST /api/project/create
 *
 * Creates a new project with an entry .actone file.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { db } from '$lib/server/db.js';
import { projects, sourceFiles } from '@repo/shared/db';
import {
  generateEntrySkeleton,
  generateEntryFilePath,
} from '$lib/project/creation-wizard.js';

const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  authorName: z.string().max(200).optional(),
  genre: z.string().max(100).optional(),
  compositionMode: z.enum(['merge', 'overlay', 'sequential']).optional(),
  publishingMode: z.enum(['text', 'graphic-novel']).optional(),
});

export const POST: RequestHandler = async ({ request, locals }) => {
  const { session, user } = locals;
  if (!session || !user) {
    error(401, 'Unauthorized');
  }

  const body = await request.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    error(400, `Invalid request: ${parsed.error.message}`);
  }

  const { title, authorName, genre, compositionMode, publishingMode } =
    parsed.data;

  const entryFilePath = generateEntryFilePath(title);
  const entryContent = generateEntrySkeleton(title, authorName);

  // Create project and entry file in a transaction
  const [project] = await db
    .insert(projects)
    .values({
      userId: user.id,
      title,
      authorName: authorName ?? null,
      genre: genre ?? null,
      compositionMode: compositionMode ?? 'merge',
      publishingMode: publishingMode ?? 'text',
    })
    .returning({ id: projects.id, title: projects.title });

  if (!project) {
    error(500, 'Failed to create project');
  }

  await db.insert(sourceFiles).values({
    projectId: project.id,
    filePath: entryFilePath,
    content: entryContent,
    isEntry: true,
  });

  return json(
    {
      id: project.id,
      title: project.title,
      entryFilePath,
    },
    { status: 201 },
  );
};
