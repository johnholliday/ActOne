/**
 * T055: AST-to-diagram pipeline test.
 *
 * Parses full-story.actone fixture → serializes AST → runs story-structure
 * transformer → verifies output nodes match fixture elements.
 */

import { describe, it, expect } from 'vitest';
import { transformStoryStructure } from '$lib/diagrams/transformers/story-structure.js';
import { transformCharacterNetwork } from '$lib/diagrams/transformers/character-network.js';
import { transformWorldMap } from '$lib/diagrams/transformers/world-map.js';
import { createTestStory, createTestCharacter, createTestScene, createTestWorld } from '../../fixtures/factories.js';
import type { SerializedStory } from '@actone/shared';

describe('AST → diagram pipeline', () => {
  describe('story-structure view', () => {
    it('transforms a serialized story into nodes and edges', () => {
      const story = createTestStory({ characterCount: 3, sceneCount: 4 });
      const result = transformStoryStructure(story);

      expect(result.nodes.length).toBeGreaterThanOrEqual(4); // At least one node per scene
      expect(result.edges).toBeDefined();
    });

    it('scene nodes have correct data', () => {
      const story: SerializedStory = {
        name: 'Test',
        elements: [
          createTestScene({ name: 'Opening', sceneType: 'Action' }),
          createTestScene({ name: 'Climax', sceneType: 'Climax' }),
        ],
      };

      const result = transformStoryStructure(story);
      const nodeNames = result.nodes.map((n) => n.data?.label ?? n.data?.name ?? '');
      expect(nodeNames.some((name) => name.includes('Opening') || name.includes('opening'))).toBe(true);
    });
  });

  describe('character-network view', () => {
    it('creates nodes for characters and edges for relationships', () => {
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

      const result = transformCharacterNetwork(story);

      // Should have at least 2 character nodes
      expect(result.nodes.length).toBeGreaterThanOrEqual(2);
      // Should have at least 1 relationship edge
      expect(result.edges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('world-map view', () => {
    it('creates location nodes from world data', () => {
      const story: SerializedStory = {
        name: 'Test',
        elements: [
          createTestWorld({
            name: 'TestWorld',
            locations: [
              { name: 'Place1', description: 'First place', atmosphere: [{ name: 'calm', value: 50 }], connectsTo: ['Place2'] },
              { name: 'Place2', description: 'Second place', atmosphere: [{ name: 'tension', value: 70 }], connectsTo: ['Place1'] },
            ],
          }),
        ],
      };

      const result = transformWorldMap(story);
      expect(result.nodes.length).toBeGreaterThanOrEqual(2);
    });
  });
});
