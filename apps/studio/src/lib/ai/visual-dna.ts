/**
 * T106: Visual DNA system.
 *
 * Maintains reference images, physical descriptions, personality-to-visual
 * trait mapping, mannerisms from quirks, symbol motifs, and story-point versions.
 */

import type { SerializedCharacterDef } from '@repo/shared';

export interface VisualDNA {
  characterName: string;
  physicalDescription: string;
  personalityVisuals: Array<{ trait: string; visualExpression: string }>;
  mannerisms: string[];
  symbolMotifs: string[];
  referenceImageUrls: string[];
  storyPointVersions: Array<{ sceneOrArc: string; description: string }>;
}

/** Personality trait → visual expression mapping. */
const PERSONALITY_VISUAL_MAP: Record<string, string> = {
  Courage: 'strong posture, direct gaze, bold colors',
  Compassion: 'soft lighting, warm tones, open gestures',
  Intelligence: 'sharp eyes, thoughtful expression, cool lighting',
  Humor: 'bright eyes, slight smile, dynamic pose',
  Determination: 'set jaw, forward lean, intense lighting',
  Creativity: 'expressive hands, vibrant surroundings, unusual angles',
  Loyalty: 'protective stance, warm palette, stable composition',
  Wisdom: 'calm expression, natural lighting, measured proportions',
  Anger: 'tensed muscles, sharp shadows, red-shifted palette',
  Fear: 'wide eyes, contracted posture, cool desaturated tones',
};

/**
 * Generate Visual DNA from a character definition.
 */
export function generateVisualDNA(character: SerializedCharacterDef): VisualDNA {
  // Map personality traits to visual expressions
  const personalityVisuals = character.personality
    .filter((t) => t.value > 0.5)
    .map((trait) => ({
      trait: trait.name,
      visualExpression: PERSONALITY_VISUAL_MAP[trait.name] ?? `expression reflecting ${trait.name.toLowerCase()}`,
    }));

  // Extract mannerisms from quirks
  const mannerisms = character.quirks.map((q) => `${q} (visual: distinctive gesture or habit)`);

  // Symbol motifs from character symbols
  const symbolMotifs = character.symbols.map((s) => `${s} motif in background or accessories`);

  // Build physical description from bio and nature
  const physicalDescription = buildPhysicalDescription(character);

  // Story point versions from arc
  const storyPointVersions: Array<{ sceneOrArc: string; description: string }> = [];
  if (character.arc) {
    if (character.arc.start) {
      storyPointVersions.push({
        sceneOrArc: 'Beginning',
        description: `Early appearance: ${character.arc.start}`,
      });
    }
    if (character.arc.midpoint) {
      storyPointVersions.push({
        sceneOrArc: 'Midpoint',
        description: `Transformation: ${character.arc.midpoint}`,
      });
    }
    if (character.arc.end) {
      storyPointVersions.push({
        sceneOrArc: 'Resolution',
        description: `Final form: ${character.arc.end}`,
      });
    }
  }

  return {
    characterName: character.name,
    physicalDescription,
    personalityVisuals,
    mannerisms,
    symbolMotifs,
    referenceImageUrls: [],
    storyPointVersions,
  };
}

/**
 * Build an image generation prompt from Visual DNA.
 */
export function buildVisualPrompt(dna: VisualDNA, context?: string): string {
  const parts: string[] = [];

  parts.push(`Character portrait: ${dna.characterName}`);
  parts.push(dna.physicalDescription);

  if (dna.personalityVisuals.length > 0) {
    const visuals = dna.personalityVisuals.map((v) => v.visualExpression).join(', ');
    parts.push(`Visual mood: ${visuals}`);
  }

  if (dna.symbolMotifs.length > 0) {
    parts.push(`Incorporate: ${dna.symbolMotifs.join(', ')}`);
  }

  if (context) {
    parts.push(`Context: ${context}`);
  }

  return parts.join('. ');
}

function buildPhysicalDescription(character: SerializedCharacterDef): string {
  const parts: string[] = [];
  if (character.bio) parts.push(character.bio);
  if (character.nature && character.nature !== 'Human') {
    parts.push(`${character.nature} entity`);
  }
  return parts.join('. ') || `${character.name}, a character`;
}
