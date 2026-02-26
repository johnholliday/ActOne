// ── Serialized AST Types ─────────────────────────────────────────────
// These mirror the Langium-generated AST types but strip internal
// Langium properties ($container, $type, $cstNode, $document) and
// resolve cross-references to plain name strings.
// Used by the main thread to work with parsed story data.

export interface SerializedStory {
  name: string;
  elements: SerializedStoryElement[];
}

export type SerializedStoryElement =
  | SerializedCharacterDef
  | SerializedWorldDef
  | SerializedThemeDef
  | SerializedTimelineDef
  | SerializedSceneDef
  | SerializedPlotDef
  | SerializedInteractionDef
  | SerializedGenerateBlock;

// ── Character ────────────────────────────────────────────────────────

export interface SerializedCharacterDef {
  $type: 'CharacterDef';
  name: string;
  nature?: string;
  bio?: string;
  role?: string;
  voice?: string;
  personality: Array<{ name: string; value: number }>;
  quirks: string[];
  goals: Array<{
    goal: string;
    priority?: string;
    stakes?: string;
  }>;
  conflicts: string[];
  strengths: string[];
  flaws: string[];
  relationships: Array<{
    to: string; // resolved character name
    weight?: number;
    label?: string;
    history?: string;
    dynamic?: boolean;
  }>;
  arc?: {
    description?: string;
    start?: string;
    end?: string;
    catalyst?: string;
    midpoint?: string;
    turningPoint?: string;
  };
  symbols: string[];
  secret?: string;
  notes: string[];
}

// ── World ────────────────────────────────────────────────────────────

export interface SerializedWorldDef {
  $type: 'WorldDef';
  name: string;
  period?: string;
  sensory: string[];
  locations: Array<{
    name: string;
    description?: string;
    atmosphere: Array<{ name: string; value: number }>;
    connectsTo: string[]; // resolved location names
  }>;
  rules: Array<{
    rule: string;
    category?: string;
  }>;
}

// ── Theme ────────────────────────────────────────────────────────────

export interface SerializedThemeDef {
  $type: 'ThemeDef';
  name: string;
  statement?: string;
  motifs: string[];
  counter?: string;
  tension?: string;
}

// ── Timeline ─────────────────────────────────────────────────────────

export interface SerializedTimelineDef {
  $type: 'TimelineDef';
  name: string;
  structure?: string;
  span?: string;
  layers: Array<{
    name: string;
    description?: string;
    period?: string;
  }>;
}

// ── Scene ────────────────────────────────────────────────────────────

export interface SerializedSceneDef {
  $type: 'SceneDef';
  name: string;
  sceneType?: string;
  location?: string; // resolved location name
  pov?: string; // resolved character name or 'Omniscient'
  layer?: string; // resolved timeline layer name
  participants: string[]; // resolved character names
  atmosphere: Array<{ name: string; value: number }>;
  objective?: string;
  trigger?: string;
  transition?: string;
}

// ── Plot ─────────────────────────────────────────────────────────────

export interface SerializedPlotDef {
  $type: 'PlotDef';
  name: string;
  conflictType?: string;
  resolutionPattern?: string;
  beats: Array<{
    beat: string;
    act?: number;
    type?: string;
  }>;
  subplots: Array<{
    name: string;
    description?: string;
    beats: string[];
    convergesAt?: string; // resolved scene name
  }>;
}

// ── Interaction ──────────────────────────────────────────────────────

export interface SerializedInteractionDef {
  $type: 'InteractionDef';
  name: string;
  participants: string[]; // resolved character names
  pattern?: string;
  styleMix: Record<string, number>; // character name → value
  subtext?: string;
  powerDynamic?: string;
  emotionalArc?: string;
}

// ── Generate Block ───────────────────────────────────────────────────

export interface SerializedGenerateBlock {
  $type: 'GenerateBlock';
  temperature?: number;
  maxTokens?: number;
  continuityLoss?: number;
  styleBleed?: boolean;
  genre?: string;
  tone: string[];
  tense?: string;
  defaultPov?: string;
  pacing?: string;
  chapterBreaks?: boolean;
}
