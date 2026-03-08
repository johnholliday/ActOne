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

export interface EdgeRoute {
  points: { x: number; y: number }[];
}

export interface LayoutResult {
  nodes: Map<string, { x: number; y: number; width?: number; height?: number }>;
  edges: Map<string, EdgeRoute>;
}

/** ELK algorithm configuration per diagram view. */
function getLayoutOptions(view: DiagramView): Record<string, string> {
  switch (view) {
    case 'story-structure':
      return {
        'elk.algorithm': 'layered',
        'elk.direction': 'DOWN',
        'elk.spacing.nodeNode': '40',
        'elk.layered.spacing.nodeNodeBetweenLayers': '60',
        'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
        'elk.layered.edgeRouting': 'ORTHOGONAL',
        'elk.layered.spacing.edgeNodeBetweenLayers': '20',
        'elk.layered.spacing.edgeEdgeBetweenLayers': '15',
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
        'elk.layered.edgeRouting': 'ORTHOGONAL',
        'elk.layered.spacing.edgeNodeBetweenLayers': '15',
        'elk.layered.spacing.edgeEdgeBetweenLayers': '10',
      };
    case 'timeline':
      return {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.spacing.nodeNode': '20',
        'elk.layered.spacing.nodeNodeBetweenLayers': '40',
        'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
        'elk.layered.edgeRouting': 'ORTHOGONAL',
        'elk.layered.spacing.edgeNodeBetweenLayers': '10',
        'elk.layered.spacing.edgeEdgeBetweenLayers': '10',
      };
    case 'interaction-sequence':
      // Manual layout — this case shouldn't be reached but satisfies exhaustiveness
      return {};
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

/** Views that use manual positioning instead of ELK. */
const MANUAL_LAYOUT_VIEWS = new Set<DiagramView>(['interaction-sequence']);

/**
 * Compute layout positions for the given nodes and edges.
 * Returns empty maps for views that use manual positioning.
 */
export async function computeLayout(
  view: DiagramView,
  nodes: LayoutNode[],
  edges: LayoutEdge[],
): Promise<LayoutResult> {
  if (MANUAL_LAYOUT_VIEWS.has(view)) {
    return { nodes: new Map(), edges: new Map() };
  }

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
  const nodeResult = new Map<string, { x: number; y: number; width?: number; height?: number }>();
  const edgeResult = new Map<string, EdgeRoute>();

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
      nodeResult.set(child.id, entry);
      if (child.children) {
        extractPositions(child.children);
      }
    }
  }

  function extractEdgeRoutes(graph: typeof layoutedGraph) {
    if (graph.edges) {
      for (const edge of graph.edges) {
        if (edge.sections && edge.sections.length > 0) {
          const points: { x: number; y: number }[] = [];
          for (const section of edge.sections) {
            points.push({ x: section.startPoint.x, y: section.startPoint.y });
            if (section.bendPoints) {
              for (const bp of section.bendPoints) {
                points.push({ x: bp.x, y: bp.y });
              }
            }
            points.push({ x: section.endPoint.x, y: section.endPoint.y });
          }
          edgeResult.set(edge.id, { points });
        }
      }
    }
    if (graph.children) {
      for (const child of graph.children) {
        extractEdgeRoutes(child as typeof layoutedGraph);
      }
    }
  }

  extractPositions(layoutedGraph.children);
  extractEdgeRoutes(layoutedGraph);
  return { nodes: nodeResult, edges: edgeResult };
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
