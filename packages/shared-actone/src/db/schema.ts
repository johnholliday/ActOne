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
  pgEnum,
} from 'drizzle-orm/pg-core';
import type { SchemaContribution, SchemaExtension } from '@docugenix/sanyam-db';
import {
  projects,
  projectFiles,
  ownedViaParentPolicies,
  ownedByExtensionPolicy,
} from '@docugenix/sanyam-db/schema';

// ── Re-export sanyam-db base tables ────────────────────────────────
// ActOne uses sanyam-db's `projects` and `projectFiles` directly.
// The `sourceFiles` alias preserves backward compatibility for imports.

export { projects, projectFiles };
export { projectFiles as sourceFiles };

// ── ActOne-specific enums ───────────────────────────────────────────

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

// ── ActOne Project Extension (1:1 with projects) ───────────────────
// Domain-specific columns for ActOne projects, stored in a 1:1 extension
// table that joins to the sanyam-db base `projects` table.

export const actoneProjectExt = pgTable(
  'actone_project_ext',
  {
    projectId: uuid('project_id')
      .primaryKey()
      .references(() => projects.id, { onDelete: 'cascade' }),
    authorName: text('author_name'),
    genre: text('genre'),
    compositionMode: text('composition_mode').default('merge').notNull(),
    publishingMode: text('publishing_mode').default('text').notNull(),
  },
  (table) => [
    ...ownedByExtensionPolicy('actone_project_ext', table.projectId, 'projects'),
  ],
);

// ── Snapshots ──────────────────────────────────────────────────────

export const snapshots = pgTable(
  'snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    tag: text('tag').notNull(),
    stage: text('stage').notNull(),
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
    ...ownedViaParentPolicies('snapshots', table.projectId, 'projects'),
  ],
);

// ── Snapshot Files ─────────────────────────────────────────────────

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
    ...ownedViaParentPolicies('snapshot_files', table.snapshotId, 'snapshots'),
  ],
);

// ── Assets ─────────────────────────────────────────────────────────

export const assets = pgTable(
  'assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
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
    ...ownedViaParentPolicies('assets', table.projectId, 'projects'),
  ],
);

// ── Analytics Snapshots ────────────────────────────────────────────

export const analyticsSnapshots = pgTable(
  'analytics_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
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
    ...ownedViaParentPolicies('analytics_snapshots', table.projectId, 'projects'),
  ],
);

// ── Draft Versions ─────────────────────────────────────────────────

export const draftVersions = pgTable(
  'draft_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
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
    ...ownedViaParentPolicies('draft_versions', table.projectId, 'projects'),
  ],
);

// ── Schema Extension (1:1 extension for projects) ──────────────────

export const actoneProjectExtension: SchemaExtension = {
  pluginId: 'actone',
  extends: 'projects',
  table: actoneProjectExt,
  foreignKey: actoneProjectExt.projectId,
};

// ── Schema Contribution (additional domain tables) ─────────────────
// The base `projects` and `projectFiles` tables are managed by sanyam-db.
// ActOne contributes its extension table plus domain-specific tables.

export const actOneSchemaContribution: SchemaContribution = {
  pluginId: 'actone',
  tables: [
    actoneProjectExt,
    snapshots,
    snapshotFiles,
    assets,
    analyticsSnapshots,
    draftVersions,
  ],
};
