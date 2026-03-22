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

// ── Re-export sanyam-projects tables ─────────────────────────────────
// Snapshots and analytics tables are now owned by @docugenix/sanyam-projects.

export {
  projectSnapshots,
  projectSnapshotFiles,
  projectAnalytics,
} from '@docugenix/sanyam-projects/schema';

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

// ── Conversations ────────────────────────────────────────────────────

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    title: text('title'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('conversations_project_id_idx').on(table.projectId),
    index('conversations_user_id_idx').on(table.userId),
  ],
);

// ── Chat Messages ────────────────────────────────────────────────────

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // 'user' | 'assistant' | 'system'
    content: text('content').notNull(),
    tokenCount: integer('token_count'),
    toolCalls: jsonb('tool_calls'),
    modelUsed: text('model_used'),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    durationMs: integer('duration_ms'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('chat_messages_conversation_id_idx').on(table.conversationId),
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
// Snapshots and analytics tables are managed by sanyam-projects.
// ActOne contributes its extension table plus domain-specific tables.

export const actOneSchemaContribution: SchemaContribution = {
  pluginId: 'actone',
  tables: [
    actoneProjectExt,
    assets,
    draftVersions,
    conversations,
    chatMessages,
  ],
};
