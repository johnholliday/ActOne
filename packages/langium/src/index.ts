// @repo/langium — ActOne grammar + language services

export { createActOneServices } from './services/actone-module.js';
export type { ActOneServices, ActOneAddedServices } from './services/actone-module.js';

// Re-export generated AST types for consumers
export type {
  Story,
  StoryElement,
  CharacterDef,
  WorldDef,
  ThemeDef,
  TimelineDef,
  SceneDef,
  PlotDef,
  InteractionDef,
  GenerateBlock,
  PersonalityTrait,
  RelationshipEntry,
  LocationEntry,
  MoodEntry,
  GoalEntry,
  PlotBeat,
  TimelineLayer,
  StyleMixEntry,
} from './generated/ast.js';

// Re-export type guards
export {
  isStory,
  isCharacterDef,
  isWorldDef,
  isThemeDef,
  isTimelineDef,
  isSceneDef,
  isPlotDef,
  isInteractionDef,
  isGenerateBlock,
} from './generated/ast.js';

// Re-export language metadata
export { ActOneLanguageMetaData } from './generated/module.js';
