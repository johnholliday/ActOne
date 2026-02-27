# Quickstart: Wire Studio Screens to Live Functions

**Feature Branch**: `004-wire-studio-screens`
**Date**: 2026-02-27

## Prerequisites

- Node.js >= 18
- pnpm v9
- Supabase local development running (`supabase start`)
- All packages built: `pnpm build`

## What This Feature Does

This feature connects ActOne Studio's 13 designed screens to their backing services. Currently, most screens display placeholder content and menu items do nothing when clicked. After this feature:

- **File > New Project** creates a real project in the database
- **Syntax highlighting** renders all ActOne DSL token types in color
- **All menu items** perform their described actions (no silent no-ops)
- **Spread Preview** shows actual manuscript content
- **Gallery** loads and manages visual assets
- **All screens** display data from the active project
- **User profile** section works (settings pages + sign out)
- **Export** page allows manuscript download

## Development Setup

```bash
# From repo root
pnpm install
pnpm build

# Start Supabase local
cd apps/studio
npx supabase start

# Run dev server
pnpm dev --filter=studio
```

## Key Files to Understand

| File | Purpose |
|------|---------|
| `apps/studio/src/routes/+layout.svelte` | Main IDE layout; wires MenuBar callbacks, user profile popup, project loading |
| `apps/studio/src/lib/components/MenuBar.svelte` | Menu bar with File/Edit/View/Run/Help menus and callback props |
| `apps/studio/src/lib/stores/project.svelte.ts` | Reactive project state (Svelte 5 runes) |
| `apps/studio/src/lib/stores/ast.svelte.ts` | Parsed AST state consumed by diagrams and Story Bible |
| `apps/studio/src/lib/project/lifecycle.ts` | Lifecycle stage transitions and validation |
| `apps/studio/src/lib/project/analytics.ts` | Compute metrics from AST for snapshots |
| `packages/shared/src/db/schema.ts` | Drizzle ORM schema (projects, sourceFiles, assets, etc.) |

## Testing Strategy

### Unit Tests (Vitest)

- Project creation flow (mock API, verify store updates)
- Lifecycle stage transitions (validate transition rules)
- Analytics metric computation from AST
- Empty state rendering for all data-dependent screens

### Integration Tests

- MenuBar callback wiring (verify all 6 callbacks are connected)
- Project context propagation (load project, navigate screens, verify data)
- User profile popup (click, verify menu items, verify sign-out)

### E2E Tests (Playwright)

- Full creation flow: sign in → New Project → type DSL → see highlighting
- Menu action sequence: create project → advance stage → take snapshot
- Spread Preview with real content
- Sign out flow

## Architecture Notes

- **No new database tables** — all tables already exist in the schema
- **No new API endpoints** — all APIs are already implemented
- **Primary work is UI wiring** — connecting callbacks, loading data, replacing placeholders
- **Svelte 5 runes** — all state management uses `$state`, `$derived`, `$effect`
- **RLS enforced** — all database access is scoped to the authenticated user via Supabase Row Level Security
