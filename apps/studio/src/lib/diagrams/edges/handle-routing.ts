/**
 * Dynamic handle selection based on relative node positions.
 * Picks the closest pair of sides (top/bottom/left/right) for each edge.
 */

interface NodeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type HandleSide = 'top' | 'bottom' | 'left' | 'right';

export interface HandlePair {
  sourceHandle: HandleSide;
  targetHandle: HandleSide;
}

/**
 * Given two node rectangles, determine which sides the edge
 * should connect from/to based on the relative positions of the nodes.
 */
export function getBestHandles(source: NodeRect, target: NodeRect): HandlePair {
  const sCx = source.x + source.width / 2;
  const sCy = source.y + source.height / 2;
  const tCx = target.x + target.width / 2;
  const tCy = target.y + target.height / 2;

  const dx = tCx - sCx;
  const dy = tCy - sCy;

  // Use the dominant axis to decide handle sides
  if (Math.abs(dy) >= Math.abs(dx)) {
    // Vertical dominant
    if (dy > 0) {
      // Target is below source
      return { sourceHandle: 'bottom', targetHandle: 'top' };
    } else {
      // Target is above source
      return { sourceHandle: 'top', targetHandle: 'bottom' };
    }
  } else {
    // Horizontal dominant
    if (dx > 0) {
      // Target is to the right
      return { sourceHandle: 'right', targetHandle: 'left' };
    } else {
      // Target is to the left
      return { sourceHandle: 'left', targetHandle: 'right' };
    }
  }
}

/**
 * Assign sourceHandle/targetHandle to all edges based on current node positions.
 */
export function assignHandles(
  nodes: Array<{ id: string; position: { x: number; y: number }; width?: number; height?: number }>,
  edges: Array<{ id: string; source: string; target: string; [key: string]: unknown }>,
  defaultSize: { width: number; height: number },
): Array<typeof edges[number] & { sourceHandle: HandleSide; targetHandle: HandleSide }> {
  const nodeMap = new Map<string, NodeRect>();
  for (const n of nodes) {
    nodeMap.set(n.id, {
      x: n.position.x,
      y: n.position.y,
      width: n.width ?? defaultSize.width,
      height: n.height ?? defaultSize.height,
    });
  }

  return edges.map((edge) => {
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (src && tgt) {
      const handles = getBestHandles(src, tgt);
      return {
        ...edge,
        sourceHandle: `${handles.sourceHandle}-src`,
        targetHandle: `${handles.targetHandle}-tgt`,
      };
    }
    return { ...edge, sourceHandle: 'bottom-src', targetHandle: 'top-tgt' };
  });
}
