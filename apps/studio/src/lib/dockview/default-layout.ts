/**
 * Default panel arrangement for the dockview layout.
 *
 * Creates the initial layout: Editor (~80% height) with
 * Diagnostics (~20% height) docked below.
 */
import type { DockviewApi } from 'dockview-core';
import { getPanelDefinition } from './panel-registry.js';

export function applyDefaultLayout(api: DockviewApi): void {
  // Clear any existing panels first
  api.clear();

  const editorDef = getPanelDefinition('editor');
  const diagnosticsDef = getPanelDefinition('diagnostics');

  // Add editor panel (primary, takes ~80% height)
  const editorPanel = api.addPanel({
    id: 'editor',
    component: 'editor',
    title: editorDef?.title ?? 'Editor',
    renderer: 'always',
  });

  // Add diagnostics panel below the editor (~20% height)
  api.addPanel({
    id: 'diagnostics',
    component: 'diagnostics',
    title: diagnosticsDef?.title ?? 'Problems',
    renderer: 'onlyWhenVisible',
    position: {
      direction: 'below',
      referencePanel: editorPanel,
    },
    initialHeight: 192,
  });
}
