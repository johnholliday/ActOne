---
title: Editor
order: 2
description: Using the code editor — syntax highlighting, auto-complete, formatting, and save behavior.
---

The ActOne Studio code editor is built on [CodeMirror 6](https://codemirror.net/), a professional-grade editor engine used in browser-based development tools worldwide. It provides a rich, responsive editing experience specifically tuned for the ActOne DSL.

## The Editor Pane

When you open a project, the editor pane occupies the center of the screen. It displays the contents of the currently active `.actone` file. The editor is always in text-editing mode — there is no separate "view" mode. Every element you define is written directly in the ActOne language, and all panels (Diagram, Outline, Problems) update automatically as you type.

<div class="callout callout-info">
<div class="callout-title">What is the ActOne DSL?</div>
<p>ActOne is a domain-specific language for fiction writers. You define your story's characters, worlds, scenes, plots, and themes using structured keyword syntax rather than prose. The language is designed to be readable — it looks more like a configuration file than code. If you are new to the language, see the <a href="/language-reference/01-language-overview/">Language Reference</a> for a full description of every keyword.</p>
</div>

## Syntax Highlighting

The editor highlights every part of your ActOne source in a distinct color so you can read your definitions at a glance:

| Token type         | Examples                                                            | Appearance         |
| ------------------ | ------------------------------------------------------------------- | ------------------ |
| **Keywords**       | `story`, `character`, `scene`, `world`, `theme`, `plot`, `generate` | Bold, accent color |
| **Property names** | `bio`, `voice`, `personality`, `goals`, `arc`, `participants`       | Muted blue         |
| **String values**  | `"Elena Vasquez"`, `"haunted by what she knows"`                    | Green              |
| **Numbers**        | `0.7`, `80`, `-20`                                                  | Orange             |
| **Identifiers**    | Bare names like `Elena`, `NeonNostalgia`                            | Default text       |
| **Comments**       | `// single line`, `/* block */`                                     | Gray, italic       |
| **Punctuation**    | `{`, `}`, `[`, `]`, `:`, `,`                                        | Dimmed             |

Syntax highlighting applies to the current file only. It does not require the file to be parseable — even a file with errors will be highlighted up to the point of the problem.

## Auto-Complete

Press **Ctrl+Space** (or **Cmd+Space** on macOS) at any point in the editor to open the auto-complete menu. Auto-complete is context-aware:

- **After a block keyword** (`character`, `scene`, `world`, etc.): suggests the property names valid for that block
- **After `participants:`**: suggests character names defined anywhere in the project — including characters defined in other files
- **After `pov:`**: suggests character names and the `Omniscient` keyword
- **After `location:`**: suggests location names from all world definitions in the project
- **After `type:`**: suggests the valid enum values for that context (`Action`, `Dialogue`, `Reflection`, etc.)
- **After `layer:`**: suggests timeline layer names defined in any project file

<div class="callout callout-tip">
<div class="callout-title">Tip: Auto-complete across files</div>
<p>Auto-complete draws from the consolidated project AST, so character names defined in <code>characters.actone</code> will appear as suggestions in <code>scenes.actone</code>. You do not need to have the other file open in a tab for suggestions to appear. See <a href="/user-guide/03-multi-file/">Multi-File Projects</a> for how cross-file resolution works.</p>
</div>

## Error Underlines

When the parser detects a syntax or validation error in your file, the offending text is underlined in red (syntax errors) or yellow (validation warnings). Hover over any underline to read the error message in a tooltip.

The same errors also appear in the **Problems panel**, which lists all diagnostics across all project files in one place. See [Diagrams & Export](/user-guide/04-diagrams-export/) for information on the Problems panel.

Common errors you may encounter:

- **Unresolved reference** — a name used in `participants`, `pov`, `location`, or `converges_at` does not match any definition in the project
- **Duplicate definition** — two files define a `character` (or other element) with the same name
- **Multiple story blocks** — more than one `story` block found across the project files
- **Multiple generate blocks** — more than one `generate` block found across the project files

## Bracket Matching

When your cursor is next to an opening or closing bracket (`{`, `}`, `[`, `]`), the editor highlights the matching pair. This makes it easy to see where a `character` block ends, especially in long definitions with nested properties like `arc`, `personality`, and `relationships`.

If your cursor is inside a block, the matching braces are highlighted in a contrasting color so you can identify the block boundary at a glance.

## Comment Toggling

To comment out one or more lines, select them and press **Ctrl+/** (or **Cmd+/** on macOS). The editor adds `//` to the start of each selected line. Press the same shortcut again to uncomment.

Block comments (`/* ... */`) can be added manually. They are useful for writing author notes that span multiple lines:

```actone
/*
  Act 2 scenes — not yet connected to plot beats.
  TODO: assign beats once act structure is finalized.
*/
scene Confrontation {
  ...
}
```

## The Editor Tab Bar

When multiple files are open in a project, the **editor tab bar** appears across the top of the editor pane. Each open file has a tab showing its filename.

| Tab behavior           | Description                                                                   |
| ---------------------- | ----------------------------------------------------------------------------- |
| **Click a tab**        | Switches the editor to that file                                              |
| **Middle-click a tab** | Closes that tab (the file remains in the project)                             |
| **Click X on a tab**   | Closes that tab                                                               |
| **Scroll the tab bar** | When there are more tabs than fit, scroll horizontally                        |
| **Modified indicator** | A dot on a tab indicates unsaved changes (usually brief because of auto-save) |

<div class="callout callout-info">
<div class="callout-title">Closing a tab vs. removing a file</div>
<p>Closing a tab removes the file from the editor view but does not delete it from the project. The file remains in the project's file list in the sidebar and can be reopened at any time by clicking it in the sidebar. To permanently remove a file from the project, right-click it in the sidebar file list and choose <strong>Remove from Project</strong>.</p>
</div>

## The Breadcrumb Bar

Directly above the editor, the **breadcrumb bar** shows your current context: the project name, and the name of the active file. This helps you stay oriented when working across multiple files with similar content.

Example: `My Novel  /  characters.actone`

The breadcrumb bar is informational only — clicking on it does not navigate anywhere.

## Keyboard Shortcuts

| Action            | Windows / Linux        | macOS             |
| ----------------- | ---------------------- | ----------------- |
| Save              | Ctrl+S                 | Cmd+S             |
| Auto-complete     | Ctrl+Space             | Cmd+Space         |
| Toggle comment    | Ctrl+/                 | Cmd+/             |
| Undo              | Ctrl+Z                 | Cmd+Z             |
| Redo              | Ctrl+Y or Ctrl+Shift+Z | Cmd+Shift+Z       |
| Find              | Ctrl+F                 | Cmd+F             |
| Find and replace  | Ctrl+H                 | Cmd+H             |
| Go to line        | Ctrl+G                 | Cmd+G             |
| Select all        | Ctrl+A                 | Cmd+A             |
| Indent selection  | Tab                    | Tab               |
| Outdent selection | Shift+Tab              | Shift+Tab         |
| Duplicate line    | Alt+Shift+Down         | Option+Shift+Down |
| Move line up      | Alt+Up                 | Option+Up         |
| Move line down    | Alt+Down               | Option+Down       |

## Formatting Tips

The ActOne DSL is indentation-sensitive in terms of readability (though not in terms of parsing). The convention used in all examples throughout this guide is:

- 2-space indentation inside blocks
- One blank line between top-level element definitions
- Trailing commas on property values (optional, but recommended for easier line-by-line editing)

Example of well-formatted ActOne:

```actone
character Elena {
  nature: Human,
  bio: "A forensic linguist who decodes the city's hidden language.",
  voice: "Precise and searching. She names things others leave vague.",
  personality: {
    curiosity: 90,
    caution: 40,
    compassion: 75,
  },
  goals: [
    { goal: "Expose the signal manipulation program", priority: Primary },
    { goal: "Protect her source inside the Bureau", priority: Secondary },
  ],
}
```

<div class="callout callout-tip">
<div class="callout-title">Tip: Use trailing commas</div>
<p>Adding a trailing comma after the last property in a block (e.g., <code>compassion: 75,</code>) makes it easier to add new properties later without forgetting to add a comma to the previous last line. The ActOne grammar accepts trailing commas everywhere they can appear.</p>
</div>

---

**Next:** [Multi-File Projects](/user-guide/03-multi-file/) — learn how to split your story across multiple files and use composition modes.
