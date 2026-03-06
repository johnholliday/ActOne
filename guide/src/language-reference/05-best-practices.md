---
title: Best Practices
order: 5
description: Naming conventions, organization patterns, and tips for getting the most out of ActOne.
---

This page collects practical advice for writing effective ActOne files. It covers naming, file organization, property authoring, common patterns, things to avoid, and workflow tips. The guidance here comes from applying ActOne to real narratives across multiple genres --- science fiction, literary fiction, horror, domestic drama, and psychological exploration.

None of these are hard rules enforced by the validator. They are patterns that consistently produce better results at generation time and make your projects easier to maintain as they grow.

---

<h2 id="naming-conventions">1. Naming Conventions</h2>

Good names do more than identify elements --- they signal intent to the runtime and to anyone reading your source files. A name like `"MidnightRevelation"` tells you what a scene is about at a glance; a name like `Scene7` does not.

### Characters

Use proper nouns for characters. For major characters, prefer full names enclosed in quotes:

```actone
character "Elena Vasquez" {
  nature: Human,
  bio: "A forensic linguist who decodes dying languages.",
}
```

Minor or unnamed characters can use bare identifiers without quotes:

```actone
character Bartender {
  nature: Human,
  bio: "Works the late shift at the canal-side bar.",
}
```

<div class="callout callout-tip">
<div class="callout-title">Tip</div>
<p>Full names make characters feel like real people in your outline and exports. Reserve bare identifiers for functional roles --- <code>Bartender</code>, <code>Guard</code>, <code>Narrator</code> --- where the role <em>is</em> the identity.</p>
</div>

### Worlds

Use descriptive, evocative names that capture the defining quality of the setting. A world name should tell you something about what it feels like to be there.

```actone
/* Good — evocative, distinctive */
world "NeonNostalgia" { ... }
world "TheLighthouse" { ... }

/* Weak — generic, interchangeable */
world "City" { ... }
world "Place" { ... }
```

### Locations

Be specific. Location names should evoke atmosphere, not just describe function.

```actone
/* Good — atmospheric, specific */
{ name: "MemoryExchange", description: "..." }
{ name: "TheWhisperingGallery", description: "..." }

/* Weak — generic, could be anywhere */
{ name: "Shop", description: "..." }
{ name: "Room", description: "..." }
```

### Scenes

Use action-oriented names that hint at what happens in the scene. A reader scanning the outline should be able to reconstruct the story's shape from scene names alone.

```actone
/* Good — suggests action, creates anticipation */
scene "TheConfrontation" { ... }
scene "MidnightRevelation" { ... }
scene "WakingUp" { ... }

/* Weak — tells you nothing */
scene "Scene1" { ... }
scene "Next" { ... }
```

### Plots

Name plots after the central conflict or journey they represent. This makes the outline readable as a story map.

```actone
/* Good — names the narrative engine */
plot "TheHarvestConspiracy" { ... }
plot "ArcOfRedemption" { ... }

/* Weak — describes structure, not story */
plot "MainPlot" { ... }
plot "PlotA" { ... }
```

### Themes

Name themes after their core proposition --- the idea the story is exploring.

```actone
/* Good — names the thematic tension */
theme "SeeingVsBeingSeen" { ... }
theme "CultivateOrHarvest" { ... }

/* Weak — too broad to guide generation */
theme "Love" { ... }
theme "Power" { ... }
```

### When to Quote

Always quote names that contain spaces: `"Elena Vasquez"`, `"The Lighthouse"`. Be consistent --- if you defined a character with quotes, always reference that character with the same quoted form.

<div class="callout callout-warning">
<div class="callout-title">Warning</div>
<p>If you define <code>character "Elena Vasquez"</code> but reference her as <code>Elena Vasquez</code> (without quotes) in a scene's participants list, the validator will report an unresolved reference. The quoting must match exactly between definition and every cross-reference.</p>
</div>

---

<h2 id="document-organization">2. Document Organization</h2>

How you structure your files depends on the size and complexity of your project. ActOne supports both single-file and multi-file organization, and the right choice depends on where you are in the writing process.

### Single-File Projects

Best for small stories, quick prototypes, and early exploration. Wrap everything in a `story` block and follow a logical top-to-bottom order:

```actone
story "The Morning Tiger" {
  generate { ... }

  theme "TransienceOfBeauty" { ... }

  character "Lena" { ... }
  character "Marcus" { ... }

  world "TheApartment" {
    locations: [ ... ]
  }

  timeline "OneDay" { ... }

  scene "WakingUp" { ... }
  scene "BreakfastSilence" { ... }
  scene "TheDeparture" { ... }

  plot "QuietUnraveling" { ... }

  interaction "MorningRoutine" { ... }
}
```

The recommended order within a single file is:

1. `generate` --- runtime settings first, since they affect everything
2. `theme` --- the thematic compass
3. `character` definitions --- the agents
4. `world` --- the setting and its rules
5. `timeline` --- temporal structure
6. `scene` definitions --- the narrative units
7. `plot` --- the macro arc and subplots
8. `interaction` definitions --- dialogue patterns

<div class="callout callout-tip">
<div class="callout-title">Tip</div>
<p>Keep single-file projects under roughly 500 lines. Beyond that, navigation becomes difficult and the outline panel becomes more useful than scrolling. That is a good signal to split into multiple files.</p>
</div>

### Multi-File Projects

Split into multiple files when your project has more than 3--4 characters, multiple worlds, or 10 or more scenes. Multi-file projects use standalone elements at the document root --- no `story` wrapper needed.

A suggested file organization:

| File                    | Contents                                 |
| ----------------------- | ---------------------------------------- |
| `characters.actone`     | All character definitions                |
| `world.actone`          | World, locations, rules, sensory palette |
| `scenes-act-one.actone` | Scenes for act one                       |
| `scenes-act-two.actone` | Scenes for act two                       |
| `plot.actone`           | Plot, subplots, theme definitions        |
| `settings.actone`       | Generate block, timeline, interactions   |

Here is what the `characters.actone` file might look like in a multi-file project:

```actone
character "Elena Vasquez" {
  nature: Human,
  bio: "A forensic linguist who decodes dying languages.",
  voice: "Precise and searching. Short declarative sentences
    punctuated by long, unwinding observations.",
}

character "Kael" {
  nature: Human,
  bio: "A secondhand-shop owner who brokers in memory objects.",
  voice: "Warm but guarded. Speaks in metaphors borrowed
    from his trade — everything is currency, exchange, value.",
}
```

Notice there is no `story` block wrapping these definitions. In a multi-file project, each file contributes its elements directly to the shared namespace, and cross-references resolve automatically across files. See <a href="/user-guide/03-multi-file/">Multi-File Projects</a> for full details on composition modes and cross-file references.

<div class="callout callout-tip">
<div class="callout-title">Tip</div>
<p>You can have at most one <code>story</code> block and one <code>generate</code> block across all files in a project. If you use a <code>story</code> block, put it in a dedicated <code>main.actone</code> file alongside the <code>generate</code> block. Everything else goes in separate files without a story wrapper.</p>
</div>

---

<h2 id="writing-effective-properties">3. Writing Effective Properties</h2>

The properties you write inside character, world, and scene blocks are the primary input to the AI runtime. The difference between generic and specific properties is the difference between flat, interchangeable output and distinctive, character-driven prose.

### Voice (the Most Important Property)

The `voice` property has more impact on generation quality than any other single property. It tells the runtime how a character speaks, thinks, and narrates --- their sentence rhythm, vocabulary, emotional register, and verbal habits.

A weak voice description:

```actone
character "Mara" {
  voice: "She speaks well.",
}
```

This tells the runtime almost nothing. "Speaks well" could describe any articulate character. The generated dialogue will be generic.

A strong voice description:

```actone
character "Kael" {
  voice: "Kael speaks in careful, metered sentences — the voice
    of someone who has learned to say nothing by accident.
    He uses secondhand-shop metaphors and never names
    emotions directly. When uncomfortable, his sentences
    get shorter. When lying, they get longer.",
}
```

This gives the runtime concrete, actionable signals: sentence length patterns, metaphor sources, emotional avoidance, and behavioral tells that change with context.

When writing a voice property, consider including:

- **Sentence rhythm**: short and clipped, long and flowing, or a mix depending on mood
- **Vocabulary level**: formal, colloquial, technical, poetic
- **Favorite words or phrases**: verbal tics that make the voice recognizable
- **Emotional register**: what emotions the character expresses freely vs. suppresses
- **What the character avoids saying**: sometimes the gaps define the voice

<div class="callout callout-warning">
<div class="callout-title">Warning</div>
<p>If you define a character without a <code>voice</code> property, the runtime will generate dialogue with no stylistic guidance. This is the single most impactful omission you can make. Always include voice, even if it is brief.</p>
</div>

### Bio

The `bio` property establishes who the character is and what has shaped them. Focus on what drives their worldview rather than listing biographical facts.

```actone
/* Weak — a resume, not a person */
character "Dr. Reyes" {
  bio: "She is 42 years old and works at a hospital.",
}

/* Strong — reveals the wound that shapes behavior */
character "Dr. Reyes" {
  bio: "A trauma surgeon who lost a patient she was not
    supposed to lose. She has spent three years building
    a fortress of competence around that failure.",
}
```

Keep bios to 2--3 sentences for most characters. The bio should answer: what happened to this person that made them who they are now?

### Personality Traits

Personality traits are numeric dials (0--100) that the runtime uses to modulate behavior. Use contrasting pairs to create internal tension:

```actone
personality: {
  compassion: 80,
  ruthlessness: 45,
  curiosity: 90,
  caution: 25,
}
```

A character with high compassion _and_ moderate ruthlessness is more interesting than one with only high compassion. The tension between traits generates conflict in the character's decisions.

Guidelines for personality traits:

- **Use 3--5 traits.** Fewer than 3 gives the runtime too little to work with. More than 5 can muddy the signal --- the traits start to cancel each other out.
- **Use the full range.** Extreme values (below 20 or above 80) produce the most distinctive output. A trait at 50 is effectively neutral.
- **Choose contrasting pairs.** `loyalty: 90` alongside `self_preservation: 70` creates a character who will be torn in interesting ways.

### Goals

Always structure goals with a priority level and stakes --- what the character loses if they fail:

```actone
goals: [
  {
    goal: "Decode the signal before the funding runs out",
    priority: Primary,
    stakes: "Her lab gets shut down and the signal is lost forever",
  },
  {
    goal: "Protect Marcus from learning what the signal really says",
    priority: Hidden,
    stakes: "Marcus would abandon the project — and her",
  },
]
```

Hidden goals are particularly powerful. They drive dramatic irony: the reader (and the runtime) knows what the character is concealing, which shapes every interaction.

<div class="callout callout-tip">
<div class="callout-title">Tip</div>
<p>If a character has no goals, the runtime has no way to generate motivated behavior. Even a minor character benefits from a single Primary goal with stakes. A bartender whose goal is "Keep the regulars happy so the owner does not close the bar" generates more interesting dialogue than a bartender with no goals at all.</p>
</div>

### Relationships

Relationships are cross-references to other characters with a weight (-100 to +100), a label, and optional history. The most important thing to understand about relationships is that they can be asymmetric.

```actone
/* In Elena's definition */
relationships: [
  {
    to: "Kael",
    weight: 85,
    label: "mentor",
    history: "Kael taught her to read memory objects.",
    dynamic: true,
  },
]

/* In Kael's definition */
relationships: [
  {
    to: "Elena Vasquez",
    weight: -20,
    label: "burden",
    history: "She reminds him of a student he failed years ago.",
    dynamic: true,
  },
]
```

Elena sees Kael as a mentor (weight: 85). Kael sees Elena as a burden (weight: -20). This asymmetry generates conflict naturally --- Elena trusts and defers; Kael resents and distances.

Key relationship guidelines:

- **Use the full weight range.** A relationship at weight 0 is indifference. Push toward the extremes for characters who matter to each other.
- **Mark `dynamic: true`** for relationships that will change during the story. This signals the runtime to evolve the bond based on scene outcomes.
- **Include `history`** for relationships with shared backstory. Even a single sentence of context shapes how the runtime generates their dialogue.

### Arc

The character arc describes a transformation trajectory. The key distinction is between `catalyst` (external trigger) and `turning_point` (internal transformation):

```actone
arc: {
  description: "From isolation to trust",
  start: "Trusts only data, avoids emotional exposure",
  catalyst: "Kael decodes a memory object that contains her
    own forgotten childhood",
  midpoint: "Begins to question whether objectivity is
    protection or prison",
  turning_point: "Chooses to share her own memory with Kael,
    knowing he will see her vulnerability",
  end: "Trusts selectively but deeply — no longer hides
    behind the work",
}
```

The `start` and `end` should feel like different people. If you can swap them and the arc still makes sense, the transformation is not specific enough.

---

<h2 id="common-patterns">4. Common Patterns</h2>

These are recurring structural patterns that work well across different types of stories.

### Relationship Webs

When building a cast of characters, define relationships from each character's perspective. Do not assume symmetry --- the most interesting relationships are the ones where characters see each other differently.

Character A sees B as a mentor (weight: 85), but B sees A as a burden (weight: -20). Character C sees both A and B as rivals (weight: -50), while neither A nor B thinks about C at all. These asymmetries create a web of tensions that the runtime can exploit.

A three-character relationship triangle might look like:

```actone
/* Elena sees Kael as a mentor */
character "Elena Vasquez" {
  relationships: [
    { to: "Kael", weight: 85, label: "mentor", dynamic: true },
    { to: "Director Sato", weight: 30, label: "employer" },
  ],
}

/* Kael sees Elena as a burden, the Director as a threat */
character "Kael" {
  relationships: [
    { to: "Elena Vasquez", weight: -20, label: "burden", dynamic: true },
    { to: "Director Sato", weight: -60, label: "adversary" },
  ],
}

/* The Director sees both as assets to manage */
character "Director Sato" {
  relationships: [
    { to: "Elena Vasquez", weight: 15, label: "asset" },
    { to: "Kael", weight: 10, label: "asset" },
  ],
}
```

### Temporal Layering

Use timeline layers to structure non-linear narratives. Define layers in a `timeline` block, then assign scenes to layers:

```actone
timeline "DualTimeline" {
  structure: Nonlinear,
  span: "Twenty years, told in two threads",
  layers: [
    { name: "Past", period: "2004-2006" },
    { name: "Present", period: "2024" },
  ],
}

scene "ThePromise" {
  type: Dialogue,
  layer: "Past",
  participants: ["Elena Vasquez", "Kael"],
  objective: "Establish the original bond before the betrayal.",
}

scene "TheReckoning" {
  type: Confrontation,
  layer: "Present",
  participants: ["Elena Vasquez", "Kael"],
  objective: "Elena confronts Kael with what she has learned.",
}
```

The runtime generates with temporal context --- a scene in the `Past` layer will be written with the awareness that the reader knows the present, and vice versa. Use `Flashback` and `FlashForward` transition types to signal how scenes connect across layers:

```actone
scene "ThePromise" {
  transition: FlashForward,
}
```

### Subplot Convergence

When your plot has subplots running in parallel, use `converges_at` to specify where they merge with the main plot:

```actone
plot "TheHarvestConspiracy" {
  beats: [ ... ],

  subplot "TheDecoding": {
    description: "Elena's technical investigation into the signal",
    beats: ["First fragment decoded", "Pattern recognized", "Full message assembled"],
    converges_at: "TheConfrontation",
  },

  subplot "TheCoverUp": {
    description: "The Director's attempts to suppress the findings",
    beats: ["Files go missing", "Lab access revoked", "Kael is threatened"],
    converges_at: "TheConfrontation",
  },
}
```

The convergence scene (`TheConfrontation`) should include participants from both subplot threads. This is where the separate narrative strands collide.

### Interaction Patterns

Interactions define the emotional rhythm of conversations between specific characters. The arrow notation (`->`) describes how the exchange evolves:

```actone
interaction "TheInterview" {
  participants: ["Elena Vasquez", "Director Sato"],
  pattern: "small talk -> probing questions -> deflection -> revelation",
  subtext: "Elena suspects the Director is hiding something.
    The Director knows Elena is close to the truth.",
  power_dynamic: "The Director holds institutional power,
    but Elena holds the evidence.",
  emotional_arc: "professional courtesy -> tension -> confrontation -> uneasy truce",
}
```

The `subtext` property is what characters mean versus what they say. This dramatically improves dialogue quality because it gives the runtime two layers to work with --- the surface conversation and the hidden one underneath.

The `power_dynamic` shapes who asks questions versus who answers, who controls the pace of the conversation, and where the leverage shifts.

---

<h2 id="anti-patterns">5. Anti-Patterns (What to Avoid)</h2>

These are common mistakes that degrade generation quality or cause validation headaches.

### Generic Voices

```actone
/* Do not do this */
character "Mara" {
  voice: "She is kind and gentle.",
}
```

"Kind and gentle" is a personality description, not a voice. It says nothing about how Mara speaks --- her sentence structure, vocabulary, rhythm, or verbal habits. The runtime cannot generate distinctive dialogue from this.

```actone
/* Do this instead */
character "Mara" {
  voice: "Mara speaks in half-finished thoughts, trailing
    off as if the next word might be dangerous. Her
    vocabulary is small and precise — she prefers old
    words. She never raises her voice; when angry, she
    gets quieter.",
}
```

### Orphaned Cross-References

Referencing characters, locations, or scenes that do not exist in any file:

```actone
scene "TheReckoning" {
  participants: ["Elena Vasquez", "Professor Ward"],
}
```

If `"Professor Ward"` is not defined as a character anywhere in the project, the validator will report an unresolved reference error. This is one of the most common errors in multi-file projects --- it usually comes from renaming a character in one file but forgetting to update references in other files.

<div class="callout callout-tip">
<div class="callout-title">Tip</div>
<p>After renaming any element, check the Problems panel immediately. It will show every broken reference across all files in the project. Fix them before moving on.</p>
</div>

### Missing Voice Property

The single most impactful omission. A character without a voice property will produce generic, interchangeable dialogue. Even a brief voice description is better than none:

```actone
character "Guard" {
  nature: Human,
  bio: "A night-shift security guard.",
  voice: "Terse. One-word answers when possible.
    Radio jargon bleeds into normal speech.",
}
```

### Flat Personality

Using only one or two personality traits gives the runtime too little to modulate:

```actone
/* Too flat — only one dial to work with */
personality: {
  brave: 90,
}

/* Better — creates internal tension */
personality: {
  bravery: 90,
  impulsiveness: 75,
  empathy: 60,
  self_doubt: 40,
}
```

A character defined only as "brave" will behave the same way in every situation. A character who is brave _and_ impulsive _and_ empathetic _and_ quietly self-doubting will behave differently depending on context.

### Overly Deep Nesting

Subplots within subplots create structural complexity that is hard to maintain and hard for the runtime to reason about:

```actone
/* Do not do this — too deep */
plot "MainArc" {
  subplot "Investigation": {
    /* There is no grammar support for nested subplots,
       and even if there were, this would be confusing */
  },
}
```

Keep your plot structure to two levels: main plot and subplots. If a subplot feels like it needs its own subplots, it is probably a separate plot.

### Duplicate Names

Two characters with the same name cause ambiguity the runtime cannot resolve:

```actone
/* Do not do this */
character "Maya" {
  bio: "A painter living in Brooklyn.",
}

character "Maya" {
  bio: "A software engineer in Tokyo.",
}
```

In Merge mode (the default), this is a validation error. Even if you are using Overlay or Sequential mode, it creates confusion for anyone reading the source files. Use distinct names for distinct characters.

### Inconsistent Quoting

Defining a character with quotes but referencing without them, or vice versa:

```actone
/* Definition uses quotes */
character "Elena Vasquez" { ... }

/* Reference omits quotes — this will NOT resolve */
scene "TheReckoning" {
  participants: [Elena Vasquez],
}
```

The fix is simple: always reference with the same form used in the definition. If defined as `"Elena Vasquez"`, always reference as `"Elena Vasquez"`.

---

<h2 id="performance-and-organization-tips">6. Performance and Organization Tips</h2>

These workflow habits will save you time and improve your results.

### Build and Check Frequently

Check the Problems panel after every significant change. Errors compound: an unresolved reference in one place can cascade into confusing behavior in the Diagram panel and exports. Fix errors as they appear rather than letting them accumulate.

<div class="callout callout-tip">
<div class="callout-title">Tip</div>
<p>Make it a habit to glance at the Problems panel after every save. A clean Problems panel means all your cross-references resolve, all your blocks are well-formed, and the project is in a valid state.</p>
</div>

### Use the Outline Panel

The Outline panel shows your project's structure at a glance --- every character, world, location, scene, plot, and theme arranged in a tree. Use it to verify that elements are appearing where you expect them. If a character you just defined does not show up in the outline, there is likely a syntax error in the block.

### Export Early and Often

Do not wait until your project is "complete" to export. Export periodically and read the generated output. Small adjustments to a character's `voice` or `personality` can have surprisingly large effects on the quality of generated prose.

This is especially true for voice descriptions. A voice that reads well as a definition sometimes produces unexpected results at generation time. Export, read, adjust, and export again.

### Start Small, Then Expand

Do not try to define everything at once. Start with one character and one scene:

```actone
character "Elena Vasquez" {
  nature: Human,
  bio: "A forensic linguist who decodes dying languages.",
  voice: "Precise and searching. Short declarative sentences
    punctuated by long, unwinding observations.",
}

scene "TheSignal" {
  type: Revelation,
  participants: ["Elena Vasquez"],
  objective: "Elena discovers the anomaly in the signal data.",
}
```

Export this minimal project and read the output. Adjust the voice until it sounds right. Then add a second character, define their relationship, and write a scene with both of them. Expand outward from a core that works rather than building everything in parallel.

<div class="callout callout-tip">
<div class="callout-title">Tip</div>
<p>Each character you add interacts with every other character. A project with 3 characters has 3 possible pairings. A project with 6 characters has 15. Start with your protagonist and their most important relationship, get that working, and then add characters one at a time.</p>
</div>

### Organize for Readability

Whether you use single-file or multi-file organization, keep readability in mind:

- **Group related elements together.** If two characters have a complex relationship, define them near each other in the file (or in the same file in a multi-file project).
- **Use comments liberally.** ActOne supports `//` for single-line comments and `/* ... */` for multi-line comments. Use them to explain your intentions, mark sections, or note things you plan to change.
- **Consistent formatting.** Indent properties inside blocks. Use blank lines between major definitions. Consistency makes the source files scannable.

```actone
// === PROTAGONISTS ===

character "Elena Vasquez" {
  nature: Human,
  bio: "A forensic linguist who decodes dying languages.",
  voice: "Precise and searching.",

  /* Elena's relationship with Kael evolves from mentorship
     to something more complicated in Act 2 */
  relationships: [
    { to: "Kael", weight: 85, label: "mentor", dynamic: true },
  ],
}

// === SUPPORTING CAST ===

character "Kael" {
  nature: Human,
  bio: "A secondhand-shop owner who brokers in memory objects.",
  voice: "Warm but guarded.",
}
```

### Version Your Work

Use your project's version control (or save copies at milestones) before making large structural changes. Renaming a character, splitting files, or restructuring plots can have cascading effects on cross-references. Having a snapshot to return to is valuable insurance.

---

**Next:** Return to the <a href="/language-reference/01-language-overview/">Language Overview</a> or explore the <a href="/reference/glossary/">Glossary</a> for definitions of ActOne terms.
