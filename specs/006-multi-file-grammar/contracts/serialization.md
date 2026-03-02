# Contract: AST Serialization — Document to SerializedStory

**Date**: 2026-03-02
**Feature**: 006-multi-file-grammar
**Type**: Internal API contract

## Current Serialization

```typescript
// Single file serialization
function serializeStory(story: Story): SerializedStory
// Returns: { name: story.name, elements: story.elements.map(serializeElement) }

// Multi-file collection (no merging)
handler 'actone/getAstForAllFiles':
  returns { stories: Array<{ uri: string, ast: SerializedStory | null, valid: boolean }> }
```

**Limitation**: Each file is serialized independently. The caller (studio AST store) must compose the array.

## New Serialization

### Per-Document Serialization

```typescript
function serializeDocument(doc: Document): SerializedStory
```

**Merge logic**:
1. Collect elements from `doc.story?.elements ?? []`
2. Collect elements from `doc.elements`
3. Concatenate both arrays
4. Map each through `serializeElement()` (unchanged)
5. Name: `doc.story?.name` (cleaned) or `""`

**Returns**: `SerializedStory` — same output type as before.

### Consolidated Multi-File Serialization

```typescript
handler 'actone/getMergedAst':
  returns { ast: SerializedStory | null, valid: boolean, errors: number }
```

**Merge logic**:
1. Iterate all `LangiumDocument` instances in workspace
2. For each document where `isDocument(root)`:
   - Collect elements from `root.story?.elements ?? []`
   - Collect elements from `root.elements`
3. Concatenate all elements across all documents
4. Map each through `serializeElement()`
5. Name: from the single `story` block found across all documents (or `""` if none)
6. Return single `SerializedStory`

### Existing Endpoint Updates

```typescript
handler 'actone/getSerializedAst':
  // Type guard changes: isStory(root) → isDocument(root)
  // Calls serializeDocument() instead of serializeStory()
  returns { ast: SerializedStory | null, valid: boolean, errors: number }

handler 'actone/getAstForAllFiles':
  // Type guard changes: isStory(root) → isDocument(root)
  // Calls serializeDocument() per file
  returns { stories: Array<{ uri: string, ast: SerializedStory | null, valid: boolean }> }
```

## Output Type (UNCHANGED)

```typescript
export interface SerializedStory {
  name: string;
  elements: SerializedStoryElement[];
}
```

All downstream consumers — diagram transformers, export functions, reading mode, AST store — continue to receive this exact type with no changes required.
