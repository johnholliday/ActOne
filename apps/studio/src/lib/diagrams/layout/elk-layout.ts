/**
 * T064: ELK.js layout wrapper with algorithm configuration per view type.
 */

import ELK from 'elkjs/lib/elk.bundled.js';
import type { DiagramView } from '$lib/stores/ui.svelte.js';

const elk = new ELK();

export interface LayoutNode {
  id: string;
  width: number;
  height: number;
  parentId?: string;
}

export interface LayoutEdge {
  id: string;
  sources: string[];
  targets: string[];
}

export interface LayoutResult {
  nodes: Map<string, { x: number; y: number }>;
}

/** ELK algorithm configuration per diagram view. */
function getLayoutOptions(view: DiagramView): Record<string, string> {
  switch (view) {
    case 'story-structure':
      return {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.spacing.nodeNode': '40',
        'elk.layered.spacing.nodeNodeBetweenLayers': '80',
        'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      };
    case 'character-network':
      return {
        'elk.algorithm': 'stress',
        'elk.spacing.nodeNode': '80',
        'elk.stress.desiredEdgeLength': '150',
      };
    case 'world-map':
      return {
        'elk.algorithm': 'layered',
        'elk.direction': 'DOWN',
        'elk.spacing.nodeNode': '30',
        'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
        'elk.layered.spacing.nodeNodeBetweenLayers': '60',
      };
    case 'timeline':
      return {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.spacing.nodeNode': '20',
        'elk.layered.spacing.nodeNodeBetweenLayers': '40',
      };
    case 'interaction-sequence':
      return {
        'elk.algorithm': 'layered',
        'elk.direction': 'DOWN',
        'elk.spacing.nodeNode': '60',
        'elk.layered.spacing.nodeNodeBetweenLayers': '40',
      };
  }
}

/**
 * Compute layout positions for the given nodes and edges.
 */
export async function computeLayout(
  view: DiagramView,
  nodes: LayoutNode[],
  edges: LayoutEdge[],
): Promise<LayoutResult> {
  const elkGraph = {
    id: 'root',
    layoutOptions: getLayoutOptions(view),
    children: buildElkChildren(nodes),
    edges: edges.map((e) => ({
      id: e.id,
      sources: e.sources,
      targets: e.targets,
    })),
  };

  const layoutedGraph = await elk.layout(elkGraph);
  const result = new Map<string, { x: number; y: number }>();

  function extractPositions(
    children: typeof layoutedGraph.children,
  ) {
    if (!children) return;
    for (const child of children) {
      result.set(child.id, { x: child.x ?? 0, y: child.y ?? 0 });
      if (child.children) {
        extractPositions(child.children);
      }
    }
  }

  extractPositions(layoutedGraph.children);
  return { nodes: result };
}

/** Build ELK children array with hierarchy support. */
function buildElkChildren(nodes: LayoutNode[]) {
  const childMap = new Map<string | undefined, LayoutNode[]>();

  for (const node of nodes) {
    const parentKey = node.parentId ?? undefined;
    const siblings = childMap.get(parentKey) ?? [];
    siblings.push(node);
    childMap.set(parentKey, siblings);
  }

  function buildLevel(parentId: string | undefined): Array<{
    id: string;
    width: number;
    height: number;
    children?: Array<{ id: string; width: number; height: number }>;
  }> {
    const children = childMap.get(parentId) ?? [];
    return children.map((node) => {
      const nested = childMap.get(node.id);
      return {
        id: node.id,
        width: node.width,
        height: node.height,
        ...(nested ? { children: buildLevel(node.id) } : {}),
      };
    });
  }

  return buildLevel(undefined);
}
