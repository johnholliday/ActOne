# `@docugenix/sanyam-project` — Project Management Package Specification

## 1. Overview

A reusable Hono-based project management package that provides server-side API routes, database operations, and shared types for managing multi-file grammar projects within the Sanyam ecosystem.

**Scope**: CRUD operations, file management, lifecycle transitions, snapshot capture, analytics, project download, and workspace persistence types. The package builds on `sanyam-db`'s base `projects` and `projectFiles` tables, adding routes and lifecycle logic that any Sanyam app can use or extend.

**Out of scope**: Client-side stores (Svelte-specific), UI components, grammar-specific skeleton generation, AI chat, AI import, asset management, draft versioning, publishing. These remain in the consuming app or in their own packages.

---

## 2. Dependencies

| Package | Role |
|---------|------|
| `hono` | Route definitions |
| `zod` | Request validation |
| `@hono/zod-validator` | Hono + Zod integration |
| `drizzle-orm` | Query building |
| `archiver` | ZIP download generation |
| `@docugenix/sanyam-db` | Base `projects` / `projectFiles` tables, RLS helpers, DB client |
| `@docugenix/sanyam-shared` | String utilities |

---

## 3. Package Exports

```
@docugenix/sanyam-project
├── index.ts              — createProjectRoutes(), types
├── routes/
│   ├── create.ts         — POST /create
│   ├── manifest.ts       — GET /manifest
│   ├── lifecycle.ts      — POST /lifecycle
│   ├── files.ts          — POST /:id/files, PUT /:id/files/:fileId/rename
│   ├── download.ts       — GET /:id/download
│   ├── analytics.ts      — POST /analytics/snapshot, GET /analytics/timeseries
│   └── list.ts           — GET /list
├── services/
│   ├── lifecycle.ts       — transition validation, stage labels
│   ├── snapshots.ts       — snapshot creation, tag generation
│   └── stats.ts           — word/element counting
├── schema/
│   ├── snapshots.ts       — snapshots + snapshotFiles tables
│   ├── analytics.ts       — analyticsSnapshots table
│   └── index.ts           — SchemaContribution export
└── types.ts               — shared types
```

---

## 4. Types

### 4.1 Lifecycle

```typescript
type LifecycleStage = 'concept' | 'draft' | 'revision' | 'final' | 'published';

interface LifecycleTransition {
  from: LifecycleStage;
  to: LifecycleStage;
}

const VALID_TRANSITIONS: readonly LifecycleTransition[];

function isValidTransition(from: LifecycleStage, to: LifecycleStage): boolean;
function getValidTargets(from: LifecycleStage): LifecycleStage[];
function getStageLabel(stage: LifecycleStage): string;
```

These are **generic** lifecycle types. The stage names and transitions are framework-level defaults that cover the typical concept-to-published workflow. Apps that need different stages can extend or override.

### 4.2 Project Metadata

```typescript
/** Fields from the base sanyam-db projects table */
interface ProjectBase {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  lifecyclePhase: string;
  grammarVersion: string | null;
  grammarFingerprint: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

/** File within a project */
interface ProjectFile {
  id: string;
  projectId: string;
  filePath: string;
  content: string;
  contentHash: string | null;
  isEntry: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.3 Route Config

```typescript
interface ProjectRouteConfig {
  /** Drizzle database instance (or transaction-scoped client) */
  db: DrizzleClient;

  /**
   * Resolve user ID from Hono context.
   * Default: reads `x-user-id` header (set by sanyam-auth middleware).
   */
  getUserId?: (c: Context) => string | null;

  /**
   * Optional hook: generate the initial file content for a new project.
   * Receives the project title and optional metadata.
   * If not provided, creates an empty file with a comment header.
   */
  generateEntrySkeleton?: (title: string, metadata?: Record<string, unknown>) => string;

  /**
   * Optional hook: compute the entry file path for a new project.
   * Default: returns a slugified version of the title + grammar extension.
   */
  generateEntryFilePath?: (title: string) => string;

  /**
   * Grammar file extension (without dot). Default: 'txt'.
   * Used in default entry file path generation.
   */
  fileExtension?: string;

  /**
   * Schema extension table (1:1 with projects) for domain-specific columns.
   * If provided, the create route will insert a row into this table
   * using the `extensionData` field from the request body.
   */
  extensionTable?: {
    table: PgTableWithColumns<any>;
    projectIdColumn: PgColumn<any>;
  };

  /**
   * Zod schema for validating the `extensionData` field in create requests.
   * Required if `extensionTable` is provided.
   */
  extensionSchema?: z.ZodType<Record<string, unknown>>;

  /**
   * Optional hook: extract statistics from file content for snapshots.
   * Default implementation counts words only.
   * Apps should override to count grammar-specific elements (scenes, characters, etc.).
   */
  aggregateStats?: (files: Array<{ filePath: string; content: string }>) => ProjectStats;

  /**
   * Maximum number of files per project. Default: 20.
   */
  maxFilesPerProject?: number;

  /**
   * Maximum number of projects returned by the list endpoint. Default: 50.
   */
  maxProjectListSize?: number;
}
```

### 4.4 Statistics

```typescript
interface ProjectStats {
  wordCount: number;
  /** App-defined counters (e.g., sceneCount, characterCount) */
  [key: string]: number;
}

interface SnapshotRecord {
  id: string;
  projectId: string;
  tag: string;
  stage: string;
  wordCount: number;
  notes: string | null;
  /** App-defined stat columns stored in metadata */
  metadata: Record<string, number>;
  createdAt: Date;
}
```

### 4.5 Workspace (client-side type only — no runtime code)

```typescript
/** Persisted workspace state shape for client-side stores */
interface WorkspaceState {
  openProjectIds: string[];
  activeProjectId: string | null;
}
```

---

## 5. Database Schema

### 5.1 Tables Owned by This Package

The package defines **two tables** via `SchemaContribution`. The base `projects` and `projectFiles` tables remain in `sanyam-db`.

#### `project_snapshots`

Captures a frozen state of the project at lifecycle transitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default random | |
| `project_id` | uuid | FK → projects.id, cascade, NOT NULL | |
| `tag` | text | NOT NULL | Human-readable tag, e.g. `draft-2026-03-13-120530` |
| `stage` | text | NOT NULL | Lifecycle stage at time of snapshot |
| `word_count` | integer | default 0 | |
| `metadata` | jsonb | default `{}` | App-defined stats (sceneCount, characterCount, etc.) |
| `notes` | text | nullable | User-provided notes for this transition |
| `created_at` | timestamptz | NOT NULL, default now() | |

Indexes: `project_id`
RLS: `ownedViaParentPolicies('project_snapshots', project_id, 'projects')`

#### `project_snapshot_files`

Full file contents frozen at snapshot time.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default random | |
| `snapshot_id` | uuid | FK → project_snapshots.id, cascade, NOT NULL | |
| `file_path` | text | NOT NULL | |
| `content` | text | NOT NULL | |

RLS: `ownedViaParentPolicies('project_snapshot_files', snapshot_id, 'project_snapshots')`

#### `project_analytics`

Time-series analytics captures for tracking project progress over time.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default random | |
| `project_id` | uuid | FK → projects.id, cascade, NOT NULL | |
| `word_count` | integer | default 0 | |
| `metrics` | jsonb | default `{}` | App-defined metrics blob |
| `captured_at` | timestamptz | NOT NULL, default now() | |

Indexes: `project_id`
RLS: `ownedViaParentPolicies('project_analytics', project_id, 'projects')`

### 5.2 SchemaContribution

```typescript
export const projectSchemaContribution: SchemaContribution = {
  pluginId: 'sanyam-project',
  tables: [projectSnapshots, projectSnapshotFiles, projectAnalytics],
};
```

### 5.3 Extension Table Pattern

The package does **not** define an extension table — that's the app's responsibility. Instead, the `extensionTable` config option tells the create route to insert into the app's extension table alongside the base project row. This preserves the `sanyam-db` pattern where:

- `sanyam-db` owns `projects` + `projectFiles` (base tables)
- `sanyam-project` owns `project_snapshots` + `project_snapshot_files` + `project_analytics` (lifecycle/analytics)
- The consuming app owns its extension table (e.g., `actone_project_ext`) and any domain-specific tables (assets, drafts, etc.)

---

## 6. API Routes

All routes are mounted under a configurable prefix (typically `/project`).

### 6.1 `POST /create`

Create a new project with files.

**Request body**:
```typescript
{
  title: string,             // 1–500 chars
  description?: string,      // max 2000 chars
  extensionData?: unknown,   // validated by config.extensionSchema if present
  additionalFiles?: Array<{  // for AI import: pre-populated files
    filePath: string,
    content: string,
    isEntry?: boolean,
  }>,
}
```

**Behavior**:
1. Validate auth (user must be authenticated)
2. Insert `projects` row with `lifecyclePhase: 'concept'`, `userId` from context
3. If `config.extensionTable` + `extensionData`: insert extension row
4. If `additionalFiles` provided: insert all files, first with `isEntry` or explicit flag
5. Otherwise: generate entry file via `config.generateEntrySkeleton(title, extensionData)`, insert with `isEntry: true`
6. Return `{ id, title, entryFilePath }`

**Response**: `201 Created`
```json
{ "id": "uuid", "title": "string", "entryFilePath": "string" }
```

### 6.2 `GET /list`

List the authenticated user's projects.

**Query params**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 50 | Max results (capped by `config.maxProjectListSize`) |
| `offset` | number | 0 | Pagination offset |

**Response**: `200 OK`
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "string",
      "lifecyclePhase": "string",
      "grammarVersion": "string | null",
      "updatedAt": "ISO8601",
      "extension": { ... } | null
    }
  ]
}
```

If `config.extensionTable` is provided, each row includes a `LEFT JOIN` to the extension table with its columns nested under `extension`.

### 6.3 `GET /manifest`

Get full project metadata including file count.

**Query params**: `projectId` (required, uuid)

**Response**: `200 OK`
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string | null",
  "lifecyclePhase": "string",
  "grammarVersion": "string | null",
  "grammarFingerprint": "string | null",
  "metadata": {},
  "fileCount": 3,
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601",
  "extension": { ... } | null
}
```

### 6.4 `POST /lifecycle`

Transition a project's lifecycle stage with automatic snapshot creation.

**Request body**:
```typescript
{
  projectId: string,     // uuid
  targetStage: string,   // must be a valid LifecycleStage
  notes?: string,        // max 500 chars
}
```

**Behavior**:
1. Fetch project, verify ownership
2. Validate transition via `isValidTransition(currentStage, targetStage)`
3. Fetch all project files
4. Compute stats via `config.aggregateStats(files)` (or default word-count-only)
5. Generate tag via `generateSnapshotTag(targetStage)` → `"draft-2026-03-13-120530"`
6. Insert `project_snapshots` row + `project_snapshot_files` rows (full file contents)
7. Update `projects.lifecyclePhase` and `projects.updatedAt`
8. Return result

**Response**: `200 OK`
```json
{
  "previousStage": "concept",
  "currentStage": "draft",
  "snapshotId": "uuid"
}
```

**Error**: `400` if transition is invalid, `404` if project not found, `403` if not owner.

### 6.5 `POST /:id/files`

Create or delete files within a project.

**Request body**:
```typescript
{
  action: 'create' | 'delete',
  filePath: string,      // 1–255 chars
  content?: string,      // for 'create'; defaults to empty string
  isEntry?: boolean,     // for 'create'; defaults to false
}
```

**Create behavior**:
1. Verify project ownership
2. Check file doesn't already exist (409 Conflict)
3. Check file count < `config.maxFilesPerProject` (400 if exceeded)
4. Insert `project_files` row
5. Update `projects.updatedAt`

**Delete behavior**:
1. Verify project ownership
2. Verify file exists (404)
3. Verify file is NOT the entry file (400 — entry files cannot be deleted)
4. Delete `project_files` row
5. Update `projects.updatedAt`

**Response**: `200 OK`
```json
{ "filePath": "string", "action": "create" | "delete" }
```

### 6.6 `PUT /:id/files/:fileId/rename`

Rename a file within a project.

**Request body**:
```typescript
{
  newFilePath: string,   // 1–255 chars
}
```

**Behavior**:
1. Verify project ownership, file exists
2. Verify new path doesn't conflict with existing file (409)
3. Update `project_files.filePath` and `project_files.updatedAt`
4. Update `projects.updatedAt`

**Response**: `200 OK`
```json
{ "fileId": "uuid", "oldPath": "string", "newPath": "string" }
```

### 6.7 `GET /:id/download`

Download all project files as a ZIP archive.

**Behavior**:
1. Verify project ownership
2. Fetch all project files
3. Create ZIP archive with directory structure matching file paths
4. Stream response with `Content-Type: application/zip` and `Content-Disposition: attachment; filename="{project-name}.zip"`

**Response**: `200 OK` — binary ZIP stream

### 6.8 `POST /analytics/snapshot`

Capture a point-in-time analytics record.

**Request body**:
```typescript
{
  projectId: string,     // uuid
  wordCount: number,
  metrics?: Record<string, unknown>,
}
```

**Response**: `201 Created`
```json
{ "id": "uuid", "capturedAt": "ISO8601" }
```

### 6.9 `GET /analytics/timeseries`

Retrieve analytics history for a project.

**Query params**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `projectId` | uuid | required | |
| `limit` | number | 50 | Max 500 |

**Response**: `200 OK`
```json
{
  "snapshots": [
    { "id": "uuid", "wordCount": 1200, "metrics": {}, "capturedAt": "ISO8601" }
  ]
}
```

---

## 7. Services (Non-Route Exports)

These are importable functions that apps can use independently of the routes.

### 7.1 Lifecycle Service

```typescript
// Re-exported from types
isValidTransition(from, to): boolean
getValidTargets(from): LifecycleStage[]
getStageLabel(stage): string

// Utility
canTransition(from: string, to: string): boolean  // string-safe wrapper
```

### 7.2 Snapshot Service

```typescript
generateSnapshotTag(stage: string): string
// → "draft-2026-03-13-120530" (stage + ISO date with seconds)

countWords(content: string): number
// → Split on whitespace, strip single-line comments (// ...)
```

### 7.3 Stats Service (Default Implementation)

```typescript
function defaultAggregateStats(
  files: Array<{ filePath: string; content: string }>
): ProjectStats {
  // Default: word count only
  return {
    wordCount: files.reduce((sum, f) => sum + countWords(f.content), 0),
  };
}
```

Apps override this via `config.aggregateStats` to add grammar-specific counting (scenes, characters, etc.).

---

## 8. Route Factory

```typescript
import { createProjectRoutes } from '@docugenix/sanyam-project';

const projectRoutes = createProjectRoutes({
  db,
  fileExtension: 'actone',
  extensionTable: {
    table: actoneProjectExt,
    projectIdColumn: actoneProjectExt.projectId,
  },
  extensionSchema: z.object({
    authorName: z.string().max(200).optional(),
    genre: z.string().max(100).optional(),
    compositionMode: z.enum(['merge', 'overlay', 'sequential']).default('merge'),
    publishingMode: z.enum(['text', 'graphic-novel']).default('text'),
  }),
  generateEntrySkeleton: (title) => generateActOneSkeleton(title),
  generateEntryFilePath: () => 'story.actone',
  aggregateStats: (files) => actOneAggregateStats(files),
  maxFilesPerProject: 10,
});

// Register with sanyam-app
const contributions: ApiRouteContribution[] = [
  { prefix: '/project', routes: projectRoutes },
  // ...
];
```

---

## 9. Auth & RLS Integration

### Request Authentication

Routes extract the user ID from Hono context via `config.getUserId(c)`. The default implementation reads the `x-user-id` header, which `sanyam-auth` middleware sets from the Supabase JWT.

All mutating routes verify ownership: `projects.userId === currentUserId`. Read routes rely on Postgres RLS policies (the Drizzle client is scoped to the authenticated user's JWT).

### Database RLS

All tables use `sanyam-db` RLS helpers:
- `ownedViaParentPolicies(tableName, fkColumn, parentTable)` — inherits access from parent
- `ownedByExtensionPolicy(tableName, fkColumn, parentTable)` — for 1:1 extension tables

The consuming app's extension table and domain tables follow the same pattern.

---

## 10. Error Responses

All error responses use a consistent shape:

```json
{ "error": "Human-readable error message" }
```

| Status | Condition |
|--------|-----------|
| 400 | Invalid request body, invalid lifecycle transition, entry file delete attempt, file limit exceeded |
| 401 | No authenticated user |
| 403 | User does not own the project |
| 404 | Project or file not found |
| 409 | File path already exists (create), file path conflict (rename) |
| 500 | Unexpected server error |

---

## 11. What Stays in the Consuming App

The package intentionally does **not** include:

| Concern | Reason |
|---------|--------|
| **Extension table schema** (`actone_project_ext`) | Domain-specific; defined via `SchemaExtension` in the app's shared package |
| **Domain tables** (assets, drafts, conversations) | App-specific concerns; each can be its own sanyam package or stay local |
| **Entry file skeleton generator** | Grammar-specific; injected via `config.generateEntrySkeleton` |
| **Grammar-specific stats** (scene/character counting) | Language-specific; injected via `config.aggregateStats` |
| **Client-side stores** (ProjectStore, WorkspaceStore) | Framework-specific (Svelte 5 runes); the package exports types only |
| **Supabase PostgREST loader** | Client-side data fetching pattern; stays in the app |
| **Composition modes** (merge/overlay/sequential) | Language-specific namespace resolution; stays in lang package or app |
| **UI components** | Framework-specific |

---

## 12. Migration Path from ActOne

### Files that move into the package:

| Current location | Package destination |
|------------------|---------------------|
| `apps/studio/src/lib/api/project.ts` (routes) | `src/routes/*.ts` (decomposed) |
| `apps/studio/src/lib/api/analytics.ts` (routes) | `src/routes/analytics.ts` |
| `apps/studio/src/lib/project/lifecycle.ts` (service) | `src/services/lifecycle.ts` |
| `apps/studio/src/lib/project/snapshots.ts` (service) | `src/services/snapshots.ts` + `src/services/stats.ts` |
| `packages/shared-actone/src/types/project.ts` (types) | `src/types.ts` |
| `packages/shared-actone/src/types/workspace.ts` (types) | `src/types.ts` |
| `packages/shared-actone/src/db/schema.ts` (snapshots, snapshotFiles, analyticsSnapshots) | `src/schema/*.ts` |

### Files that stay in ActOne:

| File | Reason |
|------|--------|
| `apps/studio/src/lib/project/creation-wizard.ts` | Grammar-specific skeleton; becomes the `generateEntrySkeleton` hook |
| `apps/studio/src/lib/project/composition.ts` | Grammar-specific namespace resolution |
| `apps/studio/src/lib/stores/project.svelte.ts` | Svelte 5 client store |
| `apps/studio/src/lib/stores/workspace.svelte.ts` | Svelte 5 client store |
| `apps/studio/src/lib/stores/project-loader.ts` | Supabase PostgREST client-side loader |
| `apps/studio/src/lib/editor/supabase-client.ts` | Browser-side file CRUD |
| `apps/studio/src/lib/api/draft.ts` | Domain-specific (could become `sanyam-draft` later) |
| `packages/shared-actone/src/db/schema.ts` (actoneProjectExt, assets, draftVersions, conversations, chatMessages) | Domain-specific tables |
| `packages/shared-actone/src/types/project-metadata.ts` | ActOne-specific extension fields |

### ActOne's hooks.server.ts changes:

```typescript
// Before
import { projectRoutes } from '$lib/api/project.js';

// After
import { createProjectRoutes } from '@docugenix/sanyam-project';
import { actoneProjectExt } from '@actone/shared/db';
import { generateEntrySkeleton } from '$lib/project/creation-wizard.js';
import { actOneAggregateStats } from '$lib/project/snapshots.js';

const projectRoutes = createProjectRoutes({
  db,
  fileExtension: 'actone',
  extensionTable: { table: actoneProjectExt, projectIdColumn: actoneProjectExt.projectId },
  extensionSchema: actoneExtensionSchema,
  generateEntrySkeleton,
  generateEntryFilePath: () => 'story.actone',
  aggregateStats: actOneAggregateStats,
  maxFilesPerProject: 10,
});
```

---

## 13. Package Metadata

```json
{
  "name": "@docugenix/sanyam-project",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./schema": { "types": "./dist/schema/index.d.ts", "default": "./dist/schema/index.js" },
    "./services": { "types": "./dist/services/index.d.ts", "default": "./dist/services/index.js" },
    "./types": { "types": "./dist/types.d.ts", "default": "./dist/types.js" }
  },
  "dependencies": {
    "@docugenix/sanyam-db": "^1.0.9",
    "@docugenix/sanyam-shared": "^1.0.9",
    "@hono/zod-validator": "^0.4.0",
    "archiver": "^7.0.1",
    "drizzle-orm": "^0.45.1",
    "hono": "^4.7.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@docugenix/sanyam-config": "^1.0.9",
    "@docugenix/sanyam-test-utils": "^1.0.9",
    "typescript": "^5.9.2",
    "vitest": "^3.2.1"
  }
}
```
