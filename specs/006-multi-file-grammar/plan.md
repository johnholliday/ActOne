# Implementation Plan: Multi-File Grammar with Automatic Consolidation

**Branch**: `006-multi-file-grammar` | **Date**: 2026-03-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-multi-file-grammar/spec.md`

## Summary

Extend the ActOne Langium grammar to accept component definitions (characters, worlds, scenes, etc.) at the top level without a wrapping `story` block, enabling writers to organize projects across multiple `.actone` files. All files are automatically discovered and consolidated into a single `SerializedStory` that drives all views and processing functions. The grammar entry rule changes from `Story` to `Document`, with `Story` becoming an optional child. Downstream serialization, scope resolution, validation, and web worker endpoints are updated to traverse both `Document.story.elements` and `Document.elements`.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode, ES2022 target, `moduleResolution: "Bundler"`)
**Primary Dependencies**: Langium 4.2.x (grammar, parser, scope provider, validator, code generator), SvelteKit 2.53.x, Svelte 5.53.x
**Storage**: Supabase PostgreSQL via Drizzle ORM (project files stored in Supabase storage)
**Testing**: Vitest 3.x, Langium `langium/test` test utilities
**Target Platform**: Browser (Web Worker for Langium LSP, SvelteKit studio app)
**Project Type**: DSL compiler + web application (monorepo: `packages/langium` + `apps/studio`)
**Performance Goals**: Re-parse and consolidate up to 20 `.actone` files with no perceptible delay beyond single-file editing
**Constraints**: Pure ESM, strict TypeScript, Langium-generated code must not be manually edited
**Scale/Scope**: Projects with 1-20 `.actone` files, grammar with ~876 lines, 8 component types

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript Strict Mode & Pure ESM | PASS | All code in TypeScript strict mode, pure ESM. No new languages. |
| II. Monorepo Discipline | PASS | Changes span `packages/langium` and `apps/studio` — both existing workspace packages. No new packages. |
| III. Quality Gates | PASS | Must pass `pnpm turbo build`, `pnpm turbo lint`, `prettier --check .` after changes. Langium regeneration is a build step. |
| IV. Forward-Only Versioning | PASS | No version changes. Using existing Langium 4.2.x APIs. |
| V. Complete Solutions | PASS | Grammar change + regeneration (not manual edit of generated code). Full scope provider, serializer, validator, and worker updates. No shortcuts. |
| VI. Single Source of Truth | PASS | `SerializedStory` remains in `packages/shared/src/types/ast.ts`. No duplicate type definitions. |
| VII. Boundary Validation | N/A | No new external data boundaries. Langium handles parsing; Zod validation on Supabase data is unchanged. |
| VIII. TS Computes; Claude Interprets | N/A | No LLM integration in this feature. |

**Post-Design Re-check**: All gates continue to pass. The `Document` type is Langium-generated (Principle V). The scope provider, serializer, and validator changes are in hand-written service files.

## Project Structure

### Documentation (this feature)

```text
specs/006-multi-file-grammar/
├── plan.md              # This file
├── research.md          # Phase 0 output — 6 decisions documented
├── data-model.md        # Phase 1 output — Document/Story/StoryElement entities
├── quickstart.md        # Phase 1 output — implementation overview
├── contracts/           # Phase 1 output — grammar, serialization, scope contracts
│   ├── grammar.md
│   ├── serialization.md
│   └── scope-resolution.md
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/langium/
├── src/
│   ├── actone.langium                      # MODIFY — entry rule: Story → Document
│   ├── generated/                          # REGENERATE — Langium codegen output
│   │   ├── ast.ts                          #   New Document type, isDocument guard
│   │   ├── grammar.ts                      #   Updated parser rules
│   │   └── module.ts                       #   Updated generated module
│   ├── serializer/
│   │   └── ast-serializer.ts               # MODIFY — add serializeDocument(), update serializeStory()
│   ├── services/
│   │   ├── actone-scope.ts                 # MODIFY — collectStories() → collectDocumentElements()
│   │   ├── actone-validator.ts             # MODIFY — add cross-document checks
│   │   └── actone-module.ts               # MODIFY — register Document-level validation
│   └── worker/
│       └── main-browser.ts                 # MODIFY — isStory→isDocument, add getMergedAst endpoint
└── langium-config.json                     # NO CHANGE

apps/studio/
└── src/lib/stores/
    └── editor.svelte.ts                    # MODIFY — call getMergedAst for consolidated view

packages/shared/
└── src/types/
    └── ast.ts                              # NO CHANGE — SerializedStory unchanged
```

**Structure Decision**: Changes span two existing workspace packages (`packages/langium` for grammar/services, `apps/studio` for store integration). No new packages or directories needed beyond the spec documentation.

## Complexity Tracking

No constitution violations. All changes use existing patterns and infrastructure.

## Implementation Phases

### Phase A: Grammar Change + Code Regeneration

1. Modify `packages/langium/src/actone.langium`:
   - Change entry rule from `entry Story` to `entry Document`
   - Add `Document` rule: `(story=Story)? (elements+=StoryElement)*`
   - Remove `entry` keyword from `Story` rule
2. Run `pnpm langium:generate` in `packages/langium` to regenerate `src/generated/`
3. Verify generated `Document` type and `isDocument` type guard exist

### Phase B: AST Serializer Update

1. Add `serializeDocument(doc: Document): SerializedStory` function
   - Collects elements from `doc.story?.elements ?? []` and `doc.elements`
   - Name from `doc.story?.name` (cleaned) or `""`
2. Keep `serializeStory()` as internal helper (called when `doc.story` exists)
3. Export `serializeDocument` as the primary serialization entry point

### Phase C: Scope Provider Update

1. Rename `collectStories()` → `collectDocumentElements()` (or similar)
2. In merge/overlay mode: use `indexManager.allElements('Document')` instead of `allElements('Story')`
3. For each Document: traverse both `doc.story?.elements` and `doc.elements`
4. Update `findStory()` → `findDocument()` to walk up to `Document` root
5. Update `getCharacterScope()`, `getLocationScope()`, `getTimelineLayerScope()` to use new collection method

### Phase D: Validator Update

1. Change `checkStory` registration from `Story` to `Document`
2. Add cross-document check: at most one `Story` block across all documents
3. Add cross-document check: at most one `GenerateBlock` across all documents (both in `Document.story.elements` and `Document.elements`)
4. Add cross-document check: no duplicate named definitions of the same type
5. Inject `IndexManager` or `LangiumDocuments` for cross-document access

### Phase E: Web Worker Update

1. Update `actone/getSerializedAst`: `isStory(root)` → `isDocument(root)`, call `serializeDocument()`
2. Update `actone/getAstForAllFiles`: same type guard change, call `serializeDocument()` per file
3. Add `actone/getMergedAst` endpoint: iterate all workspace documents, consolidate into single `SerializedStory`

### Phase F: Studio Integration

1. Update `apps/studio/src/lib/stores/editor.svelte.ts` to call `actone/getMergedAst` for consolidated view
2. Verify all diagram views, reading mode, and export functions receive correct consolidated data

### Phase G: Verification

1. `pnpm langium:generate` — types regenerated
2. `pnpm check-types` — no type errors
3. `pnpm build` — builds successfully
4. `pnpm lint` — no lint violations
5. Manual test: multi-file project with components across 3+ files
6. Manual test: existing single-file project unchanged behavior
7. Manual test: cross-file references resolve in diagrams
8. Manual test: duplicate definition produces clear error
