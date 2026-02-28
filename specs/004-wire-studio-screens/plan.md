# Implementation Plan: Wire Studio Screens to Live Functions

**Branch**: `004-wire-studio-screens` | **Date**: 2026-02-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-wire-studio-screens/spec.md`

## Summary

Connect all 13 ActOne Studio screens to their backing services and APIs. Currently, menu items silently no-op, screens display placeholder content, syntax highlighting is missing (fixed by prior LSP work), and the user profile section is inert. This feature wires every UI element to real data — project creation, lifecycle management, analytics snapshots, prose generation, manuscript preview, gallery assets, diagram data, user settings, and export — by connecting existing Svelte components to existing SvelteKit API routes and Supabase services. No new database tables or API endpoints are needed; the work is entirely UI wiring and data loading.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode, ES2022 target, `moduleResolution: "Bundler"`)
**Primary Dependencies**: SvelteKit 2.53.x, Svelte 5.53.x (runes), Langium 4.2.x, @xyflow/svelte 1.5.x, CodeMirror 6, Drizzle ORM 0.45.x, @supabase/supabase-js 2.97.x, @supabase/ssr 0.8.x, Tailwind CSS 4.2.x, Zod
**Storage**: Supabase PostgreSQL (Drizzle ORM for schema/queries, Supabase client for auth/storage)
**Testing**: Vitest (unit), Playwright (E2E)
**Target Platform**: Web (modern browsers, SvelteKit with Node adapter)
**Project Type**: Web application (SvelteKit full-stack)
**Performance Goals**: Syntax highlighting within 2s of editor load, inline loading indicators within 200ms, sign-out redirect within 2s, project creation within 5s
**Constraints**: All data scoped to authenticated user via RLS, no blocking UI during async operations
**Scale/Scope**: 13 screens, 19 functional requirements, 6 menu action wirings, 3 new settings routes, 1 new export route

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript Strict Mode & Pure ESM | PASS | All code is TypeScript strict, pure ESM. No new packages. |
| II. Monorepo Discipline | PASS | All changes within `apps/studio/` (existing workspace). No new packages. |
| III. Quality Gates (NON-NEGOTIABLE) | PASS | Must pass `pnpm turbo build`, `pnpm turbo lint`, `prettier --check .`. |
| IV. Forward-Only Versioning | PASS | No dependency changes needed. |
| V. Complete Solutions | PASS | Full wiring of all 13 screens and 19 FRs. No shortcuts. |
| VI. Single Source of Truth | PASS | Types imported from `@repo/shared`. Form-local types only where needed. |
| VII. Boundary Validation | PASS | API responses validated with Zod at call sites. Supabase auth responses validated. |
| VIII. TypeScript Computes; Claude Interprets | PASS | No new LLM integration. AI generation triggers use existing validated pipelines. |

**Post-Phase 1 Re-check**: All gates still pass. No new packages, no schema changes, no LLM integration changes.

## Project Structure

### Documentation (this feature)

```text
specs/004-wire-studio-screens/
├── plan.md              # This file
├── research.md          # Phase 0: research findings
├── data-model.md        # Phase 1: entity documentation
├── quickstart.md        # Phase 1: developer onboarding
├── contracts/
│   └── ui-contracts.md  # Phase 1: UI-to-API integration contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/studio/src/
├── routes/
│   ├── +layout.svelte                          # MODIFY: wire all MenuBar callbacks, add project loader,
│   │                                           #         add user profile popup, add New Project dialog
│   ├── +layout.server.ts                       # MODIFY: load user's projects in server load function
│   ├── +page.svelte                            # MODIFY: load active project's entry file into editor
│   ├── gallery/
│   │   ├── +page.svelte                        # MODIFY: replace empty assets with loaded data
│   │   └── +page.server.ts                     # CREATE: server load function to query assets
│   ├── spread-preview/
│   │   └── +page.svelte                        # MODIFY: fetch real manuscript content from preview API
│   ├── statistics/
│   │   └── +page.svelte                        # MODIFY: load analytics from active project
│   ├── story-bible/
│   │   └── +page.svelte                        # MODIFY: verify AST data from active project
│   ├── reading-mode/
│   │   └── +page.svelte                        # MODIFY: verify content from active project
│   ├── diagram/
│   │   ├── story-structure/+page.svelte        # MODIFY: replace hardcoded projectId with store
│   │   ├── character-network/+page.svelte      # MODIFY: replace hardcoded projectId with store
│   │   ├── world-map/+page.svelte              # MODIFY: replace hardcoded projectId with store
│   │   ├── timeline/+page.svelte               # MODIFY: replace hardcoded projectId with store
│   │   └── interaction/+page.svelte            # MODIFY: replace hardcoded projectId with store
│   ├── export/
│   │   └── +page.svelte                        # CREATE: export page with format selection
│   ├── settings/
│   │   ├── profile/+page.svelte                # CREATE: profile settings (display name, avatar)
│   │   ├── account/+page.svelte                # CREATE: account settings (email, password, OAuth)
│   │   └── appearance/+page.svelte             # CREATE: appearance settings (theme, font)
│   └── auth/                                   # NO CHANGE: existing auth pages
├── lib/
│   ├── components/
│   │   ├── MenuBar.svelte                      # MODIFY: disable Help > User's Guide with "Coming Soon"
│   │   ├── NewProjectDialog.svelte             # CREATE: modal dialog for project creation
│   │   ├── LoadingSpinner.svelte               # CREATE: reusable inline loading indicator
│   │   └── EmptyState.svelte                   # CREATE: reusable empty state component
│   ├── stores/
│   │   └── project.svelte.ts                   # MODIFY: add loadFromServer() method
│   └── editor/                                 # NO CHANGE: LSP wiring already done
└── tests/
    ├── unit/                                   # Tests for project loading, menu wiring, analytics
    └── e2e/                                    # E2E tests for full user flows
```

**Structure Decision**: All changes are within the existing `apps/studio/` workspace. This is a SvelteKit full-stack application using file-based routing. New routes (`/export`, `/settings/*`) follow the existing flat route pattern. New components (`NewProjectDialog`, `LoadingSpinner`, `EmptyState`) are placed in `lib/components/` alongside existing components. No new packages or workspaces are created.

## Complexity Tracking

No constitution violations. All changes are within existing architectural boundaries.

| Aspect | Assessment |
|--------|-----------|
| New routes | 4 (export, settings/profile, settings/account, settings/appearance) — all simple form pages |
| New components | 3 (NewProjectDialog, LoadingSpinner, EmptyState) — small, reusable |
| Modified files | ~15 existing files — primarily adding data loading and callback wiring |
| New API endpoints | 0 — all APIs already exist |
| Schema changes | 0 — all tables already exist |
| New packages | 0 — no new workspace packages |
