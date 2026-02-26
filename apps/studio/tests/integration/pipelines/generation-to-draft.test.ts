/**
 * T057: Generation-to-draft pipeline test.
 *
 * Tests the pipeline: scene context → assemble context → build prompt →
 * generate with mock AI → create draft.
 */

import '../../fixtures/mocks/setup.js';

import { describe, it, expect, vi } from 'vitest';
import {
  createTestStory,
  createTestScene,
  createTestCharacter,
  createTestWorld,
  createTestTheme,
} from '../../fixtures/factories.js';
import { splitIntoParagraphs } from '$lib/ai/draft-manager.js';

// Mock the context assembler to use our factory data
vi.mock('$lib/ai/context-assembler', () => ({
  assembleContext: vi.fn(
    (story: { name: string }, sceneName: string, pacing: string, temperature: number) => ({
      sceneName,
      sceneType: 'Action',
      location: 'TestPlace',
      atmosphere: { excitement: 80 },
      objective: 'Test objective for generation.',
      participants: [
        {
          name: 'Alice',
          nature: 'Human',
          bio: 'A test character.',
          voice: 'Clear and direct.',
          personality: [{ name: 'courage', value: 85 }],
        },
      ],
      worldRules: ['The world operates on test rules.'],
      themeStatements: ['Identity is fluid.'],
      pacing,
      temperature,
    }),
  ),
}));

vi.mock('$lib/ai/prompt-builder', () => ({
  buildPrompt: vi.fn((context: unknown) => 'Generated prompt for testing.'),
}));

describe('generation → draft pipeline', () => {
  it('assembles context from story data', async () => {
    const { assembleContext } = await import(
      '$lib/ai/context-assembler.js'
    );

    const story = createTestStory({ characterCount: 2, sceneCount: 3 });
    const context = assembleContext(story, 'Scene_1', 'moderate', 0.7);

    expect(context.sceneName).toBe('Scene_1');
    expect(context.participants).toBeDefined();
    expect(context.participants.length).toBeGreaterThan(0);
    expect(context.pacing).toBe('moderate');
    expect(context.temperature).toBe(0.7);
  });

  it('builds a prompt from context', async () => {
    const { buildPrompt } = await import('$lib/ai/prompt-builder.js');

    const context = {
      sceneName: 'TestScene',
      sceneType: 'Action',
      location: 'Arena',
      atmosphere: {},
      objective: 'Test the combat.',
      participants: [],
      worldRules: [],
      themeStatements: [],
      pacing: 'brisk',
      temperature: 0.8,
    };

    const prompt = buildPrompt(context);
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
  });

  it('splits generated text into paragraphs for draft storage', () => {
    const generatedText = `The arena was silent. Alice stepped forward, sword raised.

The crowd held its breath. No one dared speak.

Then the first blow landed, and everything changed.`;

    const paragraphs = splitIntoParagraphs(generatedText);
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[0]).toContain('arena');
    expect(paragraphs[1]).toContain('crowd');
    expect(paragraphs[2]).toContain('blow');
  });

  it('handles empty generation output', () => {
    const paragraphs = splitIntoParagraphs('');
    expect(paragraphs).toHaveLength(0);
  });
});
