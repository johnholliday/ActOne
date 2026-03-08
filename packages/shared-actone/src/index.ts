// @actone/shared — canonical types, DB schemas, constants

// ── Types ────────────────────────────────────────────────────────────
export type {
  StableId,
  ActOneNode,
  ActOneEdge,
  SceneNodeData,
  BeatEdgeData,
  ChapterGroupData,
  CharacterNodeData,
  RelationshipEdgeData,
  WorldContainerData,
  LocationNodeData,
  LocationLinkData,
  TimelineLayerData,
  TimelineBlockData,
  ArcPhaseBandData,
  LifelineData,
  ExchangeArrowData,
  GenerationRequest,
  GenerationStreamEvent,
  CostEstimate,
  BackendInfo,
  ExportFormat,
  ExportConfig,
  ExportResult,
  LifecycleStage,
  CompositionMode,
  LifecycleTransition,
  ActOneProjectMetadata,
} from './types/index.js';

export { VALID_TRANSITIONS, isValidTransition, defaultActOneMetadata } from './types/index.js';

export type {
  SerializedStory,
  SerializedStoryElement,
  SerializedCharacterDef,
  SerializedWorldDef,
  SerializedThemeDef,
  SerializedTimelineDef,
  SerializedSceneDef,
  SerializedPlotDef,
  SerializedInteractionDef,
  SerializedGenerateBlock,
} from './types/index.js';

// ── Constants ────────────────────────────────────────────────────────
export {
  SCENE_TYPE_COLORS,
  BEAT_TYPE_COLORS,
  EDGE_STYLES,
  CHARACTER_NATURE_COLORS,
} from './constants/colors.js';

export {
  CHARACTER_NATURES,
  SCENE_TYPES,
  TIMELINE_STRUCTURES,
  TRANSITION_TYPES,
  CONFLICT_TYPES,
  RESOLUTION_PATTERNS,
  BEAT_TYPES,
  TENSES,
  POVS,
  PACINGS,
  GOAL_PRIORITIES,
  RULE_CATEGORIES,
} from './constants/enums.js';

export type {
  CharacterNature,
  SceneType,
  TimelineStructure,
  TransitionType,
  ConflictType,
  ResolutionPattern,
  BeatType,
  Tense,
  POV,
  Pacing,
  GoalPriority,
  RuleCategory,
} from './constants/enums.js';

export { VALIDATION } from './constants/validation.js';
