---
title: Projects
order: 1
description: Creating, opening, and managing projects in ActOne Studio.
---

A project is the top-level container for your story work in ActOne Studio. Each project holds one or more `.actone` source files, tracks your story metadata, and stores your work in the cloud so you can access it from any browser.

## What Is a Project?

Every piece of writing you do in ActOne Studio lives inside a project. A project consists of:

- One or more `.actone` source files that define your story's characters, world, scenes, plots, and themes
- A project name and metadata (title, description, creation date)
- Storage for all your files in Supabase, automatically synced

Projects are isolated from one another — characters defined in one project cannot be referenced from another. Each project is a self-contained story world.

<div class="callout callout-info">
<div class="callout-title">Single-file vs. multi-file projects</div>
<p>Simple stories often fit comfortably in a single <code>.actone</code> file. More complex stories benefit from splitting definitions across multiple files — for example, placing characters in <code>characters.actone</code> and scene definitions in <code>scenes.actone</code>. Both approaches work equally well. See <a href="/user-guide/03-multi-file/">Multi-File Projects</a> for details.</p>
</div>

## Creating a New Project

To create a project, open the **Project** menu in the menu bar and choose **New Project**. The creation wizard walks you through the following steps:

### Step 1 — Name Your Project

Enter a project name. This name appears in the sidebar, the breadcrumb bar, and the browser tab. You can change it later in Project Settings.

### Step 2 — Choose a Starting Point

| Option            | Description                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Blank project** | Starts with an empty `main.actone` file containing only a `story` block stub. Best when you know what you want to write.        |
| **From template** | Pre-populated with example content: characters, a world, sample scenes, and a generate block. Best for learning the ActOne DSL. |

<div class="callout callout-tip">
<div class="callout-title">Tip: Start with a template</div>
<p>If you are new to ActOne, choose <strong>From template</strong> the first time. The template gives you working syntax to read and modify rather than starting from scratch. You can delete the example content once you understand the structure.</p>
</div>

### Step 3 — Confirm and Create

Click **Create Project**. ActOne Studio creates the project, uploads the initial file to storage, and opens the editor with your new file ready to edit.

## Opening an Existing Project

Your projects appear in the **Projects** section of the left sidebar whenever you are not inside a project. Click any project card to open it. The studio loads all of the project's files from storage and makes the first file active in the editor.

If you are already inside a project and want to switch, go to **Project → Open Project** in the menu bar. This returns you to the project list.

<div class="callout callout-warning">
<div class="callout-title">Unsaved changes</div>
<p>ActOne Studio auto-saves your work as you type (see <a href="#saving-and-auto-save">Saving and Auto-Save</a> below). When you switch projects, any in-flight auto-save completes before the project closes. You will not lose work by switching projects.</p>
</div>

## Project Settings

To view or edit your project's settings, go to **Project → Project Settings** in the menu bar. The settings panel lets you change:

- **Project name** — The display name shown in the sidebar and breadcrumb
- **Description** — An optional short description of your story (not part of the `.actone` source)
- **Composition mode** — How multiple files in the project are combined (see [Multi-File Projects](/user-guide/03-multi-file/))

## File Management

Each project contains one or more `.actone` files. You can view, add, and remove files using the **file list** in the left sidebar when a project is open.

### Adding a File

Click the **+** button at the top of the file list in the sidebar, or go to **Project → Add File**. You can name the file anything you like — the `.actone` extension is added automatically. Common naming conventions:

| Filename            | Typical contents                             |
| ------------------- | -------------------------------------------- |
| `main.actone`       | The `story` block, `generate` block          |
| `characters.actone` | All `character` definitions                  |
| `world.actone`      | `world` definitions with locations and rules |
| `scenes.actone`     | `scene` and `interaction` definitions        |
| `themes.actone`     | `theme` definitions                          |

These are conventions only — ActOne Studio does not enforce any naming scheme. You can organize files however makes sense for your creative process.

### Removing a File

Right-click a file in the sidebar file list and choose **Remove from Project**. You will be asked to confirm before the file is deleted from storage.

<div class="callout callout-warning">
<div class="callout-title">Deletion is permanent</div>
<p>Removing a file from a project deletes it from cloud storage. There is no trash or undo for file deletion. If the file contained definitions referenced by other files, those cross-references will show validation errors after removal.</p>
</div>

### Switching Between Files

Click any file name in the sidebar file list to make it the active file in the editor. The editor tab bar at the top of the editor pane shows all currently open files, and you can click tabs to switch between them. See [Editor](/user-guide/02-editor/) for details on the editor tab bar.

## Saving and Auto-Save

ActOne Studio saves your work automatically. Every change you make in the editor triggers an auto-save after a short debounce period. The status bar at the bottom of the screen shows the current save state:

- **Saving...** — a save is in progress
- **Saved** — all changes are persisted to cloud storage
- **Save failed** — a network or storage error occurred (your changes are still in memory; try again by making a small edit)

You can also manually trigger a save with **Ctrl+S** (or **Cmd+S** on macOS).

<div class="callout callout-info">
<div class="callout-title">Auto-save and the parser</div>
<p>Each time a file is saved, ActOne Studio immediately re-parses the updated file and refreshes all panels — the Outline, Diagram, and Problems panels all update to reflect the latest state of your story. This means you always see an up-to-date view of your work without manually triggering a refresh.</p>
</div>

## Project Metadata

Every project stores the following metadata, separate from the `.actone` source files:

| Field                | Description                                                           |
| -------------------- | --------------------------------------------------------------------- |
| **Name**             | Display name shown in the studio                                      |
| **Description**      | Optional free-text description                                        |
| **Created**          | Date the project was first created                                    |
| **Last modified**    | Date any file in the project was last changed                         |
| **Composition mode** | How multiple files are combined (`merge`, `overlay`, or `sequential`) |
| **File count**       | Number of `.actone` files in the project                              |

Metadata is stored in the database alongside the file content and is never embedded in your `.actone` source. Your source files contain only your story definitions.

---

**Next:** [Editor](/user-guide/02-editor/) — learn how to use the code editor, keyboard shortcuts, and error highlighting.
