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
  nodes: Map<string, { x: number; y: number; width?: number; height?: number }>;
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
        'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
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

/** Layout options for container (parent) nodes so ELK adds padding and auto-expands. */
function getContainerLayoutOptions(view: DiagramView): Record<string, string> {
  switch (view) {
    case 'world-map':
      return {
        'elk.padding': '[top=40,left=20,bottom=20,right=20]',
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.spacing.nodeNode': '30',
        'elk.nodeSize.constraints': 'MINIMUM_SIZE',
      };
    case 'timeline':
      return {
        'elk.padding': '[top=12,left=12,bottom=12,right=12]',
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.spacing.nodeNode': '20',
        'elk.nodeSize.constraints': 'MINIMUM_SIZE',
      };
    default:
      return {
        'elk.padding': '[top=40,left=20,bottom=20,right=20]',
        'elk.nodeSize.constraints': 'MINIMUM_SIZE',
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
    children: buildElkChildren(nodes, view),
    edges: edges.map((e) => ({
      id: e.id,
      sources: e.sources,
      targets: e.targets,
    })),
  };

  const layoutedGraph = await elk.layout(elkGraph);
  const result = new Map<string, { x: number; y: number; width?: number; height?: number }>();

  function extractPositions(
    children: typeof layoutedGraph.children,
  ) {
    if (!children) return;
    for (const child of children) {
      const entry: { x: number; y: number; width?: number; height?: number } = {
        x: child.x ?? 0,
        y: child.y ?? 0,
      };
      if (child.children && child.children.length > 0) {
        entry.width = child.width;
        entry.height = child.height;
      }
      result.set(child.id, entry);
      if (child.children) {
        extractPositions(child.children);
      }
    }
  }

  extractPositions(layoutedGraph.children);
  return { nodes: result };
}

/** Build ELK children array with hierarchy support and container layout options. */
function buildElkChildren(nodes: LayoutNode[], view: DiagramView) {
  const childMap = new Map<string | undefined, LayoutNode[]>();

  for (const node of nodes) {
    const parentKey = node.parentId ?? undefined;
    const siblings = childMap.get(parentKey) ?? [];
    siblings.push(node);
    childMap.set(parentKey, siblings);
  }

  const containerOpts = getContainerLayoutOptions(view);

  interface ElkNode {
    id: string;
    width: number;
    height: number;
    layoutOptions?: Record<string, string>;
    children?: ElkNode[];
  }

  function buildLevel(parentId: string | undefined): ElkNode[] {
    const children = childMap.get(parentId) ?? [];
    return children.map((node) => {
      const nested = childMap.get(node.id);
      const elkNode: ElkNode = {
        id: node.id,
        width: node.width,
        height: node.height,
      };
      if (nested) {
        elkNode.layoutOptions = containerOpts;
        elkNode.children = buildLevel(node.id);
      }
      return elkNode;
    });
  }

  return buildLevel(undefined);
}
