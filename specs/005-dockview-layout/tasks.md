# Tasks: Dockview Layout Manager

**Input**: Design documents from `/specs/005-dockview-layout/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are included — the feature specification requires no regressions across existing 391 tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Install dockview-core and create the integration module structure

- [x] T001 Install dockview-core v5.0.0 via `pnpm --filter=studio add dockview-core`
- [x] T002 Create dockview module directory at `apps/studio/src/lib/dockview/`
- [x] T003 Import dockview CSS in `apps/studio/src/app.css` (static import of `dockview-core/dist/styles/dockview.css`)
- [x] T004 Add dockview CSS custom property overrides for ActOne dark theme in `apps/studio/src/app.css` (match surface-800/850/900 colors, amber accents, #252525 borders, 32px tab height)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core dockview bridge layer that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Implement `SvelteContentRenderer` class in `apps/studio/src/lib/dockview/SvelteContentRenderer.ts` — implements `IContentRenderer` from dockview-core using Svelte 5 `mount()`/`unmount()` with writable store for params propagation (see research.md R2)
- [x] T006 Implement panel registry in `apps/studio/src/lib/dockview/panel-registry.ts` — define `PanelDefinition` type and registry mapping 14 panel IDs to their Svelte components, titles, and renderer modes (see data-model.md PanelDefinition, research.md R7/R8)
- [x] T007 Implement default layout configuration in `apps/studio/src/lib/dockview/default-layout.ts` — function that calls `api.addPanel()` to create editor (80% height, `renderer: 'always'`) and diagnostics (20% height, below editor) as the initial arrangement (see contracts ui-contracts.md Contract 6)
- [x] T008 Implement layout persistence in `apps/studio/src/lib/dockview/layout-persistence.ts` — `saveLayout()` (debounced 500ms, `api.toJSON()` + version field → localStorage `actone:dockview-layout`), `restoreLayout()` (validate version → `api.fromJSON()` → fallback to default), `clearLayout()` (remove from localStorage) (see contracts ui-contracts.md Contract 3, data-model.md Persistence)
- [x] T009 Implement `DockLayout.svelte` wrapper component in `apps/studio/src/lib/dockview/DockLayout.svelte` — dynamic `import('dockview-core')` in `onMount` (SSR-safe), creates dockview instance with panel registry's `createComponent` factory, applies dark theme, calls `onReady` prop with api, disposes on destroy. Does NOT wire persistence (that is T028). (see contracts ui-contracts.md Contract 5, research.md R4/R5)

**Checkpoint**: Foundation ready — dockview can render panels with Svelte components, persist layout, and restore it

---

## Phase 3: User Story 1 — View Multiple Panels Simultaneously (Priority: P1) MVP

**Goal**: Replace the current single-page content area with the dockview layout container so users can open and view multiple panels side-by-side

**Independent Test**: Open the editor and a diagram panel simultaneously; verify both are visible and functional

### Implementation for User Story 1

- [x] T010 [US1] Extract editor content from `apps/studio/src/routes/+page.svelte` into a standalone panel component `apps/studio/src/lib/panels/EditorPanel.svelte` — move CodeMirror editor, toolbar, save orchestration, and symbol refresh logic into a self-contained component that accepts dockview panel props (`api`, `containerApi`, `title`, `panelParams`). The panel must fill its container (100% width/height) and work when mounted/unmounted by dockview.
- [x] T011 [P] [US1] Extract diagnostics/output content from `apps/studio/src/routes/+layout.svelte` bottom panel into `apps/studio/src/lib/panels/DiagnosticsPanel.svelte` — move the Problems/Output tab content into a standalone panel component with dockview panel props
- [x] T012 [P] [US1] Extract outline content from `apps/studio/src/routes/+page.svelte` outline panel into `apps/studio/src/lib/panels/OutlinePanel.svelte` — move document symbol tree into a standalone panel component with dockview panel props
- [x] T013 [P] [US1] Create panel wrapper components for all 5 diagram views: `apps/studio/src/lib/panels/DiagramPanel.svelte` — a single component that accepts a `diagramType` param and renders the appropriate diagram (story-structure, character-network, world-map, timeline, interaction). Reuse existing diagram page components as inner content.
- [x] T014 [P] [US1] Create panel wrapper components for remaining views in `apps/studio/src/lib/panels/`: `StoryBiblePanel.svelte`, `GalleryPanel.svelte`, `ReadingModePanel.svelte`, `SpreadPreviewPanel.svelte`, `StatisticsPanel.svelte`, `ExportPanel.svelte` — each wraps the existing route page component with dockview panel props
- [x] T015 [US1] Update panel registry in `apps/studio/src/lib/dockview/panel-registry.ts` to import and map all 14 panel components created in T010–T014
- [x] T016 [US1] Modify `apps/studio/src/routes/+layout.svelte` to replace `{@render children()}` main content area and bottom panel with `<DockLayout>` component — remove the bottom panel HTML, bottom panel resize handle, and outline-right panel. Keep sidebar and MenuBar header unchanged. Pass `onReady` handler that stores the dockview API reference and applies saved or default layout.
- [x] T017 [US1] Update `apps/studio/src/routes/+page.svelte` to become a thin shell — since the editor is now a dockview panel, the root page component should render nothing (or a minimal placeholder) and instead the editor panel is opened via the default layout in DockLayout
- [x] T018 [US1] Implement panel open/focus helper function in `apps/studio/src/lib/dockview/panel-actions.ts` — `openPanel(panelId)` that checks if panel exists (`api.getPanel(id)`) and focuses it, or creates it via `api.addPanel()` with default position (see contracts ui-contracts.md Contract 4)
- [x] T019 [US1] Update sidebar navigation in `apps/studio/src/routes/+layout.svelte` — replace `<a href={item.route}>` navigation links with `onclick` handlers that call `openPanel()` instead of page navigation. Settings pages (/settings/*) continue to use `goto()`.
- [x] T020 [US1] Update `apps/studio/src/lib/stores/ui.svelte.ts` — remove `bottomPanelVisible`, `bottomPanelHeight`, `outlineVisible`, `outlineWidth`, `outlineDockPosition`, `toggleBottomPanel()`, `resizeBottomPanel()`, `toggleOutline()`, `resizeOutline()`, `setOutlineDockPosition()` which are now managed by dockview (see data-model.md Removed State)
- [x] T021 [US1] Update `apps/studio/src/lib/settings/layout.ts` — remove `bottomPanelHeight`, `bottomPanelVisible`, `outlineWidth`, `outlineVisible`, `outlineDockPosition` from `LayoutPrefs` since these are now in dockview's serialized layout. Keep `sidebarWidth`, `sidebarVisible`.
- [x] T022 [US1] Update `apps/studio/src/lib/components/MenuBar.svelte` — update View menu: remove Sidebar/Bottom Panel/Outline toggle items (these are now dockview panels users can open/close via tabs). Add "Reset Layout" item that calls `clearLayout()` + applies default layout. Update navigation items (File menu, View menu diagram items, Run menu) to use `openPanel()`.
- [x] T023 [US1] Update keyboard shortcuts in `apps/studio/src/routes/+layout.svelte` `handleKeydown` — remove Ctrl+J (toggle bottom panel), Ctrl+Shift+O (toggle outline) since these panels are now managed by dockview. Keep Ctrl+B (toggle sidebar), Ctrl+S (save), Ctrl+O (open project), Ctrl+G (generate), Ctrl+Shift+F (format), Alt+Z (word wrap), Ctrl+1-5 (open diagram panels via `openPanel()`).
- [x] T024 [US1] Fix existing tests in `apps/studio/tests/unit/layout-preferences.test.ts` — update to reflect removed bottom panel and outline fields from LayoutPrefs
- [x] T025 [US1] Verify build passes: `pnpm build --filter=studio` and all existing tests pass: `pnpm --filter=studio test`

**Checkpoint**: Users can view editor + diagnostics in the default layout, and open additional panels via sidebar/menu navigation. Multiple panels visible simultaneously. This is the MVP.

---

## Phase 4: User Story 2 — Rearrange Panels via Drag and Drop (Priority: P2)

**Goal**: Users can drag panel tabs to rearrange their workspace — move panels to different positions, merge into tab groups

**Independent Test**: Drag a panel tab from one position to another; verify it docks in the new position with visual feedback

### Implementation for User Story 2

- [x] T026 [US2] Verify and configure dockview drag-and-drop settings in `apps/studio/src/lib/dockview/DockLayout.svelte` — ensure `disableDnd` is NOT set (drag-and-drop is enabled by default), configure `dndEdges` for drop target overlay model if needed, verify drag visual indicators use amber accent color via CSS custom properties
- [x] T027 [US2] Style drag-and-drop overlay indicators in `apps/studio/src/app.css` — override `--dv-drag-over-background-color` to use amber accent (`#F59E0B40`), ensure drop target zones are clearly visible against the dark theme

**Checkpoint**: Drag-and-drop works out of the box from dockview — this phase primarily ensures visual polish matches the ActOne theme

---

## Phase 5: User Story 3 — Persist and Restore Layout (Priority: P2)

**Goal**: Layout arrangement persists across browser sessions and can be reset to defaults

**Independent Test**: Arrange panels, refresh browser, verify layout is restored identically

### Implementation for User Story 3

- [x] T028 [US3] Wire layout persistence into `apps/studio/src/lib/dockview/DockLayout.svelte` `onReady` handler — subscribe to `api.onDidLayoutChange` and call `saveLayout()` (debounced). On mount, call `restoreLayout()` before applying default layout. Handle migration from old `actone:layout` localStorage key.
- [x] T029 [US3] Remove old layout persistence code from `apps/studio/src/routes/+layout.svelte` — remove `persistLayout()` function, `actone:persist-layout` event listener, and layout restore logic in `onMount` that reads `actone:layout` localStorage. Sidebar persistence (`sidebarWidth`, `sidebarVisible`) must be retained separately.
- [x] T030 [US3] Add "Reset Layout" handler in `apps/studio/src/routes/+layout.svelte` — wire the View menu "Reset Layout" action (from T022) to call `clearLayout()` from `layout-persistence.ts` and reapply default layout via `default-layout.ts`
- [x] T031 [US3] Handle edge case: unknown panel types in saved layout — in `SvelteContentRenderer.ts` or the `createComponent` factory, gracefully handle unknown panel names by returning a placeholder renderer with an error message instead of throwing (see spec.md Edge Cases)
- [x] T032 [US3] Handle edge case: user closes all panels — subscribe to `api.onDidRemovePanel` in `DockLayout.svelte` and if `api.totalPanels === 0`, reopen the editor panel via default layout

**Checkpoint**: Layout persistence works end-to-end — arrange, refresh, verify restoration. Reset works via View menu.

---

## Phase 6: User Story 4 — Tabbed Panel Groups (Priority: P3)

**Goal**: Multiple panels can share the same area as tabs, with click-to-switch and close behaviors

**Independent Test**: Open three panels as tabs in the same group; switch between them by clicking tabs; close one and verify others remain

### Implementation for User Story 4

- [x] T033 [US4] Verify tabbed group behavior in `apps/studio/src/lib/dockview/DockLayout.svelte` — dockview supports tabbed groups natively; verify that dropping a panel onto an existing group's tab bar creates a tab. Ensure tab close button is visible and styled to match the ActOne theme.
- [x] T034 [US4] Style panel tabs in `apps/studio/src/app.css` — override `--dv-activegroup-visiblepanel-tab-background-color`, `--dv-activegroup-visiblepanel-tab-color`, `--dv-activegroup-hiddenpanel-tab-color`, `--dv-inactivegroup-visiblepanel-tab-background-color` to match ActOne dark theme (amber for active tab, zinc-500 for inactive)
- [x] T035 [US4] Configure `singleTabMode` in `DockLayout.svelte` — set to `'fullwidth'` so single tabs fill the header width (matching VS Code behavior)

**Checkpoint**: Tabs work — users can group, switch, and close tabbed panels

---

## Phase 7: User Story 5 — Resize Panels by Dragging Dividers (Priority: P3)

**Goal**: Users can resize panels by dragging the dividers between them

**Independent Test**: Drag a divider between two panels; verify both resize smoothly

### Implementation for User Story 5

- [x] T036 [US5] Style resize dividers (sashes) in `apps/studio/src/app.css` — override `--dv-sash-color` and `--dv-active-sash-color` to match the existing resize handle styling (transparent default, amber-500/30 on hover, amber-500/50 when active)
- [x] T037 [US5] Verify divider resize behavior — dockview handles resizable dividers natively; verify smooth 60fps resize, no minimum size violations, and sizes are captured in layout serialization

**Checkpoint**: Resizable dividers work and match the existing visual style

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, test updates, and verification

- [x] T038 Remove unused route page components that are now panels — clean up `apps/studio/src/routes/diagram/*/+page.svelte`, `apps/studio/src/routes/story-bible/+page.svelte`, `apps/studio/src/routes/gallery/+page.svelte`, `apps/studio/src/routes/reading-mode/+page.svelte`, `apps/studio/src/routes/spread-preview/+page.svelte`, `apps/studio/src/routes/statistics/+page.svelte`, `apps/studio/src/routes/export/+page.svelte` — either redirect to open the panel or remove if unreachable
- [x] T039 Update test mocks that reference removed uiStore properties — search `apps/studio/tests/` for references to `bottomPanelVisible`, `bottomPanelHeight`, `outlineVisible`, `outlineWidth`, `outlineDockPosition` and update or remove them
- [x] T040 [P] Add unit tests for panel registry in `apps/studio/tests/unit/panel-registry.test.ts` — verify all 13 panel types are registered, unknown names throw errors, component mapping is correct
- [x] T041 [P] Add unit tests for layout persistence in `apps/studio/tests/unit/layout-persistence.test.ts` — verify save/restore/clear cycle, version validation, graceful handling of corrupted data
- [x] T042 Run full build and test suite: `pnpm build --filter=studio && pnpm --filter=studio test` — verify all existing tests pass with no regressions, build produces no new warnings
- [x] T043 Run quickstart.md manual verification checklist — walk through all verification steps in `specs/005-dockview-layout/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — this is the MVP
- **US2 (Phase 4)**: Depends on US1 (needs panels to exist for drag-and-drop)
- **US3 (Phase 5)**: Depends on US1 (needs DockLayout wired in for persistence)
- **US4 (Phase 6)**: Depends on US1 (needs panels to exist for tabbing)
- **US5 (Phase 7)**: Depends on US1 (needs panels to exist for resizing)
- **Polish (Phase 8)**: Depends on all user stories being complete

### Within Each User Story

- Foundation layer (SvelteContentRenderer, registry, DockLayout) before panel extraction
- Panel component extraction before layout integration
- Layout integration before navigation updates
- Navigation updates before state cleanup

### Parallel Opportunities

**Phase 2 (Foundational)**:
- T005, T006, T007, T008 can all run in parallel (separate files, no dependencies)
- T009 depends on T005, T006, T007, T008

**Phase 3 (US1)**:
- T011, T012, T013, T014 can run in parallel (separate panel component files)
- T010 should go first (editor is the most complex panel)
- T015 depends on T010–T014 (needs all panels created)
- T016, T017, T018, T019, T020, T021, T022, T023 are sequential (modify shared files)
- T024 can run after T020–T021

**Phase 4–7 (US2–US5)**:
- US2, US4, US5 can run in parallel after US1 (CSS styling tasks, independent files)
- US3 must be sequential (modifies DockLayout.svelte and +layout.svelte)

**Phase 8 (Polish)**:
- T040, T041 can run in parallel (separate test files)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch all foundational tasks together (different files):
Task: "Implement SvelteContentRenderer in apps/studio/src/lib/dockview/SvelteContentRenderer.ts"
Task: "Implement panel registry in apps/studio/src/lib/dockview/panel-registry.ts"
Task: "Implement default layout in apps/studio/src/lib/dockview/default-layout.ts"
Task: "Implement layout persistence in apps/studio/src/lib/dockview/layout-persistence.ts"
```

## Parallel Example: Phase 3 Panel Extraction

```bash
# Launch panel extraction tasks together (different files):
Task: "Extract diagnostics into apps/studio/src/lib/panels/DiagnosticsPanel.svelte"
Task: "Extract outline into apps/studio/src/lib/panels/OutlinePanel.svelte"
Task: "Create diagram panel in apps/studio/src/lib/panels/DiagramPanel.svelte"
Task: "Create remaining panels in apps/studio/src/lib/panels/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational (T005–T009)
3. Complete Phase 3: User Story 1 (T010–T025)
4. **STOP and VALIDATE**: Verify multi-panel viewing works, build passes, tests pass
5. Deploy/demo if ready — users can already view panels side-by-side

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (**MVP**)
3. Add User Story 2 (drag-and-drop polish) → mostly CSS styling
4. Add User Story 3 (persistence) → layout survives refresh
5. Add User Story 4 (tabs polish) → tab styling refinement
6. Add User Story 5 (divider polish) → sash styling refinement
7. Polish phase → cleanup, tests, final verification

### Notes

- US2, US4, US5 are primarily CSS/config tasks since dockview provides drag-and-drop, tabs, and resizable dividers natively. The work is mostly about visual polish to match the ActOne theme.
- US1 is the heavy lift — extracting 13 view components and rewiring the layout.
- US3 (persistence) is the second most complex — wiring save/restore/reset and handling edge cases.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
