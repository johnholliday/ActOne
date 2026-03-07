/**
 * Local Hono route handlers for project management.
 * Routes: create, lifecycle, manifest, [id]/files
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '$lib/server/db.js';
import { projects, sourceFiles, snapshots, snapshotFiles } from '@actone/shared/db';
import { eq, and, count } from 'drizzle-orm';
import { isValidTransition } from '@actone/shared';
import type { LifecycleStage } from '@actone/shared';
import {
  generateEntrySkeleton,
  generateEntryFilePath,
} from '$lib/project/creation-wizard.js';
import { generateSnapshotTag, aggregateStats } from '$lib/project/snapshots.js';

export const projectRoutes = new Hono()

  /* POST /create — Create a new project with entry .actone file */
  .post('/create', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ message: 'Unauthorized' }, 401);

    const body = await c.req.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ message: `Invalid request: ${parsed.error.message}` }, 400);
    }

    const { title, authorName, genre, compositionMode, publishingMode } = parsed.data;
    const entryFilePath = generateEntryFilePath(title);
    const entryContent = generateEntrySkeleton(title, authorName);

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
      return c.json({ message: 'Failed to create project' }, 500);
    }

    await db.insert(sourceFiles).values({
      projectId: project.id,
      filePath: entryFilePath,
      content: entryContent,
      isEntry: true,
    });

    return c.json({ id: project.id, title: project.title, entryFilePath }, 201);
  })

  /* POST /lifecycle — Advance lifecycle stage, capture snapshot */
  .post('/lifecycle', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ message: 'Unauthorized' }, 401);

    const body = await c.req.json();
    const parsed = lifecycleSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ message: `Invalid request: ${parsed.error.message}` }, 400);
    }

    const { projectId, targetStage, notes } = parsed.data;

    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return c.json({ message: 'Project not found' }, 404);
    if (project.userId !== user.id) return c.json({ message: 'Forbidden' }, 403);

    const currentStage = project.lifecycleStage as LifecycleStage;

    if (!isValidTransition(currentStage, targetStage)) {
      return c.json({ message: `Invalid transition from ${currentStage} to ${targetStage}` }, 400);
    }
    if (currentStage === targetStage) {
      return c.json({ message: `Project is already at stage: ${targetStage}` }, 409);
    }

    const files = await db
      .select({ filePath: sourceFiles.filePath, content: sourceFiles.content })
      .from(sourceFiles)
      .where(eq(sourceFiles.projectId, projectId));

    const stats = aggregateStats(files);
    const tag = generateSnapshotTag(currentStage);

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

    if (!snapshot) return c.json({ message: 'Failed to create snapshot' }, 500);

    if (files.length > 0) {
      await db.insert(snapshotFiles).values(
        files.map((f) => ({
          snapshotId: snapshot.id,
          filePath: f.filePath,
          content: f.content,
        })),
      );
    }

    await db
      .update(projects)
      .set({ lifecycleStage: targetStage, modifiedAt: new Date() })
      .where(eq(projects.id, projectId));

    return c.json({ previousStage: currentStage, currentStage: targetStage, snapshotId: snapshot.id });
  })

  /* GET /manifest — Return project metadata */
  .get('/manifest', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ message: 'Unauthorized' }, 401);

    const projectId = c.req.query('projectId');
    if (!projectId) return c.json({ message: 'Missing projectId parameter' }, 400);

    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return c.json({ message: 'Project not found' }, 404);
    if (project.userId !== user.id) return c.json({ message: 'Forbidden' }, 403);

    const [fileCountResult] = await db
      .select({ count: count() })
      .from(sourceFiles)
      .where(eq(sourceFiles.projectId, projectId));

    return c.json({
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
  })

  /* POST /:id/files — Create or delete source files */
  .post('/:id/files', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ message: 'Unauthorized' }, 401);

    const projectId = c.req.param('id');

    const [project] = await db
      .select({ id: projects.id, userId: projects.userId })
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) return c.json({ message: 'Project not found' }, 404);
    if (project.userId !== user.id) return c.json({ message: 'Forbidden' }, 403);

    const body = await c.req.json();
    const parsed = fileOperationSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ message: `Invalid request: ${parsed.error.message}` }, 400);
    }

    const { action, filePath, content, isEntry } = parsed.data;

    if (action === 'create') {
      const [existing] = await db
        .select({ id: sourceFiles.id })
        .from(sourceFiles)
        .where(and(eq(sourceFiles.projectId, projectId), eq(sourceFiles.filePath, filePath)));

      if (existing) return c.json({ message: `File already exists: ${filePath}` }, 409);

      await db.insert(sourceFiles).values({
        projectId,
        filePath,
        content: content ?? '',
        isEntry: isEntry ?? false,
      });

      await db.update(projects).set({ modifiedAt: new Date() }).where(eq(projects.id, projectId));
      return c.json({ filePath, action: 'create' });
    }

    if (action === 'delete') {
      const [file] = await db
        .select({ id: sourceFiles.id, isEntry: sourceFiles.isEntry })
        .from(sourceFiles)
        .where(and(eq(sourceFiles.projectId, projectId), eq(sourceFiles.filePath, filePath)));

      if (!file) return c.json({ message: `File not found: ${filePath}` }, 404);
      if (file.isEntry) return c.json({ message: 'Cannot delete the entry file' }, 400);

      await db.delete(sourceFiles).where(eq(sourceFiles.id, file.id));
      await db.update(projects).set({ modifiedAt: new Date() }).where(eq(projects.id, projectId));
      return c.json({ filePath, action: 'delete' });
    }

    return c.json({ message: `Unknown action: ${action}` }, 400);
  });

/* ── Validation schemas ──────────────────────────────────────────── */

const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  authorName: z.string().max(200).optional(),
  genre: z.string().max(100).optional(),
  compositionMode: z.enum(['merge', 'overlay', 'sequential']).optional(),
  publishingMode: z.enum(['text', 'graphic-novel']).optional(),
});

const lifecycleSchema = z.object({
  projectId: z.string().uuid(),
  targetStage: z.enum(['draft', 'revision', 'final', 'published']),
  notes: z.string().max(500).optional(),
});

const fileOperationSchema = z.object({
  action: z.enum(['create', 'delete']),
  filePath: z.string().min(1).max(255),
  content: z.string().optional(),
  isEntry: z.boolean().optional(),
});
