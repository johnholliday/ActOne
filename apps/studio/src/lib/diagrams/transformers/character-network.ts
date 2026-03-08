/**
 * T067: Character Network transformer.
 *
 * Produces character nodes (sized by scene count, colored by nature)
 * with relationship edges (colored/sized by weight, dashed for dynamic).
 */

import type {
  SerializedStory,
  ActOneNode,
  ActOneEdge,
  CharacterNodeData,
  RelationshipEdgeData,
} from '@actone/shared';
import { CHARACTER_NATURE_COLORS, EDGE_STYLES } from '@actone/shared';
import { findCharacters, findScenes, countSceneAppearances } from '$lib/ast/ast-utils.js';
import { stableId, stableEdgeId } from '../operations/stable-refs.js';

export interface CharacterNetworkResult {
  nodes: ActOneNode<CharacterNodeData>[];
  edges: ActOneEdge<RelationshipEdgeData>[];
}

export function transformCharacterNetwork(story: SerializedStory): CharacterNetworkResult {
  const characters = findCharacters(story);
  const scenes = findScenes(story);
  const nodes: ActOneNode<CharacterNodeData>[] = [];
  const edges: ActOneEdge<RelationshipEdgeData>[] = [];
  const edgeSet = new Set<string>();

  // Create character nodes arranged in a circle
  const radius = Math.max(120, characters.length * 35);
  const angleStep = (2 * Math.PI) / Math.max(characters.length, 1);

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i]!;
    const sceneCount = countSceneAppearances(story, char.name);
    const color = CHARACTER_NATURE_COLORS[char.nature as keyof typeof CHARACTER_NATURE_COLORS] ?? '#6366f1';

    // Top 3 personality traits
    const topTraits = char.personality
      .slice()
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    nodes.push({
      id: stableId('character', char.name),
      type: 'character',
      position: {
        x: Math.cos(i * angleStep) * radius + radius + 100,
        y: Math.sin(i * angleStep) * radius + radius + 100,
      },
      data: {
        label: char.name,
        name: char.name,
        nature: char.nature ?? 'Human',
        role: char.role,
        bio: char.bio,
        sceneCount,
        color,
        topTraits,
      } as CharacterNodeData,
    });
  }

  // Create relationship edges
  for (const char of characters) {
    for (const rel of char.relationships) {
      // Avoid duplicate edges (A→B and B→A)
      const canonicalKey = [char.name, rel.to].sort().join('↔');
      if (edgeSet.has(canonicalKey)) continue;
      edgeSet.add(canonicalKey);

      // Determine edge color based on weight
      const weight = rel.weight ?? 5;
      let edgeColor: string;
      if (weight >= 7) {
        edgeColor = EDGE_STYLES.relationship.positive;
      } else if (weight <= 3) {
        edgeColor = EDGE_STYLES.relationship.negative;
      } else {
        edgeColor = EDGE_STYLES.relationship.neutral;
      }

      edges.push({
        id: stableEdgeId('character', char.name, 'character', rel.to, rel.label),
        source: stableId('character', char.name),
        target: stableId('character', rel.to),
        type: 'relationship',
        data: {
          label: rel.label ?? '',
          weight,
          color: edgeColor,
          dynamic: rel.dynamic ?? false,
        } as RelationshipEdgeData,
      });
    }
  }

  return { nodes, edges };
}
