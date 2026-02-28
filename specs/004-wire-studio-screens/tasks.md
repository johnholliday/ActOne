# Tasks: Wire Studio Screens to Live Functions

**Input**: Design documents from `/specs/004-wire-studio-screens/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contracts.md

**Tests**: Not explicitly requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All paths are relative to `apps/studio/src/` within the monorepo root `/home/john/dev/ActOne/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create reusable UI components needed across multiple user stories

- [x] T001 [P] Create LoadingSpinner component with inline spinner variant (small, centered in parent) in `apps/studio/src/lib/components/LoadingSpinner.svelte`
- [x] T002 [P] Create EmptyState component with icon, message, and optional CTA button in `apps/studio/src/lib/components/EmptyState.svelte`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish project loading mechanism so all screens can access the active project

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Add `loadFromServer(supabase)` async method to ProjectStore that fetches the user's most recent project and its files, and populates `project` and `files` state in `apps/studio/src/lib/stores/project.svelte.ts`
- [x] T004 Modify `+layout.server.ts` to include the user's project list in the layout load function (query projects table via Drizzle, ordered by `modifiedAt` desc) in `apps/studio/src/routes/+layout.server.ts`
- [x] T005 Wire project loading in `+layout.svelte` onMount: if server data contains projects, load the most recent into projectStore; fetch its source files and entry file content in `apps/studio/src/routes/+layout.svelte`
- [x] T006 Add "no project loaded" UI state in `+layout.svelte`: when `projectStore.project` is null after loading, display a welcome message with a "Create Project" button that triggers the new project flow in `apps/studio/src/routes/+layout.svelte`

**Checkpoint**: App loads with the user's most recent project populated in projectStore, or shows a welcome/create prompt. All screens can now read `projectStore.project`.

---

## Phase 3: User Story 1 — Create a New Project from the Menu (Priority: P1) MVP

**Goal**: Wire `File > New Project` to a creation flow that prompts for a project name, creates the project via `POST /api/project/create`, and opens the default source file in the editor.

**Independent Test**: Click File > New Project, enter a name, verify project is created with a default file open in the editor and the project name appears in the sidebar.

### Implementation for User Story 1

- [x] T007 [US1] Create NewProjectDialog modal component with title input field, optional author/genre fields, confirm/cancel buttons, loading state, and error display in `apps/studio/src/lib/components/NewProjectDialog.svelte`
- [x] T008 [US1] Add `showNewProjectDialog` state and `oncreateproject` handler to `+layout.svelte` that opens the NewProjectDialog modal in `apps/studio/src/routes/+layout.svelte`
- [x] T009 [US1] Implement project creation handler in `+layout.svelte`: on dialog confirm, call `POST /api/project/create` with form data, validate response with Zod, call `projectStore.load()` with created project, fetch entry file content, and navigate to `/` in `apps/studio/src/routes/+layout.svelte`
- [x] T010 [US1] Modify `+page.svelte` to load the active project's entry file content into the CodeMirror editor on mount (replace hardcoded `sampleContent` with content from the loaded project's entry file) in `apps/studio/src/routes/+page.svelte`
- [x] T011 [US1] Update sidebar PROJECT section in `+layout.svelte` to show the active project title as the section header (replace static "PROJECT" label with `projectStore.project?.title ?? 'PROJECT'`) in `apps/studio/src/routes/+layout.svelte`

**Checkpoint**: Users can create a new project from the File menu and begin editing within 5 seconds (SC-001). The project appears in the sidebar and the entry file opens in the editor.

---

## Phase 4: User Story 2 — See Syntax Highlighting While Editing (Priority: P1)

**Goal**: Verify that the Langium semantic token pipeline produces syntax highlighting in the CodeMirror editor for all ActOne DSL token types with the designed color palette.

**Independent Test**: Type ActOne DSL in the editor (keywords, strings, numbers, types, comments) and verify each token type displays in a distinct color within 2 seconds.

**Note**: The core LSP wiring (worker connection fix, semantic token extension) was implemented in prior branch work. These tasks verify and polish the integration.

### Implementation for User Story 2

- [x] T012 [US2] Verify the worker connection fix is in place: `createActOneServices` in `packages/langium/src/services/actone-module.ts` accepts `connection` parameter, and `main-browser.ts` in `packages/langium/src/worker/main-browser.ts` passes the real `connection` (not `undefined`). Verification: open a file with ActOne DSL content and confirm semantic token colors appear within 2 seconds (FR-011 initial timing)
- [x] T013 [US2] Verify the semantic token color palette in EditorPane.svelte theme matches the design spec: keywords in purple, type names in amber, strings in green, numbers in orange, comments in grey italic, cross-references in distinct colors. Verification: type new tokens and confirm highlighting updates within 1 second of pausing (FR-011 refresh timing) in `apps/studio/src/lib/editor/EditorPane.svelte`
- [x] T014 [US2] Add error banner with "Retry" button to EditorPane.svelte that displays when the Langium worker fails to initialize or crashes, per edge case spec in `apps/studio/src/lib/editor/EditorPane.svelte`

**Checkpoint**: Syntax highlighting appears within 2 seconds of opening a file (SC-002). All token types display in visually distinct colors.

---

## Phase 5: User Story 6 — Project Context Flows to All Screens (Priority: P2)

**Goal**: Propagate the active project context to all data-dependent screens. Replace hardcoded project identifiers with `projectStore.project?.id`. Add empty states when no project is loaded.

**Independent Test**: Load a project with rich content and navigate to each screen (5 diagrams, Story Bible, Statistics, Reading Mode) — verify project-specific data appears. Then clear the project and verify empty states display.

**Note**: This story is ordered before other P2 stories because US3, US4, and US5 depend on project context being properly propagated.

### Implementation for User Story 6

- [x] T015 [P] [US6] Replace hardcoded `projectId = 'default'` with `projectStore.project?.id` in `apps/studio/src/routes/diagram/story-structure/+page.svelte` and guard diagram rendering with a project-loaded check
- [x] T016 [P] [US6] Replace hardcoded `projectId` with `projectStore.project?.id` in remaining 4 diagram pages: `apps/studio/src/routes/diagram/character-network/+page.svelte`, `apps/studio/src/routes/diagram/world-map/+page.svelte`, `apps/studio/src/routes/diagram/timeline/+page.svelte`, `apps/studio/src/routes/diagram/interaction/+page.svelte`
- [x] T017 [P] [US6] Add EmptyState component ("No project loaded — create or open a project to see data") to Story Bible, Statistics, and Reading Mode pages when `projectStore.project` is null: `apps/studio/src/routes/story-bible/+page.svelte`, `apps/studio/src/routes/statistics/+page.svelte`, `apps/studio/src/routes/reading-mode/+page.svelte`
- [x] T018 [P] [US6] Wire statistics page to load historical analytics snapshots from the `analyticsSnapshots` table for the word count trend chart, and derive current metrics (scene count, character count, word count) from `astStore.activeAst` using `lib/project/analytics.ts` in `apps/studio/src/routes/statistics/+page.svelte`
- [x] T019 [P] [US6] Wire reading mode page to fetch accepted prose drafts from the active project (query `draftVersions` table where `status = 'accepted'`) and render them as formatted HTML, replacing any placeholder content in `apps/studio/src/routes/reading-mode/+page.svelte`
- [x] T020 [US6] Add inline LoadingSpinner to diagram pages shown while AST is parsing (before `astStore.activeAst` is available), per edge case spec, in all 5 diagram page files under `apps/studio/src/routes/diagram/`

**Checkpoint**: All screens show data from the active project. Switching screens preserves context (SC-006). Empty states display when no project is loaded (FR-010). Statistics shows real metrics and trend data. Reading Mode shows accepted prose.

---

## Phase 6: User Story 3 — Wire All Menu Actions to Real Functions (Priority: P2)

**Goal**: Connect every remaining menu callback to its real function. No menu item should silently no-op.

**Independent Test**: Click each menu item in sequence and verify the expected action occurs (dialog appears, view changes, stage advances, snapshot captured, prose generation starts, export page opens).

### Implementation for User Story 3

- [x] T021 [US3] Wire `onadvancestage` callback in `+layout.svelte`: call `POST /api/project/lifecycle` with `projectStore.project.id` and the selected target stage, validate response with Zod, call `projectStore.updateStage()`, show inline success confirmation. Use an `AbortController` to cancel in-flight requests if a new action is triggered before the previous completes (per edge case: rapid menu switching) in `apps/studio/src/routes/+layout.svelte`
- [x] T022 [US3] Wire `onsnapshot` callback in `+layout.svelte`: compute metrics from `astStore.activeAst` using `lib/project/analytics.ts`, call `POST /api/analytics/snapshot` with computed data, show inline success confirmation with timestamp. Use an `AbortController` to cancel in-flight requests on rapid re-invocation in `apps/studio/src/routes/+layout.svelte`
- [x] T023 [US3] Wire `ondiagram` callback in `+layout.svelte`: navigate to `/diagram/{viewId}` via `goto()` and update `uiStore.activeDiagramView` in `apps/studio/src/routes/+layout.svelte`
- [x] T024 [US3] Wire `ongenerate` callback in `+layout.svelte`: dispatch `CustomEvent('actone:generate-prose')` on `window` to trigger the ProseGenerationPanel. If a previous generation is in progress, cancel it before starting the new one (per edge case: rapid menu switching) in `apps/studio/src/routes/+layout.svelte`
- [x] T025 [P] [US3] Disable Help > User's Guide menu item in MenuBar.svelte: add `disabled` attribute, reduce opacity, change cursor, and append "Coming Soon" text label in `apps/studio/src/lib/components/MenuBar.svelte`
- [x] T026 [P] [US3] Create `/export` route page with format selection UI (DOCX, EPUB, PDF radio buttons), project title display, export button with loading state, and download trigger in `apps/studio/src/routes/export/+page.svelte`
- [x] T027 [US3] Implement export handler in export page: on button click, call `POST /api/publishing/export` with projectId and selected format, handle binary response as file download via `Blob` and `URL.createObjectURL` in `apps/studio/src/routes/export/+page.svelte`

**Checkpoint**: 100% of menu items perform a visible action (SC-003). Help > User's Guide shows "Coming Soon" (FR-018). Export page works end-to-end (FR-017). Rapid menu switching cancels previous in-flight actions.

---

## Phase 7: User Story 4 — View Spread Preview with Real Manuscript Content (Priority: P2)

**Goal**: Replace placeholder "Page N" text in Spread Preview with actual manuscript content from the publishing preview API.

**Independent Test**: Write ActOne DSL content, navigate to Spread Preview, verify the authored content appears formatted across two-page spreads.

### Implementation for User Story 4

- [x] T028 [US4] Fetch manuscript content from `GET /api/publishing/preview?projectId={id}` on mount and when project changes in `apps/studio/src/routes/spread-preview/+page.svelte`, using `projectStore.project.id`. Validate the JSON response shape with Zod (ensure `html`, `wordCount`, `pageEstimate` fields are present and correctly typed)
- [x] T029 [US4] Parse the preview HTML response into page-sized chunks based on selected trim size dimensions, and render actual formatted content in the left/right spread panels (replacing `<p class="placeholder">Page {n}</p>`) in `apps/studio/src/routes/spread-preview/+page.svelte`
- [x] T030 [US4] Add LoadingSpinner while fetching preview content and EmptyState ("No content to preview") when project has no accepted prose drafts in `apps/studio/src/routes/spread-preview/+page.svelte`

**Checkpoint**: Spread Preview shows real manuscript content from the active project (FR-007). Empty state displays when no content exists.

---

## Phase 8: User Story 7 — User Profile Menu with Settings Pages (Priority: P2)

**Goal**: Make the sidebar user profile section interactive with a popup menu offering Sign Out and navigation to 3 settings pages.

**Independent Test**: Click the user profile area, verify popup appears with 4 options, click each to verify navigation/action, use Sign Out to verify session ends.

### Implementation for User Story 7

- [x] T031 [US7] Add click handler and popup menu to user profile footer section in `+layout.svelte`: add `profileMenuOpen` state, toggle on click, render popup with Profile Settings / Account Settings / Appearance / Sign Out items, close on outside click in `apps/studio/src/routes/+layout.svelte`
- [x] T032 [US7] Implement Sign Out handler: call `data.supabase.auth.signOut()`, handle response, redirect to `/auth` via `goto('/auth')` within 2 seconds in `apps/studio/src/routes/+layout.svelte`
- [x] T033 [US7] Add unsaved-changes check before sign-out: if `editorStore` has dirty files, show a confirmation prompt ("Save or discard changes before signing out?") per edge case spec in `apps/studio/src/routes/+layout.svelte`
- [x] T034 [P] [US7] Create Profile Settings page with display name and avatar URL form fields, save handler calling `supabase.auth.updateUser({ data: { full_name, avatar_url } })`. Validate the Supabase auth response to confirm update succeeded (Constitution Principle VII). Show success/error feedback in `apps/studio/src/routes/settings/profile/+page.svelte`
- [x] T035 [P] [US7] Create Account Settings page showing current email, password change form (new + confirm), linked OAuth accounts list from `user.identities`, save handler calling `supabase.auth.updateUser({ password })`. Validate the Supabase auth response to confirm update succeeded (Constitution Principle VII) in `apps/studio/src/routes/settings/account/+page.svelte`
- [x] T036 [P] [US7] Create Appearance Settings page with theme selector (dark/light/system radio), editor font size slider, editor font family dropdown, preferences saved to localStorage in `apps/studio/src/routes/settings/appearance/+page.svelte`

**Checkpoint**: Users can sign out from the sidebar profile menu (SC-007, FR-013). All 3 settings pages are functional (FR-014, FR-015, FR-016). Popup closes on outside click.

---

## Phase 9: User Story 5 — Browse Visual Assets in the Gallery (Priority: P3)

**Goal**: Populate the Gallery screen with the active project's visual assets from the database and wire the action buttons.

**Independent Test**: Navigate to Gallery with a project that has generated images, verify assets appear in the grid with working search, filter, and sort controls.

### Implementation for User Story 5

- [x] T037 [US5] Create gallery server load function that queries `assets` table via Drizzle for the active project's assets (ordered by `createdAt` desc) in `apps/studio/src/routes/gallery/+page.server.ts`. Obtain the active project ID from the parent layout's server data (the `+layout.server.ts` load function from T004 provides the user's projects — use the most recent project's ID, or accept a `projectId` URL search param to support future multi-project switching)
- [x] T038 [US5] Wire `gallery/+page.svelte` to consume server-loaded assets from `data.assets` prop instead of hardcoded empty array, mapping DB fields to the existing `Asset` interface in `apps/studio/src/routes/gallery/+page.svelte`
- [x] T039 [US5] Implement approve/reject action handlers in gallery page: on button click, update `assets.status` in the database via a form action or API call, and reactively update the local asset list in `apps/studio/src/routes/gallery/+page.svelte`
- [x] T040 [US5] Add LoadingSpinner during initial asset load and EmptyState ("No assets yet. Generate visual assets from the Run menu.") when no assets exist for the project in `apps/studio/src/routes/gallery/+page.svelte`

**Checkpoint**: Gallery displays real project assets (FR-008). Search, filter, and sort controls work with loaded data. Empty state guides users.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Inline loading indicators, error handling, and final validation across all stories

- [x] T041 Audit all async operations across all modified files and ensure each displays an inline LoadingSpinner within 200ms of starting (FR-019, SC-008) — cover: project creation, lifecycle advancement, snapshot capture, preview loading, export download, settings save, gallery load
- [x] T042 Add error handling with retry options for network failures in: NewProjectDialog (show error in dialog, keep input), lifecycle advancement (inline error message), snapshot capture (inline retry), export download (retry button) per edge case specifications
- [x] T043 Run quality gates: `pnpm turbo build`, `pnpm turbo lint`, `prettier --check .` and fix any issues
- [x] T044 Validate all 13 screens display project-specific data with zero placeholder content by navigating each screen with a loaded project (SC-004, SC-005 verification pass)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion (uses LoadingSpinner, EmptyState) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 (needs project loading mechanism)
- **US2 (Phase 4)**: Depends on Phase 1 only — can run in parallel with Phase 2 and US1
- **US6 (Phase 5)**: Depends on Phase 2 (needs projectStore populated)
- **US3 (Phase 6)**: Depends on Phase 2 (needs project context for menu actions); benefits from US1 (to have a project to act on)
- **US4 (Phase 7)**: Depends on US6 (needs project context propagated to spread preview)
- **US7 (Phase 8)**: Depends on Phase 2 only — can run in parallel with US3-US6
- **US5 (Phase 9)**: Depends on US6 (needs project context propagated to gallery)
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1 (Setup)
    │
    ├── Phase 2 (Foundational) ──── BLOCKS ALL ────┐
    │       │                                       │
    │       ├── Phase 3 (US1: New Project) [P1]     │
    │       │                                       │
    │       ├── Phase 5 (US6: Project Context) [P2] │
    │       │       │                               │
    │       │       ├── Phase 6 (US3: Menu Actions)  │
    │       │       ├── Phase 7 (US4: Spread Preview)│
    │       │       └── Phase 9 (US5: Gallery)       │
    │       │                                       │
    │       └── Phase 8 (US7: User Profile) [P2]    │
    │                                               │
    └── Phase 4 (US2: Syntax Highlighting) [P1] ────┘
                                                    │
                                             Phase 10 (Polish)
```

### Within Each User Story

- Shared components before page-level changes
- Store modifications before UI consumption
- API integration before UI rendering
- Error handling after happy path works

### Parallel Opportunities

- **Phase 1**: T001 and T002 are fully parallel (different files)
- **Phase 4 (US2)**: Can run entirely in parallel with Phases 2-3 (different file set)
- **Phase 5 (US6)**: T015, T016, T017, T018, T019 are parallel (different page files)
- **Phase 6 (US3)**: T025, T026 are parallel with T021-T024 (different files)
- **Phase 8 (US7)**: T034, T035, T036 are parallel (different page files); entire phase can parallel with US3-US6
- **Phase 9 (US5)**: Can run in parallel with US7 after US6 completes

---

## Parallel Example: User Story 6

```text
# All page updates can run in parallel (different files):
T015: Replace hardcoded projectId in story-structure/+page.svelte
T016: Replace hardcoded projectId in 4 remaining diagram pages
T017: Add EmptyState to Story Bible, Statistics, Reading Mode
T018: Wire statistics page to load analytics snapshots
T019: Wire reading mode to fetch accepted prose drafts

# Then sequentially:
T020: Add LoadingSpinner to all diagram pages (after T015-T016)
```

## Parallel Example: User Story 7

```text
# All settings pages can be created in parallel (different files):
T034: Create /settings/profile/+page.svelte
T035: Create /settings/account/+page.svelte
T036: Create /settings/appearance/+page.svelte

# Layout changes are sequential (same file):
T031 → T032 → T033
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T006)
3. Complete Phase 3: US1 — Create New Project (T007-T011)
4. **STOP and VALIDATE**: Create a project, verify it loads in the editor, verify sidebar shows files
5. This delivers the most critical missing capability: project creation

### Incremental Delivery

1. Setup + Foundational → Project loading works
2. US1 (New Project) → Users can create and edit projects (MVP!)
3. US2 (Syntax Highlighting) → Editor is usable with colored tokens
4. US6 (Project Context) → All screens show real data
5. US3 (Menu Actions) → Full menu functionality
6. US4 (Spread Preview) → Print preview works
7. US7 (User Profile) → Settings and sign-out work
8. US5 (Gallery) → Visual assets browsable
9. Polish → Loading indicators, error handling, final validation

### Parallel Team Strategy

With multiple developers after Foundational (Phase 2) is complete:

- **Developer A**: US1 (New Project) → US3 (Menu Actions)
- **Developer B**: US6 (Project Context) → US4 (Spread Preview) → US5 (Gallery)
- **Developer C**: US2 (Syntax Highlighting) → US7 (User Profile)

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in the same phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- No new database tables or API endpoints are created — this is UI wiring only
- All API responses must be validated with Zod at call sites per Constitution Principle VII
- All state management uses Svelte 5 runes ($state, $derived, $effect)
- Commit after each task or logical group using conventional commit format
- Stop at any checkpoint to validate the story independently
