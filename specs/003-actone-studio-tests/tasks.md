# Tasks: ActOne Studio Test Suite

**Input**: Design documents from `/specs/003-actone-studio-tests/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: This feature IS the test suite — all tasks are test implementation tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Configure test runners, add test tasks to monorepo build system, create vitest configs for all packages

- [x] T001 Add `"test"` task (cached, `"outputs": ["coverage/**"]`) and `"test:e2e"` task (uncached) to `turbo.json`
- [x] T002 Add `"test": "turbo run test"` script to root `package.json`
- [x] T003 [P] Add `vitest` devDependency and `"test": "vitest run"`, `"test:watch": "vitest"` scripts to `packages/langium/package.json`
- [x] T004 [P] Add `vitest` devDependency and `"test": "vitest run"`, `"test:watch": "vitest"` scripts to `packages/shared/package.json`
- [x] T005 [P] Add `"test": "vitest run"`, `"test:watch": "vitest"` scripts and `langium` as a devDependency (for `langium/test` utility access in performance tests) to `apps/studio/package.json` (vitest already a devDep)
- [x] T006 [P] Create `packages/langium/vitest.config.ts` — Vitest config with `environment: 'node'`, `include: ['tests/**/*.test.ts']`
- [x] T007 [P] Create `packages/shared/vitest.config.ts` — Vitest config with `environment: 'node'`, `include: ['tests/**/*.test.ts']`
- [x] T008 [P] Create `apps/studio/vitest.config.ts` — Vitest config with `sveltekit()` plugin from `@sveltejs/kit/vite`, `environment: 'node'`, `include: ['tests/**/*.test.ts']`, `exclude: ['tests/e2e/**']`
- [x] T009 Run `pnpm install` to sync lockfile after dependency additions

---

## Phase 2: Foundational (Fixtures & Mocks)

**Purpose**: Create shared test fixtures, mock implementations, and baseline smoke tests that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Grammar Fixtures

- [x] T010 [P] Create `packages/langium/tests/fixtures/minimal.actone` — minimal smoke test fixture with 1 character (name, nature, bio) and 1 scene (name, sceneType, participants, location)
- [x] T011 [P] Create `packages/langium/tests/fixtures/full-story.actone` — comprehensive fixture with all 8 element types (character, world, theme, timeline, scene, plot, interaction, generate block) using all available properties per element
- [x] T012 [P] Create `packages/langium/tests/fixtures/invalid-values.actone` — fixture with out-of-range values for all validated ranges: personality traits (−1, 101), relationship weights (−101, 101), temperature (−0.1, 2.1), continuity_loss (−0.1, 1.1), mood (−1, 101), plus structural violations (duplicate generate blocks, self-relationships, unresolved references)
- [x] T013 [P] Create `packages/langium/tests/fixtures/multi-file/entry.actone` — entry file for multi-file composition testing, referencing characters and worlds from companion files
- [x] T014 [P] Create `packages/langium/tests/fixtures/multi-file/characters.actone` — character definitions for cross-file scope resolution tests
- [x] T015 [P] Create `packages/langium/tests/fixtures/multi-file/worlds.actone` — world definitions for cross-file scope resolution tests
- [x] T016 Create `packages/langium/tests/fixtures/large-project/` — performance benchmark fixture: generate 10 `.actone` files containing a total of 50 characters and 100 scenes with diverse properties, worlds, themes, and cross-references

### Studio Fixtures & Mocks

- [x] T017 [P] Create `apps/studio/tests/fixtures/factories.ts` — TypeScript factory functions: `createTestStory()`, `createTestCharacter()`, `createTestScene()`, `createTestDrafts()`, `createTestManuscript()` producing `SerializedStory`, `SerializedCharacterDef`, `SerializedSceneDef`, `DraftVersion[]`, `Manuscript` with configurable parameters and sensible defaults
- [x] T018 [P] Create `apps/studio/tests/fixtures/mocks/db.ts` — mock Drizzle `db` object with chainable `select()`, `insert()`, `update()`, `delete()` that resolve to configurable test data
- [x] T019 [P] Create `apps/studio/tests/fixtures/mocks/supabase.ts` — mock `supabaseAdmin` client with `auth.getSession()`, `storage.from(bucket).upload()`, `storage.from(bucket).createSignedUrl()`
- [x] T020 [P] Create `apps/studio/tests/fixtures/mocks/ai-backends.ts` — mock `textBackend` with `generate()` returning `AsyncIterable<StreamChunk>`, `estimateCost()` returning `CostEstimate`, `checkAvailability()` returning `{ available: true }`; mock `imageBackend` with `generate()` returning `ImageResult`
- [x] T021 Create `apps/studio/tests/fixtures/mocks/setup.ts` — shared `vi.mock()` setup file with mocks for `$lib/server/db`, `$lib/server/supabase`, `$lib/server/image-backends`, `$env/dynamic/private`, re-exporting mock instances for per-test configuration

### Shared Package Smoke Test

- [x] T022 [P] Create `packages/shared/tests/types.test.ts` — verify all expected type exports from `@repo/shared` are accessible and correctly typed: `SerializedStory`, `SerializedCharacterDef`, `SerializedSceneDef`, `StableId`, `ActOneNode`, `ActOneEdge`, `LifecycleStage`, Zod schemas, DB schema types, and constants/enums

**Checkpoint**: Foundation ready — all fixture files, mocks, and baseline smoke tests available for user story implementation

---

## Phase 3: User Story 1 — DSL Grammar Correctness (Priority: P1) 🎯 MVP

**Goal**: Verify that the Langium-based parser, validator, scope provider, completion engine, hover provider, formatter, semantic token provider, and document symbol provider all behave correctly for the ActOne grammar

**Independent Test**: Run `turbo run test --filter=@repo/langium` — all grammar tests pass using `.actone` fixture files and Langium `langium/test` utilities

### Implementation

- [x] T023 [P] [US1] Create `packages/langium/tests/parser.test.ts` — test parser acceptance for all 8 element types using `parseHelper<Story>` from `langium/test`; verify `minimal.actone` and `full-story.actone` parse with zero errors; verify AST structure contains expected element types and properties; verify parser rejects syntactically invalid input with meaningful error positions (FR-006)
- [x] T024 [P] [US1] Create `packages/langium/tests/validator.test.ts` — test all validation rules using `validationHelper<Story>` and `expectError`/`expectWarning`/`expectNoIssues` from `langium/test`; verify `invalid-values.actone` produces error diagnostics at correct locations for each out-of-range value; test boundary conditions (0, 100, −100 pass; −1, 101, −101 fail); test structural violations (duplicate generate blocks, self-relationships); test that `full-story.actone` produces zero diagnostics (FR-007, FR-008)
- [x] T025 [P] [US1] Create `packages/langium/tests/scope.test.ts` — test cross-reference resolution using `parseHelper` and AST traversal; verify character names resolve in `participants`, `pov`, `relationships`, and `interactions`; verify location names resolve in scenes and `connects_to`; verify timeline layer names resolve in scenes; verify scene names resolve in subplot `convergence`; test multi-file scope using `multi-file/` fixtures (FR-009)
- [x] T026 [P] [US1] Create `packages/langium/tests/completion.test.ts` — test completion suggestions using `expectCompletion` from `langium/test` with `<|>` cursor markers; verify character names appear at `participants: [<|>]` position; verify enum values for typed properties (scene types, relationship types); verify keywords at top level; verify no suggestions at invalid positions (FR-010)
- [x] T027 [P] [US1] Create `packages/langium/tests/hover.test.ts` — test hover tooltip content using `expectHover` from `langium/test` with `<|>` cursor markers; verify character hover includes nature, bio excerpt, top 3 personality traits, arc phase, and relationship count; verify scene hover includes type, participants, location; verify theme hover includes statement, tension, motifs; verify world hover includes period, location count (FR-011)
- [x] T028 [P] [US1] Create `packages/langium/tests/formatter.test.ts` — test formatting rules using `expectFormatting` from `langium/test`; verify 4-space input normalizes to 2-space output; verify max 2 blank lines between blocks; verify string content and comments are preserved; verify idempotency (formatting already-formatted text produces identical output) (FR-012)
- [x] T029 [P] [US1] Create `packages/langium/tests/semantic-tokens.test.ts` — test semantic token classification using `highlightHelper` and `expectSemanticToken` from `langium/test`; verify keywords, definitions, references, strings, numbers, and comments each receive correct token types (FR-013)
- [x] T030 [P] [US1] Create `packages/langium/tests/symbols.test.ts` — test document symbol hierarchy using `expectSymbols` from `langium/test`; verify story is the root symbol; verify each element type appears as a child of story; verify sub-elements (personality traits, relationships, beats) appear as children of their parent elements (FR-013)

**Checkpoint**: All grammar tests pass — `turbo run test --filter=@repo/langium` green. This is the MVP deliverable.

---

## Phase 4: User Story 2 — Business Logic Modules (Priority: P2)

**Goal**: Verify all studio business logic modules produce correct outputs when called with controlled inputs (pure function tests with fixture data, no I/O mocks needed)

**Independent Test**: Run `cd apps/studio && npx vitest run tests/unit/` — all unit tests pass using factory fixtures

### Implementation

- [x] T031 [P] [US2] Create `apps/studio/tests/unit/lifecycle.test.ts` — test `canTransition()` and `getValidTargets()` for the full state graph (concept → draft → revision ↔ final → published); verify terminal state (published has empty valid targets); verify invalid transitions return false; test `getStageLabel()` for all stages (FR-014)
- [x] T032 [P] [US2] Create `apps/studio/tests/unit/analytics.test.ts` — test `extractAnalytics()` with `createTestStory()` fixtures; verify word counts, scene counts, character counts; verify scene type distribution percentages; verify character screen time; verify pacing rhythm; verify relationship matrix (FR-015)
- [x] T033 [P] [US2] Create `apps/studio/tests/unit/composition.test.ts` — test all composition modes: merge (unified namespace, duplicate detection), overlay (last-defined wins), sequential (per-file namespaces); verify file ordering (entry first, then alphabetical) (FR-016)
- [x] T034 [P] [US2] Create `apps/studio/tests/unit/stable-refs.test.ts` — test stable content-addressable ID generation (format `type:name`); verify determinism (same input → same ID); verify collision-free (different inputs → different IDs); verify IDs survive re-parses (FR-018)
- [x] T035 [P] [US2] Create `apps/studio/tests/unit/diagram-transformers.test.ts` — test all 5 diagram transformers (story-structure, character-network, world-building, timeline, thematic) with `createTestStory()` fixtures; verify correct node/edge counts; verify node colors, sizes, and labels; verify edge colors (green positive, red negative) and styles (dashed for dynamic relationships); verify character-network weight-based coloring (FR-017)
- [x] T036 [P] [US2] Create `apps/studio/tests/unit/conflict-detection.test.ts` — test conflict detection between concurrent diagram and source edits; simulate a diagram edit and a source edit targeting the same element simultaneously; verify the conflict detector identifies the collision; test conflict resolution via user choice (accept diagram edit, accept source edit, merge); verify resolved state is consistent and re-parseable (FR-020)
- [x] T037 [P] [US2] Create `apps/studio/tests/unit/context-assembler.test.ts` — test `assembleContext()` with varying token budgets; verify never-truncated elements (scene, location, atmosphere, participants) are always present; verify progressively-summarized elements are shortened at medium budgets; verify dropped-first elements are removed at tight budgets (FR-021)
- [x] T038 [P] [US2] Create `apps/studio/tests/unit/prompt-builder.test.ts` — test `buildPrompt()` in rich and concise format variations; verify prompt contains expected sections (context, instruction, constraints); verify format-specific differences (FR-022)
- [x] T039 [P] [US2] Create `apps/studio/tests/unit/cost-estimator.test.ts` — test `estimateCost()` for different backends; verify token count estimates; verify USD cost calculations per backend pricing (FR-022)
- [x] T040 [P] [US2] Create `apps/studio/tests/unit/draft-manager.test.ts` — test per-paragraph versioning; test status transitions (pending → accepted, pending → rejected, pending → editing); verify version history preservation; test `createTestDrafts()` factory (FR-023)
- [x] T041 [P] [US2] Create `apps/studio/tests/unit/manuscript-assembler.test.ts` — test `assembleManuscript()` with `createTestManuscript()` fixtures; verify front matter (title page, copyright, dedication); verify chapter content ordering; verify back matter (character index, colophon) (FR-024)
- [x] T042 [P] [US2] Create `apps/studio/tests/unit/epub-generator.test.ts` — test EPUB generation; verify output contains mimetype, META-INF/container.xml, content.opf with metadata, nav.xhtml, and per-chapter XHTML files; verify EPUB structure matches specification (FR-025)
- [x] T043 [P] [US2] Create `apps/studio/tests/unit/docx-generator.test.ts` — test DOCX generation; verify output structure, paragraph styles, section breaks, and metadata (FR-025)
- [x] T044 [P] [US2] Create `apps/studio/tests/unit/pdf-generator.test.ts` — test PDF generation; verify page dimensions, typography settings, and content structure (FR-025)
- [x] T045 [P] [US2] Create `apps/studio/tests/unit/panel-generator.test.ts` — test panel layout generation for all layout templates (4-Grid, 3-Row, etc.); verify exact panel region counts and dimensions per template; test camera direction selection from emotional intensity (0.95 → close-up) (FR-026)
- [x] T046 [P] [US2] Create `apps/studio/tests/unit/lettering-system.test.ts` — test bubble style selection per dialogue type; verify font sizing, tail direction, and visual properties per bubble type (FR-026)

**Checkpoint**: All business logic unit tests pass — `cd apps/studio && npx vitest run tests/unit/` green

---

## Phase 5: User Story 3 — API Endpoint Contracts (Priority: P3)

**Goal**: Verify all 20+ API endpoints accept correct request shapes, validate inputs, perform expected operations (via mocked DB), and return correct response formats

**Independent Test**: Run `cd apps/studio && npx vitest run tests/integration/api/` — all API tests pass with mocked dependencies

### Implementation

- [x] T047 [P] [US3] Create `apps/studio/tests/integration/api/projects.test.ts` — import project endpoint handlers (create, manifest, files) directly; use `vi.mock()` with `setup.ts` for db/supabase; test valid project creation returns `{ id, title, entryFilePath }`; test missing title returns 400; test project manifest retrieval; test file operations (FR-027, FR-033)
- [x] T048 [P] [US3] Create `apps/studio/tests/integration/api/lifecycle.test.ts` — import lifecycle endpoint handler; test valid transition (concept → draft) returns `{ previousStage, currentStage, snapshotId }`; test invalid transition (concept → published) returns 400; test terminal state transition returns 400 (FR-027, FR-033)
- [x] T049 [P] [US3] Create `apps/studio/tests/integration/api/ai-text.test.ts` — import text generation endpoints; test generate with mock backend returns streaming response (chunk events + done event with cost); test estimate endpoint returns token count and cost; test backends endpoint returns available backends (FR-028, FR-033)
- [x] T050 [P] [US3] Create `apps/studio/tests/integration/api/ai-image.test.ts` — import image generation endpoints; test generate returns `ImageResult`; test backends endpoint returns available image backends; test visual-dna endpoint; test backend unavailable returns appropriate error (FR-029, FR-033)
- [x] T051 [P] [US3] Create `apps/studio/tests/integration/api/drafts.test.ts` — import draft management endpoints; test list drafts with filtering; test update draft status (pending → accepted, pending → rejected); test invalid status transition returns 400 (FR-030, FR-033)
- [x] T052 [P] [US3] Create `apps/studio/tests/integration/api/analytics.test.ts` — import analytics endpoints; test snapshot creation and retrieval; test timeseries with chronological ordering; test limit parameter; test missing project returns 404 (FR-031, FR-033)
- [x] T053 [P] [US3] Create `apps/studio/tests/integration/api/publishing.test.ts` — import publishing endpoints; test dependencies check: `ready: true` when all scenes have accepted drafts; test `ready: false` with list of missing scene names; test preview generates HTML; test export produces downloadable file; test export with missing drafts returns 400 (FR-032, FR-033)

**Checkpoint**: All API integration tests pass — `cd apps/studio && npx vitest run tests/integration/api/` green

---

## Phase 6: User Story 4 — Worker Protocol Communication (Priority: P4)

**Goal**: Verify LSP lifecycle, custom request handlers, and diagnostics round-trip for the Langium web worker

**Independent Test**: Run `cd apps/studio && npx vitest run tests/integration/worker-protocol.test.ts` — all protocol tests pass using Langium services in Node

### Implementation

- [x] T054 [US4] Create `apps/studio/tests/integration/worker-protocol.test.ts` — initialize `createActOneServices()` in test setup; test LSP initialize request returns capabilities; test didOpen/didChange triggers diagnostics re-publication; test didClose cleans up; test custom `openProject` handler; test custom `updateFile` handler returns acknowledgment; test custom `getSerializedAst` returns AST without framework internals; test custom `getAstForAllFiles` with multi-file project returns merged AST; test custom `formatDocument` returns formatted content; test diagnostics round-trip (open invalid file → error diagnostics, fix error → diagnostics cleared) (FR-034, FR-035, FR-036)

**Checkpoint**: Worker protocol tests pass — editor-to-worker communication verified

---

## Phase 7: User Story 5 — End-to-End Pipelines (Priority: P5)

**Goal**: Verify complete data pipelines work from input to output, catching integration bugs at module boundaries

**Independent Test**: Run `cd apps/studio && npx vitest run tests/integration/pipelines/` — all pipeline tests pass

### Implementation

- [x] T055 [P] [US5] Create `apps/studio/tests/integration/pipelines/ast-to-diagram.test.ts` — parse `full-story.actone` fixture → serialize AST → run story-structure transformer → verify output nodes match fixture elements with correct positions; verify edges match fixture relationships (FR-037)
- [x] T056 [P] [US5] Create `apps/studio/tests/integration/pipelines/diagram-to-source.test.ts` — start from parsed AST → apply diagram create-character operation → generate text edit → apply to source → re-parse → verify new character exists in AST and source is valid syntax; test delete-character operation → generate text edit → apply → re-parse → verify character removed and source contains valid syntax; test rename operation on character referenced in 5 scenes → verify all 5 references and declaration updated, re-parse with zero errors (FR-019, FR-038)
- [x] T057 [P] [US5] Create `apps/studio/tests/integration/pipelines/generation-to-draft.test.ts` — create scene context from fixture → assemble context → build prompt → generate with mock AI backend → store draft → verify draft record exists with correct scene association, content, and pending status (FR-039)
- [x] T058 [P] [US5] Create `apps/studio/tests/integration/pipelines/draft-to-publish.test.ts` — create accepted drafts for all scenes → assemble manuscript → generate EPUB → verify output contains valid EPUB structure with all chapters present (FR-040)

**Checkpoint**: All pipeline integration tests pass — end-to-end data flow verified

---

## Phase 8: User Story 6 — Performance Requirements (Priority: P6)

**Goal**: Verify validation latency <200ms (standard), <500ms (large), and diagram transformation <2s

**Independent Test**: Run `cd apps/studio && npx vitest run tests/performance/` — all benchmarks pass within thresholds

### Implementation

- [x] T059 [P] [US6] Create `apps/studio/tests/performance/validation-latency.test.ts` — benchmark validation using `createActOneServices()` from `@repo/langium` and `validationHelper` from `langium/test` (available via devDependency added in T005) with `performance.now()` timing; test `minimal.actone` completes under 200ms; test `full-story.actone` completes under 200ms; test `large-project/` (50 chars, 100 scenes, 10 files) completes under 500ms; include tolerance margin for CI environments (FR-041)
- [x] T060 [P] [US6] Create `apps/studio/tests/performance/diagram-latency.test.ts` — benchmark each of the 5 diagram transformers (story-structure, character-network, world-building, timeline, thematic) with `full-story.actone` and `large-project/` fixtures; verify each completes under 2s including layout step; test character-network with 50 characters completes under 2s (FR-042)

**Checkpoint**: Performance benchmarks pass — latency commitments verified

---

## Phase 9: User Story 7 — Browser E2E Tests (Priority: P7)

**Goal**: Verify complete user experience in a real browser: auth, editor, diagrams, generation, analytics, publishing, shell

**Independent Test**: Start dev server (`turbo run dev --filter=studio`), then run `cd apps/studio && npx playwright test` — all E2E tests pass

### Setup

- [x] T061 [US7] Add `@playwright/test` as devDependency in `apps/studio/package.json` and run `pnpm install`
- [x] T062 [US7] Create `apps/studio/tests/e2e/playwright.config.ts` — configure Playwright with `baseURL: 'http://localhost:5173'`, `webServer` command to start SvelteKit dev server, projects for Chromium (primary), optional Firefox and WebKit; configure test directory, retries for CI, screenshots on failure

### Implementation

- [x] T063 [P] [US7] Create `apps/studio/tests/e2e/auth.spec.ts` — test unauthenticated user redirected to login page; test sign-in flow; test authenticated user sees main layout (FR-043)
- [x] T064 [P] [US7] Create `apps/studio/tests/e2e/editor.spec.ts` — test project creation; test typing content shows syntax highlighting; test project navigator shows story elements; test error diagnostics appear for invalid content; test completion, hover, formatting, go-to-definition, and rename via keyboard shortcuts (FR-044)
- [x] T065 [P] [US7] Create `apps/studio/tests/e2e/diagrams.spec.ts` — test navigation to each of the 5 diagram views; test each view renders expected nodes and edges; test drag persistence; test keyboard shortcuts navigate between views (FR-045)
- [x] T066 [P] [US7] Create `apps/studio/tests/e2e/generation.spec.ts` — test scene selection; test cost estimate display; test streaming generation with mock backend; test accept paragraph (status changes, paragraph locked); test reject and regenerate (FR-046)
- [x] T067 [P] [US7] Create `apps/studio/tests/e2e/analytics.spec.ts` — test analytics view displays correct story metrics; test Story Bible view shows character details (FR-047)
- [x] T068 [P] [US7] Create `apps/studio/tests/e2e/publishing.spec.ts` — test dependency check shows readiness status; test EPUB export provides download link; test reading mode; test spread preview (FR-048)
- [x] T069 [P] [US7] Create `apps/studio/tests/e2e/shell.spec.ts` — test three-zone layout renders; test resize handles between panels; test menu bar interactions; test Ctrl+B toggles sidebar visibility (FR-049)

**Checkpoint**: All E2E tests pass in Chromium — full user experience verified

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, quality gates, and documentation verification

- [x] T070 Run full test suite (`pnpm test`) from repository root — verify all unit, integration, and performance tests pass across all 3 packages and results are unified (SC-008)
- [x] T071 Verify test failure messages are clear and actionable — spot-check 5+ failures by temporarily breaking code and confirming messages identify the module, function, and expected vs. actual behavior (SC-009)
- [x] T072 Verify full test suite (excluding E2E) completes in under 2 minutes — time `pnpm test` and adjust parallelism or test isolation if needed (SC-010)
- [x] T073 Verify Turborepo caching works for test task — run `pnpm test` twice and confirm second run hits cache for unchanged packages
- [x] T074 Validate `quickstart.md` instructions work end-to-end — follow each step in a clean state and confirm commands succeed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–9)**: All depend on Foundational phase completion
  - US1 (Grammar) and US2 (Business Logic) can proceed in parallel
  - US3 (API) can proceed in parallel with US1/US2
  - US4 (Worker Protocol) can proceed in parallel with US1–US3
  - US5 (Pipelines) depends on US1 fixtures and US2 module familiarity but not on their test completion
  - US6 (Performance) depends on US1 fixtures (large-project)
  - US7 (E2E) depends on a working dev server; independent of other test phases
- **Polish (Phase 10)**: Depends on all previous phases being complete

### User Story Dependencies

- **US1 (Grammar, P1)**: No dependencies on other stories. Uses `langium/test` utilities and `.actone` fixtures.
- **US2 (Business Logic, P2)**: No dependencies on other stories. Uses `createTestStory()` factory fixtures.
- **US3 (API Endpoints, P3)**: No dependencies on other stories. Uses mock setup from foundational phase.
- **US4 (Worker Protocol, P4)**: No dependencies on other stories. Uses `createActOneServices()` directly.
- **US5 (Pipelines, P5)**: No strict dependencies but benefits from US1/US2 familiarity. Uses both `.actone` fixtures and factory fixtures.
- **US6 (Performance, P6)**: No strict dependencies. Uses `.actone` fixtures including large-project. Uses `langium/test` via devDep added in T005.
- **US7 (E2E, P7)**: No dependencies on unit/integration tests. Requires running dev server.

### Within Each User Story

- All test files within a story are marked [P] and can be written in parallel (different files, no shared state)
- Each story's tests are independently runnable via the commands listed in the Independent Test criteria

### Parallel Opportunities

- **Phase 1**: T003, T004, T005 in parallel (different package.json files); T006, T007, T008 in parallel (different vitest configs)
- **Phase 2**: T010–T016 in parallel (different fixture files); T017–T022 in parallel (different test/mock files)
- **Phase 3 (US1)**: All 8 test files (T023–T030) in parallel
- **Phase 4 (US2)**: All 16 test files (T031–T046) in parallel
- **Phase 5 (US3)**: All 7 test files (T047–T053) in parallel
- **Phase 7 (US5)**: All 4 pipeline test files (T055–T058) in parallel
- **Phase 8 (US6)**: Both performance files (T059–T060) in parallel
- **Phase 9 (US7)**: All 7 E2E spec files (T063–T069) in parallel
- **Cross-phase**: US1, US2, US3, US4 can all run in parallel after Phase 2

---

## Parallel Example: User Story 1 (Grammar Tests)

```bash
# All 8 grammar test files can be launched in parallel:
Task: "Create parser.test.ts in packages/langium/tests/"
Task: "Create validator.test.ts in packages/langium/tests/"
Task: "Create scope.test.ts in packages/langium/tests/"
Task: "Create completion.test.ts in packages/langium/tests/"
Task: "Create hover.test.ts in packages/langium/tests/"
Task: "Create formatter.test.ts in packages/langium/tests/"
Task: "Create semantic-tokens.test.ts in packages/langium/tests/"
Task: "Create symbols.test.ts in packages/langium/tests/"
```

## Parallel Example: User Story 2 (Business Logic)

```bash
# All 16 unit test files can be launched in parallel:
Task: "Create lifecycle.test.ts in apps/studio/tests/unit/"
Task: "Create analytics.test.ts in apps/studio/tests/unit/"
Task: "Create composition.test.ts in apps/studio/tests/unit/"
Task: "Create conflict-detection.test.ts in apps/studio/tests/unit/"
# ... (12 more files, all independent)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T009)
2. Complete Phase 2: Foundational — grammar fixtures only (T010–T016, T022)
3. Complete Phase 3: User Story 1 — Grammar tests (T023–T030)
4. **STOP and VALIDATE**: Run `turbo run test --filter=@repo/langium` — all green
5. Grammar regression safety net is in place

### Incremental Delivery

1. Setup + Foundational → Test infrastructure ready
2. Add US1 (Grammar) → Grammar safety net (MVP!)
3. Add US2 (Business Logic) → Core algorithms covered
4. Add US3 (API Endpoints) → Contract compliance verified
5. Add US4 (Worker Protocol) → Communication backbone verified
6. Add US5 (Pipelines) → Integration bugs caught
7. Add US6 (Performance) → Latency regressions detected
8. Add US7 (E2E) → Full user experience verified
9. Polish → Suite runs fast, messages are clear, CI works

Each increment adds independent value without breaking previous test phases.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Grammar fixtures in `packages/langium/tests/fixtures/` are shared across US1 (grammar tests), US5 (pipeline tests), and US6 (performance tests)
- Studio mocks in `apps/studio/tests/fixtures/mocks/` are shared across US2 (unit tests), US3 (API tests), US5 (pipeline tests)
- Performance tests (US6) should be marked as benchmarks to allow environment-specific baseline adjustments
- E2E tests (US7) require a running dev server — use Playwright's `webServer` config to auto-start
- Commit after each completed phase or logical group of [P] tasks
