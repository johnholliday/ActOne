---
title: Multi-File Projects
order: 3
description: Working with multi-file projects — composition modes, cross-file references, and file management.
---

As your story grows, a single `.actone` file can become long and difficult to navigate. Multi-file projects let you split your definitions across as many files as you like, with ActOne Studio automatically combining them into a single unified story view.

## How Multi-File Projects Work

When a project contains more than one `.actone` file, ActOne Studio parses all files and consolidates them into a single logical story. This consolidated view — called the **merged AST** — is what drives all panels: the Outline, the Diagram, the Problems list, and the Export output.

There are no `import`, `include`, or `require` statements in ActOne. You simply add files to your project and ActOne Studio discovers and processes them all automatically. A character defined in `characters.actone` is immediately available for cross-reference in `scenes.actone` without any extra wiring.

<div class="callout callout-info">
<div class="callout-title">What is the merged AST?</div>
<p>AST stands for Abstract Syntax Tree — the structured representation of your story that ActOne Studio builds from your source files. In a multi-file project, each file produces its own partial AST, and these are combined into one merged AST. All panels, diagrams, and exports operate on this merged result, so you always see your whole story in every view, regardless of which file is active in the editor.</p>
</div>

## Composition Modes

The **composition mode** controls how ActOne Studio combines multiple files when names conflict or overlap. You set the composition mode in **Project Settings** (Project menu → Project Settings).

| Mode           | Behavior                                                              | Best for                                    |
| -------------- | --------------------------------------------------------------------- | ------------------------------------------- |
| **Merge**      | All files share one namespace. Duplicate names are validation errors. | Most stories — the safe default             |
| **Overlay**    | Later files override earlier definitions with the same name.          | Templates and variations on a base story    |
| **Sequential** | Files are treated as independent segments with separate namespaces.   | Episodic content with distinct installments |

### Merge Mode

In **Merge** mode, every definition across all files is treated as part of one shared namespace. A `character` named `Elena` can only be defined once — if two files both define `character Elena`, the validator reports a duplicate-definition error identifying both files.

This is the correct mode for the vast majority of projects. It models a single coherent story world where every character, world, and scene is unique.

```
Project (merge mode)
├── main.actone        → story "My Novel" { generate { ... } }
├── characters.actone  → character Elena { ... }
│                         character Marcus { ... }
└── world.actone       → world NeonNostalgia { ... }

Result: one story with all definitions available everywhere
```

<div class="callout callout-tip">
<div class="callout-title">Tip: Use Merge mode unless you have a specific reason not to</div>
<p>Merge mode catches naming conflicts as errors rather than silently overwriting definitions. It is the safest and most predictable choice for first-time multi-file projects.</p>
</div>

### Overlay Mode

In **Overlay** mode, when two files define the same element name, the definition from the file with higher priority wins. File priority is determined by the order of files in the project's file list — files listed later have higher priority.

Overlay is useful when you have a shared base story file and want to layer variations on top without modifying the base. For example:

```
Project (overlay mode)
├── base-characters.actone   → character Elena { voice: "..base voice.." }
└── revision-characters.actone → character Elena { voice: "..updated voice.." }

Result: Elena uses the voice from revision-characters.actone
```

<div class="callout callout-warning">
<div class="callout-title">Overlay mode silently replaces definitions</div>
<p>Unlike Merge mode, Overlay mode does not report a validation error when two files define the same name. The later definition silently replaces the earlier one. If you have a typo in a name that accidentally matches an existing definition, you will not receive a warning. Use Merge mode if you want the validator to catch all naming conflicts.</p>
</div>

### Sequential Mode

In **Sequential** mode, each file is treated as an independent segment with its own separate namespace. Cross-references between files are not resolved — a scene in `episode-2.actone` cannot reference a character defined in `episode-1.actone`.

Sequential is designed for episodic or serialized content where each file represents a self-contained installment with no shared element names required. Each episode can be processed independently.

```
Project (sequential mode)
├── episode-1.actone  → own namespace (characters, scenes, etc.)
└── episode-2.actone  → own namespace (same character names allowed)

Result: two independent story segments processed in file-list order
```

### Composition Mode Comparison

| Capability                           | Merge | Overlay         | Sequential               |
| ------------------------------------ | ----- | --------------- | ------------------------ |
| Cross-file references resolve        | Yes   | Yes             | No                       |
| Duplicate names are errors           | Yes   | No (later wins) | No (separate namespaces) |
| Shared character pool                | Yes   | Yes             | No                       |
| Good for single coherent story       | Yes   | Yes             | No                       |
| Good for episodic/serialized content | No    | No              | Yes                      |
| Good for story variations/drafts     | No    | Yes             | No                       |

## Cross-File References

In **Merge** and **Overlay** modes, any element defined in any project file can be referenced from any other file. You write the reference exactly as you would in a single-file project — using the element's name without any file prefix or qualifier.

### Example: Characters in Scenes

Suppose your project has two files:

**characters.actone**

```actone
character Elena {
  nature: Human,
  bio: "A forensic linguist.",
  voice: "Precise and searching.",
}

character Marcus {
  nature: Human,
  bio: "Elena's contact inside the Bureau.",
}
```

**scenes.actone**

```actone
scene FirstMeeting {
  type: Dialogue,
  participants: [Elena, Marcus],
  objective: "Elena makes contact and establishes trust.",
}
```

The reference `[Elena, Marcus]` in `scenes.actone` resolves to the character definitions in `characters.actone`. No import statement is needed. The editor's auto-complete will suggest `Elena` and `Marcus` when you type inside `participants: [`.

### Example: Scenes in Plots

**scenes.actone**

```actone
scene Confrontation {
  type: Confrontation,
  participants: [Elena, Director],
  objective: "Elena confronts the Director with the decoded signal.",
}
```

**main.actone**

```actone
plot MainArc {
  beats: [
    { beat: "Elena decodes the first fragment", act: 1, type: Inciting },
    { beat: "The Director is revealed as the architect", act: 2, type: Midpoint },
  ],
  subplot Decoding: {
    description: "Elena's technical investigation arc",
    converges_at: Confrontation,
  },
}
```

The `converges_at: Confrontation` reference resolves to the `scene Confrontation` definition in `scenes.actone`. Cross-file reference resolution is automatic.

<div class="callout callout-info">
<div class="callout-title">Auto-complete knows all your files</div>
<p>The editor's auto-complete draws from the consolidated project AST, so names defined in any project file appear as suggestions regardless of which file is active in the editor. You will see character names, location names, and timeline layer names from all files. See <a href="/user-guide/02-editor/">Editor</a> for more on auto-complete.</p>
</div>

## File Organization Patterns

There is no required file naming or organization scheme. The following patterns work well for different story sizes:

### Pattern 1 — Two-file split (small to medium stories)

```
main.actone         → story block, generate block, themes
characters.actone   → all character definitions
```

### Pattern 2 — Four-file split (medium to large stories)

```
main.actone         → story block, generate block
characters.actone   → all character definitions
world.actone        → world, locations, rules, timeline
scenes.actone       → scenes, plots, interactions, themes
```

### Pattern 3 — Act-based split (complex stories with many scenes)

```
main.actone         → story block, generate block, themes
characters.actone   → all character definitions
world.actone        → world and locations
act-1.actone        → scenes and plots for Act 1
act-2.actone        → scenes and plots for Act 2
act-3.actone        → scenes and plots for Act 3
```

### Pattern 4 — Component-type split (maximum organization)

```
main.actone         → story block and generate block only
themes.actone       → all theme definitions
characters.actone   → all character definitions
world.actone        → all world definitions
timeline.actone     → all timeline definitions
scenes.actone       → all scene definitions
plots.actone        → all plot and interaction definitions
```

## Adding and Removing Files

See [Projects — File Management](/user-guide/01-projects/#file-management) for instructions on adding and removing files from a project.

<div class="callout callout-warning">
<div class="callout-title">Removing a file breaks its cross-references</div>
<p>If you remove a file that contains definitions referenced by other files, those references become unresolved. The Problems panel will show validation errors for each broken reference. You will need to either restore the file, recreate the definitions in another file, or remove the references from the other files.</p>
</div>

## Validation Across Files

The Problems panel reports validation errors found across all files in the project, not just the active file. Each error entry shows:

- The error message
- The file name where the error was found
- The line number within that file

Common multi-file validation errors:

| Error                            | Cause                                                                                                  | Fix                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `Duplicate character definition` | Two files define the same character name                                                               | Rename or remove one of the definitions                                                            |
| `Unresolved reference`           | A `participants`, `pov`, `location`, or `converges_at` refers to a name that doesn't exist in any file | Check for typos; ensure the target definition exists                                               |
| `Multiple story blocks found`    | More than one file contains a `story` block                                                            | Move all definitions into a single story block or make the others standalone (no wrapping `story`) |
| `Multiple generate blocks found` | More than one `generate` block exists across all files                                                 | Keep only one `generate` block in the project                                                      |

<div class="callout callout-tip">
<div class="callout-title">Tip: A project can have zero story blocks</div>
<p>If you prefer, you can omit the <code>story</code> block entirely and define all elements as standalone top-level definitions. The studio treats the project as a collection of components and all views function normally. This is useful for projects where you want to treat the story block's name as optional or not yet decided.</p>
</div>

---

**Next:** [Diagrams & Export](/user-guide/04-diagrams-export/) — visualize your story structure and export to DOCX or PDF.
