# Research: Multi-Project Workspace

**Feature**: 008-multi-project-workspace
**Date**: 2026-03-03

## R1: Store Architecture Strategy

**Decision**: Parallel Project Contexts with a new `WorkspaceStore` coordinating per-project state.

**Rationale**: The current architecture uses singleton stores (`ProjectStore`, `AstStore`, `DiagramStore`) that assume a single active project. Rather than making every store internally multi-project-aware (which would require deeply nested state maps and complex lifecycle management), we introduce a `WorkspaceStore` that:
- Maintains the list of open project IDs
- Tracks which project is "active" (owns focused editor tab)
- Provides the canonical `activeProjectId` that all dependent views derive from
- Manages project lifecycle (open, close, switch)

Each project's per-file state (AST, diagnostics) lives in the existing `AstStore`, but keyed by `projectId:uri` compound keys instead of bare URIs. The `ProjectStore` gains a `loadedProjects` map to cache metadata and files for all open projects.

**Alternatives considered**:
1. **Per-project store instances**: Create separate `AstStore`, `DiagramStore` per project. Rejected because Svelte 5 runes stores are module-level singletons; instantiating multiples would require a factory pattern and break all existing `getAstStore()` call sites.
2. **Full workspace abstraction**: Load all projects into a single Langium workspace. Rejected because Langium's workspace model assumes a single project root, and cross-project symbol resolution is not desired (projects are independent).

## R2: Editor Tab Project Affinity

**Decision**: Add `projectId` and `projectTitle` fields to the `OpenFile` interface in `EditorStore`.

**Rationale**: Currently `OpenFile` has `{ id, filePath, isDirty }`. Adding project identity to each open file enables:
- Tab label disambiguation (`Project A / story.actone` vs `Project B / story.actone`)
- Deriving the active project from the active tab (no separate "project selector" needed)
- Closing all tabs for a specific project when it's removed from the workspace
- Grouping dirty-file checks by project during close operations

**Alternatives considered**:
1. **Lookup table from fileId → projectId**: Rejected because it requires an extra lookup on every tab render and doesn't provide the project title for display.

## R3: AST Store Scoping

**Decision**: Change `AstStore.fileAsts` key from `uri` to `${projectId}::${uri}` compound key. Add `mergedAsts: Map<string, SerializedStory>` keyed by projectId.

**Rationale**: Two projects can have files with the same path (e.g., `story.actone`), producing identical URIs under the current scheme. Compound keys prevent collisions. Per-project merged ASTs ensure diagrams and outline views always show the correct project's consolidated data.

The `activeUri` field is retained but supplemented with `activeProjectId` to scope all derived values (`activeAst`, `activeElements`, `allFileDiagnostics`) to the active project.

**Alternatives considered**:
1. **Separate AstStore instances per project**: Rejected per R1 reasoning (singleton pattern).
2. **Namespace URIs with project prefix** (e.g., `file:///projectId/story.actone`): Rejected because it leaks workspace concerns into the Langium URI format and would require changes to Langium's URI handling.

## R4: Langium Worker Strategy

**Decision**: One Langium web worker per open project, managed by the workspace store.

**Rationale**: The Langium language client initializes with a `projectContext` that binds it to a specific project's files. The worker maintains internal state (grammar, parser, scope resolver) that is project-scoped. Attempting to multiplex projects through a single worker would require flushing and rebuilding the entire workspace state on each switch, which is expensive and error-prone.

With one worker per project:
- Each project's files are parsed independently and concurrently
- Switching active project only changes which worker's output drives the UI — no re-parsing needed
- Workers for non-active projects can remain idle but warm (instant switch)
- Memory overhead per worker is modest (~10-20MB for a typical project)

**Alternatives considered**:
1. **Single worker with workspace switching**: Rejected due to re-parse cost on every project switch (~500ms-2s depending on project size).
2. **Worker pool with LRU eviction**: Over-engineering for the expected scale (2-5 open projects). Can be added later if memory becomes an issue.

## R5: Workspace Persistence

**Decision**: Persist the list of open project IDs in localStorage, keyed by the authenticated user's ID.

**Rationale**: Workspace state is device-local (same user on different devices may want different workspaces). Using localStorage avoids database schema changes and keeps the feature client-side only. The key format `actone:workspace:${userId}` prevents conflicts between users on shared devices.

On session restore:
1. Read open project IDs from localStorage
2. Fetch project metadata for each from the database
3. Initialize Langium workers for each
4. Restore previously open editor tabs (also persisted in localStorage alongside the dockview layout)

**Alternatives considered**:
1. **Database table for workspace state**: Rejected because workspace is inherently device-local (screen size, layout preferences differ per device).
2. **Session storage**: Rejected because it doesn't survive browser restarts.

## R6: Context Switching Mechanism

**Decision**: Derive the active project from the active editor tab's `projectId`. All dependent views reactively subscribe to `workspaceStore.activeProjectId`.

**Rationale**: This follows the user's mental model — "the project I'm looking at is the one in focus." No manual project selector is needed. The data flow is:

1. User clicks a tab → `editorStore.activeFileId` changes
2. Look up `projectId` from the active file's metadata
3. Set `workspaceStore.activeProjectId`
4. All dependent stores/views derive their data from the active project

This is reactive and automatic. Svelte 5's `$derived` makes this chain efficient.

**Alternatives considered**:
1. **Explicit project selector dropdown**: Rejected as it breaks the "context follows focus" requirement and adds friction.
2. **Per-panel project binding** (each panel could show a different project): Rejected as over-complex and not requested in the spec.

## R7: Delete Project Confirmation Pattern

**Decision**: Two-step confirmation dialog modeled after Supabase's project deletion UX.

**Rationale**: The spec explicitly references Supabase's double-confirmation pattern:
- **Step 1**: Warning dialog stating the project name, explaining that deletion is permanent, with Cancel and Continue buttons.
- **Step 2**: Text input dialog requiring the user to type the exact project name (case-sensitive match) to enable the Delete button.

The deletion API endpoint performs a cascading delete: the `projects` table has `ON DELETE CASCADE` on `source_files`, and assets are cleaned up via the same cascade. Diagram sidecar data in localStorage is cleaned up client-side after successful deletion.

**Alternatives considered**:
1. **Single confirmation**: Rejected as insufficient safety per the spec requirement.
2. **Soft delete (archive)**: Not requested; permanent deletion matches the spec. Could be added as a future enhancement.

## R8: Project Browser Dialog

**Decision**: Modal dialog with a searchable list of all user projects, showing metadata and open/closed status.

**Rationale**: The project browser needs to show all projects from the database, not just open ones. It fetches the full project list via the existing server-side query (already in `+layout.server.ts`), displays metadata columns (title, genre, lifecycle stage, last modified), and visually distinguishes already-open projects. Clicking an already-open project focuses it; clicking a closed project adds it to the workspace.

Search/filter is by project title with instant client-side filtering (the full list is small enough to fetch in one query — expected <100 projects per user).
