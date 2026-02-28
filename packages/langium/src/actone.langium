/**
 * ActOne Grammar — v2.0
 * 
 * A domain-specific language for fiction writers orchestrating multi-agent AI story generation.
 * Characters are modeled as autonomous agents with psychographies, relationships, and goals.
 * The runtime generates emergent narrative through character interactions.
 * 
 * v2.0 Enhancements based on applying v1.x to five narratives:
 *   - Trauma (psychological/poetic — revealed need for non-human character types, sensory worlds)
 *   - Infancy (reincarnation romance — revealed need for temporal layers, metaphysical rules)
 *   - Melanin (sci-fi conspiracy — revealed need for rule categories, revelation pacing)
 *   - Inventory of Ghosts (ghost story — validated arc/symbol extensions, revealed scene typing needs)
 *   - The Morning Tiger (intimate domestic — revealed grammar felt heavy for simple stories)
 * 
 * Key design changes:
 *   1. ThemeDef — story-level thematic declarations with motifs and counter-themes
 *   2. Character nature/type — supports personified forces, concepts, animals (Trauma pattern)
 *   3. Motivation hierarchy — primary/secondary goals with stakes
 *   4. Scene typing and POV — perspective control per scene
 *   5. World rule categories — physical, social, metaphysical, narrative
 *   6. Genre/tone/tense in GenerateBlock — richer runtime directives
 *   7. Interaction subtext and power dynamics — what's beneath the surface
 *   8. Timeline support — non-linear narrative structures
 *   9. Lighter syntax options — optional shorthand for simple stories
 * 
 * @author John F. Holliday
 * @version 2.0.0
 */
grammar ActOne

// ============================================================================
// TERMINALS
// ============================================================================

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w]*/;
terminal STRING: /"[^"]*"|'[^']*'/;
terminal NUMBER returns number: /[0-9]+(\.[0-9]+)?/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;


// ============================================================================
// DATA TYPES
// ============================================================================

BooleanLiteral returns string:
    'true' | 'false';

/**
 * Names for definitions and cross-references.
 * Accepts both bare identifiers (Elena) and quoted strings ("Elena Vasquez").
 * When using STRING, cross-references must also use the quoted form.
 */
DefinitionName returns string:
    ID | STRING;

/** Signed integers for relationship weights (allows negative values) */
SignedInt returns number:
    '-'? NUMBER;


// ============================================================================
// ENTRY RULE
// ============================================================================

/**
 * Story is the top-level container. A single .actone file contains exactly one story.
 * The name is a string to allow spaces/punctuation in titles.
 */
entry Story:
    'story' name=STRING '{'
        elements+=StoryElement*
    '}';

/**
 * All top-level constructs within a story.
 * Order-independent to give writers flexibility in organization.
 * v2.0: Added ThemeDef and TimelineDef.
 */
StoryElement:
    GenerateBlock | ThemeDef | CharacterDef | WorldDef 
    | TimelineDef | SceneDef | PlotDef | InteractionDef;


// ============================================================================
// GENERATION SETTINGS (v2.0 — expanded)
// ============================================================================

/**
 * Controls AI generation behavior. Only one GenerateBlock per story is semantically valid
 * (enforced via validation, not grammar, to allow better error messages).
 * 
 * v2.0: Added genre, tone, tense, default_pov, pacing, chapter_breaks.
 * Lesson: Every story needed these specified somewhere — usually in comments or bio text.
 * Making them first-class gives the runtime explicit signals.
 */
GenerateBlock:
    'generate' '{'
        settings+=GenerateSetting*
    '}';

GenerateSetting:
    TemperatureSetting | MaxTokensSetting | ContinuityLossSetting 
    | StyleBleedSetting | GenreSetting | ToneSetting | TenseSetting 
    | DefaultPovSetting | PacingSetting | ChapterBreaksSetting;

/** Creativity vs. coherence dial (0.0 = deterministic, 2.0 = chaotic) */
TemperatureSetting:
    'temperature' ':' value=NUMBER ','?;

/** Per-generation token ceiling */
MaxTokensSetting:
    'max_tokens' ':' value=NUMBER ','?;

/** Memory decay factor (0 = perfect recall, 1 = goldfish) */
ContinuityLossSetting:
    'continuity_loss' ':' value=NUMBER ','?;

/** Allow character voices to influence other agents */
StyleBleedSetting:
    'style_bleed' ':' value=BooleanLiteral ','?;

/**
 * v2.0: Genre signal for the runtime.
 * Lesson from Melanin: genre shaped every generation decision but was never declared.
 * Accepts a string to allow compound genres like "literary science fiction".
 */
GenreSetting:
    'genre' ':' value=STRING ','?;

/**
 * v2.0: Emotional register of the narrative.
 * Lesson from Trauma vs. Morning Tiger: wildly different tones, both unspecified.
 * Accepts string array for layered tones (e.g., ["dark", "intimate", "ironic"]).
 */
ToneSetting:
    'tone' ':' '[' (values+=STRING (',' values+=STRING)* ','?)? ']' ','?;

/**
 * v2.0: Narrative tense.
 * Lesson from Trauma: first-person present tense was critical but only in voice text.
 */
TenseSetting:
    'tense' ':' value=TenseType ','?;

TenseType returns string:
    'Past' | 'Present' | 'Future';

/**
 * v2.0: Default point of view (overridable per scene).
 * Lesson from Infancy: third-person omniscient was needed for the cosmic scope.
 */
DefaultPovSetting:
    'default_pov' ':' value=PovType ','?;

PovType returns string:
    'FirstPerson' | 'SecondPerson' | 'ThirdLimited' | 'ThirdOmniscient';

/**
 * v2.0: Narrative pacing hint.
 * Lesson from Morning Tiger (slow/intimate) vs. Melanin (accelerating thriller).
 */
PacingSetting:
    'pacing' ':' value=PacingType ','?;

PacingType returns string:
    'Slow' | 'Measured' | 'Moderate' | 'Brisk' | 'Accelerating';

/** v2.0: Whether to insert chapter/section breaks between scenes */
ChapterBreaksSetting:
    'chapter_breaks' ':' value=BooleanLiteral ','?;


// ============================================================================
// THEME DEFINITION (v2.0 — new)
// ============================================================================

/**
 * Story-level thematic declarations.
 * 
 * Lesson: Every story had implicit themes that shaped generation but lived only
 * in comments or character notes. Melanin's "cultivate vs. harvest" and Trauma's
 * "seeing vs. being seen" would have been better as first-class constructs.
 * 
 * Themes give the runtime a semantic compass for narrative coherence.
 */
ThemeDef:
    'theme' name=DefinitionName '{'
        properties+=ThemeProperty*
    '}';

ThemeProperty:
    ThemeStatementProp | ThemeMotifsProp | ThemeCounterProp | ThemeTensionProp;

/** The thematic proposition in plain language */
ThemeStatementProp:
    'statement' ':' value=STRING ','?;

/** Recurring images, objects, or patterns that embody the theme */
ThemeMotifsProp:
    'motifs' ':' '['
        (motifs+=STRING (',' motifs+=STRING)* ','?)?
    ']' ','?;

/** The opposing thematic force — what the theme argues against */
ThemeCounterProp:
    'counter' ':' value=STRING ','?;

/** How the theme creates narrative tension — a generation directive */
ThemeTensionProp:
    'tension' ':' value=STRING ','?;


// ============================================================================
// CHARACTER DEFINITION (v2.0 — expanded)
// ============================================================================

/**
 * Characters are the primary agents. Each becomes an independent AI persona at runtime.
 * Properties are order-independent and all optional (validated separately).
 * 
 * v2.0: Added nature, role, quirks, strengths, flaws, symbols, notes, arc, secret,
 * motivation hierarchy. Restructured from v1.x extensions.
 */
CharacterDef:
    'character' name=DefinitionName '{'
        properties+=CharacterProperty*
    '}';

CharacterProperty:
    NatureProp | BioProp | RoleProp | PersonalityProp | VoiceProp 
    | QuirksProp | GoalsProp | ConflictsProp | StrengthsProp | FlawsProp 
    | RelationshipsProp | ArcProp | SymbolsProp | SecretProp | NotesProp;

/**
 * v2.0: Character ontological type.
 * Lesson from Trauma: Fog, Mirror, and Laughter were not humans — they were
 * personified forces and concepts. The grammar had no way to express this,
 * so it was buried in bio text. Nature tells the runtime how to embody the agent.
 */
NatureProp:
    'nature' ':' value=CharacterNature ','?;

CharacterNature returns string:
    'Human' | 'Force' | 'Concept' | 'Animal' | 'Spirit' | 'Collective' | 'Environment';

/** Freeform backstory for agent context */
BioProp:
    'bio' ':' value=STRING ','?;

/** Narrative function descriptor — the character's role in the story */
RoleProp:
    'role' ':' value=STRING ','?;

/**
 * Open-ended trait map. Traits are quantified (0-100) for agent parameterization.
 * Trait names are arbitrary IDs — no fixed vocabulary.
 * 
 * Design decision (v1.x): Kept quantitative over qualitative.
 * Prose traits belong in bio, voice, or notes.
 * Numeric model gives the runtime tunable dials: compassion: 20 generates
 * different dialogue than compassion: 80.
 */
PersonalityProp:
    'personality' ':' '{'
        traits+=PersonalityTrait*
    '}' ','?;

PersonalityTrait:
    name=ID ':' value=NUMBER ','?;

/**
 * Voice specification — how the character speaks and thinks.
 * This is the most critical property for multi-agent generation.
 * 
 * Lesson across all stories: voice text did the heaviest lifting.
 * Rich voice descriptions produced the most distinctive output.
 */
VoiceProp:
    'voice' ':' value=STRING ','?;

/** Behavioral tics, mannerisms, physical habits */
QuirksProp:
    'quirks' ':' '['
        (quirks+=STRING (',' quirks+=STRING)* ','?)?
    ']' ','?;

/**
 * Character objectives. Structured as a list of goal entries, each with
 * optional priority and stakes.
 * 
 * v2.0: Upgraded from flat string list to structured goals.
 * Lesson from Melanin: Priya had layered motivations (save Amara / understand soma / 
 * prevent harvesting) that needed priority ordering and distinct stakes.
 */
GoalsProp:
    'goals' ':' '['
        (goals+=GoalEntry (',' goals+=GoalEntry)* ','?)?
    ']' ','?;

GoalEntry:
    '{'
        properties+=GoalProperty*
    '}';

GoalProperty:
    GoalDescProp | GoalPriorityProp | GoalStakesProp;

GoalDescProp:
    'goal' ':' value=STRING ','?;

GoalPriorityProp:
    'priority' ':' value=GoalPriority ','?;

GoalPriority returns string:
    'Primary' | 'Secondary' | 'Hidden';

GoalStakesProp:
    'stakes' ':' value=STRING ','?;

/**
 * Internal contradictions and tensions.
 * Distinct from flaws: conflicts are active tensions, flaws are static weaknesses.
 */
ConflictsProp:
    'conflicts' ':' '['
        (conflicts+=STRING (',' conflicts+=STRING)* ','?)?
    ']' ','?;

/** Positive capabilities and competencies */
StrengthsProp:
    'strengths' ':' '['
        (strengths+=STRING (',' strengths+=STRING)* ','?)?
    ']' ','?;

/** Weaknesses and vulnerabilities (distinct from internal conflicts) */
FlawsProp:
    'flaws' ':' '['
        (flaws+=STRING (',' flaws+=STRING)* ','?)?
    ']' ','?;

/**
 * Cross-references to other characters with weighted, labeled relationships.
 * 
 * v2.0: Added dynamic flag for relationships that shift during the story.
 * Lesson from Inventory of Ghosts: Mara and Kael's relationship transformed
 * fundamentally, but the grammar had no way to signal mutable vs. fixed bonds.
 */
RelationshipsProp:
    'relationships' ':' '['
        (relationships+=RelationshipEntry (',' relationships+=RelationshipEntry)* ','?)?
    ']' ','?;

RelationshipEntry:
    '{'
        'to' ':' target=[CharacterDef:DefinitionName] ','?
        properties+=RelProperty*
    '}';

RelProperty:
    RelWeightProp | RelLabelProp | RelHistoryProp | RelDynamicProp;

/** Affinity weight: -100 (nemesis) to +100 (soulmate) */
RelWeightProp:
    'weight' ':' value=SignedInt ','?;

/** Named bond type */
RelLabelProp:
    'label' ':' value=STRING ','?;

/** Shared history summary for context */
RelHistoryProp:
    'history' ':' value=STRING ','?;

/**
 * v2.0: Whether this relationship changes during the narrative.
 * If true, the runtime may adjust weight/label based on scene outcomes.
 */
RelDynamicProp:
    'dynamic' ':' value=BooleanLiteral ','?;

/**
 * Character arc — transformation trajectory through the narrative.
 * Properties are order-independent.
 * 
 * v2.0: Added midpoint and catalyst.
 * Lesson from Melanin: Priya's arc had a clear midpoint (cosmic expansion)
 * and external catalyst (Amara's flatline) that the original arc structure
 * couldn't express distinctly from the turning point.
 */
ArcProp:
    'arc' ':' '{'
        properties+=ArcProperty*
    '}' ','?;

ArcProperty:
    ArcDescriptionProp | ArcStartProp | ArcEndProp 
    | ArcCatalystProp | ArcMidpointProp | ArcTurningPointProp;

/** High-level arc summary */
ArcDescriptionProp:
    'description' ':' value=STRING ','?;

/** Character's state at story opening */
ArcStartProp:
    'start' ':' value=STRING ','?;

/** Character's state at story conclusion */
ArcEndProp:
    'end' ':' value=STRING ','?;

/** v2.0: External event that forces the character into motion */
ArcCatalystProp:
    'catalyst' ':' value=STRING ','?;

/** v2.0: The character's state at the narrative midpoint — the point of no return */
ArcMidpointProp:
    'midpoint' ':' value=STRING ','?;

/** Pivotal moment of internal transformation */
ArcTurningPointProp:
    'turning_point' ':' value=STRING ','?;

/** Symbolic motifs associated with the character */
SymbolsProp:
    'symbols' ':' '['
        (symbols+=STRING (',' symbols+=STRING)* ','?)?
    ']' ','?;

/**
 * v2.0: Information the character holds that other characters (and possibly
 * the reader) don't know. Drives dramatic irony.
 * 
 * Lesson from Melanin: The Director's knowledge of the harvesting program
 * was a secret that shaped every interaction but had no grammar representation.
 */
SecretProp:
    'secret' ':' value=STRING ','?;

/** Author directives and meta-notes for generation guidance */
NotesProp:
    'notes' ':' '['
        (notes+=STRING (',' notes+=STRING)* ','?)?
    ']' ','?;


// ============================================================================
// WORLD DEFINITION (v2.0 — expanded)
// ============================================================================

/**
 * World encapsulates setting, locations, and governing rules.
 * 
 * v2.0: Added period, sensory palette, and categorized rules.
 * Lesson from Trauma: the world was primarily sensory (fog, mirrors, echoes) 
 * but the grammar only supported named locations and flat rule strings.
 * Lesson from Infancy: needed metaphysical rules distinct from physical ones.
 */
WorldDef:
    'world' name=DefinitionName '{'
        properties+=WorldProperty*
    '}';

WorldProperty:
    WorldPeriodProp | WorldSensoryProp | LocationBlock | RuleBlock;

/**
 * v2.0: Temporal anchoring.
 * Lesson: Every story specified its time period in comments or world descriptions.
 */
WorldPeriodProp:
    'period' ':' value=STRING ','?;

/**
 * v2.0: Dominant sensory characteristics of the world.
 * Lesson from Trauma: fog, dampness, muffled sound, cold glass — the sensory
 * palette was the entire world, but could only be expressed in location descriptions.
 * A story-level sensory specification lets the runtime maintain atmospheric coherence.
 */
WorldSensoryProp:
    'sensory' ':' '['
        (senses+=STRING (',' senses+=STRING)* ','?)?
    ']' ','?;

/**
 * Named locations within the world. Each has a description and optional
 * atmosphere vector for generation guidance.
 */
LocationBlock:
    'locations' ':' '['
        (locations+=LocationEntry (',' locations+=LocationEntry)* ','?)?
    ']' ','?;

LocationEntry:
    '{'
        'name' ':' name=DefinitionName ','?
        properties+=LocationProperty*
    '}';

LocationProperty:
    LocDescriptionProp | LocAtmosphereProp | LocConnectsProp;

LocDescriptionProp:
    'description' ':' value=STRING ','?;

/** Mood/atmosphere vector for this location */
LocAtmosphereProp:
    'atmosphere' ':' '{'
        moods+=MoodEntry*
    '}' ','?;

MoodEntry:
    name=ID ':' value=NUMBER ','?;

/**
 * v2.0: Spatial connectivity between locations.
 * Lesson from Melanin: characters moved between 7 locations, but the grammar
 * had no way to express adjacency or travel implications.
 */
LocConnectsProp:
    'connects_to' ':' '['
        (connections+=LocationRef (',' connections+=LocationRef)* ','?)?
    ']' ','?;

/** 
 * Reference to a location. Supports both flat (MemoryExchange) and 
 * qualified (NeonNostalgia.MemoryExchange) syntax.
 */
LocationRef:
    location=[LocationEntry:DefinitionName] | world=[WorldDef:DefinitionName] '.' location=[LocationEntry:DefinitionName];

/**
 * v2.0: Categorized world rules.
 * Lesson from Infancy and Melanin: both needed metaphysical rules that governed
 * soul mechanics and soma chemistry, but these were mixed with social rules
 * and narrative constraints in a flat list. Categories let the runtime apply
 * rules contextually.
 */
RuleBlock:
    'rules' ':' '['
        (rules+=RuleEntry (',' rules+=RuleEntry)* ','?)?
    ']' ','?;

RuleEntry:
    '{' 
        properties+=RuleProperty*
    '}';

RuleProperty:
    RuleTextProp | RuleCategoryProp;

RuleTextProp:
    'rule' ':' value=STRING ','?;

RuleCategoryProp:
    'category' ':' value=RuleCategory ','?;

RuleCategory returns string:
    'Physical' | 'Social' | 'Metaphysical' | 'Narrative' | 'Psychological';


// ============================================================================
// TIMELINE DEFINITION (v2.0 — new)
// ============================================================================

/**
 * Non-linear temporal structure.
 * 
 * Lesson from Infancy: the story spanned multiple lifetimes, with present-day
 * scenes intercut with past-life echoes. The grammar had no way to express
 * temporal layers or non-linear ordering.
 * 
 * Lesson from Trauma: the narrative existed outside normal time — memory
 * and present were superimposed. A timeline with a 'Collapsed' structure
 * would have signaled this to the runtime.
 */
TimelineDef:
    'timeline' name=DefinitionName '{'
        properties+=TimelineProperty*
    '}';

TimelineProperty:
    TimelineStructureProp | TimelineSpanProp | TimelineLayersProp;

/** How time is organized in this narrative */
TimelineStructureProp:
    'structure' ':' value=TimelineStructure ','?;

TimelineStructure returns string:
    'Linear' | 'Nonlinear' | 'Parallel' | 'Collapsed' | 'Cyclical' | 'Reverse';

/** The temporal span of the narrative */
TimelineSpanProp:
    'span' ':' value=STRING ','?;

/**
 * Named temporal layers that scenes can reference.
 * E.g., "PastLife", "Present", "CosmicTime" for Infancy.
 */
TimelineLayersProp:
    'layers' ':' '['
        (layers+=TimelineLayer (',' layers+=TimelineLayer)* ','?)?
    ']' ','?;

TimelineLayer:
    '{'
        'name' ':' name=DefinitionName ','?
        properties+=TimelineLayerProperty*
    '}';

TimelineLayerProperty:
    LayerDescProp | LayerPeriodProp;

LayerDescProp:
    'description' ':' value=STRING ','?;

LayerPeriodProp:
    'period' ':' value=STRING ','?;


// ============================================================================
// SCENE DEFINITION (v2.0 — expanded)
// ============================================================================

/**
 * Scenes are narrative units where characters interact in a location.
 * 
 * v2.0: Added scene type, POV, temporal layer reference, transition type.
 * Lesson from all five stories: scene type and POV were always implicit.
 * Making them explicit gives the runtime precise generation targets.
 */
SceneDef:
    'scene' name=DefinitionName '{'
        properties+=SceneProperty*
    '}';

SceneProperty:
    SceneTypeProp | SceneLocationProp | ScenePovProp | SceneLayerProp
    | SceneParticipantsProp | SceneAtmosphereProp | SceneObjectiveProp
    | SceneTriggerProp | SceneTransitionProp;

/**
 * v2.0: What kind of scene this is.
 * Lesson from Morning Tiger: the wake-up scene was pure reflection — no dialogue,
 * no action. But the grammar treated all scenes the same way.
 */
SceneTypeProp:
    'type' ':' value=SceneType ','?;

SceneType returns string:
    'Action' | 'Dialogue' | 'Reflection' | 'Montage' | 'Revelation' 
    | 'Confrontation' | 'Transition' | 'Climax';

/** Where the scene takes place — cross-reference to a LocationEntry */
SceneLocationProp:
    'location' ':' location=LocationRef ','?;

/**
 * v2.0: Whose perspective governs this scene.
 * Overrides the story-level default_pov for this scene.
 * Can be 'Omniscient' or reference a specific character.
 */
ScenePovProp:
    'pov' ':' (character=[CharacterDef:DefinitionName] | omniscient='Omniscient') ','?;

/**
 * v2.0: Which temporal layer this scene belongs to.
 * Lesson from Infancy: past-life scenes and present-day scenes needed
 * different generation contexts.
 */
SceneLayerProp:
    'layer' ':' layer=[TimelineLayer:DefinitionName] ','?;

/** Which characters are present */
SceneParticipantsProp:
    'participants' ':' '['
        (participants+=[CharacterDef:DefinitionName] (',' participants+=[CharacterDef:DefinitionName])* ','?)?
    ']' ','?;

/** Mood vector for the scene's emotional register */
SceneAtmosphereProp:
    'atmosphere' ':' '{'
        moods+=MoodEntry*
    '}' ','?;

/** What this scene must accomplish narratively */
SceneObjectiveProp:
    'objective' ':' value=STRING ','?;

/** Condition that initiates this scene */
SceneTriggerProp:
    'trigger' ':' value=STRING ','?;

/**
 * v2.0: How this scene connects to the next.
 * Lesson from Melanin: the jump from cosmic expansion back to the hospital room
 * was a jarring cut — but the grammar had no transition vocabulary.
 */
SceneTransitionProp:
    'transition' ':' value=TransitionType ','?;

TransitionType returns string:
    'Cut' | 'Dissolve' | 'Flashback' | 'FlashForward' | 'Parallel' 
    | 'Smash' | 'Fade' | 'Montage';


// ============================================================================
// PLOT DEFINITION (v2.0 — expanded)
// ============================================================================

/**
 * Plot orchestrates the macro-level narrative arc.
 * 
 * v2.0: Structured beats with optional act assignments. Added subplot support.
 * Lesson from Melanin (14 beats): flat string lists lost structural information.
 * Beats naturally grouped into acts, but the grammar couldn't express this.
 */
PlotDef:
    'plot' name=DefinitionName '{'
        properties+=PlotProperty*
    '}';

PlotProperty:
    PlotBeatsProp | PlotSubplotProp | PlotConflictTypeProp | PlotResolutionProp;

PlotBeatsProp:
    'beats' ':' '['
        (beats+=PlotBeat (',' beats+=PlotBeat)* ','?)?
    ']' ','?;

/**
 * v2.0: Structured beat with optional act assignment and beat type.
 * Simple form: just a description string inside braces.
 * Rich form: description + act + type for precise structural control.
 */
PlotBeat:
    '{' properties+=BeatProperty* '}';

BeatProperty:
    BeatDescProp | BeatActProp | BeatTypeProp;

BeatDescProp:
    'beat' ':' value=STRING ','?;

/** Which act this beat belongs to (for three-act structure or custom) */
BeatActProp:
    'act' ':' value=NUMBER ','?;

/** The narrative function of this beat */
BeatTypeProp:
    'type' ':' value=BeatType ','?;

BeatType returns string:
    'Setup' | 'Inciting' | 'Rising' | 'Midpoint' | 'Complication' 
    | 'Crisis' | 'Climax' | 'Falling' | 'Resolution' | 'Denouement';

/**
 * v2.0: Subplot threads.
 * Lesson from Melanin: the decoding subplot and the harvesting subplot
 * ran in parallel but converged. The grammar had no way to express
 * secondary plot threads or their convergence points.
 */
PlotSubplotProp:
    'subplot' name=DefinitionName ':' '{'
        properties+=SubplotProperty*
    '}' ','?;

SubplotProperty:
    SubplotDescProp | SubplotBeatsProp | SubplotConvergesProp;

SubplotDescProp:
    'description' ':' value=STRING ','?;

SubplotBeatsProp:
    'beats' ':' '['
        (beats+=STRING (',' beats+=STRING)* ','?)?
    ']' ','?;

/** Scene where this subplot merges with the main plot */
SubplotConvergesProp:
    'converges_at' ':' scene=[SceneDef:DefinitionName] ','?;

PlotConflictTypeProp:
    'conflict_type' ':' value=ConflictType ','?;

/**
 * v2.0: Expanded conflict taxonomy.
 * Lesson: Cosmic and Interpersonal were used, but Trauma needed
 * Intrapsychic (Self vs. parts of Self) and Morning Tiger needed
 * Existential (man vs. the transience of beauty).
 */
ConflictType returns string:
    'Interpersonal' | 'Internal' | 'Intrapsychic' | 'Societal' 
    | 'Environmental' | 'Cosmic' | 'Existential' | 'Technological';

PlotResolutionProp:
    'resolution_pattern' ':' value=ResolutionPattern ','?;

/**
 * v2.0: Expanded resolution taxonomy.
 * Added Ambiguous and Cyclical from Trauma and Infancy patterns.
 */
ResolutionPattern returns string:
    'Transformative' | 'Tragic' | 'Redemptive' | 'Ambiguous' 
    | 'Cyclical' | 'Pyrrhic' | 'Transcendent';


// ============================================================================
// INTERACTION DEFINITION (v2.0 — expanded)
// ============================================================================

/**
 * Interactions define how specific character groupings communicate.
 * The pattern string uses arrow notation for rhythm: 
 *   "greeting -> revelation -> silence -> acceptance"
 * 
 * v2.0: Added subtext, power_dynamic, emotional_arc.
 * Lesson from Melanin's ConfrontingHorror interaction: what the Director said
 * and what he meant were entirely different. The grammar had no way to signal
 * this gap between surface and depth.
 */
InteractionDef:
    'interaction' name=DefinitionName '{'
        properties+=InteractionProperty*
    '}';

InteractionProperty:
    InteractionParticipantsProp | InteractionPatternProp 
    | InteractionStyleMixProp | InteractionSubtextProp 
    | InteractionPowerProp | InteractionEmotionalArcProp;

InteractionParticipantsProp:
    'participants' ':' '['
        (participants+=[CharacterDef:DefinitionName] (',' participants+=[CharacterDef:DefinitionName])* ','?)?
    ']' ','?;

/** Rhythm pattern using arrow notation */
InteractionPatternProp:
    'pattern' ':' value=STRING ','?;

/** Voice blending ratios — how much each character's style dominates */
InteractionStyleMixProp:
    'style_mix' ':' '{'
        entries+=StyleMixEntry*
    '}' ','?;

StyleMixEntry:
    character=[CharacterDef:DefinitionName] ':' value=NUMBER ','?;

/**
 * v2.0: What's really being communicated beneath the surface dialogue.
 * Lesson from Melanin: Director's "justification" pattern was really about
 * guilt and self-preservation, but this was only in comments.
 */
InteractionSubtextProp:
    'subtext' ':' value=STRING ','?;

/**
 * v2.0: Who holds leverage in this interaction and how it shifts.
 * Lesson from Inventory of Ghosts: Mara and Kael's broker-client dynamic
 * inverted as the story progressed. Power asymmetry drives dialogue.
 */
InteractionPowerProp:
    'power_dynamic' ':' value=STRING ','?;

/**
 * v2.0: How the emotional register shifts across the interaction.
 * Uses arrow notation like pattern: "tension -> dread -> revelation -> grief"
 * Lesson from Trauma: every interaction had emotional contours that shaped
 * word choice, sentence length, and rhythm.
 */
InteractionEmotionalArcProp:
    'emotional_arc' ':' value=STRING ','?;
