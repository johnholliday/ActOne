/**
 * T058: Project tree data extraction.
 *
 * Builds a navigator tree from the serialized AST, organized by element type.
 */

import type {
  SerializedStory,
  SerializedStoryElement,
  SerializedCharacterDef,
  SerializedWorldDef,
  SerializedThemeDef,
  SerializedTimelineDef,
  SerializedSceneDef,
  SerializedPlotDef,
  SerializedInteractionDef,
  SerializedGenerateBlock,
} from '@actone/shared';

export interface TreeNode {
  id: string;
  label: string;
  type: string;
  icon: string;
  children?: TreeNode[];
  /** Source location for click-to-navigate */
  sourceUri?: string;
  sourceLine?: number;
}

/**
 * Build the project navigator tree from a serialized AST.
 */
export function buildProjectTree(
  story: SerializedStory,
  sourceUri?: string,
): TreeNode[] {
  const groups = {
    characters: [] as TreeNode[],
    worlds: [] as TreeNode[],
    themes: [] as TreeNode[],
    timelines: [] as TreeNode[],
    scenes: [] as TreeNode[],
    plots: [] as TreeNode[],
    interactions: [] as TreeNode[],
    settings: [] as TreeNode[],
  };

  for (const element of story.elements) {
    const node = elementToTreeNode(element, sourceUri);
    if (!node) continue;

    switch (element.$type) {
      case 'CharacterDef':
        groups.characters.push(node);
        break;
      case 'WorldDef':
        groups.worlds.push(node);
        break;
      case 'ThemeDef':
        groups.themes.push(node);
        break;
      case 'TimelineDef':
        groups.timelines.push(node);
        break;
      case 'SceneDef':
        groups.scenes.push(node);
        break;
      case 'PlotDef':
        groups.plots.push(node);
        break;
      case 'InteractionDef':
        groups.interactions.push(node);
        break;
      case 'GenerateBlock':
        groups.settings.push(node);
        break;
    }
  }

  const tree: TreeNode[] = [];

  if (groups.characters.length > 0) {
    tree.push({
      id: 'group-characters',
      label: `Characters (${groups.characters.length})`,
      type: 'group',
      icon: 'users',
      children: groups.characters,
    });
  }

  if (groups.worlds.length > 0) {
    tree.push({
      id: 'group-worlds',
      label: `Worlds (${groups.worlds.length})`,
      type: 'group',
      icon: 'globe',
      children: groups.worlds,
    });
  }

  if (groups.themes.length > 0) {
    tree.push({
      id: 'group-themes',
      label: `Themes (${groups.themes.length})`,
      type: 'group',
      icon: 'sparkles',
      children: groups.themes,
    });
  }

  if (groups.timelines.length > 0) {
    tree.push({
      id: 'group-timelines',
      label: `Timelines (${groups.timelines.length})`,
      type: 'group',
      icon: 'clock',
      children: groups.timelines,
    });
  }

  if (groups.scenes.length > 0) {
    tree.push({
      id: 'group-scenes',
      label: `Scenes (${groups.scenes.length})`,
      type: 'group',
      icon: 'film',
      children: groups.scenes,
    });
  }

  if (groups.plots.length > 0) {
    tree.push({
      id: 'group-plots',
      label: `Plots (${groups.plots.length})`,
      type: 'group',
      icon: 'route',
      children: groups.plots,
    });
  }

  if (groups.interactions.length > 0) {
    tree.push({
      id: 'group-interactions',
      label: `Interactions (${groups.interactions.length})`,
      type: 'group',
      icon: 'messages',
      children: groups.interactions,
    });
  }

  if (groups.settings.length > 0) {
    tree.push({
      id: 'group-settings',
      label: 'Generation Settings',
      type: 'group',
      icon: 'settings',
      children: groups.settings,
    });
  }

  return tree;
}

function elementToTreeNode(
  element: SerializedStoryElement,
  sourceUri?: string,
): TreeNode | null {
  switch (element.$type) {
    case 'CharacterDef':
      return characterNode(element, sourceUri);
    case 'WorldDef':
      return worldNode(element, sourceUri);
    case 'ThemeDef':
      return themeNode(element, sourceUri);
    case 'TimelineDef':
      return timelineNode(element, sourceUri);
    case 'SceneDef':
      return sceneNode(element, sourceUri);
    case 'PlotDef':
      return plotNode(element, sourceUri);
    case 'InteractionDef':
      return interactionNode(element, sourceUri);
    case 'GenerateBlock':
      return generateNode(element);
    default:
      return null;
  }
}

function characterNode(c: SerializedCharacterDef, sourceUri?: string): TreeNode {
  const children: TreeNode[] = [];
  if (c.relationships.length > 0) {
    children.push({
      id: `char-${c.name}-rels`,
      label: `Relationships (${c.relationships.length})`,
      type: 'detail',
      icon: 'link',
    });
  }
  if (c.goals.length > 0) {
    children.push({
      id: `char-${c.name}-goals`,
      label: `Goals (${c.goals.length})`,
      type: 'detail',
      icon: 'target',
    });
  }
  return {
    id: `char-${c.name}`,
    label: c.name,
    type: 'character',
    icon: c.nature ?? 'person',
    children: children.length > 0 ? children : undefined,
    sourceUri,
  };
}

function worldNode(w: SerializedWorldDef, sourceUri?: string): TreeNode {
  return {
    id: `world-${w.name}`,
    label: w.name,
    type: 'world',
    icon: 'globe',
    children: w.locations.map((loc) => ({
      id: `loc-${w.name}-${loc.name}`,
      label: loc.name,
      type: 'location',
      icon: 'map-pin',
      sourceUri,
    })),
    sourceUri,
  };
}

function themeNode(t: SerializedThemeDef, sourceUri?: string): TreeNode {
  return {
    id: `theme-${t.name}`,
    label: t.name,
    type: 'theme',
    icon: 'sparkles',
    sourceUri,
  };
}

function timelineNode(t: SerializedTimelineDef, sourceUri?: string): TreeNode {
  return {
    id: `timeline-${t.name}`,
    label: t.name,
    type: 'timeline',
    icon: 'clock',
    children: t.layers.map((layer) => ({
      id: `layer-${t.name}-${layer.name}`,
      label: layer.name,
      type: 'layer',
      icon: 'layers',
      sourceUri,
    })),
    sourceUri,
  };
}

function sceneNode(s: SerializedSceneDef, sourceUri?: string): TreeNode {
  return {
    id: `scene-${s.name}`,
    label: s.name,
    type: 'scene',
    icon: s.sceneType ?? 'film',
    sourceUri,
  };
}

function plotNode(p: SerializedPlotDef, sourceUri?: string): TreeNode {
  return {
    id: `plot-${p.name}`,
    label: p.name,
    type: 'plot',
    icon: 'route',
    children: p.subplots.map((sub) => ({
      id: `subplot-${p.name}-${sub.name}`,
      label: sub.name,
      type: 'subplot',
      icon: 'git-branch',
      sourceUri,
    })),
    sourceUri,
  };
}

function interactionNode(i: SerializedInteractionDef, sourceUri?: string): TreeNode {
  return {
    id: `interaction-${i.name}`,
    label: `${i.name} (${i.participants.join(', ')})`,
    type: 'interaction',
    icon: 'messages',
    sourceUri,
  };
}

function generateNode(g: SerializedGenerateBlock): TreeNode {
  const details: string[] = [];
  if (g.genre) details.push(g.genre);
  if (g.tense) details.push(g.tense);
  if (g.pacing) details.push(g.pacing);
  return {
    id: 'generate-block',
    label: details.length > 0 ? `Generate (${details.join(', ')})` : 'Generate',
    type: 'generate',
    icon: 'settings',
  };
}

/**
 * Merge trees from multiple files into a single navigator tree.
 */
export function mergeProjectTrees(
  trees: Array<{ uri: string; tree: TreeNode[] }>,
): TreeNode[] {
  const merged = new Map<string, TreeNode>();

  for (const { tree } of trees) {
    for (const group of tree) {
      const existing = merged.get(group.id);
      if (existing && existing.children && group.children) {
        existing.children = [...existing.children, ...group.children];
        // Update label with new count
        const count = existing.children.length;
        const baseLabel = existing.label.replace(/\(\d+\)/, '').trim();
        existing.label = `${baseLabel} (${count})`;
      } else {
        merged.set(group.id, { ...group });
      }
    }
  }

  return Array.from(merged.values());
}
