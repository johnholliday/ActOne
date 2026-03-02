# Tasks: Multi-File Grammar with Automatic Consolidation

**Input**: Design documents from `/specs/006-multi-file-grammar/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in specification. Manual verification steps included in each phase checkpoint.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. US1 (Characters in Separate File) and US2 (Any Component Type Across Files) share identical implementation since the grammar change accepts all `StoryElement` types at top level — they are combined in Phase 3.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

```text
packages/langium/
├── src/
│   ├── actone.langium                          # Grammar definition
│   ├── generated/                              # Langium codegen output (never manually edit)
│   │   ├── ast.ts
│   │   ├── grammar.ts
│   │   └── module.ts
│   ├── serializer/
│   │   └── ast-serializer.ts                   # AST → SerializedStory conversion
│   ├── services/
│   │   ├── actone-scope.ts                     # Cross-file scope resolution
│   │   ├── actone-validator.ts                 # Semantic validation checks
│   │   └── actone-module.ts                    # Service registration / DI
│   └── worker/
│       └── main-browser.ts                     # Web worker RPC handlers
└── langium-config.json                         # No change

apps/studio/
└── src/lib/stores/
    └── editor.svelte.ts                        # Studio AST store

packages/shared/
└── src/types/
    └── ast.ts                                  # No change (SerializedStory unchanged)
```

---

## Phase 1: Setup

**Purpose**: Verify starting state and branch

- [x] T001 Verify on `006-multi-file-grammar` branch with clean working tree, confirm `pnpm build` passes from repo root

---

## Phase 2: Foundational (Grammar Change + Code Regeneration)

**Purpose**: Change the entry rule from `Story` to `Document` and regenerate all Langium types. This is the critical blocking step — ALL subsequent work depends on the new `Document` AST type existing.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Modify grammar entry rule: change `entry Story` to new `entry Document: (story=Story)? (elements+=StoryElement)*;` and remove `entry` keyword from `Story` rule in `packages/langium/src/actone.langium`
- [x] T003 Regenerate Langium types by running `pnpm langium:generate` in `packages/langium/`
- [x] T004 Verify generated output: confirm `Document` interface, `isDocument` type guard, and `Story` interface (no longer entry) exist in `packages/langium/src/generated/ast.ts` — do NOT manually edit generated files (Constitution Principle V)

**Checkpoint**: Grammar accepts standalone components at top level. `Document` type available for all downstream code.

---

## Phase 3: User Story 1+2 — Core Multi-File Component Support (Priority: P1)

**Goal**: Enable defining any component type (characters, worlds, scenes, plots, timelines, themes, interactions, generate blocks) in any `.actone` file, either inside a `story` block or at top level. All components across all files are collected into a single `SerializedStory`.

**Independent Test (US1)**: Create two `.actone` files — one with `story "Test" { ... }` and one with standalone `character Elena { ... }`. Process the project and verify both files' elements appear in the consolidated output.

**Independent Test (US2)**: Create 3+ `.actone` files with different component types (world in one, scenes in another, characters in a third). Verify all cross-references resolve and all diagram views render correctly.

### Implementation

- [x] T005 [P] [US1] Add `serializeDocument(doc: Document): SerializedStory` function that merges `doc.story?.elements` and `doc.elements`, extracting name from `doc.story?.name` or `""` — in `packages/langium/src/serializer/ast-serializer.ts`
- [x] T006 [P] [US1] Update scope provider: replace `collectStories()` with `collectDocumentElements()` returning `StoryElement[]` from all documents' `story?.elements` and `elements`; replace `findStory()` with `findDocument()`; update `getCharacterScope()`, `getLocationScope()`, `getTimelineLayerScope()` to consume flattened elements — in `packages/langium/src/services/actone-scope.ts`
- [x] T007 [US1] Update web worker `actone/getSerializedAst` and `actone/getAstForAllFiles` handlers: change `isStory(root)` to `isDocument(root)`, call `serializeDocument()` instead of `serializeStory()` — in `packages/langium/src/worker/main-browser.ts`
- [x] T008 [US2] Add `actone/getMergedAst` RPC endpoint: iterate all workspace documents, collect all elements from all `Document` nodes, consolidate into single `SerializedStory` with story name from the one `story` block (or `""`) — in `packages/langium/src/worker/main-browser.ts`

**Checkpoint**: Multi-file parsing works at the Langium engine level. The worker can serialize individual documents and return a merged AST. Scope provider resolves cross-file references for all component types.

---

## Phase 4: User Story 3 — Seamless Editing Experience Across Files (Priority: P2)

**Goal**: Changes in one file immediately reflect in all views and cross-reference validation across files, with no perceptible additional delay versus single-file editing.

**Independent Test**: Open a multi-file project in the studio, edit a character name in `characters.actone`, and verify that diagrams update and references in `scenes.actone` show validation feedback immediately.

### Implementation

- [x] T009 [US3] Update studio AST store to call `actone/getMergedAst` for consolidated view instead of `getAstForAllFiles` with manual composition — in `apps/studio/src/lib/stores/editor.svelte.ts`
- [x] T010 [US3] Verify that `actone/updateFile` triggers workspace rebuild and re-serialization, ensuring the existing incremental update path produces updated merged output — in `packages/langium/src/worker/main-browser.ts`
- [x] T011 [US3] Verify file addition/removal: confirm that calling `actone/updateFile` with a new file URI creates a new Document in the workspace and its elements appear in `getMergedAst` output; confirm that invalidating a document URI removes its elements from the merged result — in `packages/langium/src/worker/main-browser.ts`

**Checkpoint**: Studio displays consolidated multi-file AST. Editing any file refreshes all views automatically. Adding/removing files updates the merged output.

---

## Phase 5: User Story 4 — Mixed File Organization / Backward Compatibility (Priority: P2)

**Goal**: Both single-file and multi-file organization styles work seamlessly. Existing single-file projects continue to work with zero changes.

**Independent Test**: Open an existing single-file `.actone` project and verify identical behavior to the current system. Open a file with both a `story` block and standalone components and verify both are consolidated.

**Note**: This user story requires no new code — it is inherently satisfied by the grammar change (Phase 2) which makes the `story` block optional. This phase verifies backward compatibility.

### Verification

- [x] T012 [US4] Verify backward compatibility: confirm existing single-file `.actone` projects with `story "Name" { ... }` parse and serialize identically to pre-change behavior — in `packages/langium/src/actone.langium` and `packages/langium/src/serializer/ast-serializer.ts`
- [x] T013 [US4] Verify mixed mode: confirm a file containing both `story "Name" { generate { ... } }` and standalone `character Elena { ... }` at top level parses correctly with both sources consolidated — in `packages/langium/src/serializer/ast-serializer.ts`

**Checkpoint**: All file organization modes (single-file, multi-file, mixed) work correctly.

---

## Phase 6: User Story 5 — Validation Across File Boundaries (Priority: P3)

**Goal**: Clear error messages when duplicate definitions, multiple story blocks, or multiple generate blocks exist across files. Errors identify both file locations.

**Independent Test**: Create two files both defining `character Elena { ... }`. Verify a validation error appears identifying both files and the duplicate name.

### Implementation

- [x] T014 [US5] Add `LangiumDocuments` service injection to `ActOneValidator` constructor and update module creation to pass services — in `packages/langium/src/services/actone-validator.ts` and `packages/langium/src/services/actone-module.ts`
- [x] T015 [US5] Implement `checkDocument(doc: Document, accept: ValidationAcceptor)` with three cross-document checks: (1) at most one `story` block across all documents, (2) at most one `GenerateBlock` across all documents and standalone elements, (3) no duplicate named definitions of the same type — error messages must include the conflicting file path — in `packages/langium/src/services/actone-validator.ts`
- [x] T016 [US5] Register `Document: validator.checkDocument` in the validation checks object within `registerActOneValidationChecks()` — in `packages/langium/src/services/actone-validator.ts`

**Checkpoint**: Cross-file validation errors appear with clear messages identifying conflicting file locations.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates and final verification across all user stories

- [x] T017 Run quality gates: `pnpm check-types`, `pnpm build`, `pnpm lint`, `prettier --check .` from repo root
- [x] T018 Run quickstart.md validation: verify all 6 verification steps pass (langium:generate, check-types, build, lint, multi-file test, single-file test)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1+US2 (Phase 3)**: Depends on Phase 2 (needs `Document` type to exist)
- **US3 (Phase 4)**: Depends on Phase 3 T008 (needs `getMergedAst` endpoint)
- **US4 (Phase 5)**: Depends on Phase 3 (verification of core changes)
- **US5 (Phase 6)**: Depends on Phase 2 (needs `Document` type); independent of Phases 3-5
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1+US2 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories
- **US3 (P2)**: Depends on US2's `getMergedAst` endpoint (T008) — cannot start until Phase 3 complete
- **US4 (P2)**: Depends on Phase 3 core changes — verification only, no new code
- **US5 (P3)**: Can start after Foundational (Phase 2) — independent of US1-US4 implementation

### Task-Level Dependencies

```
T001 → T002 → T003 → T004
                        ↓
              ┌─────────┴──────────┐
              ↓                    ↓
          T005 [P]             T006 [P]
              ↓                    │
          T007 ←───────────────────┘ (T007 needs both T005 and T006)
              ↓
          T008
              ↓
          T009 → T010 → T011

T004 ──→ T014 → T015 → T016  (US5 branch, parallel with Phases 3-5)

T011 + T013 + T016 → T017 → T018
```

### Within Each User Story

- Core implementation before integration
- Serializer and scope provider can be parallel (different files)
- Worker depends on serializer (uses `serializeDocument()`)
- Studio integration depends on worker endpoint
- Validator is independent of serializer/scope/worker (separate concern)

### Parallel Opportunities

- **Phase 3**: T005 (serializer) and T006 (scope provider) can run in parallel — different files, no dependencies
- **Phase 6**: Can run in parallel with Phases 3-5 (T014-T016 only depend on Phase 2)
- **Cross-story**: US5 validator work can be done concurrently with US1-US4 implementation

---

## Parallel Example: Phase 3 (US1+US2)

```bash
# Launch serializer and scope provider updates in parallel:
Task T005: "Add serializeDocument() in packages/langium/src/serializer/ast-serializer.ts"
Task T006: "Update scope provider in packages/langium/src/services/actone-scope.ts"

# Then sequentially (both depend on T005):
Task T007: "Update worker type guards in packages/langium/src/worker/main-browser.ts"
Task T008: "Add getMergedAst endpoint in packages/langium/src/worker/main-browser.ts"
```

## Parallel Example: US5 alongside US3

```bash
# These can run concurrently (different files, independent concerns):
Task T009: "Update studio AST store in apps/studio/src/lib/stores/editor.svelte.ts"  (US3)
Task T014: "Add LangiumDocuments injection in packages/langium/src/services/actone-validator.ts"  (US5)
```

---

## Implementation Strategy

### MVP First (US1+US2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (grammar change + regeneration) — CRITICAL
3. Complete Phase 3: US1+US2 (serializer, scope, worker)
4. **STOP and VALIDATE**: Multi-file parsing works at engine level
5. Optionally run Phase 7 quality gates

### Incremental Delivery

1. Phase 1 + Phase 2 → Grammar accepts standalone components
2. Add Phase 3 (US1+US2) → Multi-file consolidation works in engine → **MVP!**
3. Add Phase 4 (US3) → Studio displays merged AST, live editing works
4. Add Phase 5 (US4) → Backward compatibility verified
5. Add Phase 6 (US5) → Rich cross-file validation errors
6. Phase 7 → Quality gates pass, feature complete

### Recommended Execution Order

For a single developer, execute sequentially by phase:
1. **Phases 1-3** first (core engine work, ~70% of implementation effort)
2. **Phase 4** next (studio integration, ~15% of effort)
3. **Phase 6** next (validation, ~10% of effort) — skip Phase 5 until polish
4. **Phases 5+7** last (verification + quality gates, ~5% of effort)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1 and US2 share identical implementation — the grammar change accepts ALL StoryElement types at top level, not just characters
- US4 requires no new code — backward compatibility is inherent in the `Document` grammar design where `story` is optional
- `packages/shared/src/types/ast.ts` (`SerializedStory`) is UNCHANGED — zero impact on downstream consumers
- `packages/langium/src/generated/` files are REGENERATED, never manually edited (Constitution Principle V)
- Commit after each task or logical group following conventional commits format
