---
title: Syntax Reference
order: 2
description: Complete reference for every ActOne keyword, data type, and syntax rule.
---

This page is a complete reference for every keyword, data type, enum value, and syntax rule in the ActOne language. Use it when you need to check the exact spelling of a keyword, the valid values for a property, or the rules for naming elements.

For a conceptual overview of how these pieces fit together, see [Core Concepts](/getting-started/02-core-concepts/). For detailed property listings organized by element type, see the [Element Reference](/language-reference/03-element-reference/).

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>Keep this page bookmarked. It is the single source of truth for "What can I write here?" questions. If you are ever unsure whether a keyword or value is valid, search this page first.</p>
</div>

---

<h2 id="file-structure">File Structure</h2>

Every ActOne source file (with the `.act` extension) is a **document**. A document can contain either:

- A single `story` block that wraps all elements, or
- Top-level elements defined without a wrapping `story` block (used in multi-file projects).

A single-file project typically uses the `story` wrapper:

```actone
story "The Morning Tiger" {
  character Elena { ... }
  world Cascadia { ... }
  scene Awakening { ... }
}
```

In a multi-file project, elements live at the top level of each file and share a common scope across the project:

```actone
// characters.act
character Elena { ... }
character Marcus { ... }

// scenes.act
scene Awakening { ... }
scene Confrontation { ... }
```

<div class="callout callout-info">
<p class="callout-title">Info</p>
<p>At most one <code>story</code> block is permitted per project. If your project uses multiple files, either place the <code>story</code> block in one file and leave the others as top-level elements, or omit the <code>story</code> block entirely. See <a href="/user-guide/03-multi-file/">Multi-File Projects</a> for details.</p>
</div>

---

<h2 id="comments">Comments</h2>

ActOne supports two comment styles, both of which are ignored by the parser and the AI runtime.

**Single-line comments** begin with `//` and extend to the end of the line:

```actone
// This is a comment
character Elena {  // inline comment
  bio: "A retired detective"
}
```

**Multi-line comments** are enclosed between `/*` and `*/` and can span any number of lines:

```actone
/*
  This character was inspired by a real person.
  Revise the bio before sharing externally.
*/
character Elena {
  bio: "A retired detective"
}
```

Use comments to leave notes for yourself, annotate design decisions, or temporarily disable parts of your story without deleting them.

---

<h2 id="data-types">Data Types</h2>

Every property value in ActOne has a type. The language uses five fundamental data types.

<h3 id="identifiers">Identifiers (ID)</h3>

A bare identifier is an unquoted name that starts with a letter or underscore, followed by any combination of letters, digits, and underscores. Identifiers cannot contain spaces or special characters.

```actone
Elena
MyWorld
tension_rises
_hidden
act2_scene1
```

Identifiers are used for element names, property names, and cross-references when the name contains no spaces.

<h3 id="strings">Strings (STRING)</h3>

A string is text enclosed in either double quotes or single quotes. Strings are required when a value contains spaces, punctuation, or other characters not allowed in bare identifiers.

```actone
"Elena Vasquez"
"A retired detective haunted by an unsolved case."
'The Morning Tiger'
```

Double quotes and single quotes are interchangeable. Choose whichever style you prefer, but be consistent within a file.

<h3 id="numbers">Numbers (NUMBER)</h3>

Numbers are integers or decimal values. They are used for personality traits, atmosphere values, generation settings, and other numeric properties.

```actone
75
0.8
100
3.14
```

<h3 id="signed-integers">Signed Integers (SignedInt)</h3>

A signed integer is a number that may be preceded by a minus sign. This type is used specifically for relationship weights, which range from -100 (strongest animosity) to +100 (strongest bond).

```actone
weight: 85
weight: -40
weight: 0
```

<h3 id="booleans">Booleans (BooleanLiteral)</h3>

Boolean values are either `true` or `false`. They are used for properties that are on/off toggles, such as the `dynamic` property on relationships and the `chapter_breaks` setting.

```actone
dynamic: true
chapter_breaks: false
```

---

<h2 id="naming-rules">Naming Rules</h2>

Every element in ActOne has a name. How you write that name depends on whether it contains spaces.

<h3 id="bare-names">Bare Names</h3>

If the name is a single word (or multiple words joined by underscores), write it as a bare identifier with no quotes:

```actone
character Elena { ... }
world Cascadia { ... }
scene tension_rises { ... }
```

<h3 id="quoted-names">Quoted Names</h3>

If the name contains spaces, punctuation, or other special characters, enclose it in double or single quotes:

```actone
character "Elena Vasquez" { ... }
story "The Morning Tiger" { ... }
scene "The Reckoning" { ... }
```

<div class="callout callout-warning">
<p class="callout-title">Warning</p>
<p>When a name is defined with quotes, every cross-reference to that name must also use the quoted form. If you define <code>character "Elena Vasquez"</code>, then a scene's participants list must reference <code>"Elena Vasquez"</code>, not <code>Elena</code> or <code>Elena_Vasquez</code>. The validator will flag unresolved references if the forms do not match.</p>
</div>

<h3 id="definition-names">Definition Names (DefinitionName)</h3>

In the grammar, element names use the **DefinitionName** type, which accepts either a bare identifier or a quoted string. This means you can always choose whichever form suits your naming style:

```actone
// Both are valid
character Elena { ... }
character "Elena" { ... }

// But if the name has spaces, quotes are required
character "Elena Vasquez" { ... }
```

---

<h2 id="declaration-keywords">Declaration Keywords</h2>

Declaration keywords define the top-level building blocks of your story. Each one creates a named element with its own set of properties enclosed in curly braces.

<h3 id="story-keyword">story</h3>

The optional top-level container for a single-file project. Wraps all other elements.

```actone
story "The Morning Tiger" {
  // all elements go here
}
```

In multi-file projects, the `story` block is optional. If present, it may only appear once across all files.

<h3 id="character-keyword">character</h3>

Defines a character or agent in your narrative. Characters are the most property-rich element type and serve as the primary agents the AI runtime embodies during generation.

```actone
character "Elena Vasquez" {
  nature: Human
  bio: "A retired detective haunted by an unsolved case."
  role: "Protagonist who unravels the central mystery."
  voice: "Clipped sentences. Dry humor. Never wastes a word."
}
```

<h3 id="world-keyword">world</h3>

Defines the setting of your story, including named locations, world rules, time period, and sensory palette.

```actone
world Cascadia {
  period: "Pacific Northwest, present day"
  sensory: "Damp cedar, grey skies, coffee steam, distant foghorns"
  locations { ... }
  rules { ... }
}
```

<h3 id="scene-keyword">scene</h3>

Defines a narrative unit where characters interact in a specific location. Scenes are the primary units that the AI runtime expands into generated prose.

```actone
scene "The Reckoning" {
  type: Confrontation
  location: Cascadia.Lighthouse
  participants: ["Elena Vasquez", Marcus]
  objective: "Elena confronts Marcus about the missing evidence."
}
```

<h3 id="timeline-keyword">timeline</h3>

Defines the temporal structure of your narrative. Timelines are essential for non-linear, parallel, or multi-generational stories.

```actone
timeline MainTimeline {
  structure: Nonlinear
  span: "Three generations, 1920-2020"
  layers {
    layer Past {
      description: "The grandmother's era"
      period: "1920-1950"
    }
    layer Present {
      description: "The protagonist's era"
      period: "2010-2020"
    }
  }
}
```

<h3 id="plot-keyword">plot</h3>

Defines the macro-level narrative arc of your story, composed of sequential beats and optional subplots.

```actone
plot MainArc {
  conflict_type: Interpersonal
  resolution_pattern: Transformative
  beats {
    beat "Ordinary World" { type: Setup, act: 1 }
    beat "The Discovery" { type: Inciting, act: 1 }
    beat "Point of No Return" { type: Midpoint, act: 2 }
    beat "Final Stand" { type: Climax, act: 3 }
    beat "New Dawn" { type: Resolution, act: 3 }
  }
}
```

<h3 id="subplot-keyword">subplot</h3>

Defines a secondary plot thread within a `plot` block. Subplots have their own beats and can converge with the main plot at a specified scene.

```actone
plot MainArc {
  beats { ... }
  subplot "Elena's Past" {
    description: "Elena slowly uncovers her own connection to the case."
    beats {
      beat "Old Photo" { type: Setup, act: 1 }
      beat "Memory Returns" { type: Revelation, act: 2 }
    }
    converges_at: "The Reckoning"
  }
}
```

<h3 id="theme-keyword">theme</h3>

Declares a story-level thematic proposition that guides the AI runtime's semantic choices.

```actone
theme "Memory and Identity" {
  statement: "We are not who we remember being."
  motifs: ["cracked mirrors", "old photographs", "fog"]
  counter: "The past can be rewritten, but truth endures."
  tension: "Characters cling to false memories while evidence contradicts them."
}
```

<h3 id="interaction-keyword">interaction</h3>

Defines how a specific grouping of characters communicates — the rhythm, subtext, and power dynamics of their exchanges.

```actone
interaction "Elena and Marcus" {
  participants: ["Elena Vasquez", Marcus]
  pattern: "greeting -> tension -> accusation -> deflection -> revelation"
  style_mix: "Elena is terse; Marcus is expansive and evasive."
  subtext: "Both know more than they are saying."
  power_dynamic: "Elena holds moral authority; Marcus holds information."
  emotional_arc: "Guarded respect dissolves into open hostility."
}
```

<h3 id="generate-keyword">generate</h3>

Configures global AI generation settings for the entire project. Only one `generate` block is permitted per project.

```actone
generate Settings {
  temperature: 0.8
  max_tokens: 4000
  genre: "Literary mystery"
  tone: "Atmospheric and melancholic"
  tense: Past
  default_pov: ThirdLimited
  pacing: Measured
  chapter_breaks: true
}
```

---

<h2 id="character-properties">Character Properties</h2>

The `character` element supports the richest set of properties in the language. Each property contributes a different dimension to how the AI runtime embodies the character.

| Keyword         | Type                         | Description                                                |
| --------------- | ---------------------------- | ---------------------------------------------------------- |
| `nature`        | CharacterNature enum         | The ontological type of the character (Human, Force, etc.) |
| `bio`           | STRING                       | Biographical summary — backstory, history, and context     |
| `role`          | STRING                       | The character's narrative function in the story            |
| `personality`   | Block of trait: NUMBER       | Named numeric traits (0-100) that parameterize behavior    |
| `voice`         | STRING                       | How the character speaks, thinks, and expresses themselves |
| `quirks`        | STRING list                  | Distinctive habits, mannerisms, or behavioral tics         |
| `goals`         | List of goal entries         | Structured objectives with priority and stakes             |
| `conflicts`     | STRING                       | The character's central internal or external conflict      |
| `strengths`     | STRING list                  | What the character excels at                               |
| `flaws`         | STRING list                  | Weaknesses, blind spots, or destructive tendencies         |
| `relationships` | List of relationship entries | Directed connections to other characters                   |
| `arc`           | Block of arc sub-properties  | How the character transforms across the story              |
| `symbols`       | STRING list                  | Recurring images or objects associated with this character |
| `secret`        | STRING                       | Something the character conceals from others               |
| `notes`         | STRING                       | Freeform author notes (not used in generation)             |

```actone
character "Elena Vasquez" {
  nature: Human
  bio: "A retired detective who left the force after failing to solve a disappearance."
  role: "Protagonist"
  voice: "Short, blunt sentences. Avoids emotional language. Dry humor under pressure."
  quirks: ["taps her ring finger when thinking", "never sits with her back to a door"]
  conflicts: "Cannot forgive herself for the case she abandoned."
  strengths: ["Pattern recognition", "Unflinching honesty"]
  flaws: ["Emotional avoidance", "Refuses to ask for help"]
  symbols: ["cracked reading glasses", "a red notebook"]
  secret: "She knew the missing person."
  notes: "Inspired by classic noir detectives but updated for a modern setting."
  personality {
    determination: 90
    empathy: 55
    impulsiveness: 25
    skepticism: 80
  }
  goals {
    goal "Solve the cold case" { priority: Primary, stakes: "Her sanity and self-worth" }
    goal "Reconnect with her estranged daughter" { priority: Secondary, stakes: "Dying alone" }
    goal "Protect the truth about the victim" { priority: Hidden, stakes: "Her own freedom" }
  }
  relationships {
    relationship Marcus {
      to: Marcus
      weight: -20
      label: "Former partner, now adversary"
      history: "They worked together for ten years before the falling out."
      dynamic: true
    }
  }
  arc {
    description: "From guilt-driven isolation to reluctant connection."
    start: "Withdrawn, self-punishing, living in the past."
    end: "Accepts imperfection and re-engages with the living."
    catalyst: "A new witness surfaces who saw what happened that night."
    midpoint: "Elena realizes she has been protecting the wrong person."
    turning_point: "She chooses to tell the truth, even though it incriminates her."
  }
}
```

<h3 id="arc-sub-properties">Arc Sub-properties</h3>

The `arc` block inside a character defines the trajectory of transformation.

| Keyword         | Type   | Description                                         |
| --------------- | ------ | --------------------------------------------------- |
| `description`   | STRING | Overall summary of the character's arc              |
| `start`         | STRING | The character's state at the beginning of the story |
| `end`           | STRING | The character's state at the end of the story       |
| `catalyst`      | STRING | The external event that disrupts the status quo     |
| `midpoint`      | STRING | The pivotal shift at the story's midpoint           |
| `turning_point` | STRING | The moment of irrevocable internal change           |

<h3 id="goal-sub-properties">Goal Sub-properties</h3>

Each entry in the `goals` list is a structured objective.

| Keyword    | Type              | Description                                |
| ---------- | ----------------- | ------------------------------------------ |
| `goal`     | DefinitionName    | The name/description of the goal           |
| `priority` | GoalPriority enum | How central this goal is to the character  |
| `stakes`   | STRING            | What the character loses if the goal fails |

<h3 id="relationship-sub-properties">Relationship Sub-properties</h3>

Each entry in the `relationships` list defines a directed connection to another character.

| Keyword   | Type                     | Description                                                |
| --------- | ------------------------ | ---------------------------------------------------------- |
| `to`      | Cross-reference          | The target character (must match a defined character name) |
| `weight`  | SignedInt (-100 to +100) | Strength and polarity of the bond                          |
| `label`   | STRING                   | A short description of the relationship                    |
| `history` | STRING                   | Shared backstory between the two characters                |
| `dynamic` | BooleanLiteral           | Whether the relationship changes during the story          |

---

<h2 id="world-properties">World Properties</h2>

The `world` element defines the setting and governing constraints of your narrative.

| Keyword     | Type                      | Description                                          |
| ----------- | ------------------------- | ---------------------------------------------------- |
| `period`    | STRING                    | The time period or era of the world                  |
| `sensory`   | STRING                    | Dominant sensory qualities of the world's atmosphere |
| `locations` | Block of location entries | Named places within the world                        |
| `rules`     | Block of rule entries     | Governing constraints and laws                       |

<h3 id="location-sub-properties">Location Sub-properties</h3>

Each entry in the `locations` block defines a named place.

| Keyword       | Type                   | Description                               |
| ------------- | ---------------------- | ----------------------------------------- |
| `name`        | DefinitionName         | The name of the location                  |
| `description` | STRING                 | What the location looks and feels like    |
| `atmosphere`  | Block of trait: NUMBER | Mood vector (named numeric values, 0-100) |
| `connects_to` | ID list or STRING list | Other locations this place is adjacent to |

```actone
world Cascadia {
  period: "Pacific Northwest, present day"
  sensory: "Damp cedar, grey skies, coffee steam, distant foghorns"
  locations {
    location Lighthouse {
      description: "An abandoned lighthouse on a rocky headland."
      atmosphere {
        isolation: 90
        tension: 70
        beauty: 60
      }
      connects_to: [Docks, CliffTrail]
    }
    location Docks {
      description: "A working fishing dock with peeling paint and diesel fumes."
      atmosphere {
        grit: 80
        activity: 65
      }
    }
  }
  rules {
    rule "Fog rolls in every evening at dusk" { category: Physical }
    rule "Outsiders are treated with polite suspicion" { category: Social }
  }
}
```

<h3 id="rule-sub-properties">Rule Sub-properties</h3>

Each entry in the `rules` block defines a governing constraint.

| Keyword    | Type              | Description                     |
| ---------- | ----------------- | ------------------------------- |
| `rule`     | DefinitionName    | Description of the rule         |
| `category` | RuleCategory enum | What domain the rule applies to |

---

<h2 id="scene-properties">Scene Properties</h2>

The `scene` element defines a narrative unit where characters interact.

| Keyword        | Type                            | Description                                                   |
| -------------- | ------------------------------- | ------------------------------------------------------------- |
| `type`         | SceneType enum                  | The kind of narrative work this scene performs                |
| `location`     | Cross-reference                 | Where the scene takes place (World.Location or bare Location) |
| `pov`          | PovType enum or cross-reference | Narrative perspective (or a character name for limited POV)   |
| `layer`        | Cross-reference                 | Which timeline layer this scene belongs to                    |
| `participants` | List of cross-references        | Characters present in the scene                               |
| `atmosphere`   | STRING                          | The emotional tone of the scene                               |
| `objective`    | STRING                          | What the scene must accomplish narratively                    |
| `trigger`      | STRING                          | What event or condition causes this scene to occur            |
| `transition`   | TransitionType enum             | How this scene connects to the next                           |

```actone
scene "The Reckoning" {
  type: Confrontation
  location: Cascadia.Lighthouse
  pov: "Elena Vasquez"
  layer: Present
  participants: ["Elena Vasquez", Marcus]
  atmosphere: "Thick with unspoken accusation; wind howling outside"
  objective: "Elena forces Marcus to admit what he saw that night."
  trigger: "Elena finds the old logbook in the lighthouse keeper's desk."
  transition: Smash
}
```

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>The <code>pov</code> property can take either an enum value like <code>ThirdOmniscient</code> or a character name like <code>"Elena Vasquez"</code>. When you use a character name, the runtime generates from that character's perspective using their voice and personality settings.</p>
</div>

---

<h2 id="timeline-properties">Timeline Properties</h2>

The `timeline` element defines how time is organized in your story.

| Keyword     | Type                   | Description                                  |
| ----------- | ---------------------- | -------------------------------------------- |
| `structure` | TimelineStructure enum | How time is organized across the narrative   |
| `span`      | STRING                 | The temporal extent of the story             |
| `layers`    | Block of layer entries | Named time periods that scenes can reference |

<h3 id="layer-sub-properties">Layer Sub-properties</h3>

Each entry in the `layers` block defines a named temporal stratum.

| Keyword       | Type           | Description                       |
| ------------- | -------------- | --------------------------------- |
| `name`        | DefinitionName | The name of the layer             |
| `description` | STRING         | What this time period represents  |
| `period`      | STRING         | The specific dates or era covered |

```actone
timeline StoryTime {
  structure: Parallel
  span: "Two weeks in the present, interwoven with memories from twenty years ago"
  layers {
    layer Present {
      description: "The investigation unfolds"
      period: "October 2023"
    }
    layer Memory {
      description: "Fragments of the original disappearance"
      period: "Summer 2003"
    }
  }
}
```

---

<h2 id="plot-properties">Plot Properties</h2>

The `plot` element structures the macro-level narrative arc.

| Keyword              | Type                   | Description                          |
| -------------------- | ---------------------- | ------------------------------------ |
| `beats`              | Block of beat entries  | The sequence of story steps          |
| `conflict_type`      | ConflictType enum      | The category of central conflict     |
| `resolution_pattern` | ResolutionPattern enum | How the conflict ultimately resolves |

<h3 id="beat-sub-properties">Beat Sub-properties</h3>

Each entry in the `beats` block defines one story step.

| Keyword | Type           | Description                                           |
| ------- | -------------- | ----------------------------------------------------- |
| `beat`  | DefinitionName | The name of the beat                                  |
| `act`   | NUMBER         | Which act this beat belongs to (typically 1, 2, or 3) |
| `type`  | BeatType enum  | The structural role of this beat                      |

<h3 id="subplot-sub-properties">Subplot Sub-properties</h3>

A `subplot` block inside a `plot` defines a secondary thread.

| Keyword        | Type                  | Description                                            |
| -------------- | --------------------- | ------------------------------------------------------ |
| `description`  | STRING                | What this subplot is about                             |
| `beats`        | Block of beat entries | The subplot's own sequence of beats                    |
| `converges_at` | Cross-reference       | The scene where this subplot merges with the main plot |

```actone
plot MainArc {
  conflict_type: Interpersonal
  resolution_pattern: Ambiguous
  beats {
    beat "Discovery" { type: Inciting, act: 1 }
    beat "Deepening Mystery" { type: Rising, act: 2 }
    beat "The Truth" { type: Climax, act: 3 }
    beat "Aftermath" { type: Denouement, act: 3 }
  }
  subplot "Family Secret" {
    description: "Elena uncovers her family's hidden connection to the victim."
    beats {
      beat "Old Photograph" { type: Setup, act: 1 }
      beat "Mother's Confession" { type: Revelation, act: 2 }
    }
    converges_at: "The Reckoning"
  }
}
```

---

<h2 id="interaction-properties">Interaction Properties</h2>

The `interaction` element defines how a specific group of characters communicates.

| Keyword         | Type                     | Description                                             |
| --------------- | ------------------------ | ------------------------------------------------------- |
| `participants`  | List of cross-references | The characters involved in this interaction             |
| `pattern`       | STRING                   | The emotional sequence of the exchange (arrow notation) |
| `style_mix`     | STRING                   | How each character's voice blends or contrasts          |
| `subtext`       | STRING                   | What is really being communicated beneath the surface   |
| `power_dynamic` | STRING                   | Who holds leverage and how it shifts                    |
| `emotional_arc` | STRING                   | How the emotional register changes across the exchange  |

```actone
interaction "Interrogation" {
  participants: ["Elena Vasquez", Marcus]
  pattern: "calm inquiry -> evasion -> pressure -> crack -> confession"
  style_mix: "Elena is surgically precise; Marcus is folksy and deflecting."
  subtext: "Elena already knows the answer. She needs Marcus to say it."
  power_dynamic: "Elena controls the pace; Marcus controls the information."
  emotional_arc: "Professional distance gives way to raw emotion on both sides."
}
```

---

<h2 id="theme-properties">Theme Properties</h2>

The `theme` element declares a thematic proposition for the story.

| Keyword     | Type        | Description                                |
| ----------- | ----------- | ------------------------------------------ |
| `statement` | STRING      | The thematic proposition in plain language |
| `motifs`    | STRING list | Recurring images, objects, or patterns     |
| `counter`   | STRING      | The opposing thematic force                |
| `tension`   | STRING      | How the theme creates narrative conflict   |

```actone
theme "Justice vs. Mercy" {
  statement: "True justice requires understanding, not punishment."
  motifs: ["scales", "blindfolds", "open hands"]
  counter: "Some acts are unforgivable and demand consequences."
  tension: "Elena must choose between exposing the truth and protecting someone she loves."
}
```

---

<h2 id="generate-properties">Generate Settings</h2>

The `generate` element configures global AI generation parameters. Only one is permitted per project.

| Keyword           | Type            | Description                                                   |
| ----------------- | --------------- | ------------------------------------------------------------- |
| `temperature`     | NUMBER          | Creativity dial (0.0 = deterministic, 1.0+ = highly creative) |
| `max_tokens`      | NUMBER          | Maximum length of generated output                            |
| `continuity_loss` | NUMBER          | How much the AI may deviate from established continuity       |
| `style_bleed`     | NUMBER          | How much one character's voice may bleed into another's       |
| `genre`           | STRING          | The genre classification for the story                        |
| `tone`            | STRING          | The overall emotional register                                |
| `tense`           | TenseType enum  | Narrative tense for generated prose                           |
| `default_pov`     | PovType enum    | Default point of view when scenes do not specify one          |
| `pacing`          | PacingType enum | The default narrative pacing                                  |
| `chapter_breaks`  | BooleanLiteral  | Whether to insert chapter breaks in output                    |

```actone
generate Settings {
  temperature: 0.7
  max_tokens: 5000
  continuity_loss: 0.1
  style_bleed: 0.05
  genre: "Noir mystery"
  tone: "Atmospheric, melancholic, with moments of dark humor"
  tense: Past
  default_pov: ThirdLimited
  pacing: Measured
  chapter_breaks: true
}
```

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>Start with a <code>temperature</code> of 0.7 and a <code>style_bleed</code> of 0.05. Increase temperature if you want more surprising prose. Increase style_bleed if you want characters to influence each other's speech patterns (useful for scenes where characters have spent years together).</p>
</div>

---

<h2 id="enum-types">Enum Types</h2>

Enum types are fixed sets of valid values. When a property expects an enum type, you must use one of the values listed below exactly as spelled (they are case-sensitive). Enum values are written as bare identifiers, without quotes.

<h3 id="character-nature-enum">CharacterNature</h3>

The ontological type of a character. Set with the `nature` property.

| Value         | Meaning                                                               |
| ------------- | --------------------------------------------------------------------- |
| `Human`       | A realistic human character                                           |
| `Force`       | An abstract force (e.g., fate, war, bureaucracy)                      |
| `Concept`     | A personified idea (e.g., grief, justice, time)                       |
| `Animal`      | A non-human animal character                                          |
| `Spirit`      | A supernatural or spiritual entity                                    |
| `Collective`  | A group acting as a single agent (e.g., a mob, a committee)           |
| `Environment` | The setting itself as an active character (e.g., the ocean, the city) |

```actone
character "The Sea" {
  nature: Environment
  bio: "The Pacific coastline — unpredictable, indifferent, beautiful."
  voice: "Described through sensory detail, never direct speech."
}
```

<h3 id="goal-priority-enum">GoalPriority</h3>

How central a goal is to the character's motivations. Set with the `priority` property inside a goal entry.

| Value       | Meaning                                                                  |
| ----------- | ------------------------------------------------------------------------ |
| `Primary`   | The character's main driving objective                                   |
| `Secondary` | An important but subordinate objective                                   |
| `Hidden`    | A goal the character conceals from others (and possibly from themselves) |

<h3 id="rule-category-enum">RuleCategory</h3>

The domain a world rule applies to. Set with the `category` property inside a rule entry.

| Value           | Meaning                                                   |
| --------------- | --------------------------------------------------------- |
| `Physical`      | Laws of nature, physics, geography, climate               |
| `Social`        | Cultural norms, customs, power structures                 |
| `Metaphysical`  | Supernatural laws, magic systems, cosmology               |
| `Narrative`     | Meta-level rules about how the story operates             |
| `Psychological` | Rules governing how minds and emotions work in this world |

```actone
rules {
  rule "Magic requires a physical sacrifice" { category: Metaphysical }
  rule "The eldest child inherits all debts" { category: Social }
  rule "No character can lie in the presence of the Oracle" { category: Narrative }
}
```

<h3 id="timeline-structure-enum">TimelineStructure</h3>

How time is organized across the narrative. Set with the `structure` property on a timeline.

| Value       | Meaning                                                  |
| ----------- | -------------------------------------------------------- |
| `Linear`    | Events proceed in chronological order                    |
| `Nonlinear` | Events are presented out of chronological order          |
| `Parallel`  | Two or more timelines run simultaneously                 |
| `Collapsed` | Past and present are interwoven without clear separation |
| `Cyclical`  | Events repeat in a loop or spiral pattern                |
| `Reverse`   | Events are presented in reverse chronological order      |

<h3 id="scene-type-enum">SceneType</h3>

What kind of narrative work a scene performs. Set with the `type` property on a scene.

| Value           | Meaning                                   |
| --------------- | ----------------------------------------- |
| `Action`        | Physical movement, chase, fight, escape   |
| `Dialogue`      | Conversation-driven scene                 |
| `Reflection`    | Interior monologue, contemplation, memory |
| `Montage`       | Compressed sequence of events across time |
| `Revelation`    | A secret or truth comes to light          |
| `Confrontation` | Direct conflict between characters        |
| `Transition`    | A bridge between major story beats        |
| `Climax`        | The scene of highest dramatic intensity   |

<h3 id="pov-type-enum">PovType</h3>

The narrative perspective. Set with the `default_pov` property on a generate block, or the `pov` property on a scene.

| Value             | Meaning                                                                 |
| ----------------- | ----------------------------------------------------------------------- |
| `FirstPerson`     | Narrated by "I" — the viewpoint character tells the story               |
| `SecondPerson`    | Narrated by "you" — the reader is addressed directly                    |
| `ThirdLimited`    | Narrated by "he/she/they" — limited to one character's perceptions      |
| `ThirdOmniscient` | Narrated by "he/she/they" — the narrator knows all characters' thoughts |
| `Omniscient`      | Scene-level variant of omniscient narration (available on scenes only)  |

<div class="callout callout-info">
<p class="callout-title">Info</p>
<p>The <code>pov</code> property on a scene can also accept a character name instead of an enum value. When you write <code>pov: "Elena Vasquez"</code>, the scene is generated from Elena's perspective using her voice and personality settings, effectively functioning as a named third-person-limited viewpoint.</p>
</div>

<h3 id="pacing-type-enum">PacingType</h3>

The narrative pacing. Set with the `pacing` property on a generate block.

| Value          | Meaning                                         |
| -------------- | ----------------------------------------------- |
| `Slow`         | Deliberate, lingering, detail-rich prose        |
| `Measured`     | Steady and controlled, with room for reflection |
| `Moderate`     | Balanced between detail and momentum            |
| `Brisk`        | Quick-moving, focused on action and dialogue    |
| `Accelerating` | Pacing increases toward the climax              |

<h3 id="tense-type-enum">TenseType</h3>

The narrative tense for generated prose. Set with the `tense` property on a generate block.

| Value     | Meaning                                                                      |
| --------- | ---------------------------------------------------------------------------- |
| `Past`    | "She walked to the door." — the most common literary tense                   |
| `Present` | "She walks to the door." — creates immediacy                                 |
| `Future`  | "She will walk to the door." — rare, used for prophetic or speculative prose |

<h3 id="transition-type-enum">TransitionType</h3>

How one scene connects to the next. Set with the `transition` property on a scene.

| Value          | Meaning                                             |
| -------------- | --------------------------------------------------- |
| `Cut`          | Abrupt shift to the next scene with no bridging     |
| `Dissolve`     | Smooth, gradual transition                          |
| `Flashback`    | Jump to an earlier point in time                    |
| `FlashForward` | Jump to a later point in time                       |
| `Parallel`     | Cut to a simultaneous scene elsewhere               |
| `Smash`        | Jarring, high-contrast cut for dramatic effect      |
| `Fade`         | Gradual dimming or quieting, often used for endings |
| `Montage`      | Compressed sequence bridging two scenes             |

<h3 id="beat-type-enum">BeatType</h3>

The structural role of a plot beat. Set with the `type` property inside a beat entry.

| Value          | Meaning                                                             |
| -------------- | ------------------------------------------------------------------- |
| `Setup`        | Establishes the world, characters, and status quo                   |
| `Inciting`     | The event that launches the central conflict                        |
| `Rising`       | Tension and stakes escalate                                         |
| `Midpoint`     | A major shift that redefines the conflict                           |
| `Complication` | An obstacle or setback that raises the stakes                       |
| `Crisis`       | The moment of greatest uncertainty before the climax                |
| `Climax`       | The peak dramatic confrontation                                     |
| `Falling`      | Tension decreases as consequences unfold                            |
| `Resolution`   | The central conflict is resolved                                    |
| `Denouement`   | The aftermath — loose ends are tied and new equilibrium established |

<h3 id="conflict-type-enum">ConflictType</h3>

The category of narrative conflict driving a plot. Set with the `conflict_type` property on a plot.

| Value           | Meaning                                                      |
| --------------- | ------------------------------------------------------------ |
| `Interpersonal` | Character vs. character — direct personal conflict           |
| `Internal`      | Character vs. self — a struggle within one mind              |
| `Intrapsychic`  | Deep psychological conflict between competing drives         |
| `Societal`      | Character vs. society — systemic or institutional opposition |
| `Environmental` | Character vs. nature — survival, disaster, the elements      |
| `Cosmic`        | Character vs. fate, gods, or the universe itself             |
| `Existential`   | Character vs. meaninglessness or the absurd                  |
| `Technological` | Character vs. technology — AI, surveillance, automation      |

<h3 id="resolution-pattern-enum">ResolutionPattern</h3>

How the story's central conflict ultimately resolves. Set with the `resolution_pattern` property on a plot.

| Value            | Meaning                                                         |
| ---------------- | --------------------------------------------------------------- |
| `Transformative` | The protagonist is fundamentally changed by the conflict        |
| `Tragic`         | The protagonist fails or is destroyed                           |
| `Redemptive`     | The protagonist atones and is redeemed                          |
| `Ambiguous`      | The resolution is deliberately unclear or open-ended            |
| `Cyclical`       | The story returns to where it began, implying repetition        |
| `Pyrrhic`        | The protagonist wins, but at a devastating cost                 |
| `Transcendent`   | The protagonist achieves something beyond the original conflict |

---

<h2 id="cross-references">Cross-References</h2>

Many properties reference elements defined elsewhere in your project. These are called **cross-references**, and ActOne validates them automatically.

Cross-references appear in several contexts:

- A scene's `participants` list references character names
- A scene's `location` references a world location
- A scene's `pov` may reference a character name
- A scene's `layer` references a timeline layer
- A relationship's `to` property references a character
- A subplot's `converges_at` references a scene

```actone
// The character is defined in one place...
character Marcus {
  nature: Human
  bio: "A fisherman who saw something he should not have."
}

// ...and referenced by name in a scene
scene "Dockside" {
  participants: [Marcus]
  location: Cascadia.Docks
}
```

<h3 id="qualified-references">Qualified Location References</h3>

Locations can be referenced in two ways:

- **Bare name**: `location: Lighthouse` — works when the location name is unique across all worlds
- **Qualified name**: `location: Cascadia.Lighthouse` — uses `WorldName.LocationName` syntax to disambiguate when multiple worlds define locations with the same name

```actone
// Bare reference (when the name is unique)
scene "Arrival" {
  location: Lighthouse
}

// Qualified reference (when disambiguation is needed)
scene "Arrival" {
  location: Cascadia.Lighthouse
}
```

<div class="callout callout-warning">
<p class="callout-title">Warning</p>
<p>If a cross-reference cannot be resolved — for example, you reference a character named <code>Elena</code> but the character is defined as <code>"Elena Vasquez"</code> — the validator will report an error in the Problems panel. Always match names exactly, including quotation marks.</p>
</div>

---

<h2 id="lists-and-blocks">Lists and Blocks</h2>

ActOne uses two grouping structures: **lists** and **blocks**.

<h3 id="lists">Lists</h3>

Lists are enclosed in square brackets and contain comma-separated values. They are used for string arrays and cross-reference arrays.

```actone
// String list
quirks: ["taps her ring finger", "never sits with her back to a door"]

// Cross-reference list
participants: ["Elena Vasquez", Marcus]

// Motif list
motifs: ["cracked mirrors", "old photographs", "fog"]
```

<h3 id="blocks">Blocks</h3>

Blocks are enclosed in curly braces and contain named properties or nested entries. They are used for element bodies, personality traits, atmosphere values, and sub-element containers.

```actone
// Element block
character Elena {
  bio: "A detective"
}

// Personality block (named numeric values)
personality {
  courage: 85
  patience: 30
}

// Container block (holds sub-entries)
locations {
  location Lighthouse { ... }
  location Docks { ... }
}
```

---

<h2 id="property-syntax">Property Syntax</h2>

Properties are written as `keyword: value` pairs inside a block. The colon and value are required.

```actone
bio: "A retired detective."
nature: Human
temperature: 0.8
dynamic: true
```

Properties within a block are **order-independent** — you can write them in any sequence. The following two examples are equivalent:

```actone
// These produce identical results
character Elena {
  bio: "A detective"
  nature: Human
}

character Elena {
  nature: Human
  bio: "A detective"
}
```

---

<h2 id="syntax-quick-reference">Quick Reference Card</h2>

Use this table as a cheat sheet for the most common syntax patterns.

| Pattern             | Example                                       |
| ------------------- | --------------------------------------------- |
| Element declaration | `character Elena { ... }`                     |
| Quoted element name | `character "Elena Vasquez" { ... }`           |
| String property     | `bio: "A detective"`                          |
| Enum property       | `nature: Human`                               |
| Number property     | `temperature: 0.8`                            |
| Boolean property    | `dynamic: true`                               |
| Signed integer      | `weight: -40`                                 |
| String list         | `quirks: ["habit one", "habit two"]`          |
| Reference list      | `participants: [Elena, Marcus]`               |
| Personality block   | `personality { courage: 85 }`                 |
| Atmosphere block    | `atmosphere { tension: 70 }`                  |
| Nested entry        | `goal "Find the truth" { priority: Primary }` |
| Qualified location  | `location: Cascadia.Lighthouse`               |
| Single-line comment | `// This is a comment`                        |
| Multi-line comment  | `/* This is a comment */`                     |

---

<h2 id="complete-example">Complete Example</h2>

The following example demonstrates most of the syntax features covered on this page in a single cohesive story.

```actone
story "Tidewater" {

  // --- Generation settings ---
  generate Settings {
    temperature: 0.7
    max_tokens: 4000
    genre: "Literary mystery"
    tone: "Atmospheric and restrained"
    tense: Past
    default_pov: ThirdLimited
    pacing: Measured
    chapter_breaks: true
  }

  // --- Theme ---
  theme "Truth and Consequence" {
    statement: "The truth does not set you free — it sets you in motion."
    motifs: ["tides", "locked doors", "handwriting"]
    counter: "Some truths are better left buried."
    tension: "Every revelation creates a new obligation."
  }

  // --- Characters ---
  character "Elena Vasquez" {
    nature: Human
    bio: "A retired detective who left the force ten years ago."
    role: "Protagonist"
    voice: "Terse, precise, with flashes of dark humor."
    personality {
      determination: 90
      empathy: 55
    }
    goals {
      goal "Solve the cold case" { priority: Primary, stakes: "Her peace of mind" }
    }
    relationships {
      relationship Marcus {
        to: Marcus
        weight: -20
        label: "Former partner"
        dynamic: true
      }
    }
    arc {
      start: "Isolated and guilt-ridden"
      end: "Connected and at peace with imperfection"
      catalyst: "A new witness appears"
      turning_point: "She tells the truth"
    }
  }

  character Marcus {
    nature: Human
    bio: "A fisherman and former police officer."
    role: "Antagonist"
    voice: "Warm, folksy, evasive under pressure."
  }

  // --- World ---
  world Cascadia {
    period: "Pacific Northwest, present day"
    sensory: "Salt air, grey light, wet cedar, diesel"
    locations {
      location Lighthouse {
        description: "An abandoned lighthouse on a rocky headland."
        atmosphere { isolation: 90, tension: 70 }
      }
      location Docks {
        description: "A working fishing dock."
        atmosphere { grit: 80, activity: 65 }
        connects_to: [Lighthouse]
      }
    }
    rules {
      rule "Fog every evening" { category: Physical }
      rule "Outsiders are distrusted" { category: Social }
    }
  }

  // --- Timeline ---
  timeline StoryTime {
    structure: Parallel
    span: "Two weeks, interwoven with memories from twenty years ago"
    layers {
      layer Present { period: "October 2023" }
      layer Memory { period: "Summer 2003" }
    }
  }

  // --- Scenes ---
  scene "Arrival" {
    type: Transition
    location: Cascadia.Docks
    pov: "Elena Vasquez"
    layer: Present
    participants: ["Elena Vasquez"]
    objective: "Elena returns to the town she left behind."
    transition: Dissolve
  }

  scene "The Reckoning" {
    type: Confrontation
    location: Cascadia.Lighthouse
    pov: "Elena Vasquez"
    layer: Present
    participants: ["Elena Vasquez", Marcus]
    objective: "Elena forces Marcus to reveal what he knows."
    trigger: "Elena finds the old logbook."
    transition: Smash
  }

  // --- Plot ---
  plot MainArc {
    conflict_type: Interpersonal
    resolution_pattern: Ambiguous
    beats {
      beat "Return" { type: Setup, act: 1 }
      beat "Discovery" { type: Inciting, act: 1 }
      beat "Confrontation" { type: Climax, act: 3 }
      beat "Aftermath" { type: Denouement, act: 3 }
    }
    subplot "Family Secret" {
      description: "Elena's family connection to the victim."
      beats {
        beat "Old Photo" { type: Setup, act: 1 }
      }
      converges_at: "The Reckoning"
    }
  }

  // --- Interaction ---
  interaction "Elena and Marcus" {
    participants: ["Elena Vasquez", Marcus]
    pattern: "calm -> tension -> accusation -> confession"
    subtext: "Both know more than they admit."
    power_dynamic: "Elena has moral authority; Marcus has information."
    emotional_arc: "Guarded respect dissolves into raw honesty."
  }
}
```

---

<h2 id="next-steps">Next Steps</h2>

Now that you know the syntax rules, explore the [Element Reference](/language-reference/03-element-reference/) for detailed property listings and validation rules for each element type. If you are new to ActOne, return to [Your First Story](/getting-started/04-first-story/) to put these concepts into practice.
