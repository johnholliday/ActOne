# Tasks: Shared String Utilities Package

**Input**: Design documents from `/specs/001-string-utils/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/public-api.md

**Tests**: Included — FR-010 explicitly requires "a comprehensive test suite with full coverage of documented acceptance scenarios and edge cases."

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Initialize `@repo/string-utils` package with project configuration

- [x] T001 Create packages/string-utils/package.json with name `@repo/string-utils`, `"type": "module"`, `"sideEffects": false`, dual exports (barrel `"."` + per-module `"./case"`, `"./whitespace"`, `"./truncate"`, `"./slug"` each with `import` and `types` conditions pointing to `./dist/`), scripts (`build`: `tsc`, `lint`: `eslint . --max-warnings 0`, `check-types`: `tsc --noEmit`, `test`: `vitest run`, `test:watch`: `vitest`), devDependencies (`@repo/eslint-config: workspace:*`, `@repo/typescript-config: workspace:*`, `typescript`, `vitest`, `eslint`), zero runtime dependencies
- [x] T002 [P] Create packages/string-utils/tsconfig.json extending `@repo/typescript-config/base.json`, override `module` to `"ESNext"` and `moduleResolution` to `"Bundler"` per constitution, set `outDir` to `"dist"`, `declaration: true`, `declarationMap: true`, `sourceMap: true`, include `["src"]`, exclude `["node_modules", "dist", "__tests__"]`
- [x] T003 [P] Create packages/string-utils/eslint.config.mjs importing and re-exporting `config` from `@repo/eslint-config/base` (same pattern as packages/ui/eslint.config.mjs)
- [x] T004 [P] Create packages/string-utils/vitest.config.ts with `test.include` set to `["__tests__/**/*.test.ts"]`
- [x] T005 [P] Create empty barrel stub packages/string-utils/src/index.ts (empty file — each user story phase will add its re-exports here; creating it now allows all stories to update it independently regardless of execution order)

After this phase: run `pnpm install` from repo root to link the new workspace package.

---

## Phase 2: Foundational

**Purpose**: Shared internal module that blocks User Story 1 (case conversion)

**Note**: US2 (whitespace), US3 (truncation), and US4 (slug) do NOT depend on this phase — they can start after Phase 1 if working in parallel.

- [x] T006 Implement `splitWords(input: string): string[]` in packages/string-utils/src/words.ts — regex-based word splitting that handles: explicit delimiters (hyphens, underscores, spaces, dots), lowercase→uppercase transitions (`aB` splits between `a` and `B`), acronym boundaries (`HTTPResponse` splits between `P` and `R` keeping `HTTP` together), filters empty segments, returns lowercase words. See research.md Decision 4 for algorithm details. Include inline tests or assertions for: `"myVariableName"` → `["my", "variable", "name"]`, `"parseHTTPResponse"` → `["parse", "http", "response"]`, `"my-component-name"` → `["my", "component", "name"]`, `"some_mixed-caseString"` → `["some", "mixed", "case", "string"]`, `""` → `[]`

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 — Case Conversion (Priority: P1) 🎯 MVP

**Goal**: Developers can convert strings between camelCase, PascalCase, snake_case, kebab-case, and CONSTANT_CASE

**Independent Test**: Import any case conversion function, pass a string in any casing format, verify correct output

### Tests for User Story 1

> **Write tests FIRST. Ensure they FAIL before implementing.**

- [x] T007 [US1] Write case conversion tests in packages/string-utils/__tests__/case.test.ts covering all acceptance scenarios from spec: (1) `toCamelCase("my_variable_name")` → `"myVariableName"`, `toCamelCase("my-component-name")` → `"myComponentName"`, `toCamelCase("parseHTTPResponse")` → `"parseHttpResponse"`; (2) `toPascalCase("my-component-name")` → `"MyComponentName"`, `toPascalCase("my_variable_name")` → `"MyVariableName"`; (3) `toSnakeCase("myVariableName")` → `"my_variable_name"`, `toSnakeCase("MyComponentName")` → `"my_component_name"`; (4) `toKebabCase("myVariableName")` → `"my-variable-name"`, `toKebabCase("parseHTTPResponse")` → `"parse-http-response"`; (5) `toConstantCase("myVariableName")` → `"MY_VARIABLE_NAME"`, `toConstantCase("parse-http-response")` → `"PARSE_HTTP_RESPONSE"`. Edge cases: empty string returns empty for all functions, whitespace-only returns empty, `"alllowercase"` preserves as single word, mixed delimiters `"some_mixed-caseString"` recognized correctly

### Implementation for User Story 1

- [x] T008 [US1] Implement `toCamelCase`, `toPascalCase`, `toSnakeCase`, `toKebabCase`, `toConstantCase` in packages/string-utils/src/case.ts using `splitWords` from `./words.ts`. Each function: calls `splitWords(input)`, joins words with the appropriate separator and casing per contracts/public-api.md
- [x] T009 [US1] Update barrel export in packages/string-utils/src/index.ts adding re-exports from `./case.ts`

**Checkpoint**: `pnpm test` in packages/string-utils passes all case conversion tests. Package builds with `tsc`. User Story 1 is independently functional.

---

## Phase 4: User Story 2 — Whitespace Normalization (Priority: P2)

**Goal**: Developers can trim, collapse, and strip characters from strings

**Independent Test**: Import whitespace functions, pass strings with irregular whitespace, verify normalized output

**Dependencies**: Phase 1 only (does NOT depend on Phase 2 or US1)

### Tests for User Story 2

- [x] T010 [P] [US2] Write whitespace tests in packages/string-utils/__tests__/whitespace.test.ts covering: `collapseWhitespace("  hello    world  ")` → `"hello world"`, `collapseWhitespace("hello\t\n  world")` → `"hello world"`, `collapseWhitespace("  ")` → `""`, `collapseWhitespace("")` → `""`. `stripChars("hello world!", "!")` → `"hello world"`, `stripChars("a.b.c", ".")` → `"abc"`, `stripChars("hello", "")` → `"hello"`. Edge case: input with only whitespace returns empty string

### Implementation for User Story 2

- [x] T011 [P] [US2] Implement `collapseWhitespace` and `stripChars` in packages/string-utils/src/whitespace.ts per contracts/public-api.md. `collapseWhitespace`: replace `/\s+/g` with single space, then trim. `stripChars`: escape regex-special chars from `chars` string, build character class, replace globally
- [x] T012 [US2] Update barrel export in packages/string-utils/src/index.ts adding re-exports from `./whitespace.ts`

**Checkpoint**: All whitespace tests pass. US1 tests still pass (no regressions).

---

## Phase 5: User Story 3 — Truncation and Ellipsis (Priority: P2)

**Goal**: Developers can truncate strings at word boundaries with configurable suffix

**Independent Test**: Import truncate, pass long strings with a limit, verify output respects word boundaries and suffix

**Dependencies**: Phase 1 only (does NOT depend on Phase 2 or other stories)

### Tests for User Story 3

- [x] T013 [P] [US3] Write truncation tests in packages/string-utils/__tests__/truncate.test.ts covering: `truncate("The quick brown fox jumps over the lazy dog", 20)` → `"The quick brown fox…"`, `truncate("short", 20)` → `"short"` (no change), `truncate("hello world", 8, "...")` → `"hello..."`, `truncate("hello", 2)` → `"h…"` (character-level fallback), `truncate("hello", 1)` → `"…"` (limit ≤ suffix length). Edge cases: empty string returns empty, suffix length equals limit, single word exceeding limit falls back to character-level truncation

### Implementation for User Story 3

- [x] T014 [P] [US3] Implement `truncate(input: string, limit: number, suffix?: string): string` in packages/string-utils/src/truncate.ts per contracts/public-api.md. Default suffix `"…"`. If `input.length <= limit` return as-is. Find last space before `limit - suffix.length`, break there. If no space found (single long word), break at `limit - suffix.length` characters. If `limit <= suffix.length`, return suffix truncated to limit
- [x] T015 [US3] Update barrel export in packages/string-utils/src/index.ts adding re-export from `./truncate.ts`

**Checkpoint**: All truncation tests pass. US1 and US2 tests still pass.

---

## Phase 6: User Story 4 — Slug Generation (Priority: P3)

**Goal**: Developers can generate URL-safe slugs from arbitrary strings with transliteration

**Independent Test**: Import slugify, pass strings with special characters/accents/spaces, verify URL-safe slug output

**Dependencies**: Phase 1 only (uses direct string pipeline — does NOT depend on Phase 2 or splitWords)

### Tests for User Story 4

- [x] T016 [US4] Write slug tests in packages/string-utils/__tests__/slug.test.ts covering: `slugify("Hello World! This is a Test")` → `"hello-world-this-is-a-test"`, `slugify("Héllo & Wörld")` → `"hello-and-world"`, `slugify("  --multiple---hyphens-- ")` → `"multiple-hyphens"`, `slugify("")` → `""`, `slugify("   ")` → `""`. Edge cases: emoji stripped, consecutive hyphens collapsed, leading/trailing hyphens removed, `ß` → `ss`, `æ` → `ae`, `ø` → `o`

### Implementation for User Story 4

- [x] T017 [US4] Implement `slugify` in packages/string-utils/src/slug.ts per contracts/public-api.md. Include static transliteration map (`&` → `and`, `ß` → `ss`, `æ` → `ae`, `ø` → `o`, etc.) and NFKD normalization (see research.md Decision 5). Processing: apply static map replacements, normalize NFKD, strip combining marks (`/[\u0300-\u036f]/g`), lowercase, replace non-alphanumeric with hyphens, collapse consecutive hyphens, trim edge hyphens
- [x] T018 [US4] Update barrel export in packages/string-utils/src/index.ts adding re-export from `./slug.ts`

**Checkpoint**: All slug tests pass. All prior story tests still pass.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate quality gates and package integration

- [x] T019 Run full quality gates from repo root: `pnpm turbo build` (package compiles to dist/ with declarations), `pnpm turbo lint` (zero warnings), `prettier --check .` (formatting clean), `pnpm test` from packages/string-utils (all tests pass)
- [x] T020 [P] Validate quickstart.md: verify `turbo run build --filter=@repo/string-utils` produces dist/ with .js, .d.ts, and .js.map files; verify package.json exports resolve correctly for both barrel and per-module imports
- [x] T021 [P] Verify zero runtime dependencies in packages/string-utils/package.json (no `dependencies` field or empty) and `"sideEffects": false` is set for tree-shaking (SC-004, SC-005)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (needs package config to exist)
- **US1 Case (Phase 3)**: Depends on Phase 2 (uses `splitWords`)
- **US2 Whitespace (Phase 4)**: Depends on Phase 1 only (no shared internals)
- **US3 Truncation (Phase 5)**: Depends on Phase 1 only (no shared internals)
- **US4 Slug (Phase 6)**: Depends on Phase 1 only (direct string pipeline, does not use `splitWords`)
- **Polish (Phase 7)**: Depends on all story phases being complete

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 (words.ts) — no dependencies on other stories
- **US2 (P2)**: Independent — only needs Phase 1 setup
- **US3 (P2)**: Independent — only needs Phase 1 setup
- **US4 (P3)**: Independent — only needs Phase 1 setup (direct pipeline, no shared internals)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Implementation before barrel export update
- Story complete when all its tests pass

### Parallel Opportunities

- T002, T003, T004, T005 are parallel within Phase 1 (different files)
- After Phase 1: US2 (T010–T012), US3 (T013–T015), and US4 (T016–T018) can start immediately, in parallel with Phase 2 + US1
- After Phase 2: US1 (T007–T009) can begin
- T020 and T021 are parallel within Phase 7

---

## Parallel Example: Maximum Parallelism

```text
Phase 1: T001 → then T002 + T003 + T004 + T005 in parallel → pnpm install

After Phase 1 completes, four parallel tracks:

  Track A (needs Phase 2):     Track B (independent):     Track C (independent):     Track D (independent):
  T006 (words.ts)              T010 (whitespace tests)    T013 (truncate tests)      T016 (slug tests)
    ↓                          T011 (whitespace impl)     T014 (truncate impl)       T017 (slug impl)
  T007 (case tests)            T012 (barrel update)       T015 (barrel update)       T018 (barrel update)
  T008 (case impl)
  T009 (barrel update)

Phase 7: T019 → then T020 + T021 in parallel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (words.ts)
3. Complete Phase 3: US1 — Case Conversion
4. **STOP and VALIDATE**: All case tests pass, package builds, lint clean
5. Package is usable for case conversion immediately

### Incremental Delivery

1. Setup + Foundational → Package scaffolded
2. Add US1 (case) → Test → MVP delivers case conversion
3. Add US2 (whitespace) → Test → Adds string cleaning
4. Add US3 (truncation) → Test → Adds display truncation
5. Add US4 (slug) → Test → Adds URL-safe slugs
6. Polish → Full quality validation

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [US#] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- All function signatures defined in contracts/public-api.md
- Commit after each completed story phase
