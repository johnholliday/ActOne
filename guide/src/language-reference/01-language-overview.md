---
title: Language Overview
order: 1
description: Introduction to the ActOne DSL — what it is, who it's for, and how documents are structured.
---

This page introduces the ActOne language itself — its purpose, its audience, its structure, and the types of data it works with. By the end of this page you will understand what a valid ActOne document looks like, how its parts fit together, and what tools the language gives you to describe your story.

If you have already read the [Getting Started](/getting-started/01-introduction/) section and written [Your First Story](/getting-started/04-first-story/), much of this will be familiar. The difference here is precision: this is the reference-grade explanation of how the language works, not a tutorial walkthrough.

## What ActOne Is

ActOne is a **domain-specific language** (DSL) for fiction writers who want structured control over multi-agent AI story generation. In plain terms, it is a text-based notation that lets you describe the ingredients of a story — characters, worlds, scenes, plots, themes, timelines, and interactions — in a format that both humans and an AI runtime can read.

The core idea behind ActOne is that **characters are autonomous agents**. Each character you define becomes an independent AI persona at runtime, complete with a psychographic profile (personality traits, goals, flaws, secrets), a web of relationships to other characters, and a voice that governs how they speak and think. When you run a generation pass, the runtime does not simply narrate events from a single authorial perspective. Instead, it simulates each character as a separate agent, and the narrative emerges from their interactions — much like actors improvising within the structure of a script.

You, the writer, are the director. ActOne is your script notation. You set the stage (worlds and locations), cast the roles (characters with detailed profiles), block the scenes (scene definitions with objectives and atmosphere), and lay out the dramatic arc (plots with beats and turning points). The AI runtime then generates the actual prose, guided by all of those constraints.

This means ActOne is not a programming language in the traditional sense. There are no variables, no loops, no functions, no algorithms. It is a **declarative** language: you describe _what_ your story contains and _how_ its parts relate, and the runtime decides _how_ to turn that into narrative text.

<div class="callout callout-info">
<div class="callout-title">Info</div>
<p>ActOne files are plain text with the <code>.actone</code> extension. You can edit them in ActOne Studio (which provides syntax highlighting, auto-complete, and validation) or in any text editor.</p>
</div>

## Who Uses ActOne

ActOne is designed for people who work with narrative:

- **Fiction writers** who want to orchestrate AI-assisted story generation with precise control over character behavior, voice, and dramatic structure. Rather than prompting a generic AI and hoping for coherent output, you define the constraints that matter to your story and let the runtime generate within those boundaries.

- **Narrative designers** working on games, interactive fiction, or other branching-narrative media who need a structured format for defining characters, scenes, choice points, and consequences. ActOne's interaction system lets you model decision trees and their effects on the story.

- **Interactive storytelling creators** building experiences where multiple AI agents interact in real time — collaborative fiction platforms, AI-driven theater, narrative simulations, or experimental literary projects.

- **World-builders** developing rich fictional settings with many characters, factions, locations, and rules that need to stay consistent across a large body of work. ActOne's cross-reference system and validation rules catch inconsistencies before they reach the reader.

You do not need a programming background to use ActOne. The language reads like structured prose, and ActOne Studio provides visual feedback at every step. If you can write a character biography, you can write an ActOne file.

## The Simplest Valid Document

Every ActOne file is a **Document**. The simplest valid document is an empty file — technically legal, but not very useful. The simplest _meaningful_ document is a story with one character:

```actone
story "Hello World" {
  character "Alice" {
    bio: "A curious traveler.",
    voice: "Warm, informal, uses short declarative sentences.",
  }
}
```

That is a complete, valid ActOne file. It defines a story named `"Hello World"` containing one character named `"Alice"` who has a biography and a voice description. The commas after each property value are optional (they are permitted as trailing commas for readability), and the property order does not matter.

Let us break down the syntax:

- `story "Hello World"` declares a named story block. The name is a quoted string, which allows spaces and punctuation.
- The outer `{ }` braces enclose everything that belongs to this story.
- `character "Alice"` declares a named character inside the story. Again, the name is a quoted string.
- `bio: "A curious traveler."` is a property assignment. The keyword `bio` is followed by a colon, then a string value.
- `voice: "Warm, informal, uses short declarative sentences."` is another property assignment in the same format.

<div class="callout callout-tip">
<div class="callout-title">Tip</div>
<p>When you are experimenting or learning, start with a minimal file like this and add elements one at a time. ActOne Studio validates your file continuously, so you will see any errors immediately in the Problems panel as you build up your story.</p>
</div>

## A Realistic Full Example

Here is a more complete ActOne file that demonstrates several element types working together. This example describes a near-future story about a neuroscientist who discovers that her research institute is harvesting memories from comatose patients.

```actone
story "The Memory Thief" {

  // --- Generation settings ---
  generate {
    genre: "literary science fiction",
    tone: ["dark", "intimate", "clinical"],
    tense: Present,
    default_pov: ThirdLimited,
    pacing: Accelerating,
    temperature: 0.7,
    max_tokens: 4000,
    continuity_loss: 0.1,
    style_bleed: false,
    chapter_breaks: true,
  }

  // --- Themes ---
  theme "Memory and Identity" {
    statement: "We are nothing more than what we remember.",
    motifs: ["glass jars", "fading photographs", "handwriting"],
    counter: "Identity persists independent of memory.",
    tension: "Characters who lose memories discover they are still themselves — but changed.",
  }

  // --- Characters ---
  character "Lena Okafor" {
    nature: Human,
    bio: "A neuroscientist at the Caduceus Institute, specializing in memory consolidation during coma recovery. Brilliant, methodical, haunted by her mother's early-onset dementia.",
    role: "Lead researcher and reluctant whistleblower.",
    voice: "Precise, clinical vocabulary that cracks under emotional pressure. Interior monologue runs in fragments when stressed. Uses medical terminology as a defense mechanism.",
    personality: {
      curiosity: 90,
      empathy: 75,
      caution: 40,
      integrity: 85,
    },
    goals: [
      {
        goal: "Understand why Patient 23's memory patterns are being redirected.",
        priority: Primary,
        stakes: "If the memories are being harvested, every patient in the ward is at risk.",
      },
      {
        goal: "Protect her own research from being weaponized.",
        priority: Secondary,
        stakes: "A decade of work could be discredited or classified.",
      },
    ],
    conflicts: [
      "Her loyalty to the Institute versus her obligation to her patients.",
      "Her need to understand versus her fear of what she will find.",
    ],
    strengths: [
      "Analytical rigor — she can read a brain scan the way a musician reads a score.",
      "Deep patience with comatose patients others have given up on.",
    ],
    flaws: [
      "Avoids confrontation until the situation becomes critical.",
      "Tends to intellectualize grief rather than feeling it.",
    ],
    relationships: [
      {
        to: "Director Asante",
        label: "mentor turned adversary",
        weight: -30,
        history: "He recruited her out of graduate school. She owes her career to him.",
        dynamic: true,
      },
    ],
    arc: {
      description: "From obedient researcher to defiant whistleblower.",
      start: "Trusts the Institute implicitly, buries doubts in data.",
      catalyst: "Discovers a memory fragment from Patient 23 stored in a system she was never told about.",
      midpoint: "Realizes Director Asante has known about the harvesting program from the beginning.",
      turning_point: "Chooses to leak the data rather than accept a promotion to silence her.",
      end: "Publishes her findings. The Institute is dismantled. She is blacklisted but free.",
    },
    symbols: ["glass jars", "her mother's handwriting"],
    secret: "She has been taking an experimental memory-enhancement drug from the Institute's own supply.",
    notes: [
      "Her internal monologue should feel like a research journal — clinical surface, emotional undercurrent.",
      "When she finally confronts Asante, her voice should break from clinical to raw.",
    ],
  }

  character "Director Asante" {
    nature: Human,
    bio: "Founder and director of the Caduceus Institute. A charismatic neurosurgeon who believes the memories of the dying belong to science, not to individuals.",
    role: "Antagonist — the idealist whose idealism has curdled into exploitation.",
    voice: "Warm, paternal, persuasive. Uses 'we' instead of 'I'. Speaks in complete, measured paragraphs. Never raises his voice.",
    personality: {
      charisma: 95,
      empathy: 30,
      ambition: 90,
      ruthlessness: 70,
    },
    goals: [
      {
        goal: "Complete the memory archive before funding runs out.",
        priority: Primary,
        stakes: "Twenty years of work and the memories of three hundred patients.",
      },
      {
        goal: "Keep Lena loyal — or at least silent.",
        priority: Secondary,
        stakes: "She is the only researcher who could understand what the data means.",
      },
    ],
    secret: "His own memory is deteriorating. He has early-stage dementia and is using the harvested memories to supplement his own.",
  }

  // --- World ---
  world "Caduceus Institute" {
    period: "2041, Pacific Northwest",
    sensory: [
      "Fluorescent hum in every corridor",
      "Antiseptic smell layered over something faintly organic",
      "The soft beeping of patient monitors, never quite in sync",
    ],
    locations: [
      {
        name: "Memory Lab",
        description: "A windowless room lined with server racks and a single reclining chair wired to a neural interface. The air is cold and tastes of ozone.",
        atmosphere: {
          tension: 80,
          isolation: 70,
          clinical: 95,
        },
      },
      {
        name: "Patient Ward",
        description: "Thirty beds in soft blue light. The patients lie motionless, breathing in unison through ventilators. Monitors display scrolling waveforms that Lena can read like sentences.",
        atmosphere: {
          sorrow: 60,
          stillness: 90,
          unease: 40,
        },
      },
      {
        name: "Asante Office",
        description: "Walnut paneling, leather chairs, a wall of framed awards. A glass cabinet holds labeled jars of neural tissue samples. It looks like a Victorian study transplanted into a research hospital.",
        atmosphere: {
          authority: 85,
          menace: 50,
          warmth: 30,
        },
      },
    ],
    rules: [
      {
        rule: "Neural interfaces require a minimum four-hour calibration window before memory extraction begins.",
        category: Physical,
      },
      {
        rule: "All extracted memory data is classified under the Institute's proprietary research license.",
        category: Social,
      },
      {
        rule: "Memories degrade with each extraction pass. By the fifth pass, only emotional residue remains.",
        category: Narrative,
      },
    ],
  }

  // --- Scenes ---
  scene "The Anomaly" {
    type: Revelation,
    location: "Memory Lab",
    pov: "Lena Okafor",
    participants: ["Lena Okafor"],
    atmosphere: {
      tension: 70,
      curiosity: 85,
      dread: 40,
    },
    objective: "Lena discovers that Patient 23's memory data is being copied to an unauthorized storage system.",
    trigger: "A routine calibration check reveals a second data stream she has never seen before.",
    transition: Cut,
  }

  scene "The Confrontation" {
    type: Confrontation,
    location: "Asante Office",
    pov: "Lena Okafor",
    participants: ["Lena Okafor", "Director Asante"],
    atmosphere: {
      tension: 95,
      menace: 70,
      sorrow: 40,
    },
    objective: "Lena confronts Asante with the evidence. He offers her a promotion to keep her quiet.",
    trigger: "Lena has gathered enough data to prove the harvesting program exists.",
    transition: Fade,
  }

  // --- Plot ---
  plot "The Unraveling" {
    conflict_type: Interpersonal,
    resolution_pattern: Pyrrhic,
    beats: [
      {
        beat: "Lena begins a routine study of Patient 23's memory consolidation patterns.",
        act: 1,
        type: Setup,
      },
      {
        beat: "A calibration anomaly reveals a hidden data stream siphoning memory fragments.",
        act: 1,
        type: Inciting,
      },
      {
        beat: "Lena traces the data stream to a storage archive she was never given access to.",
        act: 2,
        type: Rising,
      },
      {
        beat: "She discovers the archive contains memories from every comatose patient in the ward.",
        act: 2,
        type: Midpoint,
      },
      {
        beat: "Asante offers Lena a promotion and full archive access in exchange for her silence.",
        act: 2,
        type: Complication,
      },
      {
        beat: "Lena leaks the data to a medical ethics board, knowing her career is over.",
        act: 3,
        type: Climax,
      },
      {
        beat: "The Institute is shut down. Lena is free but unemployable. The patients wake up — but with gaps.",
        act: 3,
        type: Resolution,
      },
    ],
    subplot "Asante Decline" : {
      description: "Asante's own dementia accelerates as his access to harvested memories is cut off.",
      beats: [
        "Asante misremembers a key detail during a board meeting.",
        "Lena notices Asante using the neural interface after hours.",
        "After the shutdown, Asante cannot remember why he built the Institute.",
      ],
      converges_at: "The Confrontation",
    },
  }
}
```

This example is syntactically valid ActOne. It demonstrates:

- A `generate` block that configures the AI runtime's behavior
- A `theme` with motifs, a counter-theme, and a tension directive
- Two `character` definitions with rich psychographic profiles, structured goals, a relationship between them, and a character arc
- A `world` with sensory details, three locations (each with atmosphere vectors), and categorized rules
- Two `scene` definitions with type, point of view, participants, atmosphere, and objectives
- A `plot` with structured beats assigned to acts, a conflict type, a resolution pattern, and a subplot

<div class="callout callout-tip">
<div class="callout-title">Tip</div>
<p>You do not need to write a file this detailed to get started. Every property in ActOne is optional except the element name. Start with the pieces that matter most to your story and add detail as the narrative develops. The example above represents a mature, production-ready story file.</p>
</div>

## Document Structure Overview

Every `.actone` file is parsed as a **Document**. Understanding the Document structure is the key to understanding how ActOne files are organized — whether you are writing a single file or splitting your story across many.

### The Document Root

A Document is the root of every `.actone` file. It can contain two things:

1. An optional **story block** — a named container declared with the `story` keyword
2. Zero or more **story elements** — standalone definitions at the top level of the file

In practice, this means a Document can look like any of these:

**A story block containing everything (single-file projects):**

```actone
story "My Novel" {
  character "Elena" {
    bio: "A retired detective.",
  }
  world "Ravenscroft" {
    period: "1920s England",
  }
  scene "Arrival" {
    objective: "Elena arrives at the manor.",
  }
}
```

**Standalone elements with no story block (multi-file projects):**

```actone
// This file might be called characters.actone
character "Elena" {
  bio: "A retired detective.",
}
character "Marcus" {
  bio: "The manor's enigmatic groundskeeper.",
}
```

**A story block plus standalone elements (also valid):**

```actone
story "My Novel" {
  generate {
    genre: "mystery",
    tense: Past,
  }
}

// Elements outside the story block
character "Elena" {
  bio: "A retired detective.",
}
```

All three forms are valid. The choice between them depends on how you want to organize your project.

### The Story Block

The `story` block is the named narrative container. It is declared with the `story` keyword followed by a quoted string name and a pair of braces:

```actone
story "The Memory Thief" {
  // story elements go here
}
```

In a single-file project, the story block typically wraps everything. In a multi-file project, there is usually one file (often `main.actone`) that contains the story block with the `generate` settings, and the remaining files contain standalone elements.

<div class="callout callout-info">
<div class="callout-title">Info</div>
<p>At most one <code>story</code> block should exist across all files in a project. If you define a <code>story</code> block in two different files, the validator will flag it as an error. The <code>story</code> block is optional in multi-file projects where elements are defined at the document root.</p>
</div>

### Story Elements

A **StoryElement** is any of the eight top-level constructs that define the substance of your narrative. They can appear inside a story block or at the document root:

| Element     | Keyword       | Purpose                                                                   |
| ----------- | ------------- | ------------------------------------------------------------------------- |
| Generate    | `generate`    | AI runtime configuration (temperature, genre, tone, tense, pacing)        |
| Theme       | `theme`       | Thematic declarations with motifs, counter-themes, and tension directives |
| Character   | `character`   | Autonomous agent definitions with psychographies, relationships, and arcs |
| World       | `world`       | Settings with locations, sensory palettes, and governing rules            |
| Timeline    | `timeline`    | Temporal structures for non-linear narratives                             |
| Scene       | `scene`       | Dramatic units with participants, atmosphere, and objectives              |
| Plot        | `plot`        | Macro-level narrative arcs with structured beats and subplots             |
| Interaction | `interaction` | Communication patterns between character groupings                        |

### Order Independence

Elements within a Document or a story block are **order-independent**. You can define a scene before the character it references, or a plot before the scenes it contains. The ActOne parser resolves all cross-references after the entire project is loaded, not as it reads each line.

This means you can organize your files in whatever order makes sense to your creative process:

```actone
// Perfectly valid: the scene references a character defined below it
scene "Opening" {
  participants: ["Lena Okafor"],
  objective: "Establish Lena's daily routine at the Institute.",
}

character "Lena Okafor" {
  bio: "A neuroscientist at the Caduceus Institute.",
}
```

<div class="callout callout-tip">
<div class="callout-title">Tip</div>
<p>Even though order does not matter to the parser, it matters to human readers. A common convention is to define characters first, then worlds, then scenes and plots. This mirrors the way most writers think: "who is in this story?" before "what happens?"</p>
</div>

### Single-File vs. Multi-File Projects

In a **single-file project**, everything lives inside one `.actone` file, usually wrapped in a story block. This is the simplest approach and works well for short stories, sketches, and learning exercises.

In a **multi-file project**, you split your definitions across multiple `.actone` files. Each file is a separate Document, and ActOne Studio combines them all into a unified story view. Cross-references work automatically across files — a scene in `scenes.actone` can reference a character defined in `characters.actone` without any import statements.

The key structural difference:

- In single-file projects, elements go **inside** the `story` block.
- In multi-file projects, elements typically go **at the document root** (outside any story block), with one file containing the story block for naming and generation settings.

For a full guide to organizing multi-file projects, see [Multi-File Projects](/user-guide/03-multi-file/).

## Data Types

ActOne uses a small set of data types to represent values. Understanding these types will help you read the syntax reference and write valid property values.

### ID

A bare identifier — a word that starts with a letter or underscore and contains only letters, digits, and underscores. IDs are used for property names, enumeration values, and simple element names.

Examples: `Elena`, `curiosity`, `tension`, `my_world`

IDs cannot contain spaces, hyphens, or special characters. If you need a name with spaces, use a STRING instead (see DefinitionName below).

### STRING

A quoted string enclosed in double quotes (`"`) or single quotes (`'`). Strings are used for names that contain spaces, biographical text, voice descriptions, objectives, and any other free-form text.

Examples: `"Elena Vasquez"`, `"A retired detective who cannot stop investigating."`, `'Present tense, second person.'`

Strings can contain any characters except the quote character used to delimit them. If your text contains double quotes, wrap it in single quotes, or vice versa.

### NUMBER

An integer or decimal number. Numbers are used for personality trait values, atmosphere mood entries, generation parameters, and act assignments.

Examples: `42`, `0.7`, `95`, `4000`

Numbers are always non-negative in their basic form. For values that can be negative, ActOne uses SignedInt (see below).

### SignedInt

A number that can be preceded by a minus sign. SignedInt is used specifically for **relationship weights**, where the range is -100 (bitter enemies) to +100 (soulmates).

Examples: `75`, `-30`, `0`, `-100`

The minus sign, when present, is written directly before the number with no space.

### BooleanLiteral

A true/false value, written as the bare keywords `true` or `false` (not quoted). Booleans are used for settings like `style_bleed`, `chapter_breaks`, and the `dynamic` flag on relationships.

Examples: `true`, `false`

### DefinitionName

This is not a separate data type but a **union** of ID and STRING. Anywhere ActOne expects a name for an element definition or a cross-reference, you can use either a bare ID or a quoted string.

This is what allows names with spaces:

```actone
// Using an ID (no spaces)
character Elena {
  bio: "A retired detective.",
}

// Using a STRING (spaces allowed)
character "Elena Vasquez" {
  bio: "A retired detective.",
}
```

Both forms are valid. When you use a quoted string as a name, any cross-reference to that element must also use the same quoted string:

```actone
// If the character is named with a STRING...
character "Elena Vasquez" {
  bio: "A retired detective.",
}

// ...then references must use the same STRING
scene "Opening" {
  participants: ["Elena Vasquez"],
}
```

<div class="callout callout-tip">
<div class="callout-title">Tip</div>
<p>For character names with spaces (which is most character names), use quoted strings consistently. For simple, single-word identifiers like world names or theme names, bare IDs work well and save typing. Pick a convention and stick with it within your project.</p>
</div>

## Comments

ActOne supports two styles of comments, both of which are ignored by the parser and the AI runtime. Use comments to leave notes for yourself, explain design decisions, or temporarily disable parts of your file.

### Single-Line Comments

A single-line comment starts with `//` and extends to the end of the line:

```actone
// This is a comment
character "Elena" {
  bio: "A retired detective.",  // inline comment after a property
}
```

### Multi-Line Comments

A multi-line comment starts with `/*` and ends with `*/`. Everything between the delimiters is ignored, even if it spans many lines:

```actone
/*
  This entire block is a comment.
  It can span as many lines as you need.
  Useful for temporarily disabling a large section of your file.
*/
character "Elena" {
  bio: "A retired detective.",
}
```

<div class="callout callout-tip">
<div class="callout-title">Tip</div>
<p>Comments are a good place to record your intentions for a character, scene, or plot point that you have not yet fleshed out. Write a comment like <code>// TODO: add Elena's relationship to Marcus once I figure out their history</code> and come back to it later. The Problems panel will not flag missing properties, so comments serve as your personal reminder system.</p>
</div>

## Enumerations: Named Choices

Many properties in ActOne accept a value from a fixed set of options. These are called **enumerations** (or enums). Enumeration values are written as bare keywords — no quotes — and are case-sensitive.

Here are some examples you will encounter frequently:

**Character nature** — the ontological type of a character:
`Human`, `Force`, `Concept`, `Animal`, `Spirit`, `Collective`, `Environment`

**Scene type** — the dramatic function of a scene:
`Action`, `Dialogue`, `Reflection`, `Montage`, `Revelation`, `Confrontation`, `Transition`, `Climax`

**Tense** — the narrative tense:
`Past`, `Present`, `Future`

**Point of view** — the narrative perspective:
`FirstPerson`, `SecondPerson`, `ThirdLimited`, `ThirdOmniscient`

**Pacing** — the narrative rhythm:
`Slow`, `Measured`, `Moderate`, `Brisk`, `Accelerating`

**Transition type** — how one scene connects to the next:
`Cut`, `Dissolve`, `Flashback`, `FlashForward`, `Parallel`, `Smash`, `Fade`, `Montage`

**Rule category** — the domain a world rule governs:
`Physical`, `Social`, `Metaphysical`, `Narrative`, `Psychological`

You will find the complete list of enumerations for each element in the [Element Reference](/language-reference/03-element-reference/).

## Property Syntax

Most properties in ActOne follow the same pattern:

```
keyword: value,
```

The keyword identifies the property (e.g., `bio`, `voice`, `tension`). The colon separates the keyword from the value. The trailing comma is always optional — you can include it for visual consistency or leave it off.

Values come in several shapes depending on the property:

**Simple values** — a single string, number, boolean, or enumeration:

```actone
bio: "A retired detective.",
temperature: 0.7,
style_bleed: false,
tense: Present,
```

**Arrays** — a list of values enclosed in square brackets, separated by commas:

```actone
conflicts: [
  "Her loyalty to the Institute versus her obligation to her patients.",
  "Her need to understand versus her fear of what she will find.",
],
```

**Objects** — a set of properties enclosed in curly braces:

```actone
personality: {
  curiosity: 90,
  empathy: 75,
  caution: 40,
},
```

**Arrays of objects** — a list where each item is an object:

```actone
goals: [
  {
    goal: "Understand why Patient 23's memory patterns are being redirected.",
    priority: Primary,
    stakes: "If the memories are being harvested, every patient in the ward is at risk.",
  },
  {
    goal: "Protect her own research from being weaponized.",
    priority: Secondary,
  },
],
```

This consistent structure means that once you learn how one property works, you can read any property in the language.

## Trailing Commas

ActOne allows a trailing comma after the last item in any list or after any property value. Both of these are valid:

```actone
// With trailing commas
conflicts: [
  "Loyalty vs. obligation.",
  "Curiosity vs. fear.",
],

// Without trailing commas
conflicts: [
  "Loyalty vs. obligation.",
  "Curiosity vs. fear."
]
```

The trailing comma is purely a matter of style. Many writers prefer to include it because it makes it easier to add new items later without editing the previous line. Choose whichever style you find more readable and be consistent within your project.

## What's Next

This page has covered the foundations: what ActOne is, how documents are structured, and what types of data the language uses. From here, you have two paths depending on what you need:

- **[Syntax Reference](/language-reference/02-syntax-reference/)** — A complete listing of every keyword, enumeration value, and structural rule in the ActOne language. Go here when you need to look up exact syntax or check whether a particular keyword exists.

- **[Element Reference](/language-reference/03-element-reference/)** — Detailed documentation for each element type (character, world, scene, plot, theme, timeline, interaction, generate). Go here when you want to understand all the properties available for a specific element and how they affect generation.

If you have not yet written your first ActOne file, you may want to work through [Your First Story](/getting-started/04-first-story/) before diving into the reference material. The tutorial gives you hands-on experience with the Studio that will make the reference pages easier to navigate.
