/**
 * T063: Stable reference generation for diagram nodes.
 *
 * Content-addressable IDs in the format "type:name" ensure nodes
 * maintain identity across AST updates.
 */

export type ElementType =
  | 'character'
  | 'scene'
  | 'world'
  | 'location'
  | 'theme'
  | 'timeline'
  | 'layer'
  | 'plot'
  | 'subplot'
  | 'interaction'
  | 'beat'
  | 'chapter';

/** Generate a stable node ID from element type and name. */
export function stableId(type: ElementType, name: string): string {
  return `${type}:${name}`;
}

/** Parse a stable ID back to type and name. */
export function parseStableId(id: string): { type: ElementType; name: string } | null {
  const colonIndex = id.indexOf(':');
  if (colonIndex === -1) return null;
  return {
    type: id.substring(0, colonIndex) as ElementType,
    name: id.substring(colonIndex + 1),
  };
}

/** Generate a stable edge ID from source and target. */
export function stableEdgeId(
  sourceType: ElementType,
  sourceName: string,
  targetType: ElementType,
  targetName: string,
  label?: string,
): string {
  const base = `${sourceType}:${sourceName}->${targetType}:${targetName}`;
  return label ? `${base}[${label}]` : base;
}

/** Generate a group/container ID. */
export function stableGroupId(type: ElementType, name: string): string {
  return `group:${type}:${name}`;
}
