---
title: Your First Story
order: 4
description: Step-by-step guide to creating your first ActOne story.
---

The best way to learn ActOne is to write something. This guide walks you through creating a short but complete story from scratch — a scientist who discovers a mysterious signal. By the end, you will have a working ActOne file, a populated Diagram panel, and a DOCX export ready to share.

The whole process takes about fifteen minutes.

<div class="callout callout-info">
<div class="callout-title">Before You Begin</div>
<p>Make sure ActOne Studio is open and you are signed in. If you need a refresher on the interface, read the <a href="/getting-started/03-quick-tour/">Quick Tour</a> first. For a deeper explanation of the concepts you will use below, see <a href="/getting-started/02-core-concepts/">Core Concepts</a>.</p>
</div>

## Step 1: Create a New Project

Open ActOne Studio. From the home screen, click **New Project**. You will be prompted to give your project a name — type `The Awakening` and press Enter (or click Create).

The Studio creates a new project with a single empty file named `main.act` and opens it in the Editor. The Outline and Diagram panels will be empty until you add content.

<div class="callout callout-tip">
<div class="callout-title">Tip</div>
<p>Project names and story names do not have to match, but it helps to keep them consistent while you are learning. In larger projects, the project might be named after a franchise or series, while individual story files are named after specific installments.</p>
</div>

## Step 2: Open the Editor and Start Writing

Click inside the Editor pane (the large central area). The cursor will appear at the top of the empty file.

You are going to write a single `story` block that contains everything: a character, a world with one location, and one scene. The structure is straightforward — each element is a named block that opens with a `{` and closes with a `}`.

Start by typing the story declaration:

```actone
story "The Awakening" {

}
```

Everything else you write in this tutorial will go inside those curly braces. The story's name, `"The Awakening"`, will appear as the root node in the Outline panel and as the document title in exported files.

## Step 3: Add a Character

Inside the story block, define a character named Elena:

```actone
story "The Awakening" {
  character "Elena" {
    nature protagonist
    bio "A scientist who discovers an ancient signal."
  }
}
```

As soon as you type the closing `}` for the character block and save the file (Ctrl+S or Cmd+S), the Outline panel refreshes and Elena appears under the story root. The Diagram panel will show a character node for her.

<div class="callout callout-tip">
<div class="callout-title">Tip</div>
<p>Use the <code>nature</code> attribute to tell ActOne (and yourself) what role this character plays. <code>protagonist</code>, <code>antagonist</code>, <code>supporting</code>, and <code>narrator</code> are the most common values. If you are not sure yet, you can leave <code>nature</code> out and add it later.</p>
</div>

Elena only has two attributes here — `nature` and `bio` — which is enough to get started. You can add `voice`, `personality`, `goals`, and `relationships` later as your story develops. See the [Language Reference](/language-reference/03-element-reference/) for the full list of character attributes.

## Step 4: Add a World and a Location

Below the character block (still inside the story block), add a world:

```actone
  world "Research Station" {
    location "Control Room" {
      description "Banks of monitors line the walls, casting a pale blue light."
    }
  }
```

This defines a world called `Research Station` containing one location, `Control Room`. The location's `description` is free-form text that appears in the Diagram panel tooltip and in the exported document.

After saving, the Diagram panel will show the Research Station world as a container node, with the Control Room location node inside it.

<div class="callout callout-info">
<div class="callout-title">Info</div>
<p>A world can contain as many locations as you need. For now, one is enough. You can always return to the world block and add more locations as your story grows.</p>
</div>

## Step 5: Add a Scene

Now add a scene that takes place in the Control Room and features Elena:

```actone
  scene "First Contact" {
    type action
    setting world="Research Station".location="Control Room"
    characters "Elena"

    beat "discovery" {
      type revelation
      description "Elena notices an anomalous pattern in the signal data."
    }
  }
```

There are a few things to notice here:

- `type action` labels this scene as an action scene. Other types include `dialogue`, `transition`, `flashback`, and `flashforward`.
- `setting world="Research Station".location="Control Room"` tells ActOne exactly where this scene takes place. The Studio will validate that both the world and the location exist.
- `characters "Elena"` declares who is present. The Studio validates that Elena is defined as a character in this story.
- The `beat` block named `"discovery"` describes a single dramatic moment within the scene. Its `type revelation` marks it as a revelation beat, and `description` provides the detail.

<div class="callout callout-warning">
<div class="callout-title">Watch Out</div>
<p>The world and location names in the <code>setting</code> attribute must match exactly — including capitalization and spacing — the names you used when defining the world. If they do not match, the Problems panel will show an error. Use the Editor's auto-complete to avoid typos.</p>
</div>

## Step 6: The Complete File

Here is the complete story as it should look in your Editor:

```actone
story "The Awakening" {
  character "Elena" {
    nature protagonist
    bio "A scientist who discovers an ancient signal."
  }

  world "Research Station" {
    location "Control Room" {
      description "Banks of monitors line the walls."
    }
  }

  scene "First Contact" {
    type action
    setting world="Research Station".location="Control Room"
    characters "Elena"

    beat "discovery" {
      type revelation
      description "Elena notices an anomalous pattern in the signal data."
    }
  }
}
```

Save the file now. The Outline panel should show the full tree: `The Awakening` > `Elena`, `Research Station` > `Control Room`, and `First Contact` > `discovery`. If anything is missing, check the Problems panel for errors.

<div class="callout callout-tip">
<div class="callout-title">Tip</div>
<p>If the Outline or Diagram panel does not update after saving, click the refresh icon at the top of the panel. This is rarely necessary, but it can help if a panel seems stuck.</p>
</div>

## Step 7: Explore the Diagram Panel

Click on the **Diagram** tab in the panel area. You should see:

- A **character node** for Elena, labeled with her name and `protagonist` nature.
- A **world container** for Research Station containing a **location node** for Control Room.
- A **scene node** for First Contact, with an edge connecting it to the Control Room location and another edge connecting it to Elena.

Try clicking the Elena node. The Editor cursor jumps to Elena's character definition. Click the First Contact scene node. The Editor jumps to the scene block.

If any nodes are overlapping, drag them apart. The Studio saves your layout automatically.

<div class="callout callout-info">
<div class="callout-title">Info</div>
<p>The Diagram panel is not just decorative. As your story grows with more characters, worlds, and scenes, it becomes the fastest way to understand the shape of your narrative and spot structural gaps — characters who are defined but never placed in a scene, or locations that appear in a scene but are not connected to any other part of the world.</p>
</div>

## Step 8: Check the Problems Panel

Open the **Problems** panel. With the file as written above, it should be empty — no errors, no warnings. A clean Problems panel means the Studio has validated all your cross-references and found no issues.

If you see errors, compare your file carefully with the complete example in Step 6. Common mistakes at this stage are:

- A missing or extra `}` that leaves a block unclosed.
- A mismatch between the name used in `setting` and the name used in the `world` or `location` block.
- A character name in `characters` that does not exactly match the name in the `character` block.

Each error in the Problems panel includes the line number where the issue was found. Click an error entry to jump directly to that line in the Editor.

## Step 9: Export to DOCX

Once the Problems panel is clear, open the **Export** panel. You will see the export options:

1. Select **DOCX** as the format.
2. Leave the content selection at the default (all sections included).
3. Click **Export**.

The Studio will ask where to save the file. Choose a location and click Save. In a few moments, the DOCX file will be ready to open in Microsoft Word or Google Docs.

<div class="callout callout-tip">
<div class="callout-title">Tip</div>
<p>The DOCX export includes character profiles, world and location descriptions, and scene content formatted as readable prose. It is a useful way to share your story's structure with collaborators who do not use ActOne Studio.</p>
</div>

## What to Try Next

Congratulations — you have written, validated, and exported your first ActOne story. Here are some directions to explore from here:

- **Add more characters.** Give Elena a colleague or a supervisor. Define a `relationship` between them inside one of the character blocks.
- **Expand the world.** Add a second location to Research Station — perhaps a server room or an observation deck — and write a second scene set there.
- **Add a timeline.** Wrap your scenes in a `timeline` block to explicitly define their chronological order.
- **Add a plot.** Define a `plot` block that names First Contact as a turning point and looks toward a resolution.
- **Try a multi-file project.** As your story grows, you can split it into separate `.act` files — one for characters, one for worlds, one for scenes. See [Multi-File Projects](/user-guide/03-multi-file/) in the User Guide.

For a complete reference of everything you can write in an ActOne file, visit the [Language Reference](/language-reference/01-language-overview/).
