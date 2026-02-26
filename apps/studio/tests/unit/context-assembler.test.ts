/**
 * T037: Context assembler tests.
 *
 * Verifies that assembleContext extracts scene context
 * from the serialized AST with correct participant details,
 * world rules, and theme statements.
 */

import { describe, it, expect } from 'vitest';

import { assembleContext } from '$lib/ai/context-assembler.js';
import { createTestStory } from '../fixtures/factories.js';

describe('assembleContext', () => {
  it('assembles context for a valid scene', () => {
    const story = createTestStory({ sceneCount: 2, characterCount: 2 });
    const result = assembleContext(story, 'Scene1', 'Measured', 0.8);

    expect(result.sceneName).toBe('Scene1');
    expect(result.sceneType).toBeDefined();
    expect(result.location).toBeDefined();
    expect(result.participants).toBeDefined();
    expect(result.pacing).toBe('Measured');
    expect(result.temperature).toBe(0.8);
  });

  it('includes participant details', () => {
    const story = createTestStory({ sceneCount: 2, characterCount: 2 });
    const result = assembleContext(story, 'Scene1', 'Measured', 0.8);

    expect(result.participants.length).toBeGreaterThan(0);
    const participant = result.participants[0]!;
    expect(participant.name).toBeDefined();
    expect(participant.nature).toBeDefined();
    expect(participant.bio).toBeDefined();
    expect(participant.voice).toBeDefined();
    expect(participant.personality).toBeDefined();
    expect(Array.isArray(participant.personality)).toBe(true);
  });

  it('includes world rules', () => {
    const story = createTestStory({ sceneCount: 2, characterCount: 2 });
    const result = assembleContext(story, 'Scene1', 'Measured', 0.8);

    expect(result.worldRules).toBeDefined();
    expect(Array.isArray(result.worldRules)).toBe(true);
    expect(result.worldRules.length).toBeGreaterThan(0);
    // The default world has rule "The tides follow a strict schedule."
    expect(result.worldRules.some((r) => r.includes('tides'))).toBe(true);
  });

  it('includes theme statements', () => {
    const story = createTestStory({ sceneCount: 2, characterCount: 2 });
    const result = assembleContext(story, 'Scene1', 'Measured', 0.8);

    expect(result.themeStatements).toBeDefined();
    expect(Array.isArray(result.themeStatements)).toBe(true);
    expect(result.themeStatements.length).toBeGreaterThan(0);
    // The default theme has statement "Every ending seeds a beginning."
    expect(result.themeStatements.some((s) => s.includes('ending'))).toBe(true);
  });

  it('handles missing scene gracefully', () => {
    const story = createTestStory({ sceneCount: 2, characterCount: 2 });

    expect(() => {
      assembleContext(story, 'NonexistentScene', 'Measured', 0.8);
    }).toThrow('Scene "NonexistentScene" not found in story');
  });
});
