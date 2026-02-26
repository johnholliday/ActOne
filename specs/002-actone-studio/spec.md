# Feature Specification: ActOne Studio

**Feature Branch**: `002-actone-studio`
**Created**: 2026-02-24
**Status**: Draft
**Input**: User description: "ActOne Studio - AI-orchestrated fiction writing application with DSL editor, diagram views, AI generation pipeline, and publishing pipeline (see actone-spec.md)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authoring Stories with the ActOne DSL (Priority: P1)

A fiction author opens ActOne Studio and writes a story using the `.actone` domain-specific language. The editor provides real-time language intelligence: syntax highlighting distinguishes keywords, definitions, references, strings, numbers, and comments; red squiggle diagnostics flag errors (e.g., personality trait values outside 0–100, self-relationships, duplicate generate blocks); autocompletion suggests character names in `participants` fields, enum values for scene types, and property keywords; hover tooltips show rich summaries of characters (nature, bio, top traits, arc phase), scenes (type, participants, location), and other elements; an outline panel shows the hierarchical structure of the story; go-to-definition jumps from a character reference to its declaration; find-references lists all uses of a name; rename updates all references; and a format command normalizes indentation and whitespace.

The `.actone` source files are the single source of truth. The DSL supports eight element types: characters (with nature, bio, role, voice, personality traits, quirks, goals, relationships, character arc, symbols, secrets, notes), worlds (with period, sensory details, locations with atmosphere and connections, rules), themes (with statement, motifs, counter-theme, tension), timelines (with structure type, span, named layers), scenes (with type, location, POV, timeline layer, participants, atmosphere, objective, trigger, transition), plots (with conflict type, resolution pattern, beats with act numbers, subplots), interactions (with participants, pattern, style mix, subtext, power dynamic, emotional arc), and a generate block (with temperature, max tokens, continuity loss, style bleed, genre, tones, tense, default POV, pacing, chapter breaks).

**Why this priority**: The DSL editor is the foundation of the entire application. All other features (diagrams, generation, publishing) derive from the parsed AST. Without a working editor with language intelligence, the application has no value.

**Independent Test**: Can be fully tested by opening a `.actone` file, typing story constructs, and verifying that syntax highlighting, validation, completion, hover, formatting, navigation, and rename all work correctly. Delivers immediate value as a structured fiction authoring tool.

**Acceptance Scenarios**:

1. **Given** an empty editor, **When** the author types `story "My Story" { character Hero { bio: "A brave warrior" } }`, **Then** keywords are highlighted, the character name is styled as a definition, and the outline shows the story with a nested character entry.
2. **Given** a story with a character whose personality trait value is 150, **When** the file is parsed, **Then** an error diagnostic appears on the trait value indicating it must be between 0 and 100.
3. **Given** a story with characters Elena and Marcus, **When** the author types `participants: [` inside a scene and triggers completion, **Then** Elena and Marcus appear as suggestions.
4. **Given** a character reference `pov: Elena` in a scene, **When** the author invokes go-to-definition, **Then** the cursor jumps to Elena's `character Elena {` declaration.
5. **Given** a story with a character named "Elena" referenced in 5 scenes, **When** the author renames Elena to "Elara", **Then** all 5 references and the declaration are updated.
6. **Given** a story with inconsistent indentation, **When** the author invokes the format command, **Then** the document is reformatted with 2-space indentation, max 2 blank lines between blocks, and preserved string content.
7. **Given** a story with two `generate` blocks, **When** the file is parsed, **Then** an error diagnostic indicates only one generate block is allowed per story.
8. **Given** a character with a relationship `to: Elena` inside `character Elena`, **When** the file is parsed, **Then** an error diagnostic indicates no self-relationships are allowed.
9. **Given** hovering over a character name, **Then** a tooltip displays the character's nature, bio excerpt, top 3 personality traits, arc phase, and relationship count.
10. **Given** a scene referencing a character not defined in the story, **When** the file is parsed, **Then** an error diagnostic indicates the participant must reference a defined character.

---

### User Story 2 - Managing Projects (Priority: P2)

An author creates a new project in ActOne Studio, providing a title, author name, and genre. The system creates a project workspace with an entry `.actone` file. The author can organize their story across multiple files (e.g., one for characters, one for world-building, one for scenes) using one of three composition modes: "merge" (unified namespace, duplicate names are errors), "overlay" (last-defined wins for alternate drafts), or "sequential" (per-file namespaces for anthologies).

The project tracks its lifecycle through stages: concept, draft, revision, final, and published. Authors advance through stages, and at each transition the system captures a snapshot preserving all file contents, word count, scene count, and character count. Authors can restore any previous snapshot. A grammar fingerprint detects version mismatches when the DSL grammar evolves.

The left sidebar shows a semantic project navigator tree organized by element type (Characters, Worlds, Themes, Timelines, Scenes, Plots, Interactions), with each node clickable to navigate to its source location in the editor.

**Why this priority**: Project management enables persistence and organization — authors need to save, load, and structure their work before using advanced features like diagrams or generation.

**Independent Test**: Can be fully tested by creating a new project, adding multiple files, switching composition modes, advancing lifecycle stages, taking and restoring snapshots. Delivers value as a structured project workspace.

**Acceptance Scenarios**:

1. **Given** the author clicks "New Project", **When** they provide a title and genre, **Then** a new project is created with an entry `.actone` file containing a story skeleton.
2. **Given** a project with two files both defining `character Elena`, **When** composition mode is "merge", **Then** an error diagnostic flags the duplicate name.
3. **Given** a project in "draft" stage, **When** the author advances to "revision", **Then** a snapshot is captured with current word count, scene count, character count, and frozen copies of all files.
4. **Given** a project with 3 snapshots, **When** the author selects "restore" on the second snapshot, **Then** all files revert to their state at that snapshot.
5. **Given** a multi-file project, **When** the author clicks a character node in the project navigator, **Then** the editor opens the file and scrolls to that character's definition.

---

### User Story 3 - Visual Story Planning with Diagrams (Priority: P3)

An author switches to one of five diagram views to visualize their story structure. Each diagram derives automatically from the current story content and updates in real-time as the author edits source files. Where supported, the author can create, delete, and rename elements directly on the diagram, and those changes are written back to the source files.

**Story Structure Diagram**: A left-to-right flow showing scenes as color-coded rectangles (colored by scene type: Action=red, Dialogue=blue, Reflection=purple, etc.) connected by directed beat edges (colored by beat type: Setup=green, Rising=yellow, Climax=red, etc.). Scenes are sized by estimated word count and grouped into chapter containers.

**Character Network Diagram**: A force-directed graph where characters appear as circles (sized by scene count, colored by nature/role) connected by relationship edges (colored by weight: green for positive, red for negative, gray for neutral; dashed for dynamic relationships; thickness proportional to absolute weight).

**World Map Diagram**: Worlds appear as large containers with locations nested inside. Location color reflects atmosphere mood values. Small scene markers on each location show which scenes take place there. Location connections show travel paths.

**Timeline Diagram**: Horizontal swim-lanes per timeline layer. Scene blocks are positioned chronologically, colored by scene type, sized by estimated word count. Semi-transparent arc phase bands (Setup, Rising, Climax, Falling, Resolution) appear behind the content.

**Interaction Sequence Diagram**: Vertical sequence diagram with character lifelines. Exchange arrows show the interaction pattern flow. Style mix percentages indicate voice dominance.

For all diagrams, authors can drag nodes to reposition them (layout overrides are persisted separately from source), double-click nodes to navigate to source definitions, and use context menus for create/delete/rename operations. The system uses content-addressable IDs (e.g., `character:Elena`, `scene:Opening`) for stable diagram-to-source mapping that survives re-parses. When a diagram edit conflicts with a concurrent source edit, the system prompts the author to choose which changes to keep.

**Why this priority**: Visual planning is a major differentiator for ActOne Studio. Authors who think visually can see their story structure, character relationships, and timeline at a glance, catching structural issues that are hard to spot in text alone.

**Independent Test**: Can be fully tested by writing a story with multiple characters, scenes, and relationships, then switching to each diagram view and verifying correct visualization, interaction, and bidirectional editing.

**Acceptance Scenarios**:

1. **Given** a story with 5 scenes of different types, **When** the author opens the Story Structure diagram, **Then** 5 color-coded scene nodes appear in left-to-right flow with beat edges connecting them.
2. **Given** a story with 3 characters and relationships between them, **When** the author opens the Character Network diagram, **Then** 3 character circles appear with relationship edges whose color and thickness reflect the weight values.
3. **Given** the Character Network diagram is open, **When** the author right-clicks and selects "Create Character", names it "Kai", **Then** a new `character Kai { bio: "New character" }` block is inserted into the source file and a new node appears on the diagram.
4. **Given** a world with 3 locations connected via `connects_to`, **When** the author opens the World Map diagram, **Then** the world container shows 3 nested location nodes with connection edges.
5. **Given** a story with a timeline having 2 layers, **When** the author opens the Timeline diagram, **Then** 2 swim-lanes appear with scene blocks positioned chronologically.
6. **Given** an interaction with 2 participants and a pattern "accusation -> denial -> revelation", **When** the author opens the Interaction Sequence diagram, **Then** 2 lifelines appear with 3 exchange arrows.
7. **Given** the author drags a scene node to a new position, **When** they reopen the diagram later, **Then** the scene appears at the manually-set position (override persisted).
8. **Given** the author is editing source text while a diagram rename operation is pending, **When** a conflict is detected, **Then** the system prompts whether to keep editor changes or apply the diagram operation.

---

### User Story 4 - Generating Prose with AI (Priority: P4)

An author selects a scene and generates prose using an AI backend. The system assembles rich context from the story's AST — including character personalities, voice specifications, world rules, atmosphere, continuity from preceding scenes, themes, and interaction directives — and sends it to the selected AI text backend. Generated text streams in real-time to a draft panel.

The system supports multiple text generation backends: a cloud API (with API key), a local LLM (via a compatible local server), a subscription-based service, and a custom user-configured endpoint. The author can switch between available backends. Before generating, the system displays an estimated cost and token count.

Generated prose is stored as structured draft blocks associated with scenes and paragraphs. Each paragraph can have multiple draft versions. The author reviews each paragraph and can Accept (lock it), Reject (discard it), or Regenerate (create a new version). Accepted prose becomes the canonical text for publishing.

The prose generation panel provides controls for scene selection, backend choice, temperature (creativity vs. coherence), and pacing. A keyboard shortcut allows quick generation.

**Why this priority**: AI prose generation is the core "AI-orchestrated" promise of ActOne Studio — it transforms the structured story plan into actual narrative prose, which is the primary creative output.

**Independent Test**: Can be fully tested by defining a scene with characters, setting, and atmosphere, then generating prose and verifying the draft review workflow (accept/reject/regenerate).

**Acceptance Scenarios**:

1. **Given** a scene with 2 participants, a location, and an atmosphere, **When** the author clicks "Generate", **Then** prose streams in real-time to the draft panel, reflecting the scene's objective, character voices, and atmosphere.
2. **Given** the generation panel is open, **When** the author selects a scene, **Then** an estimated cost and token count are displayed before generation begins.
3. **Given** generated prose for a scene with 3 paragraphs, **When** the author accepts paragraph 1, rejects paragraph 2, and regenerates paragraph 3, **Then** paragraph 1 is locked, paragraph 2 is discarded, and a new version of paragraph 3 is generated.
4. **Given** multiple text backends are configured, **When** the author opens the backend selector, **Then** each backend shows its availability status (green for available, red for unavailable) and the active backend is marked.
5. **Given** a scene with an associated interaction pattern "accusation -> denial -> revelation", **When** prose is generated, **Then** the output follows the rhythm of the interaction pattern and respects the style mix percentages.
6. **Given** a scene following another scene, **When** prose is generated, **Then** the context includes continuity from the preceding scene's ending and unresolved plot threads.

---

### User Story 5 - Story Reference and Analytics (Priority: P5)

An author views a comprehensive Story Bible that organizes all story elements into browsable sections: Characters (with personality bar charts, relationship lists, arc evolution), Worlds (with locations and rules), Relationships (as a character-by-character matrix), Themes (with statement, tension, counter-theme), Plot (beats as numbered lists), and Scenes (as a table with type, participants, and objective). The Story Bible can be exported as HTML.

A Statistics Dashboard provides overview cards (word count, scene count, character count), scene type distribution (stacked bar chart), character screen time (bar chart sorted by scene count), pacing rhythm (colored block sequence where each block represents a scene colored by type), and word count trend over time. Authors can capture analytics snapshots and export/import metrics.

**Why this priority**: Reference and analytics tools help authors understand and refine their stories. These are read-only views derived from the AST, making them relatively self-contained.

**Independent Test**: Can be fully tested by writing a story with several characters, scenes, and themes, then verifying that the Story Bible displays complete information and the Statistics Dashboard shows accurate metrics.

**Acceptance Scenarios**:

1. **Given** a story with 4 characters having defined personality traits, **When** the author opens the Story Bible Characters section, **Then** each character shows a personality bar chart, relationship list, and arc description.
2. **Given** a story with 10 scenes of various types, **When** the author opens the Statistics Dashboard, **Then** the scene type distribution chart shows the correct count per type and the pacing rhythm displays 10 colored blocks in sequence.
3. **Given** a story with 3 themes, **When** the author opens the Story Bible Themes section, **Then** each theme shows its statement, tension, counter-theme, and motifs.
4. **Given** the author clicks "Capture Snapshot" on the Statistics Dashboard, **Then** a timestamped analytics snapshot is saved with current word count, scene count, and character count.

---

### User Story 6 - Generating Visual Assets with AI (Priority: P6)

An author generates visual assets for their story: character portraits, scene illustrations, book covers, style boards, chapter headers, and graphic novel panels. The system builds image prompts from the story's AST — using character physical descriptions, personality-to-visual trait mapping (e.g., cunning >= 50 maps to "sharp piercing gaze"), scene atmosphere and location, and thematic motifs.

Multiple image generation backends are supported: a proxy-based service for high-quality images, a cloud API for quick generation, a model-based service with reference image support, and a local generation server for free unlimited generation.

A Visual DNA system anchors character visual consistency across generations by maintaining reference images, physical descriptions, visual traits, and story-point versions (e.g., "before scar" vs. "after scar"). A Style Board establishes visual identity through 4–6 exploratory images exploring different angles (atmospheric, character study, landscape, etc.).

A Gallery provides search, filtering (by type, character, scene), compare mode (side-by-side comparison), and approval workflow (approve/reject/regenerate). Visual Assets panel shows filtered thumbnails with detail views.

**Why this priority**: Visual assets enhance the storytelling experience but are supplementary to the core text authoring and generation workflow.

**Independent Test**: Can be fully tested by defining characters with descriptions and quirks, generating portraits, verifying Visual DNA consistency, creating a style board, and managing assets in the Gallery.

**Acceptance Scenarios**:

1. **Given** a character with bio, personality traits, quirks, and symbols, **When** the author generates a portrait, **Then** the prompt incorporates the character's physical description, personality-derived visual traits, mannerisms, and symbol motifs.
2. **Given** a character with a Visual DNA containing a reference image, **When** a new portrait is generated for a later story point, **Then** the new image maintains visual consistency with the reference.
3. **Given** 10 approved assets of different types, **When** the author opens the Gallery and filters by "portrait", **Then** only portrait assets are displayed.
4. **Given** 2 character portraits, **When** the author selects both and enters compare mode, **Then** the images are displayed side-by-side for comparison.

---

### User Story 7 - Publishing Manuscripts (Priority: P7)

An author exports their completed story as a professionally formatted manuscript. Accepted draft prose is assembled into chapters with proper front matter (half-title, title page, copyright, dedication, table of contents) and back matter (author bio, acknowledgments, character index).

Export formats include:
- **EPUB 3**: Standards-compliant reflowable e-book with navigation, per-chapter files, and Dublin Core metadata
- **DOCX**: Standard manuscript submission format (12pt Courier/Times, double-spaced, 1-inch margins, right-aligned header, centered scene breaks, contact info on title page)
- **PDF**: Print-ready with configurable trim size and paper type
- **Kindle (EPUB 3 fixed-layout)**: Graphic novel format with guided reading panel regions, synthetic spreads, and reading order metadata

The publishing panel shows format selection checkboxes, print settings (when applicable), dependency status indicators, and an export progress bar. A Reading Mode provides a book-like preview with serif typography, table of contents, chapter navigation, drop caps, and inline illustrations. A Spread Preview shows two-page spreads at print aspect ratio with optional bleed/margin guides and guided view panel overlays.

**Why this priority**: Publishing is the final output stage — valuable but depends on having accepted prose content first.

**Independent Test**: Can be fully tested by accepting draft prose for several scenes, then exporting to each format and verifying file structure, formatting, and content completeness.

**Acceptance Scenarios**:

1. **Given** a story with accepted prose for 5 scenes, **When** the author exports as EPUB, **Then** the output contains a valid EPUB 3 package with navigation, per-chapter XHTML files, and correct metadata.
2. **Given** a story with accepted prose, **When** the author exports as DOCX, **Then** the output uses manuscript submission format (12pt font, double-spaced, 1-inch margins, right-aligned header, centered scene breaks).
3. **Given** a story with accepted prose and illustrations, **When** the author opens Reading Mode, **Then** the prose is displayed with book-like typography (serif font, drop caps, scene breaks), table of contents, chapter navigation, and inline illustrations.
4. **Given** a graphic novel project, **When** the author opens Spread Preview, **Then** two-page spreads appear at the correct trim size with optional bleed/margin guide overlays.
5. **Given** the author selects PDF export with "US Trade (6x9)" trim size, **When** export completes, **Then** the PDF is formatted with correct page dimensions, spine width based on page count, and 0.125" bleed on all sides.

---

### User Story 8 - Graphic Novel Creation (Priority: P8)

An author working in "graphic-novel" publishing mode creates visual comic/graphic novel pages. They select from layout templates (Full Bleed, 2-Panel, 3-Strip, 4-Grid, 6-Grid, 9-Grid, Irregular) and generate panel artwork with AI. Camera direction is automatically determined by emotional intensity (close-up for high intensity, bird's-eye for low). Sequential panels maintain visual continuity.

A lettering system generates speech bubbles (standard, shout, whisper, thought styles), caption boxes, and sound effect overlays. The author navigates pages via a filmstrip and can export either the script or print-ready pages.

For Kindle publishing, the system generates panel-level reading guidance with normalized coordinates, magnification levels, and reading order for guided-view reading on e-readers.

**Why this priority**: Graphic novel mode is a specialized workflow that builds on both the AI image generation and publishing pipelines. It's a differentiating feature but serves a narrower audience.

**Independent Test**: Can be fully tested by selecting a scene, choosing a panel layout, generating panel artwork, adding lettering, and exporting print-ready pages.

**Acceptance Scenarios**:

1. **Given** a scene with high emotional intensity, **When** panel artwork is generated, **Then** the camera direction defaults to close-up.
2. **Given** a 4-Grid layout selected, **When** the author clicks on a panel region in the wireframe preview, **Then** they can regenerate that individual panel.
3. **Given** a page with dialogue, **When** lettering is applied, **Then** speech bubbles appear with appropriate styles (standard for normal speech, larger for shouts, clouded for thoughts), properly sized to contain the text.
4. **Given** 5 completed graphic novel pages, **When** the author exports as Kindle (EPUB 3 fixed-layout), **Then** each page includes panel region metadata with reading order and magnification values.

---

### Edge Cases

- What happens when an author opens a project created with an older grammar version? The system detects the grammar fingerprint mismatch and offers migration guidance.
- What happens when the author has unsaved editor changes and tries to close the project? The system prompts to save or discard changes.
- What happens when an AI backend becomes unavailable mid-generation? The system displays an error and preserves any partially streamed content.
- How does the system handle a story with no scenes when the author tries to generate prose? The generation panel indicates no scenes are available and disables the generate button.
- What happens when two diagram operations conflict with concurrent source edits? The system detects the conflict and prompts the author to choose which changes to keep.
- What happens when the author tries to advance from "final" to "published"? The system applies this as a terminal transition — published projects cannot be reverted.
- What happens when a multi-file project in "merge" mode has duplicate character names across files? An error diagnostic appears in both files at the duplicate declaration sites.
- What happens when an author generates prose for a scene with no participants? The system generates prose without character-specific voice directives, using only location, atmosphere, and world context.
- What happens when relationship weight is exactly at a threshold boundary (e.g., 60)? The system applies the styling for the range that includes the boundary value (60–100 = green, 4px).
- What happens when the author exports a story with no accepted drafts? The publishing panel warns that no prose content is available and produces an empty manuscript structure.

## Requirements *(mandatory)*

### Functional Requirements

**DSL Editor**

- **FR-001**: System MUST parse `.actone` files containing the eight element types (character, world, theme, timeline, scene, plot, interaction, generate block) with all their properties as defined in the DSL grammar v2.0.
- **FR-002**: System MUST provide real-time syntax highlighting distinguishing definitions, references, keywords, strings, numbers, enums, and comments.
- **FR-003**: System MUST validate parsed content against semantic rules (personality values 0–100, relationship weights −100 to +100, temperature 0.0–2.0, continuity loss 0.0–1.0, mood values 0–100, max 1 generate block, no self-relationships, scene participants must reference defined characters) and display error/warning diagnostics inline.
- **FR-004**: System MUST provide context-aware autocompletion for cross-references (character names in participants/pov/relationships), keywords, and enum values.
- **FR-005**: System MUST display rich hover tooltips with element-specific summaries (character: nature, bio, top 3 traits, arc phase, relationship count; scene: type, participants, location; theme: statement, tension, motifs; etc.).
- **FR-006**: System MUST provide go-to-definition, find-references, and rename operations that work across the entire file.
- **FR-007**: System MUST provide a format command that normalizes to 2-space indentation, max 2 blank lines between blocks, and preserves string content and comments.
- **FR-008**: System MUST provide a hierarchical document outline (outline/symbol tree) organized by element type with nested sub-elements.
- **FR-009**: System MUST support line comments (`//`) and block comments (`/* */`).

**Project Management**

- **FR-010**: System MUST allow authors to create new projects with title, author name, and genre, producing an initial entry `.actone` file.
- **FR-011**: System MUST support multi-file projects with three composition modes: merge (unified namespace, duplicate names error), overlay (last-defined wins), and sequential (per-file namespaces).
- **FR-012**: System MUST resolve cross-file references according to the active composition mode, with source resolution order being entry file first, then alphabetical.
- **FR-013**: System MUST enforce lifecycle stage transitions: concept → draft → revision ↔ final → published (terminal), capturing a snapshot at each transition.
- **FR-014**: System MUST capture snapshots containing frozen file copies, word count, scene count, character count, tag, date, and optional notes.
- **FR-015**: System MUST allow authors to restore any previous snapshot.
- **FR-016**: System MUST compute and store a grammar fingerprint (hash of normalized grammar) and detect version mismatches on project load.
- **FR-017**: System MUST provide a semantic project navigator tree in the sidebar, organized by element type, with clickable navigation to source locations.
- **FR-018**: System MUST persist all project data (files, metadata, snapshots, assets) per user with user-level isolation (each user sees only their own projects).

**Diagrams**

- **FR-019**: System MUST generate a Story Structure diagram showing scenes as colored rectangles (colored by scene type) connected by beat edges (colored by beat type) in left-to-right flow, with chapter group containers.
- **FR-020**: System MUST generate a Character Network diagram showing characters as circles (sized by scene count) connected by relationship edges (colored and sized by weight, dashed for dynamic).
- **FR-021**: System MUST generate a World Map diagram showing worlds as containers with nested location nodes (colored by atmosphere) and connection edges, with scene markers on locations.
- **FR-022**: System MUST generate a Timeline diagram with horizontal swim-lanes per timeline layer, scene blocks positioned chronologically, and arc phase background bands.
- **FR-023**: System MUST generate an Interaction Sequence diagram with character lifelines, exchange arrows from the pattern, and style mix percentage indicators.
- **FR-024**: All diagrams MUST derive from the current parsed AST and update when source files change.
- **FR-025**: Diagrams MUST support drag-to-reposition with persisted layout overrides that survive re-parses.
- **FR-026**: Story Structure and Character Network diagrams MUST support bidirectional editing: create, delete, and rename elements via context menu, generating text edits back to source files.
- **FR-027**: System MUST use content-addressable stable IDs (format `type:name`) for diagram-source mapping.
- **FR-028**: System MUST detect and resolve conflicts between concurrent diagram operations and source text edits, prompting the user to choose.
- **FR-029**: Diagram nodes MUST support double-click to navigate to the element's source definition in the editor.

**AI Text Generation**

- **FR-030**: System MUST support multiple text generation backends (cloud API with key, local LLM, subscription service, custom endpoint) implementing a common interface: generate (streaming), estimate cost, check availability, report capabilities.
- **FR-031**: System MUST assemble generation context from the AST with priority-based budget: never truncated (scene, location, atmosphere, participants, voice, personality, interaction pattern), progressively summarized (continuity, world rules), dropped first (non-participant bios, distant summaries).
- **FR-032**: System MUST build prompts in two format levels: rich (detailed character cards, full personality, structured sections) for large models and concise (abbreviated, top 3 traits only) for small/local models.
- **FR-033**: System MUST stream generated text in real-time to the draft panel.
- **FR-034**: System MUST store generated prose as structured draft blocks associated with scene name, paragraph index, status (pending/accepted/rejected/editing), backend, model, temperature, token count, cost, and timestamp.
- **FR-035**: System MUST support multiple draft versions per paragraph with version history preservation.
- **FR-036**: System MUST provide per-paragraph review controls: Accept (lock), Reject (discard), Regenerate (create new version).
- **FR-037**: System MUST display cost estimates (USD and token count) before generation begins.
- **FR-038**: System MUST provide a prose generation panel with scene selection, backend selector (with availability indicators), temperature slider (0.0–2.0), and pacing selector.
- **FR-039**: System MUST provide a keyboard shortcut for scene prose generation.

**AI Image Generation**

- **FR-040**: System MUST support multiple image generation backends (proxy-based, cloud API, model-based with reference images, local server) implementing a common interface.
- **FR-041**: System MUST generate image prompts from AST data: portraits from character descriptions and personality-to-visual mapping, scenes from location and atmosphere, covers from title and themes.
- **FR-042**: System MUST maintain Visual DNA per character: reference images, physical description, visual traits derived from personality, mannerisms from quirks, symbol motifs, and story-point versions.
- **FR-043**: System MUST support Style Board generation (4–6 exploratory images establishing visual identity from genre, tones, period, motifs, and sensory attributes).
- **FR-044**: System MUST provide a Gallery with search, type/character/scene filtering, compare mode (side-by-side), sort order, and approval workflow (approve/reject/regenerate).
- **FR-045**: System MUST provide a Visual Assets panel with type filter tabs, backend dropdown, thumbnail grid, and detail panel with approval controls.

**Publishing**

- **FR-046**: System MUST assemble manuscripts from accepted draft blocks organized by scene order, with front matter (half-title, title page, copyright, dedication, epigraph, table of contents) and back matter (author bio, acknowledgments, glossary, character index).
- **FR-047**: System MUST export to EPUB 3 format with Content.opf manifest, nav.xhtml, per-chapter XHTML files, linked stylesheet, Dublin Core metadata, and optional cover image.
- **FR-048**: System MUST export to DOCX manuscript submission format (12pt Courier or Times New Roman, double-spaced, 1-inch margins, 0.5-inch first-line indent, right-aligned header, new pages for chapters, centered scene breaks, contact info and word count on title page).
- **FR-049**: System MUST export to PDF with configurable trim size and paper type, including spine width calculation based on paper type and page count, gutter calculation, bleed (0.125"), and safe area.
- **FR-050**: System MUST provide a Reading Mode with book-like typography (serif font, 16px base, 1.7 line-height), table of contents, chapter navigation, drop caps, scene break markers, inline illustrations, and reading time estimate (250 WPM).
- **FR-051**: System MUST provide a Spread Preview showing two-page spreads at print aspect ratio with optional bleed/margin guides and guided-view panel overlays.
- **FR-052**: System MUST provide a publishing panel with format checkboxes, print settings, dependency indicators, export progress bar, and completion summary with file sizes.

**Graphic Novel**

- **FR-053**: System MUST support graphic novel publishing mode with layout templates (Full Bleed, 2-Panel, 3-Strip, 4-Grid, 6-Grid, 9-Grid, Irregular).
- **FR-054**: System MUST generate per-panel artwork with camera direction determined by emotional intensity (0.9+ → close-up, 0.6+ → medium, below 0.2 → bird's-eye) and visual continuity between sequential panels.
- **FR-055**: System MUST provide a lettering system generating speech bubbles (standard/shout/whisper/thought), caption boxes, and sound effect overlays with dynamic text wrapping and bubble sizing.
- **FR-056**: System MUST export Kindle format as EPUB 3 fixed-layout (`rendition:layout=pre-paginated`) with per-page panel region metadata (normalized coordinates, magnification, reading order), synthetic spreads for landscape mode, and book metadata.
- **FR-057**: System MUST provide a graphic novel panel with layout selector, page preview wireframe, per-panel controls, page filmstrip, generation progress, page navigation, and script/print-ready export.

**Application Shell**

- **FR-058**: System MUST provide a menu bar with Project (New, Advance Stage, Snapshot), Generate (Scene Prose, Visual Assets), View (Draft Panel, Backend Selector, Gallery, Statistics, Story Bible, Reading Mode, Spread Preview, Project Navigator), Publish (Export Manuscript), and Help (User's Guide) menus.
- **FR-059**: System MUST provide a resizable three-zone layout: left sidebar (project navigator), main area (editor/diagrams/gallery/bible/reading/statistics), and bottom panel (prose generation/draft/backend/visual assets/publishing/graphic novel).
- **FR-060**: System MUST require user authentication, with each user only able to access their own projects and data.

### Key Entities

- **Story**: The root container. Has a name (title) and contains all other elements. One story per `.actone` file. Properties: title, elements (characters, worlds, themes, timelines, scenes, plots, interactions, generate block).
- **Character**: A story agent with nature (Human/Force/Concept/Animal/Spirit/Collective/Environment), bio, role, voice specification, personality traits (name:value 0–100), quirks, goals (with priority and stakes), conflicts, strengths, flaws, relationships (to other characters with weight −100 to +100), character arc (start/catalyst/midpoint/turning point/end), symbols, secret, and notes.
- **World**: A story setting with period, sensory details, locations (named, with description, atmosphere moods, and connections to other locations), and rules (with category: Physical/Social/Metaphysical/Narrative/Psychological).
- **Theme**: A thematic declaration with statement, motifs (string list), counter-theme, and tension.
- **Timeline**: Temporal structure with structure type (Linear/Nonlinear/Parallel/Collapsed/Cyclical/Reverse), span, and named layers (with description and period). Scenes reference layers.
- **Scene**: A narrative unit with type (Action/Dialogue/Reflection/Montage/Revelation/Confrontation/Transition/Climax), location reference, POV (character or Omniscient), timeline layer reference, participants (character references), atmosphere (mood name:value 0–100), objective, trigger, and transition type.
- **Plot**: A macro narrative arc with conflict type, resolution pattern, beats (with description, type, and act number), and named subplots (with description, beats list, and convergence scene reference).
- **Interaction**: A character communication pattern with participants, arrow-notation pattern, style mix (character:percentage), subtext, power dynamic, and emotional arc.
- **Generate Block**: AI configuration with temperature, max tokens, continuity loss, style bleed, genre, tones, tense, default POV, pacing, and chapter breaks.
- **Project**: A management container with title, author, genre, grammar version, grammar fingerprint, composition mode, lifecycle stage, publishing mode, and associated source files.
- **Draft**: A generated prose version with scene name, paragraph index, content, status (pending/accepted/rejected/editing), backend, model, temperature, token count, cost, and timestamp.
- **Asset**: A generated image with type (portrait/cover/scene/style-board/chapter-header/panel), name, status (pending/approved/rejected), prompt, backend, and metadata.
- **Snapshot**: A frozen project state at a lifecycle transition with tag, stage, word count, scene count, character count, notes, and copies of all file contents.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Authors can write a complete story definition (with characters, worlds, scenes, and plots) in the DSL editor and receive real-time validation feedback within 200ms of each keystroke.
- **SC-002**: All five diagram views accurately reflect the current story content, updating within 2 seconds of source file changes.
- **SC-003**: Authors can generate prose for any defined scene and review results (accept/reject/regenerate) within a single continuous workflow, with streaming text appearing within 1 second of clicking "Generate".
- **SC-004**: 95% of autocompletion suggestions are contextually relevant (e.g., only character names appear in `participants` fields, only valid enum values appear for typed properties).
- **SC-005**: Authors can create a new project, write a story, generate prose for 3 scenes, accept drafts, and export a formatted manuscript in under 30 minutes on first use.
- **SC-006**: Diagram-to-source bidirectional edits (create, delete, rename) produce valid `.actone` syntax 100% of the time.
- **SC-007**: Published manuscripts (EPUB, DOCX) pass format validation tools without errors.
- **SC-008**: Character Visual DNA maintains recognizable visual consistency across at least 5 generated portraits of the same character (as judged by author approval rate above 70%).
- **SC-009**: Project snapshots capture and restore complete file state with zero data loss.
- **SC-010**: The system supports projects with at least 50 characters, 100 scenes, and 10 source files without degradation in editor responsiveness.

## Assumptions

- Authors are fiction writers familiar with structured storytelling concepts (character arcs, plot beats, three-act structure) but not necessarily programmers. The DSL syntax is designed to be learnable without programming experience.
- The system operates as a web application with persistent cloud storage. Local-only or offline modes are not in scope for this specification.
- AI backend API keys and endpoints are configured by the author through application settings. The system does not provide its own AI compute resources.
- Image generation backends vary in cost, quality, and speed. The system presents options but does not mandate a specific backend.
- Print publishing dimensions and specifications follow Kindle Direct Publishing (KDP) standards for trim sizes, spine width, and bleed calculations.
- Grammar evolution (version changes to the DSL) is handled through fingerprint detection and migration tooling, but automatic migration of file content is out of scope for this specification.
- The application supports one active project at a time per browser session. Multi-project dashboards and collaboration features are out of scope.
