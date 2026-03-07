/**
 * T060: Diagram transformation latency benchmarks.
 *
 * Benchmarks each of the 5 diagram transformers with full-story and large-project fixtures.
 * - Each transformer: <2s including layout step
 * - Character network with 50 characters: <2s
 *
 * Includes CI tolerance margins (3x).
 */

import { describe, it, expect } from 'vitest';
import { transformStoryStructure } from '$lib/diagrams/transformers/story-structure.js';
import { transformCharacterNetwork } from '$lib/diagrams/transformers/character-network.js';
import { transformWorldMap } from '$lib/diagrams/transformers/world-map.js';
import { transformTimeline } from '$lib/diagrams/transformers/timeline.js';
import { transformInteractionSequence } from '$lib/diagrams/transformers/interaction-sequence.js';
import {
  createTestStory,
  createTestCharacter,
  createTestScene,
  createTestWorld,
  createTestTimeline,
  createTestInteraction,
} from '../fixtures/factories.js';
import type { SerializedStory } from '@actone/shared';

// CI environments are often slower; allow 3x tolerance
const CI_MULTIPLIER = process.env.CI ? 3 : 1;
const THRESHOLD_MS = 2000 * CI_MULTIPLIER;

function buildLargeStory(): SerializedStory {
  return createTestStory({ characterCount: 50, sceneCount: 100 });
}

function buildStandardStory(): SerializedStory {
  return createTestStory({ characterCount: 3, sceneCount: 5 });
}

describe('diagram transformation latency', () => {
  describe('story-structure transformer', () => {
    it('transforms standard story under 2s', () => {
      const story = buildStandardStory();
      const start = performance.now();
      const result = transformStoryStructure(story);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(THRESHOLD_MS);
      expect(result.nodes.length).toBeGreaterThan(0);
    });

    it('transforms large story under 2s', () => {
      const story = buildLargeStory();
      const start = performance.now();
      const result = transformStoryStructure(story);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(THRESHOLD_MS);
      expect(result.nodes.length).toBeGreaterThanOrEqual(100);
    });
  });

  describe('character-network transformer', () => {
    it('transforms standard story under 2s', () => {
      const story = buildStandardStory();
      const start = performance.now();
      const result = transformCharacterNetwork(story);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(THRESHOLD_MS);
      expect(result.nodes.length).toBeGreaterThan(0);
    });

    it('transforms 50 characters under 2s', () => {
      const story = buildLargeStory();
      const start = performance.now();
      const result = transformCharacterNetwork(story);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(THRESHOLD_MS);
      expect(result.nodes.length).toBeGreaterThanOrEqual(50);
    });
  });

  describe('world-map transformer', () => {
    it('transforms standard story under 2s', () => {
      const story = buildStandardStory();
      const start = performance.now();
      const result = transformWorldMap(story);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(THRESHOLD_MS);
    });

    it('transforms large story under 2s', () => {
      const story = buildLargeStory();
      const start = performance.now();
      const result = transformWorldMap(story);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(THRESHOLD_MS);
    });
  });

  describe('timeline transformer', () => {
    it('transforms standard story under 2s', () => {
      const story = buildStandardStory();
      const start = performance.now();
      const result = transformTimeline(story);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(THRESHOLD_MS);
    });

    it('transforms large story under 2s', () => {
      const story = buildLargeStory();
      const start = performance.now();
      const result = transformTimeline(story);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(THRESHOLD_MS);
    });
  });

  describe('interaction-sequence transformer', () => {
    it('transforms standard story under 2s', () => {
      const story = buildStandardStory();
      const start = performance.now();
      const result = transformInteractionSequence(story);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(THRESHOLD_MS);
    });

    it('transforms large story under 2s', () => {
      const story = buildLargeStory();
      const start = performance.now();
      const result = transformInteractionSequence(story);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(THRESHOLD_MS);
    });
  });
});
