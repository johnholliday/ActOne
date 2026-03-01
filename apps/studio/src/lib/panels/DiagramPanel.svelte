<script lang="ts">
  /**
   * Diagram panel: Shared SvelteFlow canvas for all 5 diagram views.
   * Accepts diagramType via panelParams to select the appropriate
   * node types, edge types, transformer, and context menu config.
   */
  import { SvelteFlow, Controls, Background, MiniMap } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import type { DockviewPanelApi, DockviewApi } from 'dockview-core';
  import type { Writable } from 'svelte/store';
  import { get } from 'svelte/store';

  /* ── Node components ──────────────────────────────────────── */
  import SceneNode from '$lib/diagrams/nodes/SceneNode.svelte';
  import LocationNode from '$lib/diagrams/nodes/LocationNode.svelte';
  import WorldContainer from '$lib/diagrams/nodes/WorldContainer.svelte';
  import CharacterNode from '$lib/diagrams/nodes/CharacterNode.svelte';
  import TimelineBlock from '$lib/diagrams/nodes/TimelineBlock.svelte';
  import LifelineNode from '$lib/diagrams/nodes/LifelineNode.svelte';

  /* ── Edge components ──────────────────────────────────────── */
  import BeatEdge from '$lib/diagrams/edges/BeatEdge.svelte';
  import RelationshipEdge from '$lib/diagrams/edges/RelationshipEdge.svelte';
  import ExchangeArrow from '$lib/diagrams/edges/ExchangeArrow.svelte';

  /* ── Transformers ─────────────────────────────────────────── */
  import { transformStoryStructure } from '$lib/diagrams/transformers/story-structure.js';
  import { transformWorldMap } from '$lib/diagrams/transformers/world-map.js';
  import { transformCharacterNetwork } from '$lib/diagrams/transformers/character-network.js';
  import { transformTimeline } from '$lib/diagrams/transformers/timeline.js';
  import { transformInteractionSequence } from '$lib/diagrams/transformers/interaction-sequence.js';

  /* ── Shared diagram infrastructure ────────────────────────── */
  import { computeLayout } from '$lib/diagrams/layout/elk-layout.js';
  import {
    loadSidecar,
    saveSidecar,
    setOverride,
    applyOverrides,
  } from '$lib/diagrams/layout/sidecar.js';
  import { diagramStore } from '$lib/stores/diagrams.svelte.js';
  import { astStore } from '$lib/stores/ast.svelte.js';
  import { projectStore } from '$lib/stores/project.svelte.js';
  import { parseStableId } from '$lib/diagrams/operations/stable-refs.js';
  import type { DiagramOperation } from '$lib/diagrams/operations/text-edit-generator.js';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';

  /* ── Diagram type configuration ───────────────────────────── */

  type DiagramType =
    | 'story-structure'
    | 'world-map'
    | 'character-network'
    | 'timeline'
    | 'interaction-sequence';

  interface ContextMenuConfig {
    elementType: string;
    createLabel: string;
    renameLabel: string;
    deleteLabel: string;
    promptLabel: string;
  }

  interface DiagramConfig {
    viewId: string;
    nodeTypes: Record<string, any>;
    edgeTypes: Record<string, any> | undefined;
    transformer: (ast: any) => { nodes: any[]; edges: any[] };
    defaultNodeSize: (node: any) => { width: number; height: number };
    emptyDescription: string;
    contextMenu?: ContextMenuConfig;
  }

  const DIAGRAM_CONFIGS: Record<DiagramType, DiagramConfig> = {
    'story-structure': {
      viewId: 'story-structure',
      nodeTypes: { scene: SceneNode },
      edgeTypes: { beat: BeatEdge },
      transformer: transformStoryStructure,
      defaultNodeSize: (n) => ({
        width: n.width ?? 160,
        height: n.height ?? 80,
      }),
      emptyDescription:
        'Create or open a project to see the story structure diagram.',
      contextMenu: {
        elementType: 'scene',
        createLabel: 'New Scene',
        renameLabel: 'Rename Scene',
        deleteLabel: 'Delete Scene',
        promptLabel: 'Scene name:',
      },
    },
    'world-map': {
      viewId: 'world-map',
      nodeTypes: { location: LocationNode, 'world-container': WorldContainer },
      edgeTypes: undefined,
      transformer: transformWorldMap,
      defaultNodeSize: (n) => ({
        width: n.width ?? (n.type === 'world-container' ? 400 : 140),
        height: n.height ?? (n.type === 'world-container' ? 300 : 100),
      }),
      emptyDescription: 'Create or open a project to see the world map.',
    },
    'character-network': {
      viewId: 'character-network',
      nodeTypes: { character: CharacterNode },
      edgeTypes: { relationship: RelationshipEdge },
      transformer: transformCharacterNetwork,
      defaultNodeSize: (n) => ({
        width: n.width ?? 100,
        height: n.height ?? 100,
      }),
      emptyDescription:
        'Create or open a project to see the character network.',
      contextMenu: {
        elementType: 'character',
        createLabel: 'New Character',
        renameLabel: 'Rename Character',
        deleteLabel: 'Delete Character',
        promptLabel: 'Character name:',
      },
    },
    timeline: {
      viewId: 'timeline',
      nodeTypes: { 'timeline-block': TimelineBlock },
      edgeTypes: { beat: BeatEdge },
      transformer: transformTimeline,
      defaultNodeSize: (n) => ({
        width: n.width ?? (n.type === 'timeline-layer' ? 800 : 140),
        height: n.height ?? (n.type === 'timeline-layer' ? 100 : 60),
      }),
      emptyDescription: 'Create or open a project to see the timeline.',
    },
    'interaction-sequence': {
      viewId: 'interaction-sequence',
      nodeTypes: { lifeline: LifelineNode },
      edgeTypes: { exchange: ExchangeArrow },
      transformer: transformInteractionSequence,
      defaultNodeSize: (n) => ({
        width: n.width ?? 100,
        height: n.height ?? 350,
      }),
      emptyDescription:
        'Create or open a project to see the interaction sequence.',
    },
  };

  /* ── Props ────────────────────────────────────────────────── */

  interface Props {
    api: DockviewPanelApi;
    containerApi: DockviewApi;
    title: string;
    panelParams: Writable<Record<string, unknown>>;
  }

  let { api, containerApi, title, panelParams }: Props = $props();

  /* ── Resolve diagram type from params ─────────────────────── */

  const params = get(panelParams);
  const diagramType = (params?.diagramType as DiagramType) ?? 'story-structure';
  const config = DIAGRAM_CONFIGS[diagramType];

  /* ── State ────────────────────────────────────────────────── */

  let nodes = $state<any[]>([]);
  let edges = $state<any[]>([]);
  let contextMenu = $state<{ x: number; y: number; nodeId?: string } | null>(
    null,
  );
  let diagramLoading = $state(true);

  const projectId = $derived(projectStore.project?.id ?? '');

  /* ── Refresh: transform AST → layout → sidecar → render ─── */

  async function refresh() {
    const fileAst = astStore.activeAst;
    if (!fileAst?.ast || !projectId) {
      diagramLoading = false;
      return;
    }

    diagramLoading = true;
    try {
      const result = config.transformer(fileAst.ast);
      const layoutNodes = result.nodes.map((n: any) => ({
        id: n.id,
        ...config.defaultNodeSize(n),
        parentId: n.parentId,
      }));
      const layoutEdges = result.edges.map((e: any) => ({
        id: e.id,
        sources: [e.source],
        targets: [e.target],
      }));

      const layout = await computeLayout(
        config.viewId,
        layoutNodes,
        layoutEdges,
      );
      const sidecar = loadSidecar(projectId, config.viewId);
      const positions = applyOverrides(layout.nodes, sidecar);

      nodes = result.nodes.map((n: any) => {
        const pos = positions.get(n.id);
        return { ...n, position: pos ?? n.position };
      });
      edges = result.edges;
      diagramStore.setView(config.viewId, nodes, edges);
    } finally {
      diagramLoading = false;
    }
  }

  $effect(() => {
    void refresh();
  });

  /* ── Node event handlers ──────────────────────────────────── */

  function handleNodeDragStop(event: CustomEvent<{ node: any }>) {
    const node = event.detail.node;
    const sidecar = loadSidecar(projectId, config.viewId);
    const updated = setOverride(sidecar, node.id, node.position);
    saveSidecar(projectId, config.viewId, updated);
    diagramStore.updateNodes(config.viewId, nodes);
  }

  function handleNodeDoubleClick(event: CustomEvent<{ node: any }>) {
    const node = event.detail.node;
    const parsed = parseStableId(node.id);
    if (parsed) {
      window.dispatchEvent(
        new CustomEvent('actone:navigate-to-source', {
          detail: { type: parsed.type, name: parsed.name },
        }),
      );
    }
  }

  /* ── Context menu (story-structure, character-network) ───── */

  function handleContextMenu(event: MouseEvent) {
    if (!config.contextMenu) return;
    event.preventDefault();
    contextMenu = { x: event.clientX, y: event.clientY };
  }

  function handleNodeContextMenu(
    event: CustomEvent<{ node: any; event: MouseEvent }>,
  ) {
    if (!config.contextMenu) return;
    event.detail.event.preventDefault();
    contextMenu = {
      x: event.detail.event.clientX,
      y: event.detail.event.clientY,
      nodeId: event.detail.node.id,
    };
  }

  function closeContextMenu() {
    contextMenu = null;
  }

  function executeOperation(op: DiagramOperation) {
    // TODO: get current source text from editor, apply edits
    closeContextMenu();
  }

  function handleCreate() {
    if (!config.contextMenu) return;
    const name = prompt(config.contextMenu.promptLabel);
    if (!name) return;
    executeOperation({
      kind: 'create',
      elementType: config.contextMenu.elementType,
      name,
    });
  }

  function handleRename() {
    if (!config.contextMenu || !contextMenu?.nodeId) return;
    const parsed = parseStableId(contextMenu.nodeId);
    if (!parsed) return;
    const newName = prompt('New name:', parsed.name);
    if (!newName || newName === parsed.name) return;
    executeOperation({
      kind: 'rename',
      elementType: config.contextMenu.elementType,
      oldName: parsed.name,
      newName,
    });
  }

  function handleDelete() {
    if (!config.contextMenu || !contextMenu?.nodeId) return;
    const parsed = parseStableId(contextMenu.nodeId);
    if (!parsed) return;
    executeOperation({
      kind: 'delete',
      elementType: config.contextMenu.elementType,
      name: parsed.name,
    });
  }
</script>

{#if !projectStore.isLoaded}
  <div class="diagram-container flex items-center justify-center">
    <EmptyState
      message="No project loaded"
      description={config.emptyDescription}
    />
  </div>
{:else if diagramLoading && nodes.length === 0}
  <div class="diagram-container flex items-center justify-center">
    <LoadingSpinner label="Loading diagram..." />
  </div>
{:else}
  <div
    class="diagram-container"
    role="presentation"
    oncontextmenu={handleContextMenu}
  >
    <SvelteFlow
      {nodes}
      {edges}
      nodeTypes={config.nodeTypes}
      edgeTypes={config.edgeTypes}
      fitView
      proOptions={{ hideAttribution: true }}
      on:nodedragstop={handleNodeDragStop}
      on:nodedoubleclick={handleNodeDoubleClick}
      on:nodecontextmenu={handleNodeContextMenu}
    >
      <Controls />
      <Background />
      <MiniMap />
    </SvelteFlow>

    {#if config.contextMenu && contextMenu}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div
        class="context-overlay"
        role="presentation"
        onclick={closeContextMenu}
      >
        <div
          class="context-menu"
          role="menu"
          tabindex="-1"
          style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
          onkeydown={(e) => e.key === 'Escape' && closeContextMenu()}
        >
          <button role="menuitem" onclick={handleCreate}
            >{config.contextMenu.createLabel}</button
          >
          {#if contextMenu.nodeId}
            <button role="menuitem" onclick={handleRename}
              >{config.contextMenu.renameLabel}</button
            >
            <button role="menuitem" class="danger" onclick={handleDelete}
              >{config.contextMenu.deleteLabel}</button
            >
          {/if}
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .diagram-container {
    width: 100%;
    height: 100%;
    background: #0D0D0D;
  }

  .context-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
  }

  .context-menu {
    position: fixed;
    background: #171717;
    border: 1px solid #252525;
    border-radius: 6px;
    padding: 4px;
    min-width: 160px;
    z-index: 101;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  .context-menu button {
    display: block;
    width: 100%;
    padding: 6px 12px;
    background: none;
    border: none;
    color: #f8fafc;
    text-align: left;
    font-size: 13px;
    border-radius: 4px;
    cursor: pointer;
  }

  .context-menu button:hover {
    background: #252525;
  }

  .context-menu button.danger {
    color: #ef4444;
  }

  .context-menu button.danger:hover {
    background: #7f1d1d33;
  }
</style>
