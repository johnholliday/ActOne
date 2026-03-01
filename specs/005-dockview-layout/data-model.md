# Data Model: Dockview Layout Manager

**Feature**: 005-dockview-layout
**Date**: 2026-02-28

## Entities

### PanelDefinition

Represents a registered panel type in the application. This is a static registry, not persisted data.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique panel type identifier (e.g., `"editor"`, `"story-structure"`) |
| title | string | Display title for the panel tab |
| component | SvelteComponent | The Svelte component to render in the panel |
| renderer | `'always'` \| `'onlyWhenVisible'` | Whether to keep DOM alive when panel is hidden |
| singleton | boolean | Whether only one instance of this panel can exist (all current panels are singletons) |

### SerializedLayout

Represents the persisted layout state. This is the output of dockview's `api.toJSON()`, stored in `localStorage`.

| Field | Type | Description |
|-------|------|-------------|
| version | number | Schema version for migration support |
| grid | object | Tree structure of panel groups, positions, and sizes (dockview internal format) |
| panels | Record<string, PanelState> | Flat map of all panels with their component name and params |
| activeGroup | string \| undefined | ID of the currently focused group |

### PanelState (within SerializedLayout)

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique panel instance ID |
| contentComponent | string | Panel type ID (maps to PanelDefinition.id) |
| title | string | Tab display title |
| params | Record<string, unknown> | JSON-serializable parameters for the panel |

## State Management

### Removed State (from uiStore)

The following state currently in `uiStore` will be replaced by dockview's internal state management:

- `bottomPanelVisible` / `bottomPanelHeight` → replaced by dockview panel positioning
- `outlineVisible` / `outlineWidth` / `outlineDockPosition` → replaced by dockview panel positioning

### Retained State (in uiStore)

- `sidebarVisible` / `sidebarWidth` → sidebar stays outside dockview
- `activeDiagramView` → may be derived from active dockview panel instead

### New State

- `dockviewApi` reference — stored as a module-level variable (not in a reactive store) to avoid deep reactivity wrapping. Accessed via a getter function.

## Persistence

| Key | Storage | Format | Description |
|-----|---------|--------|-------------|
| `actone:dockview-layout` | localStorage | JSON (SerializedLayout) | Complete dockview layout state |
| `actone:layout` | localStorage | JSON | **DEPRECATED** — old layout prefs; migration reads this once and removes it |

### Persistence Flow

1. **Save**: On `onDidLayoutChange` event (debounced 500ms) → `api.toJSON()` → `JSON.stringify()` → `localStorage.setItem()`
2. **Restore**: On mount → `localStorage.getItem()` → `JSON.parse()` → validate version → `api.fromJSON()` → fall back to default layout on error
3. **Reset**: Clear `actone:dockview-layout` from localStorage → apply default layout

### Layout Versioning

The `version` field enables forward migration if the panel registry changes:
- Version 1: Initial dockview layout schema
- On load: if saved version < current version, discard and use default layout
- Unknown panel types in saved layout: log warning, skip panel, restore remainder
