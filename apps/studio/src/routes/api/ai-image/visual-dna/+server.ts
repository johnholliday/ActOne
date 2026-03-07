/**
 * T110: POST /api/ai-image/visual-dna
 *
 * Generates or updates Visual DNA for a character per contracts/api-endpoints.md §2.
 * Accepts serialized character data from the client since the AST lives in the
 * browser-side Langium worker, not on the server.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { generateVisualDNA, buildVisualPrompt } from '$lib/ai/visual-dna.js';
import type { SerializedCharacterDef } from '@actone/shared';

const visualDnaSchema = z.object({
  projectId: z.string().uuid(),
  characterName: z.string().min(1),
  characterData: z.object({
    $type: z.literal('CharacterDef'),
    name: z.string(),
    nature: z.string().optional(),
    bio: z.string().optional(),
    role: z.string().optional(),
    voice: z.string().optional(),
    personality: z.array(z.object({ name: z.string(), value: z.number() })),
    quirks: z.array(z.string()),
    goals: z.array(z.object({ goal: z.string(), priority: z.string().optional(), stakes: z.string().optional() })),
    conflicts: z.array(z.string()),
    strengths: z.array(z.string()),
    flaws: z.array(z.string()),
    relationships: z.array(z.object({
      to: z.string(),
      weight: z.number().optional(),
      label: z.string().optional(),
      history: z.string().optional(),
      dynamic: z.boolean().optional(),
    })),
    arc: z.object({
      description: z.string().optional(),
      start: z.string().optional(),
      end: z.string().optional(),
      catalyst: z.string().optional(),
      midpoint: z.string().optional(),
      turningPoint: z.string().optional(),
    }).optional(),
    symbols: z.array(z.string()),
    secret: z.string().optional(),
    notes: z.array(z.string()),
  }),
  referenceImageAssetId: z.string().uuid().optional(),
  storyPoint: z.number().min(0).max(100).optional(),
  storyPointLabel: z.string().optional(),
});

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const parsed = visualDnaSchema.safeParse(body);

  if (!parsed.success) {
    error(400, `Invalid request: ${parsed.error.message}`);
  }

  const character = parsed.data.characterData as SerializedCharacterDef;
  const dna = generateVisualDNA(character);

  // Include story point version if provided
  if (parsed.data.storyPoint !== undefined) {
    dna.storyPointVersions.push({
      sceneOrArc: parsed.data.storyPointLabel ?? `Story point ${parsed.data.storyPoint}%`,
      description: `Character at ${parsed.data.storyPoint}% through the story`,
    });
  }

  const prompt = buildVisualPrompt(dna);

  return json({
    characterName: dna.characterName,
    physicalDescription: dna.physicalDescription,
    visualTraits: dna.personalityVisuals.map((v) => v.visualExpression),
    mannerisms: dna.mannerisms,
    symbolMotifs: dna.symbolMotifs,
    versions: dna.storyPointVersions.map((v) => ({
      storyPoint: parsed.data.storyPoint ?? 0,
      label: v.sceneOrArc,
      description: v.description,
      referenceImageUrl: undefined,
    })),
  });
};
