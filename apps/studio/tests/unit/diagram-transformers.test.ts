/**
 * T035: Diagram transformer tests.
 *
 * Verifies that each diagram transformer correctly converts
 * a SerializedStory into { nodes, edges } for xyflow rendering.
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
  createTestPlot,
  createTestInteraction,
} from '../fixtures/factories.js';

describe('transformStoryStructure', () => {
  it('creates scene nodes for each scene', () => {
    const story = createTestStory({ sceneCount: 3, characterCount: 2 });
    const result = transformStoryStructure(story);

    // Should have at least one node per scene
    expect(result.nodes.length).toBeGreaterThanOrEqual(3);
    const sceneNodes = result.nodes.filter((n) => n.type === 'scene');
    expect(sceneNodes).toHaveLength(3);
  });

  it('creates edges between scenes', () => {
    const story = createTestStory({ sceneCount: 3, characterCount: 2 });
    const result = transformStoryStructure(story);

    // The story has a plot with beats; even if beats don't match scene names,
    // the fallback sequential edges should exist.
    expect(result.edges.length).toBeGreaterThan(0);
  });

  it('node count is at least the scene count', () => {
    const story = createTestStory({ sceneCount: 3, characterCount: 2 });
    const result = transformStoryStructure(story);

    expect(result.nodes.length).toBeGreaterThanOrEqual(3);
  });

  it('includes plot beat data when beats match scene names', () => {
    // Create a story where beat text includes scene names for matching
    const story = createTestStory({
      sceneCount: 3,
      characterCount: 2,
    });
    const result = transformStoryStructure(story);

    // Either beat edges or sequential fallback edges should be present
    expect(result.edges.length).toBeGreaterThan(0);
    for (const edge of result.edges) {
      expect(edge.type).toBe('beat');
      expect(edge.data).toBeDefined();
    }
  });
});

describe('transformCharacterNetwork', () => {
  it('creates character nodes for each character', () => {
    const story = createTestStory({ characterCount: 3 });
    const result = transformCharacterNetwork(story);

    const characterNodes = result.nodes.filter((n) => n.type === 'character');
    expect(characterNodes).toHaveLength(3);
  });

  it('creates relationship edges with weight data', () => {
    // With 3 characters, characters at index 1 and 2 have relationships
    const story = createTestStory({ characterCount: 3 });
    const result = transformCharacterNetwork(story);

    expect(result.edges.length).toBeGreaterThan(0);
    for (const edge of result.edges) {
      expect(edge.type).toBe('relationship');
      expect(edge.data).toBeDefined();
      expect(edge.data.weight).toBeDefined();
      expect(typeof edge.data.weight).toBe('number');
    }
  });

  it('includes character name in node data', () => {
    const story = createTestStory({ characterCount: 3 });
    const result = transformCharacterNetwork(story);

    const names = result.nodes.map((n) => n.data.label);
    expect(names).toContain('Elena');
    expect(names).toContain('Marco');
    expect(names).toContain('Sofia');
  });
});

describe('transformWorldMap', () => {
  it('creates location nodes and connection edges', () => {
    // Default story has 1 world with 2 locations connected to each other
    const story = createTestStory({ characterCount: 2 });
    const result = transformWorldMap(story);

    const locationNodes = result.nodes.filter((n) => n.type === 'location');
    expect(locationNodes).toHaveLength(2);

    // Studio connects_to Harbor and Harbor connects_to Studio
    expect(result.edges.length).toBeGreaterThan(0);
    const edgeLabels = result.edges.map((e) => e.data);
    for (const data of edgeLabels) {
      expect(data.fromLocation).toBeDefined();
      expect(data.toLocation).toBeDefined();
    }
  });

  it('creates a world container node', () => {
    const story = createTestStory({ characterCount: 2 });
    const result = transformWorldMap(story);

    const worldContainers = result.nodes.filter((n) => n.type === 'world-container');
    expect(worldContainers).toHaveLength(1);
    expect(worldContainers[0]!.data.label).toBe('CoastalTown');
  });
});

describe('transformTimeline', () => {
  it('creates timeline layer nodes', () => {
    // Create story with a timeline that has 2 layers and 2 scenes assigned to layers
    const story = createTestStory({
      sceneCount: 2,
      characterCount: 2,
      elements: [
        createTestScene({ name: 'Scene1', sceneType: 'Action', layer: 'Present', participants: ['Elena'] }),
        createTestScene({ name: 'Scene2', sceneType: 'Dialogue', layer: 'Flashback', participants: ['Marco'] }),
        createTestTimeline({
          layers: [
            { name: 'Present', description: 'Current events.', period: 'Summer' },
            { name: 'Flashback', description: 'Past memories.', period: 'Winter' },
          ],
        }),
        createTestCharacter({ name: 'Elena' }),
        createTestCharacter({ name: 'Marco' }),
        createTestPlot(),
      ],
    });

    const result = transformTimeline(story);

    const layerNodes = result.nodes.filter((n) => n.type === 'timeline-layer');
    expect(layerNodes.length).toBeGreaterThanOrEqual(2);
  });

  it('creates scene block nodes', () => {
    const story = createTestStory({
      sceneCount: 2,
      characterCount: 2,
      elements: [
        createTestScene({ name: 'Scene1', sceneType: 'Action', layer: 'Present', participants: ['Elena'] }),
        createTestScene({ name: 'Scene2', sceneType: 'Dialogue', layer: 'Present', participants: ['Marco'] }),
        createTestTimeline({
          layers: [
            { name: 'Present', description: 'Current events.', period: 'Summer' },
          ],
        }),
        createTestCharacter({ name: 'Elena' }),
        createTestCharacter({ name: 'Marco' }),
        createTestPlot(),
      ],
    });

    const result = transformTimeline(story);

    const blockNodes = result.nodes.filter((n) => n.type === 'timeline-block');
    expect(blockNodes.length).toBeGreaterThanOrEqual(2);
  });
});

describe('transformInteractionSequence', () => {
  it('creates lifeline nodes for each participant', () => {
    const story = createTestStory({ characterCount: 2 });
    const result = transformInteractionSequence(story);

    const lifelineNodes = result.nodes.filter((n) => n.type === 'lifeline');
    expect(lifelineNodes).toHaveLength(2);
  });

  it('creates exchange edges between participants', () => {
    const story = createTestStory({ characterCount: 2 });
    const result = transformInteractionSequence(story);

    expect(result.edges.length).toBeGreaterThan(0);
    for (const edge of result.edges) {
      expect(edge.type).toBe('exchange');
      expect(edge.data.from).toBeDefined();
      expect(edge.data.to).toBeDefined();
    }
  });
});

describe('empty story', () => {
  const emptyStory = { name: 'Empty', elements: [] };

  it('transformStoryStructure returns empty nodes and edges', () => {
    const result = transformStoryStructure(emptyStory);
    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });

  it('transformCharacterNetwork returns empty nodes and edges', () => {
    const result = transformCharacterNetwork(emptyStory);
    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });

  it('transformWorldMap returns empty nodes and edges', () => {
    const result = transformWorldMap(emptyStory);
    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });

  it('transformTimeline returns empty nodes and edges', () => {
    const result = transformTimeline(emptyStory);
    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });

  it('transformInteractionSequence returns empty nodes and edges', () => {
    const result = transformInteractionSequence(emptyStory);
    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });
});
