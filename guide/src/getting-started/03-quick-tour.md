---
title: Quick Tour
order: 3
description: A visual walkthrough of the ActOne Studio interface.
---

ActOne Studio is the editing environment where you write, validate, and visualize your narrative. Everything you need — writing, structure inspection, visual mapping, error checking, and export — lives in one window. This page walks through each area of the interface so that nothing surprises you when you open a project for the first time.

<div class="callout callout-info">
<div class="callout-title">Info</div>
<p>If you have not yet opened ActOne Studio, sign in at the login screen and create a new project. The interface described on this page will appear as soon as a project is open.</p>
</div>

## The Overall Layout

The Studio window is divided into three main zones:

1. **The sidebar** (left) — navigation, project structure, and section links.
2. **The editor area** (center) — where you write and edit your ActOne files.
3. **The panel area** (right or bottom, depending on your layout) — secondary views such as the Diagram, Outline, Problems, and Export panels.

A **Menu Bar** runs across the top of the window, and a **Status Bar** runs along the bottom. You can resize zones by dragging the dividers between them, and you can show or hide individual panels using the View menu in the Menu Bar.

## The Menu Bar

The Menu Bar at the top of the window provides access to the most common operations:

- **File menu** — create, open, save, and close projects and files. Also contains the option to rename the current project.
- **Edit menu** — standard text editing commands: undo, redo, cut, copy, paste, and find/replace.
- **View menu** — toggle the visibility of each panel (Outline, Diagram, Problems, Export), switch between light and dark themes, and reset the layout to its default arrangement.
- **Project menu** — manage project settings and navigate between files in a multi-file project.

<div class="callout callout-tip">
<div class="callout-title">Tip</div>
<p>Most operations in the Menu Bar have keyboard shortcuts. Hover over any menu item to see its shortcut. Learning the shortcuts for Save, Find, and Toggle Diagram will noticeably speed up your workflow.</p>
</div>

## The Editor

The Editor is the central pane of the Studio, and it is where you spend most of your time. It is a full-featured code editor tailored specifically for the ActOne language.

**Syntax highlighting** colors different parts of your ActOne code to make it easier to read at a glance. Keywords like `story`, `character`, `scene`, and `beat` appear in one color; names and identifiers in another; string values in another. This visual distinction helps you spot structure at a glance and notice when something is in the wrong place.

**Auto-complete** offers suggestions as you type. When you open a new block — say, a `character` block — the Studio suggests the valid attributes you can use inside it. Press Tab or Enter to accept a suggestion. This is especially helpful when you are learning the language and cannot yet remember every keyword.

**Error underlining** draws a red wavy underline beneath any part of your code that the Studio has flagged as invalid. Hover over an underlined section to see a brief explanation of the problem. A full list of all errors appears in the [Problems panel](#the-problems-panel).

**Multiple file tabs** appear at the top of the Editor when your project contains more than one `.act` file. Click a tab to switch between files. Unsaved files show a dot next to their name.

<div class="callout callout-tip">
<div class="callout-title">Tip</div>
<p>Use the Editor's find/replace (usually Ctrl+H or Cmd+H) when you need to rename a character or location that appears many times across a file. For multi-file projects, see <a href="/user-guide/03-multi-file/">Multi-File Projects</a> in the User Guide.</p>
</div>

## The Outline Panel

The Outline panel shows a tree view of your story's structure, derived in real time from the code in the Editor. Every element you define — characters, worlds, scenes, timelines, plots — appears as a node in the tree. Expand a node to see its children: a character's relationships, a world's locations, a scene's beats.

Clicking a node in the Outline panel moves the Editor cursor to the corresponding section of your code. This is the fastest way to navigate a large story file: instead of scrolling through hundreds of lines, click the scene you want in the Outline and the Editor jumps there instantly.

The Outline panel also shows the **type** label for scenes (such as `action`, `dialogue`, or `flashback`) so you can get a quick read on the pacing of your narrative without opening each scene individually.

<div class="callout callout-info">
<div class="callout-title">Info</div>
<p>The Outline panel updates every time you save your file. If you do not see a change you just made, save the file (Ctrl+S or Cmd+S) and the Outline will refresh.</p>
</div>

## The Diagram Panel

The Diagram panel renders a visual map of your story's elements and their relationships. It is one of the most distinctive features of ActOne Studio, and it gives you a perspective on your story that is impossible to get from reading the text alone.

In the Diagram panel you will see:

- **Character nodes** — one node per character, labeled with their name and nature.
- **World and location nodes** — worlds appear as containers; locations appear as nodes inside their world's container.
- **Scene nodes** — each scene appears as a node connected to its setting location and to the characters who appear in it.
- **Relationship edges** — lines connecting characters who have defined relationships, labeled with the relationship type.
- **Timeline and plot edges** — lines showing the sequence of scenes within a timeline, and the turning points of a plot.

You can pan by clicking and dragging the canvas, and zoom by scrolling. Clicking a node in the Diagram panel highlights the corresponding definition in the Editor, the same way clicking in the Outline panel does.

**Auto-layout** arranges the nodes automatically using a graph layout algorithm, but you can drag nodes to positions that make more visual sense for your story. The Studio remembers your layout between sessions.

<div class="callout callout-tip">
<div class="callout-title">Tip</div>
<p>Use the Diagram panel as a creative tool, not just a validation check. Seeing all your characters connected by relationship edges often reveals structural patterns — or missing relationships — that are hard to notice in the text editor alone.</p>
</div>

## The Problems Panel

The Problems panel is a list of every validation error and warning the Studio has found across your project files. Each entry shows:

- The **severity** of the issue (error or warning).
- A **description** of the problem in plain language.
- The **file and line number** where the problem was found.

Click any entry in the Problems panel to jump directly to the relevant line in the Editor.

Errors are issues that will prevent your story from being exported correctly — for example, a scene that references a character who has not been defined, or a location that does not exist in any world. Warnings are potential issues that do not block export but might indicate an oversight — for example, a character who is listed in a scene's cast but never appears in any beat within that scene.

<div class="callout callout-warning">
<div class="callout-title">Watch Out</div>
<p>Resolve all errors before attempting to export. The Export panel will indicate that errors are present and may produce incomplete output if errors remain. Warnings do not block export, but it is good practice to review them before sharing your work.</p>
</div>

## The Export Panel

The Export panel is where you turn your ActOne story into a finished document. Select the format you want — DOCX, PDF, or others — configure the export options, and click Export.

Export options include:

- **Format** — DOCX (Microsoft Word compatible) or PDF.
- **Content selection** — choose whether to include character profiles, world descriptions, scene text, timeline summaries, or the full story in a single document.
- **Section ordering** — control whether characters appear before or after worlds, and whether scenes are ordered by timeline or by plot.

The exported document reflects the current saved state of your project. If you have unsaved changes, save before exporting.

<div class="callout callout-info">
<div class="callout-title">Info</div>
<p>DOCX export is the most flexible format because it can be further edited in Microsoft Word or Google Docs. PDF export produces a finished, read-only document suitable for sharing with collaborators who do not use ActOne Studio.</p>
</div>

## The Status Bar

The Status Bar at the very bottom of the Studio window provides at-a-glance information about the current state of your project:

- **Current file** — the name of the file open in the Editor.
- **Cursor position** — the current line and column number.
- **Diagnostics count** — the number of errors and warnings across your project, shown as small colored badges. Click the badge to open the Problems panel.
- **Language indicator** — confirms that the active file is being parsed as an ActOne file (as opposed to a plain text file).

---

Now that you know your way around the Studio, it is time to put it to use. Head to [Your First Story](/getting-started/04-first-story/) for a step-by-step walkthrough of creating a complete ActOne story from scratch. Or, if you want to understand the language elements in more depth before writing, revisit [Core Concepts](/getting-started/02-core-concepts/).
