/**
 * Panel registry initialization: imports all panel components
 * and registers them with the panel registry.
 *
 * Import this module (side-effect) before creating the dockview instance
 * to ensure all panel types are available.
 */
import { registerPanel } from './panel-registry.js';

import EditorPanel from '$lib/panels/EditorPanel.svelte';
import ProblemsPanel from '$lib/panels/ProblemsPanel.svelte';
import OutputPanel from '$lib/panels/OutputPanel.svelte';

import DiagramPanel from '$lib/panels/DiagramPanel.svelte';
import StoryBiblePanel from '$lib/panels/StoryBiblePanel.svelte';
import GalleryPanel from '$lib/panels/GalleryPanel.svelte';
import SpreadPreviewPanel from '$lib/panels/SpreadPreviewPanel.svelte';
import StatisticsPanel from '$lib/panels/StatisticsPanel.svelte';
import ExportPanel from '$lib/panels/ExportPanel.svelte';

/* ── Core panels ────────────────────────────────────────── */

registerPanel({
  id: 'editor',
  title: 'Editor',
  component: EditorPanel,
  renderer: 'always',
  singleton: true,
});

registerPanel({
  id: 'problems',
  title: 'Problems',
  component: ProblemsPanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
  defaultPosition: { direction: 'below', referencePanel: 'editor' },
  panelGroup: 'bottom',
});

registerPanel({
  id: 'output',
  title: 'Output',
  component: OutputPanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
  defaultPosition: { direction: 'below', referencePanel: 'editor' },
  panelGroup: 'bottom',
});

/* ── Diagram panels (all use DiagramPanel with diagramType param) ── */

registerPanel({
  id: 'diagram-story-structure',
  title: 'Story Structure',
  component: DiagramPanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
  defaultParams: { diagramType: 'story-structure' },
  defaultPosition: { direction: 'right', referencePanel: 'editor' },
  panelGroup: 'diagrams',
});

registerPanel({
  id: 'diagram-character-network',
  title: 'Character Network',
  component: DiagramPanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
  defaultParams: { diagramType: 'character-network' },
  defaultPosition: { direction: 'right', referencePanel: 'editor' },
  panelGroup: 'diagrams',
});

registerPanel({
  id: 'diagram-world-map',
  title: 'World Map',
  component: DiagramPanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
  defaultParams: { diagramType: 'world-map' },
  defaultPosition: { direction: 'right', referencePanel: 'editor' },
  panelGroup: 'diagrams',
});

registerPanel({
  id: 'diagram-timeline',
  title: 'Timeline',
  component: DiagramPanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
  defaultParams: { diagramType: 'timeline' },
  defaultPosition: { direction: 'right', referencePanel: 'editor' },
  panelGroup: 'diagrams',
});

registerPanel({
  id: 'diagram-interaction',
  title: 'Interaction',
  component: DiagramPanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
  defaultParams: { diagramType: 'interaction-sequence' },
  defaultPosition: { direction: 'right', referencePanel: 'editor' },
  panelGroup: 'diagrams',
});

/* ── Content panels ─────────────────────────────────────── */

registerPanel({
  id: 'story-bible',
  title: 'Story Bible',
  component: StoryBiblePanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
  defaultPosition: { direction: 'right', referencePanel: 'editor' },
});

registerPanel({
  id: 'gallery',
  title: 'Asset Gallery',
  component: GalleryPanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
  defaultPosition: { direction: 'right', referencePanel: 'editor' },
});

registerPanel({
  id: 'spread-preview',
  title: 'Spread Preview',
  component: SpreadPreviewPanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
  defaultPosition: { direction: 'right', referencePanel: 'editor' },
});

registerPanel({
  id: 'statistics',
  title: 'Statistics',
  component: StatisticsPanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
  defaultPosition: { direction: 'right', referencePanel: 'editor' },
});

registerPanel({
  id: 'export',
  title: 'Export',
  component: ExportPanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
  defaultPosition: { direction: 'right', referencePanel: 'editor' },
});

