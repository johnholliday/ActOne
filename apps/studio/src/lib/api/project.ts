/**
 * Local Hono route handlers for project management.
 * Routes: create, lifecycle, manifest, [id]/files
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '$lib/server/db.js';
import { projects, projectFiles, actoneProjectExt, snapshots, snapshotFiles } from '@actone/shared/db';
import { eq, and, count } from 'drizzle-orm';
import archiver from 'archiver';
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

    const { title, authorName, genre, compositionMode, publishingMode, additionalFiles } = parsed.data;

    // If additional files are provided (from AI import), use them instead of skeleton
    const hasImportedFiles = additionalFiles && additionalFiles.length > 0;
    const entryFilePath = hasImportedFiles
      ? (additionalFiles.find((f) => f.filePath === 'story.actone')?.filePath ?? additionalFiles[0]!.filePath)
      : generateEntryFilePath(title);
    const entryContent = hasImportedFiles
      ? undefined  // Content comes from additionalFiles
      : generateEntrySkeleton(title, authorName);

    // Insert into sanyam-db base projects table
    const [project] = await db
      .insert(projects)
      .values({
        userId: user.id,
        name: title,
        lifecyclePhase: 'concept',
      })
      .returning({ id: projects.id, name: projects.name });

    if (!project) {
      return c.json({ message: 'Failed to create project' }, 500);
    }

    // Insert ActOne extension row with domain-specific columns
    await db.insert(actoneProjectExt).values({
      projectId: project.id,
      authorName: authorName ?? null,
      genre: genre ?? null,
      compositionMode: compositionMode ?? 'merge',
      publishingMode: publishingMode ?? 'text',
    });

    if (hasImportedFiles) {
      // Insert all imported files — mark the entry file
      const fileValues = additionalFiles.map((f) => ({
        projectId: project.id,
        filePath: f.filePath,
        content: f.content,
        isEntry: f.filePath === entryFilePath,
      }));
      await db.insert(projectFiles).values(fileValues);
    } else {
      // Insert default skeleton entry file
      await db.insert(projectFiles).values({
        projectId: project.id,
        filePath: entryFilePath,
        content: entryContent!,
        isEntry: true,
      });
    }

    return c.json({ id: project.id, title: project.name, entryFilePath }, 201);
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

    const currentStage = project.lifecyclePhase as LifecycleStage;

    if (!isValidTransition(currentStage, targetStage)) {
      return c.json({ message: `Invalid transition from ${currentStage} to ${targetStage}` }, 400);
    }
    if (currentStage === targetStage) {
      return c.json({ message: `Project is already at stage: ${targetStage}` }, 409);
    }

    const files = await db
      .select({ filePath: projectFiles.filePath, content: projectFiles.content })
      .from(projectFiles)
      .where(eq(projectFiles.projectId, projectId));

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
      .set({ lifecyclePhase: targetStage, updatedAt: new Date() })
      .where(eq(projects.id, projectId));

    return c.json({ previousStage: currentStage, currentStage: targetStage, snapshotId: snapshot.id });
  })

  /* GET /manifest — Return project metadata */
  .get('/manifest', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ message: 'Unauthorized' }, 401);

    const projectId = c.req.query('projectId');
    if (!projectId) return c.json({ message: 'Missing projectId parameter' }, 400);

    const [project] = await db
      .select()
      .from(projects)
      .leftJoin(actoneProjectExt, eq(projects.id, actoneProjectExt.projectId))
      .where(eq(projects.id, projectId));

    if (!project) return c.json({ message: 'Project not found' }, 404);
    if (project.projects.userId !== user.id) return c.json({ message: 'Forbidden' }, 403);

    const ext = project.actone_project_ext;

    const [fileCountResult] = await db
      .select({ count: count() })
      .from(projectFiles)
      .where(eq(projectFiles.projectId, projectId));

    return c.json({
      id: project.projects.id,
      title: project.projects.name,
      authorName: ext?.authorName ?? null,
      genre: ext?.genre ?? null,
      grammarVersion: project.projects.grammarVersion,
      grammarFingerprint: project.projects.grammarFingerprint,
      compositionMode: ext?.compositionMode ?? 'merge',
      lifecycleStage: project.projects.lifecyclePhase,
      publishingMode: ext?.publishingMode ?? 'text',
      fileCount: fileCountResult?.count ?? 0,
      createdAt: project.projects.createdAt.toISOString(),
      modifiedAt: project.projects.updatedAt.toISOString(),
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
        .select({ id: projectFiles.id })
        .from(projectFiles)
        .where(and(eq(projectFiles.projectId, projectId), eq(projectFiles.filePath, filePath)));

      if (existing) return c.json({ message: `File already exists: ${filePath}` }, 409);

      await db.insert(projectFiles).values({
        projectId,
        filePath,
        content: content ?? '',
        isEntry: isEntry ?? false,
      });

      await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId));
      return c.json({ filePath, action: 'create' });
    }

    if (action === 'delete') {
      const [file] = await db
        .select({ id: projectFiles.id, isEntry: projectFiles.isEntry })
        .from(projectFiles)
        .where(and(eq(projectFiles.projectId, projectId), eq(projectFiles.filePath, filePath)));

      if (!file) return c.json({ message: `File not found: ${filePath}` }, 404);
      if (file.isEntry) return c.json({ message: 'Cannot delete the entry file' }, 400);

      await db.delete(projectFiles).where(eq(projectFiles.id, file.id));
      await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId));
      return c.json({ filePath, action: 'delete' });
    }

    return c.json({ message: `Unknown action: ${action}` }, 400);
  })

  /* GET /:id/download — Download all project files as a .zip */
  .get('/:id/download', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ message: 'Unauthorized' }, 401);

    const projectId = c.req.param('id');

    const [project] = await db
      .select({ id: projects.id, userId: projects.userId, name: projects.name })
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) return c.json({ message: 'Project not found' }, 404);
    if (project.userId !== user.id) return c.json({ message: 'Forbidden' }, 403);

    const files = await db
      .select({ filePath: projectFiles.filePath, content: projectFiles.content })
      .from(projectFiles)
      .where(eq(projectFiles.projectId, projectId));

    if (files.length === 0) return c.json({ message: 'No files to download' }, 404);

    // Build zip in memory using archiver
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Uint8Array[] = [];

    archive.on('data', (chunk: Buffer) => chunks.push(new Uint8Array(chunk)));

    for (const file of files) {
      archive.append(file.content, { name: file.filePath });
    }

    await archive.finalize();

    const blob = new Blob(chunks, { type: 'application/zip' });
    const safeName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_');

    return new Response(blob, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeName}.zip"`,
      },
    });
  });

/* ── Validation schemas ──────────────────────────────────────────── */

const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  authorName: z.string().max(200).optional(),
  genre: z.string().max(100).optional(),
  compositionMode: z.enum(['merge', 'overlay', 'sequential']).optional(),
  publishingMode: z.enum(['text', 'graphic-novel']).optional(),
  /** Additional files to create alongside the entry file (from AI import) */
  additionalFiles: z.array(z.object({
    filePath: z.string().min(1).max(255),
    content: z.string(),
  })).optional(),
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
