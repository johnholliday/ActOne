import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
  pgPolicy,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { authenticatedRole } from 'drizzle-orm/supabase';
import { projects as baseProjects, sourceFiles as baseSourceFiles } from '@docugenix/sanyam-db/schema';
import type { SchemaContribution } from '@docugenix/sanyam-db';

// ── Re-export base tables from sanyam-db ────────────────────────────────
// These provide projects (userId, title, createdAt, modifiedAt) and
// source_files (projectId, filePath, content, isEntry) with RLS policies.

export { projects, sourceFiles } from '@docugenix/sanyam-db/schema';

// ── ActOne-specific enums ───────────────────────────────────────────────

export const compositionModeEnum = pgEnum('composition_mode', [
  'merge',
  'overlay',
  'sequential',
]);

export const lifecycleStageEnum = pgEnum('lifecycle_stage', [
  'concept',
  'draft',
  'revision',
  'final',
  'published',
]);

export const publishingModeEnum = pgEnum('publishing_mode', [
  'text',
  'graphic-novel',
]);

export const assetTypeEnum = pgEnum('asset_type', [
  'portrait',
  'cover',
  'scene',
  'style-board',
  'chapter-header',
  'panel',
]);

export const assetStatusEnum = pgEnum('asset_status', [
  'pending',
  'approved',
  'rejected',
]);

export const draftStatusEnum = pgEnum('draft_status', [
  'pending',
  'accepted',
  'rejected',
  'editing',
]);

// ── Snapshots ──────────────────────────────────────────────────────────

export const snapshots = pgTable(
  'snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => baseProjects.id, { onDelete: 'cascade' }),
    tag: text('tag').notNull(),
    stage: lifecycleStageEnum('stage').notNull(),
    wordCount: integer('word_count').default(0),
    sceneCount: integer('scene_count').default(0),
    characterCount: integer('character_count').default(0),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('snapshots_project_id_idx').on(table.projectId),
    pgPolicy('users_access_project_snapshots', {
      for: 'all',
      to: authenticatedRole,
      using: sql`${table.projectId} in (select id from projects where user_id = (select auth.uid()))`,
      withCheck: sql`${table.projectId} in (select id from projects where user_id = (select auth.uid()))`,
    }),
  ],
);

// ── Snapshot Files ─────────────────────────────────────────────────────

export const snapshotFiles = pgTable(
  'snapshot_files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    snapshotId: uuid('snapshot_id')
      .notNull()
      .references(() => snapshots.id, { onDelete: 'cascade' }),
    filePath: text('file_path').notNull(),
    content: text('content').notNull(),
  },
  (table) => [
    pgPolicy('users_access_snapshot_files', {
      for: 'all',
      to: authenticatedRole,
      using: sql`${table.snapshotId} in (select s.id from snapshots s join projects p on s.project_id = p.id where p.user_id = (select auth.uid()))`,
      withCheck: sql`${table.snapshotId} in (select s.id from snapshots s join projects p on s.project_id = p.id where p.user_id = (select auth.uid()))`,
    }),
  ],
);

// ── Assets ─────────────────────────────────────────────────────────────

export const assets = pgTable(
  'assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => baseProjects.id, { onDelete: 'cascade' }),
    type: assetTypeEnum('type').notNull(),
    name: text('name').notNull(),
    status: assetStatusEnum('status').default('pending').notNull(),
    prompt: text('prompt'),
    backend: text('backend'),
    metadata: jsonb('metadata').default('{}'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('assets_project_id_idx').on(table.projectId),
    index('assets_type_idx').on(table.type),
    pgPolicy('users_access_project_assets', {
      for: 'all',
      to: authenticatedRole,
      using: sql`${table.projectId} in (select id from projects where user_id = (select auth.uid()))`,
      withCheck: sql`${table.projectId} in (select id from projects where user_id = (select auth.uid()))`,
    }),
  ],
);

// ── Analytics Snapshots ────────────────────────────────────────────────

export const analyticsSnapshots = pgTable(
  'analytics_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => baseProjects.id, { onDelete: 'cascade' }),
    wordCount: integer('word_count').default(0),
    sceneCount: integer('scene_count').default(0),
    characterCount: integer('character_count').default(0),
    metrics: jsonb('metrics').default('{}'),
    capturedAt: timestamp('captured_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('analytics_project_id_idx').on(table.projectId),
    pgPolicy('users_access_project_analytics', {
      for: 'all',
      to: authenticatedRole,
      using: sql`${table.projectId} in (select id from projects where user_id = (select auth.uid()))`,
      withCheck: sql`${table.projectId} in (select id from projects where user_id = (select auth.uid()))`,
    }),
  ],
);

// ── Draft Versions ─────────────────────────────────────────────────────

export const draftVersions = pgTable(
  'draft_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => baseProjects.id, { onDelete: 'cascade' }),
    sceneName: text('scene_name').notNull(),
    paragraphIndex: integer('paragraph_index').notNull(),
    content: text('content').notNull(),
    status: draftStatusEnum('status').default('pending').notNull(),
    backend: text('backend'),
    model: text('model'),
    temperature: real('temperature'),
    tokenCount: integer('token_count'),
    costUsd: real('cost_usd'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('drafts_project_scene_idx').on(table.projectId, table.sceneName),
    pgPolicy('users_access_project_drafts', {
      for: 'all',
      to: authenticatedRole,
      using: sql`${table.projectId} in (select id from projects where user_id = (select auth.uid()))`,
      withCheck: sql`${table.projectId} in (select id from projects where user_id = (select auth.uid()))`,
    }),
  ],
);

// ── Schema Contribution ────────────────────────────────────────────────
// Register ActOne's domain tables as extensions to sanyam-db's base schema.

export const actOneSchemaContribution: SchemaContribution = {
  id: 'actone',
  tables: {
    snapshots,
    snapshotFiles,
    assets,
    analyticsSnapshots,
    draftVersions,
  },
  enums: {
    compositionModeEnum,
    lifecycleStageEnum,
    publishingModeEnum,
    assetTypeEnum,
    assetStatusEnum,
    draftStatusEnum,
  },
};
