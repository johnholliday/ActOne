---
title: Troubleshooting
order: 2
description: Common problems and solutions for ActOne Studio.
---

This page covers the most common errors and warnings you will encounter while writing ActOne. Problems are organized by category. Each entry shows what the error message looks like, explains why it happens, and gives you a before-and-after fix.

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>The <strong>Problems panel</strong> at the bottom of ActOne Studio lists every error and warning in your project. Click any entry to jump directly to the offending line. Errors (red) must be resolved before you can export; warnings (yellow) are advisory.</p>
</div>

---

## Parse Errors

Parse errors mean ActOne could not read your file at all. The structure is broken — the parser cannot make sense of what you have written. Fix parse errors first, as they may cause every subsequent element to appear broken.

---

### Missing Quotes Around Names Containing Spaces

**Error message:**

```
Expected '}' but found 'Elena'.
```

or

```
Expecting: one of these possible Token sequences: [ID], [STRING]
```

**Cause:** Element names and string values that contain spaces must be wrapped in double quotes. A bare identifier like `Elena Vasquez` is not valid — the parser reads `Elena` as the name and then cannot understand `Vasquez`.

This affects the names of stories, characters, worlds, scenes, plots, timelines, themes, interactions, and any quoted string value.

**Fix:**

Before:

```
character Elena Vasquez {
  bio: A retired detective with a secret,
}
```

After:

```
character "Elena Vasquez" {
  bio: "A retired detective with a secret",
}
```

<div class="callout callout-warning">
<p class="callout-title">Warning</p>
<p>When a name is defined with quotes (e.g., <code>character "Elena Vasquez"</code>), every cross-reference to that character must also use the quoted form. Writing <code>Elena Vasquez</code> without quotes in a <code>participants</code> list will produce a reference error. See <a href="#cross-reference-errors">Reference Errors</a> below.</p>
</div>

---

### Unclosed Braces

**Error message:**

```
Unexpected end of input. Expected '}'.
```

or errors on every line that follows the unclosed block.

**Cause:** Every opening brace `{` must have a matching closing brace `}`. If you forget to close a `character`, `world`, `arc`, `personality`, or any other block, the parser reads everything after it as part of that block — and then reports confusing errors far from the actual problem.

**Fix:**

Before:

```
character "Mira" {
  bio: "A lighthouse keeper who speaks to storms.",
  arc: {
    start: "Isolated and self-sufficient.",
    end: "Surrendered to connection.",
  // missing closing brace for arc

scene "The Storm" {
  participants: ["Mira"]
}
```

After:

```
character "Mira" {
  bio: "A lighthouse keeper who speaks to storms.",
  arc: {
    start: "Isolated and self-sufficient.",
    end: "Surrendered to connection.",
  },
}

scene "The Storm" {
  participants: ["Mira"]
}
```

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>Use the editor's bracket-matching highlight to check that every <code>{</code> has a partner <code>}</code>. Clicking on any brace will highlight its matching pair. If no highlight appears, the brace is unmatched.</p>
</div>

---

### Misspelled Keywords

**Error message:**

```
Expecting: one of these possible Token sequences: ...
```

or

```
Unexpected token 'charcter'. Expected: 'character', 'world', 'scene', ...
```

**Cause:** ActOne keywords are case-sensitive and must be spelled exactly. Common misspellings include `charcter`, `chraracter`, `sceen`, `worl`, `genreate`, or using capital letters where lowercase is required (`Character` instead of `character`).

This also applies to property keywords: `bio`, `voice`, `goals`, `arc`, `participants`, `locations`, `rules`, and so on must be spelled correctly.

**Fix:**

Before:

```
charcter "Kael" {
  Bio: "A ghost broker who trades in lost memories.",
  Goals: [
    { goal: "Find a way back.", priority: Primary }
  ],
}
```

After:

```
character "Kael" {
  bio: "A ghost broker who trades in lost memories.",
  goals: [
    { goal: "Find a way back.", priority: Primary }
  ],
}
```

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>ActOne Studio provides keyword auto-complete. If you start typing <code>char</code> and press <strong>Ctrl+Space</strong>, the editor will offer <code>character</code> as a completion. Using auto-complete prevents nearly all misspelling errors. See <a href="#editor-issues">Editor Issues</a> if auto-complete is not appearing.</p>
</div>

---

### Trailing Comma on Enum Values

**Error message:**

```
Unexpected token ','. Expected: '}' or a property name.
```

**Cause:** Enum values — such as `nature`, `type`, `structure`, `priority`, `pacing`, and `tense` — take a single keyword, not a quoted string or a list. Adding a trailing comma directly after the enum keyword (before the next property) is fine, but using incorrect syntax around the value itself will cause a parse error.

**Fix:**

Before:

```
character "Ghost" {
  nature: "Concept",  // Concept must not be quoted
}

timeline "Lifetimes" {
  structure: linear,  // structure values are capitalized
}
```

After:

```
character "Ghost" {
  nature: Concept,
}

timeline "Lifetimes" {
  structure: Linear,
}
```

---

<h2 id="cross-reference-errors">Reference Errors</h2>

Reference errors occur when an element refers to something by name, but that name cannot be found in the project. The parser can read the file, but the cross-reference is broken.

---

### "Could Not Resolve Reference to Character"

**Error message:**

```
Could not resolve reference to CharacterDef named 'Elena'.
```

**Cause:** A `participants` list, `pov` property, `relationships` entry, or `style_mix` block references a character name that does not exist (or is spelled differently from its definition). This most commonly happens when:

- The character is defined in a different file that is not part of the project yet.
- The character name is quoted in the definition but unquoted in the reference (or vice versa).
- There is a typo in either the definition name or the reference.

**Fix:**

Before:

```
// characters.actone
character "Elena Vasquez" {
  bio: "A retired detective.",
}

// act-one.actone
scene "The Interrogation" {
  participants: [Elena]  // missing quotes — definition uses "Elena Vasquez"
}
```

After:

```
// act-one.actone
scene "The Interrogation" {
  participants: ["Elena Vasquez"]  // matches the definition exactly
}
```

<div class="callout callout-warning">
<p class="callout-title">Warning</p>
<p>Names are matched exactly as written, including case. <code>"elena vasquez"</code> and <code>"Elena Vasquez"</code> are treated as two different names. Always match the casing of your definition exactly.</p>
</div>

---

### "Could Not Resolve Reference to LocationEntry"

**Error message:**

```
Could not resolve reference to LocationEntry named 'Rooftop'.
```

**Cause:** A `scene` block's `location` property references a location name that does not exist in any `world` block, or uses the wrong syntax for a qualified reference.

When multiple worlds exist, an unqualified location name (`Rooftop`) is ambiguous. You must use the qualified form (`CityWorld.Rooftop`) to tell ActOne which world the location belongs to.

**Fix:**

Before:

```
world "CityWorld" {
  locations: [
    { name: "Rooftop", description: "A rain-slicked roof above the city." }
  ]
}

scene "The Confrontation" {
  location: Rooftop  // ambiguous when multiple worlds are present
}
```

After:

```
scene "The Confrontation" {
  location: CityWorld.Rooftop  // qualified reference
}
```

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>When your project has only one world, unqualified location names work fine. Add the world qualifier (<code>WorldName.LocationName</code>) as soon as you introduce a second world to avoid ambiguity.</p>
</div>

---

### Element Defined After First Reference (Forward Reference)

**Error message:**

```
Could not resolve reference to SceneDef named 'TheClimax'.
```

**Cause:** In multi-file projects, all files are resolved together so order between files does not matter. However, within a single file, some references (particularly `converges_at` in subplots, and `layer` references in scenes) may occasionally be sensitive to ordering in certain configurations.

The most reliable approach is to define elements before you reference them within the same file, or to move shared definitions to a dedicated file.

**Fix:**

Before (single file, scene references a layer not yet declared):

```
scene "The Memory" {
  layer: PastLife  // PastLife layer not defined yet
}

timeline "Lifetimes" {
  layers: [
    { name: PastLife, description: "A previous incarnation." }
  ]
}
```

After:

```
timeline "Lifetimes" {
  layers: [
    { name: PastLife, description: "A previous incarnation." }
  ]
}

scene "The Memory" {
  layer: PastLife
}
```

---

### Cross-File Reference Not Resolved

**Error message:**

```
Could not resolve reference to CharacterDef named 'Priya'.
```

(Even though `Priya` is defined in another file in the project.)

**Cause:** The file containing the definition is not saved, or it was added to the file system but not yet included in the project. ActOne Studio resolves cross-references across all files that belong to the open project.

**Fix:**

1. Ensure the file containing the definition (e.g., `characters.actone`) is saved.
2. Open the Projects screen and verify that all your `.actone` files appear under the project. If the file is missing, use **Add File** to include it.
3. If you just created the file, wait a moment for the language server to re-index the project.

<div class="callout callout-info">
<p class="callout-title">Multi-File Projects</p>
<p>See <a href="/user-guide/03-multi-file/">Multi-File Projects</a> for a full explanation of how cross-file references are resolved and how to organize large projects across multiple files.</p>
</div>

---

## Validation Warnings

Validation warnings do not prevent the file from being parsed — your code is syntactically correct — but something is semantically incomplete or inconsistent. Warnings appear in yellow in the Problems panel. They do not block export, but they may indicate that the AI runtime will have incomplete information.

---

### Missing Required Property

**Warning message:**

```
Character 'Kael' is missing a required property: 'voice'.
```

**Cause:** Certain properties are strongly recommended for complete story generation. The `voice` property on a character is the most important: without it, the AI runtime has no guidance on how the character speaks. Other commonly flagged missing properties include `bio`, `goals`, and `arc`.

<div class="callout callout-warning">
<p class="callout-title">Warning</p>
<p>A missing <code>voice</code> property means the AI runtime will generate generic, undifferentiated dialogue for that character. Even a single sentence of voice description will significantly improve output quality.</p>
</div>

**Fix:**

Before:

```
character "Kael" {
  bio: "A ghost broker who trades in lost memories.",
  nature: Human,
}
```

After:

```
character "Kael" {
  bio: "A ghost broker who trades in lost memories.",
  nature: Human,
  voice: "Kael speaks in careful, metered sentences — the voice of someone who
          has learned to say nothing by accident. He uses secondhand-shop metaphors
          and never names emotions directly.",
}
```

---

### Duplicate Element Name

**Warning message:**

```
Duplicate character name: 'Maya'. Names must be unique within the project.
```

**Cause:** Two elements of the same type share the same name across the project. In a multi-file project, if `characters.actone` defines a character named `"Maya"` and `act-two.actone` also defines a character named `"Maya"`, ActOne cannot determine which one a cross-reference means.

**Fix:**

Before:

```
// characters.actone
character "Maya" {
  role: "The protagonist's sister.",
}

// act-two.actone
character "Maya" {
  role: "A shopkeeper who appears in Act Two.",
}
```

After:

```
// characters.actone
character "Maya" {
  role: "The protagonist's sister.",
}

// act-two.actone
character "Maya Okonkwo" {
  role: "A shopkeeper who appears in Act Two.",
}
```

---

### Goal Without Priority

**Warning message:**

```
Character 'Priya' has a goal without a 'priority'. The runtime cannot weight motivations.
```

**Cause:** A goal entry in a character's `goals` list is missing the `priority` property. Without priority, all goals are treated as equal, and the runtime cannot determine which motivations should dominate behaviour in conflict situations.

**Fix:**

Before:

```
goals: [
  { goal: "Save Amara before the trial ends." },
  { goal: "Understand what the soma compound actually does." }
]
```

After:

```
goals: [
  { goal: "Save Amara before the trial ends.", priority: Primary, stakes: "Amara dies." },
  { goal: "Understand what the soma compound actually does.", priority: Secondary, stakes: "The truth dies with the Director." }
]
```

---

### World Without Rules

**Warning message:**

```
World 'NeonNostalgia' has no rules. Consider adding Physical or Social rules for generation guidance.
```

**Cause:** A `world` block has locations but no `rules` array. The runtime can generate within the world, but without governing rules, it may produce content that violates the world's internal logic or tone.

**Fix:** Add at least one `rules` entry describing a fundamental constraint of the world:

```
world "NeonNostalgia" {
  period: "2047, post-Severance",
  locations: [
    { name: "MemoryExchange", description: "A black market for emotional recordings." }
  ],
  rules: [
    { rule: "Memories can be bought and sold as commodified data.", category: Social },
    { rule: "Emotional recordings degrade with each playback, like cassette tapes.", category: Physical },
    { rule: "Selling your own memories without consent is a capital crime.", category: Social }
  ]
}
```

---

## Export Issues

---

### Export Produces an Empty or Nearly Empty File

**Cause:** Your project has a `story` block but all elements are defined outside it (at the document root level), or the project has no `story` block at all and your export settings require one.

In a single-file project, the `story` block is the expected top-level container. Elements placed outside it are valid for multi-file projects but may not be picked up by single-file export templates.

**Fix:** Ensure your elements are inside the `story` block for single-file projects:

Before:

```
story "Inventory of Ghosts" {
  // empty — elements are accidentally at root
}

character "Mara" { ... }
scene "The Exchange" { ... }
```

After:

```
story "Inventory of Ghosts" {
  character "Mara" { ... }
  scene "The Exchange" { ... }
}
```

<div class="callout callout-tip">
<p class="callout-title">Multi-File Note</p>
<p>In multi-file projects, having elements at the document root (outside any <code>story</code> block) is correct and intentional. Make sure your project is configured as multi-file in the Projects screen. See <a href="/user-guide/03-multi-file/">Multi-File Projects</a>.</p>
</div>

---

### Exported PDF Has Broken Character Encoding

**Cause:** Special characters (em-dashes `—`, curly quotes `"..."`, ellipses `…`) in your string values may not render correctly in all export targets if the source file is not saved with UTF-8 encoding.

**Fix:** ActOne Studio saves files as UTF-8 by default. If you pasted content from another application (such as Microsoft Word), the special characters may have been pasted as Windows-1252 characters. Check the status bar in the editor for the file encoding indicator. If it does not show UTF-8, use **File → Save with Encoding → UTF-8** to re-save.

---

### Exported DOCX Is Missing Scenes

**Cause:** Scenes that have a `participants` list referencing character names that fail validation may be skipped during export processing.

**Fix:** Resolve all reference errors in the Problems panel before exporting. Scenes with unresolved participant references are flagged with errors, not warnings — they must be fixed. See <a href="#cross-reference-errors">Reference Errors</a> above.

---

## Editor Issues

---

### Auto-Complete Not Appearing

**Symptom:** Pressing **Ctrl+Space** inside a block does nothing, or the completion list is empty.

**Cause (most common):** The file has a parse error earlier in the document. When the parser cannot determine the current structural context (because a brace is unclosed or a keyword is misspelled), it cannot offer context-sensitive completions.

**Fix:**

1. Check the Problems panel for parse errors.
2. Fix any unclosed braces or misspelled keywords above the cursor position.
3. Save the file. Auto-complete should return once the parser can read the file cleanly.

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>Auto-complete is context-aware. Inside a <code>character</code> block, it will offer character properties (<code>bio</code>, <code>voice</code>, <code>goals</code>, etc.). Inside an <code>arc</code> block, it will offer arc properties (<code>start</code>, <code>end</code>, <code>catalyst</code>, etc.). If completions seem wrong, check that you are inside the correct block.</p>
</div>

---

### Syntax Highlighting Not Appearing

**Symptom:** The file appears as plain unstyled text — no colours for keywords, strings, or comments.

**Cause:** ActOne Studio's language extension associates highlighting with `.actone` files. If the file was opened with a different extension (e.g., `.txt` or `.act`) or if the language mode was manually changed, highlighting will not apply.

**Fix:**

1. Check the language indicator in the bottom status bar of the editor. It should read **ActOne**.
2. If it reads something else (e.g., **Plain Text**), click the indicator and select **ActOne** from the language list.
3. If your file does not have the `.actone` extension, rename it. ActOne Studio automatically applies the language mode to all `.actone` files.

---

### Hover Tooltips Not Showing Type Information

**Symptom:** Hovering over a keyword or property name shows nothing, or shows only a generic placeholder.

**Cause:** The language server may still be indexing the project, especially immediately after opening a large multi-file project or after adding new files.

**Fix:**

1. Wait a few seconds for the language server to finish indexing. A spinner may appear in the status bar while indexing is in progress.
2. If tooltips still do not appear after 30 seconds, try closing and reopening the file.
3. If the problem persists, use **Developer → Restart Language Server** from the menu bar to force a restart.

---

### Red Squiggles on Valid Code After Renaming a File

**Symptom:** After renaming a `.actone` file, cross-references that previously worked now show reference errors.

**Cause:** The language server caches file paths for cross-reference resolution. When a file is renamed outside the editor (e.g., via the file system), the server may not detect the change immediately.

**Fix:**

1. Close and reopen the project in ActOne Studio to force a full re-index.
2. Alternatively, make a small edit (add a space, then delete it) in any file in the project and save — this triggers a re-index.

<div class="callout callout-danger">
<p class="callout-title">Danger</p>
<p>Do not rename <code>.actone</code> files while the project is open in ActOne Studio. Always close the project first, rename the file via the Projects screen (which updates all references automatically), and then reopen the project. Renaming files externally can leave cross-references pointing to the old filename with no automatic fix.</p>
</div>

---

## Still Stuck?

If your problem is not covered here, try the following:

1. **Check the Problems panel** — it lists every error and warning with line numbers and descriptions.
2. **Read the error message carefully** — ActOne error messages name the exact element type and name that caused the problem.
3. **Simplify and rebuild** — comment out blocks one at a time to isolate which element is causing the error.
4. **Consult the Language Reference** — the [Syntax Reference](/language-reference/02-syntax-reference/) and [Element Reference](/language-reference/03-element-reference/) show the exact valid syntax for every construct.
5. **Review the Glossary** — if a term in an error message is unfamiliar, look it up in the [Glossary](/reference/glossary/).

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>The most reliable way to start a new story without parse errors is to use one of the built-in project templates. Templates provide valid, pre-structured scaffolding that you can fill in without worrying about braces or keyword spelling. See <a href="/user-guide/01-projects/">Projects</a> for how to create a project from a template.</p>
</div>
