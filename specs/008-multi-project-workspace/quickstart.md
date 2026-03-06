# Quickstart: Multi-Project Workspace

**Feature**: 008-multi-project-workspace
**Date**: 2026-03-03

## Prerequisites

- Node >= 18, pnpm v9
- Supabase local dev environment running (`supabase start`)
- Existing studio app builds and runs (`pnpm dev`)

## What This Feature Adds

1. **WorkspaceStore** — new store that tracks which projects are open and which is active
2. **Enhanced ProjectStore** — caches multiple projects' metadata and files
3. **Enhanced EditorStore** — tabs carry `projectId` and `projectTitle` for cross-project tab management
4. **Enhanced AstStore** — compound keys `${projectId}::${uri}` for per-project AST isolation
5. **Enhanced DiagramStore** — compound keys `${projectId}::${viewType}` for per-project diagram state
6. **Project Browser Dialog** — modal to browse and open projects from the database
7. **Delete Project Dialog** — two-step confirmation for permanent deletion
8. **Multi-project sidebar** — multiple collapsible ProjectSection components
9. **Context switching** — automatic project context updates when editor tab focus changes
10. **Delete API endpoint** — `DELETE /api/project/[id]` for server-side project deletion

## Key Files

### New Files

| File | Purpose |
|------|---------|
| `apps/studio/src/lib/stores/workspace.svelte.ts` | WorkspaceStore — open projects + active project |
| `apps/studio/src/lib/components/ProjectBrowserDialog.svelte` | Browse and open projects |
| `apps/studio/src/lib/components/DeleteProjectDialog.svelte` | Two-step delete confirmation |
| `apps/studio/src/routes/api/project/[id]/+server.ts` | DELETE endpoint for project removal |

### Modified Files

| File | Change |
|------|--------|
| `apps/studio/src/lib/stores/project.svelte.ts` | Add `loadedProjects` map, multi-project caching |
| `apps/studio/src/lib/stores/editor.svelte.ts` | Add `projectId`/`projectTitle` to `OpenFile`, project-aware close |
| `apps/studio/src/lib/stores/ast.svelte.ts` | Compound keys, per-project merged ASTs |
| `apps/studio/src/lib/stores/diagrams.svelte.ts` | Compound keys for view state |
| `apps/studio/src/lib/components/ProjectSection.svelte` | Support multiple instances, active highlighting |
| `apps/studio/src/lib/panels/EditorPanel.svelte` | Tab disambiguation, project-aware tab operations |
| `apps/studio/src/lib/panels/DiagramPanel.svelte` | Read from project-scoped diagram state |
| `apps/studio/src/lib/panels/ProblemsPanel.svelte` | Filter diagnostics by active project |
| `apps/studio/src/lib/components/MenuBar.svelte` | Add "Open Project...", "Close Project", "Delete Project..." menu items |
| `apps/studio/src/routes/+layout.svelte` | Multiple ProjectSections, workspace restore on mount |
| `apps/studio/src/routes/+layout.server.ts` | Return all user projects (not just most recent) |
| `packages/shared/src/types/index.ts` | Add WorkspaceState type |

## Development Workflow

```bash
# Start dev environment
pnpm dev

# The studio is at http://localhost:54530
# Create multiple projects to test multi-project features
# Use File > Open Project... to browse and open projects
# Switch between tabs to verify context switching
```

## Testing Strategy

1. **Unit tests**: WorkspaceStore persistence, EditorStore tab disambiguation, AstStore compound key logic
2. **Integration tests**: Context switching flow, project open/close lifecycle
3. **Manual testing**: Multi-project sidebar, delete confirmation UX, tab label rendering
