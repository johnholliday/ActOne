# Data Model: Multi-Project Workspace

**Feature**: 008-multi-project-workspace
**Date**: 2026-03-03

## Existing Entities (No Schema Changes Required)

The database schema already supports multiple projects per user. No new tables or columns are needed.

### projects (existing)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to auth.users |
| title | text | Project display name |
| author_name | text | Author name |
| genre | text | Genre category |
| composition_mode | enum | merge, overlay, sequential |
| lifecycle_stage | enum | concept, draft, revision, final, published |
| publishing_mode | enum | text, graphic-novel |
| grammar_version | text | Grammar version string |
| grammar_fingerprint | text | Grammar content hash |
| created_at | timestamp | Creation time |
| modified_at | timestamp | Last modification time |

### source_files (existing)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK to projects (CASCADE on delete) |
| file_path | text | Relative file path (e.g., "story.actone") |
| content | text | File source code |
| is_entry | boolean | True for the main entry file |
| created_at | timestamp | Creation time |
| modified_at | timestamp | Last modification time |

**Unique constraint**: `(project_id, file_path)`

## New Client-Side State Models

### WorkspaceState (localStorage)

Persisted in `localStorage` under key `actone:workspace:${userId}`.

| Field | Type | Description |
|-------|------|-------------|
| openProjectIds | string[] | Ordered list of open project UUIDs |
| activeProjectId | string \| null | Currently focused project UUID |

### OpenFile (enhanced)

Extends the existing `OpenFile` interface in EditorStore.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Source file UUID |
| filePath | string | Relative file path |
| isDirty | boolean | Has unsaved changes |
| projectId | string | **NEW** — owning project UUID |
| projectTitle | string | **NEW** — owning project title (for tab label) |

### ProjectCache (new, in-memory only)

Held in `ProjectStore.loadedProjects` map, keyed by project ID.

| Field | Type | Description |
|-------|------|-------------|
| project | ProjectMeta | Project metadata |
| files | SourceFileEntry[] | Project's source files |
| loadedAt | number | Timestamp of last load (for staleness checks) |

### AstStore Compound Keys

| Current Key | New Key Format | Description |
|-------------|---------------|-------------|
| `uri` (e.g., `file:///story.actone`) | `${projectId}::${uri}` | Per-file AST entry |
| (none — single `mergedAst`) | `mergedAsts[projectId]` | Per-project merged AST |

### DiagramStore Compound Keys

| Current Key | New Key Format | Description |
|-------------|---------------|-------------|
| `viewType` (e.g., `story-structure`) | `${projectId}::${viewType}` | Per-project diagram view state |

## State Transitions

### Project Lifecycle in Workspace

```
                    ┌─────────────┐
                    │  In Database │ (exists, not open)
                    │  (closed)    │
                    └──────┬──────┘
                           │ "Open Project..."
                           ▼
                    ┌─────────────┐
              ┌────▶│   In        │◀── "New Project..."
              │     │  Workspace  │     (auto-opens)
              │     │  (open)     │
              │     └──────┬──────┘
              │            │
              │     ┌──────┴──────┐
              │     │             │
              │     ▼             ▼
              │  "Close       "Delete
              │   Project"     Project..."
              │     │             │
              │     ▼             ▼
              │  ┌─────────┐  ┌──────────┐
              │  │ Removed  │  │ Warning  │
              │  │ from     │  │ Dialog   │
              │  │ workspace│  │ (Step 1) │
              │  │ (data    │  └────┬─────┘
              │  │  intact) │       │ Continue
              │  └─────────┘       ▼
              │                ┌──────────┐
              └────────────────│ Name     │
                "Open          │ Confirm  │
                 Project..."   │ (Step 2) │
                               └────┬─────┘
                                    │ Exact match
                                    ▼
                               ┌──────────┐
                               │ Deleted  │
                               │ from DB  │
                               │ + workspace │
                               └──────────┘
```

### Context Switch Flow

```
Tab Click → editorStore.activeFileId changes
         → lookup OpenFile.projectId
         → workspaceStore.activeProjectId = projectId
         → all $derived values in stores re-evaluate:
             astStore: activeAst, activeElements scoped to projectId
             diagramStore: activeNodes, activeEdges scoped to projectId
             ProblemsPanel: diagnostics filtered to projectId
             OutlinePanel: elements filtered to projectId
             GalleryPanel: assets filtered to projectId
             Sidebar: active project highlighted
```

## Deletion Cascade

When a project is deleted via the "Delete Project..." command:

**Server-side (database)**:
1. Delete `projects` row → cascades to `source_files` (FK with ON DELETE CASCADE)
2. Delete `assets` rows for the project (FK with ON DELETE CASCADE)
3. Any other project-related rows cascade automatically

**Client-side (localStorage cleanup)**:
1. Remove project from `actone:workspace:${userId}` open list
2. Remove diagram sidecar entries for the project
3. Clear any cached AST/diagram state for the project from stores
4. Close all editor tabs belonging to the project
5. Remove content buffers for the project's files from EditorStore
