/**
 * Parent node auto-expansion logic for SvelteFlow.
 *
 * Calculates expanded parent dimensions from children positions/sizes,
 * and adjusts child positions when the parent origin shifts.
 *
 * Based on: https://codesandbox.io/p/sandbox/boring-poitras-x5z223
 * See also: https://github.com/xyflow/xyflow/issues/5016
 */

import type { Node } from '@xyflow/svelte';

interface Dimensions {
  width: number;
  height: number;
}

interface XYPosition {
  x: number;
  y: number;
}

interface Expansion {
  dimension: Dimensions;
  offset: XYPosition;
  position: XYPosition;
  changed: boolean;
}

interface Bounds {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

function resolveExpansion(parent: Node, childBounds: Bounds): Expansion {
  const { x1, y1, x2, y2 } = childBounds;
  const { width = 0, height = 0 } = parent.measured ?? {};
  const { x, y } = parent.position;

  const dimension = { width: x2 - x1, height: y2 - y1 };
  const offset = { x: x1, y: y1 };
  const position = { x: x + x1, y: y + y1 };

  const changed =
    dimension.width !== width ||
    dimension.height !== height ||
    offset.x !== 0 ||
    offset.y !== 0;

  return { dimension, offset, position, changed };
}

/**
 * Calculate expanded parent dimensions from children and return
 * new node array with adjusted parents and child positions.
 */
export function expandGroupNodes(
  nodes: Node[],
  padding = 25,
  paddingTop = 25,
): Node[] {
  const childMap = new Map<string, Node[]>();
  const parents = new Map<string, Node>();

  // Reverse iteration: build childMap first, then identify parents
  for (const node of [...nodes].reverse()) {
    if (node.parentId) {
      let childNodes = childMap.get(node.parentId);
      if (!childNodes) {
        childNodes = [];
        childMap.set(node.parentId, childNodes);
      }
      childNodes.push(node);
    }

    if (childMap.has(node.id)) {
      parents.set(node.id, node);
    }
  }

  // Calculate expansion for each parent
  const parentExpansions = new Map<string, Expansion>();

  for (const [parentId, childNodes] of childMap) {
    const parent = parents.get(parentId);
    if (!parent) continue;

    const childBounds = childNodes.reduce(
      (acc: Bounds, childNode: Node) => {
        const { width = 0, height = 0 } = childNode.measured ?? {};
        const { x, y } = childNode.position;

        const x1 = x - padding;
        const y1 = y - paddingTop;
        acc.x1 = x1 < acc.x1 ? x1 : acc.x1;
        acc.y1 = y1 < acc.y1 ? y1 : acc.y1;

        const x2 = x + width + padding;
        const y2 = y + height + padding;
        acc.x2 = x2 > acc.x2 ? x2 : acc.x2;
        acc.y2 = y2 > acc.y2 ? y2 : acc.y2;

        return acc;
      },
      { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity },
    );

    // For single-child containers, anchor to the origin so the lane
    // can't collapse past its top-left corner. Multi-child containers
    // naturally anchor via the spread of children.
    if (childNodes.length === 1) {
      childBounds.x1 = Math.min(childBounds.x1, 0);
      childBounds.y1 = Math.min(childBounds.y1, 0);
    }

    const expansion = resolveExpansion(parent, childBounds);
    if (expansion.changed) {
      parentExpansions.set(parentId, expansion);
    }
  }

  return nodes.map((node) => {
    const expansion = parentExpansions.get(node.id);
    const parentExpansion = parentExpansions.get(node.parentId ?? '');

    // Node is both parent and child — apply both expansions
    if (expansion && parentExpansion) {
      return {
        ...node,
        ...expansion.dimension,
        style: `width: ${expansion.dimension.width}px; height: ${expansion.dimension.height}px;`,
        position: {
          x: expansion.position.x - parentExpansion.offset.x,
          y: expansion.position.y - parentExpansion.offset.y,
        },
      };
    }

    // Node is a parent — apply expansion
    if (expansion) {
      return {
        ...node,
        ...expansion.dimension,
        style: `width: ${expansion.dimension.width}px; height: ${expansion.dimension.height}px;`,
        position: expansion.position,
      };
    }

    // Node is a child of an expanding parent — adjust position
    if (parentExpansion) {
      return {
        ...node,
        position: {
          x: node.position.x - parentExpansion.offset.x,
          y: node.position.y - parentExpansion.offset.y,
        },
      };
    }

    return node;
  });
}
