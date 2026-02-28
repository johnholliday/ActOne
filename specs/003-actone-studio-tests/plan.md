# Implementation Plan: ActOne Studio Test Suite

**Branch**: `003-actone-studio-tests` | **Date**: 2026-02-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-actone-studio-tests/spec.md`

## Summary

Implement a comprehensive test suite for ActOne Studio covering unit tests (Langium grammar, shared packages, business logic), integration tests (API endpoints, worker protocol, pipelines), performance benchmarks, and browser-based E2E tests. Uses Vitest 3.x with the SvelteKit Vite plugin for unit/integration tests, Langium 4.x `langium/test` utilities for grammar tests, and Playwright for E2E tests. Tests span three workspace packages (`@repo/langium`, `@repo/shared`, `apps/studio`) and integrate with Turborepo via a `test` task.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode, ES2022 target, `moduleResolution: "Bundler"`)
**Primary Dependencies**: Vitest 3.x (already installed), Playwright (to be added), Langium 4.x `langium/test`, SvelteKit Vite plugin
**Storage**: N/A (tests use mocks for database and storage; no persistent test data)
**Testing**: Vitest 3.x (unit/integration/performance), Playwright (E2E)
**Target Platform**: Node.js (unit/integration/performance), Chromium/Firefox/WebKit (E2E)
**Project Type**: Test suite (monorepo-wide, spanning 3 workspace packages)
**Performance Goals**: Validation <200ms, diagram transformation <2s, full suite (excluding E2E) <2 minutes
**Constraints**: Tests must run in CI without live external services; all external dependencies mocked
**Scale/Scope**: ~283 test cases across 7 test phases, covering 49 functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript Strict Mode & Pure ESM | PASS | All test files are TypeScript with strict mode. Vitest configs use ESM. No CommonJS. |
| II. Monorepo Discipline | PASS | Tests are distributed across workspace packages (`packages/langium`, `packages/shared`, `apps/studio`). Each package has its own vitest config. `pnpm test` runs all via Turborepo. |
| III. Quality Gates (NON-NEGOTIABLE) | PASS | Test task added to `turbo.json`. `pnpm test` integrates with CI. Build/lint/format gates unaffected. |
| IV. Forward-Only Versioning | PASS | Uses Vitest 3.x (already installed), Langium 4.x (current), Playwright latest. No downgrades. |
| V. Complete Solutions | PASS | Full test coverage across all 7 user stories and 49 FRs. No shortcuts — every module tested with appropriate strategy (pure function fixtures vs side-effect mocks). |
| VI. Single Source of Truth | PASS | Tests consume types from `@repo/shared`. No duplicate type definitions in test code. Factory functions produce instances of canonical types. |
| VII. Boundary Validation | PASS | API integration tests verify Zod validation at endpoint boundaries. Tests assert that invalid inputs are rejected with appropriate error responses. |
| VIII. TypeScript Computes; Claude Interprets | PASS | AI backend mocks return deterministic data. Tests verify that LLM output passes through validation/transformation layers. No raw LLM output in test assertions. |

**Gate result**: All 8 principles PASS. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/003-actone-studio-tests/
├── plan.md              # This file
├── research.md          # Phase 0: Technology decisions
├── data-model.md        # Phase 1: Test fixtures and mock shapes
├── quickstart.md        # Phase 1: How to run the test suite
├── spec.md              # Feature specification
└── checklists/
    └── requirements.md  # Specification quality checklist
```

No `contracts/` directory — this feature consumes existing contracts from `specs/002-actone-studio/contracts/` (API endpoints, worker protocol) but does not define new external interfaces.

### Source Code (repository root)

```text
# Langium grammar tests
packages/langium/
├── vitest.config.ts                    # Vitest config (environment: node)
└── tests/
    ├── fixtures/
    │   ├── minimal.actone              # 1 character, 1 scene
    │   ├── full-story.actone           # All 8 element types, all properties
    │   ├── invalid-values.actone       # Out-of-range values for validator tests
    │   └── large-project/              # 50 characters, 100 scenes, 10 files
    │       ├── entry.actone
    │       ├── characters-01.actone
    │       └── ...
    ├── parser.test.ts                  # Parser acceptance for all element types
    ├── validator.test.ts               # Validation rules, boundary values
    ├── scope.test.ts                   # Cross-reference resolution
    ├── completion.test.ts              # Completion suggestions
    ├── hover.test.ts                   # Hover tooltip content
    ├── formatter.test.ts              # Formatting rules, idempotency
    ├── semantic-tokens.test.ts         # Token classification
    └── symbols.test.ts                # Document symbol hierarchy

# Shared package tests
packages/shared/
├── vitest.config.ts                    # Vitest config (environment: node)
└── tests/
    └── types.test.ts                   # Type export smoke tests

# Studio application tests
apps/studio/
├── vitest.config.ts                    # Vitest config with sveltekit() plugin
└── tests/
    ├── fixtures/
    │   ├── factories.ts                # createTestStory(), createTestCharacter(), etc.
    │   └── mocks/
    │       ├── db.ts                   # Mock Drizzle chainable API
    │       ├── supabase.ts             # Mock Supabase client
    │       ├── ai-backends.ts          # Mock text/image backends
    │       └── setup.ts               # Shared vi.mock() setup
    ├── unit/
    │   ├── lifecycle.test.ts           # State machine transitions
    │   ├── analytics.test.ts           # Metrics extraction
    │   ├── composition.test.ts         # Composition modes
    │   ├── stable-refs.test.ts         # Content-addressable IDs
    │   ├── diagram-transformers.test.ts # All 5 diagram types
    │   ├── context-assembler.test.ts   # Priority-based truncation
    │   ├── prompt-builder.test.ts      # Prompt format variations
    │   ├── cost-estimator.test.ts      # Token/USD estimates
    │   ├── draft-manager.test.ts       # Draft versioning, status transitions
    │   ├── manuscript-assembler.test.ts # Front/chapter/back matter
    │   ├── epub-generator.test.ts      # EPUB file structure
    │   ├── docx-generator.test.ts      # DOCX output
    │   ├── pdf-generator.test.ts       # PDF output
    │   ├── panel-generator.test.ts     # Panel layouts, camera direction
    │   └── lettering-system.test.ts    # Bubble styles
    ├── integration/
    │   ├── api/
    │   │   ├── projects.test.ts        # Project CRUD endpoints
    │   │   ├── lifecycle.test.ts       # Lifecycle transition endpoints
    │   │   ├── ai-text.test.ts         # Text generation endpoints
    │   │   ├── ai-image.test.ts        # Image generation endpoints
    │   │   ├── drafts.test.ts          # Draft management endpoints
    │   │   ├── analytics.test.ts       # Analytics endpoints
    │   │   └── publishing.test.ts      # Publishing endpoints
    │   ├── worker-protocol.test.ts     # LSP lifecycle, custom extensions
    │   └── pipelines/
    │       ├── ast-to-diagram.test.ts  # Parse → serialize → transform → layout
    │       ├── diagram-to-source.test.ts # Diagram op → text edit → re-parse
    │       ├── generation-to-draft.test.ts # Context → prompt → generate → store
    │       └── draft-to-publish.test.ts   # Assemble → generate format
    ├── performance/
    │   ├── validation-latency.test.ts  # <200ms standard, <500ms large
    │   └── diagram-latency.test.ts     # <2s per diagram type
    └── e2e/
        ├── playwright.config.ts        # Playwright configuration
        ├── auth.spec.ts                # Authentication flow
        ├── editor.spec.ts              # Editor workflows
        ├── diagrams.spec.ts            # Diagram views
        ├── generation.spec.ts          # AI generation flow
        ├── analytics.spec.ts           # Analytics views
        ├── publishing.spec.ts          # Publishing flow
        └── shell.spec.ts              # Application shell

# Root configuration
turbo.json                              # Add "test" and "test:e2e" tasks
package.json                            # Add "test" script
```

**Structure Decision**: Tests are distributed across the three workspace packages following monorepo discipline. Each package has its own `vitest.config.ts`. The studio app uses the existing `tests/unit/`, `tests/integration/`, `tests/e2e/` directory structure. Grammar tests live in `packages/langium/tests/` using Langium's `langium/test` utilities. Playwright E2E tests are co-located in `apps/studio/tests/e2e/` with their own config.

## Complexity Tracking

> No Constitution Check violations. No complexity justifications needed.
