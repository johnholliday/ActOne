# Tasks: Multi-Project Workspace

**Input**: Design documents from `/specs/008-multi-project-workspace/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add shared types and create the new WorkspaceStore foundation

- [ ] T001 Add `WorkspaceState` and enhanced `OpenFile` types (with `projectId`, `projectTitle`) to `packages/shared/src/types/index.ts`
- [ ] T002 Create `WorkspaceStore` with `openProjectIds`, `activeProjectId`, `openProject()`, `closeProject()`, `setActiveProject()`, `isOpen()`, `save()`, `restore()` (with Zod validation of localStorage data), and `removeDeleted()` methods in `apps/studio/src/lib/stores/workspace.svelte.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Refactor existing stores to support compound keys and multi-project state. MUST be complete before any user story work.

**WARNING**: These changes touch the core reactive data flow. All existing single-project behavior must continue to work after these changes (the workspace simply has one project open by default).

- [ ] T003 Enhance `ProjectStore` to add `loadedProjects: Map<string, ProjectCache>` for caching multiple projects' metadata and files, add `loadProject(supabase, projectId)` that populates the cache, and refactor `project`/`files` to be derived from the active project in `apps/studio/src/lib/stores/project.svelte.ts`
- [ ] T004 Enhance `EditorStore` by adding `projectId` and `projectTitle` fields to the `OpenFile` interface, update `open()` and `ensure()` to accept project identity, add `closeAllForProject(projectId)` and `getFilesForProject(projectId)` methods, and add a `$effect` that calls `workspaceStore.setActiveProject()` when `activeFileId` changes in `apps/studio/src/lib/stores/editor.svelte.ts`
- [ ] T005 [P] Refactor `AstStore` to use compound keys `${projectId}::${uri}` for `fileAsts` map, add `mergedAsts: Map<string, SerializedStory>` keyed by projectId, add `activeProjectId` state, update all derived values (`activeAst`, `activeElements`, `allFileDiagnostics`) to scope by active project, and add `clearProject(projectId)` method in `apps/studio/src/lib/stores/ast.svelte.ts`
- [ ] T006 [P] Refactor `DiagramStore` to use compound keys `${projectId}::${viewType}` for `views` map, update `activeNodes`/`activeEdges` derivations to scope by active project, and add `clearProject(projectId)` method in `apps/studio/src/lib/stores/diagrams.svelte.ts`
- [ ] T007 Update `+layout.server.ts` to return all user projects (not just most recent) as `allProjects` array alongside existing data in `apps/studio/src/routes/+layout.server.ts`

**Checkpoint**: Foundation ready — all stores support multi-project state; existing single-project behavior is preserved. User story implementation can now begin.

---

## Phase 3: User Story 1 — Open Multiple Projects in Workspace (Priority: P1) MVP

**Goal**: Users can open multiple projects from the database into the workspace. Each project appears in the sidebar with its file tree. Files from any open project can be opened in editor tabs.

**Independent Test**: Open 2-3 projects, verify each appears in the sidebar, open files from different projects in editor tabs.

### Implementation for User Story 1

- [ ] T008 [US1] Create the `ProjectBrowserDialog.svelte` component: modal dialog listing all user projects with title, genre, lifecycle stage, and last modified columns; clicking a row opens the project; includes Cancel button; per contract in `contracts/project-browser-dialog.md` in `apps/studio/src/lib/components/ProjectBrowserDialog.svelte`
- [ ] T009 [US1] Refactor `ProjectSection.svelte` to accept project data as props (instead of reading from global `projectStore`), support multiple instances, and add visual active/inactive state styling in `apps/studio/src/lib/components/ProjectSection.svelte`
- [ ] T010 [US1] Update `+layout.svelte` for session restore: (a) call `workspaceStore.restore(userId)` on mount, (b) batch-load all previously open projects into `projectStore` cache from saved workspace state, (c) render one `ProjectSection` per open project in the sidebar (iterating `workspaceStore.openProjectIds`), (d) integrate `ProjectBrowserDialog` in `apps/studio/src/routes/+layout.svelte`
- [ ] T011 [US1] Add "Open Project..." menu item to the File menu that opens the `ProjectBrowserDialog`, and wire the `onOpen` callback to invoke the open-project flow (T012) in `apps/studio/src/lib/components/MenuBar.svelte`
- [ ] T012 [US1] Implement the on-demand open-project flow (called from browser dialog, not session restore): load a single project's metadata and files from the database into `projectStore.loadedProjects`, add to `workspaceStore.openProjectIds`, and auto-open the entry file in the editor via `editorStore.open()` with project identity in `apps/studio/src/routes/+layout.svelte`
- [ ] T013 [US1] Add duplicate-open guard: when user selects an already-open project in the browser, focus that project's section in the sidebar and its entry file tab instead of re-loading, per FR-005 in `apps/studio/src/routes/+layout.svelte`
- [ ] T014 [US1] Update the "New Project" flow to automatically add the newly created project to the workspace by calling `workspaceStore.openProject()` after successful creation in `apps/studio/src/routes/+layout.svelte`

**Checkpoint**: Multiple projects can be opened, appear in sidebar, and files from any project can be edited in tabs. This is the MVP.

---

## Phase 4: User Story 2 — Automatic Context Switching (Priority: P2)

**Goal**: When the user switches between editor tabs belonging to different projects, all dependent views (diagrams, outline, problems, gallery) automatically switch to show the correct project's data.

**Independent Test**: Open files from two different projects, switch between tabs, verify diagrams/outline/problems/gallery all update to show the correct project's content.

### Implementation for User Story 2

- [ ] T015 [US2] Create per-project Langium worker management: a `LangiumWorkerManager` class that creates, caches, and disposes Langium web workers keyed by projectId, supporting `getWorker(projectId)`, `disposeWorker(projectId)`, and `disposeAll()` in `apps/studio/src/lib/editor/langium-workers.ts`
- [ ] T016 [US2] Update `EditorPanel.svelte` to initialize a Langium worker per project (via `LangiumWorkerManager`) when a project is first opened, route parse results to `astStore` using compound keys (`${projectId}::${uri}`), and switch the active worker when tab focus changes projects in `apps/studio/src/lib/panels/EditorPanel.svelte`
- [ ] T017 [US2] Update `DiagramPanel.svelte` to read nodes/edges from the project-scoped compound key (`${activeProjectId}::${diagramType}`) in `diagramStore`, and refresh the diagram when `workspaceStore.activeProjectId` changes in `apps/studio/src/lib/panels/DiagramPanel.svelte`
- [ ] T018 [P] [US2] Update `ProblemsPanel.svelte` to filter diagnostics by the active project's compound key prefix, and re-render when `workspaceStore.activeProjectId` changes in `apps/studio/src/lib/panels/ProblemsPanel.svelte`
- [ ] T019 [P] [US2] Update the embedded outline sidebar within `EditorPanel.svelte` to derive elements from the active project's merged AST (`astStore.activeMergedAst`) rather than the global `mergedAst` in `apps/studio/src/lib/panels/EditorPanel.svelte`
- [ ] T020 [P] [US2] Update `GenerationStore` to scope `selectedScene` and `drafts` state by `workspaceStore.activeProjectId`, clearing generation state when the active project changes in `apps/studio/src/lib/stores/generation.svelte.ts`
- [ ] T021 [US2] Update `GalleryPanel.svelte` to reload assets when `workspaceStore.activeProjectId` changes, filtering by the new active project's ID in `apps/studio/src/lib/panels/GalleryPanel.svelte`
- [ ] T022 [US2] Update the sidebar to visually highlight the active project's `ProjectSection` (e.g., accent border or background) and optionally auto-expand it while collapsing others, per FR-011 in `apps/studio/src/routes/+layout.svelte`

**Checkpoint**: Switching between tabs from different projects causes all views to update seamlessly. Single-project behavior is fully preserved.

---

## Phase 5: User Story 3 — Close Project from Workspace (Priority: P3)

**Goal**: Users can close a project to remove it from the workspace without deleting it from the database. All its tabs are closed and its sidebar section is removed.

**Independent Test**: Open two projects, close one, verify its tabs and sidebar entry are removed, reopen it to verify data intact.

### Implementation for User Story 3

- [ ] T023 [US3] Implement the close-project flow: check for unsaved changes in the project's open files (`editorStore.getFilesForProject(projectId).filter(f => f.isDirty)`), prompt to save/discard if dirty, then call `editorStore.closeAllForProject(projectId)`, `astStore.clearProject(projectId)`, `diagramStore.clearProject(projectId)`, dispose the project's Langium worker, remove from `projectStore.loadedProjects`, and call `workspaceStore.closeProject(projectId)` in `apps/studio/src/routes/+layout.svelte`
- [ ] T024 [US3] Add "Close Project" to the sidebar project context menu (right-click on a `ProjectSection` header) and to the File menu, wiring both to the close-project flow in `apps/studio/src/lib/components/ProjectSection.svelte` and `apps/studio/src/lib/components/MenuBar.svelte`
- [ ] T025 [US3] Create the unsaved-changes prompt dialog: modal listing dirty files for the project being closed, with "Save All & Close", "Discard & Close", and "Cancel" buttons in `apps/studio/src/lib/components/UnsavedChangesDialog.svelte`
- [ ] T026 [US3] Implement focus-shift logic: when the active project is closed, shift focus to the most recently active tab from another open project; if no other projects have tabs, shift to any open project's entry file; if no projects remain, show the empty/welcome state, per FR-019 in `apps/studio/src/lib/stores/editor.svelte.ts`
- [ ] T027 [US3] Implement the empty/welcome state UI: when `workspaceStore.openProjectIds` is empty, show a centered message with "Open Project..." and "New Project..." buttons instead of the editor/sidebar content in `apps/studio/src/routes/+layout.svelte`

**Checkpoint**: Projects can be opened and closed freely. Closing preserves data in the database. Workspace state persists across reloads.

---

## Phase 6: User Story 4 — Delete Project with Double Confirmation (Priority: P4)

**Goal**: Users can permanently delete a project with a two-step confirmation (warning dialog → type project name to confirm). Deletion removes all related data from the database.

**Independent Test**: Create a test project, invoke delete, verify both confirmation steps, confirm project and all related data are removed.

### Implementation for User Story 4

- [ ] T028 [US4] Create the `DELETE /api/project/[id]` API endpoint: validate `id` parameter with Zod UUID schema, verify authenticated user owns the project, delete the project row (cascades to source_files and assets via FK constraints), return 200/404/500 in `apps/studio/src/routes/api/project/[id]/+server.ts`
- [ ] T029 [US4] Create `DeleteProjectDialog.svelte` implementing the two-step confirmation per `contracts/delete-project-dialog.md`: Step 1 warning dialog with Cancel/Continue, Step 2 name-match dialog with disabled Delete button until exact match, loading state during API call, error display on failure in `apps/studio/src/lib/components/DeleteProjectDialog.svelte`
- [ ] T030 [US4] Implement client-side cleanup after successful deletion: call the close-project flow (T023) to remove from workspace, then call `workspaceStore.removeDeleted(projectId)`, clean up diagram sidecar localStorage entries for the project, and show a success toast in `apps/studio/src/routes/+layout.svelte`
- [ ] T031 [US4] Add "Delete Project..." menu item to the File menu and to the sidebar project context menu, wiring both to open the `DeleteProjectDialog` for the selected/active project in `apps/studio/src/lib/components/MenuBar.svelte` and `apps/studio/src/lib/components/ProjectSection.svelte`

**Checkpoint**: Projects can be permanently deleted with full safety via double confirmation. All cascading cleanup works correctly.

---

## Phase 7: User Story 5 — Browse and Open Projects from Database (Priority: P5)

**Goal**: The project browser shows all user projects with rich metadata, search/filter, sorting, and visual distinction of already-open projects.

**Independent Test**: Create 10+ projects, close them all, use the project browser to search and open specific ones.

### Implementation for User Story 5

- [ ] T032 [US5] Enhance `ProjectBrowserDialog.svelte` with a search/filter text input that filters projects by title (case-insensitive, instant client-side filtering) in `apps/studio/src/lib/components/ProjectBrowserDialog.svelte`
- [ ] T033 [US5] Add column sorting to the project browser: clickable column headers for title, genre, lifecycle stage, and last modified (default sort: last modified descending) in `apps/studio/src/lib/components/ProjectBrowserDialog.svelte`
- [ ] T034 [US5] Add visual distinction for already-open projects: "Open" badge on rows whose project ID is in `workspaceStore.openProjectIds`, subtle background tint, per FR-017 in `apps/studio/src/lib/components/ProjectBrowserDialog.svelte`
- [ ] T035 [US5] Add empty states to the project browser: "No projects yet — create your first project" when user has zero projects, "No projects match your search" when filter yields no results in `apps/studio/src/lib/components/ProjectBrowserDialog.svelte`

**Checkpoint**: Project browser provides a complete, polished experience for finding and opening projects from the full library.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and overall UX refinement

- [ ] T036 Implement smart tab disambiguation: show `[ProjectTitle] / fileName.actone` prefix only when two or more open tabs share the same `filePath` across different projects, per contract in `contracts/editor-tab-disambiguation.md` in `apps/studio/src/lib/panels/EditorPanel.svelte`
- [ ] T037 [P] Make each `ProjectSection` in the sidebar independently collapsible with expand/collapse toggle, per FR-018 in `apps/studio/src/lib/components/ProjectSection.svelte`
- [ ] T038 [P] Add error handling for database-unreachable scenarios: show user-friendly error toast when opening or deleting a project fails due to network/DB issues, without corrupting workspace state in `apps/studio/src/routes/+layout.svelte`
- [ ] T039 Add `beforeunload` handler to warn about unsaved changes across all open projects when the user attempts to close the browser window in `apps/studio/src/routes/+layout.svelte`
- [ ] T040 Run `pnpm turbo build`, `pnpm turbo lint`, and `prettier --check .` to verify all quality gates pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001, T002) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 completion
- **US2 (Phase 4)**: Depends on Phase 2 completion; can run in parallel with US1 but benefits from US1 being done first (for manual testing)
- **US3 (Phase 5)**: Depends on Phase 2 completion; benefits from US1 being done (need open projects to close)
- **US4 (Phase 6)**: Depends on Phase 2 completion; benefits from US3 (reuses close-project flow)
- **US5 (Phase 7)**: Depends on US1 (enhances the basic project browser created in US1)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **US2 (P2)**: Can start after Phase 2 — independent of US1 but best tested after US1
- **US3 (P3)**: Can start after Phase 2 — independent of US1/US2 but needs open projects to test
- **US4 (P4)**: Can start after Phase 2 — reuses close-project logic from US3 (T023), so US3 should be done first
- **US5 (P5)**: Depends on US1 — enhances the `ProjectBrowserDialog` created in T008

### Within Each User Story

- Store/model changes before UI components
- API endpoints before UI that calls them
- Core implementation before integration/wiring

### Parallel Opportunities

- T005 and T006 (AstStore + DiagramStore refactors) are independent and can run in parallel
- T018, T019, T020 (ProblemsPanel + OutlinePanel + GenerationStore scoping) are independent and can run in parallel
- T036, T037, T038 (polish tasks) are independent and can run in parallel
- US1 and US2 can proceed in parallel after Phase 2 (different files)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# These can run in parallel (different store files):
Task T005: "Refactor AstStore compound keys in ast.svelte.ts"
Task T006: "Refactor DiagramStore compound keys in diagrams.svelte.ts"

# These must be sequential (T003 before T004, T004 sets up the $effect bridge):
Task T003: "Enhance ProjectStore in project.svelte.ts"
Task T004: "Enhance EditorStore in editor.svelte.ts"
```

## Parallel Example: User Story 2 (Context Switching)

```bash
# These can run in parallel (different panel files):
Task T018: "Update ProblemsPanel in ProblemsPanel.svelte"
Task T019: "Update OutlinePanel in EditorPanel.svelte"
Task T020: "Update GenerationStore in generation.svelte.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T007)
3. Complete Phase 3: User Story 1 (T008–T014)
4. **STOP and VALIDATE**: Open multiple projects, verify sidebar and tabs work
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Multiple projects open, basic browser → MVP!
3. Add US2 → Context switching works across all panels
4. Add US3 → Close project with unsaved-changes guard
5. Add US4 → Delete project with double confirmation
6. Add US5 → Enhanced project browser with search/sort
7. Polish → Tab disambiguation, collapsible sections, error handling

### Recommended Execution Order

For a single developer, the optimal path is:

```
Phase 1 → Phase 2 → US1 → US2 → US3 → US4 → US5 → Polish
```

US4 should follow US3 because it reuses the close-project cleanup flow.
US5 should follow US1 because it enhances the browser dialog created there.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No database schema changes required — existing schema supports multi-project
- Workspace state persisted in localStorage (device-local)
- Each phase is independently deployable after the foundational phase
- Total: 40 tasks across 8 phases
