---
title: Core Concepts
order: 2
description: Fundamental concepts behind ActOne — stories, characters, worlds, scenes, timelines, and plots.
---

Before you write your first ActOne file, it helps to understand the vocabulary ActOne uses to think about narrative. These are not abstract technical terms — they map closely to concepts you already use when you talk about stories. ActOne simply gives them precise definitions so that the Studio can understand, validate, and visualize your work.

Every ActOne story is built from the same set of building blocks. At the highest level:

<div class="formula">
Story = Characters + Worlds + Scenes + Timelines + Plots
</div>

The sections below explain each building block in detail.

## Story

A **story** is the top-level container for everything in an ActOne project. Every character, world, scene, timeline, and plot you define lives inside a story. You give your story a name when you create it, and that name appears throughout the Studio — in the title bar, the Outline panel, and any exported documents.

A single ActOne project file typically contains one story, though large projects can span multiple files that reference one another. When you open a project in the Studio, the story it contains becomes the root of everything you see in the Outline and Diagram panels.

<div class="callout callout-info">
<div class="callout-title">Info</div>
<p>Think of the story element the same way you would think of a book's title page: it names and introduces everything that follows. Every other element is a child of the story.</p>
</div>

## Characters

**Characters** are the people, creatures, or entities that inhabit your narrative. Each character in ActOne is more than a name — it is a structured profile with attributes that the Studio tracks and validates:

- **Nature** describes a character's narrative role: `protagonist`, `antagonist`, `supporting`, `narrator`, and so on. A story can have multiple protagonists, or none at all in an ensemble piece.
- **Bio** is a free-text biography. Use it to capture backstory, motivations, and anything else that grounds the character in your world.
- **Role** is a functional label within the story's world — a scientist, a soldier, a merchant. It is distinct from `nature`, which describes narrative function rather than in-world occupation.
- **Voice** captures how the character speaks: formal, terse, lyrical, comedic. Use it to stay consistent when writing dialogue across many scenes.
- **Personality** describes the character's temperament and disposition.
- **Goals** articulate what the character wants, both in the immediate scene and over the course of the story.
- **Relationships** connect one character to another with a named relationship type. These connections appear as edges in the Diagram panel, letting you see at a glance who is allied with whom, who is in conflict, and who is a stranger.

<div class="callout callout-tip">
<div class="callout-title">Tip</div>
<p>You do not need to fill in every attribute for every character. Start with <code>nature</code> and <code>bio</code>. Add more attributes as your story develops and you discover what each character needs.</p>
</div>

Characters are defined at the story level and can appear in any number of scenes. When a character appears in a scene, the Studio validates that they have been defined — catching typos and missing definitions before you export.

## Worlds

A **world** is a setting — the physical, cultural, or fictional environment in which your story takes place. A world contains **locations**, which are specific places within it. A scene is always set in a particular location within a particular world, so worlds and their locations form the spatial backbone of your narrative.

Worlds can hold additional detail beyond locations:

- **Rules** describe the laws or conventions that govern the world — physical laws, magical systems, political structures, social norms. These are notes for your own reference; they help you stay consistent as your world grows.
- **Environmental details** capture the look, feel, and atmosphere of the world at a broad level, separate from the specific descriptions of individual locations.

A single story can contain multiple worlds — for example, a science fiction story might include a starship, a space station, and a planet's surface as separate worlds, each with its own locations.

<div class="callout callout-info">
<div class="callout-title">Info</div>
<p>The distinction between a world and a location matters for the Diagram panel. Worlds appear as groups, and locations appear as nodes within those groups, making it easy to see which scenes share a setting and which characters are associated with each part of your world.</p>
</div>

## Scenes

A **scene** is a discrete dramatic moment — the basic unit of action in an ActOne story. Every scene has a setting (a world and location), a cast of characters who are present, and a sequence of **beats**.

**Beats** are the smallest named units of dramatic action within a scene. A beat might be a revelation, a confrontation, a moment of quiet reflection, a piece of dialogue, or a physical action. Structuring your scenes into beats helps you track exactly what happens in each scene and where the tension rises and falls.

Each scene also has a **type** that describes its narrative function: `action`, `dialogue`, `transition`, `flashback`, `flashforward`, and so on. The type appears in the Outline panel and can be used to filter and organize your scenes.

<div class="callout callout-warning">
<div class="callout-title">Watch Out</div>
<p>Every scene must reference a world and location that are defined elsewhere in your story. If you rename a location, the Studio will flag any scenes that still reference the old name in the Problems panel.</p>
</div>

Scenes can be referenced by timelines and plots, which determine their order in the narrative and their role in the story's arc.

## Timelines

A **timeline** defines the temporal structure of your story — how scenes are ordered in time. In a simple linear story, there is one timeline and scenes are arranged chronologically. In a more complex narrative, you might have multiple timeline layers:

- **Past** — flashback scenes that reveal backstory.
- **Present** — the main narrative thread unfolding in real time.
- **Future** — flash-forward scenes that hint at what is to come.
- **Parallel** — simultaneous events happening in different locations or storylines.

Each timeline layer is an ordered sequence of scenes. The Studio displays timelines in the Outline panel, allowing you to navigate your story's chronology independently of the order in which you wrote the scenes.

Timelines are especially important in branching narratives, where a player's choices might lead to different sequences of scenes. By defining timelines explicitly, you can map every possible path through your story without losing track of which scenes belong to which branch.

<div class="callout callout-tip">
<div class="callout-title">Tip</div>
<p>If your story is linear, you still benefit from defining a timeline. It makes the Diagram panel more useful and gives the Studio enough information to sequence your scenes correctly in exported documents.</p>
</div>

## Plots

A **plot** is the narrative arc that connects scenes with causality and direction. Where a timeline answers the question "in what order do these scenes occur?", a plot answers "why do they follow one another?" and "where is this strand of the story going?"

A plot is built from:

- **Turning points** — specific scenes or beats where the direction of the narrative changes. A turning point might be a revelation that reframes everything the audience has seen so far, or a decision that closes off one path and opens another.
- **Resolution** — the scene or beat where this plot strand reaches its conclusion, whether that is a victory, a defeat, a reconciliation, or something more ambiguous.

A story can have multiple plots running simultaneously: a main plot, subplots for individual characters, thematic threads, and so on. Each plot can reference different sets of scenes, and a single scene can belong to more than one plot.

## Themes

**Themes** are the overarching concepts your story explores — justice, identity, belonging, sacrifice, transformation. In ActOne, themes are named elements that can be associated with characters, scenes, and plots. They do not affect validation or diagram layout directly, but they appear in the Outline panel and in exported documents, and they give you a place to articulate the ideas your story is grappling with.

<div class="callout callout-info">
<div class="callout-title">Info</div>
<p>Themes are optional. Many writers define them early as a creative anchor; others add them after the story's shape becomes clear. There is no wrong time to introduce a theme.</p>
</div>

## Interactions

**Interactions** are the decision points in an interactive narrative — the moments where your audience makes a choice that affects what happens next. Each interaction defines:

- **Options** — the choices available to the player or reader, each described in natural language.
- **Conditions** — any prerequisites that must be true for an option to be available.
- **Consequences** — what happens when an option is chosen: which scene plays next, how a character's state changes, or what new information is revealed.

Interactions are most relevant for game narratives and interactive fiction, but they can also be used in non-interactive stories to document the "what if" branching points you considered during development.

---

With these concepts in mind, you are ready to see how the Studio brings them to life. Continue to the [Quick Tour](/getting-started/03-quick-tour/) to walk through the ActOne Studio interface, or jump straight to [Your First Story](/getting-started/04-first-story/) if you prefer to learn by doing.
