# Data Model: Wire Studio Screens to Live Functions

**Feature Branch**: `004-wire-studio-screens`
**Date**: 2026-02-27
**Phase**: 1 (Design)

## Existing Entities (No Schema Changes Required)

All entities needed for this feature already exist in the database schema at `packages/shared/src/db/schema.ts`. This feature wires the UI to existing data — no new tables or columns are needed.

### Project

| Field | Type | Notes |
|-------|------|-------|
| id | uuid (PK) | Auto-generated |
| userId | uuid (FK → auth.users) | RLS: user can only access own projects |
| title | varchar(200) | Required, 1-200 chars |
| authorName | varchar(200) | Optional |
| genre | varchar(100) | Optional |
| compositionMode | enum (merge/overlay/sequential) | Default: merge |
| lifecycleStage | enum (concept/draft/revision/final/published) | Default: concept |
| publishingMode | enum (text/graphic-novel) | Default: text |
| grammarVersion | varchar(50) | Langium grammar version |
| grammarFingerprint | varchar(64) | Grammar hash for cache invalidation |
| createdAt | timestamp | Auto-set |
| modifiedAt | timestamp | Auto-updated |
| version | integer | Optimistic concurrency |

**State transitions** (lifecycleStage):
```
concept → draft → revision → final → published
```
Each transition is one-directional. Validated by `isValidTransition()` in `lib/project/lifecycle.ts`.

### Source File

| Field | Type | Notes |
|-------|------|-------|
| id | uuid (PK) | Auto-generated |
| projectId | uuid (FK → projects) | Cascade delete |
| filePath | varchar(500) | Relative path within project |
| content | text | Full file content |
| isEntry | boolean | Default: false; one entry file per project |
| createdAt | timestamp | Auto-set |
| modifiedAt | timestamp | Auto-updated |

### Asset (Visual)

| Field | Type | Notes |
|-------|------|-------|
| id | uuid (PK) | Auto-generated |
| projectId | uuid (FK → projects) | Cascade delete |
| type | enum (portrait/cover/scene/style-board/chapter-header/panel) | Asset category |
| name | varchar(200) | Display name |
| status | enum (pending/approved/rejected) | Default: pending |
| prompt | text | Generation prompt used |
| backend | varchar(100) | AI backend that generated it |
| metadata | jsonb | Dimensions, format, storage path, etc. |
| createdAt | timestamp | Auto-set |

### Analytics Snapshot

| Field | Type | Notes |
|-------|------|-------|
| id | uuid (PK) | Auto-generated |
| projectId | uuid (FK → projects) | Cascade delete |
| wordCount | integer | Total words across all files |
| sceneCount | integer | Number of scene definitions |
| characterCount | integer | Number of character definitions |
| metrics | jsonb | `{ sceneTypeDistribution, characterScreenTime, pacingRhythm }` |
| capturedAt | timestamp | Auto-set |

### Draft Version

| Field | Type | Notes |
|-------|------|-------|
| id | uuid (PK) | Auto-generated |
| projectId | uuid (FK → projects) | Cascade delete |
| sceneName | varchar(200) | Scene this draft belongs to |
| paragraphIndex | integer | Position within scene |
| content | text | Generated prose text |
| status | enum (pending/accepted/rejected/editing) | Default: pending |
| backend | varchar(100) | AI backend used |
| model | varchar(100) | Specific model identifier |
| temperature | real | Generation temperature |
| tokenCount | integer | Tokens consumed |
| costUsd | real | Estimated cost |
| createdAt | timestamp | Auto-set |

### Snapshot (Lifecycle Archive)

| Field | Type | Notes |
|-------|------|-------|
| id | uuid (PK) | Auto-generated |
| projectId | uuid (FK → projects) | Cascade delete |
| tag | varchar(100) | Human-readable snapshot label |
| stage | lifecycle_stage enum | Stage at time of snapshot |
| wordCount | integer | Aggregate word count |
| sceneCount | integer | Aggregate scene count |
| characterCount | integer | Aggregate character count |
| notes | text | Optional user notes |
| createdAt | timestamp | Auto-set |

### Snapshot File

| Field | Type | Notes |
|-------|------|-------|
| id | uuid (PK) | Auto-generated |
| snapshotId | uuid (FK → snapshots) | Cascade delete |
| filePath | varchar(500) | File path at snapshot time |
| content | text | Full file content at snapshot time |

## Client-Side State (Svelte 5 Runes Stores)

### ProjectStore (`lib/stores/project.svelte.ts`)

Already exists. Holds `project: ProjectMeta | null` and `files: SourceFileEntry[]`. Methods: `load()`, `clear()`, `updateStage()`, `updateCompositionMode()`, `addFile()`, `removeFile()`.

**Gap**: No `loadFromServer()` method to fetch the user's project on app init. This feature adds a project loading mechanism.

### AstStore (`lib/stores/ast.svelte.ts`)

Already exists. Holds parsed AST and diagnostics per URI. All diagram pages and Story Bible consume `astStore.activeAst`.

**Gap**: None — AST store is populated by the Langium worker when editor content changes. Diagrams already read from it.

### UIStore (`lib/stores/ui.svelte.ts`)

Already exists. Tracks sidebar/bottom panel visibility, active diagram view, active pane.

**Gap**: None for this feature.

## New Client-Side Types (No DB Changes)

### UserProfilePopup State

```typescript
// Inline in +layout.svelte, no dedicated store needed
let profileMenuOpen = $state(false);
```

### Settings Page Data (derived from Supabase auth)

```typescript
// Profile Settings
interface ProfileFormData {
  displayName: string;
  avatarUrl: string | null;
}

// Account Settings
interface AccountFormData {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

// Appearance Settings
interface AppearanceFormData {
  theme: 'dark' | 'light' | 'system';
  editorFontSize: number;
  editorFontFamily: string;
}
```

These are form-local types, not persisted to a new DB table. Profile/account data is stored in Supabase Auth metadata. Appearance preferences can use `localStorage` initially.

## Relationships

```
User (auth.users)
 └── Project (1:N)
      ├── SourceFile (1:N)
      ├── Asset (1:N)
      ├── AnalyticsSnapshot (1:N)
      ├── DraftVersion (1:N)
      └── Snapshot (1:N)
           └── SnapshotFile (1:N)
```

All relationships enforce `userId` via RLS policies — users can only access their own project tree.
