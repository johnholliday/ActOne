# Contract: WorkspaceStore

**Feature**: 008-multi-project-workspace
**Type**: Client-side state management

## Purpose

The `WorkspaceStore` is the new coordination layer that manages which projects are open in the user's workspace and which project is currently active. It serves as the single source of truth for multi-project state.

## Interface

```typescript
class WorkspaceStore {
  // --- Reactive State ---

  /** Ordered list of open project IDs */
  openProjectIds: string[];  // $state

  /** Currently active project ID (derived from focused editor tab) */
  activeProjectId: string | null;  // $state

  // --- Derived State ---

  /** Whether any projects are open */
  hasOpenProjects: boolean;  // $derived from openProjectIds.length > 0

  /** Number of open projects */
  openProjectCount: number;  // $derived from openProjectIds.length

  // --- Methods ---

  /** Add a project to the workspace. No-op if already open. */
  openProject(projectId: string): void;

  /** Remove a project from the workspace. Does NOT delete from database. */
  closeProject(projectId: string): void;

  /** Set the active project (called when editor tab focus changes). */
  setActiveProject(projectId: string | null): void;

  /** Check if a project is currently open in the workspace. */
  isOpen(projectId: string): boolean;

  /** Persist workspace state to localStorage. */
  save(): void;

  /** Restore workspace state from localStorage. */
  restore(userId: string): void;

  /** Remove a project from workspace after deletion. */
  removeDeleted(projectId: string): void;
}
```

## Persistence Format

**localStorage key**: `actone:workspace:${userId}`

```json
{
  "openProjectIds": ["uuid-1", "uuid-2", "uuid-3"],
  "activeProjectId": "uuid-2"
}
```

## Invariants

1. `openProjectIds` contains no duplicates.
2. `activeProjectId` is always either `null` or a member of `openProjectIds`.
3. When `openProjectIds` becomes empty, `activeProjectId` is set to `null`.
4. When the active project is closed, `activeProjectId` shifts to the most recently active remaining project, or `null` if none remain.
5. `save()` is called automatically after any mutation (openProject, closeProject, setActiveProject, removeDeleted).

## Integration Points

- **EditorStore**: When `activeFileId` changes, EditorStore looks up the file's `projectId` and calls `workspaceStore.setActiveProject(projectId)`.
- **ProjectStore**: Reads `workspaceStore.openProjectIds` to determine which projects to load/cache.
- **AstStore, DiagramStore**: Read `workspaceStore.activeProjectId` to scope their derived values.
- **Sidebar (ProjectSection)**: Iterates `workspaceStore.openProjectIds` to render one ProjectSection per open project.
- **Session restore**: `+layout.svelte` calls `workspaceStore.restore(userId)` on mount, then loads all open projects.
