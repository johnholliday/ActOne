# Research: Multi-File Grammar with Automatic Consolidation

**Date**: 2026-03-02
**Feature**: 006-multi-file-grammar

## Decision 1: Grammar Entry Rule Change

**Decision**: Introduce a new `Document` entry rule that optionally contains a `Story` block and/or standalone `StoryElement` definitions.

**Rationale**: The current entry rule is `entry Story: 'story' name=STRING '{' elements+=StoryElement* '}'`. This means every `.actone` file **must** contain a `story` block — a file with just `character Elena { ... }` would be a parse error. To support standalone component files, the entry rule must change to accept both forms.

The new grammar structure:
```langium
entry Document:
    (story=Story)? (elements+=StoryElement)*;

Story:
    'story' name=STRING '{'
        elements+=StoryElement*
    '}';
```

This preserves backward compatibility: existing files with `story "Name" { ... }` match as `Document` with `story` populated. New files with standalone components match as `Document` with `elements` populated.

**Alternatives considered**:
- **Multiple entry rules**: Langium 4.x does not support alternative entry rules. Rejected.
- **Story made optional at same level**: Could make `'story' name=STRING '{' ... '}'` optional within Story, but this conflates the container with standalone mode. Rejected for clarity.
- **Post-parse composition only (no grammar change)**: Would require every file to have a `story` block, even component-only files. Rejected because it contradicts the feature requirement.

## Decision 2: AST Root Type Change

**Decision**: The Langium-generated AST root type changes from `Story` to `Document`. All downstream consumers (serializer, scope provider, validator, web worker, studio AST store) must be updated.

**Rationale**: The entry rule determines the root AST type. Changing from `entry Story` to `entry Document` means `doc.parseResult.value` is now a `Document`, not a `Story`. This is an unavoidable consequence of the grammar change.

**Impact areas**:
1. `ast-serializer.ts` — `serializeStory()` must become `serializeDocument()` that collects elements from both `doc.story?.elements` and `doc.elements`
2. `actone-scope.ts` — `collectStories()` must traverse `Document` nodes, collecting elements from `doc.story?.elements` and `doc.elements`
3. `actone-validator.ts` — checks registered on `Story` must be updated to work with `Document`
4. `main-browser.ts` — `isStory(root)` type guard becomes `isDocument(root)`
5. `packages/shared/src/types/ast.ts` — `SerializedStory` type is unaffected (it represents the consolidated output, not the parse structure)

**Alternatives considered**:
- **Keep `SerializedStory` as the output type**: Yes — the serialized output still represents a single story's worth of content. The `Document` is a parse-level concept; `SerializedStory` is the application-level concept. This avoids cascading changes to all diagram transformers and views.

## Decision 3: Cross-File Scope Resolution Approach

**Decision**: Extend the existing `ActOneScopeProvider` (merge mode) to collect elements from `Document.elements` in addition to `Document.story.elements`.

**Rationale**: The scope provider already supports merge mode with cross-file reference resolution via `indexManager.allElements()`. The change is to also traverse standalone elements that aren't inside a `Story` block. The `collectStories()` method becomes `collectElements()` — gathering all `StoryElement` instances from all documents regardless of whether they're inside a `Story` or standalone.

**Alternatives considered**:
- **New composition mode**: Unnecessary — merge mode already does what's needed. The change is within the existing mode.
- **Custom index provider**: Overkill — the default `AstNodeDescriptionProvider` and `IndexManager` already index all AST nodes by type.

## Decision 4: Consolidation Strategy

**Decision**: The serializer produces a single `SerializedStory` by merging elements from the `Story` block (if present) with all standalone top-level elements across all files. The `Story.name` comes from the single permitted `story` block; if no `story` block exists, a default name is used.

**Rationale**: All downstream consumers (diagram transformers, export, reading mode) expect `SerializedStory`. Producing a single merged output means zero changes to any view or processing function.

**Merge rules**:
- Elements from `Document.story.elements` and `Document.elements` within the same file are combined
- Elements across files are combined (merge mode)
- The story name comes from the single `story` block; if absent, use project name or empty string
- Duplicate name detection is enforced by the validator

**Alternatives considered**:
- **Return array of per-file ASTs**: This is the current `getAstForAllFiles` behavior. It pushes merge responsibility to every consumer. Rejected.
- **New merged AST type**: Unnecessary complexity — `SerializedStory` already has the right shape.

## Decision 5: Validation Extensions

**Decision**: Extend `ActOneValidator` with cross-document checks:
1. At most one `story` block across all documents
2. At most one `generate` block across all documents (and standalone)
3. No duplicate named definitions of the same type across documents
4. Existing single-document checks continue to work

**Rationale**: The validator already runs per-document. Cross-document validation requires accessing the `IndexManager` to check for duplicates. Langium's validation infrastructure supports this via service injection.

**Alternatives considered**:
- **Validate only during serialization**: Too late — writers need immediate feedback in the editor.
- **Custom validation pass**: Unnecessary — Langium's built-in validation pipeline supports cross-document checks.

## Decision 6: Langium Generated Code Handling

**Decision**: Modify the `.langium` grammar file and re-run Langium's code generator to produce updated generated types. The generated files in `src/generated/` will be regenerated — NOT manually edited (per Constitution Principle V).

**Rationale**: Langium generates TypeScript types, AST type guards (`isDocument`, `isStory`), and parser from the grammar. Changing the entry rule from `Story` to `Document` requires regeneration. The generated code in `src/generated/` is build output and must not be manually edited.

## Existing Infrastructure Summary

| Component | Current Status | Change Needed |
|-----------|---------------|---------------|
| Grammar entry rule | `entry Story` — requires `story` block | Change to `entry Document` with optional `Story` |
| Scope provider (merge mode) | Collects from `Story.elements` | Also collect from `Document.elements` |
| Scope provider (overlay mode) | Priority-based, collects from `Story.elements` | Also collect from `Document.elements` |
| AST serializer | `serializeStory(story)` | New `serializeDocument(doc)` that merges elements |
| Web worker `getSerializedAst` | Checks `isStory(root)` | Check `isDocument(root)` |
| Web worker `getAstForAllFiles` | Returns per-file `SerializedStory[]` | Add new merged endpoint or modify existing |
| Validator | Story-scoped checks | Add cross-document duplicate/uniqueness checks |
| Shared types | `SerializedStory` | No change (output type unchanged) |
| Diagram transformers | Consume `SerializedStory` | No change |
| Studio AST store | Consumes `SerializedStory` | No change |
