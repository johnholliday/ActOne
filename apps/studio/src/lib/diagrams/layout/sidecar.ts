/**
 * T065: Layout override persistence (sidecar).
 *
 * Stores manual position overrides separately from computed layout.
 * Overrides are keyed by stable node ID and persisted per project/view.
 */

export interface PositionOverride {
  x: number;
  y: number;
}

export interface SidecarData {
  version: number;
  overrides: Record<string, PositionOverride>;
}

const STORAGE_PREFIX = 'actone-layout-';

/**
 * Load sidecar data from localStorage.
 */
export function loadSidecar(
  projectId: string,
  viewId: string,
): SidecarData {
  const key = `${STORAGE_PREFIX}${projectId}-${viewId}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { version: 1, overrides: {} };
    const parsed = JSON.parse(raw) as SidecarData;
    return parsed;
  } catch {
    return { version: 1, overrides: {} };
  }
}

/**
 * Save sidecar data to localStorage.
 */
export function saveSidecar(
  projectId: string,
  viewId: string,
  data: SidecarData,
): void {
  const key = `${STORAGE_PREFIX}${projectId}-${viewId}`;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

/**
 * Set a position override for a node.
 */
export function setOverride(
  sidecar: SidecarData,
  nodeId: string,
  position: PositionOverride,
): SidecarData {
  return {
    ...sidecar,
    overrides: { ...sidecar.overrides, [nodeId]: position },
  };
}

/**
 * Remove a position override for a node.
 */
export function removeOverride(
  sidecar: SidecarData,
  nodeId: string,
): SidecarData {
  const { [nodeId]: _, ...rest } = sidecar.overrides;
  return { ...sidecar, overrides: rest };
}

/**
 * Apply overrides to computed positions.
 * Returns a new map with overrides merged on top.
 */
export function applyOverrides(
  computed: Map<string, { x: number; y: number }>,
  sidecar: SidecarData,
): Map<string, { x: number; y: number }> {
  const result = new Map(computed);
  for (const [id, override] of Object.entries(sidecar.overrides)) {
    result.set(id, override);
  }
  return result;
}

/**
 * Clear all overrides for a project/view.
 */
export function clearSidecar(projectId: string, viewId: string): void {
  const key = `${STORAGE_PREFIX}${projectId}-${viewId}`;
  localStorage.removeItem(key);
}
