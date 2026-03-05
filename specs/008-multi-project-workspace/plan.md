# Implementation Plan: Multi-Project Workspace

**Branch**: `008-multi-project-workspace` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-multi-project-workspace/spec.md`

## Summary

Enable users to have multiple projects open simultaneously in the ActOne Studio workspace. The core change is transitioning from a single-project singleton architecture to a workspace-aware multi-project model where: (1) a `WorkspaceStore` tracks open projects and the active project, (2) all stores use compound keys to isolate per-project state, (3) context switching is driven reactively by editor tab focus, (4) a project browser dialog allows opening projects from the database, and (5) a two-step delete confirmation ensures safe permanent deletion.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode, ES2022 target, `moduleResolution: "Bundler"`)
**Primary Dependencies**: SvelteKit 2.53.x, Svelte 5.53.x (runes), Langium 4.2.x, @xyflow/svelte 1.5.x, CodeMirror 6, dockview-core 5.0.0, Drizzle ORM 0.45.x, @supabase/supabase-js 2.97.x, @supabase/ssr 0.8.x, Tailwind CSS 4.2.x, Zod, lucide-svelte
**Storage**: Supabase PostgreSQL (Drizzle ORM) for projects and files; localStorage for workspace state and layout persistence
**Testing**: Vitest 3.x for unit/integration tests
**Target Platform**: Web browser (SvelteKit SSR + CSR)
**Project Type**: Web application (SvelteKit)
**Performance Goals**: Context switching <100ms for cached projects, <1s if AST re-parse needed; project open <2s
**Constraints**: No database schema changes; workspace state is device-local (localStorage); existing auto-save and Langium parsing must continue to work
**Scale/Scope**: 2-10 simultaneously open projects per workspace; <100 total projects per user in database

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript Strict Mode & Pure ESM | PASS | All new code in TypeScript strict mode, ESM modules |
| II. Monorepo Discipline | PASS | Changes within existing `apps/studio` and `packages/shared` packages |
| III. Quality Gates | PASS | `pnpm turbo build`, `pnpm turbo lint`, `prettier --check .` must pass |
| IV. Forward-Only Versioning | PASS | No version changes needed; using existing dependencies |
| V. Complete Solutions | PASS | Full multi-project support with all 5 user stories addressed |
| VI. Single Source of Truth | PASS | New shared types (`WorkspaceState`, enhanced `OpenFile`) defined in `packages/shared/src/types/index.ts` |
| VII. Boundary Validation | PASS | Delete API validates project ownership; project browser data validated at query boundary |
| VIII. TypeScript Computes; Claude Interprets | PASS | No LLM involvement in this feature |

**Gate Result**: PASS — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/008-multi-project-workspace/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── workspace-store.md
│   ├── project-browser-dialog.md
│   ├── delete-project-dialog.md
│   ├── context-switching.md
│   └── editor-tab-disambiguation.md
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
apps/studio/src/
├── lib/
│   ├── stores/
│   │   ├── workspace.svelte.ts          # NEW: WorkspaceStore
│   │   ├── project.svelte.ts            # MODIFIED: multi-project caching
│   │   ├── editor.svelte.ts             # MODIFIED: project-aware tabs
│   │   ├── ast.svelte.ts                # MODIFIED: compound keys
│   │   └── diagrams.svelte.ts           # MODIFIED: compound keys
│   ├── components/
│   │   ├── ProjectBrowserDialog.svelte  # NEW: project browser modal
│   │   ├── DeleteProjectDialog.svelte   # NEW: two-step delete modal
│   │   ├── ProjectSection.svelte        # MODIFIED: multi-instance, active state
│   │   └── MenuBar.svelte               # MODIFIED: new menu items
│   ├── panels/
│   │   ├── EditorPanel.svelte           # MODIFIED: tab disambiguation, context
│   │   ├── DiagramPanel.svelte          # MODIFIED: project-scoped views
│   │   └── ProblemsPanel.svelte         # MODIFIED: project-scoped diagnostics
│   └── editor/
│       └── langium-workers.ts           # NEW: per-project worker management
├── routes/
│   ├── +layout.svelte                   # MODIFIED: multi-project sidebar, restore
│   ├── +layout.server.ts                # MODIFIED: return all user projects
│   └── api/project/[id]/
│       └── +server.ts                   # NEW: DELETE endpoint
└── ...

packages/shared/src/
└── types/index.ts                       # MODIFIED: add WorkspaceState, OpenFile types
```

**Structure Decision**: All changes fit within the existing monorepo structure. No new packages or apps needed. The `WorkspaceStore` is the only entirely new store; all other stores are enhanced in-place. The delete API is a new endpoint following the existing `api/project/create` pattern.

## Complexity Tracking

No constitution violations to justify.
