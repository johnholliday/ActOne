# Contract: Editor Tab Disambiguation

**Feature**: 008-multi-project-workspace
**Type**: UI behavior

## Purpose

Defines how editor tab labels are rendered when files from multiple projects are open, ensuring users can always identify which project a tab belongs to.

## Rules

### When to Show Project Name

Tab labels use **smart disambiguation** — the project name is shown only when necessary:

1. **Single project open**: Tabs show only the file name (e.g., `story.actone`). No change from current behavior.
2. **Multiple projects open, no name conflicts**: Tabs show only the file name. Since file names are unique within a project but may differ across projects, this is unambiguous.
3. **Multiple projects open, name conflict exists**: When two or more open tabs have the same `filePath` but belong to different projects, ALL tabs with that file name show the project name prefix.

### Label Format

```
[ProjectTitle] / fileName.actone
```

Example:
- `[My Novel] / story.actone`
- `[Short Stories] / story.actone`
- `characters.actone`  ← no conflict, no prefix needed

### Conflict Detection

```typescript
// Pseudo-code for determining if a tab needs disambiguation
function needsProjectPrefix(file: OpenFile, allOpenFiles: OpenFile[]): boolean {
  const sameNameFiles = allOpenFiles.filter(
    f => f.filePath === file.filePath && f.projectId !== file.projectId
  );
  return sameNameFiles.length > 0;
}
```

### Visual Design

- Project name prefix uses a muted/secondary text color
- Separator `/` uses muted text color
- File name uses primary text color
- Tab tooltip always shows full path: `{projectTitle} / {filePath}`

## Tab Ordering

Tabs from different projects are **interleaved** based on the order they were opened (most recently opened = rightmost). There is no automatic grouping by project. Users can reorder tabs by dragging.

## Tab Close Behavior

- Closing a tab removes it from `editorStore.openFiles`
- If the closed tab was the last tab for a project AND the project is still open in the workspace, the project remains open (just with no active tabs)
- If the user explicitly closes the project, all tabs for that project are closed
