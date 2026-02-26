# Tasks: ActOne Studio

**Input**: Design documents from `/specs/002-actone-studio/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `packages/shared/`, `packages/langium/`, `apps/studio/`
- Paths from plan.md project structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create workspace entries, configure tooling presets, initialize all package.json files

- [x] T001 Create `packages/shared/` directory structure with `src/types/`, `src/db/`, `src/constants/`, `package.json`, `tsconfig.json`, and `eslint.config.mjs`
- [x] T002 Create `packages/langium/` directory structure with `src/`, `src/services/`, `src/worker/`, `src/generated/` (.gitkeep), `package.json`, `tsconfig.json`, `langium-config.json`, and `eslint.config.mjs`
- [x] T003 Create `apps/studio/` SvelteKit scaffold with `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `package.json`, `src/app.html`, `src/app.css`, `src/app.d.ts`, and `drizzle.config.ts`
- [x] T004 [P] Create TypeScript preset `packages/typescript-config/library.json` extending `base.json` with `moduleResolution: "Bundler"` and `module: "ES2022"`
- [x] T005 [P] Create TypeScript preset `packages/typescript-config/sveltekit.json` extending `base.json` with `moduleResolution: "Bundler"` for Vite-based apps
- [x] T006 [P] Create ESLint config `packages/eslint-config/svelte.js` for Svelte + TypeScript flat config
- [x] T007 Update root `pnpm-workspace.yaml` to include `packages/shared`, `packages/langium`, and `apps/studio`
- [x] T008 Update root `turbo.json` to include build/dev/lint/check-types tasks for new packages with correct dependency ordering (`@repo/shared` → `@repo/langium` → `studio`)
- [x] T009 Install all dependencies by running `pnpm install` from repo root and verify workspace resolution

**Checkpoint**: Monorepo structure ready — all three workspace entries exist, tooling presets configured, dependencies installed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T010 Define Drizzle enums and the `projects` table with RLS policy in `packages/shared/src/db/schema.ts` per data-model.md §1.1–1.2
- [x] T011 Define `sourceFiles`, `snapshots`, `snapshotFiles`, `assets`, `analyticsSnapshots`, and `draftVersions` tables with RLS policies in `packages/shared/src/db/schema.ts` per data-model.md §1.3–1.8
- [x] T012 Define all Drizzle relation declarations in `packages/shared/src/db/relations.ts` per data-model.md §2
- [x] T013 Generate Zod schemas from Drizzle tables in `packages/shared/src/db/schemas.ts` using `createInsertSchema`/`createSelectSchema`/`createUpdateSchema` from `drizzle-orm/zod` per data-model.md §3
- [x] T014 [P] Define shared diagram types (`StableId`, `ActOneNode<T>`, `ActOneEdge<T>`, view-specific data types) in `packages/shared/src/types/diagram.ts` per data-model.md §6.1
- [x] T015 [P] Define shared generation types (`GenerationRequest`, `GenerationStreamEvent`, `CostEstimate`, `BackendInfo`) in `packages/shared/src/types/generation.ts` per data-model.md §6.2
- [x] T016 [P] Define shared publishing types (`ExportConfig`, `ExportResult`) in `packages/shared/src/types/publishing.ts` per data-model.md §6.3
- [x] T017 [P] Define shared project types (`LifecycleStage`, `CompositionMode`, `LifecycleTransition`, `VALID_TRANSITIONS`) in `packages/shared/src/types/project.ts` per data-model.md §6.4
- [x] T018 [P] Define constants for scene type colors, beat colors, edge styling in `packages/shared/src/constants/colors.ts`, DSL enum values in `packages/shared/src/constants/enums.ts`, and validation ranges in `packages/shared/src/constants/validation.ts`
- [x] T019 Create barrel exports for `packages/shared/src/types/index.ts`, `packages/shared/src/index.ts` re-exporting all types, db schemas, and constants
- [x] T020 Implement Supabase auth hooks in `apps/studio/src/hooks.server.ts` using `@supabase/ssr` with `safeGetSession()` pattern
- [x] T021 Implement server-side Supabase client (service role) in `apps/studio/src/lib/server/supabase.ts` and Drizzle client with RLS transaction wrapper in `apps/studio/src/lib/server/db.ts` per research.md R5
- [x] T022 Create SvelteKit layout files: `apps/studio/src/routes/+layout.server.ts` (auth session loader), `apps/studio/src/routes/+layout.ts` (browser Supabase client), and `apps/studio/src/routes/+layout.svelte` (app shell with sidebar + main + bottom zones)
- [x] T023 Create auth route: `apps/studio/src/routes/auth/+page.svelte` (login/signup), `apps/studio/src/routes/auth/+page.server.ts` (form actions), and `apps/studio/src/routes/auth/confirm/+server.ts` (email confirmation)
- [x] T024 Configure Tailwind CSS 4.x in `apps/studio/vite.config.ts` (add `tailwindcss()` plugin before `sveltekit()`) and set up `apps/studio/src/app.css` with `@import "tailwindcss"` and `@theme {}` block per research.md R9
- [x] T025 Create Svelte 5 rune stores: `apps/studio/src/lib/stores/project.svelte.ts` (project state), `apps/studio/src/lib/stores/editor.svelte.ts` (open files, cursor), and `apps/studio/src/lib/stores/ui.svelte.ts` (panel visibility, layout preferences)

**Checkpoint**: Foundation ready — database schema defined, auth working, app shell rendered, stores initialized. User story implementation can now begin in parallel.

---

## Phase 3: User Story 1 — Authoring Stories with the ActOne DSL (Priority: P1) 🎯 MVP

**Goal**: Authors can write `.actone` files with full language intelligence: syntax highlighting, validation, completion, hover, formatting, navigation, rename, and outline.

**Independent Test**: Open the editor, write a story with characters/scenes/worlds, verify all language features work (highlighting, red squiggles for invalid values, autocompletion of character names, hover tooltips, go-to-definition, rename, format).

### Implementation for User Story 1

- [x] T026 [US1] Write the ActOne DSL grammar in `packages/langium/src/actone.langium` defining all 8 element types (character, world, theme, timeline, scene, plot, interaction, generate block) with their full property sets, cross-references, enums, and comment syntax per spec FR-001/FR-009
- [x] T027 [US1] Configure Langium CLI in `packages/langium/langium-config.json` and add `build` script to `packages/langium/package.json` that runs `langium-cli generate` to produce `src/generated/ast.ts`, `src/generated/grammar.ts`, and `src/generated/module.ts`
- [x] T028 [US1] Run `langium-cli generate` to produce generated files, then create the custom service module with DI wiring in `packages/langium/src/services/actone-module.ts` registering all custom service overrides
- [x] T029 [US1] Implement semantic validator in `packages/langium/src/services/actone-validator.ts` with rules: personality trait values 0–100, relationship weights −100 to +100, temperature 0.0–2.0, continuity loss 0.0–1.0, mood values 0–100, max 1 generate block per story, no self-relationships, participants must reference defined characters per spec FR-003
- [x] T030 [US1] Implement scope provider in `packages/langium/src/services/actone-scope.ts` supporting single-file cross-reference resolution (character names in participants/pov/relationships, location references, timeline layer references) per spec FR-004
- [x] T031 [US1] Implement completion provider in `packages/langium/src/services/actone-completion.ts` with context-aware suggestions for cross-references, keywords, and enum values per spec FR-004
- [x] T032 [US1] Implement hover provider in `packages/langium/src/services/actone-hover.ts` with element-specific rich tooltips (character: nature/bio/top 3 traits/arc phase/relationship count; scene: type/participants/location; theme: statement/tension/motifs) per spec FR-005
- [x] T033 [US1] Implement document formatter in `packages/langium/src/services/actone-formatter.ts` normalizing to 2-space indentation, max 2 blank lines between blocks, preserving string content and comments per spec FR-007
- [x] T034 [P] [US1] Implement semantic token provider in `packages/langium/src/services/actone-semantic-tokens.ts` distinguishing definitions, references, keywords, strings, numbers, enums, and comments per spec FR-002
- [x] T035 [P] [US1] Implement definition/references/rename providers in `packages/langium/src/services/actone-references.ts` for cross-file navigation and multi-reference rename per spec FR-006
- [x] T036 [P] [US1] Implement document symbol provider in `packages/langium/src/services/actone-symbols.ts` for hierarchical outline organized by element type per spec FR-008
- [x] T037 [P] [US1] Implement code action provider in `packages/langium/src/services/actone-code-actions.ts` with quick fixes for common validation errors
- [x] T038 [US1] Create package barrel export in `packages/langium/src/index.ts` exporting `createActOneServices` and public types
- [x] T039 [US1] Define serialized AST types (stripping Langium internals, resolving cross-references to plain name strings) in `packages/shared/src/types/ast.ts` and re-export from `packages/shared/src/types/index.ts`
- [x] T040 [US1] Implement web worker entry point in `packages/langium/src/worker/main-browser.ts` using `BrowserMessageReader`/`BrowserMessageWriter` with `startLanguageServer()`, supporting standard LSP methods and custom extensions per contracts/worker-protocol.md
- [x] T041 [US1] Implement `langium-client.ts` in `apps/studio/src/lib/editor/langium-client.ts` — main-thread LSP client class handling postMessage ↔ LSP protocol translation, managing document lifecycle (didOpen/didChange/didClose), and dispatching responses per contracts/worker-protocol.md
- [x] T042 [US1] Implement CodeMirror extension in `apps/studio/src/lib/editor/langium-extension.ts` bridging CodeMirror to the Langium client: `linter()` for diagnostics, `autocompletion()` for completions, `ViewPlugin` for semantic token highlighting and didChange notifications, `hoverTooltip()` for hover info per research.md R6
- [x] T043 [US1] Create the `EditorPane.svelte` component in `apps/studio/src/lib/editor/EditorPane.svelte` wrapping CodeMirror 6 with the Langium extension, managing worker lifecycle (spawn, initialize, terminate), and connecting to the AST store
- [x] T044 [US1] Create Svelte 5 rune store `apps/studio/src/lib/stores/ast.svelte.ts` holding the parsed AST ($state, pushed from worker via `actone/getSerializedAst`), update trigger on `textDocument/publishDiagnostics`
- [x] T045 [US1] Create the main editor route at `apps/studio/src/routes/+page.svelte` embedding `EditorPane`, showing the outline panel (from document symbols), and displaying diagnostics in a bottom panel
- [x] T046 [US1] Create browser-side Supabase client in `apps/studio/src/lib/editor/supabase-client.ts` for file load/save operations and build the `SupabaseFileSystemProvider` in `apps/studio/src/lib/worker/supabase-fs-provider.ts` implementing Langium's `FileSystemProvider` interface with in-memory cache

**Checkpoint**: User Story 1 complete — the DSL editor provides full language intelligence. Authors can write `.actone` files with syntax highlighting, validation, completion, hover, formatting, navigation, rename, and outline.

---

## Phase 4: User Story 2 — Managing Projects (Priority: P2)

**Goal**: Authors can create projects, organize multi-file stories, switch composition modes, advance lifecycle stages, and take/restore snapshots.

**Independent Test**: Create a new project, add multiple files, switch composition modes, advance lifecycle stages (concept → draft → revision), take a snapshot, restore it, verify the project navigator shows all elements.

### Implementation for User Story 2

- [x] T047 [US2] Implement project creation logic in `apps/studio/src/lib/project/creation-wizard.ts` with title/author/genre inputs, initial entry `.actone` file generation with story skeleton
- [x] T048 [US2] Implement POST `/api/project/create/+server.ts` endpoint validating request with Zod, creating project + entry file in DB, returning project ID per contracts/api-endpoints.md §5
- [x] T049 [US2] Implement GET `/api/project/manifest/+server.ts` endpoint returning project metadata, file count, grammar version per contracts/api-endpoints.md §5
- [x] T050 [US2] Implement lifecycle transition logic in `apps/studio/src/lib/project/lifecycle.ts` enforcing valid transitions per `VALID_TRANSITIONS` from `@repo/shared`
- [x] T051 [US2] Implement snapshot capture and restore in `apps/studio/src/lib/project/snapshots.ts` — freezing file contents, word/scene/character counts, restoring from snapshot per spec FR-014/FR-015
- [x] T052 [US2] Implement POST `/api/project/lifecycle/+server.ts` endpoint handling stage transitions, capturing snapshots, detecting grammar fingerprint mismatches per contracts/api-endpoints.md §5 and spec FR-013/FR-016
- [x] T053 [US2] Implement POST `/api/project/[id]/files/+server.ts` endpoint for create/delete source file operations per contracts/api-endpoints.md §7
- [x] T054 [US2] Implement composition mode logic in `apps/studio/src/lib/project/composition.ts` — merge (unified namespace, duplicate error), overlay (last-defined wins), sequential (per-file namespaces) per spec FR-011/FR-012
- [x] T055 [US2] Update scope provider in `packages/langium/src/services/actone-scope.ts` to support multi-file cross-reference resolution according to composition mode (merge/overlay/sequential) and file priority ordering per spec FR-012
- [x] T056 [US2] Implement custom `actone/openProject` request handler in the web worker (`packages/langium/src/worker/main-browser.ts`) loading all project files into the Langium workspace and returning diagnostics summary per contracts/worker-protocol.md
- [x] T056b [US2] Implement `actone/updateFile` notification handler in `packages/langium/src/worker/main-browser.ts` for syncing external file changes to the worker's Langium workspace per contracts/worker-protocol.md
- [x] T056c [US2] Implement `actone/getAstForAllFiles` request handler in `packages/langium/src/worker/main-browser.ts` returning merged AST across all project files per contracts/worker-protocol.md
- [x] T057 [US2] Implement the semantic project navigator tree in `apps/studio/src/lib/components/ProjectNavigator.svelte` organized by element type (Characters, Worlds, Themes, Timelines, Scenes, Plots, Interactions) with click-to-navigate per spec FR-017
- [x] T058 [US2] Implement the project tree data extraction in `apps/studio/src/lib/project/project-tree.ts` building navigator tree from serialized AST, mapping nodes to source file locations
- [x] T059 [US2] Implement `apps/studio/src/lib/components/MenuBar.svelte` with Project menu (New, Advance Stage, Snapshot) and View menu (panel toggles) per spec FR-058

**Checkpoint**: User Story 2 complete — authors can create, manage, and organize multi-file projects with lifecycle tracking and snapshots.

---

## Phase 5: User Story 3 — Visual Story Planning with Diagrams (Priority: P3)

**Goal**: Authors can visualize their story through 5 diagram views with real-time updates, drag-to-reposition, bidirectional editing, and navigate from diagram nodes to source.

**Independent Test**: Write a story with characters, scenes, relationships, worlds, timelines, and interactions. Open each of the 5 diagram views and verify correct visualization, node interactions, and bidirectional editing.

### Implementation for User Story 3

- [x] T060 [P] [US3] Implement AST utility functions (finders, extractors) in `apps/studio/src/lib/ast/ast-utils.ts` and visitor pattern in `apps/studio/src/lib/ast/ast-visitor.ts` for traversing serialized ASTs
- [x] T061 [P] [US3] Implement type guards (`isCharacterDef()`, `isSceneDef()`, `isWorldDef()`, etc.) in `apps/studio/src/lib/ast/type-guards.ts`
- [x] T062 [P] [US3] Implement TextEdit types and apply/sort utilities in `apps/studio/src/lib/ast/text-edit.ts` for diagram-to-source edit operations
- [x] T063 [US3] Implement stable reference generation (`type:name` content-addressable IDs) in `apps/studio/src/lib/diagrams/operations/stable-refs.ts` per spec FR-027
- [x] T064 [US3] Implement ELK.js layout wrapper in `apps/studio/src/lib/diagrams/layout/elk-layout.ts` with algorithm configuration per view type (layered for story structure, force/stress for character network, layered with hierarchy for world map) per research.md R4
- [x] T065 [US3] Implement layout override persistence (sidecar) in `apps/studio/src/lib/diagrams/layout/sidecar.ts` storing manual position overrides separately from computed layout per spec FR-025
- [x] T066 [US3] Implement Story Structure transformer in `apps/studio/src/lib/diagrams/transformers/story-structure.ts` producing scene nodes (color-coded by type, sized by word count) with beat edges (colored by beat type) in chapter group containers per spec FR-019
- [x] T067 [P] [US3] Implement Character Network transformer in `apps/studio/src/lib/diagrams/transformers/character-network.ts` producing character circles (sized by scene count, colored by nature) with relationship edges (colored/sized by weight, dashed for dynamic) per spec FR-020
- [x] T068 [P] [US3] Implement World Map transformer in `apps/studio/src/lib/diagrams/transformers/world-map.ts` producing world containers with nested location nodes (colored by atmosphere), connection edges, and scene markers per spec FR-021
- [x] T069 [P] [US3] Implement Timeline transformer in `apps/studio/src/lib/diagrams/transformers/timeline.ts` producing horizontal swim-lanes per layer with scene blocks and arc phase bands per spec FR-022
- [x] T070 [P] [US3] Implement Interaction Sequence transformer in `apps/studio/src/lib/diagrams/transformers/interaction-sequence.ts` producing character lifelines with exchange arrows and style mix indicators per spec FR-023
- [x] T071 [P] [US3] Create custom SvelteFlow node components: `SceneNode.svelte`, `CharacterNode.svelte`, `LocationNode.svelte`, `WorldContainer.svelte`, `TimelineBlock.svelte`, `LifelineNode.svelte` in `apps/studio/src/lib/diagrams/nodes/`
- [x] T072 [P] [US3] Create custom SvelteFlow edge components: `BeatEdge.svelte`, `RelationshipEdge.svelte`, `ExchangeArrow.svelte` in `apps/studio/src/lib/diagrams/edges/`
- [x] T073 [US3] Create Svelte 5 rune store `apps/studio/src/lib/stores/diagrams.svelte.ts` holding nodes/edges per view type with `$state.raw()` for SvelteFlow performance per research.md R3
- [x] T074 [US3] Implement text edit generator in `apps/studio/src/lib/diagrams/operations/text-edit-generator.ts` producing `.actone` source edits from diagram operations (create/delete/rename elements) per spec FR-026
- [x] T075 [US3] Implement conflict resolver in `apps/studio/src/lib/diagrams/operations/conflict-resolver.ts` detecting and prompting for resolution when diagram edits conflict with concurrent source edits per spec FR-028
- [x] T076 [US3] Create diagram route `apps/studio/src/routes/diagram/story-structure/+page.svelte` embedding SvelteFlow with story structure transformer, custom nodes/edges, context menu (create/delete/rename scene), and double-click-to-navigate per spec FR-026/FR-029
- [x] T077 [P] [US3] Create diagram route `apps/studio/src/routes/diagram/character-network/+page.svelte` embedding SvelteFlow with character network transformer, context menu (create/delete/rename character), and double-click-to-navigate per spec FR-026/FR-029
- [x] T078 [P] [US3] Create diagram route `apps/studio/src/routes/diagram/world-map/+page.svelte` embedding SvelteFlow with world map transformer, nested layout, and double-click-to-navigate per spec FR-029
- [x] T079 [P] [US3] Create diagram route `apps/studio/src/routes/diagram/timeline/+page.svelte` embedding SvelteFlow with timeline transformer, swim-lane layout, and double-click-to-navigate per spec FR-029
- [x] T080 [P] [US3] Create diagram route `apps/studio/src/routes/diagram/interaction/+page.svelte` embedding SvelteFlow with interaction sequence transformer, lifeline layout, and double-click-to-navigate per spec FR-029
- [x] T081 [US3] Add diagram view menu items to `apps/studio/src/lib/components/MenuBar.svelte` (View → Story Structure, Character Network, World Map, Timeline, Interaction)

**Checkpoint**: User Story 3 complete — all 5 diagram views render correctly from AST, support drag-to-reposition with persisted overrides, bidirectional editing on Story Structure and Character Network, and navigate to source on double-click.

---

## Phase 6: User Story 4 — Generating Prose with AI (Priority: P4)

**Goal**: Authors can select a scene, configure a text backend, generate streaming prose, and manage drafts with accept/reject/regenerate workflow.

**Independent Test**: Define a scene with characters/setting/atmosphere, select a text backend, generate prose (verify streaming), then accept one paragraph, reject another, and regenerate a third.

### Implementation for User Story 4

- [x] T082 [US4] Define the backend registry interface and registration pattern in `apps/studio/src/lib/ai/backends/backend-registry.ts` with common interface: generate (streaming), estimate cost, check availability, report capabilities per spec FR-030. The interface MUST require Zod validation of all external API responses before returning data to callers (Constitution VII).
- [x] T083 [P] [US4] Implement Claude API text backend in `apps/studio/src/lib/ai/backends/claude-api.ts` with streaming generation, cost estimation, and availability check. All Claude API responses MUST be validated against Zod schemas before use (Constitution VII).
- [x] T084 [P] [US4] Implement local LLM text backend in `apps/studio/src/lib/ai/backends/local-llm.ts` with compatible local server connection. All responses from the local server MUST be validated against Zod schemas before use (Constitution VII).
- [x] T085 [P] [US4] Implement Claude Max subscription text backend in `apps/studio/src/lib/ai/backends/claude-max.ts` with Zod-validated API responses (Constitution VII)
- [x] T086 [US4] Implement context assembler in `apps/studio/src/lib/ai/context-assembler.ts` extracting scene context from AST with priority-based budget (never-truncated vs progressively-summarized vs dropped-first) per spec FR-031
- [x] T087 [US4] Implement prompt builder in `apps/studio/src/lib/ai/prompt-builder.ts` with two format levels: rich (detailed character cards, full personality) and concise (abbreviated, top 3 traits) per spec FR-032
- [x] T088 [US4] Implement cost estimator in `apps/studio/src/lib/ai/cost-estimator.ts` calculating estimated USD cost and token count before generation per spec FR-037
- [x] T089 [US4] Implement draft manager in `apps/studio/src/lib/ai/draft-manager.ts` storing/loading drafts from DB, managing per-paragraph versioning, accept/reject/regenerate state transitions per spec FR-034/FR-035/FR-036
- [x] T090 [US4] Implement POST `/api/ai-text/generate/+server.ts` endpoint with SSE streaming, assembling context, calling backend, streaming chunks, recording cost per contracts/api-endpoints.md §1
- [x] T091 [P] [US4] Implement POST `/api/ai-text/estimate/+server.ts` endpoint returning estimated cost/tokens/words per contracts/api-endpoints.md §1
- [x] T092 [P] [US4] Implement GET and PUT `/api/ai-text/backends/+server.ts` endpoint listing available backends with status and switching active backend per contracts/api-endpoints.md §1
- [x] T093 [US4] Implement GET `/api/draft/list/+server.ts` endpoint listing draft versions for project/scene per contracts/api-endpoints.md §3
- [x] T094 [P] [US4] Implement PUT `/api/draft/update/+server.ts` endpoint for accept/reject/editing status changes per contracts/api-endpoints.md §3
- [x] T095 [US4] Create Svelte 5 rune stores: `apps/studio/src/lib/stores/generation.svelte.ts` (streaming state, current draft) and `apps/studio/src/lib/stores/backends.svelte.ts` (backend list, availability, active selection)
- [x] T096 [US4] Create `ProseGenerationPanel.svelte` in `apps/studio/src/lib/components/ProseGenerationPanel.svelte` with scene selector, backend selector dropdown, temperature slider (0.0–2.0), pacing selector, cost estimate display, and generate button per spec FR-038
- [x] T097 [US4] Create `DraftPanel.svelte` in `apps/studio/src/lib/components/DraftPanel.svelte` displaying streaming prose, per-paragraph review controls (Accept/Reject/Regenerate), version history, and status indicators per spec FR-036
- [x] T098 [US4] Create `BackendSelector.svelte` in `apps/studio/src/lib/components/BackendSelector.svelte` showing backend list with availability indicators (green/red), active marker, and switch action per spec FR-030
- [x] T099 [US4] Add Generate menu (Scene Prose, keyboard shortcut) to `apps/studio/src/lib/components/MenuBar.svelte` per spec FR-039/FR-058

**Checkpoint**: User Story 4 complete — authors can generate streaming prose, manage multiple draft versions per paragraph, and switch between AI backends.

---

## Phase 7: User Story 5 — Story Reference and Analytics (Priority: P5)

**Goal**: Authors can browse a comprehensive Story Bible and view analytics dashboards with word counts, scene distributions, pacing rhythm, and historical snapshots.

**Independent Test**: Write a story with several characters/scenes/themes, open the Story Bible and verify complete element display, open Statistics and verify accurate metrics, capture an analytics snapshot.

### Implementation for User Story 5

- [x] T100 [US5] Implement analytics data extraction in `apps/studio/src/lib/project/analytics.ts` computing word count, scene count, character count, scene type distribution, character screen time, and pacing rhythm from the serialized AST
- [x] T101 [US5] Implement POST `/api/analytics/snapshot/+server.ts` endpoint capturing analytics snapshot with metrics per contracts/api-endpoints.md §6
- [x] T102 [P] [US5] Implement GET `/api/analytics/timeseries/+server.ts` endpoint returning historical analytics snapshots per contracts/api-endpoints.md §6
- [x] T103 [US5] Create Story Bible page at `apps/studio/src/routes/story-bible/+page.svelte` with sections for Characters (personality bar charts, relationship lists, arc), Worlds (locations, rules), Relationships (character-by-character matrix), Themes (statement, tension, motifs), Plot (beats), Scenes (table with type/participants/objective) per spec FR-005 acceptance scenarios
- [x] T104 [US5] Create Statistics Dashboard at `apps/studio/src/routes/statistics/+page.svelte` with overview cards (word/scene/character count), scene type distribution (stacked bar chart), character screen time (sorted bar chart), pacing rhythm (colored block sequence), and word count trend over time
- [x] T105 [US5] Add Story Bible and Statistics menu items to View menu in `apps/studio/src/lib/components/MenuBar.svelte` per spec FR-058

**Checkpoint**: User Story 5 complete — Story Bible and Statistics Dashboard display accurate, comprehensive story data.

---

## Phase 8: User Story 6 — Generating Visual Assets with AI (Priority: P6)

**Goal**: Authors can generate character portraits, scene illustrations, covers, and style boards with Visual DNA consistency, and manage assets in a Gallery.

**Independent Test**: Define characters with descriptions/traits, generate portraits, verify Visual DNA consistency anchoring, create a style board, browse and filter assets in the Gallery.

### Implementation for User Story 6

- [x] T106 [US6] Implement Visual DNA system in `apps/studio/src/lib/ai/visual-dna.ts` maintaining reference images, physical descriptions, personality-to-visual trait mapping, mannerisms from quirks, symbol motifs, and story-point versions per spec FR-042
- [x] T107 [P] [US6] Implement image backends: `apps/studio/src/lib/ai/backends/midjourney.ts` (proxy-based), `apps/studio/src/lib/ai/backends/dalle.ts` (cloud API), `apps/studio/src/lib/ai/backends/flux.ts` (model-based with reference images), `apps/studio/src/lib/ai/backends/local-sd.ts` (local server) per spec FR-040. All image backend API responses MUST be validated against Zod schemas before use (Constitution VII).
- [x] T108 [US6] Implement POST `/api/ai-image/generate/+server.ts` endpoint building image prompts from AST data (portraits from character descriptions, scenes from atmosphere/location, covers from title/themes) and dispatching to selected backend per contracts/api-endpoints.md §2 and spec FR-041
- [x] T109 [P] [US6] Implement GET `/api/ai-image/backends/+server.ts` endpoint listing available image backends per contracts/api-endpoints.md §2
- [x] T110 [P] [US6] Implement POST `/api/ai-image/visual-dna/+server.ts` endpoint generating/updating Visual DNA for a character per contracts/api-endpoints.md §2
- [x] T111 [US6] Create Gallery page at `apps/studio/src/routes/gallery/+page.svelte` with search, type/character/scene filtering, sort order, compare mode (side-by-side), and approval workflow (approve/reject/regenerate) per spec FR-044
- [x] T112 [US6] Create `VisualAssetsPanel.svelte` in `apps/studio/src/lib/components/VisualAssetsPanel.svelte` with type filter tabs, backend dropdown, thumbnail grid, and detail panel with approval controls per spec FR-045
- [x] T113 [US6] Add Visual Assets menu items to View menu and Generate menu (Visual Assets) in `apps/studio/src/lib/components/MenuBar.svelte` per spec FR-058

**Checkpoint**: User Story 6 complete — authors can generate and manage visual assets with Visual DNA consistency.

---

## Phase 9: User Story 7 — Publishing Manuscripts (Priority: P7)

**Goal**: Authors can export accepted prose as professionally formatted EPUB, DOCX, and PDF manuscripts, and preview in Reading Mode and Spread Preview.

**Independent Test**: Accept draft prose for several scenes, export to EPUB (verify valid package structure), DOCX (verify manuscript formatting), and PDF (verify trim size/margins), open Reading Mode (verify book-like typography), open Spread Preview (verify two-page layout).

### Implementation for User Story 7

- [x] T114 [US7] Implement manuscript assembler in `apps/studio/src/lib/publishing/manuscript-assembler.ts` collecting accepted drafts, organizing into chapters, generating front matter (half-title, title page, copyright, dedication, TOC) and back matter (author bio, acknowledgments, character index) per spec FR-046
- [x] T115 [US7] Implement EPUB 3 generator in `apps/studio/src/lib/publishing/epub-generator.ts` assembling mimetype, META-INF/container.xml, content.opf, nav.xhtml, toc.ncx, per-chapter XHTML, stylesheet, images into ZIP with `archiver` per spec FR-047 and research.md R7
- [x] T116 [P] [US7] Implement DOCX generator in `apps/studio/src/lib/publishing/docx-generator.ts` using `docx` package with manuscript format (12pt font, double-spaced, 1-inch margins, 0.5-inch indent, right-aligned header, chapter page breaks, centered scene breaks, title page with contact/word count) per spec FR-048
- [x] T117 [P] [US7] Implement PDF generator in `apps/studio/src/lib/publishing/pdf-generator.ts` using `pdfkit` with configurable trim size, paper type, spine width calculation, gutter, bleed (0.125"), and safe area per spec FR-049
- [x] T118 [P] [US7] Implement HTML preview generator in `apps/studio/src/lib/publishing/html-preview.ts` producing styled HTML for the reading mode view
- [x] T119 [P] [US7] Implement KDP configuration in `apps/studio/src/lib/publishing/kdp-config.ts` with trim sizes, spine width formulas per paper type, and bleed specifications
- [x] T120 [P] [US7] Implement cover template utilities in `apps/studio/src/lib/publishing/cover-template.ts` for cover image processing with `sharp`
- [x] T121 [US7] Implement POST `/api/publishing/export/+server.ts` endpoint generating requested formats, uploading to Supabase Storage `exports/` bucket, returning signed download URLs per contracts/api-endpoints.md §4
- [x] T122 [P] [US7] Implement GET `/api/publishing/preview/+server.ts` endpoint returning HTML preview of manuscript per contracts/api-endpoints.md §4
- [x] T123 [P] [US7] Implement GET `/api/publishing/dependencies/+server.ts` endpoint checking readiness (accepted scene count, total scenes, word count, missing scenes, cover image) per contracts/api-endpoints.md §4
- [x] T124 [US7] Create `PublishingPanel.svelte` in `apps/studio/src/lib/components/PublishingPanel.svelte` with format checkboxes (EPUB/DOCX/PDF/Kindle), print settings (Kindle checkbox enabled only in graphic-novel publishing mode) (trim size, paper type when PDF selected), dependency indicators, export progress bar, and completion summary with file sizes per spec FR-052
- [x] T125 [US7] Create Reading Mode page at `apps/studio/src/routes/reading-mode/+page.svelte` with book-like typography (serif font, 16px, 1.7 line-height), table of contents, chapter navigation, drop caps, scene break markers, inline illustrations, and reading time estimate (250 WPM) per spec FR-050
- [x] T126 [US7] Create Spread Preview page at `apps/studio/src/routes/spread-preview/+page.svelte` showing two-page spreads at print aspect ratio with optional bleed/margin guide overlays per spec FR-051
- [x] T127 [US7] Add Publish menu (Export Manuscript) to `apps/studio/src/lib/components/MenuBar.svelte` and Reading Mode / Spread Preview to View menu per spec FR-058

**Checkpoint**: User Story 7 complete — authors can export to EPUB/DOCX/PDF and preview in Reading Mode and Spread Preview.

---

## Phase 10: User Story 8 — Graphic Novel Creation (Priority: P8)

**Goal**: Authors in graphic-novel mode can create visual comic pages with panel layouts, AI-generated artwork, lettering, and Kindle export.

**Independent Test**: Set project to graphic-novel mode, select a scene, choose a panel layout (e.g., 4-Grid), generate panel artwork, add lettering (speech bubbles), navigate pages via filmstrip, export as Kindle (EPUB 3 fixed-layout with panel region metadata).

### Implementation for User Story 8

- [x] T128 [US8] Implement panel generator in `apps/studio/src/lib/graphic-novel/panel-generator.ts` with layout templates (Full Bleed, 2-Panel, 3-Strip, 4-Grid, 6-Grid, 9-Grid, Irregular) and camera direction logic based on emotional intensity per spec FR-053/FR-054
- [x] T129 [US8] Implement lettering system in `apps/studio/src/lib/graphic-novel/lettering-system.ts` generating speech bubbles (standard/shout/whisper/thought), caption boxes, and sound effect overlays with dynamic text wrapping and bubble sizing per spec FR-055
- [x] T130 [P] [US8] Implement page renderer in `apps/studio/src/lib/graphic-novel/page-renderer.ts` compositing panel artwork, lettering, and layout into complete page images
- [x] T131 [P] [US8] Implement spread compositor in `apps/studio/src/lib/graphic-novel/spread-compositor.ts` assembling facing pages, synthetic spreads for landscape mode
- [x] T132 [US8] Extend EPUB generator in `apps/studio/src/lib/publishing/epub-generator.ts` to support fixed-layout mode (`rendition:layout=pre-paginated`) with per-page panel region metadata (normalized coordinates, magnification, reading order) for Kindle Create import per spec FR-056 and research.md R7
- [x] T133 [US8] Create `GraphicNovelPanel.svelte` in `apps/studio/src/lib/components/GraphicNovelPanel.svelte` with layout selector, page preview wireframe, per-panel controls (regenerate individual panel), page filmstrip, generation progress, page navigation, and script/print-ready export per spec FR-057
- [x] T134 [US8] Wire graphic-novel publishing mode into `apps/studio/src/routes/spread-preview/+page.svelte` adding guided-view panel overlays and reading order visualization

**Checkpoint**: User Story 8 complete — graphic novel creation pipeline is functional with panel generation, lettering, and Kindle export.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T135 [P] Implement resizable three-zone layout (sidebar + main + bottom) with drag handles and panel visibility persistence in `apps/studio/src/routes/+layout.svelte` per spec FR-059
- [x] T136 [P] Add keyboard shortcut system (scene prose generation shortcut, diagram navigation shortcuts) across `apps/studio/src/lib/editor/` and `apps/studio/src/lib/components/` per spec FR-039
- [x] T137 [P] Add Help menu (User's Guide) to `apps/studio/src/lib/components/MenuBar.svelte` per spec FR-058
- [x] T138 Implement `actone/formatDocument` custom request handler in `packages/langium/src/worker/main-browser.ts` per contracts/worker-protocol.md
- [x] T140 Run full build validation: `pnpm turbo build`, `pnpm turbo lint`, `pnpm turbo check-types` across all packages
- [x] T141 Run quickstart.md validation: follow all steps from `specs/002-actone-studio/quickstart.md` and verify the app starts correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (Phase 2) — BLOCKS US2–US8 (all features derive from parsed AST)
- **US2 (Phase 4)**: Depends on US1 (needs editor + Langium services)
- **US3 (Phase 5)**: Depends on US1 (needs serialized AST)
- **US4 (Phase 6)**: Depends on US1 (needs AST for context assembly), partially on US2 (project/file management)
- **US5 (Phase 7)**: Depends on US1 (needs AST for analytics), partially on US2 (project context)
- **US6 (Phase 8)**: Depends on US1 (needs AST for prompts), partially on US4 (shares backend pattern)
- **US7 (Phase 9)**: Depends on US4 (needs accepted draft prose), partially on US6 (cover images)
- **US8 (Phase 10)**: Depends on US6 (image generation) and US7 (publishing pipeline)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational (Phase 2) — **Foundation for all other stories**
- **US2 (P2)**: Can start after US1 core (T026–T040 minimum) — needs working Langium services
- **US3 (P3)**: Can start after US1 complete — needs serialized AST in store
- **US4 (P4)**: Can start after US1 complete — needs AST for context assembly
- **US5 (P5)**: Can start after US1 complete — needs AST for analytics
- **US6 (P6)**: Can start after US1 complete — needs AST for image prompts
- **US7 (P7)**: Can start after US4 — needs accepted draft prose
- **US8 (P8)**: Can start after US6 + US7 — needs image generation + publishing pipeline

### Within Each User Story

- Models/types before services
- Services before API endpoints
- API endpoints before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Foundational tasks T014–T018 marked [P] can run in parallel (different type files)
- Within US1: T034–T037 (semantic tokens, references, symbols, code actions) can run in parallel (different service files)
- Within US3: T060–T062 (AST utils, type guards, text edits) can run in parallel; T067–T072 (transformers, nodes, edges) can run in parallel after T063–T066 are complete
- Within US4: T083–T085 (backends) can run in parallel; T091–T092 (estimate, backends endpoints) can run in parallel
- Within US7: T116–T120 (DOCX, PDF, HTML, KDP, cover) can run in parallel after T114 (assembler) is complete
- US3, US4, US5, US6 can all be worked on in parallel once US1 is complete

---

## Parallel Example: User Story 1

```bash
# Launch parallel Langium service implementations (after T028–T033):
Task: "Implement semantic token provider in packages/langium/src/services/actone-semantic-tokens.ts"
Task: "Implement definition/references/rename in packages/langium/src/services/actone-references.ts"
Task: "Implement document symbol provider in packages/langium/src/services/actone-symbols.ts"
Task: "Implement code action provider in packages/langium/src/services/actone-code-actions.ts"
```

## Parallel Example: User Story 3

```bash
# Launch parallel diagram transformers (after T063–T065):
Task: "Implement Character Network transformer in apps/studio/src/lib/diagrams/transformers/character-network.ts"
Task: "Implement World Map transformer in apps/studio/src/lib/diagrams/transformers/world-map.ts"
Task: "Implement Timeline transformer in apps/studio/src/lib/diagrams/transformers/timeline.ts"
Task: "Implement Interaction Sequence transformer in apps/studio/src/lib/diagrams/transformers/interaction-sequence.ts"

# Launch parallel custom components (after transformers):
Task: "Create custom SvelteFlow node components in apps/studio/src/lib/diagrams/nodes/"
Task: "Create custom SvelteFlow edge components in apps/studio/src/lib/diagrams/edges/"
```

## Parallel Example: User Story 7

```bash
# Launch parallel format generators (after T114 manuscript assembler):
Task: "Implement DOCX generator in apps/studio/src/lib/publishing/docx-generator.ts"
Task: "Implement PDF generator in apps/studio/src/lib/publishing/pdf-generator.ts"
Task: "Implement HTML preview generator in apps/studio/src/lib/publishing/html-preview.ts"
Task: "Implement KDP configuration in apps/studio/src/lib/publishing/kdp-config.ts"
Task: "Implement cover template utilities in apps/studio/src/lib/publishing/cover-template.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (DSL Authoring)
4. **STOP and VALIDATE**: Test editor with language intelligence independently
5. Deploy/demo if ready — delivers immediate value as a structured fiction authoring tool

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (persistent projects)
4. Add User Story 3 → Test independently → Deploy/Demo (visual planning)
5. Add User Story 4 → Test independently → Deploy/Demo (AI prose generation)
6. Add User Story 5 → Test independently → Deploy/Demo (reference & analytics)
7. Add User Story 6 → Test independently → Deploy/Demo (visual assets)
8. Add User Story 7 → Test independently → Deploy/Demo (publishing)
9. Add User Story 8 → Test independently → Deploy/Demo (graphic novel)
10. Polish phase → Final validation

### Parallel Team Strategy

With multiple developers after US1 is complete:

1. Team completes Setup + Foundational + US1 together (sequential)
2. Once US1 is complete:
   - Developer A: US2 (Project Management)
   - Developer B: US3 (Diagrams)
   - Developer C: US4 (AI Prose Generation)
   - Developer D: US5 (Story Reference & Analytics)
3. After US4 + US6 complete:
   - Developer A: US7 (Publishing)
   - Developer B: US8 (Graphic Novel)
4. Polish phase — all developers

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable (except dependency chain noted above)
- Langium-generated code (`packages/langium/src/generated/`) is NEVER manually edited — only the grammar file is the source
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All external data validated with Zod at API boundaries (Principle VII)
- `$state.raw()` used for SvelteFlow node/edge arrays to avoid deep proxy overhead
