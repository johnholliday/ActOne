/**
 * T060 (part 1): AST utility functions — finders and extractors for serialized ASTs.
 */

import type {
  SerializedStory,
  SerializedStoryElement,
  SerializedCharacterDef,
  SerializedWorldDef,
  SerializedSceneDef,
  SerializedPlotDef,
  SerializedInteractionDef,
  SerializedTimelineDef,
  SerializedThemeDef,
} from '@repo/shared';
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

/* ── Extractors ──────────────────────────────────────────────────── */

/** Get all unique character names referenced across all scenes. */
export function extractAllParticipants(story: SerializedStory): string[] {
  const names = new Set<string>();
  for (const scene of findScenes(story)) {
    for (const p of scene.participants) {
      names.add(p);
    }
  }
  return Array.from(names);
}

/** Get all unique location names defined across all worlds. */
export function extractAllLocations(story: SerializedStory): string[] {
  const names: string[] = [];
  for (const world of findWorlds(story)) {
    for (const loc of world.locations) {
      names.push(loc.name);
    }
  }
  return names;
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

/** Get all relationships involving a character. */
export function getCharacterRelationships(
  story: SerializedStory,
  characterName: string,
): Array<{ from: string; to: string; weight?: number; label?: string; dynamic?: boolean }> {
  const relationships: Array<{
    from: string;
    to: string;
    weight?: number;
    label?: string;
    dynamic?: boolean;
  }> = [];

  for (const character of findCharacters(story)) {
    for (const rel of character.relationships) {
      if (character.name === characterName || rel.to === characterName) {
        relationships.push({
          from: character.name,
          to: rel.to,
          weight: rel.weight,
          label: rel.label,
          dynamic: rel.dynamic,
        });
      }
    }
  }

  return relationships;
}
