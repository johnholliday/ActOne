# Implementation Plan: ActOne Studio

**Branch**: `002-actone-studio` | **Date**: 2026-02-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-actone-studio/spec.md`

## Summary

ActOne Studio is an AI-orchestrated fiction writing application where authors define stories using a structured DSL (`.actone` files) and the system provides language-server-grade editing, five diagram views, AI prose/image generation, and multi-format publishing. The implementation uses a Langium grammar running in a browser web worker (zero-latency language intelligence), SvelteKit for the web application, SvelteFlow for diagrams, Supabase for persistence/auth/storage, and Drizzle ORM for type-safe database access.

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict mode, ES2022 target, `moduleResolution: "Bundler"`)
**Primary Dependencies**: SvelteKit 2.53.x, Svelte 5.53.x, Langium 4.2.x, @xyflow/svelte 1.5.x, CodeMirror 6, elkjs 0.11.x, Drizzle ORM 0.45.x, @supabase/supabase-js 2.97.x, @supabase/ssr 0.8.x, Zod, Tailwind CSS 4.2.x, docx 9.6.x, archiver 7.x, pdfkit 0.17.x, sharp 0.34.x, marked 17.x
**Storage**: Supabase PostgreSQL (Drizzle ORM for schema/queries, Supabase client for auth/storage/realtime)
**Testing**: Vitest for unit/integration, Playwright for E2E
**Target Platform**: Browser (web app) + Node.js server (SvelteKit adapter-node)
**Project Type**: Web application (Turborepo monorepo with 2 new packages + 1 new app)
**Performance Goals**: <200ms editor validation latency, <2s diagram update, <1s generation stream start
**Constraints**: Langium runs in browser web worker (no server-side parsing), Supabase RLS for per-user data isolation, all external data validated with Zod
**Scale/Scope**: Single-user per session, projects up to 50 characters, 100 scenes, 10 source files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --------- | ------ | ----- |
| I. TypeScript Strict Mode & Pure ESM | PASS | All packages: `strict: true`, `moduleResolution: "Bundler"`, `target: "ES2022"`, `"type": "module"`. No Python. |
| II. Monorepo Discipline | PASS | New packages in `packages/`, new app in `apps/`. Each independently buildable via Turborepo. |
| III. Quality Gates | PASS | `pnpm turbo build`, `pnpm turbo lint`, `prettier --check .` enforced. Vitest + Playwright for tests. Conventional commits. |
| IV. Forward-Only Versioning | PASS | All dependencies at latest stable versions (Langium 4.2.x, Svelte 5.53.x, Drizzle 0.45.x, etc.). |
| V. Complete Solutions | PASS | Full implementation plan for all 8 user stories. Langium-generated code never overwritten — grammar is the source, CLI generates types. |
| VI. Single Source of Truth | PASS | `packages/shared/src/types/` is canonical. Langium-generated AST types live in `packages/langium` (generated code per Principle V) and are re-exported/adapted in `packages/shared`. |
| VII. Boundary Validation | PASS | Drizzle-Zod for DB schemas, Zod for all API request/response boundaries, Claude API responses validated before use. |
| VIII. TypeScript Computes; Claude Interprets | PASS | Claude/LLM used only for prose generation and image prompt building. All computation (parsing, validation, diagram transforms, publishing assembly) in TypeScript. LLM output validated through Zod before affecting state. |

**Post-Phase 1 re-check**: All principles remain satisfied. The data model uses Drizzle schemas with inline RLS policies (Principle VII). Langium AST types are generated, not hand-written (Principle V). Shared types canonically in `packages/shared` (Principle VI).

## Project Structure

### Documentation (this feature)

```text
specs/002-actone-studio/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research output
├── data-model.md        # Phase 1 data model
├── quickstart.md        # Phase 1 quickstart guide
├── contracts/
│   ├── api-endpoints.md # Server API contracts
│   └── worker-protocol.md # Langium worker protocol
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Phase 2 task breakdown (created by /speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── shared/                          # @repo/shared — canonical types + schemas
│   ├── src/
│   │   ├── types/
│   │   │   ├── index.ts             # Main re-export barrel
│   │   │   ├── ast.ts               # Serialized AST types (adapted from Langium)
│   │   │   ├── diagram.ts           # Diagram node/edge types (§12)
│   │   │   ├── generation.ts        # Generation request/response/stream types
│   │   │   ├── publishing.ts        # Export config/result types
│   │   │   └── project.ts           # Lifecycle, composition, manifest types
│   │   ├── db/
│   │   │   ├── schema.ts            # Drizzle table definitions + RLS policies
│   │   │   ├── relations.ts         # Drizzle relation definitions
│   │   │   └── schemas.ts           # Zod schemas (generated from Drizzle)
│   │   ├── constants/
│   │   │   ├── colors.ts            # Scene type colors, beat colors, edge styling
│   │   │   ├── enums.ts             # All DSL enum values
│   │   │   └── validation.ts        # Validation ranges (trait 0–100, weight −100–+100, etc.)
│   │   └── index.ts                 # Package barrel export
│   ├── package.json
│   ├── tsconfig.json
│   └── eslint.config.mjs
│
├── langium/                         # @repo/langium — grammar + language services
│   ├── src/
│   │   ├── actone.langium           # DSL grammar definition (source of truth)
│   │   ├── generated/               # langium-cli output (DO NOT EDIT)
│   │   │   ├── ast.ts               # Generated AST type interfaces
│   │   │   ├── grammar.ts           # Generated grammar module
│   │   │   └── module.ts            # Generated service module
│   │   ├── services/
│   │   │   ├── actone-module.ts     # Custom service overrides + DI wiring
│   │   │   ├── actone-validator.ts  # Semantic validation rules (§2.10)
│   │   │   ├── actone-scope.ts      # Scope provider (cross-references, composition modes)
│   │   │   ├── actone-completion.ts # Completion provider (context-aware suggestions)
│   │   │   ├── actone-hover.ts      # Hover provider (rich tooltips per element type)
│   │   │   ├── actone-formatter.ts  # Document formatter (2-space indent, normalization)
│   │   │   ├── actone-semantic-tokens.ts # Semantic token provider (highlighting)
│   │   │   ├── actone-references.ts # Definition/references/rename providers
│   │   │   ├── actone-symbols.ts    # Document symbol provider (outline)
│   │   │   └── actone-code-actions.ts # Code action provider (quick fixes)
│   │   ├── worker/
│   │   │   └── main-browser.ts      # Web worker entry point (LSP over postMessage)
│   │   └── index.ts                 # Package exports (createActOneServices, etc.)
│   ├── langium-config.json          # Langium CLI configuration
│   ├── package.json
│   ├── tsconfig.json
│   └── eslint.config.mjs
│
├── typescript-config/               # (existing) — add new presets
│   ├── base.json                    # (existing)
│   ├── react-library.json           # (existing)
│   ├── sveltekit.json               # NEW: SvelteKit app preset
│   └── library.json                 # NEW: Shared library preset (Bundler resolution)
│
├── eslint-config/                   # (existing) — add Svelte config
│   ├── base.js                      # (existing)
│   ├── react-internal.js            # (existing)
│   └── svelte.js                    # NEW: Svelte + TypeScript ESLint config
│
├── string-utils/                    # (existing, unchanged)
└── ui/                              # (existing, unchanged — React components, not used by Studio)

apps/
└── studio/                          # SvelteKit web application
    ├── src/
    │   ├── lib/
    │   │   ├── worker/
    │   │   │   ├── langium-worker.ts       # Web worker: Langium services + LSP
    │   │   │   └── supabase-fs-provider.ts # Custom FileSystemProvider for Supabase
    │   │   ├── server/
    │   │   │   ├── supabase.ts             # Server-side Supabase client (service role)
    │   │   │   └── db.ts                   # Drizzle client + RLS transaction wrapper
    │   │   ├── ast/
    │   │   │   ├── ast-utils.ts            # Finder/extractor functions (§10)
    │   │   │   ├── ast-visitor.ts          # Visitor pattern for AST traversal
    │   │   │   ├── type-guards.ts          # isCharacterDef(), isSceneDef(), etc.
    │   │   │   └── text-edit.ts            # TextEdit types + apply/sort utilities
    │   │   ├── editor/
    │   │   │   ├── EditorPane.svelte       # CodeMirror 6 wrapper component
    │   │   │   ├── langium-client.ts       # Main-thread LSP client (postMessage bridge)
    │   │   │   ├── langium-extension.ts    # CodeMirror extension (diagnostics, completions, etc.)
    │   │   │   └── supabase-client.ts      # Browser-side Supabase client
    │   │   ├── diagrams/
    │   │   │   ├── transformers/
    │   │   │   │   ├── story-structure.ts
    │   │   │   │   ├── character-network.ts
    │   │   │   │   ├── world-map.ts
    │   │   │   │   ├── timeline.ts
    │   │   │   │   └── interaction-sequence.ts
    │   │   │   ├── layout/
    │   │   │   │   ├── elk-layout.ts       # elkjs wrapper
    │   │   │   │   └── sidecar.ts          # Position override persistence
    │   │   │   ├── operations/
    │   │   │   │   ├── text-edit-generator.ts
    │   │   │   │   ├── conflict-resolver.ts
    │   │   │   │   └── stable-refs.ts
    │   │   │   ├── nodes/                  # Custom SvelteFlow node components
    │   │   │   │   ├── SceneNode.svelte
    │   │   │   │   ├── CharacterNode.svelte
    │   │   │   │   ├── LocationNode.svelte
    │   │   │   │   ├── WorldContainer.svelte
    │   │   │   │   ├── TimelineBlock.svelte
    │   │   │   │   └── LifelineNode.svelte
    │   │   │   └── edges/                  # Custom SvelteFlow edge components
    │   │   │       ├── BeatEdge.svelte
    │   │   │       ├── RelationshipEdge.svelte
    │   │   │       └── ExchangeArrow.svelte
    │   │   ├── ai/
    │   │   │   ├── backends/
    │   │   │   │   ├── backend-registry.ts
    │   │   │   │   ├── claude-api.ts
    │   │   │   │   ├── local-llm.ts
    │   │   │   │   ├── claude-max.ts
    │   │   │   │   ├── midjourney.ts
    │   │   │   │   ├── dalle.ts
    │   │   │   │   ├── flux.ts
    │   │   │   │   └── local-sd.ts
    │   │   │   ├── context-assembler.ts
    │   │   │   ├── prompt-builder.ts
    │   │   │   ├── cost-estimator.ts
    │   │   │   ├── draft-manager.ts
    │   │   │   └── visual-dna.ts
    │   │   ├── publishing/
    │   │   │   ├── manuscript-assembler.ts
    │   │   │   ├── epub-generator.ts
    │   │   │   ├── docx-generator.ts
    │   │   │   ├── pdf-generator.ts
    │   │   │   ├── html-preview.ts
    │   │   │   ├── kdp-config.ts
    │   │   │   └── cover-template.ts
    │   │   ├── graphic-novel/
    │   │   │   ├── panel-generator.ts
    │   │   │   ├── lettering-system.ts
    │   │   │   ├── page-renderer.ts
    │   │   │   └── spread-compositor.ts
    │   │   ├── project/
    │   │   │   ├── lifecycle.ts
    │   │   │   ├── composition.ts
    │   │   │   ├── snapshots.ts
    │   │   │   ├── analytics.ts
    │   │   │   ├── project-tree.ts
    │   │   │   └── creation-wizard.ts
    │   │   ├── stores/
    │   │   │   ├── project.svelte.ts       # Current project state ($state)
    │   │   │   ├── ast.svelte.ts           # Parsed AST ($state, pushed from worker)
    │   │   │   ├── editor.svelte.ts        # Editor state (open files, cursor)
    │   │   │   ├── diagrams.svelte.ts      # Diagram nodes/edges per view
    │   │   │   ├── generation.svelte.ts    # Generation state (streaming, drafts)
    │   │   │   ├── backends.svelte.ts      # Backend availability and selection
    │   │   │   └── ui.svelte.ts            # Panel visibility, layout preferences
    │   │   └── components/
    │   │       ├── MenuBar.svelte
    │   │       ├── ProjectNavigator.svelte
    │   │       ├── BottomPanelTabs.svelte
    │   │       ├── ProseGenerationPanel.svelte
    │   │       ├── DraftPanel.svelte
    │   │       ├── BackendSelector.svelte
    │   │       ├── VisualAssetsPanel.svelte
    │   │       ├── PublishingPanel.svelte
    │   │       └── GraphicNovelPanel.svelte
    │   ├── routes/
    │   │   ├── +layout.svelte              # App shell (sidebar + main + bottom)
    │   │   ├── +layout.server.ts           # Auth session loader
    │   │   ├── +layout.ts                  # Supabase client (browser/server)
    │   │   ├── +page.svelte                # Editor view (default route)
    │   │   ├── auth/
    │   │   │   ├── +page.svelte            # Login/signup
    │   │   │   ├── +page.server.ts         # Auth form actions
    │   │   │   └── confirm/+server.ts      # Email confirmation
    │   │   ├── diagram/
    │   │   │   ├── story-structure/+page.svelte
    │   │   │   ├── character-network/+page.svelte
    │   │   │   ├── world-map/+page.svelte
    │   │   │   ├── timeline/+page.svelte
    │   │   │   └── interaction/+page.svelte
    │   │   ├── gallery/+page.svelte
    │   │   ├── story-bible/+page.svelte
    │   │   ├── reading-mode/+page.svelte
    │   │   ├── spread-preview/+page.svelte
    │   │   ├── statistics/+page.svelte
    │   │   └── api/
    │   │       ├── ai-text/
    │   │       │   ├── generate/+server.ts
    │   │       │   ├── estimate/+server.ts
    │   │       │   └── backends/+server.ts
    │   │       ├── ai-image/
    │   │       │   ├── generate/+server.ts
    │   │       │   ├── backends/+server.ts
    │   │       │   └── visual-dna/+server.ts
    │   │       ├── draft/
    │   │       │   ├── list/+server.ts
    │   │       │   └── update/+server.ts
    │   │       ├── publishing/
    │   │       │   ├── export/+server.ts
    │   │       │   ├── preview/+server.ts
    │   │       │   └── dependencies/+server.ts
    │   │       ├── project/
    │   │       │   ├── create/+server.ts
    │   │       │   ├── manifest/+server.ts
    │   │       │   ├── lifecycle/+server.ts
    │   │       │   └── [id]/files/+server.ts
    │   │       └── analytics/
    │   │           ├── snapshot/+server.ts
    │   │           └── timeseries/+server.ts
    │   ├── app.html
    │   ├── app.css                         # Tailwind CSS imports + @theme
    │   ├── app.d.ts                        # SvelteKit type declarations
    │   └── hooks.server.ts                 # Supabase auth hooks
    ├── static/
    │   └── icons/
    ├── tests/
    │   ├── unit/                           # Vitest unit tests
    │   ├── integration/                    # Vitest integration tests
    │   └── e2e/                            # Playwright E2E tests
    ├── drizzle/                            # Generated migration files
    ├── drizzle.config.ts
    ├── svelte.config.js
    ├── vite.config.ts
    ├── tsconfig.json
    ├── eslint.config.mjs
    └── package.json
```

**Structure Decision**: Three-tier monorepo: shared types package (`@repo/shared`), Langium grammar package (`@repo/langium`), and SvelteKit application (`studio`). Project management, AI, publishing, and graphic novel logic lives in the app (not extracted to packages) because it has no consumers outside the app. The existing `@repo/ui` (React) is unchanged and not used by Studio.

## Complexity Tracking

No constitution violations to justify. The three new workspace entries (`packages/shared`, `packages/langium`, `apps/studio`) are the minimum required:
- `packages/shared` is required by Principle VI (canonical type location)
- `packages/langium` is required because Langium grammar + generated code must be independently buildable and bundled as a web worker (Principle II)
- `apps/studio` is the application itself
