/**
 * T069: Timeline transformer.
 *
 * Produces horizontal swim-lanes per timeline layer
 * with scene blocks and arc phase bands.
 */

import type {
  SerializedStory,
  ActOneNode,
  ActOneEdge,
  TimelineLayerData,
  TimelineBlockData,
  ArcPhaseBandData,
  BeatEdgeData,
} from '@actone/shared';
import { SCENE_TYPE_COLORS, BEAT_TYPE_COLORS } from '@actone/shared';
import { findTimelines, findScenes, findPlots } from '$lib/ast/ast-utils.js';
import { stableId, stableEdgeId, stableGroupId } from '../operations/stable-refs.js';

export interface TimelineResult {
  nodes: ActOneNode<TimelineLayerData | TimelineBlockData | ArcPhaseBandData>[];
  edges: ActOneEdge<BeatEdgeData>[];
}

export function transformTimeline(story: SerializedStory): TimelineResult {
  const timelines = findTimelines(story);
  const scenes = findScenes(story);
  const plots = findPlots(story);
  const nodes: ActOneNode<TimelineLayerData | TimelineBlockData | ArcPhaseBandData>[] = [];
  const edges: ActOneEdge<BeatEdgeData>[] = [];

  // Build a lookup of scene → layer assignment
  const sceneLayerMap = new Map<string, string>();
  for (const scene of scenes) {
    if (scene.layer) {
      sceneLayerMap.set(scene.name, scene.layer);
    }
  }

  // Create swim-lanes for each timeline's layers
  let laneY = 0;
  const LANE_HEIGHT = 120;
  const BLOCK_WIDTH = 160;
  const BLOCK_SPACING = 20;

  for (const timeline of timelines) {
    for (let layerIdx = 0; layerIdx < timeline.layers.length; layerIdx++) {
      const layer = timeline.layers[layerIdx]!;
      const laneId = stableGroupId('layer', layer.name);

      // Layer swim-lane container
      nodes.push({
        id: laneId,
        type: 'timeline-layer',
        position: { x: 0, y: laneY },
        data: {
          label: layer.name,
          name: layer.name,
          description: layer.description,
          period: layer.period,
          color: '#252525',
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
        color: '#171717',
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

  // Create arc phase bands from plot beats
  if (plots.length > 0) {
    const totalScenes = scenes.length || 1;
    for (const plot of plots) {
      const beatsByAct = new Map<number, string[]>();
      for (const beat of plot.beats) {
        const act = beat.act ?? 1;
        const existing = beatsByAct.get(act) ?? [];
        existing.push(beat.type ?? 'action');
        beatsByAct.set(act, existing);
      }

      // Create a band per act
      for (const [act, beatTypes] of beatsByAct) {
        const dominantType = beatTypes[0] ?? 'action';
        const bandColor = BEAT_TYPE_COLORS[dominantType as keyof typeof BEAT_TYPE_COLORS] ?? '#71717a';
        const startRatio = (act - 1) / 3;
        const endRatio = act / 3;

        nodes.push({
          id: stableId('beat', `${plot.name}-act-${act}`),
          type: 'arc-phase-band',
          position: {
            x: startRatio * totalScenes * (BLOCK_WIDTH + BLOCK_SPACING),
            y: laneY + 20,
          },
          data: {
            label: `Act ${act}`,
            phase: `Act ${act}`,
            startRatio,
            endRatio,
            color: bandColor,
          } as ArcPhaseBandData,
        });
      }
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
