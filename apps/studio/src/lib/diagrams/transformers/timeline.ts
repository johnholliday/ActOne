/**
 * T069: Timeline transformer.
 *
 * Produces horizontal swim-lanes per timeline layer
 * with scene blocks inside each lane.
 */

import type {
  SerializedStory,
  ActOneNode,
  ActOneEdge,
  TimelineLayerData,
  TimelineBlockData,
  BeatEdgeData,
} from '@actone/shared';
import { SCENE_TYPE_COLORS } from '@actone/shared';
import { findTimelines, findScenes } from '$lib/ast/ast-utils.js';
import { stableId, stableEdgeId, stableGroupId } from '../operations/stable-refs.js';

export interface TimelineResult {
  nodes: ActOneNode<TimelineLayerData | TimelineBlockData>[];
  edges: ActOneEdge<BeatEdgeData>[];
}

export function transformTimeline(story: SerializedStory): TimelineResult {
  const timelines = findTimelines(story);
  const scenes = findScenes(story);
  const nodes: ActOneNode<TimelineLayerData | TimelineBlockData>[] = [];
  const edges: ActOneEdge<BeatEdgeData>[] = [];

  // Build a lookup of scene → layer assignment
  const sceneLayerMap = new Map<string, string>();
  for (const scene of scenes) {
    if (scene.layer) {
      sceneLayerMap.set(scene.name, scene.layer);
    }
  }

  // Lane colors for visual distinction
  const LANE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

  // Create swim-lanes for each timeline's layers
  let laneY = 0;
  let laneColorIdx = 0;
  const LANE_HEIGHT = 120;
  const BLOCK_WIDTH = 160;
  const BLOCK_SPACING = 20;

  for (const timeline of timelines) {
    for (let layerIdx = 0; layerIdx < timeline.layers.length; layerIdx++) {
      const layer = timeline.layers[layerIdx]!;
      const laneId = stableGroupId('layer', layer.name);

      // Layer swim-lane container
      const laneColor = LANE_COLORS[laneColorIdx % LANE_COLORS.length]!;
      laneColorIdx++;
      nodes.push({
        id: laneId,
        type: 'timeline-layer',
        position: { x: 0, y: laneY },
        data: {
          label: layer.name,
          name: layer.name,
          description: layer.description,
          period: layer.period,
          color: laneColor,
        } as TimelineLayerData,
      });

      // Place scene blocks assigned to this layer
      const layerScenes = scenes.filter((s) => sceneLayerMap.get(s.name) === layer.name);
      for (let i = 0; i < layerScenes.length; i++) {
        const scene = layerScenes[i]!;
        const color = SCENE_TYPE_COLORS[scene.sceneType as keyof typeof SCENE_TYPE_COLORS] ?? '#6366f1';

        nodes.push({
          id: stableId('scene', scene.name),
          type: 'timeline-block',
          position: { x: i * (BLOCK_WIDTH + BLOCK_SPACING) + 20, y: 30 },
          parentId: laneId,
          data: {
            label: scene.name,
            sceneName: scene.name,
            sceneType: scene.sceneType ?? 'exposition',
            estimatedWordCount: 0,
            layerName: layer.name,
            color,
          } as TimelineBlockData,
        });
      }

      laneY += LANE_HEIGHT;
    }
  }

  // Scenes not assigned to any layer go in a default lane
  const unassignedScenes = scenes.filter((s) => !sceneLayerMap.has(s.name));
  if (unassignedScenes.length > 0) {
    const defaultLaneId = stableGroupId('layer', '__default__');
    nodes.push({
      id: defaultLaneId,
      type: 'timeline-layer',
      position: { x: 0, y: laneY },
      data: {
        label: 'Unassigned',
        name: '__default__',
        color: '#71717a',
      } as TimelineLayerData,
    });

    for (let i = 0; i < unassignedScenes.length; i++) {
      const scene = unassignedScenes[i]!;
      const color = SCENE_TYPE_COLORS[scene.sceneType as keyof typeof SCENE_TYPE_COLORS] ?? '#6366f1';

      nodes.push({
        id: stableId('scene', scene.name),
        type: 'timeline-block',
        position: { x: i * (BLOCK_WIDTH + BLOCK_SPACING) + 20, y: 30 },
        parentId: defaultLaneId,
        data: {
          label: scene.name,
          sceneName: scene.name,
          sceneType: scene.sceneType ?? 'exposition',
          estimatedWordCount: 0,
          layerName: '__default__',
          color,
        } as TimelineBlockData,
      });
    }
  }

  // Sequential edges between scenes in same layer
  for (const timeline of timelines) {
    for (const layer of timeline.layers) {
      const layerScenes = scenes.filter((s) => sceneLayerMap.get(s.name) === layer.name);
      for (let i = 0; i < layerScenes.length - 1; i++) {
        const source = layerScenes[i]!;
        const target = layerScenes[i + 1]!;
        edges.push({
          id: stableEdgeId('scene', source.name, 'scene', target.name),
          source: stableId('scene', source.name),
          target: stableId('scene', target.name),
          type: 'beat',
          data: {
            label: '→',
            beatType: 'transition',
            color: '#71717a',
          } as BeatEdgeData,
        });
      }
    }
  }

  return { nodes, edges };
}
