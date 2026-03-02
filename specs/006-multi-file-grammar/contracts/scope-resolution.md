# Contract: Cross-File Scope Resolution

**Date**: 2026-03-02
**Feature**: 006-multi-file-grammar
**Type**: Internal service contract

## Current Scope Resolution

```typescript
class ActOneScopeProvider extends DefaultScopeProvider {
  collectStories(node: AstNode): Story[]
  // merge/overlay: indexManager.allElements('Story') → Story[]
  // sequential: [findStory(node)]

  getCharacterScope(node: AstNode): Scope
  // Collects CharacterDef from collectStories()→ story.elements

  getLocationScope(node: AstNode): Scope
  // Collects LocationEntry from collectStories() → story.elements → WorldDef.properties

  getTimelineLayerScope(node: AstNode): Scope
  // Collects TimelineLayer from collectStories() → story.elements → TimelineDef.properties
}
```

**Limitation**: Only traverses `Story.elements`. Standalone `Document.elements` are invisible to scope resolution.

## New Scope Resolution

### collectElements (replaces collectStories)

```typescript
collectDocumentElements(node: AstNode): StoryElement[]
```

**Logic**:
1. **sequential mode**: Find current document's root, return `[...doc.story?.elements ?? [], ...doc.elements]`
2. **merge/overlay mode**: Use `indexManager.allElements('Document')` to find all Documents
   - For each `Document`: collect `doc.story?.elements ?? []` + `doc.elements`
   - Flatten all elements into a single array
   - For **overlay**: sort by file priority before flattening (higher priority last → overrides)

### Updated Scope Methods

```typescript
getCharacterScope(node: AstNode): Scope
// Collects CharacterDef from collectDocumentElements()

getLocationScope(node: AstNode): Scope
// Collects LocationEntry from collectDocumentElements() → WorldDef.properties

getTimelineLayerScope(node: AstNode): Scope
// Collects TimelineLayer from collectDocumentElements() → TimelineDef.properties
```

### findDocument (replaces findStory for current-file lookup)

```typescript
findDocument(node: AstNode): Document | undefined
// Walks up $container chain until finding Document root
```

## Composition Mode Semantics (UNCHANGED)

| Mode | Behavior |
|------|----------|
| `merge` | All elements from all documents visible. Duplicate names → validation error. |
| `overlay` | All elements visible, sorted by file priority. Higher priority overrides lower. |
| `sequential` | Current document's elements only. No cross-file visibility. |

The composition modes retain their existing semantics. The only change is that element collection now traverses both `Document.story.elements` and `Document.elements`.
