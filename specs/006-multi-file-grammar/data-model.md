# Data Model: Multi-File Grammar with Automatic Consolidation

**Date**: 2026-03-02
**Feature**: 006-multi-file-grammar

## Entity Overview

The grammar change introduces a new `Document` entity as the parse-level root, while preserving `Story` as an optional container within it. The serialized output type (`SerializedStory`) is unchanged — all downstream consumers continue to receive the same shape.

## Parse-Level Entities (Langium AST)

### Document (NEW — entry rule)

The root AST node for every `.actone` file. Replaces `Story` as the entry rule.

| Field | Type | Cardinality | Description |
|-------|------|-------------|-------------|
| `$type` | `'Document'` | 1 | Langium type discriminator |
| `story` | `Story` | 0..1 | Optional story block container |
| `elements` | `StoryElement[]` | 0..* | Standalone top-level component definitions |

**Invariants**:
- A file may contain a `story` block, standalone `elements`, or both
- At most one `story` block per project (validated cross-document)
- At most one `GenerateBlock` per project (validated cross-document)

**Relationships**:
- Contains 0..1 `Story`
- Contains 0..* `StoryElement` (standalone)

### Story (MODIFIED — no longer entry rule)

The named story container. Previously the entry rule; now a child of `Document`.

| Field | Type | Cardinality | Description |
|-------|------|-------------|-------------|
| `$type` | `'Story'` | 1 | Langium type discriminator |
| `name` | `STRING` | 1 | Story title (quoted string) |
| `elements` | `StoryElement[]` | 0..* | Components defined inside the story block |

**Invariants**:
- Must have a name (string literal)
- At most one `Story` across all `Document` nodes in a project
- Elements inside `Story` are treated identically to standalone `Document.elements` during consolidation

**Relationships**:
- Child of `Document.story`
- Contains 0..* `StoryElement`

### StoryElement (UNCHANGED)

Union type for all component definitions. No structural changes.

```
StoryElement = GenerateBlock | ThemeDef | CharacterDef | WorldDef
             | TimelineDef | SceneDef | PlotDef | InteractionDef
```

Each element type retains its existing fields, cross-references, and validation rules.

## Application-Level Entities (Serialized AST)

### SerializedStory (UNCHANGED)

The output of consolidation. Consumed by all downstream views, diagrams, and processing functions.

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | From the single `Story.name`, or project name if no story block |
| `elements` | `SerializedStoryElement[]` | Merged elements from all files |

**Consolidation rules**:
1. Elements from `Document.story.elements` and `Document.elements` within the same file are combined
2. Elements across all files in the project are combined
3. The `name` comes from the single `story` block; if absent, use project name or `""`
4. Order-independent — file order does not affect the result
5. Duplicate named definitions of the same type produce a validation error

## State Transitions

### Document Lifecycle

```
File Created/Opened
    → Parsed into Document AST node
    → Indexed by Langium workspace (elements discoverable via IndexManager)
    → Cross-references resolved via ScopeProvider (merge/overlay/sequential)
    → Validated (per-document + cross-document checks)
    → Serialized: Document → SerializedStory (consolidated with all other files)

File Modified
    → Re-parsed into updated Document AST
    → Workspace re-indexes affected document
    → Cross-references re-resolved across all documents
    → Re-validated
    → Re-serialized (full consolidation)

File Removed
    → Document removed from workspace
    → Cross-references in other files become unresolved
    → Re-validated (missing reference errors appear)
    → Re-serialized (removed elements no longer in consolidated output)
```

### Composition Mode Behavior

| Mode | Element Collection | Duplicate Handling | Use Case |
|------|-------------------|-------------------|----------|
| `merge` | All elements from all files | Validation error on duplicates | Default — multi-file projects |
| `overlay` | All elements, sorted by file priority | Higher priority overrides lower | Template/inheritance patterns |
| `sequential` | Current file only | N/A — no cross-file visibility | Single-file editing |

## Entity Relationship Diagram

```
Project (1)
  └── Document (1..*) ← one per .actone file
        ├── Story (0..1) ← at most one per project
        │     ├── name: STRING
        │     └── elements: StoryElement[] ← components inside story block
        └── elements: StoryElement[] ← standalone components
              ├── CharacterDef
              ├── WorldDef (contains LocationEntry[])
              ├── ThemeDef
              ├── TimelineDef (contains TimelineLayer[])
              ├── SceneDef (refs: CharacterDef, LocationEntry, TimelineLayer)
              ├── PlotDef (refs: SceneDef)
              ├── InteractionDef (refs: CharacterDef)
              └── GenerateBlock ← at most one per project

                        ↓ consolidation ↓

SerializedStory (1) ← consumed by all views/diagrams
  ├── name: string
  └── elements: SerializedStoryElement[]
```

## Cross-Reference Resolution

Cross-references resolve across file boundaries via the scope provider. The scope provider collects all elements from:
1. `Document.story.elements` (if story block exists)
2. `Document.elements` (standalone components)

For each document in the workspace, both sources are traversed. The resolution strategy depends on `compositionMode`:
- **merge**: All elements visible, duplicates flagged
- **overlay**: Priority-ordered, higher priority wins
- **sequential**: Current file only
