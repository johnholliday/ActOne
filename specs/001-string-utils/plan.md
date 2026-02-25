# Implementation Plan: Shared String Utilities Package

**Branch**: `001-string-utils` | **Date**: 2026-02-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-string-utils/spec.md`

## Summary

Create `@repo/string-utils`, a zero-dependency shared TypeScript library in `packages/string-utils/` providing pure string manipulation functions: case conversion (camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE), whitespace normalization, word-boundary-aware truncation, and URL-safe slug generation. All functions are pure (string → string), tree-shakeable via ESM named exports, and fully tested with Vitest.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode, ES2022 target)
**Primary Dependencies**: None at runtime; Vitest for testing (dev only)
**Storage**: N/A
**Testing**: Vitest (ESM-native, fast, first-class TypeScript support)
**Target Platform**: Node.js + bundlers (library consumed within monorepo)
**Project Type**: Library (shared monorepo package)
**Performance Goals**: N/A (string utility functions — no demanding throughput requirements)
**Constraints**: Zero runtime dependencies (SC-005); tree-shakeable ESM exports (FR-008)
**Scale/Scope**: ~5 source modules, ~4 test suites, <500 LOC

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --------- | ------ | ----- |
| I. TypeScript Strict + ESM | PASS | Pure TypeScript, strict mode, ESM with `"type": "module"`. Uses `moduleResolution: "Bundler"` per constitution (overriding base.json's `NodeNext`). |
| II. Monorepo Discipline | PASS | Lives in `packages/string-utils/`, independently buildable via `turbo run build --filter=@repo/string-utils` |
| III. Quality Gates | PASS | Will include build, lint, format, and test scripts. Vitest added for test coverage. |
| IV. Forward-Only Versioning | PASS | Zero runtime dependencies. Dev dependencies use latest versions. |
| V. Complete Solutions | PASS | Full implementation of all specified functions with comprehensive tests. |
| VI. Single Source of Truth | N/A | This package exports utility functions, not shared domain types. No types belong in `packages/shared`. |
| VII. Boundary Validation | N/A | No external inputs. All functions accept typed `string` parameters from TypeScript code. Zod validation not needed. |
| VIII. TS Computes, Claude Interprets | PASS | Purely deterministic computation in TypeScript. No LLM involvement. |

**Known discrepancy**: The constitution mandates `moduleResolution: "Bundler"` in every tsconfig.json, but `@repo/typescript-config/base.json` uses `"NodeNext"`. This package will override to `"Bundler"` per constitution. The base config discrepancy is a pre-existing issue outside the scope of this feature.

## Project Structure

### Documentation (this feature)

```text
specs/001-string-utils/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── public-api.md    # Exported function signatures
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
packages/string-utils/
├── package.json
├── tsconfig.json
├── eslint.config.mjs
├── vitest.config.ts
├── src/
│   ├── index.ts          # Barrel re-export of all public functions
│   ├── words.ts          # Internal: split any string into word array
│   ├── case.ts           # toCamelCase, toPascalCase, toSnakeCase, toKebabCase, toConstantCase
│   ├── whitespace.ts     # collapseWhitespace, stripChars
│   ├── truncate.ts       # truncate
│   └── slug.ts           # slugify
└── __tests__/
    ├── case.test.ts
    ├── whitespace.test.ts
    ├── truncate.test.ts
    └── slug.test.ts
```

**Structure Decision**: Follows monorepo convention — new package in `packages/`. Source in `src/`, tests in `__tests__/` (kept outside `src/` so `tsc` build excludes them from `dist/`). Each functional area gets its own module for tree-shaking. A shared `words.ts` module handles word-boundary splitting (used by case conversion) to avoid duplication. Slug generation uses a direct string pipeline (transliterate → NFKD → regex) rather than `splitWords`, since it operates on pre-transliterated text where word boundaries are simply non-alphanumeric characters.

## Complexity Tracking

No violations to justify. This is a single-package, zero-dependency library with no architectural complexity beyond simple modules.
