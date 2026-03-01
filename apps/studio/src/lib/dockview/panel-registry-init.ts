/**
 * Panel registry initialization: imports all panel components
 * and registers them with the panel registry.
 *
 * Import this module (side-effect) before creating the dockview instance
 * to ensure all panel types are available.
 */
import { registerPanel } from './panel-registry.js';

import EditorPanel from '$lib/panels/EditorPanel.svelte';
import DiagnosticsPanel from '$lib/panels/DiagnosticsPanel.svelte';
import OutlinePanel from '$lib/panels/OutlinePanel.svelte';
import DiagramPanel from '$lib/panels/DiagramPanel.svelte';
import StoryBiblePanel from '$lib/panels/StoryBiblePanel.svelte';
import GalleryPanel from '$lib/panels/GalleryPanel.svelte';
import ReadingModePanel from '$lib/panels/ReadingModePanel.svelte';
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
  id: 'diagnostics',
  title: 'Problems',
  component: DiagnosticsPanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
});

registerPanel({
  id: 'outline',
  title: 'Outline',
  component: OutlinePanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
});

/* ── Diagram panels (all use DiagramPanel with diagramType param) ── */

registerPanel({
  id: 'diagram-story-structure',
  title: 'Story Structure',
  component: DiagramPanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
  defaultParams: { diagramType: 'story-structure' },
});

registerPanel({
  id: 'diagram-character-network',
  title: 'Character Network',
  component: DiagramPanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
  defaultParams: { diagramType: 'character-network' },
});

registerPanel({
  id: 'diagram-world-map',
  title: 'World Map',
  component: DiagramPanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
  defaultParams: { diagramType: 'world-map' },
});

registerPanel({
  id: 'diagram-timeline',
  title: 'Timeline',
  component: DiagramPanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
  defaultParams: { diagramType: 'timeline' },
});

registerPanel({
  id: 'diagram-interaction',
  title: 'Interaction',
  component: DiagramPanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
  defaultParams: { diagramType: 'interaction-sequence' },
});

/* ── Content panels ─────────────────────────────────────── */

registerPanel({
  id: 'story-bible',
  title: 'Story Bible',
  component: StoryBiblePanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
});

registerPanel({
  id: 'gallery',
  title: 'Gallery',
  component: GalleryPanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
});

registerPanel({
  id: 'reading-mode',
  title: 'Reading Mode',
  component: ReadingModePanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
});

registerPanel({
  id: 'spread-preview',
  title: 'Spread Preview',
  component: SpreadPreviewPanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
});

registerPanel({
  id: 'statistics',
  title: 'Statistics',
  component: StatisticsPanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
});

registerPanel({
  id: 'export',
  title: 'Export',
  component: ExportPanel,
  renderer: 'onlyWhenVisible',
  singleton: true,
});
