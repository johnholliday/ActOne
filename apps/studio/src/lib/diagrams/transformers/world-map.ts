/**
 * T068: World Map transformer.
 *
 * Produces world containers with nested location nodes (colored by atmosphere),
 * connection edges, and scene markers.
 */

import type {
  SerializedStory,
  ActOneNode,
  ActOneEdge,
  WorldContainerData,
  LocationNodeData,
  LocationLinkData,
} from '@repo/shared';
import { EDGE_STYLES } from '@repo/shared';
import { findWorlds, findScenes } from '$lib/ast/ast-utils.js';
import { stableId, stableEdgeId, stableGroupId } from '../operations/stable-refs.js';

export interface WorldMapResult {
  nodes: ActOneNode<WorldContainerData | LocationNodeData>[];
  edges: ActOneEdge<LocationLinkData>[];
}

/** Map atmosphere intensity to a color. Higher average → warmer color. */
function atmosphereColor(atmosphere: Array<{ name: string; value: number }>): string {
  if (atmosphere.length === 0) return '#6366f1';
  const avg = atmosphere.reduce((sum, a) => sum + a.value, 0) / atmosphere.length;
  if (avg >= 0.7) return '#ef4444'; // intense
  if (avg >= 0.5) return '#f59e0b'; // warm
  if (avg >= 0.3) return '#3b82f6'; // moderate
  return '#a1a1aa'; // cool/subdued
}

export function transformWorldMap(story: SerializedStory): WorldMapResult {
  const worlds = findWorlds(story);
  const scenes = findScenes(story);
  const nodes: ActOneNode<WorldContainerData | LocationNodeData>[] = [];
  const edges: ActOneEdge<LocationLinkData>[] = [];

  // Build a set of scenes per location for scene markers
  const scenesPerLocation = new Map<string, string[]>();
  for (const scene of scenes) {
    if (scene.location) {
      const existing = scenesPerLocation.get(scene.location) ?? [];
      existing.push(scene.name);
      scenesPerLocation.set(scene.location, existing);
    }
  }

  let worldIndex = 0;
  for (const world of worlds) {
    const groupId = stableGroupId('world', world.name);

    // World container node
    nodes.push({
      id: groupId,
      type: 'world-container',
      position: { x: worldIndex * 400, y: 0 },
      data: {
        label: world.name,
        name: world.name,
        period: world.period,
        color: '#171717',
      } as WorldContainerData,
    });

    // Location nodes within the world
    for (let i = 0; i < world.locations.length; i++) {
      const loc = world.locations[i]!;
      const color = atmosphereColor(loc.atmosphere);
      const sceneMarkers = scenesPerLocation.get(loc.name) ?? [];

      nodes.push({
        id: stableId('location', loc.name),
        type: 'location',
        position: { x: i * 180, y: 80 },
        parentId: groupId,
        data: {
          label: loc.name,
          name: loc.name,
          description: loc.description,
          atmosphere: loc.atmosphere,
          sceneMarkers,
          color,
        } as LocationNodeData,
      });

      // Connection edges from this location
      for (const target of loc.connectsTo) {
        edges.push({
          id: stableEdgeId('location', loc.name, 'location', target),
          source: stableId('location', loc.name),
          target: stableId('location', target),
          type: 'location-link',
          data: {
            label: '',
            fromLocation: loc.name,
            toLocation: target,
            color: EDGE_STYLES.locationLink,
          } as LocationLinkData,
        });
      }
    }

    worldIndex++;
  }

  return { nodes, edges };
}
