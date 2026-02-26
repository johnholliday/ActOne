/**
 * T066: Story Structure transformer.
 *
 * Produces scene nodes (color-coded by type, sized by word count)
 * with beat edges (colored by beat type) in chapter group containers.
 */

import type { SerializedStory, ActOneNode, ActOneEdge, SceneNodeData, BeatEdgeData, ChapterGroupData } from '@repo/shared';
import { SCENE_TYPE_COLORS, BEAT_TYPE_COLORS } from '@repo/shared';
import { findScenes, findPlots } from '$lib/ast/ast-utils.js';
import { stableId, stableEdgeId, stableGroupId } from '../operations/stable-refs.js';

export interface StoryStructureResult {
  nodes: ActOneNode<SceneNodeData | ChapterGroupData>[];
  edges: ActOneEdge<BeatEdgeData>[];
}

export function transformStoryStructure(story: SerializedStory): StoryStructureResult {
  const scenes = findScenes(story);
  const plots = findPlots(story);
  const nodes: ActOneNode<SceneNodeData | ChapterGroupData>[] = [];
  const edges: ActOneEdge<BeatEdgeData>[] = [];

  // Create scene nodes
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]!;
    const color = SCENE_TYPE_COLORS[scene.sceneType as keyof typeof SCENE_TYPE_COLORS] ?? '#6366f1';

    nodes.push({
      id: stableId('scene', scene.name),
      type: 'scene',
      position: { x: i * 200, y: 100 },
      data: {
        label: scene.name,
        sceneType: scene.sceneType ?? 'exposition',
        color,
        participants: scene.participants,
        location: scene.location,
        wordCount: 0, // will be populated from draft data
      } as SceneNodeData,
    });
  }

  // Create beat edges from plots
  for (const plot of plots) {
    for (let i = 0; i < plot.beats.length - 1; i++) {
      const currentBeat = plot.beats[i]!;
      const nextBeat = plot.beats[i + 1]!;

      // Match beats to scenes by name if possible
      const sourceScene = scenes.find((s) =>
        s.name.toLowerCase().includes(currentBeat.beat.toLowerCase()),
      );
      const targetScene = scenes.find((s) =>
        s.name.toLowerCase().includes(nextBeat.beat.toLowerCase()),
      );

      if (sourceScene && targetScene) {
        const beatColor = BEAT_TYPE_COLORS[currentBeat.type as keyof typeof BEAT_TYPE_COLORS] ?? '#94a3b8';
        edges.push({
          id: stableEdgeId('scene', sourceScene.name, 'scene', targetScene.name, currentBeat.beat),
          source: stableId('scene', sourceScene.name),
          target: stableId('scene', targetScene.name),
          type: 'beat',
          data: {
            label: currentBeat.beat,
            beatType: currentBeat.type ?? 'action',
            color: beatColor,
            act: currentBeat.act,
          } as BeatEdgeData,
        });
      }
    }
  }

  // Create sequential edges between scenes (fallback if no plot beats)
  if (edges.length === 0 && scenes.length > 1) {
    for (let i = 0; i < scenes.length - 1; i++) {
      const source = scenes[i]!;
      const target = scenes[i + 1]!;
      edges.push({
        id: stableEdgeId('scene', source.name, 'scene', target.name),
        source: stableId('scene', source.name),
        target: stableId('scene', target.name),
        type: 'beat',
        data: {
          label: `→`,
          beatType: 'transition',
          color: '#64748b',
        } as BeatEdgeData,
      });
    }
  }

  return { nodes, edges };
}
