# Contract: Context Switching

**Feature**: 008-multi-project-workspace
**Type**: Reactive state flow

## Purpose

Defines how the active project context is determined and how all dependent views react to context changes when the user switches between editor tabs belonging to different projects.

## Trigger

The context switch is triggered by a change in `editorStore.activeFileId`. This happens when:
- User clicks a different editor tab
- User opens a file from the sidebar
- User navigates to a file via the outline or problems panel
- The active tab is closed and focus shifts to another tab
- A project is closed and the active tab belonged to that project

## Data Flow

```
editorStore.activeFileId changes
    │
    ▼
editorStore.activeFile (derived)
    │ contains: { id, filePath, projectId, projectTitle, isDirty }
    │
    ▼
workspaceStore.setActiveProject(activeFile.projectId)
    │
    ▼
workspaceStore.activeProjectId changes
    │
    ├──▶ astStore: re-derives activeAst, activeElements,
    │    allFileDiagnostics scoped to activeProjectId
    │
    ├──▶ diagramStore: re-derives activeNodes, activeEdges
    │    scoped to activeProjectId
    │
    ├──▶ sidebar: highlights the active project's
    │    ProjectSection, collapses others (optional)
    │
    ├──▶ outlinePanel: re-renders elements from active
    │    project's merged AST
    │
    ├──▶ problemsPanel: re-renders diagnostics filtered
    │    to active project's files
    │
    └──▶ galleryPanel: reloads assets for the active
         project's ID
```

## Derived Values by Store

### AstStore

```typescript
// Active project's file ASTs (filtered from global map)
activeProjectAsts = $derived(
  filter fileAsts where key starts with `${activeProjectId}::`
)

// Active project's merged AST
activeMergedAst = $derived(
  mergedAsts.get(activeProjectId) ?? null
)

// Active file's AST (unchanged logic, but scoped)
activeAst = $derived(
  activeProjectAsts.get(`${activeProjectId}::${activeUri}`) ?? null
)

// Elements for outline (from active project's merged AST)
activeElements = $derived(
  activeMergedAst?.elements ?? activeAst?.ast?.elements ?? []
)

// Diagnostics for problems panel (active project only)
activeProjectDiagnostics = $derived(
  filter allFileDiagnostics where key starts with `${activeProjectId}::`
)
```

### DiagramStore

```typescript
// Active project's diagram views
activeNodes = $derived(
  views[`${activeProjectId}::${activeView}`]?.nodes ?? []
)
activeEdges = $derived(
  views[`${activeProjectId}::${activeView}`]?.edges ?? []
)
```

## Timing Guarantees

1. Tab click → `activeProjectId` update: synchronous (single tick)
2. `activeProjectId` → derived values update: synchronous (Svelte reactivity)
3. Panel re-render: next microtask (Svelte batch update)
4. **Total perceived latency**: <100ms for cached projects, <1s if AST needs re-parse

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Active tab closed, other tabs exist | Focus shifts to most recent tab; context follows |
| Active tab closed, no tabs remain for any project | `activeProjectId` → null; show welcome state |
| Active tab closed, no tabs for this project but tabs for others | Focus shifts to most recent tab from another project |
| Switching to a project whose AST is still loading | Show loading indicator in dependent views; do not show stale data |
| Rapid tab switching (user clicking through tabs quickly) | Debounce diagram re-layout (expensive); AST/outline update immediately |
