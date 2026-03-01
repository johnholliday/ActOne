/**
 * Panel open/focus helper functions.
 *
 * Provides openPanel() which checks if a panel already exists
 * and focuses it, or creates a new one.
 */
import type { DockviewApi } from 'dockview-core';
import { getPanelDefinition } from './panel-registry.js';

/** Module-level reference to the dockview API. Set by DockLayout onReady. */
let dockApi: DockviewApi | null = null;

export function setDockApi(api: DockviewApi | null): void {
  dockApi = api;
}

export function getDockApi(): DockviewApi | null {
  return dockApi;
}

/**
 * Toggle a panel by its registry ID.
 * If the panel exists, remove it. Otherwise, create it.
 */
export function togglePanel(panelId: string, params?: Record<string, unknown>): void {
  if (!dockApi) {
    console.warn('[ActOne] Cannot toggle panel: dockview API not initialized');
    return;
  }

  const existing = dockApi.getPanel(panelId);
  if (existing) {
    dockApi.removePanel(existing);
    return;
  }

  // Panel doesn't exist — create it
  const def = getPanelDefinition(panelId);
  if (!def) {
    console.warn(`[ActOne] Unknown panel type: ${panelId}`);
    return;
  }

  dockApi.addPanel({
    id: panelId,
    component: panelId,
    title: def.title,
    renderer: def.renderer,
    params: { ...def.defaultParams, ...params },
  });
}

/**
 * Open a panel by its registry ID.
 * If the panel already exists, focus it. Otherwise, create it.
 */
export function openPanel(panelId: string, params?: Record<string, unknown>): void {
  if (!dockApi) {
    console.warn('[ActOne] Cannot open panel: dockview API not initialized');
    return;
  }

  // Check if panel already exists
  const existing = dockApi.getPanel(panelId);
  if (existing) {
    existing.api.setActive();
    return;
  }

  // Look up the panel definition
  const def = getPanelDefinition(panelId);
  if (!def) {
    console.warn(`[ActOne] Unknown panel type: ${panelId}`);
    return;
  }

  // Create the panel (merge default params from registry with any overrides)
  dockApi.addPanel({
    id: panelId,
    component: panelId,
    title: def.title,
    renderer: def.renderer,
    params: { ...def.defaultParams, ...params },
  });
}
