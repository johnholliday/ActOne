# Feature Specification: ActOne Studio Test Suite

**Feature Branch**: `003-actone-studio-tests`
**Created**: 2026-02-26
**Status**: Draft
**Input**: User description: "Comprehensive test suite for ActOne Studio covering unit tests, integration tests, performance tests, and E2E tests across the Langium grammar, shared packages, SvelteKit API endpoints, diagram transformers, AI pipelines, publishing pipeline, and application shell — derived from test-plan.md"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Verifying DSL Grammar Correctness (Priority: P1)

A developer working on the ActOne DSL grammar needs confidence that the parser, validator, scope provider, completion engine, hover provider, formatter, semantic token provider, and document symbol provider all behave correctly. They run the grammar test suite and receive immediate feedback on whether all eight element types parse correctly, whether all semantic validation rules (value ranges, structural constraints, cross-reference resolution) are enforced, and whether language intelligence features (completion suggestions, hover tooltips, formatting, navigation) return the expected results. When a test fails, the failure message clearly identifies which grammar rule or language service is broken and what the expected vs. actual behavior was.

**Why this priority**: The DSL grammar is the foundation of the entire ActOne Studio application. Every other feature — diagrams, AI generation, publishing, analytics — derives from the parsed AST. A regression in the grammar silently breaks all downstream features. Grammar tests provide the highest leverage for preventing defects.

**Independent Test**: Can be fully tested by running the grammar test suite against fixture `.actone` files and verifying parser acceptance, validator diagnostics, scope resolution, completion suggestions, hover content, formatter output, semantic tokens, and document symbols. Delivers value as a regression safety net for the core DSL.

**Acceptance Scenarios**:

1. **Given** a valid `.actone` file containing all eight element types, **When** the parser test suite runs, **Then** all elements are parsed without errors and the resulting AST contains the expected structure.
2. **Given** a `.actone` file with out-of-range values (personality trait 150, weight 200, temperature 3.0), **When** the validator test suite runs, **Then** each invalid value produces an error diagnostic at the correct location with a descriptive message.
3. **Given** a story with characters Elena and Marcus, **When** the completion test runs at a `participants: [` position, **Then** both character names appear in the suggestion list.
4. **Given** a character with nature, bio, personality traits, arc, and relationships, **When** the hover test runs on the character name, **Then** the hover content includes nature, bio excerpt, top 3 traits, arc phase, and relationship count.
5. **Given** a file with 4-space indentation and excess blank lines, **When** the formatter test runs, **Then** the output uses 2-space indentation, max 2 blank lines between blocks, with string content and comments preserved.
6. **Given** a story with a character referenced in 5 scenes, **When** the scope test suite runs, **Then** all 5 participant references and the POV reference resolve to the character's declaration.
7. **Given** a story with keywords, definitions, references, strings, numbers, and comments, **When** the semantic token test suite runs, **Then** each token type is correctly classified.

---

### User Story 2 - Verifying Business Logic Modules (Priority: P2)

A developer modifying studio business logic (lifecycle state machine, analytics extraction, composition modes, diagram transformers, AI context assembly, prompt building, cost estimation, draft management, publishing generators, graphic novel pipeline) needs fast unit tests that verify each module in isolation. They run the business logic test suite and receive results confirming that lifecycle transitions follow the correct state graph, analytics extraction produces accurate counts, diagram transformers generate the expected nodes and edges, AI modules produce correct prompts and cost estimates, and publishing generators output correctly structured documents. When a module changes, only the relevant tests fail, providing precise feedback on what broke.

**Why this priority**: Business logic modules contain the core algorithms and domain rules that govern how ActOne Studio processes story data. Testing these in isolation catches logic errors early, before they propagate through API endpoints and UI components. These tests are fast (no I/O or network) and provide the highest signal-to-noise ratio.

**Independent Test**: Can be fully tested by importing each module, calling its functions with controlled inputs (parsed AST fixtures, mock data), and asserting the outputs match expected values. Delivers value as a regression guard for all core computations.

**Acceptance Scenarios**:

1. **Given** a project in "concept" stage, **When** the lifecycle module is queried for valid targets, **Then** it returns only "draft" as a valid transition.
2. **Given** a published project, **When** the lifecycle module is queried for valid targets, **Then** it returns an empty list (terminal state).
3. **Given** a parsed AST with 5 characters, 10 scenes, and 3 worlds, **When** the analytics module extracts metrics, **Then** it reports correct counts for each element type, correct scene type distribution, and correct character screen time percentages.
4. **Given** a parsed AST with scenes connected by beats, **When** the story-structure transformer runs, **Then** it produces one node per scene with correct color coding and one edge per beat connection with correct colors.
5. **Given** a parsed AST with 3 characters and relationships, **When** the character-network transformer runs, **Then** positive-weight relationships produce green edges, negative-weight produce red edges, and dynamic relationships produce dashed edges.
6. **Given** a scene with participants, location, and atmosphere, **When** the context assembler runs within a token budget, **Then** never-truncated elements (scene, location, atmosphere, participants) are always present, while lower-priority elements are progressively summarized or dropped.
7. **Given** a manuscript with front matter, 5 chapters, and back matter, **When** the EPUB generator runs, **Then** the output contains mimetype, container.xml, content.opf with metadata, nav.xhtml, and per-chapter XHTML files.
8. **Given** a 4-Grid layout template, **When** the panel generator runs, **Then** exactly 4 panel regions are produced with correct dimensions.
9. **Given** emotional intensity of 0.95, **When** the panel generator determines camera direction, **Then** it selects "close-up".

---

### User Story 3 - Verifying API Endpoint Contracts (Priority: P3)

A developer changing or extending an API endpoint needs integration tests that verify each endpoint accepts the correct request shape, validates inputs, performs the expected database operations (via mock), and returns the response format specified in the API contract. They run the API integration test suite with mocked database and backend dependencies and receive results confirming that all 20+ endpoints behave according to their contracts. Invalid inputs produce appropriate error responses, and successful operations return the correct response shapes.

**Why this priority**: API endpoints are the interface between the frontend and backend. Contract violations cause silent failures that are hard to debug. Integration tests with mocked dependencies verify the full request-response cycle without requiring live infrastructure.

**Independent Test**: Can be fully tested by making requests to each endpoint handler with mocked database and service dependencies, verifying response status codes, response body shapes, and side effects (database calls). Delivers value as a contract compliance safety net for all API surfaces.

**Acceptance Scenarios**:

1. **Given** a valid project creation request with title and genre, **When** the project create endpoint is called, **Then** it returns a response containing the new project id, title, and entry file path.
2. **Given** a project creation request missing the required title field, **When** the endpoint is called, **Then** it returns a 400 error with a descriptive message.
3. **Given** a valid lifecycle transition request (concept to draft), **When** the lifecycle endpoint is called, **Then** it creates a snapshot and returns the previous stage, current stage, and snapshot id.
4. **Given** an invalid lifecycle transition (concept to published), **When** the endpoint is called, **Then** it returns a 400 error indicating the transition is not allowed.
5. **Given** a prose generation request with valid parameters, **When** the generate endpoint is called with a mock backend, **Then** it returns a streaming response with chunk events followed by a done event containing cost information.
6. **Given** a publishing dependencies request for a project with all scenes having accepted drafts, **When** the endpoint is called, **Then** it returns `ready: true` with correct scene counts and word count.
7. **Given** a publishing dependencies request for a project with missing scene drafts, **When** the endpoint is called, **Then** it returns `ready: false` with a list of missing scene names.

---

### User Story 4 - Verifying Worker Protocol Communication (Priority: P4)

A developer modifying the Langium web worker or the editor integration needs tests that verify the LSP lifecycle (initialize, didOpen, didChange, didClose), custom request handlers (openProject, getSerializedAst, getAstForAllFiles, formatDocument), and the diagnostics round-trip (editing an invalid file publishes diagnostics, fixing the error clears them). They run the worker protocol test suite and receive results confirming the full communication pipeline between the editor and the language server functions correctly.

**Why this priority**: The worker protocol is the communication backbone between the editor and the language server. Breakages here silently disable all language intelligence features. These tests require initializing Langium services but do not require a browser environment.

**Independent Test**: Can be fully tested by initializing Langium services in a Node environment, simulating LSP message exchanges, and verifying responses. Delivers value as a reliability guarantee for the editor-to-worker communication pathway.

**Acceptance Scenarios**:

1. **Given** a freshly initialized worker, **When** the initialize request is sent, **Then** the worker responds with its capabilities.
2. **Given** a file opened via didOpen, **When** the content is changed via didChange, **Then** diagnostics are re-published reflecting the new content.
3. **Given** a request for the serialized AST, **When** the worker processes it, **Then** the response contains the AST structure without internal framework references.
4. **Given** a multi-file project opened via the custom openProject request, **When** the AST for all files is requested, **Then** the response contains a merged AST respecting the composition mode.
5. **Given** a file with a validation error, **When** the error is fixed and the change is sent, **Then** the diagnostics are cleared within the expected latency.

---

### User Story 5 - Verifying End-to-End Pipelines (Priority: P5)

A developer needs integration tests that verify complete data pipelines work end-to-end: parsing source files into ASTs and transforming them into diagram nodes/edges; generating diagram edits and applying them back to source files that re-parse correctly; assembling AI context, generating prose, storing drafts, and managing the accept/reject lifecycle; and assembling accepted drafts into manuscripts and generating export files. These pipeline tests catch integration bugs that unit tests miss — where individual modules work correctly in isolation but fail when composed together.

**Why this priority**: Pipeline tests verify that modules compose correctly. Many real-world bugs occur at module boundaries (data format mismatches, missing transformations, incorrect ordering). These tests provide confidence that the core user workflows function from input to output.

**Independent Test**: Can be fully tested by running complete pipeline sequences with fixture data and mocked external services, verifying that the output at each pipeline stage matches expectations and that the final result is correct. Delivers value as a workflow correctness guarantee.

**Acceptance Scenarios**:

1. **Given** a parsed fixture file, **When** the AST-to-diagram pipeline runs (serialize, transform, layout), **Then** the output contains correctly positioned nodes matching the fixture's elements and edges matching the fixture's relationships.
2. **Given** a diagram create-character operation, **When** the diagram-to-source pipeline runs (generate text edit, apply to source, re-parse), **Then** the new character exists in the re-parsed AST and the source file contains valid syntax.
3. **Given** a scene context and mock AI backend, **When** the generation-to-draft pipeline runs (assemble context, build prompt, generate, store draft), **Then** a draft record exists with correct scene association, content, and pending status.
4. **Given** accepted drafts for all scenes, **When** the draft-to-publish pipeline runs (assemble manuscript, generate EPUB), **Then** the output contains a valid EPUB structure with all chapters.
5. **Given** a rename operation on a character referenced in 5 scenes, **When** the diagram-to-source pipeline runs, **Then** all 5 references and the declaration are updated and the resulting source re-parses with zero errors.

---

### User Story 6 - Verifying Performance Requirements (Priority: P6)

A developer needs performance tests that verify the system meets its latency commitments: DSL validation completes within 200ms per keystroke, diagram transformations complete within 2 seconds of source changes, and the system handles large projects (50 characters, 100 scenes, 10 files) without degradation. When a code change introduces a performance regression, the performance test suite flags it before it reaches users.

**Why this priority**: Performance requirements are explicit success criteria (SC-001, SC-002, SC-010) in the ActOne Studio specification. Users expect responsive editing and diagram updates. Performance regressions are hard to detect without automated benchmarks.

**Independent Test**: Can be fully tested by running grammar operations and diagram transformations against fixture files of varying sizes and measuring elapsed time against defined thresholds. Delivers value as an early warning system for performance regressions.

**Acceptance Scenarios**:

1. **Given** a minimal `.actone` file, **When** validation runs, **Then** it completes in under 200ms.
2. **Given** a full-story fixture with 10+ scenes, **When** validation runs, **Then** it completes in under 200ms.
3. **Given** a large project fixture (50 characters, 100 scenes, 10 files), **When** validation runs, **Then** it completes in under 500ms.
4. **Given** a full-story fixture, **When** each of the 5 diagram transformers runs with layout, **Then** each completes in under 2 seconds.
5. **Given** a large project fixture, **When** the character-network transformer runs for 50 characters, **Then** it completes in under 2 seconds.

---

### User Story 7 - Verifying Application Behavior End-to-End in a Browser (Priority: P7)

A developer or QA engineer needs browser-based end-to-end tests that verify the complete user experience: authentication flow, project creation, editor intelligence (completion, hover, formatting, navigation, rename), diagram views (all 5 types render, drag persists, bidirectional editing works, keyboard shortcuts navigate), AI generation flow (cost estimation, streaming, accept/reject/regenerate), analytics and Story Bible views, publishing flow (dependency checks, export, reading mode, spread preview), and application shell (three-zone layout, resize handles, menu bar, keyboard shortcuts). These tests catch UI integration bugs, routing issues, and client-server interaction problems that no other test layer detects.

**Why this priority**: E2E tests are the final validation layer. They verify the application works as a real user would experience it. However, they are the slowest and most brittle tests, so they are lower priority than faster test layers.

**Independent Test**: Can be fully tested by launching the application in a browser, navigating through core workflows, and verifying visible UI states. Delivers value as a final confidence check before release.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user, **When** they visit the application, **Then** they are redirected to the login page.
2. **Given** an authenticated user, **When** they create a new project and type story content, **Then** syntax highlighting appears and the project navigator shows the story elements.
3. **Given** a story with characters and scenes, **When** the user navigates to each of the 5 diagram views, **Then** each view renders the expected nodes and edges.
4. **Given** a scene in the editor, **When** the user triggers generation and accepts a paragraph, **Then** the draft status changes to accepted and the paragraph is locked.
5. **Given** a story with accepted drafts for all scenes, **When** the user exports as EPUB from the publishing panel, **Then** a download link is provided.
6. **Given** the application is open, **When** the user presses Ctrl+B, **Then** the sidebar toggles visibility.

---

### Edge Cases

- What happens when a test fixture file is malformed or missing? The test runner reports a clear setup error rather than a cryptic assertion failure.
- What happens when a mock backend is not properly configured? Tests fail with a descriptive message indicating the mock was not initialized.
- What happens when performance tests run on different hardware? Performance thresholds include reasonable tolerance margins and tests are marked as "benchmark" to allow environment-specific baselines.
- What happens when the grammar changes but test fixtures are not updated? Parser tests fail with clear messages about unexpected parse results, prompting fixture updates.
- What happens when an API endpoint's response shape changes? Integration tests fail at the assertion level with expected vs. actual shape differences, making contract drift immediately visible.
- What happens when the Langium services fail to initialize in tests? Setup errors are caught and reported with the Langium initialization error details rather than failing silently.

## Requirements *(mandatory)*

### Functional Requirements

**Test Infrastructure**

- **FR-001**: The test suite MUST provide a shared configuration for running unit and integration tests across all three workspace packages (shared, langium, studio).
- **FR-002**: The test suite MUST provide a separate configuration for running browser-based end-to-end tests against a running development server.
- **FR-003**: The test suite MUST provide reusable fixture files containing valid, invalid, and large-scale `.actone` source content for consistent test inputs.
- **FR-004**: The test suite MUST provide mock implementations for external dependencies (database, authentication, storage, AI backends) to enable isolated testing.
- **FR-005**: The test suite MUST integrate with the monorepo build system so that `pnpm test` runs all tests across all packages from the repository root.

**Grammar Tests (Langium Package)**

- **FR-006**: Tests MUST verify that the parser accepts all eight element types (character, world, theme, timeline, scene, plot, interaction, generate block) with their full property sets.
- **FR-007**: Tests MUST verify that the validator produces error diagnostics for all out-of-range values (personality 0–100, weight −100–100, temperature 0.0–2.0, continuity loss 0.0–1.0, mood 0–100), structural violations (duplicate generate blocks, self-relationships), and unresolved references.
- **FR-008**: Tests MUST verify boundary conditions: values at exact boundaries (0, 100, −100) must pass; values one beyond boundaries (−1, 101, −101) must fail.
- **FR-009**: Tests MUST verify that cross-references resolve correctly for character names in participants, POV, relationships, and interactions; location names in scenes and connects_to; timeline layer names in scenes; and scene names in subplot convergence.
- **FR-010**: Tests MUST verify that completion suggestions are contextually appropriate: character names in reference positions, enum values for typed properties, keywords at top level.
- **FR-011**: Tests MUST verify hover content for each element type: character (nature, bio, traits, arc, relationships), scene (type, participants, location), theme (statement, tension, motifs), world (period, location count).
- **FR-012**: Tests MUST verify that the formatter normalizes indentation to 2 spaces, limits blank lines to 2 between blocks, and preserves string and comment content, and is idempotent.
- **FR-013**: Tests MUST verify semantic token classification (keywords, definitions, references, strings, numbers, comments) and document symbol hierarchy (story → elements → sub-elements).

**Business Logic Tests (Studio Package)**

- **FR-014**: Tests MUST verify lifecycle state transitions match the specified state graph (concept → draft → revision ↔ final → published) including terminal state enforcement.
- **FR-015**: Tests MUST verify analytics extraction produces correct counts (words, scenes, characters), distributions (scene types, character screen time), pacing rhythm, and relationship matrix.
- **FR-016**: Tests MUST verify composition mode behavior: merge (unified namespace with duplicate detection), overlay (last-defined wins), sequential (per-file namespaces), and file ordering (entry first, then alphabetical).
- **FR-017**: Tests MUST verify each of the 5 diagram transformers produces correct node/edge counts, colors, sizes, and attributes from a known AST input.
- **FR-018**: Tests MUST verify stable content-addressable IDs (format `type:name`) are deterministic, collision-free, and survive re-parses.
- **FR-019**: Tests MUST verify text edit generation produces valid `.actone` syntax for create, delete, and rename operations that re-parse with zero errors.
- **FR-020**: Tests MUST verify conflict detection between concurrent diagram and source edits, and resolution of conflicts via user choice.
- **FR-021**: Tests MUST verify AI context assembly respects priority-based truncation: never-truncated, progressively-summarized, and dropped-first categories within token budgets.
- **FR-022**: Tests MUST verify prompt builder produces rich and concise format variations, and cost estimator returns correct token and USD estimates per backend.
- **FR-023**: Tests MUST verify draft manager tracks per-paragraph versioning, status transitions (pending → accepted/rejected/editing), and version history preservation.
- **FR-024**: Tests MUST verify manuscript assembler produces correct front matter, chapter content ordering, and back matter structure.
- **FR-025**: Tests MUST verify each publishing generator (EPUB, DOCX, PDF) produces output matching the format specification (file structure, typography, dimensions).
- **FR-026**: Tests MUST verify graphic novel panel generation (layout templates, camera direction from emotional intensity) and lettering system (bubble styles per dialogue type).

**API Integration Tests**

- **FR-027**: Tests MUST verify all project management endpoints (create, manifest, lifecycle, files) accept valid inputs and return correct response shapes.
- **FR-028**: Tests MUST verify all AI text endpoints (generate, estimate, backends) including streaming response format and error handling.
- **FR-029**: Tests MUST verify all AI image endpoints (generate, backends, visual-dna) including asset creation and backend availability.
- **FR-030**: Tests MUST verify all draft management endpoints (list, update) including filtering and status transitions.
- **FR-031**: Tests MUST verify all analytics endpoints (snapshot, timeseries) including metric storage, chronological ordering, and limit parameters.
- **FR-032**: Tests MUST verify all publishing endpoints (dependencies, preview, export) including readiness checks, HTML preview generation, and multi-format export.
- **FR-033**: Tests MUST verify that invalid inputs to any endpoint produce appropriate error responses (400 for bad input, 404 for missing resources).

**Worker Protocol Tests**

- **FR-034**: Tests MUST verify standard LSP lifecycle messages (initialize, didOpen, didChange, didClose) are handled correctly.
- **FR-035**: Tests MUST verify custom extension handlers (openProject, updateFile, getSerializedAst, getAstForAllFiles, formatDocument) return expected results.
- **FR-036**: Tests MUST verify the diagnostics round-trip: opening an invalid file publishes error diagnostics, fixing the error clears them.

**Pipeline Integration Tests**

- **FR-037**: Tests MUST verify the AST-to-diagram pipeline (parse → serialize → transform → layout) produces correctly positioned nodes matching the source content.
- **FR-038**: Tests MUST verify the diagram-to-source pipeline (diagram operation → text edit → apply → re-parse) produces valid syntax with correct AST mutations.
- **FR-039**: Tests MUST verify the generation-to-draft pipeline (context assembly → prompt → generate → store) creates properly associated draft records.
- **FR-040**: Tests MUST verify the draft-to-publish pipeline (assemble → generate format) produces valid export files from accepted drafts.

**Performance Tests**

- **FR-041**: Tests MUST verify validation latency is under 200ms for standard files and under 500ms for large projects (50 characters, 100 scenes, 10 files).
- **FR-042**: Tests MUST verify diagram transformation plus layout latency is under 2 seconds for each of the 5 diagram types on full-story and large-project fixtures.

**End-to-End Tests**

- **FR-043**: Tests MUST verify authentication flow (redirect to login, sign-in, access to main layout).
- **FR-044**: Tests MUST verify core editor workflows (project creation, typing content, syntax highlighting, error diagnostics, completion, hover, formatting, navigation, rename).
- **FR-045**: Tests MUST verify all 5 diagram views render correctly, drag persistence works, and keyboard shortcuts navigate between views.
- **FR-046**: Tests MUST verify the AI generation flow (scene selection, cost estimate, streaming, accept/reject/regenerate).
- **FR-047**: Tests MUST verify analytics and Story Bible views display correct data.
- **FR-048**: Tests MUST verify the publishing flow (dependency checks, export with download link, reading mode, spread preview).
- **FR-049**: Tests MUST verify the application shell (three-zone layout, resize handles, menu bar, keyboard shortcuts).

### Key Entities

- **Test Fixture**: A sample `.actone` file or set of files used as controlled input for tests. Fixtures range from minimal (single character, single scene) to large-scale (50 characters, 100 scenes, 10 files). Fixtures are shared across test phases.
- **Mock Backend**: A fake implementation of an external service (database, AI backend, storage) that returns predictable responses without network I/O. Mocks are configured per-test or per-suite.
- **Test Suite**: A collection of related test cases organized by feature area and test layer (unit, integration, performance, E2E). Suites run independently and report results per-test.
- **Performance Benchmark**: A test that measures elapsed time for a specific operation and asserts it falls within a defined threshold. Benchmarks include tolerance margins for hardware variation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All unit tests for the grammar package (parser, validator, scope, completion, hover, formatter, semantic tokens, symbols) pass with 100% of defined test cases green.
- **SC-002**: All unit tests for studio business logic modules (lifecycle, analytics, composition, diagrams, AI, publishing, graphic novel) pass with 100% of defined test cases green.
- **SC-003**: All API integration tests pass, verifying every endpoint accepts valid input and rejects invalid input according to its contract.
- **SC-004**: All worker protocol tests pass, verifying the full LSP lifecycle and custom extension handlers.
- **SC-005**: All pipeline integration tests pass, verifying end-to-end data flow from source parsing through diagram rendering, AI generation, and publishing.
- **SC-006**: Performance benchmarks confirm validation latency under 200ms for standard files and under 500ms for large projects, and diagram transformation under 2 seconds per view.
- **SC-007**: All E2E tests pass, verifying core user workflows function correctly in a browser environment.
- **SC-008**: Running `pnpm test` from the repository root executes all test suites across all packages and reports a unified pass/fail result.
- **SC-009**: Test failures produce clear, actionable messages identifying the specific module, function, or endpoint that failed and the expected vs. actual behavior.
- **SC-010**: The complete test suite (excluding E2E) executes in under 2 minutes on a standard development machine, enabling frequent test runs during development.

## Assumptions

- The ActOne Studio application (feature 002-actone-studio) is fully implemented and available on the main branch. Test infrastructure is built on top of the existing codebase.
- Vitest is the unit and integration testing framework, as it is already a devDependency in `apps/studio/package.json`.
- Playwright is the E2E testing framework. It is not yet installed but will be added as a devDependency.
- External services (Supabase database, AI backends, cloud storage) are mocked in all test layers except E2E. E2E tests may use a test Supabase instance or mock server.
- Performance thresholds are based on a standard development machine (modern multi-core CPU, 16GB+ RAM, SSD). CI environments may require adjusted thresholds.
- The test suite does not test Langium-generated code (`packages/langium/src/generated/`), only the custom services built on top of the generated code.
- Test fixtures are `.actone` files that conform to the current grammar version. Grammar changes require corresponding fixture updates.
- The existing empty test directory structure (`apps/studio/tests/unit/`, `tests/integration/`, `tests/e2e/`) will be populated by this feature.
