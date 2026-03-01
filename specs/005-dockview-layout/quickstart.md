# Quickstart: Dockview Layout Manager

**Feature**: 005-dockview-layout
**Date**: 2026-02-28

## Prerequisites

- Node.js >= 18
- pnpm v9
- Repository cloned and dependencies installed (`pnpm install`)

## Setup

```bash
# Switch to feature branch
git checkout 005-dockview-layout

# Install dockview-core
pnpm --filter=studio add dockview-core

# Verify installation
pnpm build --filter=studio
```

## Key Files

| File | Purpose |
|------|---------|
| `apps/studio/src/lib/dockview/SvelteContentRenderer.ts` | Bridge: mounts Svelte components into dockview panels |
| `apps/studio/src/lib/dockview/DockLayout.svelte` | Wrapper component managing dockview lifecycle |
| `apps/studio/src/lib/dockview/panel-registry.ts` | Maps panel IDs to Svelte components |
| `apps/studio/src/lib/dockview/layout-persistence.ts` | Save/restore layout to localStorage |
| `apps/studio/src/lib/dockview/default-layout.ts` | Default panel arrangement |
| `apps/studio/src/routes/+layout.svelte` | Modified: main content area uses DockLayout |

## Verification Steps

### 1. Build passes
```bash
pnpm build --filter=studio
```

### 2. Tests pass
```bash
pnpm --filter=studio test
```

### 3. Dev server works
```bash
pnpm dev --filter=studio
```

### 4. Manual checks
- [ ] Default layout shows editor + diagnostics panels
- [ ] Clicking sidebar nav items opens new panels (not full-page navigation)
- [ ] Panels can be dragged to new positions
- [ ] Panels can be tabbed together
- [ ] Dividers between panels can be dragged to resize
- [ ] Layout persists after page refresh
- [ ] View > Reset Layout restores default arrangement
- [ ] Sidebar and menu bar remain functional and unchanged
- [ ] Editor save (Ctrl+S) and auto-save work inside panel
- [ ] All 5 diagram types render correctly in panels
- [ ] Story Bible, Gallery, Statistics render correctly in panels

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    MenuBar (fixed)                    │
├──────────┬──────────────────────────────────────────┤
│          │                                           │
│ SIDEBAR  │         DockLayout Container              │
│ (fixed)  │  ┌─────────────┬────────────────┐        │
│          │  │   Editor     │  Story Bible   │        │
│          │  │  (panel)     │   (panel)      │        │
│          │  ├─────────────┴────────────────┤        │
│          │  │     Diagnostics (panel)       │        │
│          │  └──────────────────────────────┘        │
├──────────┴──────────────────────────────────────────┤
```

The DockLayout component replaces the `{@render children()}` + bottom panel + outline panel in the current layout. The sidebar and menu bar remain outside the docking framework.
