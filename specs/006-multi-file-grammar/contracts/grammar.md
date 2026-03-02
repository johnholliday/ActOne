# Contract: ActOne Grammar — Document Entry Rule

**Date**: 2026-03-02
**Feature**: 006-multi-file-grammar
**Type**: Parser grammar contract

## Current Grammar (Entry Rule)

```langium
entry Story:
    'story' name=STRING '{'
        elements+=StoryElement*
    '}';

StoryElement:
    GenerateBlock | ThemeDef | CharacterDef | WorldDef
    | TimelineDef | SceneDef | PlotDef | InteractionDef;
```

**Constraint**: Every `.actone` file MUST contain a `story "Name" { ... }` block. Standalone component definitions are parse errors.

## New Grammar (Entry Rule)

```langium
entry Document:
    (story=Story)? (elements+=StoryElement)*;

Story:
    'story' name=STRING '{'
        elements+=StoryElement*
    '}';

StoryElement:
    GenerateBlock | ThemeDef | CharacterDef | WorldDef
    | TimelineDef | SceneDef | PlotDef | InteractionDef;
```

**Change summary**:
- `Document` becomes the entry rule (root AST type)
- `Story` becomes an optional child of `Document`
- `StoryElement` definitions are accepted both inside `Story` and at the top level of `Document`
- `StoryElement` union type is unchanged

## Valid File Forms

### Form 1: Story block only (backward compatible)

```actone
story "My Novel" {
    character Elena { ... }
    scene "Opening" { ... }
}
```

Parses as: `Document { story: Story { name: "My Novel", elements: [CharacterDef, SceneDef] }, elements: [] }`

### Form 2: Standalone components only

```actone
character Elena { ... }
character Marcus { ... }
```

Parses as: `Document { story: undefined, elements: [CharacterDef, CharacterDef] }`

### Form 3: Story block + standalone components

```actone
story "My Novel" {
    generate { ... }
}

character Elena { ... }
scene "Opening" { ... }
```

Parses as: `Document { story: Story { name: "My Novel", elements: [GenerateBlock] }, elements: [CharacterDef, SceneDef] }`

## Generated AST Types (Expected)

After running Langium code generator, the following types are expected in `src/generated/ast.ts`:

```typescript
export interface Document extends AstNode {
    readonly $type: 'Document';
    story?: Story;
    elements: Array<StoryElement>;
}

export interface Story extends AstNode {
    readonly $type: 'Story';
    name: string;
    elements: Array<StoryElement>;
}

// Type guards
export function isDocument(node: unknown): node is Document;
export function isStory(node: unknown): node is Story;
```

## Semantic Constraints (Enforced by Validator)

| Constraint | Scope | Error Message Pattern |
|------------|-------|----------------------|
| At most one `story` block | Cross-document | "Multiple story blocks found: also defined in {file}" |
| At most one `GenerateBlock` | Cross-document | "Multiple generate blocks found: also defined in {file}" |
| No duplicate named definitions of same type | Cross-document | "Duplicate {type} '{name}': also defined in {file}" |
| Self-referencing character relationships | Per-document | "Character cannot have a relationship with itself" |
| Trait/mood/weight ranges | Per-element | Existing range check messages |

## Backward Compatibility

- Files containing `story "Name" { ... }` with no standalone elements parse identically
- The `Story` node retains its structure (`name`, `elements`)
- `SerializedStory` output type is unchanged
- All downstream consumers receive the same data shape
