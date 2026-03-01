# Implementation Plan: Dockview Layout Manager

**Branch**: `005-dockview-layout` | **Date**: 2026-02-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-dockview-layout/spec.md`

## Summary

Replace the current single-page routing layout with a dockview-based multi-panel workspace. Install `dockview-core` (v5.0.0, zero dependencies, ~50KB gzipped) and create a Svelte 5 bridge layer using `IContentRenderer` to mount existing view components into dockable panels. The sidebar and menu bar remain fixed outside the docking container. All 13 existing views become dockable panels with drag-and-drop rearrangement, tabbed groups, resizable dividers, and layout persistence via `localStorage`.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode, ES2022 target, `moduleResolution: "Bundler"`)
**Primary Dependencies**: SvelteKit 2.53.x, Svelte 5.53.x (runes), dockview-core 5.0.0 (new)
**Storage**: Layout state in localStorage (client-side only); no database changes
**Testing**: Vitest 3.x (unit/integration), Playwright (E2E)
**Target Platform**: Modern desktop browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (SvelteKit)
**Performance Goals**: Default layout loads in <1s, drag-and-drop at 60fps, no visible layout shift
**Constraints**: Bundle addition <100KB gzipped; must not break existing 391 tests
**Scale/Scope**: 13 panel types, 1 docking container, 1 layout persistence store

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript Strict Mode & Pure ESM | PASS | dockview-core is ESM-compatible, TypeScript types included |
| II. Monorepo Discipline | PASS | All changes within `apps/studio`; no new packages needed |
| III. Quality Gates | PASS | Must pass `pnpm turbo build`, `pnpm turbo lint`, `prettier --check .` |
| IV. Forward-Only Versioning | PASS | Using latest dockview-core v5.0.0 |
| V. Complete Solutions | PASS | Full migration of all 13 views, not a partial implementation |
| VI. Single Source of Truth | PASS | Panel type definitions are UI-specific, stay in `apps/studio` |
| VII. Boundary Validation | PASS | Layout deserialization from localStorage should validate structure |
| VIII. TypeScript Computes; Claude Interprets | PASS | No LLM involvement in this feature |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/005-dockview-layout/
├── plan.md              # This file
├── research.md          # Phase 0: dockview-core API, Svelte 5 bridge patterns
├── data-model.md        # Phase 1: Panel registry, layout schema
├── quickstart.md        # Phase 1: Setup and verification steps
├── contracts/           # Phase 1: UI contracts for panel system
│   └── ui-contracts.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/studio/src/
├── lib/
│   ├── dockview/                    # NEW: Dockview integration layer
│   │   ├── SvelteContentRenderer.ts # IContentRenderer bridge for Svelte 5
│   │   ├── DockLayout.svelte        # Wrapper component (createDockview + lifecycle)
│   │   ├── panel-registry.ts        # Panel type → Svelte component mapping
│   │   ├── layout-persistence.ts    # Save/restore layout to localStorage
│   │   └── default-layout.ts        # Default panel arrangement
│   ├── components/
│   │   └── MenuBar.svelte           # MODIFIED: navigation opens panels
│   ├── stores/
│   │   ├── ui.svelte.ts             # MODIFIED: remove old panel resize state
│   │   └── editor.svelte.ts         # UNCHANGED
│   └── settings/
│       └── layout.ts                # MODIFIED: adapt to dockview layout schema
├── routes/
│   ├── +layout.svelte               # MODIFIED: replace main content area with DockLayout
│   └── +page.svelte                 # MODIFIED: becomes panel content, not full page
└── ...

apps/studio/tests/
├── unit/
│   ├── panel-registry.test.ts       # NEW: panel type mapping tests
│   └── layout-persistence.test.ts   # MODIFIED: adapt to dockview serialization
└── integration/
    └── dockview-layout.test.ts      # NEW: panel open/close/serialize tests
```

**Structure Decision**: All dockview integration code lives in `apps/studio/src/lib/dockview/` as a cohesive module. No new workspace packages are created. The existing route components are adapted to work as panel content rather than standalone pages.
