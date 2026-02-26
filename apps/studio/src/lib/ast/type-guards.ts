/**
 * T061: Type guards for serialized AST elements.
 */

import type {
  SerializedStoryElement,
  SerializedCharacterDef,
  SerializedWorldDef,
  SerializedThemeDef,
  SerializedTimelineDef,
  SerializedSceneDef,
  SerializedPlotDef,
  SerializedInteractionDef,
  SerializedGenerateBlock,
} from '@repo/shared';

export function isCharacterDef(el: SerializedStoryElement): el is SerializedCharacterDef {
  return el.$type === 'CharacterDef';
}

export function isWorldDef(el: SerializedStoryElement): el is SerializedWorldDef {
  return el.$type === 'WorldDef';
}

export function isThemeDef(el: SerializedStoryElement): el is SerializedThemeDef {
  return el.$type === 'ThemeDef';
}

export function isTimelineDef(el: SerializedStoryElement): el is SerializedTimelineDef {
  return el.$type === 'TimelineDef';
}

export function isSceneDef(el: SerializedStoryElement): el is SerializedSceneDef {
  return el.$type === 'SceneDef';
}

export function isPlotDef(el: SerializedStoryElement): el is SerializedPlotDef {
  return el.$type === 'PlotDef';
}

export function isInteractionDef(el: SerializedStoryElement): el is SerializedInteractionDef {
  return el.$type === 'InteractionDef';
}

export function isGenerateBlock(el: SerializedStoryElement): el is SerializedGenerateBlock {
  return el.$type === 'GenerateBlock';
}
