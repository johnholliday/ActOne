# Contract: Project Browser Dialog

**Feature**: 008-multi-project-workspace
**Type**: UI Component

## Purpose

Modal dialog that displays all of the user's projects from the database, allowing them to open projects into the workspace. Accessible via File > Open Project... or sidebar button.

## Props

```typescript
interface ProjectBrowserDialogProps {
  /** All projects from the database for the current user */
  allProjects: ProjectMeta[];

  /** Set of project IDs currently open in the workspace */
  openProjectIds: Set<string>;

  /** Callback when user selects a project to open */
  onOpen: (projectId: string) => void;

  /** Callback to close the dialog */
  onClose: () => void;
}
```

## Display Columns

| Column | Source Field | Sortable | Description |
|--------|------------|----------|-------------|
| Title | `title` | Yes | Project name (primary identifier) |
| Genre | `genre` | Yes | Genre category |
| Stage | `lifecycleStage` | Yes | concept, draft, revision, final, published |
| Last Modified | `modifiedAt` | Yes (default: desc) | Relative time (e.g., "2 hours ago") |
| Status | (derived) | No | Badge: "Open" if in workspace, blank otherwise |

## Interactions

1. **Search**: Text input at top filters projects by title (case-insensitive, instant).
2. **Click row**: If project is closed → calls `onOpen(projectId)` and closes dialog. If project is already open → calls `onOpen(projectId)` (which focuses it) and closes dialog.
3. **Escape / Cancel**: Closes dialog without action.
4. **Empty state**: If user has no projects at all, show message with "Create your first project" prompt.

## Visual States

- **Already open**: Row has subtle background tint and "Open" badge. Clicking it focuses the project.
- **Closed**: Normal row styling. Clicking opens the project.
- **Loading**: Skeleton/spinner while project list is being fetched.
- **Empty search**: "No projects match your search" message.
