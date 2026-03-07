# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- TypeScript monorepo: pnpm workspaces + Turborepo
- Web: SvelteKit + Tailwind CSS
- Package manager: pnpm (strict, v10) — do not use npm or yarn
- Node >= 18
- No Python
- External packages: `@docugenix/sanyam-*` (published to GitHub Packages)

## Commands

- `pnpm build` — build all packages (via Turborepo)
- `pnpm dev` — dev server for all apps
- `pnpm lint` — lint all packages
- `pnpm format` — format all .ts/.tsx/.md files with Prettier
- `pnpm check-types` — typecheck all packages
- `turbo run build --filter=<package>` — build a specific package
- `turbo run lint --filter=<package>` — lint a specific package
- `turbo run dev --filter=<app>` — dev server for a specific app

## Architecture

### Monorepo Layout

- `apps/studio/` — ActOne Studio (SvelteKit + Svelte 5)
- `packages/` — local shared libraries:
  - `@actone/shared` (`packages/shared-actone`) — Domain types (`SerializedStory*`, lifecycle, composition), DB schemas (Drizzle + RLS), constants, enums, validation
  - `@actone/lang` (`packages/lang-actone`) — Langium grammar, 10 custom services, domain serializer, web worker LSP server
- `guide/` — Eleventy-based documentation (uses `@docugenix/sanyam-guide`)

### External Dependencies (@docugenix/sanyam-*)

Published to GitHub Packages (`@docugenix:registry=https://npm.pkg.github.com`):
- `sanyam-core` — Plugin container, contribution points, loader
- `sanyam-shared` — Generic Zod utilities, string-utils
- `sanyam-db` — Base `projects`/`source_files` tables with RLS helpers; ActOne extends via `SchemaContribution`
- `sanyam-langium` — Worker infrastructure (`createWorkerLanguageServer()`)
- `sanyam-app` — Hono API adapter (`createSanyamApi()`, `ApiRouteContribution`)
- `sanyam-auth` — Supabase SSR hooks, auth routes, admin client
- `sanyam-ai-text` — AI text generation routes (generate, estimate, backends)
- `sanyam-ai-image` — AI image generation routes (generate, backends)
- `sanyam-publishing` — Publishing routes (export, preview, dependencies)
- `sanyam-config` — ESLint configs (`eslint-base`, `eslint-svelte`) + tsconfig presets (`base.json`, `library.json`, `sveltekit.json`)
- `sanyam-diagrams` — ELK layout + AST→graph transformer
- `sanyam-editor-codemirror` — CodeMirror 6 integration
- `sanyam-layout-dockview` — Dockview layout integration
- `sanyam-guide` — Eleventy config factory + Vite dev-server plugin
- `sanyam-test-utils` — Shared Vitest fixtures, mock factories

### API Routing

API routes are handled by Hono via `createSanyamApi()` in `hooks.server.ts`:
- Local handlers in `$lib/api/`: project, draft, analytics, character/visual-dna
- Sanyam packages: ai-text, ai-image, publishing

### TypeScript Configuration

Extends `@docugenix/sanyam-config/library.json` for packages. Studio uses SvelteKit's generated tsconfig. Strict mode, ES2022 target, Bundler module resolution.

### ESLint Configuration

Uses ESLint 9 flat config format (`.mjs` files). Packages import from `@docugenix/sanyam-config/eslint-base`, studio from `@docugenix/sanyam-config/eslint-svelte`.

### Turborepo Pipeline

- `build` — depends on `^build` (dependencies build first)
- `lint` — depends on `^lint`
- `check-types` — depends on `^check-types`
- `dev` — not cached, persistent

## Conventions

- All code in TypeScript (strict mode)
- ESLint + Prettier enforced
- Commit messages: conventional commits
- Tests required before merge

## Active Technologies
- TypeScript 5.9.x (strict mode, ES2022 target, `moduleResolution: "Bundler"`) + SvelteKit 2.53.x, Svelte 5.53.x (runes), Langium 4.2.x, @xyflow/svelte 1.5.x, CodeMirror 6, dockview-core 5.0.0, Hono 4.x, Drizzle ORM 0.45.x, @supabase/supabase-js 2.97.x, Tailwind CSS 4.2.x, Zod, lucide-svelte, Eleventy 3.1.x
- @docugenix/sanyam-* 0.8.x (core, shared, db, langium, app, auth, ai-text, ai-image, publishing, config, diagrams, editor-codemirror, layout-dockview, guide, test-utils)
- Supabase PostgreSQL (Drizzle ORM for schema/queries, sanyam-auth for auth, sanyam-db for RLS-aware connections)

## Recent Changes
- 009-migrate-sanyam-packages: Migrated from @repo/* to @actone/* (local) + @docugenix/sanyam-* (external). Replaced SvelteKit API routes with Hono handlers. Worker uses createWorkerLanguageServer(). Auth delegated to sanyam-auth. Guide uses sanyam-guide. DB client from sanyam-db.
