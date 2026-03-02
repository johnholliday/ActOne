# Quickstart: Multi-File Grammar with Automatic Consolidation

**Date**: 2026-03-02
**Feature**: 006-multi-file-grammar

## What This Feature Does

Extends the ActOne grammar so that component definitions (characters, worlds, scenes, plots, timelines, themes, interactions, generate blocks) can be placed at the top level of a `.actone` file without a wrapping `story` block. All `.actone` files in a project are automatically discovered, parsed, and consolidated into a single AST — no import or include statements needed.

## How It Works

### Before (single-file only)

Every `.actone` file must contain a `story` block:

```actone
story "My Novel" {
    character Elena { ... }
    character Marcus { ... }
    world "Victorian London" { ... }
    scene "Opening" { ... }
}
```

### After (multi-file organization)

Writers can split components across files:

**main.actone**
```actone
story "My Novel" {
    generate {
        genre: "literary fiction"
        tone: ["atmospheric", "intimate"]
    }
}
```

**characters.actone**
```actone
character Elena {
    bio: "A restless painter seeking meaning"
    role: protagonist
}

character Marcus {
    bio: "Elena's pragmatic brother"
    role: supporting
}
```

**world.actone**
```actone
world "Victorian London" {
    period: "1888"
    locations {
        location "The Studio" { ... }
        location "Whitechapel" { ... }
    }
}
```

**scenes.actone**
```actone
scene "Opening" {
    location: "The Studio"
    participants: [Elena]
    objective: "Establish Elena's isolation"
}
```

All four files are automatically consolidated. Every view — character network, world map, timeline, interaction sequence — sees the merged result as if everything were in a single file.

## Key Implementation Areas

### 1. Grammar Change (`packages/langium/src/actone.langium`)

Change the entry rule from `Story` to `Document`:

```langium
entry Document:
    (story=Story)? (elements+=StoryElement)*;

Story:
    'story' name=STRING '{'
        elements+=StoryElement*
    '}';
```

Then regenerate Langium types via `pnpm langium:generate` (in `packages/langium`).

### 2. AST Serializer (`packages/langium/src/serializer/ast-serializer.ts`)

Add `serializeDocument()` that collects elements from both `doc.story?.elements` and `doc.elements`, producing a single `SerializedStory`. The output type is unchanged.

### 3. Scope Provider (`packages/langium/src/services/actone-scope.ts`)

Update `collectStories()` → `collectDocumentElements()` to also traverse `Document.elements` in addition to `Document.story.elements`.

### 4. Web Worker (`packages/langium/src/worker/main-browser.ts`)

- Change type guard from `isStory(root)` to `isDocument(root)`
- Add `actone/getMergedAst` endpoint returning a single consolidated `SerializedStory`
- Update existing endpoints to use `serializeDocument()`

### 5. Validator (`packages/langium/src/services/actone-validator.ts`)

Add cross-document checks:
- At most one `story` block across all documents
- At most one `generate` block across all documents
- No duplicate named definitions of the same type

### 6. Studio Integration (`apps/studio/src/lib/stores/editor.svelte.ts`)

Update the AST store to call the new `actone/getMergedAst` endpoint instead of `getAstForAllFiles` + manual composition.

## Verification Steps

1. `pnpm langium:generate` — regenerates types from updated grammar (in `packages/langium`)
2. `pnpm check-types` — no type errors across all packages
3. `pnpm build` — builds successfully
4. `pnpm lint` — no lint violations
5. Manual test: create a multi-file project and verify all views render correctly
6. Manual test: verify existing single-file projects work with zero changes
