---
title: Diagrams & Export
order: 4
description: Visualizing your story with diagrams and exporting to DOCX, PDF, and other formats.
---

ActOne Studio provides two ways to see your story beyond the source code: the **Diagram panel**, which renders an interactive visual graph of your story's structure, and the **Export panel**, which produces formatted documents you can share, print, or hand to a collaborator.

## The Diagram Panel

The Diagram panel renders your entire story — characters, worlds, scenes, plots, themes, and their relationships — as an interactive node graph. Open it by clicking **Diagram** in the panel tab bar on the right side of the screen.

<div class="callout callout-info">
<div class="callout-title">The diagram reflects the merged AST</div>
<p>In a multi-file project, the diagram shows the consolidated view of all files — not just the active file. Every character, world, and scene from every file in the project appears in the diagram. See <a href="/user-guide/03-multi-file/">Multi-File Projects</a> for how the merged AST works.</p>
</div>

### Node Types

Each story element appears as a node with a color and icon that identifies its type:

| Node type       | Represents                                                   |
| --------------- | ------------------------------------------------------------ |
| **Story**       | The root `story` block — the story's title node              |
| **Character**   | A `character` definition — each character is a distinct node |
| **World**       | A `world` definition — contains location child nodes         |
| **Scene**       | A `scene` definition                                         |
| **Plot**        | A `plot` definition                                          |
| **Theme**       | A `theme` definition                                         |
| **Timeline**    | A `timeline` definition with layer children                  |
| **Interaction** | An `interaction` definition                                  |

### Edge Types

Edges (connecting lines) between nodes represent relationships defined in your source:

| Edge             | Drawn when                                                                |
| ---------------- | ------------------------------------------------------------------------- |
| **Participant**  | A scene or interaction lists a character in `participants`                |
| **Location**     | A scene references a location in a world                                  |
| **Relationship** | A character defines a `relationships` entry pointing to another character |
| **POV**          | A scene's `pov` property names a character                                |
| **Converges at** | A subplot's `converges_at` references a scene                             |
| **Layer**        | A scene's `layer` references a timeline layer                             |

### Auto-Layout

The diagram positions nodes automatically using the [ELK](https://www.eclipse.org/elk/) (Eclipse Layout Kernel) layout engine. ELK analyzes the graph structure and places nodes to minimize crossing edges and make the overall structure readable without any manual arrangement.

The layout runs automatically whenever the diagram is first opened and whenever the merged AST changes (i.e., after any file save). You do not need to manually trigger a layout refresh.

<div class="callout callout-tip">
<div class="callout-title">Tip: Large stories may take a moment to lay out</div>
<p>For complex stories with 10+ characters and 20+ scenes, the ELK layout computation may take a second or two. The diagram shows a loading indicator during layout. The result is a clean, readable graph — no manual positioning required.</p>
</div>

### Navigating the Diagram

| Action            | How                                                               |
| ----------------- | ----------------------------------------------------------------- |
| **Pan**           | Click and drag on the diagram background                          |
| **Zoom in / out** | Scroll wheel, or use the zoom controls in the diagram toolbar     |
| **Fit to screen** | Click the **Fit** button in the toolbar to zoom to show all nodes |
| **Reset zoom**    | Click **1:1** in the toolbar to return to 100% zoom               |
| **Select a node** | Click a node to highlight it and its direct connections           |
| **Deselect**      | Click the background to deselect                                  |

### Expanding and Collapsing Nodes

Some nodes can contain child nodes. **World** nodes, for example, contain location nodes as children. **Timeline** nodes contain layer nodes. When a parent node is collapsed, its children are hidden and the parent shows a count badge indicating how many children are hidden.

To expand or collapse a parent node, click the **toggle arrow** on the node. Expanding a parent re-runs the layout for that portion of the graph, repositioning sibling nodes to make room.

<div class="callout callout-info">
<div class="callout-title">Parent nodes auto-expand on hover</div>
<p>Hovering over a collapsed parent node shows a preview of its children without fully expanding. Click the toggle arrow to fully expand and anchor the children in the layout.</p>
</div>

## The Outline Panel

The **Outline panel** shows a tree view of your story's structure rather than a graph. Open it by clicking **Outline** in the panel tab bar. The outline lists all story elements in the merged AST, organized by type, with each element's name as a clickable item.

Clicking an element in the outline switches the active file in the editor to the file that contains that element's definition and scrolls the editor to the definition. This is a fast way to navigate to a specific character or scene definition without hunting through your files manually.

The outline updates automatically as you edit, reflecting the current merged AST.

## The Problems Panel

The **Problems panel** lists every validation error and warning across all files in the project. Open it by clicking **Problems** in the panel tab bar.

Each entry in the Problems panel shows:

- An icon indicating severity (error or warning)
- The error message
- The filename containing the error
- The line number

Clicking a problem entry opens that file in the editor and moves the cursor to the offending line.

<div class="callout callout-warning">
<div class="callout-title">Exports require a valid project</div>
<p>The export functions require that the project has no errors — only warnings are permitted. If the Problems panel shows any red (error) entries, the Export panel will display a message indicating that export is unavailable until errors are resolved. Fix all errors and save your files to enable export.</p>
</div>

## Exporting Your Story

The **Export panel** converts your ActOne story into formatted output documents. Open it by clicking **Export** in the panel tab bar, or by going to **File → Export** in the menu bar.

Export always operates on the **merged AST** — the consolidated view of all project files. The exported document represents your complete story, regardless of how many files it is split across.

### Export Formats

| Format   | Description                                                                               | Best for                                           |
| -------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **DOCX** | Microsoft Word document with formatted headings, character sheets, and scene descriptions | Sharing with collaborators, editorial review       |
| **PDF**  | Print-ready PDF with the same content as DOCX                                             | Printing, archiving, sharing in a read-only format |

### What Gets Exported

The exported document contains all story elements from the merged AST, formatted for human reading. The export structure follows a standard layout:

1. **Story title and metadata** — the story name, genre, tone, tense, and pacing from the `generate` block
2. **Themes** — each theme's statement, motifs, and counter-theme
3. **Characters** — each character's biography, personality summary, voice description, goals, arc, and relationships
4. **World** — world description, locations with their descriptions and connections, and categorized rules
5. **Timeline** — timeline structure, span, and layers (if defined)
6. **Scenes** — each scene's type, location, participants, POV, objective, and trigger
7. **Plots** — each plot's beats (with act and beat type), subplots, conflict type, and resolution pattern
8. **Interactions** — each interaction's participants, pattern, subtext, and emotional arc

<div class="callout callout-tip">
<div class="callout-title">Tip: DOCX is editable; PDF is not</div>
<p>Export to <strong>DOCX</strong> when you want collaborators or editors to be able to annotate or revise the document. Export to <strong>PDF</strong> when you want a fixed, read-only document for archiving or sharing without the possibility of accidental edits.</p>
</div>

### Running an Export

1. Open the **Export panel** by clicking **Export** in the panel tab bar.
2. Choose your desired format: **DOCX** or **PDF**.
3. Click the **Export** button for that format.
4. The export runs and the document downloads automatically to your browser's default download location.

### The Output Panel

While an export is running, the **Output panel** shows real-time progress messages. Open it by clicking **Output** in the panel tab bar. Messages include:

- `Starting export...`
- `Building document structure...`
- `Processing characters (N)...`
- `Processing scenes (N)...`
- `Generating DOCX / Generating PDF...`
- `Export complete — file downloaded`

If an error occurs during export, the Output panel shows the error message with details to help you diagnose the problem.

<div class="callout callout-info">
<div class="callout-title">Export is server-side</div>
<p>Document generation (DOCX and PDF) runs on the server, not in your browser. The studio sends your merged story AST to the server, which renders the document using the <code>docx</code> and <code>pdfkit</code> libraries, then streams the file back to your browser as a download. This means large exports are not limited by your browser's memory or processing power.</p>
</div>

### Export and Multi-File Projects

When you export from a multi-file project, the export always reflects the complete merged story — not the active file. The composition mode (merge, overlay, or sequential) affects which definitions appear in the merged AST, and therefore which definitions appear in the exported document.

For **Sequential** mode projects, each file segment is exported in file-list order, with clear section breaks between segments. This makes sequential mode suitable for exporting episodic content as a single document where each episode occupies its own section.

<div class="callout callout-warning">
<div class="callout-title">Sequential mode and cross-references</div>
<p>In Sequential mode, cross-file references do not resolve — each file is a self-contained namespace. If a scene in episode 2 lists a participant name that only exists in episode 1, that reference will appear as an unresolved reference error and the character will not appear correctly in the exported document. Ensure each sequential file is fully self-contained, or switch to Merge mode if you need cross-file references.</p>
</div>

## Tips for Best Results

- **Resolve all errors before exporting.** The Problems panel is your pre-export checklist. A clean (zero-error) project produces the most complete and consistent export.
- **Use the Outline panel to audit your story.** Before exporting, open the Outline panel and scan the full element list to ensure all your characters, worlds, and scenes are present as expected.
- **Use the Diagram panel to find isolated nodes.** A character node with no edges may indicate a character defined but not yet referenced in any scene — a potential gap in your story.
- **Export early and often.** DOCX exports are quick. Exporting a draft early gives you a formatted document to review and share, even before your story is complete.

---

**Previous:** [Multi-File Projects](/user-guide/03-multi-file/) — learn how to split your story across multiple files.
