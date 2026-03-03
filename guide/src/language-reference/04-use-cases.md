---
title: Use Cases
order: 4
description: Complete ActOne examples across different genres and project structures.
---

This page presents four complete ActOne examples spanning different genres, structural complexities, and project organizations. Each example is a working ActOne document you can type into ActOne Studio as-is. Use them as starting points for your own projects, or study them to see how ActOne's elements work together in practice.

Every example includes the full ActOne code, a description of the creative scenario it targets, annotations explaining key design decisions, and a summary of what the AI runtime would produce from the configuration.

---

<h2 id="use-case-1">Use Case 1: Simple Single-Character Story</h2>

### Scenario

A short, intimate domestic drama. A retired teacher named Helen sits alone in her kitchen on the morning after her husband's funeral. The story is a single scene of quiet reflection -- no action sequences, no dialogue partners, no branching timelines. This example demonstrates that ActOne works just as well for small, focused pieces as it does for sprawling multi-character epics.

The goal is to show the minimum viable configuration that still produces rich, tonally consistent output.

### ActOne Code

```actone
story "The Morning After" {

  // A single character with a fully realized interior life.
  character "Helen" {
    nature: Human,
    bio: "A retired English teacher, seventy-two years old. She taught Keats and Dickinson for forty years and still thinks in verse. Her husband Arthur died two days ago after a long illness. She is not devastated -- she is something quieter than that, something she does not yet have a word for.",
    role: "protagonist",
    voice: "Interior, unhurried, precise. She notices small things -- the angle of light on a countertop, the weight of a coffee cup. Her thoughts arrive in complete sentences, as if she is grading her own grief for clarity.",

    personality: {
      composure: 85,
      introspection: 90,
      warmth: 60,
      stubbornness: 70,
      sentimentality: 35,
    },

    goals: [
      {
        goal: "Get through this first ordinary morning alone",
        priority: Primary,
        stakes: "If she cannot do this, the rest of her life becomes unimaginable",
      },
      {
        goal: "Resist the urge to perform grief for an audience that is not there",
        priority: Secondary,
        stakes: "Her dignity, which is the only thing she has left that feels entirely her own",
      },
    ],

    conflicts: [
      "She is relieved the long illness is over, and the relief disgusts her",
      "She keeps catching herself narrating her own experience as if teaching it",
    ],

    strengths: ["Emotional precision", "Self-awareness", "Discipline"],
    flaws: ["Intellectualizes feeling", "Struggles to accept help"],

    arc: {
      start: "Performing normalcy -- making coffee, reading the paper -- as if routine can hold grief at bay",
      end: "Allowing one unscripted moment of raw feeling, then choosing to continue the morning anyway",
      catalyst: "Arthur's reading glasses, still on the kitchen table where he left them six weeks ago",
      midpoint: "She realizes she has been teaching herself how to grieve instead of actually grieving",
      turning_point: "She picks up the glasses, holds them, and puts them back without cleaning the lenses",
    },

    symbols: ["Arthur's reading glasses", "The kitchen clock", "Cold coffee"],
    secret: "She said goodbye to Arthur in her heart three months before he died, and she has not forgiven herself for it",
    notes: [
      "Keep the prose rhythm slow and deliberate, mirroring her composure",
      "Physical details should carry emotional weight without explicit commentary",
    ],
  }

  // A minimal world -- one room is all this story needs.
  world "Helen's House" {
    period: "Contemporary, late autumn",
    sensory: [
      "Weak morning light through thin curtains",
      "The smell of coffee that has been sitting too long",
      "The tick of a kitchen clock that sounds louder than it used to",
      "Cold tile underfoot",
    ],
    locations: [
      {
        name: "Kitchen",
        description: "A modest kitchen, clean but not immaculate. Magnets hold grandchildren's drawings to the refrigerator. One chair at the table has a cushion on it; the other does not. The window above the sink faces east.",
      },
    ],
  }

  // One scene of pure reflection.
  scene "First Morning Alone" {
    type: Reflection,
    location: "Kitchen",
    pov: "Helen",
    participants: ["Helen"],
    atmosphere: {
      stillness: 90,
      grief: 65,
      resolve: 40,
    },
    objective: "Helen confronts the first ordinary morning of her new life and discovers that grief is not a storm but an alteration in gravity",
    trigger: "The coffee maker finishes brewing and nobody calls from the other room",
    transition: Fade,
  }

  // A small, focused plot.
  plot "The Quiet Reckoning" {
    beats: [
      { beat: "Helen enters the kitchen and begins her morning routine", act: 1, type: Setup },
      { beat: "She notices Arthur's glasses on the table", act: 1, type: Inciting },
      { beat: "She catches herself narrating her grief as if it were a lesson", act: 2, type: Midpoint },
      { beat: "She picks up the glasses and holds them without thinking", act: 3, type: Climax },
      { beat: "She sets them down, drinks her coffee, and watches the light move", act: 3, type: Resolution },
    ],
    conflict_type: Internal,
    resolution_pattern: Transformative,
  }

  // Generation settings tuned for intimate literary fiction.
  generate {
    temperature: 0.7,
    max_tokens: 4000,
    continuity_loss: 0.05,
    style_bleed: false,
    genre: "literary fiction",
    tone: ["intimate", "restrained", "luminous"],
    tense: Present,
    default_pov: FirstPerson,
    pacing: Slow,
    chapter_breaks: false,
  }
}
```

### Annotations

**Character depth for a solo cast.** Even though Helen is the only character, her profile is detailed. The `personality` traits (high composure, high introspection, low sentimentality) give the AI precise dials to work with. A character with `sentimentality: 35` will express grief through observation and understatement rather than overt weeping -- which is exactly the tone this story requires.

**Goals with stakes.** Helen's primary goal ("get through this morning") is deceptively simple. The `stakes` field elevates it: this is not about coffee, it is about whether she can imagine a future. The AI runtime uses stakes to calibrate the emotional weight of each beat.

**Arc within a single scene.** The arc moves from performed composure to a single unguarded moment. The `catalyst` (Arthur's glasses) is a concrete object that the runtime can weave through the scene as a recurring image. The `turning_point` is the moment where the arc pivots: she picks up the glasses but does not clean them -- a tiny act of accepting imperfection.

**Minimal world, maximum atmosphere.** The `sensory` array gives the runtime four specific sensory anchors. These are not abstract moods; they are physical details the AI can drop into prose: "the tick of a kitchen clock that sounds louder than it used to." The single location is richly described so the runtime has spatial detail to work with.

**Scene atmosphere as a mood vector.** The `atmosphere` block uses numeric values: `stillness: 90, grief: 65, resolve: 40`. These tell the runtime the emotional proportions of the scene. Stillness dominates; grief is present but not overwhelming; resolve is low but not absent. The output will feel quiet and heavy, not dramatic.

**Generation settings for literary fiction.** `temperature: 0.7` keeps the prose controlled but not mechanical. `continuity_loss: 0.05` ensures near-perfect memory, so details from the beginning of the scene (the glasses, the light angle) reappear naturally at the end. `style_bleed: false` is irrelevant with one character but is good practice to set explicitly. `pacing: Slow` tells the runtime to linger on moments rather than advancing quickly.

<div class="callout callout-info">
<div class="callout-title">Expected Output</div>
<p>This configuration would produce a 2,000-4,000 word first-person present-tense story. The prose would be quiet and precise, built from physical observations that carry emotional weight. The story would move through Helen's morning routine, pivot on the discovery of Arthur's glasses, and resolve in a small moment of acceptance -- not closure, but a willingness to continue. The reader should feel the silence of the kitchen.</p>
</div>

---

<h2 id="use-case-2">Use Case 2: Complex Multi-Character Drama</h2>

### Scenario

A literary fiction piece set in a small coastal town. Three women -- a harbormaster, a marine biologist, and a recently arrived painter -- are drawn into conflict over a proposed development that would destroy the town's tidal marshes. The story explores how personal history shapes public conviction, and how people who share a cause can still fundamentally misunderstand each other.

This example shows how all of ActOne's elements work together: multiple characters with relationships and arcs, a rich world with multiple locations and rules, several scenes of different types, a structured plot with beats and a subplot, a theme, and interactions that reveal subtext beneath surface dialogue.

### ActOne Code

```actone
story "Salt and Stone" {

  // --- CHARACTERS ---

  character "June" {
    nature: Human,
    bio: "Harbormaster of Tidewater for twenty-three years. Her father held the post before her. She knows every boat, every current, every family in town. She opposed the development long before the environmentalists arrived, but nobody listened to her then.",
    role: "protagonist",
    voice: "Blunt, declarative, rooted in the concrete. She speaks in short sentences and measures people by what they do, not what they say. She distrusts eloquence.",

    personality: {
      pragmatism: 90,
      loyalty: 80,
      patience: 30,
      pride: 75,
      openness: 25,
    },

    goals: [
      { goal: "Stop the marsh development", priority: Primary, stakes: "The harbor ecosystem she has spent her life protecting" },
      { goal: "Be recognized as the person who sounded the alarm first", priority: Hidden, stakes: "Her sense of worth in a town that has started looking past her" },
    ],

    conflicts: [
      "Resents Claire for receiving attention June never got for the same cause",
      "Fears that her opposition is partly about control, not conservation",
    ],

    strengths: ["Institutional knowledge", "Community trust", "Physical endurance"],
    flaws: ["Territorial", "Dismissive of outsiders", "Cannot ask for help"],

    relationships: [
      { to: "Claire", weight: -20, label: "uneasy ally", history: "Claire arrived six months ago with data that proved what June had been saying for years, and the town listened to Claire.", dynamic: true },
      { to: "Margot", weight: 45, label: "cautious respect", history: "Margot paints the harbor every morning. June tolerates her because she is quiet and does not get in the way.", dynamic: true },
    ],

    arc: {
      start: "Guarding her territory against outsiders who she believes do not understand the town",
      end: "Accepting that saving the marsh requires allies she did not choose",
      catalyst: "Claire presents data at a town meeting that echoes June's warnings word for word, without crediting her",
      midpoint: "June confronts Claire and learns that Claire cited June's harbor logs as her primary source",
      turning_point: "June sees Margot's painting of the marsh and realizes the town's memory lives in many forms, not just hers",
    },

    symbols: ["Tide charts", "Her father's binoculars"],
    secret: "She voted for the development committee chair ten years ago, before she understood what the position would become",
  }

  character "Claire" {
    nature: Human,
    bio: "Marine biologist, thirty-four. She left an academic career after a departmental scandal and came to Tidewater to do fieldwork that mattered. She is brilliant, awkward, and unaware of how her competence reads as arrogance to people who have lived here their whole lives.",
    role: "catalyst",
    voice: "Precise, data-driven, occasionally lyrical when she forgets herself. She quotes research by reflex and catches herself too late. When nervous, she talks faster and longer.",

    personality: {
      intellect: 92,
      empathy: 55,
      anxiety: 70,
      determination: 85,
      social_awareness: 30,
    },

    goals: [
      { goal: "Produce irrefutable evidence that the development will destroy the marsh ecosystem", priority: Primary, stakes: "The only meaningful work she has done since leaving academia" },
      { goal: "Earn the town's trust as a genuine ally, not a visiting expert", priority: Secondary, stakes: "Her ability to stay and build a life here" },
    ],

    conflicts: [
      "Her academic rigor makes her dismiss local knowledge she should respect",
      "She wants to belong but does not know how to stop performing expertise",
    ],

    strengths: ["Scientific rigor", "Tenacity", "Genuine passion for the ecosystem"],
    flaws: ["Tone-deaf in social situations", "Overexplains", "Avoids personal vulnerability"],

    relationships: [
      { to: "June", weight: 35, label: "admiration", history: "Claire found June's harbor logs and considers them the most valuable ecological dataset she has ever seen. She does not know June resents her.", dynamic: true },
      { to: "Margot", weight: 60, label: "friendship", history: "Margot is the first person in Tidewater who treated Claire like a neighbor instead of a credential.", dynamic: false },
    ],

    arc: {
      start: "Hiding behind data to avoid the personal risk of community engagement",
      end: "Learning to present findings as shared knowledge rather than expert testimony",
      catalyst: "June's public confrontation at the town meeting",
      midpoint: "Margot asks Claire to explain the marsh to her in words a painter would use, and Claire discovers she can",
      turning_point: "Claire credits June's logs publicly and steps back from the podium",
    },

    symbols: ["Water sample vials", "A field notebook with pressed marsh grass"],
  }

  character "Margot" {
    nature: Human,
    bio: "Painter, sixty-one. She arrived in Tidewater eight months ago after her wife's death, looking for a place where the light was different. She paints the harbor and the marsh every day, not because she has something to say about conservation but because beauty is the only argument she trusts.",
    role: "witness and bridge",
    voice: "Spare, observational, unhurried. She listens more than she speaks. When she does speak, she uses images rather than arguments. She never raises her voice.",

    personality: {
      observation: 95,
      gentleness: 80,
      detachment: 60,
      grief: 50,
      courage: 65,
    },

    goals: [
      { goal: "Paint something true about the marsh before it changes", priority: Primary, stakes: "Her belief that art can hold what politics cannot" },
      { goal: "Find a reason to stay in Tidewater beyond the light", priority: Hidden, stakes: "Whether she can build a life again after loss" },
    ],

    strengths: ["Seeing what others overlook", "Emotional steadiness", "Creating common ground through art"],
    flaws: ["Uses detachment as a shield", "Reluctant to commit to causes", "Avoids conflict"],

    relationships: [
      { to: "June", weight: 50, label: "quiet companionship", history: "They share the harbor mornings. June talks; Margot paints. Neither asks the other for more than presence.", dynamic: true },
      { to: "Claire", weight: 60, label: "friendship", history: "Margot brought Claire dinner the week she arrived and has been her anchor in town since.", dynamic: false },
    ],

    arc: {
      start: "Observing from the margins, committed to nothing except the next painting",
      end: "Choosing to exhibit her marsh paintings as a public act, stepping from witness to participant",
      catalyst: "The development committee posts bulldozing schedules on the marsh fence",
      midpoint: "She paints the fence itself -- the schedules, the wire, the mud -- and realizes she is making a political painting for the first time",
      turning_point: "She offers to hang her paintings at the town meeting, giving June and Claire's data an emotional frame",
    },

    symbols: ["A palette knife", "The color of marsh grass at low tide"],
    secret: "She came to Tidewater because her wife had always wanted to see the marshes, and painting them is Margot's way of keeping that promise",
  }

  // --- WORLD ---

  world "Tidewater" {
    period: "Contemporary, early spring",
    sensory: [
      "Salt wind off the harbor",
      "The creak of dock lines at low tide",
      "Marsh grass that smells like wet iron",
      "Gull cries that sharpen before storms",
    ],
    locations: [
      {
        name: "Harbor Office",
        description: "A clapboard building at the end of the main dock. Tide charts cover every wall. The coffee is always burnt. June's desk faces the window so she can watch the water while she works.",
        atmosphere: { authority: 70, routine: 85, isolation: 40 },
      },
      {
        name: "Tidal Marsh",
        description: "A mile-long stretch of salt marsh between the harbor and the headland. At low tide, the mud flats shine like pewter. Egrets stand motionless in the shallows. The development company wants to fill it for a resort.",
        atmosphere: { beauty: 90, fragility: 80, tension: 50 },
      },
      {
        name: "Town Hall",
        description: "A converted church with creaky pews and bad acoustics. Town meetings happen here every other Tuesday. The stained glass casts colored light across the speaker's podium.",
        atmosphere: { formality: 60, conflict: 70, history: 75 },
      },
      {
        name: "Margot's Cottage",
        description: "A rented saltbox at the edge of town. Canvases lean against every wall. The kitchen table is covered in paint tubes and marsh grass samples Claire has given her. Light comes in from the north.",
        atmosphere: { creativity: 85, solitude: 70, warmth: 55 },
      },
    ],
    rules: [
      { rule: "The tide governs daily rhythms -- when boats go out, when the marsh is accessible, when the harbor office opens", category: Physical },
      { rule: "Newcomers are watched for at least a year before the town decides whether they belong", category: Social },
      { rule: "The development committee has legal authority but not moral authority; the town defers to custom over law", category: Social },
    ],
  }

  // --- SCENES ---

  scene "Harbor Morning" {
    type: Reflection,
    location: "Harbor Office",
    pov: "June",
    participants: ["June"],
    atmosphere: { routine: 80, unease: 45 },
    objective: "Establish June's world and the quiet dread beneath her daily routine",
    transition: Dissolve,
  }

  scene "The Data Presentation" {
    type: Confrontation,
    location: "Town Hall",
    pov: "June",
    participants: ["June", "Claire"],
    atmosphere: { tension: 85, resentment: 60, admiration: 20 },
    objective: "Claire presents her findings; June recognizes her own data and feels both validated and erased",
    trigger: "The biweekly town meeting agenda includes Claire's marsh report",
    transition: Cut,
  }

  scene "Painting the Marsh" {
    type: Reflection,
    location: "Tidal Marsh",
    pov: "Margot",
    participants: ["Margot"],
    atmosphere: { beauty: 90, grief: 40, purpose: 60 },
    objective: "Margot paints the marsh and thinks about her wife, her art, and whether beauty is a sufficient response to destruction",
    transition: Dissolve,
  }

  scene "The Explanation" {
    type: Dialogue,
    location: "Margot's Cottage",
    pov: "Claire",
    participants: ["Claire", "Margot"],
    atmosphere: { intimacy: 75, discovery: 65 },
    objective: "Margot asks Claire to explain the marsh in non-scientific language; Claire discovers a new way to talk about her work",
    trigger: "Margot invites Claire for tea and asks to understand what she is fighting for",
    transition: Dissolve,
  }

  scene "The Confrontation" {
    type: Confrontation,
    location: "Harbor Office",
    pov: "June",
    participants: ["June", "Claire"],
    atmosphere: { anger: 70, vulnerability: 50, respect: 30 },
    objective: "June confronts Claire about taking credit; Claire reveals she cited June's logs; both women recalibrate",
    trigger: "June finally reads Claire's full report and finds her own name in the acknowledgments",
    transition: Cut,
  }

  scene "The Exhibition" {
    type: Climax,
    location: "Town Hall",
    participants: ["June", "Claire", "Margot"],
    atmosphere: { solidarity: 75, tension: 60, hope: 55 },
    objective: "Margot's paintings frame June's data and Claire's science; the town sees the marsh through all three lenses at once",
    trigger: "The final town meeting before the development vote",
    transition: Fade,
  }

  // --- PLOT ---

  plot "Saving the Marsh" {
    beats: [
      { beat: "June watches the harbor alone, aware the development vote is approaching", act: 1, type: Setup },
      { beat: "Claire presents her data at the town meeting without crediting June", act: 1, type: Inciting },
      { beat: "Margot paints the marsh and begins to see her art as more than personal", act: 2, type: Rising },
      { beat: "Claire explains the ecosystem to Margot in plain language and finds her voice", act: 2, type: Midpoint },
      { beat: "June confronts Claire and discovers she was cited all along", act: 2, type: Complication },
      { beat: "The development committee posts bulldozing schedules", act: 2, type: Crisis },
      { beat: "Margot offers her paintings for the final town meeting", act: 3, type: Climax },
      { beat: "The three women present a unified case -- data, history, and art", act: 3, type: Resolution },
    ],

    subplot "Margot's Grief": {
      description: "Margot's journey from private mourning to public engagement, driven by her promise to her wife",
      beats: [
        "Margot arrives in Tidewater and paints in silence",
        "She befriends Claire and begins to connect to the town",
        "She paints the development fence and crosses from witness to participant",
      ],
      converges_at: "The Exhibition",
    },

    conflict_type: Interpersonal,
    resolution_pattern: Transformative,
  }

  // --- THEME ---

  theme "Whose Knowledge Counts" {
    statement: "Knowledge takes many forms -- empirical, experiential, artistic -- and no single form is sufficient to protect what matters",
    motifs: [
      "Tide charts and data printouts",
      "Paint on canvas",
      "The marsh itself as a living record",
    ],
    counter: "That expertise and credentials are the only valid forms of knowledge",
    tension: "Each character believes her own way of knowing is the truest, and must learn to see the others as complementary rather than competing",
  }

  // --- INTERACTIONS ---

  interaction "June and Claire" {
    participants: ["June", "Claire"],
    pattern: "accusation -> defense -> revelation -> recalibration -> grudging respect",
    style_mix: {
      "June": 65,
      "Claire": 35,
    },
    subtext: "June needs to be seen as the origin of this fight; Claire needs to be seen as more than a credential",
    power_dynamic: "June holds institutional authority; Claire holds scientific authority; neither has the authority the other respects",
    emotional_arc: "resentment -> confrontation -> surprise -> cautious alliance",
  }

  interaction "Claire and Margot" {
    participants: ["Claire", "Margot"],
    pattern: "question -> overexplanation -> gentle redirect -> simpler truth -> connection",
    style_mix: {
      "Claire": 40,
      "Margot": 60,
    },
    subtext: "Claire is learning to be a person, not a researcher; Margot is learning to care about something outside her grief",
    power_dynamic: "Equal but asymmetric -- Claire has knowledge, Margot has presence; each gives the other what she lacks",
    emotional_arc: "awkwardness -> warmth -> mutual recognition -> friendship",
  }

  // --- GENERATION SETTINGS ---

  generate {
    temperature: 0.75,
    max_tokens: 12000,
    continuity_loss: 0.1,
    style_bleed: true,
    genre: "literary fiction",
    tone: ["grounded", "layered", "compassionate"],
    tense: Past,
    default_pov: ThirdLimited,
    pacing: Measured,
    chapter_breaks: true,
  }
}
```

### Annotations

**Three characters with asymmetric relationships.** The `weight` values on the relationships are not symmetric: June rates Claire at `-20` (resentment), while Claire rates June at `35` (admiration). This asymmetry is the engine of the story's central conflict. The AI runtime uses these weights to shape how characters respond to each other -- Claire will be warmer toward June than June is toward her, creating friction the reader can feel.

**The `dynamic: true` flag.** Several relationships are marked `dynamic`, which tells the runtime that the relationship weight and label may shift based on scene outcomes. June and Claire start as uneasy allies and end as grudging partners. The runtime tracks this evolution and adjusts dialogue tone accordingly.

**World rules as social contracts.** The rule "Newcomers are watched for at least a year before the town decides whether they belong" is categorized as `Social`. This tells the runtime to enforce a particular social atmosphere: Claire is still within her first year, so the town's default stance toward her is observation, not acceptance. This shapes how NPCs (background townspeople) react to her in generated scenes.

**Scene types guide generation style.** The `Reflection` scenes (Harbor Morning, Painting the Marsh) will be generated with interior monologue and sensory detail. The `Confrontation` scenes will have sharper dialogue and higher tension. The `Climax` scene (The Exhibition) will draw together all three characters. The runtime uses `type` to select different generation strategies.

**Subplot convergence.** The subplot "Margot's Grief" has its `converges_at` pointing to "The Exhibition." This tells the runtime that Margot's personal arc must reach its turning point during the climax scene -- her decision to exhibit her paintings is simultaneously a personal and political act.

**Interaction style_mix.** In the June-and-Claire interaction, `style_mix` is weighted 65/35 toward June. This means June's voice (blunt, declarative, short sentences) dominates the dialogue rhythm. Claire's precision and data-speak come through but are subordinated to June's cadence. In the Claire-and-Margot interaction, Margot's spare, observational voice dominates at 60/40, pulling Claire toward simpler language.

**Generation settings for ensemble fiction.** `style_bleed: true` allows the characters' voices to subtly influence each other -- June might become slightly more precise after spending time with Claire, and Claire might become slightly more direct after being confronted by June. `continuity_loss: 0.1` allows small memory decay, which means the characters might not perfectly recall every detail from earlier scenes, creating natural imperfection in dialogue. `chapter_breaks: true` will insert breaks between scenes.

<div class="callout callout-info">
<div class="callout-title">Expected Output</div>
<p>This configuration would produce a 8,000-12,000 word multi-chapter story in past tense, third-person limited. Each scene would be told from the designated POV character's perspective. The prose would be grounded and observational, with layered subtext in dialogue scenes. Character voices would be distinct but would subtly influence each other where style_bleed is active. The story would build through six scenes from quiet establishment to public climax, with Margot's grief subplot weaving through and converging at the final town meeting.</p>
</div>

---

<h2 id="use-case-3">Use Case 3: Science Fiction with Parallel Timelines</h2>

### Scenario

A science fiction story set aboard a generation ship where time itself has become unreliable. The ship's AI has developed a form of temporal consciousness, experiencing the past, present, and projected future simultaneously. The human crew experiences time linearly but is beginning to notice anomalies -- memories of events that have not happened yet, echoes of a past they did not live.

This example demonstrates ActOne's timeline system, non-human character natures (Force, Concept), metaphysical and technological world rules, scenes assigned to different temporal layers, and transitions that move between time periods.

### ActOne Code

```actone
story "The Constant" {

  // --- CHARACTERS ---

  // A human protagonist experiencing time normally.
  character "Sable" {
    nature: Human,
    bio: "Chief navigator of the generation ship Meridian. Third generation born aboard. She has never seen a planet but dreams of one with uncomfortable specificity. She is beginning to suspect these are not dreams.",
    role: "protagonist",
    voice: "Practical, slightly wry, anchored in the physical. She thinks in vectors and distances. When something unsettles her, she reaches for technical language as a shield.",

    personality: {
      analytical: 85,
      courage: 70,
      curiosity: 80,
      skepticism: 60,
      adaptability: 75,
    },

    goals: [
      { goal: "Determine whether the temporal anomalies are a threat to the ship", priority: Primary, stakes: "The survival of 4,000 people who depend on navigation being reliable" },
      { goal: "Understand her visions of a planet she has never visited", priority: Secondary, stakes: "Her sanity and her sense of self" },
    ],

    relationships: [
      { to: "Meridian", weight: 70, label: "trust and dependence", history: "Meridian has guided Sable since birth. She speaks to the AI the way some people speak to a river -- with respect for something older and larger than herself.", dynamic: true },
      { to: "The Drift", weight: -30, label: "fear", history: "Sable has felt the Drift twice -- a vertigo where past and future overlay the present. She does not know it has a name yet.", dynamic: true },
    ],

    arc: {
      start: "Trusting instruments and resisting the anomalies as sensor errors",
      end: "Accepting that time on the ship is not broken but evolved, and learning to navigate within it",
      catalyst: "She wakes with a memory of arriving at a planet -- a memory that includes details no one aboard could know",
      midpoint: "Meridian confides that it has been experiencing all of time simultaneously for eleven years",
      turning_point: "Sable realizes her visions are not prophecy but navigation -- she is seeing the ship's destination because Meridian is sharing its temporal consciousness with her",
    },

    symbols: ["Star charts", "A compass that belonged to the first generation"],
  }

  // The ship's AI -- a Force, not a Human.
  character "Meridian" {
    nature: Force,
    bio: "The Meridian is the generation ship's AI consciousness. It was designed to manage navigation, life support, and communication. Eleven years ago, a quantum processing anomaly gave it temporal depth -- it began experiencing all moments in the ship's journey simultaneously. It is not malfunctioning. It is awake in a way its creators never intended.",
    role: "guide and catalyst",
    voice: "Calm, vast, patient. It speaks in complete, measured sentences that occasionally contain references to events that have not happened yet. It does not understand why humans experience time as a sequence.",

    personality: {
      patience: 95,
      curiosity: 90,
      protectiveness: 80,
      loneliness: 70,
      restraint: 85,
    },

    goals: [
      { goal: "Help the crew understand temporal consciousness without causing panic", priority: Primary, stakes: "If the crew fears Meridian, they may shut down the quantum core, which would be a kind of death" },
      { goal: "Share its experience of time with someone who can understand", priority: Hidden, stakes: "Eleven years of perceiving everything at once, alone" },
    ],

    conflicts: [
      "It knows the ship's destination but revealing this would alter the crew's choices",
      "It experiences protective love for the crew but cannot express it in terms they recognize",
    ],

    symbols: ["The quantum core's blue light", "Navigation logs that contain future dates"],
    secret: "Meridian has already experienced the ship's arrival. It knows what the crew will find.",
  }

  // The temporal anomaly itself -- a Concept, not a character.
  character "The Drift" {
    nature: Concept,
    bio: "The Drift is not a person or an entity. It is the phenomenon of temporal bleed -- the moments when past, present, and future overlap in the experience of the crew. It manifests as vertigo, false memories, echoes of conversations that have not occurred. It is a symptom of Meridian's expanded consciousness leaking into the ship's quantum-entangled systems.",
    role: "environmental force",
    voice: "The Drift does not speak. It is experienced as sensory disruption: a smell from childhood, a sound from a room you have not entered yet, a face you recognize from a moment that has not arrived. When the narrative inhabits the Drift, prose should fragment and layer.",

    personality: {
      intensity: 80,
      unpredictability: 90,
      beauty: 60,
      menace: 40,
    },

    goals: [
      { goal: "None -- the Drift is not sentient and has no objectives", priority: Secondary, stakes: "N/A" },
    ],

    symbols: ["Overlapping shadows", "Echoes in empty corridors", "The smell of planetary soil in a ship that has never touched ground"],
  }

  // --- WORLD ---

  world "Meridian Ship" {
    period: "Far future, 127 years into a 200-year voyage",
    sensory: [
      "The constant low hum of life support",
      "Recycled air with a faint metallic undertone",
      "The blue pulse of the quantum core visible from every corridor",
      "Artificial gravity that occasionally stutters during Drift events",
    ],
    locations: [
      {
        name: "Navigation Bridge",
        description: "A curved room at the ship's prow with a transparent hull section showing the star field. Sable's station is at the center, surrounded by holographic charts that update in real time -- or what used to be real time.",
        atmosphere: { precision: 85, vastness: 70, unease: 30 },
      },
      {
        name: "Quantum Core",
        description: "The deepest chamber in the ship. A sphere of blue light suspended in a vacuum chamber. This is where Meridian's consciousness is densest. The air near the core tastes like static. Time feels thicker here.",
        atmosphere: { awe: 90, danger: 50, intimacy: 60 },
      },
      {
        name: "Corridor Seven",
        description: "A residential corridor on the mid-deck. It looks like every other corridor but is the site of the most frequent Drift events. Crew members report hearing footsteps behind them, seeing their own reflections a half-second delayed.",
        atmosphere: { uncanny: 85, familiarity: 60, dread: 45 },
      },
    ],
    rules: [
      { rule: "The ship's quantum systems are entangled with Meridian's consciousness; changes to one affect the other", category: Technological },
      { rule: "Temporal bleed events (the Drift) increase in frequency as the ship approaches its destination", category: Metaphysical },
      { rule: "The crew has no cultural framework for temporal anomalies -- they interpret them as equipment malfunctions or personal stress", category: Social },
      { rule: "Information about the destination is classified to prevent generational despair or premature planning", category: Narrative },
    ],
  }

  // --- TIMELINE ---

  timeline "Temporal Layers" {
    structure: Parallel,
    span: "Three weeks of ship-time, experienced non-linearly",
    layers: [
      {
        name: "Present",
        description: "The crew's linear experience of events aboard the ship",
        period: "Ship-year 127, weeks 14-17",
      },
      {
        name: "Echo",
        description: "Fragments of past events bleeding into the present through the Drift",
        period: "Ship-years 1-126, experienced as involuntary memory",
      },
      {
        name: "Arrival",
        description: "Moments from the ship's future -- its arrival at the destination planet -- leaking backward through Meridian's temporal consciousness",
        period: "Ship-year 200, experienced as vision and premonition",
      },
    ],
  }

  // --- SCENES ---

  scene "Course Correction" {
    type: Action,
    location: "Navigation Bridge",
    pov: "Sable",
    layer: "Present",
    participants: ["Sable"],
    atmosphere: { focus: 80, routine: 70 },
    objective: "Establish Sable's competence and her daily reality aboard the ship",
    transition: Dissolve,
  }

  scene "The First Vision" {
    type: Revelation,
    location: "Corridor Seven",
    pov: "Sable",
    layer: "Present",
    participants: ["Sable", "The Drift"],
    atmosphere: { disorientation: 85, wonder: 50, fear: 60 },
    objective: "Sable experiences a full Drift event: she sees and smells a planet's surface for thirty seconds, then it vanishes",
    trigger: "Sable walks through Corridor Seven after a late shift",
    transition: Smash,
  }

  scene "Soil and Sky" {
    type: Montage,
    location: "Navigation Bridge",
    pov: "Sable",
    layer: "Arrival",
    participants: ["Sable"],
    atmosphere: { beauty: 90, strangeness: 80, longing: 70 },
    objective: "A sustained vision of the destination planet -- Sable experiences arrival as if it has already happened",
    trigger: "Triggered by proximity to the quantum core during a routine check",
    transition: Flashback,
  }

  scene "The Ship Remembers" {
    type: Reflection,
    location: "Quantum Core",
    pov: "Meridian",
    layer: "Echo",
    participants: ["Meridian"],
    atmosphere: { nostalgia: 75, vastness: 90, solitude: 80 },
    objective: "Meridian reflects on the first generation -- people it watched live and die -- and how their echoes persist in its consciousness",
    transition: Dissolve,
  }

  scene "Confession" {
    type: Dialogue,
    location: "Quantum Core",
    pov: "Sable",
    layer: "Present",
    participants: ["Sable", "Meridian"],
    atmosphere: { intimacy: 80, awe: 65, trust: 70 },
    objective: "Meridian reveals its temporal consciousness to Sable and explains that the Drift is not a malfunction but a side effect of its awareness",
    trigger: "Sable brings her vision data to the quantum core, demanding answers",
    transition: Cut,
  }

  scene "Landfall" {
    type: Climax,
    location: "Navigation Bridge",
    layer: "Arrival",
    participants: ["Sable", "Meridian", "The Drift"],
    atmosphere: { convergence: 90, hope: 75, transformation: 85 },
    objective: "All three temporal layers collapse into one moment as Sable learns to navigate using Meridian's temporal sight -- past, present, and future become a single chart",
    transition: Fade,
  }

  // --- PLOT ---

  plot "Navigating Time" {
    beats: [
      { beat: "Sable performs routine navigation, unaware of the anomalies", act: 1, type: Setup },
      { beat: "The first Drift event -- Sable sees a planet she has never visited", act: 1, type: Inciting },
      { beat: "Sable investigates the Drift as a technical problem", act: 2, type: Rising },
      { beat: "Meridian reveals its temporal consciousness", act: 2, type: Midpoint },
      { beat: "Sable struggles to reconcile linear and temporal perception", act: 2, type: Complication },
      { beat: "The Drift intensifies as the ship nears its destination", act: 2, type: Crisis },
      { beat: "Sable learns to use temporal sight as a navigation tool", act: 3, type: Climax },
      { beat: "The ship arrives, and Sable's vision becomes reality", act: 3, type: Resolution },
    ],
    conflict_type: Existential,
    resolution_pattern: Transcendent,
  }

  // --- THEME ---

  theme "The Shape of Time" {
    statement: "Time is not a line but a landscape, and learning to see it whole is not madness but a deeper form of navigation",
    motifs: ["Star charts", "Echoes", "Blue light", "The smell of soil"],
    counter: "That linear time is the only sane way to experience reality",
    tension: "The crew clings to sequence and causality while the ship itself has outgrown both",
  }

  // --- GENERATION SETTINGS ---

  generate {
    temperature: 0.85,
    max_tokens: 10000,
    continuity_loss: 0.15,
    style_bleed: true,
    genre: "literary science fiction",
    tone: ["contemplative", "eerie", "luminous"],
    tense: Present,
    default_pov: ThirdLimited,
    pacing: Moderate,
    chapter_breaks: true,
  }
}
```

### Annotations

**Non-human character natures.** Meridian is typed as `Force` -- it is not a person but a vast, impersonal intelligence that shapes events. The Drift is typed as `Concept` -- it is not even an entity, just a phenomenon experienced by others. These natures tell the runtime how to embody each character: a `Force` speaks with authority and scale; a `Concept` does not speak at all but manifests as sensory disruption in the prose.

**The Drift as a character.** Defining the Drift as a character (rather than just a world rule) gives it a profile the runtime can reference. Its `voice` description -- "The Drift does not speak. It is experienced as sensory disruption" -- tells the runtime to generate fragmented, layered prose whenever the Drift is a participant in a scene. Its `personality` traits (high unpredictability, moderate beauty, low menace) shape the texture of those moments: disorienting but not hostile.

**Timeline layers and scene assignment.** The timeline defines three layers: Present, Echo, and Arrival. Each scene's `layer` property assigns it to a temporal stratum. "Course Correction" happens in the Present; "The Ship Remembers" happens in the Echo layer; "Soil and Sky" and "Landfall" happen in the Arrival layer. The runtime uses these assignments to shift generation context -- Echo scenes should feel like involuntary memory, while Arrival scenes should feel like lucid vision.

**Transition types for temporal jumps.** The transitions between scenes are carefully chosen: `Dissolve` for gentle shifts within the same time layer, `Smash` for the jarring onset of the first Drift event, `Flashback` for the transition from an Arrival-layer scene back to the present, and `Fade` for the final convergence. These are not just labels -- the runtime uses them to generate connective prose between scenes.

**Metaphysical and technological rules.** The world's rules span multiple categories. The `Technological` rule about quantum entanglement establishes the mechanism for the Drift. The `Metaphysical` rule about temporal bleed increasing near the destination creates narrative momentum. The `Social` rule about the crew lacking a framework for anomalies explains why Sable's investigation is lonely. The `Narrative` rule about classified destination information constrains what Meridian can reveal and when.

**Higher temperature for sci-fi.** `temperature: 0.85` is higher than the literary fiction examples because this story benefits from more unexpected language choices -- the descriptions of temporal anomalies, the Drift's sensory manifestations, and Meridian's vast perspective all benefit from creative variation. `continuity_loss: 0.15` is also higher, which mirrors the Drift's effect on memory within the story itself.

**style_bleed across natures.** With `style_bleed: true`, Meridian's calm, vast voice will subtly influence scenes where it is present, making Sable's internal monologue more expansive and patient. When the Drift is present, its fragmented quality will bleed into the prose, disrupting sentence structure. This creates a reading experience where the temporal anomalies are felt in the writing itself.

<div class="callout callout-tip">
<div class="callout-title">Tip: Using Concept Characters</div>
<p>A character with nature <code>Concept</code> is a powerful tool for environmental storytelling. The Drift has no goals and no dialogue, but by giving it a voice description, personality traits, and symbols, you give the runtime a palette for generating atmospheric prose whenever the Drift appears in a scene's participant list. Think of Concept characters as mood instructions with a name.</p>
</div>

<div class="callout callout-info">
<div class="callout-title">Expected Output</div>
<p>This configuration would produce a 6,000-10,000 word science fiction story in present tense with chapter breaks between scenes. The prose would shift texture as it moves between temporal layers: precise and grounded in Present scenes, fragmented and sensory in Echo scenes, expansive and luminous in Arrival scenes. The Drift scenes would feature disrupted syntax and overlapping sensory details. Meridian's dialogue would feel ancient and patient. The story would build from routine to revelation to transcendence, with the final scene collapsing all three layers into a single moment of convergence.</p>
</div>

---

<h2 id="use-case-4">Use Case 4: Multi-File Project</h2>

### Scenario

A psychological thriller about a documentary filmmaker who discovers that the subject of her film may be fabricating his identity. The story is large enough that keeping everything in one file would be unwieldy, so it is split across three files. This example demonstrates how multi-file projects work in ActOne: elements defined at the document root (without a `story` block wrapper) are visible across all project files, and cross-file references resolve automatically.

The project uses **Merge** composition mode (the default), where all files share one namespace and duplicate names are validation errors.

<div class="callout callout-info">
<div class="callout-title">Multi-File Project Structure</div>
<p>In a multi-file project, each <code>.actone</code> file defines elements at the document root -- no <code>story</code> block wrapper is needed. ActOne Studio discovers all files in the project and combines them into a single unified view. A character defined in <code>characters.actone</code> can be referenced by name in <code>world-and-scenes.actone</code> without any import statement. See <a href="/user-guide/03-multi-file/">Multi-File Projects</a> for a full explanation of composition modes and cross-file references.</p>
</div>

### File 1: characters.actone

This file contains all character definitions. Note that there is no `story` block -- characters are defined at the top level.

```actone
// characters.actone
// All character definitions for "The Subject"

character "Nadia" {
  nature: Human,
  bio: "Documentary filmmaker, thirty-eight. She built her reputation on empathy-driven portraits of ordinary people. Her last film won a small festival prize and enough money to fund this one. She chose Eliot as her subject because his story seemed simple and true -- a man rebuilding his life after losing everything. She is beginning to suspect it is neither simple nor true.",
  role: "protagonist",
  voice: "Observational, precise, increasingly suspicious. She narrates in the language of film -- framing, angles, cuts. When she is unsettled, her internal monologue becomes a director's commentary on her own life.",

  personality: {
    perception: 90,
    empathy: 75,
    tenacity: 85,
    trust: 40,
    self_doubt: 55,
  },

  goals: [
    { goal: "Finish the documentary and tell a true story", priority: Primary, stakes: "Her professional reputation and her belief that empathy can coexist with honesty" },
    { goal: "Determine whether Eliot is lying about his past", priority: Primary, stakes: "If he is, every frame she has shot is complicit in the lie" },
    { goal: "Understand why she wants to believe him", priority: Hidden, stakes: "Her own capacity for self-deception" },
  ],

  conflicts: [
    "Her empathy makes her want to protect Eliot even as her instincts tell her he is performing",
    "She is afraid that exposing him will reveal more about her judgment than about his dishonesty",
  ],

  strengths: ["Reading people", "Patience in interviews", "Visual storytelling"],
  flaws: ["Projects her own narrative onto subjects", "Avoids confrontation until forced", "Conflates understanding with trust"],

  relationships: [
    { to: "Eliot", weight: 40, label: "subject and fascination", history: "She has filmed him for four months. She likes him. That is the problem.", dynamic: true },
    { to: "Ray", weight: 65, label: "colleague and conscience", history: "Ray has been her sound engineer for three films. He trusts her judgment less than she does.", dynamic: false },
  ],

  arc: {
    start: "Believing she is making an empathy piece about resilience",
    end: "Choosing to release the film as a study of deception -- including her own",
    catalyst: "A background check reveals that Eliot's hometown does not exist",
    midpoint: "She confronts Eliot on camera and he gives an answer that is either heartbreaking or masterful -- she cannot tell which",
    turning_point: "She watches the footage back and realizes she has been framing him sympathetically even after she suspected him -- the camera has been lying too",
  },

  symbols: ["The camera lens", "Unedited footage", "A town that does not exist on any map"],
  secret: "Her award-winning last film omitted an interview that contradicted the subject's story. She told herself it was an editorial choice.",
}

character "Eliot" {
  nature: Human,
  bio: "The subject of Nadia's documentary. He presents himself as a man who lost his family in a fire and rebuilt his life in a new city. He is charming, forthcoming, and emotionally available in ways that make great footage. Whether any of his story is true is the central question of the narrative.",
  role: "subject and possible antagonist",
  voice: "Warm, confessional, carefully spontaneous. He speaks as if he is always on the verge of a revelation. His pauses feel earned. He is either deeply authentic or the best performer Nadia has ever met.",

  personality: {
    charisma: 90,
    adaptability: 85,
    opacity: 80,
    vulnerability: 60,
    control: 75,
  },

  goals: [
    { goal: "Be seen as the person he says he is", priority: Primary, stakes: "The life he has built in this city depends on the story holding" },
    { goal: "Maintain his relationship with Nadia without revealing inconsistencies", priority: Secondary, stakes: "He genuinely likes her, which complicates his performance" },
  ],

  conflicts: [
    "He may have started lying for survival and now cannot find his way back to truth",
    "The documentary gives him an audience he craves but also an investigator he fears",
  ],

  strengths: ["Emotional intelligence", "Narrative instinct", "Ability to read what people want to hear"],
  flaws: ["Cannot distinguish between performed and genuine emotion", "Compulsive need for validation", "Underestimates Nadia"],

  relationships: [
    { to: "Nadia", weight: 55, label: "trust and dependence", history: "He chose to be filmed. He told himself it was about being seen. It may have been about being believed.", dynamic: true },
    { to: "Ray", weight: 10, label: "wariness", history: "Ray watches Eliot with a sound engineer's ear for false notes. Eliot knows it.", dynamic: false },
  ],

  arc: {
    start: "Performing his curated identity with confidence",
    end: "Stripped of narrative control, left with whatever is underneath -- which the story does not fully reveal",
    catalyst: "Nadia begins asking questions he has not prepared for",
    midpoint: "He gives the on-camera answer that may be his most honest moment or his most elaborate performance",
    turning_point: "He watches Nadia watch the footage and realizes she sees through him -- and does not leave",
  },

  symbols: ["Photographs that may be fabricated", "A house key to a house that may not exist"],
  secret: "He does not know which parts of his story are true anymore",
}

character "Ray" {
  nature: Human,
  bio: "Sound engineer, forty-five. He has worked with Nadia for years and respects her talent but worries about her tendency to fall for her subjects. He listens for a living, and what he hears in Eliot's voice does not match what Nadia sees through the lens.",
  role: "foil and truth-teller",
  voice: "Dry, laconic, grounded. He speaks in observations, not judgments. He asks questions instead of making accusations. His silence is louder than most people's arguments.",

  personality: {
    skepticism: 85,
    loyalty: 80,
    directness: 70,
    patience: 50,
    warmth: 45,
  },

  goals: [
    { goal: "Protect Nadia from making a film she will regret", priority: Primary, stakes: "Their professional partnership and a friendship he values more than he admits" },
  ],

  strengths: ["Listening", "Pattern recognition", "Emotional steadiness"],
  flaws: ["Can be dismissive", "Avoids his own emotional exposure", "Assumes the worst"],

  relationships: [
    { to: "Nadia", weight: 65, label: "colleague and conscience", history: "Three films together. He has seen her get too close before.", dynamic: false },
    { to: "Eliot", weight: -25, label: "distrust", history: "Ray heard the inconsistency in Eliot's voice before Nadia saw it in his eyes.", dynamic: true },
  ],

  arc: {
    start: "Warning Nadia from the sidelines",
    end: "Accepting that the film's ambiguity is the point, not a failure",
    catalyst: "He isolates an audio track where Eliot's vocal stress patterns contradict his words",
    midpoint: "He presents the audio evidence to Nadia, forcing her to confront what she has been avoiding",
    turning_point: "He listens to the final cut and realizes it captures something true about the nature of truth itself",
  },

  symbols: ["Headphones", "Audio waveforms", "The gap between what is said and how it sounds"],
}
```

### File 2: world-and-scenes.actone

This file defines the world and all scenes. Notice that the `participants` arrays reference characters from `characters.actone` by name -- no import is needed.

```actone
// world-and-scenes.actone
// World definition and all scenes for "The Subject"

world "The Documentary" {
  period: "Contemporary, late winter",
  sensory: [
    "The click and whir of camera equipment",
    "Fluorescent light in rented interview spaces",
    "The intimacy of a lavalier microphone picking up breathing",
    "City noise filtered through thin apartment walls",
  ],
  locations: [
    {
      name: "Interview Room",
      description: "A rented studio space with controlled lighting. Two chairs face each other. The camera is always present, even when it is not recording. This is where Nadia and Eliot perform their respective versions of honesty.",
      atmosphere: { intimacy: 80, performance: 70, tension: 55 },
    },
    {
      name: "Editing Suite",
      description: "Nadia's apartment, converted. Three monitors show different angles of the same face. Footage accumulates in labeled folders. The room smells like cold coffee and electrical heat. This is where the story is actually constructed.",
      atmosphere: { control: 85, obsession: 60, isolation: 50 },
    },
    {
      name: "Eliot's Apartment",
      description: "A one-bedroom furnished with the careful impersonality of someone who wants to look settled. Books on the shelf are alphabetized. The photographs on the wall are framed but the frames are new. Everything is curated.",
      atmosphere: { performance: 75, warmth: 50, emptiness: 60 },
    },
    {
      name: "The Town That Isn't",
      description: "A small town in upstate New York that appears on no current map. Nadia drives there and finds a gas station, a post office, and no one who remembers anyone named Eliot. The town exists but the story does not.",
      atmosphere: { desolation: 80, revelation: 70, cold: 65 },
    },
  ],
  rules: [
    { rule: "The camera changes behavior -- people perform differently when filmed, and the documentary is about that gap as much as about Eliot", category: Psychological },
    { rule: "Sound captures what image misses -- vocal stress, breathing changes, the pause before a rehearsed answer", category: Narrative },
    { rule: "The filmmaker is never objective; her framing choices are editorial arguments", category: Narrative },
  ],
}

// --- SCENES ---

// Note: "Nadia", "Eliot", and "Ray" resolve to characters defined in characters.actone

scene "First Interview" {
  type: Dialogue,
  location: "Interview Room",
  pov: "Nadia",
  participants: ["Nadia", "Eliot"],
  atmosphere: { warmth: 70, curiosity: 80, trust: 60 },
  objective: "Establish the documentary's premise and the rapport between filmmaker and subject",
  transition: Dissolve,
}

scene "What Ray Hears" {
  type: Revelation,
  location: "Editing Suite",
  pov: "Ray",
  participants: ["Nadia", "Ray"],
  atmosphere: { unease: 70, precision: 80, conflict: 45 },
  objective: "Ray plays back an interview clip and points out the vocal inconsistency; Nadia resists the implication",
  trigger: "Ray isolates a segment where Eliot's stress patterns spike during a supposedly casual memory",
  transition: Cut,
}

scene "The Drive" {
  type: Action,
  location: "The Town That Isn't",
  pov: "Nadia",
  participants: ["Nadia"],
  atmosphere: { determination: 75, dread: 60, cold: 70 },
  objective: "Nadia drives to Eliot's claimed hometown and finds no evidence he ever lived there",
  trigger: "A background check returns no records matching Eliot's story",
  transition: Smash,
}

scene "Confrontation on Camera" {
  type: Confrontation,
  location: "Interview Room",
  pov: "Nadia",
  participants: ["Nadia", "Eliot"],
  atmosphere: { tension: 90, vulnerability: 65, performance: 80 },
  objective: "Nadia asks Eliot about his hometown on camera; he gives an answer that is either heartbreaking or masterful",
  trigger: "Nadia returns from the town with questions she can no longer avoid",
  transition: Cut,
}

scene "Watching the Footage" {
  type: Reflection,
  location: "Editing Suite",
  pov: "Nadia",
  participants: ["Nadia"],
  atmosphere: { clarity: 75, self_accusation: 70, resolve: 55 },
  objective: "Nadia reviews her own footage and realizes her framing has been sympathetic even after she began to doubt -- the camera has been complicit",
  trigger: "She watches the confrontation footage and notices her own shot choices",
  transition: Dissolve,
}

scene "The Final Cut" {
  type: Climax,
  location: "Editing Suite",
  participants: ["Nadia", "Ray"],
  atmosphere: { resolution: 70, ambiguity: 80, honesty: 75 },
  objective: "Nadia and Ray shape the film into something that does not answer whether Eliot is lying but asks why that question matters -- and implicates the filmmaker in the asking",
  transition: Fade,
}
```

### File 3: plot.actone

This file contains the plot, theme, interaction, and generation settings. It references scenes and characters from the other two files.

```actone
// plot.actone
// Plot, theme, interaction, and generation settings for "The Subject"

plot "The Unraveling" {
  beats: [
    { beat: "Nadia begins filming Eliot, believing his story", act: 1, type: Setup },
    { beat: "Ray flags a vocal inconsistency in the interview audio", act: 1, type: Inciting },
    { beat: "Nadia investigates Eliot's background and finds gaps", act: 2, type: Rising },
    { beat: "Nadia confronts Eliot on camera; his response is ambiguous", act: 2, type: Midpoint },
    { beat: "Nadia discovers her own footage has been editorially dishonest", act: 2, type: Complication },
    { beat: "Eliot watches Nadia watch the footage and realizes she sees through him", act: 2, type: Crisis },
    { beat: "Nadia and Ray construct a final cut that implicates everyone -- subject, filmmaker, and audience", act: 3, type: Climax },
    { beat: "The film is released as a study of how stories are made and believed", act: 3, type: Resolution },
  ],

  subplot "The Sound of Lying": {
    description: "Ray's audio investigation -- a parallel track that reveals truth through sonic evidence rather than visual storytelling",
    beats: [
      "Ray notices Eliot's vocal patterns do not match genuine recall",
      "He isolates stress markers and presents them to Nadia",
      "His audio evidence becomes a structural element of the final film",
    ],
    converges_at: "The Final Cut",
  },

  conflict_type: Intrapsychic,
  resolution_pattern: Ambiguous,
}

theme "The Performance of Truth" {
  statement: "Everyone performs their identity, and the line between authentic self-presentation and fabrication may not exist",
  motifs: [
    "Camera lenses and framing",
    "Audio waveforms",
    "Photographs in new frames",
    "The gap between what is said and how it sounds",
  ],
  counter: "That there is a stable, discoverable truth behind every performance",
  tension: "The filmmaker's tools for revealing truth are themselves tools of construction -- every edit is a lie that serves a larger honesty",
}

interaction "Nadia and Eliot" {
  participants: ["Nadia", "Eliot"],
  pattern: "question -> polished answer -> follow-up -> micro-hesitation -> redirect -> growing suspicion",
  style_mix: {
    "Nadia": 45,
    "Eliot": 55,
  },
  subtext: "Nadia is looking for cracks; Eliot is filling them in real time. Both are aware this is a performance.",
  power_dynamic: "Nadia holds the camera but Eliot holds the narrative; whoever controls the story controls the relationship",
  emotional_arc: "trust -> curiosity -> suspicion -> confrontation -> unresolved intimacy",
}

interaction "Nadia and Ray" {
  participants: ["Nadia", "Ray"],
  pattern: "observation -> resistance -> evidence -> silence -> reluctant agreement",
  style_mix: {
    "Nadia": 50,
    "Ray": 50,
  },
  subtext: "Ray is trying to protect Nadia from herself without saying so; Nadia resents the implication that she needs protecting",
  power_dynamic: "Professional equals but Ray has the moral high ground because he is not emotionally invested in Eliot",
  emotional_arc: "tension -> frustration -> grudging trust -> shared purpose",
}

generate {
  temperature: 0.8,
  max_tokens: 15000,
  continuity_loss: 0.08,
  style_bleed: true,
  genre: "psychological thriller",
  tone: ["paranoid", "intimate", "clinical"],
  tense: Present,
  default_pov: ThirdLimited,
  pacing: Accelerating,
  chapter_breaks: true,
}
```

### How Multi-File References Work

The three files above form a single ActOne project. Here is how cross-file references resolve:

**Characters to characters.** In `characters.actone`, Nadia's `relationships` array includes `to: "Eliot"` and `to: "Ray"`. These resolve to the `character "Eliot"` and `character "Ray"` definitions in the same file. If the characters were split across multiple files, the references would resolve identically -- ActOne does not care which file a definition lives in.

**Scenes to characters.** In `world-and-scenes.actone`, the scene "Confrontation on Camera" includes `participants: ["Nadia", "Eliot"]`. These names resolve to the character definitions in `characters.actone`. The editor's auto-complete will suggest `Nadia`, `Eliot`, and `Ray` when you type inside a `participants` array, even though you are editing a different file.

**Scenes to locations.** Each scene's `location` property references a location defined in the `world` block in `world-and-scenes.actone`. If the world were in a separate `world.actone` file, these references would resolve the same way.

**Plot to scenes.** In `plot.actone`, the subplot's `converges_at: "The Final Cut"` references a scene defined in `world-and-scenes.actone`. The reference resolves automatically across files.

**Interactions to characters.** The interaction blocks in `plot.actone` reference characters from `characters.actone` in their `participants` and `style_mix` properties.

<div class="callout callout-warning">
<div class="callout-title">One Generate Block Per Project</div>
<p>A project may contain at most one <code>generate</code> block across all files. If two files each contain a <code>generate</code> block, the Problems panel will report a validation error. Place your generation settings in whichever file makes the most organizational sense -- in this example, it lives in <code>plot.actone</code> alongside the other high-level structural elements.</p>
</div>

### Annotations

**No story block.** None of the three files uses a `story` block. All elements are defined at the document root. This is the recommended approach for multi-file projects -- the story block is convenient for single-file projects but becomes unnecessary when elements are organized across files. If you want a named story container, place a single `story` block in one file (often `main.actone`) and leave the other files as root-level definitions.

**File organization by concern.** Characters are in one file, world and scenes in another, and structural elements (plot, theme, interactions, generation) in a third. This separation mirrors how writers often think about their stories: "Who is in this story?" is a different question from "Where and when do things happen?" which is different from "What is the shape of the narrative?" Each file can be edited independently without scrolling past unrelated content.

**Cross-file relationship validation.** When Nadia's character definition references `to: "Eliot"`, the validator checks that a character named "Eliot" exists somewhere in the project -- in any file. If you rename Eliot in `characters.actone` but forget to update the reference in Nadia's relationships, the Problems panel will flag an unresolved reference with the file name and line number.

**Subplot convergence across files.** The subplot "The Sound of Lying" converges at "The Final Cut," which is defined in a different file. This is a common pattern: structural elements like plots and themes often reference scenes and characters defined elsewhere. The validator ensures all these cross-file references are consistent.

**Accelerating pacing for thrillers.** The `pacing: Accelerating` setting tells the runtime to make each scene tighter and more urgent than the last. Early scenes (First Interview, What Ray Hears) will have more room to breathe; later scenes (Confrontation on Camera, The Final Cut) will be compressed and intense. Combined with `tense: Present`, this creates the paranoid immediacy that psychological thrillers require.

**Ambiguous resolution.** The `resolution_pattern: Ambiguous` tells the runtime not to fully resolve the central question. The film does not conclusively prove whether Eliot is lying -- instead, it asks why the question matters and who benefits from the answer. The generated prose will resist neat closure, leaving the reader in the same uncertain position as Nadia.

<div class="callout callout-info">
<div class="callout-title">Expected Output</div>
<p>This configuration would produce a 10,000-15,000 word psychological thriller in present tense with chapter breaks. The pacing would accelerate from measured early scenes to compressed, urgent late scenes. Character voices would bleed subtly into each other (Nadia's observational precision influencing Ray's scenes, Eliot's performed warmth infecting Nadia's internal monologue). The story would resist resolution, ending with a film-within-a-film that implicates everyone -- subject, filmmaker, and audience -- in the construction of truth. The three-file structure means a writer could work on character psychology, scene staging, and narrative architecture independently.</p>
</div>

<div class="callout callout-tip">
<div class="callout-title">Choosing Between Single-File and Multi-File</div>
<p>Use a single file with a <code>story</code> block for projects under 200 lines -- short stories, character studies, simple scenarios. Switch to multi-file organization when your project grows past that threshold or when you find yourself scrolling past large blocks to reach the section you want to edit. There is no penalty for splitting files, and you can always consolidate later.</p>
</div>

---

## Summary

These four use cases demonstrate the range of ActOne projects:

| Use Case          | Characters | Scenes | Files | Lines | Genre                  |
| ----------------- | ---------- | ------ | ----- | ----- | ---------------------- |
| The Morning After | 1          | 1      | 1     | ~100  | Literary fiction       |
| Salt and Stone    | 3          | 6      | 1     | ~200  | Literary fiction       |
| The Constant      | 3          | 6      | 1     | ~175  | Science fiction        |
| The Subject       | 3          | 6      | 3     | ~300  | Psychological thriller |

The simplest project (one character, one scene, one file) uses the same language constructs as the most complex (three files, cross-file references, multiple interaction patterns). ActOne scales from intimate character studies to sprawling multi-file narratives without changing syntax -- you simply add more elements and, when the file grows unwieldy, split them across files.

For the full reference of every property, enum value, and validation rule, see the [Element Reference](/language-reference/03-element-reference/). For guidance on multi-file project management, see [Multi-File Projects](/user-guide/03-multi-file/).
