---
title: Glossary
order: 1
description: Comprehensive glossary of ActOne terms and concepts.
---

This glossary defines every key term used throughout ActOne and ActOne Studio. Terms appear in alphabetical order. Where a term corresponds directly to an ActOne keyword, it appears in `code formatting`.

<div class="callout callout-tip">
<p class="callout-title">Tip</p>
<p>Many terms link to fuller explanations elsewhere in the guide. Use <strong>Ctrl+F</strong> (or <strong>Cmd+F</strong> on Mac) to jump to any term quickly.</p>
</div>

---

<dl>

<dt id="arc">Arc</dt>
<dd>
A structured description of how a character changes from the beginning of the story to the end. An arc is defined inside a <code>character</code> block using the <code>arc</code> property, and it can include sub-properties for <code>start</code>, <code>end</code>, <code>catalyst</code>, <code>midpoint</code>, and <code>turning_point</code>. An arc gives the AI runtime a trajectory for how a character's voice, priorities, and behavior should evolve as the narrative progresses. See also: <a href="#turning-point">Turning Point</a>, <a href="#catalyst">Catalyst</a>.
</dd>

<dt id="atmosphere">Atmosphere</dt>
<dd>
A mood vector attached to a location or scene that tells the AI runtime what emotional register to maintain during generation. Atmosphere is expressed as a set of named numeric values (for example, <code>tension: 80, warmth: 20</code>) rather than prose descriptions. Higher values signal greater intensity of that emotional quality. Atmosphere operates alongside the <code>sensory</code> palette defined at the world level.
</dd>

<dt id="beat">Beat</dt>
<dd>
The fundamental unit of plot structure in ActOne. A <code>beat</code> entry inside a <code>plot</code> block describes one discrete narrative event or story step. Beats can be given a <code>type</code> (such as <code>Inciting</code>, <code>Climax</code>, or <code>Resolution</code>) and an <code>act</code> number for three-act alignment. The sequence of beats forms the spine of the story's macro-level structure. See also: <a href="#plot">Plot</a>, <a href="#turning-point">Turning Point</a>.
</dd>

<dt id="catalyst">Catalyst</dt>
<dd>
An external event or force that disrupts a character's status quo and sets their arc in motion. The <code>catalyst</code> property is part of a character's <code>arc</code> block and distinguishes the triggering event from the character's internal <a href="#turning-point">turning point</a>. For example, a catalyst might be a phone call that shatters a character's illusions, while the turning point is the moment they decide what to do about it.
</dd>

<dt id="character">Character</dt>
<dd>
The core agent element in ActOne. A <code>character</code> block defines a persona that the AI runtime will embody during generation. Characters have a rich set of properties — including <code>bio</code>, <code>voice</code>, <code>personality</code>, <code>goals</code>, <code>arc</code>, <code>relationships</code>, and more — that collectively parameterize the agent. Characters are referenced by name from <a href="#scene">scenes</a>, <a href="#interaction">interactions</a>, and other elements. See <a href="/language-reference/03-element-reference/">Element Reference</a> for the full property list.
</dd>

<dt id="character-nature">Character Nature</dt>
<dd>
The ontological type of a character, specified with the <code>nature</code> property. ActOne supports <code>Human</code>, <code>Force</code>, <code>Concept</code>, <code>Animal</code>, <code>Spirit</code>, <code>Collective</code>, and <code>Environment</code>. Nature tells the runtime how to embody the agent — a <code>Concept</code> character like "Grief" behaves very differently from a <code>Human</code> character. This property is essential for non-realistic or allegorical narratives.
</dd>

<dt id="conflict-type">Conflict Type</dt>
<dd>
The category of narrative conflict driving a plot, specified with the <code>conflict_type</code> property on a <code>plot</code> block. Available types include <code>Interpersonal</code>, <code>Internal</code>, <code>Intrapsychic</code>, <code>Societal</code>, <code>Environmental</code>, <code>Cosmic</code>, <code>Existential</code>, and <code>Technological</code>. Conflict type gives the runtime a high-level signal about what kind of tension to maintain across the narrative.
</dd>

<dt id="cross-reference">Cross-Reference</dt>
<dd>
A reference in one ActOne element to a named element defined elsewhere — either in the same file or in another file in the project. For example, a <code>scene</code> block cross-references a <code>character</code> by name in its <code>participants</code> list. Cross-references are validated by ActOne Studio: if the referenced name does not exist, the editor highlights an error. In multi-file projects, cross-references are resolved across all files in the project. See <a href="/user-guide/03-multi-file/">Multi-File Projects</a>.
</dd>

<dt id="diagram">Diagram</dt>
<dd>
An auto-generated visual representation of your story's structure. ActOne Studio can render diagrams showing characters, their relationships, scenes, world locations, and plot structure. Diagrams are read-only views derived from your <code>.actone</code> source files — you edit the source, and the diagram updates automatically. See <a href="/user-guide/04-diagrams-export/">Diagrams and Export</a>.
</dd>

<dt id="document">Document</dt>
<dd>
The root container of a single <code>.actone</code> file. Every file is a Document, which may contain an optional <code>story</code> block and any number of top-level <a href="#story-element">story elements</a> (characters, worlds, scenes, etc.). In single-file projects, the Document wraps everything. In multi-file projects, each Document contributes its elements to the shared project scope.
</dd>

<dt id="element">Element</dt>
<dd>
Any top-level named construct in ActOne: <code>character</code>, <code>world</code>, <code>scene</code>, <code>plot</code>, <code>theme</code>, <code>timeline</code>, <code>interaction</code>, or <code>generate</code>. Elements can appear inside a <code>story</code> block or at the top level of a file (for multi-file projects). Each element type has its own set of properties and plays a specific role in defining the narrative.
</dd>

<dt id="export">Export</dt>
<dd>
The process of converting your ActOne project into an external format for use outside the studio. ActOne Studio supports exporting to formats including PDF, Word (<code>.docx</code>), plain text, and structured JSON. Export respects your story's structure and ordering. See <a href="/user-guide/04-diagrams-export/">Diagrams and Export</a>.
</dd>

<dt id="generate-block">Generate Block</dt>
<dd>
A special <code>generate</code> block that configures global AI generation settings for your story. Generation settings include <code>temperature</code> (creativity dial), <code>max_tokens</code>, <code>genre</code>, <code>tone</code>, <code>tense</code>, <code>default_pov</code>, <code>pacing</code>, and <code>chapter_breaks</code>. Only one <code>generate</code> block is permitted per project. These settings act as top-level directives for the AI runtime that processes your story. See <a href="/language-reference/03-element-reference/">Element Reference</a>.
</dd>

<dt id="goal">Goal</dt>
<dd>
A structured objective belonging to a character. Goals are defined inside the <code>goals</code> list in a <code>character</code> block. Each goal entry has a <code>goal</code> description, an optional <code>priority</code> (<code>Primary</code>, <code>Secondary</code>, or <code>Hidden</code>), and optional <code>stakes</code> (what the character loses if the goal fails). Goals with different priorities allow characters to pursue layered motivations simultaneously during generation.
</dd>

<dt id="interaction">Interaction</dt>
<dd>
An <code>interaction</code> block defines how a specific group of characters communicate — the rhythm, subtext, and power dynamics of their exchanges. The <code>pattern</code> property uses arrow notation (e.g., <code>"greeting -> tension -> revelation"</code>) to describe the emotional sequence of the exchange. Interactions can also specify <code>subtext</code> (what is really being communicated beneath the surface) and <code>power_dynamic</code> (who holds leverage). See also: <a href="#subtext">Subtext</a>.
</dd>

<dt id="layer">Layer</dt>
<dd>
A named temporal stratum within a <a href="#timeline">timeline</a>. Layers let you define distinct time periods — such as "Present," "Childhood," or "PastLife" — that scenes can be assigned to. Each layer can have its own <code>description</code> and <code>period</code>. A scene references a layer via the <code>layer</code> property, which tells the runtime which temporal context governs that scene's generation.
</dd>

<dt id="location">Location</dt>
<dd>
A named place within a <a href="#world">world</a>. Locations are defined in the <code>locations</code> list of a <code>world</code> block. Each location has a <code>name</code>, a <code>description</code>, an optional <code>atmosphere</code> mood vector, and an optional <code>connects_to</code> list for spatial adjacency. Scenes reference locations via the <code>location</code> property, using either a bare location name or a qualified <code>WorldName.LocationName</code> syntax.
</dd>

<dt id="motif">Motif</dt>
<dd>
A recurring image, object, phrase, or pattern that embodies a <a href="#theme">theme</a>. Motifs are listed in a <code>theme</code> block's <code>motifs</code> array. Unlike <a href="#symbol">symbols</a> (which are associated with individual characters), motifs are story-level. Examples include a recurring colour, a physical gesture repeated at key moments, or a phrase that returns with new meaning. The AI runtime uses motifs to weave consistent imagery through generated content.
</dd>

<dt id="multifile">Multi-File Project</dt>
<dd>
A project where ActOne source is spread across multiple <code>.actone</code> files rather than a single file. In a multi-file project, elements defined in one file are visible to elements in other files — a character defined in <code>characters.actone</code> can be referenced by a scene defined in <code>act-one.actone</code>. This allows large projects to be organized by concern (characters, worlds, acts) rather than crammed into one file. See <a href="/user-guide/03-multi-file/">Multi-File Projects</a>.
</dd>

<dt id="nature">Nature</dt>
<dd>
See <a href="#character-nature">Character Nature</a>.
</dd>

<dt id="outline">Outline</dt>
<dd>
A structural overview of your project displayed in the Outline panel of ActOne Studio. The outline lists every named element in your project (characters, scenes, plots, etc.) and lets you navigate to any element by clicking it. The outline is generated automatically from your source files and stays in sync as you edit.
</dd>

<dt id="personality">Personality</dt>
<dd>
A set of named numeric traits (each from 0–100) that parameterize a character's dispositions. The <code>personality</code> block uses arbitrary trait names — for example, <code>compassion: 75</code> or <code>impulsiveness: 40</code>. Higher values signal greater intensity of that trait. The AI runtime uses personality values as tunable dials: a character with <code>compassion: 20</code> will generate very different dialogue than one with <code>compassion: 80</code>.
</dd>

<dt id="plot">Plot</dt>
<dd>
A <code>plot</code> block orchestrates the macro-level narrative arc of the story. It contains a sequence of <a href="#beat">beats</a> (story steps), an optional <code>conflict_type</code>, an optional <code>resolution_pattern</code>, and optional <a href="#subplot">subplots</a>. A project can define multiple plots (for example, a main plot and a subplot), and they can reference each other via convergence points. See <a href="/language-reference/03-element-reference/">Element Reference</a>.
</dd>

<dt id="pov">Point of View (POV)</dt>
<dd>
The narrative perspective from which a scene is generated. ActOne supports <code>FirstPerson</code>, <code>SecondPerson</code>, <code>ThirdLimited</code>, <code>ThirdOmniscient</code>, and scene-level <code>Omniscient</code>. A global default is set in the <a href="#generate-block">generate block</a> with <code>default_pov</code>, and it can be overridden per scene with the <code>pov</code> property. Alternatively, a scene's <code>pov</code> can reference a specific character name to generate from that character's perspective.
</dd>

<dt id="project">Project</dt>
<dd>
The top-level organizational unit in ActOne Studio. A project contains one or more <code>.actone</code> source files, a project name, and metadata. All files within a project share a single scope for <a href="#cross-reference">cross-references</a> and validation. Projects are stored in your account and can be opened, edited, exported, or archived from the Projects screen. See <a href="/user-guide/01-projects/">Projects</a>.
</dd>

<dt id="property">Property</dt>
<dd>
A named setting within an ActOne element, written as <code>key: value</code>. For example, <code>bio: "A retired detective..."</code> is a property of a <code>character</code> block. Properties are order-independent within their parent element (you can write them in any order). Some properties are required for a valid story; others are optional. The validator highlights missing required properties as warnings in the Problems panel.
</dd>

<dt id="relationship">Relationship</dt>
<dd>
A directed connection from one character to another, defined in the <code>relationships</code> list of a <code>character</code> block. A relationship entry includes a <code>to</code> cross-reference (the target character), an optional numeric <code>weight</code> (from −100 for nemesis to +100 for soulmate), a <code>label</code> (e.g., <code>"rival"</code> or <code>"mentor"</code>), shared <code>history</code>, and a <code>dynamic</code> flag indicating whether the relationship shifts during the story.
</dd>

<dt id="resolution">Resolution</dt>
<dd>
The pattern describing how a story's central conflict concludes. The <code>resolution_pattern</code> property on a <code>plot</code> block accepts values such as <code>Transformative</code>, <code>Tragic</code>, <code>Redemptive</code>, <code>Ambiguous</code>, <code>Cyclical</code>, <code>Pyrrhic</code>, and <code>Transcendent</code>. The resolution pattern signals to the AI runtime how to shape the story's ending without prescribing specific events.
</dd>

<dt id="rule">Rule</dt>
<dd>
A governing constraint that defines how the story's world operates. Rules are listed in the <code>rules</code> array of a <code>world</code> block. Each rule entry has a <code>rule</code> description and an optional <code>category</code> — one of <code>Physical</code>, <code>Social</code>, <code>Metaphysical</code>, <code>Narrative</code>, or <code>Psychological</code>. The category tells the runtime which domain the rule applies to, so physical rules (e.g., "gravity is reversed") can be applied differently from social rules (e.g., "all deals must be sealed in blood").
</dd>

<dt id="scene">Scene</dt>
<dd>
A narrative unit where characters interact in a specific location. A <code>scene</code> block defines its <code>type</code> (e.g., <code>Action</code>, <code>Dialogue</code>, <code>Reflection</code>, <code>Climax</code>), its <code>location</code> (a cross-reference to a world location), which <code>participants</code> are present, a scene <code>objective</code>, and more. Scenes are the primary building blocks that the AI runtime expands into generated narrative content.
</dd>

<dt id="scene-type">Scene Type</dt>
<dd>
A classification of what kind of narrative work a scene performs. The <code>type</code> property on a <code>scene</code> block accepts: <code>Action</code>, <code>Dialogue</code>, <code>Reflection</code>, <code>Montage</code>, <code>Revelation</code>, <code>Confrontation</code>, <code>Transition</code>, and <code>Climax</code>. Scene type signals to the runtime what generation approach to use — a <code>Reflection</code> scene generates interior monologue, while a <code>Confrontation</code> scene generates charged exchange.
</dd>

<dt id="setting">Setting</dt>
<dd>
The place and time in which a scene takes place. In ActOne, setting is composed of two parts: the <a href="#location">location</a> (a named place within a world, referenced via the <code>location</code> property on a scene) and the temporal context (established via a <a href="#layer">timeline layer</a>). Together these anchor the scene spatially and temporally for generation.
</dd>

<dt id="story">Story</dt>
<dd>
The top-level named container for an entire narrative. A <code>story</code> block wraps all elements in a single-file project. Its name is a quoted string to allow spaces and punctuation (e.g., <code>story "The Morning Tiger" { ... }</code>). In multi-file projects, the <code>story</code> block is optional — elements can be defined at the document level across multiple files. At most one <code>story</code> block is permitted per project. See <a href="/getting-started/02-core-concepts/">Core Concepts</a>.
</dd>

<dt id="story-element">Story Element</dt>
<dd>
Any of the top-level constructs that can appear inside a <code>story</code> block or at the root of an <code>.actone</code> file: <code>character</code>, <code>world</code>, <code>scene</code>, <code>plot</code>, <code>theme</code>, <code>timeline</code>, <code>interaction</code>, or <code>generate</code>. Story elements are order-independent — you can define a scene before the character it references, and the validator will still resolve the cross-reference correctly.
</dd>

<dt id="subplot">Subplot</dt>
<dd>
A secondary narrative thread defined within a <code>plot</code> block using the <code>subplot</code> keyword. Each subplot has its own name, <code>description</code>, and <code>beats</code> list, and can specify a <code>converges_at</code> scene where it merges with the main plot. Subplots are useful for parallel storylines that eventually intersect with the primary conflict.
</dd>

<dt id="subtext">Subtext</dt>
<dd>
The unstated meaning beneath the surface of an exchange — what characters really mean versus what they say. The <code>subtext</code> property on an <code>interaction</code> block provides this layer to the AI runtime as a generation directive. For example, a scene where characters negotiate a business deal might have subtext of <code>"Elena is saying goodbye without saying goodbye."</code> The runtime uses subtext to shape word choice, pauses, and emotional register.
</dd>

<dt id="symbol">Symbol</dt>
<dd>
A recurring image or object associated with a specific character, listed in that character's <code>symbols</code> array. Unlike <a href="#motif">motifs</a> (which are story-level), symbols are character-specific. A character's symbols might include <code>"a cracked mirror"</code>, <code>"rain"</code>, or <code>"the colour red"</code>. The runtime weaves these symbols into scenes involving the character for thematic consistency.
</dd>

<dt id="theme">Theme</dt>
<dd>
A <code>theme</code> block declares the story's central thematic proposition as a first-class element. A theme has a <code>statement</code> (the proposition in plain language), a <code>motifs</code> list, an optional <code>counter</code> (the opposing thematic force), and a <code>tension</code> directive describing how the theme creates narrative conflict. Themes give the AI runtime a semantic compass so generated content reinforces the story's meaning. See also: <a href="#motif">Motif</a>, <a href="#symbol">Symbol</a>.
</dd>

<dt id="timeline">Timeline</dt>
<dd>
A <code>timeline</code> block defines the temporal structure of the narrative. It has a <code>structure</code> property specifying how time is organized (<code>Linear</code>, <code>Nonlinear</code>, <code>Parallel</code>, <code>Collapsed</code>, <code>Cyclical</code>, or <code>Reverse</code>), a <code>span</code> describing the temporal extent, and a <code>layers</code> list defining named time periods that scenes can reference. Timelines are essential for non-linear stories, multi-generational narratives, or stories where memory and present are intertwined.
</dd>

<dt id="transition">Transition</dt>
<dd>
The way one scene connects to the next, specified with the <code>transition</code> property on a <code>scene</code> block. Available transition types include <code>Cut</code>, <code>Dissolve</code>, <code>Flashback</code>, <code>FlashForward</code>, <code>Parallel</code>, <code>Smash</code>, <code>Fade</code>, and <code>Montage</code>. Transitions give the runtime editorial direction — a <code>Smash</code> cut creates jarring contrast, while a <code>Dissolve</code> creates smooth continuity.
</dd>

<dt id="turning-point">Turning Point</dt>
<dd>
The pivotal moment of internal transformation in a character's <a href="#arc">arc</a>, specified with the <code>turning_point</code> property inside an <code>arc</code> block. The turning point is distinct from the <a href="#catalyst">catalyst</a> (the external trigger) — it is the internal moment when the character changes irrevocably. In three-act terms, the turning point often occurs at the crisis or climax. See also: <a href="#arc">Arc</a>, <a href="#beat">Beat</a>.
</dd>

<dt id="validation">Validation</dt>
<dd>
The process by which ActOne Studio checks your source files for structural errors and semantic problems. Validation runs automatically as you type and reports issues in the Problems panel. Validation checks include: unresolved <a href="#cross-reference">cross-references</a>, missing required properties, duplicate element names, and rule violations. Errors block export; warnings are advisory. See <a href="/reference/troubleshooting/">Troubleshooting</a> for common validation messages.
</dd>

<dt id="voice">Voice</dt>
<dd>
A prose description of how a character speaks, thinks, and expresses themselves. The <code>voice</code> property on a <code>character</code> block is the most influential property for AI generation — rich, specific voice descriptions produce the most distinctive and consistent character output. Voice should capture rhythm, vocabulary level, sentence structure, emotional register, and characteristic speech patterns.
</dd>

<dt id="world">World</dt>
<dd>
A <code>world</code> block defines the setting and governing rules of the story's environment. A world contains named <a href="#location">locations</a>, a list of world <a href="#rule">rules</a>, an optional time <code>period</code>, and an optional <code>sensory</code> palette describing the dominant atmospheric qualities. Multiple worlds can coexist in a project (for stories that span different realities or time periods). Scenes reference world locations via <a href="#cross-reference">cross-references</a>.
</dd>

</dl>

---

<div class="callout callout-info">
<p class="callout-title">See Also</p>
<p>For the formal syntax of every element and property, see the <a href="/language-reference/02-syntax-reference/">Syntax Reference</a>. For complete property listings per element, see the <a href="/language-reference/03-element-reference/">Element Reference</a>.</p>
</div>
