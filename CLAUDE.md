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
- `sanyam-db` — Base `projects`/`project_files` tables with RLS helpers; `SchemaExtension` for 1:1 extension tables, `SchemaContribution` for domain tables
- `sanyam-langium` — Worker infrastructure (`createWorkerLanguageServer()`)
- `sanyam-app` — Hono API adapter (`createSanyamApi()`, `ApiRouteContribution`)
- `sanyam-auth` — Supabase SSR hooks, auth routes, admin client
- `sanyam-ai-provider` — `ProviderRegistry`, `createProviderRegistry()`, `discoverProviderManifests()`, `textConfigFromRegistry()`, `imageConfigFromRegistry()`, `importConfigFromRegistry()`
- `sanyam-ai-anthropic` — Anthropic provider (`createAnthropicProvider`, `anthropicManifest`)
- `sanyam-ai-openai` — OpenAI provider (`createOpenAiProvider`, `createOpenAiImageProvider`, `openaiManifest`)
- `sanyam-ai-local` — Local LLM provider (`createLocalProvider`, `localManifest`)
- `sanyam-ai-text` — AI text generation routes (generate, estimate)
- `sanyam-ai-chat` — Chat engine with conversation/message Hono routes (`ChatEngine`, `createAiChatRoutes`, `ConversationStore`, `MessageStore`)
- `sanyam-ai-image` — AI image generation routes (generate)
- `sanyam-ai-import` — AI-powered file import (text/markdown/docx/pdf → grammar files)
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
- Sanyam packages: ai-text, ai-chat, ai-image, ai-import, publishing
- AI chat: `sanyam-ai-chat` routes at `/api/ai-chat/` with Drizzle-backed `ConversationStore`/`MessageStore` (`$lib/server/chat-stores.ts`), `ChatEngine` for history management
- AI providers auto-discovered via `sanyam-ai-provider` ProviderRegistry (`$lib/server/ai-providers.ts`)
- Custom image providers (Midjourney, Flux, Local SD) registered via `$lib/ai/custom-image-providers.ts`

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
- @docugenix/sanyam-* 1.0.x for all packages (core, shared, db, langium, app, auth, ai-provider, ai-anthropic, ai-openai, ai-local, ai-text, ai-chat, ai-image, ai-import, publishing, config, diagrams, guide, test-utils)
- Supabase PostgreSQL (Drizzle ORM for schema/queries, sanyam-auth for auth, sanyam-db for RLS-aware connections)

## Recent Changes
- 012-ai-chat: Added AI chat panel as right fly-out sidebar. Integrated `@docugenix/sanyam-ai-chat` 0.15.0 with `ChatEngine`, Drizzle-backed `ConversationStore`/`MessageStore` (`conversations`/`chat_messages` tables with RLS). Updated all sanyam packages to 0.15.0. Removed unused `sanyam-editor-codemirror`/`sanyam-layout-dockview`. Fixed `BackendStore` for sanyam-ai-text 0.15.0 response format (`{ backends: [...] }` wrapper, `name` instead of `label`, local active selection).
- 011-sanyam-ai-provider: Migrated to sanyam-ai-provider 0.10.0. Replaced custom BackendRegistry/TextBackend/ImageBackend with sanyam ProviderRegistry + auto-discovery. Deleted backend-registry.ts, claude-api.ts, claude-max.ts, local-llm.ts, dalle.ts, text-backends.ts, image-backends.ts, provider-adapters.ts. Added ai-providers.ts server singleton, generation-context.ts domain type, custom-image-providers.ts for Midjourney/Flux/LocalSD. Cost estimator now uses ProviderRegistry.
- 010-sanyam-db-base-tables: Migrated to sanyam-db 0.9.0 base tables. Projects table uses sanyam-db's `name`/`lifecyclePhase`/`updatedAt` columns. Domain columns (authorName, genre, compositionMode, publishingMode) stored in `actone_project_ext` 1:1 extension table via SchemaExtension. `source_files` renamed to `project_files`. Old enums dropped, using text columns.
- 009-migrate-sanyam-packages: Migrated from @repo/* to @actone/* (local) + @docugenix/sanyam-* (external). Replaced SvelteKit API routes with Hono handlers. Worker uses createWorkerLanguageServer(). Auth delegated to sanyam-auth. Guide uses sanyam-guide. DB client from sanyam-db.
