# Research: Dockview Layout Manager

**Feature**: 005-dockview-layout
**Date**: 2026-02-28

## R1: Package Selection

**Decision**: Use `dockview-core` v5.0.0 (not `dockview`, `dockview-vue`, or `dockview-angular`)

**Rationale**: `dockview-core` is the framework-agnostic foundation layer with zero dependencies. The framework-specific packages (`dockview` for React, `dockview-vue`, `dockview-angular`) are thin adapter layers built on top of `dockview-core`. Since there is no official Svelte package, we use `dockview-core` directly and implement our own Svelte 5 bridge, following the same pattern as the Vue adapter.

**Alternatives considered**:
- `dockview` (React wrapper) — requires React, incompatible with Svelte
- `svelte-dock` (npm) — minimal community package, not maintained, not dockview-based
- Building a custom docking system — massive effort, dockview already solves this with zero dependencies
- golden-layout — older project, React-focused, heavier, less active maintenance

**Bundle impact**: 49.5KB gzipped (JS only), zero dependencies. CSS file is separate and small.

## R2: Svelte 5 Integration Pattern

**Decision**: Create a `SvelteContentRenderer` class implementing `IContentRenderer` that uses Svelte 5's `mount()` / `unmount()` functions to manage component lifecycle inside dockview panel containers.

**Rationale**: This follows the exact pattern used by the official Vue adapter (`VueRenderer` class). The key interface is `IContentRenderer` which requires:
- `element: HTMLElement` — the DOM element dockview positions and sizes
- `init(params)` — called when panel is created; mount the Svelte component here
- `update?(event)` — called when params change; update via a writable store
- `dispose?()` — called on panel close; unmount the Svelte component here

**Key implementation details**:
- Use `svelte/store` writable for params propagation (Svelte 5's `mount()` returns an instance without `$set()`)
- Each panel component receives `api` (DockviewPanelApi), `containerApi` (DockviewApi), `title`, and `panelParams` (writable store) as props
- The `createComponent` factory function maps panel `name` strings to Svelte component constructors
- Use `$state.raw` or plain variable for the DockviewApi reference — do NOT put it inside deep reactive `$state` tracking

**Alternatives considered**:
- Using `svelte-dockview-example` patterns directly — community example uses dockview v4.x API (`components: {}` in constructor), which is outdated in v5.0.0
- Using `$state` for params — would work but writable stores are more established for cross-framework communication
- Unmount/remount on update — loses component state, unacceptable for editor/diagrams

## R3: Layout Serialization & Persistence

**Decision**: Use dockview's built-in `api.toJSON()` / `api.fromJSON()` for serialization, stored in `localStorage` under key `actone:dockview-layout`.

**Rationale**: Dockview's serialization captures the complete grid tree (panel positions, sizes, groups, active states) as a JSON object. The `fromJSON()` method reconstructs the layout by calling `createComponent` for each panel, passing the saved `params`. This means:
- Panel `params` must be JSON-serializable (no functions, no circular references)
- The `createComponent` factory is called for both new panels AND deserialized panels
- Unknown panel types (from outdated saved layouts) should be handled gracefully in the factory function

**Persistence strategy**:
- Save on `onDidLayoutChange` event (debounced, ~500ms)
- Restore on mount from `localStorage`
- Validate saved layout before restoring (check version/schema)
- Fall back to default layout if restoration fails
- Replace existing `actone:layout` localStorage key with `actone:dockview-layout`

**Alternatives considered**:
- Custom serialization — unnecessary complexity, dockview handles this natively
- Server-side persistence (Supabase) — overkill for client-side layout preferences; localStorage is sufficient
- Session storage — wouldn't persist across browser closes

## R4: SSR Handling

**Decision**: Dynamic `import()` of `dockview-core` inside `onMount()` to ensure all dockview code runs client-side only.

**Rationale**: Dockview requires DOM APIs (`HTMLElement`, `document.createElement`, `ResizeObserver`) that don't exist during SSR. SvelteKit's `onMount` only runs on the client. Dynamic import ensures the module isn't evaluated during server-side rendering.

**Pattern**:
```
onMount(async () => {
    const { createDockview, themeDark } = await import('dockview-core');
    // ... initialization
});
```

The CSS can be imported statically since the bundler extracts it at build time.

## R5: Theme & Styling

**Decision**: Use `themeDark` (built-in dark theme) as the base, with CSS custom property overrides to match the ActOne Studio dark theme.

**Rationale**: The existing app uses a dark theme with `surface-800`, `surface-850`, `surface-900` colors, amber accents, and `#252525` borders. Dockview's `themeDark` provides a VS Code-like dark baseline. CSS custom properties (`--dv-group-view-background-color`, `--dv-tabs-and-actions-container-background-color`, etc.) can be overridden to match.

**Key properties to customize**:
- `--dv-group-view-background-color` → match `surface-850`/`surface-900`
- `--dv-tabs-and-actions-container-background-color` → match `surface-800`
- `--dv-activegroup-visiblepanel-tab-color` → amber accent
- `--dv-separator-border` → `#252525`
- `--dv-tabs-and-actions-container-height` → `32px` (match current toolbar height)

## R6: Navigation Model Change

**Decision**: Sidebar and menu bar navigation items call `dockApi.addPanel()` (or focus existing panel) instead of SvelteKit `goto()` for main content views. Settings pages remain as full-page routes.

**Rationale**: The core value of dockview is multi-panel viewing. If navigation still performs full-page routing, panels would be destroyed on each navigation. Instead:
- Sidebar nav items → open/focus panel in dockview
- Menu bar items → open/focus panel in dockview
- Settings pages → remain as `goto()` routes (outside docking scope)
- The dockview container replaces the `{@render children()}` slot for the main content area

**Panel identity**: Each view type has a singleton panel ID (e.g., `"editor"`, `"story-structure"`, `"statistics"`). Opening a view that's already in a panel focuses it rather than creating a duplicate.

## R7: Panel Type Registry

**Decision**: Create a `panel-registry.ts` that maps panel type IDs to their Svelte component, title, and icon.

**Panel types** (14 total):

| Panel ID | Component | Title | Notes |
|----------|-----------|-------|-------|
| `editor` | +page.svelte (editor content) | Editor | Primary panel, always in default layout |
| `story-structure` | diagram/story-structure | Story Structure | SvelteFlow canvas |
| `character-network` | diagram/character-network | Character Network | SvelteFlow canvas |
| `world-map` | diagram/world-map | World Map | SvelteFlow canvas |
| `timeline` | diagram/timeline | Timeline | SvelteFlow canvas |
| `interaction` | diagram/interaction | Interaction Sequence | SvelteFlow canvas |
| `story-bible` | story-bible | Story Bible | Tabbed reference |
| `gallery` | gallery | Gallery | Asset grid |
| `reading-mode` | reading-mode | Reading Mode | Book preview |
| `spread-preview` | spread-preview | Spread Preview | Print preview |
| `statistics` | statistics | Statistics | Analytics dashboard |
| `export` | export | Export | Export dialog |
| `outline` | (extracted from +page.svelte) | Outline | Document symbols |
| `diagnostics` | (extracted from +layout.svelte) | Problems | LSP diagnostics |

## R8: Renderer Mode for Stateful Panels

**Decision**: Use `renderer: 'always'` for the editor panel and `renderer: 'onlyWhenVisible'` (default) for all others.

**Rationale**: The editor panel contains CodeMirror + Langium LSP client state that is expensive to reinitialize. `'always'` keeps the DOM alive even when the panel is hidden behind a tab. Other panels (diagrams, story bible, etc.) can be safely unmounted and remounted when they become visible.
