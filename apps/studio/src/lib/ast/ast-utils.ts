/**
 * T060 (part 1): AST utility functions — finders and extractors for serialized ASTs.
 */

import type {
  SerializedStory,
  SerializedCharacterDef,
  SerializedWorldDef,
  SerializedSceneDef,
  SerializedPlotDef,
  SerializedInteractionDef,
  SerializedTimelineDef,
  SerializedThemeDef,
} from '@actone/shared';
import {
  isCharacterDef,
  isWorldDef,
  isSceneDef,
  isPlotDef,
  isInteractionDef,
  isTimelineDef,
  isThemeDef,
} from './type-guards.js';

/* ── Finders ─────────────────────────────────────────────────────── */

export function findCharacters(story: SerializedStory): SerializedCharacterDef[] {
  return story.elements.filter(isCharacterDef);
}

export function findWorlds(story: SerializedStory): SerializedWorldDef[] {
  return story.elements.filter(isWorldDef);
}

export function findScenes(story: SerializedStory): SerializedSceneDef[] {
  return story.elements.filter(isSceneDef);
}

export function findPlots(story: SerializedStory): SerializedPlotDef[] {
  return story.elements.filter(isPlotDef);
}

export function findInteractions(story: SerializedStory): SerializedInteractionDef[] {
  return story.elements.filter(isInteractionDef);
}

export function findTimelines(story: SerializedStory): SerializedTimelineDef[] {
  return story.elements.filter(isTimelineDef);
}

export function findThemes(story: SerializedStory): SerializedThemeDef[] {
  return story.elements.filter(isThemeDef);
}

/* ── By-name lookups ─────────────────────────────────────────────── */

export function findCharacterByName(
  story: SerializedStory,
  name: string,
): SerializedCharacterDef | undefined {
  return findCharacters(story).find((c) => c.name === name);
}

export function findSceneByName(
  story: SerializedStory,
  name: string,
): SerializedSceneDef | undefined {
  return findScenes(story).find((s) => s.name === name);
}

export function findWorldByName(
  story: SerializedStory,
  name: string,
): SerializedWorldDef | undefined {
  return findWorlds(story).find((w) => w.name === name);
}

/** Count how many scenes a character appears in. */
export function countSceneAppearances(
  story: SerializedStory,
  characterName: string,
): number {
  return findScenes(story).filter((s) =>
    s.participants.includes(characterName),
  ).length;
}

