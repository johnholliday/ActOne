---
title: Element Reference
order: 3
description: Complete property reference for every ActOne element type.
---

This page is the definitive reference for every element type in the ActOne language. Each section covers one element type: its purpose, complete syntax with every property, which properties are required and which are optional, how the element cross-references other elements, and a realistic example showing all or most properties in use.

ActOne defines eight element types. They can appear in any order inside a `story` block or as standalone top-level definitions in multi-file projects. Properties within each element are also order-independent --- you can list `voice` before `bio` or after `goals`, and the result is the same.

The eight element types are:

1. **[Generate Block](#generate)** --- AI generation settings (one per project)
2. **[Theme](#theme)** --- thematic propositions with motifs and counter-themes
3. **[Character](#character)** --- autonomous AI personas with psychographies and relationships
4. **[World](#world)** --- settings with locations, sensory palettes, and governing rules
5. **[Timeline](#timeline)** --- temporal structure and named layers
6. **[Scene](#scene)** --- narrative units where characters interact
7. **[Plot](#plot)** --- macro-level arcs with beats and subplots
8. **[Interaction](#interaction)** --- communication patterns, subtext, and power dynamics

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>You do not need to memorize every property for every element. Start with the few properties you need, then return to this page when you want to add depth. The Studio's auto-complete will also suggest valid properties as you type.</p>
</div>

All properties use the syntax `property_name: value` with an optional trailing comma after each value. String values are enclosed in double or single quotes. Arrays use square brackets with comma-separated values. Blocks use curly braces. Trailing commas are always permitted, so you never need to worry about removing the last comma in a list.

---

<h2 id="generate">1. Generate Block</h2>

The `generate` block controls AI generation behavior for your entire project. It tells the runtime what kind of prose to produce: the genre, the tense, the point of view, the pacing, and various technical parameters that govern how the AI balances creativity with coherence.

**Only one `generate` block is allowed per project.** If you define more than one, the validator will flag an error. The block has no name --- it is simply `generate` followed by braces.

Every property inside a `generate` block is optional. If you omit a property, the runtime uses its own defaults. Most writers define at least `genre`, `tense`, and `default_pov`.

Think of the `generate` block as the director's chair: it does not change what happens in the story, but it shapes how the story is told. Two projects with identical characters, worlds, and scenes but different `generate` blocks will produce meaningfully different prose.

### Properties

| Property          | Type                                                                | Description                                                                                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `temperature`     | NUMBER (0.0--2.0)                                                   | Creativity vs. coherence dial. Lower values produce more predictable prose; higher values produce more surprising output. A value of 0.0 is fully deterministic; 2.0 is chaotic. Most fiction works well between 0.7 and 1.2. |
| `max_tokens`      | NUMBER                                                              | Per-generation token ceiling. Limits how much text the AI produces in a single generation pass. Useful for controlling scene length.                                                                                          |
| `continuity_loss` | NUMBER (0--1)                                                       | Memory decay factor. A value of 0 means perfect recall of earlier events; 1 means the AI treats each scene as if starting fresh. Values around 0.1--0.3 simulate natural human memory drift.                                  |
| `style_bleed`     | `true` or `false`                                                   | Whether character voices are allowed to influence other agents. When true, a dominant character's speech patterns may color the narrator or other characters. When false, voices remain strictly isolated.                    |
| `genre`           | STRING                                                              | The genre of your story, expressed as a free-form string. Compound genres are welcome: `"literary science fiction"`, `"Southern Gothic romance"`, `"noir fairy tale"`.                                                        |
| `tone`            | STRING array                                                        | The emotional register of the narrative. Accepts multiple values for layered tones.                                                                                                                                           |
| `tense`           | `Past`, `Present`, or `Future`                                      | The grammatical tense used for narration.                                                                                                                                                                                     |
| `default_pov`     | `FirstPerson`, `SecondPerson`, `ThirdLimited`, or `ThirdOmniscient` | The default point of view for all scenes. Individual scenes can override this with their own `pov` property.                                                                                                                  |
| `pacing`          | `Slow`, `Measured`, `Moderate`, `Brisk`, or `Accelerating`          | A hint to the runtime about how quickly events should unfold. `Accelerating` tells the AI to increase tempo as the narrative progresses.                                                                                      |
| `chapter_breaks`  | `true` or `false`                                                   | Whether to insert chapter or section breaks between scenes in the generated output.                                                                                                                                           |

### Example

```actone
generate {
  temperature: 0.85,
  max_tokens: 4000,
  continuity_loss: 0.15,
  style_bleed: true,
  genre: "Southern Gothic literary fiction",
  tone: ["humid", "ominous", "darkly comic"],
  tense: Past,
  default_pov: ThirdLimited,
  pacing: Measured,
  chapter_breaks: true,
}
```

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>If you are writing a simple story and do not need fine-grained control over the AI, you can omit the <code>generate</code> block entirely. The runtime will use sensible defaults. Add properties one at a time as you discover which knobs matter for your particular narrative.</p>
</div>

<div class="callout callout-info">
<p class="callout-title">Temperature and Style Bleed</p>
<p>The <code>temperature</code> and <code>style_bleed</code> properties interact in important ways. High temperature with style bleed enabled produces prose where character voices cross-pollinate freely --- a narrator might pick up a character's verbal tics, or one character's internal monologue might echo another's phrasing. This can produce hauntingly cohesive prose in the right story, or a muddled mess in the wrong one. If your characters have very distinct voices and you want to preserve that distinctness, consider setting <code>style_bleed: false</code> or keeping <code>temperature</code> below 1.0.</p>
</div>

---

<h2 id="theme">2. Theme</h2>

A `theme` block declares a story-level thematic proposition --- an idea your narrative explores, argues about, or holds in tension. Themes give the runtime a semantic compass: when the AI generates prose, it can weave thematic motifs into descriptions, dialogue, and internal monologue without being told to do so explicitly in every scene.

A story can have multiple themes. Each theme has a name (used for identification in the Outline panel and in exported documents) and a set of properties that flesh out the idea. The name should be a single concept or short phrase that captures the essence of the theme --- `Displacement`, `Inheritance`, `SilenceAsViolence`.

All properties within a theme block are optional, but a theme with no properties is an empty shell. At minimum, define either a `statement` or a `motifs` array to give the runtime something to work with.

### Properties

| Property    | Type         | Required | Description                                                                                                                       |
| ----------- | ------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `statement` | STRING       | Optional | The thematic proposition in plain language. This is the core claim your story makes or questions.                                 |
| `motifs`    | STRING array | Optional | Recurring images, objects, or patterns that embody the theme. The runtime uses motifs to seed descriptions and metaphors.         |
| `counter`   | STRING       | Optional | The opposing thematic force --- what the theme argues against. Every strong theme has a counter-theme that creates friction.      |
| `tension`   | STRING       | Optional | How the theme creates narrative conflict. This is a generation directive that tells the runtime where to apply thematic pressure. |

### Cross-References

Theme blocks do not cross-reference other elements directly. They operate at the story level and influence generation globally. However, themes create an implicit web of connections: a theme about displacement might resonate with a character's arc about losing home, a world's rules about property ownership, and a scene's atmosphere of unease. The runtime uses these semantic connections even though they are not expressed as formal cross-references.

<div class="callout callout-info">
<p class="callout-title">Multiple Themes</p>
<p>A story can define as many themes as needed. Most stories benefit from two to four themes that interact with one another. A primary theme might be about memory and loss, while a secondary theme about power and consent creates friction with the first. The runtime weaves all defined themes into the generated prose, with natural emphasis shifting based on which theme is most relevant to each scene's objective and participants.</p>
</div>

### Example

```actone
theme Displacement {
  statement: "Home is not a place but a state of recognition --- and it can be
              revoked without warning.",
  motifs: [
    "packed suitcases that never fully unpack",
    "maps with borders drawn in pencil",
    "the smell of someone else's cooking through a wall",
    "keys that fit locks to rooms no longer yours"
  ],
  counter: "Belonging is earned through presence and persistence, not granted
            by geography.",
  tension: "Characters who build homes are forced to abandon them; characters
            who refuse attachment discover they have already put down roots.",
}
```

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>Themes work best when stated as tensions rather than conclusions. A theme like "love conquers all" gives the runtime nowhere to go. A theme like "love demands sacrifices that may not be worth making" creates friction in every scene where characters face a choice between connection and self-preservation.</p>
</div>

---

<h2 id="character">3. Character</h2>

A `character` block defines a primary agent in your story. At runtime, each character becomes an independent AI persona with its own voice, goals, memories, and behavioral patterns. Characters are the most richly detailed element type in ActOne --- they have more properties than any other element, because the quality of character definition directly determines the quality of generated prose.

Every property is optional, but the validator will warn you if a character lacks a `voice` property, because voice is the single most important factor in producing distinctive, believable output.

Characters are the most commonly referenced element type. They appear in scene participant lists, scene point-of-view assignments, relationship targets, interaction participant lists, and interaction style mix maps. A well-defined character ripples through the entire project.

### Properties

| Property        | Type                                                                            | Required             | Description                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nature`        | `Human`, `Force`, `Concept`, `Animal`, `Spirit`, `Collective`, or `Environment` | Optional             | The ontological type of the character. Determines how the runtime embodies the agent. A `Concept` character like Grief behaves very differently from a `Human` character. Use `Force` for personified natural or abstract forces (gravity, fate), `Collective` for groups that act as one (a mob, a jury), and `Environment` for settings that function as characters (a sentient house, an oppressive city). |
| `bio`           | STRING                                                                          | Optional             | Backstory and context. Free-form text that grounds the character in your world.                                                                                                                                                                                                                                                                                                                               |
| `role`          | STRING                                                                          | Optional             | The character's narrative function --- mentor, antagonist, trickster, witness. Distinct from `nature`, which describes what the character _is_, while `role` describes what the character _does_ in the story.                                                                                                                                                                                                |
| `personality`   | Block of named traits                                                           | Optional             | A set of named numeric traits (0--100) that parameterize the character's temperament. Trait names are arbitrary identifiers --- use whatever dimensions matter for your story (e.g., `compassion`, `volatility`, `cunning`). The numeric values give the runtime tunable dials: `compassion: 20` generates different dialogue than `compassion: 80`.                                                          |
| `voice`         | STRING                                                                          | Strongly recommended | How the character speaks and thinks. This is the single most critical property for multi-agent generation. Rich, specific voice descriptions produce the most distinctive output.                                                                                                                                                                                                                             |
| `quirks`        | STRING array                                                                    | Optional             | Behavioral tics, mannerisms, and physical habits that make the character recognizable.                                                                                                                                                                                                                                                                                                                        |
| `goals`         | Array of goal entries                                                           | Optional             | What the character wants. Each entry is a structured object with `goal`, `priority`, and `stakes`.                                                                                                                                                                                                                                                                                                            |
| `conflicts`     | STRING array                                                                    | Optional             | Internal contradictions and active tensions. Distinct from `flaws`: conflicts are dynamic tensions, flaws are static weaknesses.                                                                                                                                                                                                                                                                              |
| `strengths`     | STRING array                                                                    | Optional             | Positive capabilities and competencies.                                                                                                                                                                                                                                                                                                                                                                       |
| `flaws`         | STRING array                                                                    | Optional             | Weaknesses and vulnerabilities.                                                                                                                                                                                                                                                                                                                                                                               |
| `relationships` | Array of relationship entries                                                   | Optional             | Cross-references to other characters with weighted, labeled bonds.                                                                                                                                                                                                                                                                                                                                            |
| `arc`           | Block with arc properties                                                       | Optional             | The character's transformation trajectory through the narrative.                                                                                                                                                                                                                                                                                                                                              |
| `symbols`       | STRING array                                                                    | Optional             | Recurring images associated with the character that the runtime can weave into prose. Symbols appear in descriptions, metaphors, and environmental details when this character is present or being thought about. A character symbolized by water might be described near rain, reflections, or rivers even when the connection is not stated explicitly.                                                     |
| `secret`        | STRING                                                                          | Optional             | Information the character holds that others do not know. Drives dramatic irony. The runtime can use secrets to generate scenes where the character's behavior is subtly shaped by knowledge they cannot reveal --- careful word choices, avoided topics, telling silences.                                                                                                                                    |
| `notes`         | STRING array                                                                    | Optional             | Author directives and meta-notes for generation guidance. These are instructions to the AI, not part of the story world --- they are backstage directions. Use notes for things like "never let this character cry on-screen" or "always describe this character through the reactions of others."                                                                                                            |

### Personality Block

The `personality` block uses a flexible key-value format. You define trait names as bare identifiers and assign numeric values from 0 to 100. There is no fixed vocabulary --- you choose the dimensions that matter for your character. A detective story might use `suspicion`, `patience`, `attention_to_detail`. A romance might use `vulnerability`, `jealousy`, `warmth`. Use as many or as few traits as you need.

```actone
personality: {
  compassion: 82,
  courage: 45,
  discipline: 90,
  openness: 30,
}
```

### Goal Entries

Each entry in the `goals` array is a structured object with three properties:

| Property   | Type                                | Description                                                                                           |
| ---------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `goal`     | STRING                              | What the character wants.                                                                             |
| `priority` | `Primary`, `Secondary`, or `Hidden` | How important this goal is. Hidden goals are unknown to other characters and may even be unconscious. |
| `stakes`   | STRING                              | What the character stands to lose or gain.                                                            |

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>The validator will warn you if a goal entry lacks a <code>priority</code>. Setting priorities helps the runtime decide which goals drive behavior in any given scene.</p>
</div>

### Relationship Entries

Each entry in the `relationships` array is a structured object:

| Property  | Type                              | Required | Description                                                                                                                                                                                                                                                                                                |
| --------- | --------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `to`      | Cross-reference to a CharacterDef | Yes      | The other character in this relationship. Must match the name of a defined character exactly (case-sensitive).                                                                                                                                                                                             |
| `weight`  | Signed integer (-100 to +100)     | Optional | Affinity weight. Negative values indicate hostility or fear; positive values indicate trust or affection. -100 is nemesis; +100 is soulmate.                                                                                                                                                               |
| `label`   | STRING                            | Optional | The type of bond: "mentor", "rival", "lover", "mother", "nemesis", etc.                                                                                                                                                                                                                                    |
| `history` | STRING                            | Optional | Shared history that provides context for the relationship.                                                                                                                                                                                                                                                 |
| `dynamic` | `true` or `false`                 | Optional | Whether this relationship changes during the story. If true, the runtime may adjust the weight and label based on scene outcomes. Set this to `true` for relationships that are central to your plot's arc --- a friendship that sours, an enemy who becomes an ally, a romance that deepens or fractures. |

### Arc Block

The `arc` block describes how the character transforms over the course of the narrative:

| Property        | Type   | Description                                                                 |
| --------------- | ------ | --------------------------------------------------------------------------- |
| `description`   | STRING | High-level summary of the arc.                                              |
| `start`         | STRING | The character's state at the story's opening.                               |
| `end`           | STRING | The character's state at the story's conclusion.                            |
| `catalyst`      | STRING | The external event that forces the character into motion.                   |
| `midpoint`      | STRING | The character's state at the narrative midpoint --- the point of no return. |
| `turning_point` | STRING | The pivotal moment of internal transformation.                              |

### Cross-References

- The `to` field in each relationship entry references another `character` by name.
- Characters are referenced by name from `scene` participants, `scene` pov, `interaction` participants, and `interaction` style_mix.

### Example

```actone
character Celeste {
  nature: Human,
  bio: "A former war correspondent turned reclusive translator, living in a
        coastal village where she converts the letters of dead soldiers into
        the languages their families speak. She has not published under her
        own name in eleven years.",
  role: "protagonist whose stillness masks unresolved grief",
  personality: {
    compassion: 82,
    courage: 45,
    discipline: 90,
    openness: 30,
    humor: 55,
    volatility: 25,
  },
  voice: "Precise, rhythmic sentences that avoid first-person pronouns when
          possible. Translates emotions into physical sensations --- says
          'the room tightened' instead of 'I felt anxious.' Speaks in the
          cadence of someone used to writing for publication: careful word
          choices, occasional striking metaphors, but always grounded in
          the concrete. When rattled, her syntax fractures into fragments.",
  quirks: [
    "Taps her left thumb against her ring finger when listening",
    "Keeps a dictionary open on every flat surface in her house",
    "Addresses strangers with excessive formality, then overcorrects"
  ],
  goals: [
    {
      goal: "Complete the translation of Sergeant Maren's final letters",
      priority: Primary,
      stakes: "The dead man's daughter is dying and wants to read her
               father's words before she goes."
    },
    {
      goal: "Avoid revisiting her own wartime memories",
      priority: Secondary,
      stakes: "If she confronts what happened in Aleppo, the carefully
               constructed quietness of her life will collapse."
    },
    {
      goal: "Understand why she stopped writing",
      priority: Hidden,
      stakes: "Her silence is not a choice --- it is a wound she has
               mistaken for a preference."
    }
  ],
  conflicts: [
    "Compassion for the bereaved vs. self-protective withdrawal",
    "Belief in the power of language vs. knowledge that some things
     cannot be translated"
  ],
  strengths: [
    "Fluent in six languages",
    "Extraordinary capacity for empathy through text",
    "Discipline that borders on ritual"
  ],
  flaws: [
    "Avoids direct emotional confrontation",
    "Substitutes other people's stories for her own",
    "Confuses solitude with safety"
  ],
  relationships: [
    {
      to: Harlan,
      weight: 55,
      label: "reluctant confidant",
      history: "Harlan is the village postman who has delivered the dead
                soldiers' letters to Celeste for three years. He knows
                what she does but has never asked why.",
      dynamic: true,
    },
    {
      to: Maren,
      weight: -20,
      label: "haunting presence",
      history: "Sergeant Maren is dead, but his letters are so vivid
                that Celeste has begun to hear his voice when she works.",
      dynamic: true,
    }
  ],
  arc: {
    description: "From protective silence to the courage of her own voice.",
    start: "A woman who speaks only through the words of others.",
    end: "A woman who writes her own letter --- to herself.",
    catalyst: "Maren's daughter arrives in the village, and her
              resemblance to someone Celeste knew in Aleppo makes
              avoidance impossible.",
    midpoint: "Celeste discovers that one of Maren's letters was
              addressed to her --- not as a translator, but as a
              fellow witness.",
    turning_point: "She realizes that translation was never about
                    the dead. It was about keeping her own words
                    at arm's length.",
  },
  symbols: [
    "ink-stained fingertips",
    "the sound of the sea through an open window",
    "letters with water damage --- words half-dissolved"
  ],
  secret: "She was in the same building when the airstrike hit. She
           survived because she had stepped outside to take a phone call
           about a book deal. She has never told anyone.",
  notes: [
    "Her voice should feel like careful prose --- never casual, even
     in domestic moments",
    "Physical environment should mirror her emotional state: when
     she is calm, describe orderly spaces; when she is distressed,
     focus on wind, loose papers, things in motion"
  ],
}
```

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>The <code>voice</code> property does more work than any other property in the character definition. A vague voice like "speaks casually" produces generic output. A specific voice like the one above --- with sentence structure, pronoun habits, metaphor tendencies, and stress responses --- produces a character that sounds like a real person. Invest your time here.</p>
</div>

---

<h2 id="world">4. World</h2>

A `world` block defines the setting of your story: the physical, cultural, or fictional environment in which events take place. A world contains locations (specific named places), sensory characteristics, temporal anchoring, and rules that govern how things work.

A single story can have multiple worlds. A science fiction story might define a generation ship, a colony planet, and a space station as separate worlds. A fantasy story might have a mortal realm and a spirit realm. Each world has its own locations, atmosphere, and rules.

Worlds appear as container nodes in the Diagram panel, with their locations displayed as nodes inside them. This visual grouping makes it easy to see at a glance which scenes share a setting and how characters move between locations.

### Properties

| Property    | Type                      | Required | Description                                                                                                                                        |
| ----------- | ------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `period`    | STRING                    | Optional | Temporal anchoring --- when this world exists. Free-form text: "1920s Prohibition-era Chicago", "far future, post-singularity", "outside of time". |
| `sensory`   | STRING array              | Optional | The dominant sensory characteristics of the world as a whole. These set the atmospheric baseline that all locations inherit.                       |
| `locations` | Array of location entries | Optional | Named places within the world where scenes can take place.                                                                                         |
| `rules`     | Array of rule entries     | Optional | Constraints and laws that govern the world. The validator will warn if a world has no rules.                                                       |

### Location Entries

Each entry in the `locations` array is a structured object:

| Property      | Type                         | Required | Description                                                                                                                                                         |
| ------------- | ---------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | DefinitionName               | Yes      | A unique identifier for this location. Scenes reference locations by this name.                                                                                     |
| `description` | STRING                       | Optional | What the location looks, feels, sounds, and smells like.                                                                                                            |
| `atmosphere`  | Block of named mood values   | Optional | Numeric mood vector for the location's emotional register (e.g., `tension: 80, warmth: 20`). Values are 0--100.                                                     |
| `connects_to` | Array of location references | Optional | Other locations that are spatially adjacent or reachable from this one. Supports flat references (`MarketSquare`) or qualified references (`OldTown.MarketSquare`). |

### Rule Entries

Each entry in the `rules` array is a structured object:

| Property   | Type                                                                  | Required | Description                                                                                                                                                                             |
| ---------- | --------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rule`     | STRING                                                                | Optional | The constraint or law, expressed in plain language. Be specific: "Magic has a physical cost proportional to the effect" is more useful to the runtime than "Magic exists."              |
| `category` | `Physical`, `Social`, `Metaphysical`, `Narrative`, or `Psychological` | Optional | What kind of rule this is. Categories help the runtime apply rules contextually --- a `Physical` rule constrains action sequences, while a `Narrative` rule constrains story structure. |

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>Rule categories matter more than they might seem. A <code>Physical</code> rule constrains what can happen in action scenes. A <code>Social</code> rule constrains dialogue and character behavior. A <code>Metaphysical</code> rule might govern magic, afterlives, or the nature of consciousness. A <code>Narrative</code> rule is a meta-constraint on story structure (e.g., "no scene may have a happy resolution until Act 3"). A <code>Psychological</code> rule governs how minds work in your world.</p>
</div>

### Cross-References

- Locations are referenced by name from `scene` location properties.
- Location `connects_to` entries reference other locations, either flat (`ControlRoom`) or qualified (`ResearchStation.ControlRoom`).
- Scenes use `LocationRef` syntax to point to a location: either a flat name or a `WorldName.LocationName` qualified reference.

### Example

```actone
world NeonNostalgia {
  period: "2089, thirty years after the Memory Commodification Act legalized
           the buying and selling of human recollections",
  sensory: [
    "holographic advertisements flickering at the edge of perception",
    "the faint ozone smell of overworked neural interfaces",
    "rain that tastes faintly metallic from atmospheric processors",
    "a constant low hum from the memory exchange servers beneath the streets"
  ],
  locations: [
    {
      name: MemoryExchange,
      description: "A cavernous trading floor where brokers in mirrored visors
                    bid on extracted memories displayed as shimmering orbs. The
                    ceiling is transparent, showing the rain-slicked city above.
                    The temperature is kept at exactly 16 degrees Celsius ---
                    cold enough to discourage lingering.",
      atmosphere: {
        tension: 75,
        wonder: 40,
        dread: 60,
        intimacy: 10,
      },
      connects_to: [BackAlley, NeuralClinic],
    },
    {
      name: BackAlley,
      description: "A narrow passage behind the Exchange where unlicensed
                    memory dealers operate from converted shipping containers.
                    Neon bleeds down the wet walls. The air smells of synthetic
                    jasmine, used to mask the chemical tang of black-market
                    extraction fluid.",
      atmosphere: {
        tension: 85,
        wonder: 15,
        dread: 70,
        intimacy: 30,
      },
      connects_to: [MemoryExchange, RooftopGarden],
    },
    {
      name: NeuralClinic,
      description: "A sterile white room where memories are extracted and
                    implanted. Reclining chairs face a wall of monitors showing
                    real-time neural activity. The only sound is the soft beep
                    of biometric sensors and the occasional whisper of a patient
                    reliving something they are about to lose.",
      atmosphere: {
        tension: 50,
        wonder: 20,
        dread: 40,
        intimacy: 65,
      },
      connects_to: [MemoryExchange],
    },
    {
      name: RooftopGarden,
      description: "An illegal garden on top of the Exchange building, tended
                    by a collective of memory-refusers who have opted out of the
                    commodity economy. Real soil, real rain, real sunlight when
                    the atmospheric processors allow it. The only place in the
                    district that smells like living things.",
      atmosphere: {
        tension: 15,
        wonder: 80,
        dread: 5,
        intimacy: 70,
      },
      connects_to: [BackAlley],
    }
  ],
  rules: [
    {
      rule: "Extracted memories leave a gap --- the donor forgets the event
             permanently. There is no copy, only transfer.",
      category: Physical,
    },
    {
      rule: "Selling your own memories is legal; extracting someone else's
             without consent carries a mandatory twenty-year sentence.",
      category: Social,
    },
    {
      rule: "Implanted memories feel real but carry a faint 'seam' --- a
             micro-second delay in emotional response that trained
             observers can detect.",
      category: Metaphysical,
    },
    {
      rule: "Characters who have lost too many memories begin to lose
             coherent identity. Their speech patterns fragment and
             their goals become contradictory.",
      category: Psychological,
    },
    {
      rule: "No character may access a memory that belongs to someone
             still alive without that person's explicit on-screen
             consent in a prior scene.",
      category: Narrative,
    }
  ],
}
```

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>Location <code>connects_to</code> references create edges in the Diagram panel that show spatial relationships between places. Even if your story never explicitly describes a character walking from one location to another, defining connectivity helps the runtime make realistic decisions about which characters can plausibly appear in which scenes and how quickly information or rumors might travel.</p>
</div>

<div class="callout callout-info">
<p class="callout-title">Flat vs. Qualified Location References</p>
<p>If your project has only one world, flat location references like <code>MemoryExchange</code> are sufficient and easier to read. If your project has multiple worlds that share location names (e.g., two worlds both have a location called <code>MainHall</code>), use qualified references like <code>NeonNostalgia.MemoryExchange</code> to disambiguate. The validator will flag ambiguous flat references when multiple matches exist.</p>
</div>

---

<h2 id="timeline">5. Timeline</h2>

A `timeline` block defines the temporal structure of your story --- how events are organized in time. Linear stories have a single chronological thread. Non-linear stories might interweave flashbacks and flash-forwards. Parallel stories follow multiple simultaneous threads. Cyclical stories return to the same temporal moment.

A story can have multiple timelines, though most stories need only one. Scenes reference individual layers within a timeline, which tells the runtime which temporal context to use when generating prose for that scene.

The `structure` property is particularly important because it tells the runtime how to handle transitions between layers. A `Linear` story progresses chronologically. A `Nonlinear` story interweaves layers freely. A `Collapsed` story treats all layers as superimposed --- useful for dream logic, trauma narratives, or stories where past and present are indistinguishable. A `Reverse` story runs from ending to beginning, which requires the runtime to manage information asymmetry carefully (the reader knows outcomes before causes).

### Properties

| Property    | Type                                                                     | Required | Description                                                                                                                                                                                                                                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `structure` | `Linear`, `Nonlinear`, `Parallel`, `Collapsed`, `Cyclical`, or `Reverse` | Optional | How time is organized in this narrative. `Linear` is straightforward chronology. `Nonlinear` interweaves time periods freely. `Parallel` follows simultaneous threads. `Collapsed` means past and present are superimposed (useful for dream logic or trauma narratives). `Cyclical` returns to the same temporal moment. `Reverse` runs the story backward from ending to beginning. |
| `span`      | STRING                                                                   | Optional | The temporal extent of the narrative, in plain language: "three days", "four hundred years", "a single afternoon that contains a lifetime of memory".                                                                                                                                                                                                                                 |
| `layers`    | Array of timeline layer entries                                          | Optional | Named temporal layers that scenes can reference.                                                                                                                                                                                                                                                                                                                                      |

### Timeline Layer Entries

Each entry in the `layers` array is a structured object:

| Property      | Type           | Required | Description                                                               |
| ------------- | -------------- | -------- | ------------------------------------------------------------------------- |
| `name`        | DefinitionName | Yes      | A unique identifier for this layer. Scenes reference layers by this name. |
| `description` | STRING         | Optional | What this temporal layer represents in the narrative.                     |
| `period`      | STRING         | Optional | When this layer is set, if different from the world's period.             |

### Cross-References

- Timeline layers are referenced by name from `scene` `layer` properties.
- Timelines themselves are not cross-referenced by other elements directly; their layers are the unit of reference.
- Layer names must be unique within a timeline. If you have two timelines that both define a layer named `Present`, scenes should reference the layer name unambiguously --- the validator resolves layer references across the entire project.

### Example

```actone
timeline ThreeRivers {
  structure: Nonlinear,
  span: "Sixty years, from the dam's construction in 1962 to the town's
         flooding in 2022, told in fragments that mirror the river's own
         refusal to follow a straight path.",
  layers: [
    {
      name: Construction,
      description: "1962--1965. The building of the Harwell Dam. Optimism,
                    displacement of farming families, federal promises.
                    The town is young and the river is wild.",
      period: "early 1960s, rural Appalachian America",
    },
    {
      name: Heyday,
      description: "1985--1990. The reservoir town at its peak. Tourism,
                    lakeside development, a generation that has forgotten
                    what lies beneath the water. Prosperity built on
                    submerged foundations.",
      period: "late 1980s, small-town American prosperity",
    },
    {
      name: Collapse,
      description: "2020--2022. The dam is failing. Engineers issue warnings.
                    Politicians stall. The lake begins to drop, and the
                    rooftops of the flooded town emerge like bones through
                    thinning skin.",
      period: "early 2020s, climate anxiety era",
    },
    {
      name: Reckoning,
      description: "A single day in 2022 when the dam breaks and the
                    old town is both destroyed and revealed. Past and
                    present collide in brown water.",
      period: "one day, summer 2022",
    }
  ],
}
```

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>Timeline layers do not enforce a particular scene ordering --- they provide context. A scene tagged with the <code>Construction</code> layer tells the runtime to generate prose appropriate to the 1960s, even if that scene appears in the middle of the narrative between scenes set in 2022. The runtime adjusts language, sensory details, and cultural references accordingly.</p>
</div>

---

<h2 id="scene">6. Scene</h2>

A `scene` block defines a discrete narrative unit --- a moment in the story where characters interact in a specific location. Scenes are where the actual storytelling happens. Everything else in ActOne (characters, worlds, timelines, plots) exists to give scenes context, but the scene is where the AI generates prose.

Each scene brings together a location, a cast of characters, an emotional atmosphere, and a clear objective. The runtime uses all of this information to produce a focused, purposeful passage of narrative.

Scenes are the connective tissue of your project. They reference characters (as participants and point-of-view), worlds (through location references), and timelines (through layer references). When the validator checks your project, scenes are typically where most cross-reference errors surface, because a single scene might reference three or four other elements. Getting scene references right means your Diagram panel will show the full web of relationships in your story.

### Properties

| Property       | Type                                                                                                    | Required | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`         | `Action`, `Dialogue`, `Reflection`, `Montage`, `Revelation`, `Confrontation`, `Transition`, or `Climax` | Optional | The narrative function of this scene. Scene type profoundly influences the rhythm and structure of generated prose. A `Reflection` scene produces introspective, slow-paced output with interior monologue. A `Dialogue` scene focuses on conversation. An `Action` scene produces kinetic, terse prose with short sentences and physical detail. A `Montage` compresses time. A `Revelation` builds toward a moment of disclosure. A `Confrontation` escalates tension between characters. A `Transition` bridges two major scenes. A `Climax` is the highest point of intensity. |
| `location`     | LocationRef                                                                                             | Optional | Where the scene takes place. References a location defined in a `world` block. Uses flat syntax (`ControlRoom`) or qualified syntax (`ResearchStation.ControlRoom`).                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pov`          | Cross-reference to a CharacterDef, or the keyword `Omniscient`                                          | Optional | Whose perspective governs this scene. Overrides the `default_pov` set in the `generate` block. When set to a character, the generated prose is filtered through that character's voice and perception.                                                                                                                                                                                                                                                                                                                                                                             |
| `layer`        | Cross-reference to a TimelineLayer                                                                      | Optional | Which temporal layer this scene belongs to. Tells the runtime what period-appropriate language and references to use.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `participants` | Array of character cross-references                                                                     | Optional | Which characters are present in this scene. The runtime will only generate dialogue and action for participants.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `atmosphere`   | Block of named mood values                                                                              | Optional | Numeric mood vector for the scene's emotional register. Overrides or supplements the location's atmosphere for this specific scene.                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `objective`    | STRING                                                                                                  | Optional | What this scene must accomplish narratively. A clear, specific directive to the runtime: not "something happens" but "the reader learns that Harlan knows Celeste's secret."                                                                                                                                                                                                                                                                                                                                                                                                       |
| `trigger`      | STRING                                                                                                  | Optional | The condition that initiates this scene. Expressed in plain language: "The lake level drops below the old roofline" or "Celeste opens the third letter." Useful for interactive narratives where scene order depends on prior events, or for any story where you want to make causal chains explicit.                                                                                                                                                                                                                                                                              |
| `transition`   | `Cut`, `Dissolve`, `Flashback`, `FlashForward`, `Parallel`, `Smash`, `Fade`, or `Montage`               | Optional | How this scene connects to the next. Influences the closing rhythm of the generated prose and any transitional text. A `Cut` ends abruptly; a `Dissolve` fades out gradually; a `Smash` cuts mid-action for maximum impact; a `Flashback` signals that the next scene is in the past.                                                                                                                                                                                                                                                                                              |

### Cross-References

- `location` references a LocationEntry defined in a world block (flat or qualified).
- `pov` references a CharacterDef by name, or uses the keyword `Omniscient`.
- `layer` references a TimelineLayer by name.
- `participants` is an array of CharacterDef references by name.
- Scenes themselves are referenced by name from `plot` subplot `converges_at` properties.

<div class="callout callout-info">
<p class="callout-title">Scene Atmosphere vs. Location Atmosphere</p>
<p>Both locations and scenes can define <code>atmosphere</code> blocks with named mood values. When both are present, the scene's atmosphere takes priority for that specific scene. Think of the location's atmosphere as the baseline mood of a place, and the scene's atmosphere as the particular emotional temperature during this specific event. A normally calm library (<code>tension: 10</code>) might have a scene atmosphere of <code>tension: 90</code> during a confrontation.</p>
</div>

### Example

```actone
scene TheLetterArrives {
  type: Revelation,
  location: NeonNostalgia.RooftopGarden,
  pov: Celeste,
  layer: Collapse,
  participants: [Celeste, Harlan],
  atmosphere: {
    tension: 70,
    intimacy: 60,
    dread: 45,
    wonder: 30,
  },
  objective: "Harlan delivers a letter that was found in the receding
              lake --- addressed to Celeste in handwriting she recognizes
              as her own, dated forty years before she was born. The scene
              must establish that the letter is genuine without explaining
              how it exists.",
  trigger: "The lake level drops below the roofline of the old post
            office, exposing the mail room for the first time in sixty
            years.",
  transition: Flashback,
}
```

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>The <code>objective</code> property is your most direct communication with the AI runtime. Be specific about what the scene must accomplish. "Celeste and Harlan talk" is too vague. "Harlan reveals that he has been reading the dead soldiers' letters before delivering them, and Celeste must decide whether to be angry or grateful" gives the runtime a concrete dramatic target.</p>
</div>

---

<h2 id="plot">7. Plot</h2>

A `plot` block defines the macro-level narrative arc --- the overarching structure that connects scenes with causality and direction. While timelines answer "when do things happen?", plots answer "why do things happen?" and "where is this going?"

Plots are built from structured beats, each representing a discrete story step. Beats can be assigned to acts (for three-act structure or custom act divisions) and typed according to their narrative function. Plots can also contain named subplots that run in parallel and converge at specific scenes.

A story can have multiple `plot` blocks --- one for the main arc, others for major subplots that deserve their own full beat structure. The `subplot` property within a plot block is for lighter secondary threads that you want to track without giving them the full beat-by-beat treatment.

The `conflict_type` and `resolution_pattern` properties work together to give the runtime a high-level trajectory for the narrative. A plot with `conflict_type: Existential` and `resolution_pattern: Ambiguous` generates very different prose from one with `conflict_type: Interpersonal` and `resolution_pattern: Redemptive`.

### Properties

| Property             | Type                                                                                                                  | Required | Description                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beats`              | Array of beat entries                                                                                                 | Optional | The sequence of story steps that form the plot's spine.                                                                                                                                                                                                                                                                                                                                                                           |
| `subplot`            | Named inline blocks                                                                                                   | Optional | Secondary plot threads that run alongside the main arc. Each subplot has its own name, written as `subplot SubplotName: { ... }`.                                                                                                                                                                                                                                                                                                 |
| `conflict_type`      | `Interpersonal`, `Internal`, `Intrapsychic`, `Societal`, `Environmental`, `Cosmic`, `Existential`, or `Technological` | Optional | The category of narrative conflict driving this plot. `Internal` is a character vs. themselves. `Intrapsychic` is more specific: a character vs. a fragmented part of themselves (useful for psychological or allegorical narratives). `Societal` is character vs. social structures. `Cosmic` is character vs. forces beyond human comprehension. `Technological` is character vs. technology or the consequences of technology. |
| `resolution_pattern` | `Transformative`, `Tragic`, `Redemptive`, `Ambiguous`, `Cyclical`, `Pyrrhic`, or `Transcendent`                       | Optional | How the plot resolves. Gives the runtime a destination to steer toward. `Pyrrhic` means the characters win but at a cost that makes victory feel like loss. `Ambiguous` means the ending resists clean interpretation. `Cyclical` means the story returns to where it began, changed only in the characters' understanding.                                                                                                       |

### Beat Entries

Each entry in the `beats` array is a structured object:

| Property | Type                                                                                                                    | Description                                                                                                                                                                                                                                                                                                                           |
| -------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beat`   | STRING                                                                                                                  | A description of what happens at this story step. Write this as a concise but complete summary of the event, not just a label. "Elena discovers the signal" is less useful than "Elena notices an anomalous pattern in the background noise of the deep-space array and realizes it is not random --- it responds to her keystrokes." |
| `act`    | NUMBER                                                                                                                  | Which act this beat belongs to. Use 1, 2, 3 for three-act structure, or any numbering scheme that fits your narrative. You can use 4, 5, or more acts if your story structure demands it.                                                                                                                                             |
| `type`   | `Setup`, `Inciting`, `Rising`, `Midpoint`, `Complication`, `Crisis`, `Climax`, `Falling`, `Resolution`, or `Denouement` | The narrative function of this beat. This tells the runtime how to calibrate intensity, pacing, and emotional register for this step in the arc.                                                                                                                                                                                      |

### Subplot Blocks

Subplots are declared inline within a plot block. Unlike other properties that use `property: value` syntax, subplots use a named block syntax: `subplot SubplotName: { ... }`. The subplot name is a DefinitionName (bare identifier or quoted string) that identifies the subplot in the Outline panel.

A single plot can contain multiple subplots. Each subplot is a lighter-weight thread that you want to track without giving it the full structured-beat treatment of a top-level `plot` block. Use subplots for secondary storylines that gain their meaning from their relationship to the main arc.

Properties within a subplot block:

| Property       | Type                          | Description                                                                                                                  |
| -------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `description`  | STRING                        | What this subplot is about.                                                                                                  |
| `beats`        | STRING array                  | The sequence of steps in this subplot, expressed as simple strings rather than structured beat objects.                      |
| `converges_at` | Cross-reference to a SceneDef | The scene where this subplot merges with the main plot. This cross-reference must match the name of a defined scene exactly. |

### Cross-References

- Subplot `converges_at` references a SceneDef by name.
- Plots themselves are not cross-referenced by other elements.

### Example

```actone
plot TheReceding {
  beats: [
    {
      beat: "Celeste receives the first batch of Maren's letters and
            begins translating them as routine work.",
      act: 1,
      type: Setup,
    },
    {
      beat: "One letter contains a physical description of Celeste's
            village --- written decades before she moved there.",
      act: 1,
      type: Inciting,
    },
    {
      beat: "Celeste cross-references the letters with historical records
            and discovers that Maren was stationed near Aleppo at the
            same time she was.",
      act: 1,
      type: Rising,
    },
    {
      beat: "Maren's daughter arrives in the village. Her resemblance
            to someone Celeste knew in Syria is unmistakable.",
      act: 2,
      type: Midpoint,
    },
    {
      beat: "Celeste finds the letter addressed to her personally.
            Maren knew her name. Maren knew what happened.",
      act: 2,
      type: Complication,
    },
    {
      beat: "The lake drops and the old town emerges. A letter in
            Celeste's handwriting surfaces --- dated before her birth.",
      act: 2,
      type: Crisis,
    },
    {
      beat: "Celeste confronts the impossibility: she has been
            translating her own future correspondence. The dead
            soldier was writing back to her.",
      act: 3,
      type: Climax,
    },
    {
      beat: "She writes her own letter for the first time in eleven
            years --- not a translation, not a reply, but an original
            document addressed to no one and everyone.",
      act: 3,
      type: Resolution,
    },
    {
      beat: "The dam is repaired. The water rises again. The old town
            disappears. But Celeste mails her letter before the post
            office is re-submerged.",
      act: 3,
      type: Denouement,
    }
  ],

  subplot HarlansSilence: {
    description: "Harlan has been reading the letters before delivering
                 them. He knows more than Celeste realizes, and his
                 silence is both protective and selfish.",
    beats: [
      "Harlan hesitates before handing over the third batch of letters",
      "Celeste notices a crease in a letter that was not there when
       it was sealed",
      "Harlan confesses: he has read every letter. He delivers them
       anyway because stopping would mean Celeste has no reason to
       see him."
    ],
    converges_at: TheLetterArrives,
  },

  subplot TheDaughtersVisit: {
    description: "Maren's daughter did not come to collect letters.
                 She came because her father told her, in his final
                 lucid moment, to find the woman who would understand.",
    beats: [
      "The daughter arrives and asks for a room, not the letters",
      "She reveals that she is not dying --- Celeste misunderstood
       the request",
      "The daughter and Celeste sit in silence and watch the lake
       recede together"
    ],
    converges_at: TheLetterArrives,
  },

  conflict_type: Existential,
  resolution_pattern: Ambiguous,
}
```

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>Beat types do not need to follow a rigid sequence. A story might have multiple <code>Complication</code> beats, skip <code>Falling</code> entirely, or place the <code>Climax</code> before the <code>Crisis</code>. The types are signals to the runtime about how to calibrate intensity, not a formula to follow.</p>
</div>

---

<h2 id="interaction">8. Interaction</h2>

An `interaction` block defines how a specific grouping of characters communicates --- the rhythm, subtext, power dynamics, and emotional arc of their exchanges. While scenes describe _what happens_, interactions describe _how it feels_ when particular characters are in conversation.

Interactions are separate from scenes because the same character pairing might interact across multiple scenes with the same underlying dynamic. Defining the interaction once and referencing the characters ensures that the runtime maintains consistent interpersonal texture regardless of where the characters meet.

You can define multiple interactions for the same set of characters to capture how their dynamic shifts over the course of the story. An early interaction might have one power dynamic; a late-story interaction might reverse it entirely. The names you give interactions should reflect what makes each one distinct: `LetterHandoff`, `TheConfrontation`, `QuietReconciliation`.

### Properties

| Property        | Type                                | Required | Description                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------- | ----------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `participants`  | Array of character cross-references | Optional | Which characters are involved in this interaction pattern.                                                                                                                                                                                                                                                                                                                                                                               |
| `pattern`       | STRING                              | Optional | The rhythm of the interaction, expressed in arrow notation. Each step is a phase of the conversation: `"provocation -> deflection -> escalation -> rupture -> silence"`. The arrow notation gives the runtime a beat-by-beat roadmap for the conversational structure.                                                                                                                                                                   |
| `style_mix`     | Block mapping characters to numbers | Optional | Voice blending ratios --- how much each character's speech style dominates the interaction. Values are relative weights. For example, `Celeste: 70, Harlan: 30` means Celeste's voice carries the interaction --- her vocabulary, sentence structure, and emotional register will be more prominent in the narration. This is especially useful when one character dominates a conversation and the prose should reflect that imbalance. |
| `subtext`       | STRING                              | Optional | What is really being communicated beneath the surface dialogue. The runtime uses this to generate dialogue that says one thing while meaning another.                                                                                                                                                                                                                                                                                    |
| `power_dynamic` | STRING                              | Optional | Who holds leverage and how it shifts. A clear statement of asymmetry that the runtime uses to calibrate deference, assertiveness, and vulnerability in the generated prose.                                                                                                                                                                                                                                                              |
| `emotional_arc` | STRING                              | Optional | How the emotional register shifts across the interaction, in arrow notation: `"wariness -> curiosity -> tenderness -> retreat"`. Unlike `pattern` (which describes what happens), `emotional_arc` describes how it _feels_. The runtime uses this to modulate word choice, sentence length, and rhythm as the interaction progresses.                                                                                                    |

### Cross-References

- `participants` is an array of CharacterDef references by name.
- `style_mix` entries use CharacterDef references as keys. Every character listed in `style_mix` must also be a defined character in the project.
- Interactions are not cross-referenced by other elements --- they stand alone as reusable descriptions of interpersonal dynamics.

<div class="callout callout-info">
<p class="callout-title">Interactions vs. Scenes</p>
<p>A common question is when to use an interaction versus describing character dynamics directly in a scene. The answer is about reusability and specificity. If two characters interact in only one scene, define their dynamic in the scene's <code>objective</code> and let the character definitions do the rest. If the same pairing appears in multiple scenes with a consistent underlying dynamic, define an interaction. The interaction captures the enduring pattern; the scene captures the specific moment.</p>
</div>

### Example

```actone
interaction LetterHandoff {
  participants: [Celeste, Harlan],
  pattern: "arrival -> small talk about weather -> the pause where both
            know what comes next -> Harlan produces the letters -> Celeste
            takes them without looking at his face -> a question that is
            really an invitation -> a deflection that is really fear ->
            departure",
  style_mix: {
    Celeste: 65,
    Harlan: 35,
  },
  subtext: "Both characters want connection but have built their
            relationship around a ritual that prevents it. The letters
            are the excuse for proximity. Every interaction is a
            negotiation about whether today is the day one of them
            breaks the pattern.",
  power_dynamic: "Celeste holds structural power --- she is the one with
                  the skill, the one Harlan comes to. But Harlan holds
                  emotional power --- he could stop delivering letters
                  and end the only recurring human contact in her life.
                  Neither acknowledges this openly.",
  emotional_arc: "cautious warmth -> brittle formality -> a moment of
                  unguarded honesty -> immediate retreat into roles ->
                  lingering glance that neither will mention",
}
```

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>The <code>subtext</code> and <code>power_dynamic</code> properties are what distinguish flat dialogue from layered, compelling conversation. If you invest time anywhere in the interaction definition, invest it here. A well-written subtext can transform a mundane exchange into a scene that vibrates with unspoken meaning.</p>
</div>

---

<h2 id="validation">Validation Rules</h2>

ActOne validates your project continuously as you write, flagging issues in the Problems panel. Understanding what the validator checks helps you write clean definitions from the start and avoid frustrating error-hunting later.

Validation issues fall into two categories: errors (which indicate something that will break generation or produce incorrect results) and warnings (which indicate places where the runtime will have to guess instead of following your explicit instructions).

### Errors (Must Fix)

Errors indicate problems that will prevent generation from working correctly or produce incorrect results. You should resolve all errors before generating prose from your project.

- **Unresolved cross-references.** If a scene references a character named `Celest` but you defined `Celeste`, the validator flags an error. Names are case-sensitive and must match exactly. This is the most common error in ActOne projects, and it usually results from a typo or a renamed element that was not updated everywhere. The Problems panel will show you the exact location of the unresolved reference.
- **Duplicate `generate` blocks.** Only one `generate` block is allowed per project across all files. If you are working in a multi-file project, make sure the `generate` block lives in only one file --- typically your main file or a dedicated `settings.act` file.

### Warnings (Should Fix)

Warnings indicate places where your project is technically valid but could produce better results with more information. The runtime will fill in gaps with defaults, but your output will be more distinctive and consistent if you address warnings.

- **Missing `voice` on a character.** The validator warns if a character definition lacks a `voice` property, because voice is the single most important factor in generation quality. A character without a voice will receive generic, undifferentiated prose.
- **Goals without `priority`.** The validator warns if a goal entry does not specify `Primary`, `Secondary`, or `Hidden`. Without priority, the runtime cannot determine which goals should drive the character's behavior in any given scene.
- **Worlds without rules.** The validator warns if a `world` block has no `rules` array, since rules help the runtime maintain consistency across scenes. Even a simple story benefits from at least one or two rules that establish what is and is not possible.
- **Duplicate element names.** If two characters share the same name, or two scenes share the same name, the validator warns about the ambiguity. While duplicate names do not necessarily break anything, they can cause unexpected behavior when the runtime resolves cross-references. Rename one of the duplicates to make each name unique within its element type.

### Common Error Patterns

Beyond the specific checks above, some patterns frequently cause problems for new ActOne writers:

- **Renaming an element but forgetting to update references.** If you rename a character from `Elena` to `Celeste`, every scene participant list, relationship target, interaction participant, and pov reference that used `Elena` must also be updated. The Problems panel will show you all the places where the old name is still in use.
- **Mismatched quoting.** If you define a character with a quoted name (`character "Ada Lovelace"`) but reference it without quotes (`participants: [Ada Lovelace]`), the validator will not find a match. Use consistent quoting everywhere.
- **Referencing a location without defining it.** If a scene references `location: Library` but no world has a location named `Library`, the validator flags an unresolved reference. Make sure every location referenced in a scene exists inside a world block.

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>Warnings do not prevent your project from working, but they indicate places where the runtime will have to guess instead of following your explicit instructions. Fix warnings when you can --- your generated output will be better for it.</p>
</div>

---

<h2 id="cross-reference-patterns">Cross-Reference Patterns</h2>

ActOne elements frequently reference one another. A scene points to a location, a relationship points to another character, a subplot converges at a scene. Understanding how cross-references work prevents the most common validation errors and helps you build a tightly connected narrative that the Diagram panel can visualize clearly.

Cross-references are resolved by name. When you write `participants: [Celeste, Harlan]` in a scene, the validator searches all defined characters for ones named `Celeste` and `Harlan`. If it finds them, the reference is resolved. If it does not, you get an error.

### Character References

Characters are referenced by their definition name in several contexts:

- **Scene `participants`** --- an array of character names indicating who is present.
- **Scene `pov`** --- the character whose perspective governs the scene.
- **Relationship `to`** --- the target character in a relationship entry.
- **Interaction `participants`** --- who is involved in the interaction.
- **Interaction `style_mix`** --- character names used as keys in the voice blending map.

### Location References

Locations are the second most commonly cross-referenced element after characters. They support two reference syntaxes:

- **Flat**: `ControlRoom` --- works when the location name is unambiguous across all worlds.
- **Qualified**: `ResearchStation.ControlRoom` --- uses the world name as a prefix, separated by a dot. Required when multiple worlds define locations with the same name.

Location references appear in:

- **Scene `location`** --- where the scene takes place.
- **Location `connects_to`** --- spatial adjacency between locations.

### Scene References

Scenes are referenced by name in one context:

- **Subplot `converges_at`** --- the scene where a subplot merges with the main plot. This is the only place where scenes are cross-referenced by other elements. The scene must be defined somewhere in the project for the reference to resolve.

### Timeline Layer References

Timeline layers are referenced by name in one context:

- **Scene `layer`** --- which temporal layer the scene belongs to. The layer must be defined inside a `timeline` block somewhere in the project.

### Name Matching Rules

- Names are **case-sensitive**: `Celeste` and `celeste` are different names.
- Quoted names must be referenced with the same quoting: if you define `character "Elena Vasquez"`, you must reference `"Elena Vasquez"` (not `Elena` or `ElenaVasquez`).
- Names can be bare identifiers (`Celeste`, `BackAlley`) or quoted strings (`"Elena Vasquez"`, `"Control Room"`). Use quoted strings when names contain spaces or punctuation.

### Cross-References in Multi-File Projects

Cross-references work seamlessly across file boundaries. A character defined in `characters.act` can be referenced by a scene in `scenes.act` without any special import syntax --- the validator resolves all names across the entire project automatically.

This means you must ensure that names are unique within each element type across all files --- two characters named `Celeste` in different files will trigger a duplicate-name warning. Names of different element types can overlap without conflict: a character named `Celeste` and a scene named `Celeste` are distinct elements and will not confuse the validator, because references are always resolved within the expected element type.

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>Adopt a consistent naming convention early. If you use bare identifiers for character names (<code>Celeste</code>, <code>Harlan</code>), stick with that pattern everywhere. Mixing bare and quoted names for the same character is a common source of unresolved-reference errors.</p>
</div>

---

<h2 id="putting-it-together">Putting It All Together</h2>

The eight element types work as an ensemble. A complete ActOne project typically includes:

- A single `generate` block that sets the global voice of the narrative.
- One or more `theme` blocks that declare the ideas the story explores.
- Several `character` blocks --- each richly detailed with voice, goals, and relationships that cross-reference other characters.
- One or more `world` blocks with locations, rules, and sensory palettes that ground the story in a specific place and time.
- A `timeline` with layers, if the story is non-linear.
- Multiple `scene` blocks that bring characters into locations, assign points of view, set atmospheric moods, and state clear objectives.
- A `plot` block (or several) that organizes scenes into a macro-level arc with typed beats and optional subplots.
- `interaction` blocks for the key character pairings where subtext and power dynamics matter most.

You do not need all eight element types to start writing. A minimal project might contain a single character, a single world with one location, and a single scene. You can add themes, timelines, plots, and interactions as your story grows and you discover what it needs.

The order in which you define elements does not matter syntactically, but many writers find a natural workflow: start with characters and a world, then write scenes that bring them together, then add a plot to give those scenes an arc, then define interactions for the key pairings, and finally add themes and a generate block to refine the overall voice. Others prefer to start with the theme and work outward. ActOne supports any order.

For a guided walkthrough of building a project from scratch, see [Your First Story](/getting-started/04-first-story/). For information on organizing elements across multiple files, see [Multi-File Projects](/user-guide/03-multi-file/).

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>If you are feeling overwhelmed by the number of properties available, remember: the most impactful properties for generation quality are character <code>voice</code>, scene <code>objective</code>, interaction <code>subtext</code>, and world <code>rules</code>. Invest your time in those four areas first, and layer in additional detail as your story takes shape.</p>
</div>
