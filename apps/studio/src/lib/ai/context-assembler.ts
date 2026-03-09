/**
 * T086: Context assembler.
 *
 * Extracts scene context from the serialized AST with priority-based budget:
 * - Never-truncated: scene, location, participants, voice, personality, interaction
 * - Progressively-summarized: continuity, world rules, theme statements
 * - Dropped-first: non-participant bios, distant scenes, unrelated themes
 */

import type { SerializedStory } from '@actone/shared';
import {
  findSceneByName,
  findCharacterByName,
  findWorldByName,
  findWorlds,
  findScenes,
  findThemes,
  findInteractions,
} from '$lib/ast/ast-utils.js';
import type { GenerationContext } from './generation-context.js';

/** Budget configuration for context assembly. */
export interface ContextBudget {
  maxTokens: number;
  format: 'rich' | 'concise';
}

const DEFAULT_BUDGET: ContextBudget = {
  maxTokens: 100_000,
  format: 'rich',
};

/**
 * Assemble generation context from the AST for a given scene.
 */
export function assembleContext(
  story: SerializedStory,
  sceneName: string,
  pacing: string,
  temperature: number,
  budget: ContextBudget = DEFAULT_BUDGET,
): GenerationContext {
  const scene = findSceneByName(story, sceneName);
  if (!scene) {
    throw new Error(`Scene "${sceneName}" not found in story`);
  }

  // Never-truncated: participant details
  const participants = scene.participants.map((name) => {
    const char = findCharacterByName(story, name);
    if (!char) {
      return {
        name,
        nature: 'Human',
        bio: '',
        voice: '',
        personality: [],
      };
    }

    const personality = budget.format === 'rich'
      ? char.personality
      : char.personality.slice(0, 3);

    return {
      name: char.name,
      nature: char.nature ?? 'Human',
      bio: char.bio ?? '',
      voice: char.voice ?? '',
      personality,
    };
  });

  // Never-truncated: location atmosphere
  let atmosphere = scene.atmosphere;
  const locationWorld = scene.location
    ? findWorldWithLocation(story, scene.location)
    : undefined;

  if (locationWorld && atmosphere.length === 0) {
    const loc = locationWorld.locations.find((l) => l.name === scene.location);
    if (loc) {
      atmosphere = loc.atmosphere;
    }
  }

  // Progressively-summarized: world rules
  const worldRules = collectWorldRules(story, scene.location, budget);

  // Progressively-summarized: theme statements
  const themeStatements = collectThemeStatements(story, budget);

  // Progressively-summarized: preceding scene summary
  const precedingSceneSummary = getPrecedingSceneSummary(story, sceneName, budget);

  // Never-truncated: interaction pattern
  const interactionPattern = findInteractionForScene(story, scene.participants);

  return {
    sceneName: scene.name,
    sceneType: scene.sceneType ?? 'exposition',
    location: scene.location ?? '',
    atmosphere,
    objective: scene.objective ?? '',
    participants,
    worldRules,
    precedingSceneSummary,
    themeStatements,
    interactionPattern,
    pacing,
    temperature,
  };
}

function findWorldWithLocation(
  story: SerializedStory,
  locationName: string,
) {
  for (const world of findWorlds(story)) {
    if (world.locations.some((l) => l.name === locationName)) {
      return world;
    }
  }
  return undefined;
}

function collectWorldRules(
  story: SerializedStory,
  location: string | undefined,
  budget: ContextBudget,
): string[] {
  const rules: string[] = [];
  for (const world of findWorlds(story)) {
    // Prioritize world containing the scene's location
    const isRelevant = location
      ? world.locations.some((l) => l.name === location)
      : true;

    if (isRelevant) {
      const worldRules = world.rules.map((r) => r.rule);
      if (budget.format === 'concise') {
        rules.push(...worldRules.slice(0, 3));
      } else {
        rules.push(...worldRules);
      }
    }
  }
  return rules;
}

function collectThemeStatements(
  story: SerializedStory,
  budget: ContextBudget,
): string[] {
  const themes = findThemes(story);
  if (budget.format === 'concise') {
    return themes.slice(0, 2).map((t) => t.statement ?? t.name);
  }
  return themes.map((t) => t.statement ?? t.name);
}

function getPrecedingSceneSummary(
  story: SerializedStory,
  sceneName: string,
  budget: ContextBudget,
): string | undefined {
  const scenes = findScenes(story);
  const idx = scenes.findIndex((s) => s.name === sceneName);
  if (idx <= 0) return undefined;

  const prev = scenes[idx - 1]!;
  if (budget.format === 'concise') {
    return `Previous: "${prev.name}" (${prev.sceneType ?? 'scene'})`;
  }

  const participants = prev.participants.join(', ');
  return `Previous: "${prev.name}" (${prev.sceneType ?? 'scene'}) at ${prev.location ?? 'unknown'} with ${participants}. Objective: ${prev.objective ?? 'none specified'}`;
}

function findInteractionForScene(
  story: SerializedStory,
  participants: string[],
): string | undefined {
  const interactions = findInteractions(story);
  const participantSet = new Set(participants);

  // Find an interaction that involves the same participants
  for (const interaction of interactions) {
    const overlap = interaction.participants.filter((p) => participantSet.has(p));
    if (overlap.length >= 2) {
      const mixDesc = Object.entries(interaction.styleMix)
        .map(([name, val]) => `${name}: ${Math.round(val * 100)}%`)
        .join(', ');
      return `${interaction.pattern ?? 'dialogue'} (${mixDesc})`;
    }
  }

  return undefined;
}
