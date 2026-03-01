# UI Contracts: Dockview Layout Manager

**Feature**: 005-dockview-layout
**Date**: 2026-02-28

## Contract 1: Panel Component Interface

Every Svelte component that renders inside a dockview panel MUST accept these props:

```
Props:
  api: DockviewPanelApi          — per-panel API (title, visibility, close, etc.)
  containerApi: DockviewApi       — full dockview API (add panels, serialize, etc.)
  title: string                   — the panel's display title
  panelParams: Writable<object>   — reactive store for panel-specific parameters
```

Panel components MUST:
- Fill their container (100% width and height)
- Handle being mounted and unmounted (when `renderer` is `'onlyWhenVisible'`)
- Not assume they are the only visible component on screen

## Contract 2: Panel Registry

The panel registry maps string identifiers to Svelte components:

```
Registry entry:
  id: string                    — unique identifier (e.g., "editor")
  title: string                 — default display title
  component: SvelteComponent    — the Svelte component constructor
  renderer: 'always' | 'onlyWhenVisible'
```

The `createComponent` factory function MUST:
- Accept `{ id: string, name: string }` where `name` is the registry ID
- Return a `SvelteContentRenderer` wrapping the registered component
- For unknown panel names: return a placeholder renderer displaying an error message (do NOT throw, to allow graceful restoration of saved layouts containing removed panel types)
- Work identically for both new panels and deserialized panels

## Contract 3: Layout Persistence

Layout persistence MUST use this flow:

```
Save:
  Trigger: onDidLayoutChange event (debounced 500ms)
  Action: api.toJSON() → add version field → JSON.stringify() → localStorage.setItem('actone:dockview-layout')

Restore:
  Trigger: onMount of DockLayout component
  Action: localStorage.getItem() → JSON.parse() → validate version → api.fromJSON()
  Fallback: apply default layout if restore fails or no saved layout exists

Reset:
  Trigger: View menu > Reset Layout
  Action: localStorage.removeItem('actone:dockview-layout') → apply default layout
```

## Contract 4: Navigation → Panel Opening

Sidebar and menu bar navigation MUST follow this contract:

```
When user clicks a navigation item for a view:
  1. Check if a panel with that ID already exists (api.getPanel(id))
  2. If exists: focus it (panel.api.setActive())
  3. If not exists: api.addPanel({ id, component: id, title, position: default })

Exceptions:
  - Settings pages (/settings/*) continue to use goto() for full-page navigation
```

## Contract 5: DockLayout Component API

The `DockLayout.svelte` wrapper component MUST expose:

```
Props:
  onReady: (api: DockviewApi) => void    — called after dockview is initialized
  class: string                           — optional CSS class for the container

Behavior:
  - Dynamically imports dockview-core (SSR-safe)
  - Creates dockview instance in onMount
  - Disposes dockview instance in onDestroy
  - Applies dark theme with ActOne CSS overrides
  - Container fills 100% of parent dimensions
```

## Contract 6: Default Layout

The default layout MUST produce:

```
┌──────────────────────────────────────────┐
│                                          │
│              Editor (80%)                │
│                                          │
├──────────────────────────────────────────┤
│         Diagnostics (20%)                │
└──────────────────────────────────────────┘
```

- Editor panel: `id: 'editor'`, occupies ~80% height, `renderer: 'always'`
- Diagnostics panel: `id: 'diagnostics'`, occupies ~20% height, docked below editor
- All other panels are closed by default; users open them via navigation
