/**
 * T032: Analytics data extraction tests.
 *
 * Tests extractAnalytics() with factory fixtures.
 */

import { describe, it, expect } from 'vitest';
import { extractAnalytics } from '$lib/project/analytics.js';
import {
  createTestStory,
  createTestCharacter,
  createTestScene,
  createTestWorld,
  createTestTheme,
  createTestTimeline,
  createTestPlot,
  createTestInteraction,
  createTestGenerateBlock,
} from '../fixtures/factories.js';
import type { SerializedStory } from '@repo/shared';

function buildStory(
  overrides: Partial<SerializedStory> = {},
): SerializedStory {
  return createTestStory({ characterCount: 3, sceneCount: 4, ...overrides });
}

describe('extractAnalytics', () => {
  describe('element counts', () => {
    it('counts characters correctly', () => {
      const story = buildStory();
      const analytics = extractAnalytics(story);
      expect(analytics.characterCount).toBe(3);
    });

    it('counts scenes correctly', () => {
      const story = buildStory();
      const analytics = extractAnalytics(story);
      expect(analytics.sceneCount).toBe(4);
    });

    it('counts worlds correctly', () => {
      const story = buildStory();
      const analytics = extractAnalytics(story);
      expect(analytics.worldCount).toBe(1);
    });

    it('counts themes correctly', () => {
      const story = buildStory();
      const analytics = extractAnalytics(story);
      expect(analytics.themeCount).toBe(1);
    });

    it('counts plots correctly', () => {
      const story = buildStory();
      const analytics = extractAnalytics(story);
      expect(analytics.plotCount).toBe(1);
    });

    it('counts interactions correctly', () => {
      const story = buildStory();
      const analytics = extractAnalytics(story);
      expect(analytics.interactionCount).toBe(1);
    });

    it('counts timelines correctly', () => {
      const story = buildStory();
      const analytics = extractAnalytics(story);
      expect(analytics.timelineCount).toBe(1);
    });
  });

  describe('word count', () => {
    it('returns a positive word count for non-empty story', () => {
      const story = buildStory();
      const analytics = extractAnalytics(story);
      expect(analytics.wordCount).toBeGreaterThan(0);
    });

    it('returns 0 for empty story', () => {
      const story: SerializedStory = { name: 'Empty', elements: [] };
      const analytics = extractAnalytics(story);
      expect(analytics.wordCount).toBe(0);
    });

    it('increases with more character bios', () => {
      const storySmall: SerializedStory = {
        name: 'Small',
        elements: [createTestCharacter({ bio: 'Short.' })],
      };
      const storyLarge: SerializedStory = {
        name: 'Large',
        elements: [
          createTestCharacter({
            bio: 'A very detailed backstory with many words describing the character in great depth.',
          }),
        ],
      };
      expect(extractAnalytics(storyLarge).wordCount).toBeGreaterThan(
        extractAnalytics(storySmall).wordCount,
      );
    });
  });

  describe('scene type distribution', () => {
    it('groups scenes by type', () => {
      const story: SerializedStory = {
        name: 'Test',
        elements: [
          createTestScene({ name: 'S1', sceneType: 'Action' }),
          createTestScene({ name: 'S2', sceneType: 'Action' }),
          createTestScene({ name: 'S3', sceneType: 'Dialogue' }),
        ],
      };
      const analytics = extractAnalytics(story);
      expect(analytics.sceneTypeDistribution['Action']).toBe(2);
      expect(analytics.sceneTypeDistribution['Dialogue']).toBe(1);
    });

    it('labels untyped scenes as "Untyped"', () => {
      const story: SerializedStory = {
        name: 'Test',
        elements: [createTestScene({ name: 'S1', sceneType: undefined })],
      };
      const analytics = extractAnalytics(story);
      expect(analytics.sceneTypeDistribution['Untyped']).toBe(1);
    });
  });

  describe('character screen time', () => {
    it('counts scenes per character', () => {
      const story: SerializedStory = {
        name: 'Test',
        elements: [
          createTestScene({
            name: 'S1',
            participants: ['Elena', 'Marco'],
          }),
          createTestScene({
            name: 'S2',
            participants: ['Elena'],
          }),
        ],
      };
      const analytics = extractAnalytics(story);
      const elena = analytics.characterScreenTime.find(
        (c) => c.name === 'Elena',
      );
      const marco = analytics.characterScreenTime.find(
        (c) => c.name === 'Marco',
      );
      expect(elena?.sceneCount).toBe(2);
      expect(marco?.sceneCount).toBe(1);
    });

    it('calculates percentage correctly', () => {
      const story: SerializedStory = {
        name: 'Test',
        elements: [
          createTestScene({ name: 'S1', participants: ['Elena'] }),
          createTestScene({ name: 'S2', participants: ['Elena'] }),
          createTestScene({ name: 'S3', participants: ['Marco'] }),
          createTestScene({ name: 'S4', participants: ['Marco'] }),
        ],
      };
      const analytics = extractAnalytics(story);
      const elena = analytics.characterScreenTime.find(
        (c) => c.name === 'Elena',
      );
      expect(elena?.percentage).toBe(50);
    });

    it('sorts by scene count descending', () => {
      const story: SerializedStory = {
        name: 'Test',
        elements: [
          createTestScene({ name: 'S1', participants: ['Elena', 'Marco'] }),
          createTestScene({ name: 'S2', participants: ['Elena'] }),
        ],
      };
      const analytics = extractAnalytics(story);
      expect(analytics.characterScreenTime[0]?.name).toBe('Elena');
    });
  });

  describe('pacing rhythm', () => {
    it('returns one entry per scene', () => {
      const story: SerializedStory = {
        name: 'Test',
        elements: [
          createTestScene({ name: 'S1', sceneType: 'Action' }),
          createTestScene({ name: 'S2', sceneType: 'Dialogue' }),
        ],
      };
      const analytics = extractAnalytics(story);
      expect(analytics.pacingRhythm).toHaveLength(2);
      expect(analytics.pacingRhythm[0]?.sceneName).toBe('S1');
      expect(analytics.pacingRhythm[0]?.sceneType).toBe('Action');
    });

    it('assigns colors based on scene type', () => {
      const story: SerializedStory = {
        name: 'Test',
        elements: [createTestScene({ name: 'S1', sceneType: 'Action' })],
      };
      const analytics = extractAnalytics(story);
      expect(analytics.pacingRhythm[0]?.color).toBe('#ef4444');
    });
  });

  describe('relationship matrix', () => {
    it('extracts relationships from characters', () => {
      const story: SerializedStory = {
        name: 'Test',
        elements: [
          createTestCharacter({
            name: 'Elena',
            relationships: [
              { to: 'Marco', weight: 70, label: 'friend', dynamic: true },
            ],
          }),
          createTestCharacter({ name: 'Marco', relationships: [] }),
        ],
      };
      const analytics = extractAnalytics(story);
      expect(analytics.relationshipMatrix).toHaveLength(1);
      expect(analytics.relationshipMatrix[0]).toEqual({
        from: 'Elena',
        to: 'Marco',
        weight: 70,
        label: 'friend',
        dynamic: true,
      });
    });

    it('defaults missing weight/label/dynamic', () => {
      const story: SerializedStory = {
        name: 'Test',
        elements: [
          createTestCharacter({
            name: 'Elena',
            relationships: [{ to: 'Marco' }],
          }),
        ],
      };
      const analytics = extractAnalytics(story);
      expect(analytics.relationshipMatrix[0]?.weight).toBe(0);
      expect(analytics.relationshipMatrix[0]?.label).toBe('');
      expect(analytics.relationshipMatrix[0]?.dynamic).toBe(false);
    });
  });
});
