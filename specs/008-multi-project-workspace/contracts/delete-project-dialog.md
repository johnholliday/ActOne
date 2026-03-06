# Contract: Delete Project Dialog

**Feature**: 008-multi-project-workspace
**Type**: UI Component (two-step modal)

## Purpose

Two-step confirmation dialog for permanently deleting a project and all its related data from the database. Modeled after Supabase's project deletion UX.

## Step 1: Warning Dialog

### Props

```typescript
interface DeleteWarningDialogProps {
  /** The project being deleted */
  projectTitle: string;
  projectId: string;

  /** Callback when user clicks Continue */
  onContinue: () => void;

  /** Callback when user cancels */
  onCancel: () => void;
}
```

### Content

- **Heading**: "Delete Project"
- **Body**: "You are about to permanently delete **{projectTitle}** and all of its contents. This action cannot be undone. All source files, assets, and related data will be permanently removed."
- **Buttons**: "Cancel" (secondary, left) | "Continue" (danger/red, right)

### Behavior

- Cancel → closes dialog, no side effects
- Continue → transitions to Step 2

## Step 2: Name Confirmation Dialog

### Props

```typescript
interface DeleteConfirmDialogProps {
  /** The exact project name that must be typed */
  projectTitle: string;
  projectId: string;

  /** Callback when deletion is confirmed */
  onDelete: (projectId: string) => void;

  /** Callback when user cancels */
  onCancel: () => void;
}
```

### Content

- **Heading**: "Confirm Deletion"
- **Body**: "To confirm, type **{projectTitle}** in the box below:"
- **Text input**: Empty, placeholder "Type project name to confirm"
- **Buttons**: "Cancel" (secondary, left) | "Delete" (danger/red, right, initially disabled)

### Behavior

- **Delete button state**: Disabled until input value === projectTitle (exact match, case-sensitive, trimmed)
- **Input validation**: Real-time comparison as user types; no form submission needed
- Cancel → closes dialog, no side effects
- Delete (when enabled) → calls `onDelete(projectId)`:
  1. Show loading spinner on Delete button
  2. Call server-side delete API
  3. On success: close dialog, remove from workspace, show success toast
  4. On error: show error message in dialog, keep dialog open

## Server-Side Delete API

**Endpoint**: `DELETE /api/project/[id]`

**Authorization**: Verified user owns the project (RLS + server-side check)

**Response**:
- `200 OK` — project and all related data deleted
- `404 Not Found` — project doesn't exist or not owned by user
- `500 Internal Server Error` — deletion failed

**Cascade**: Database FK constraints handle cascading deletes for source_files and assets.

## Client-Side Cleanup After Delete

1. Remove project from `workspaceStore.openProjectIds`
2. Close all editor tabs with matching `projectId` via `editorStore`
3. Clear AST entries for the project from `astStore`
4. Clear diagram view state for the project from `diagramStore`
5. Remove diagram sidecar localStorage entries for the project
6. Remove project from `projectStore.loadedProjects` cache
