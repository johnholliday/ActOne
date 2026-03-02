/**
 * Default panel arrangement for the dockview layout.
 *
 * Creates the initial layout: Editor (~80% height) with
 * Problems + Output (~192px) docked below as tabs. The Outline
 * panel is rendered inside EditorPanel as a sub-component.
 */
import type { DockviewApi } from 'dockview-core';
import { getPanelDefinition } from './panel-registry.js';

export function applyDefaultLayout(api: DockviewApi): void {
  // Clear any existing panels first
  api.clear();

  const editorDef = getPanelDefinition('editor');
  const problemsDef = getPanelDefinition('problems');
  const outputDef = getPanelDefinition('output');

  // Add editor panel (primary, takes ~80% height)
  const editorPanel = api.addPanel({
    id: 'editor',
    component: 'editor',
    title: editorDef?.title ?? 'Editor',
    renderer: 'always',
  });

  // Hide dockview's tab header for the editor group — EditorPanel provides its own tab bar
  editorPanel.group.model.header.hidden = true;

  // Add problems panel below the editor (~192px)
  const problemsPanel = api.addPanel({
    id: 'problems',
    component: 'problems',
    title: problemsDef?.title ?? 'Problems',
    renderer: 'onlyWhenVisible',
    position: {
      direction: 'below',
      referencePanel: editorPanel,
    },
    initialHeight: 192,
  });

  // Add output panel tabbed within the same group as problems
  api.addPanel({
    id: 'output',
    component: 'output',
    title: outputDef?.title ?? 'Output',
    renderer: 'onlyWhenVisible',
    position: {
      direction: 'within',
      referencePanel: problemsPanel,
    },
  });
}
