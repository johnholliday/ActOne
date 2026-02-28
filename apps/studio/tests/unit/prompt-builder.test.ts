/**
 * T038: Prompt builder tests.
 *
 * Verifies that buildPrompt produces structured prompts
 * from GenerationContext, and that estimatePromptTokens
 * returns a positive token estimate.
 */

import { describe, it, expect } from 'vitest';

import { buildPrompt, estimatePromptTokens } from '$lib/ai/prompt-builder.js';
import type { GenerationContext } from '$lib/ai/backends/backend-registry.js';

const testContext: GenerationContext = {
  sceneName: 'Opening',
  sceneType: 'Reflection',
  location: 'Studio',
  atmosphere: [{ name: 'calm', value: 70 }],
  objective: 'Test',
  participants: [
    {
      name: 'Elena',
      nature: 'Human',
      bio: 'Test',
      voice: 'Calm',
      personality: [{ name: 'creativity', value: 85 }],
    },
  ],
  worldRules: ['Tides follow schedule'],
  themeStatements: ['Every ending seeds a beginning.'],
  pacing: 'Measured',
  temperature: 0.8,
};

describe('buildPrompt', () => {
  it('builds a non-empty prompt string', () => {
    const prompt = buildPrompt(testContext);

    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
  });

  it('includes scene context in prompt', () => {
    const prompt = buildPrompt(testContext);

    // Should contain the scene name or objective text
    const hasSceneName = prompt.includes('Opening');
    const hasObjective = prompt.includes('Test');
    expect(hasSceneName || hasObjective).toBe(true);
  });

  it('includes participant info', () => {
    const prompt = buildPrompt(testContext);

    expect(prompt).toContain('Elena');
  });

  it('supports rich and concise formats', () => {
    const richPrompt = buildPrompt(testContext, 'rich');
    const concisePrompt = buildPrompt(testContext, 'concise');

    expect(richPrompt.length).toBeGreaterThan(0);
    expect(concisePrompt.length).toBeGreaterThan(0);
    // Rich format should be more detailed (longer) than concise
    expect(richPrompt.length).toBeGreaterThan(concisePrompt.length);
  });
});

describe('estimatePromptTokens', () => {
  it('returns positive number for non-empty prompt', () => {
    const prompt = buildPrompt(testContext);
    const tokens = estimatePromptTokens(prompt);

    expect(tokens).toBeGreaterThan(0);
    expect(Number.isInteger(tokens)).toBe(true);
  });

  it('returns 0 for empty string', () => {
    const tokens = estimatePromptTokens('');
    expect(tokens).toBe(0);
  });
});
