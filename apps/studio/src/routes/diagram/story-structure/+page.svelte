<script lang="ts">
  /**
   * T076: Story Structure diagram route.
   *
   * SvelteFlow canvas with scene nodes and beat edges.
   * Supports context menu (create/delete/rename scene) and double-click-to-navigate.
   */
  import { SvelteFlow, Controls, Background, MiniMap } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';

  import SceneNode from '$lib/diagrams/nodes/SceneNode.svelte';
  import BeatEdge from '$lib/diagrams/edges/BeatEdge.svelte';
  import { transformStoryStructure } from '$lib/diagrams/transformers/story-structure.js';
  import { computeLayout } from '$lib/diagrams/layout/elk-layout.js';
  import { loadSidecar, saveSidecar, setOverride, applyOverrides } from '$lib/diagrams/layout/sidecar.js';
  import { diagramStore } from '$lib/stores/diagrams.svelte.js';
  import { astStore } from '$lib/stores/ast.svelte.js';
  import { projectStore } from '$lib/stores/project.svelte.js';
  import { parseStableId } from '$lib/diagrams/operations/stable-refs.js';
  import { generateTextEdits } from '$lib/diagrams/operations/text-edit-generator.js';
  import type { DiagramOperation } from '$lib/diagrams/operations/text-edit-generator.js';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';

  const nodeTypes = { scene: SceneNode };
  const edgeTypes = { beat: BeatEdge };

  let nodes = $state<any[]>([]);
  let edges = $state<any[]>([]);
  let contextMenu = $state<{ x: number; y: number; nodeId?: string } | null>(null);
  let diagramLoading = $state(true);

  const projectId = $derived(projectStore.project?.id ?? '');
  const viewId = 'story-structure';

  async function refresh() {
    const ast = astStore.activeAst;
    if (!ast || !projectId) {
      diagramLoading = false;
      return;
    }

    diagramLoading = true;
    try {
      const result = transformStoryStructure(ast);
      const layoutNodes = result.nodes.map((n) => ({
        id: n.id,
        width: n.width ?? 160,
        height: n.height ?? 80,
        parentId: n.parentId,
      }));
      const layoutEdges = result.edges.map((e) => ({
        id: e.id,
        sources: [e.source],
        targets: [e.target],
      }));

      const layout = await computeLayout('story-structure', layoutNodes, layoutEdges);
      const sidecar = loadSidecar(projectId, viewId);
      const positions = applyOverrides(layout.nodes, sidecar);

      nodes = result.nodes.map((n) => {
        const pos = positions.get(n.id);
        return { ...n, position: pos ?? n.position };
      });
      edges = result.edges;
      diagramStore.setView('story-structure', nodes, edges);
    } finally {
      diagramLoading = false;
    }
  }

  $effect(() => {
    void refresh();
  });

  function handleNodeDragStop(event: CustomEvent<{ node: any }>) {
    const node = event.detail.node;
    const sidecar = loadSidecar(projectId, viewId);
    const updated = setOverride(sidecar, node.id, node.position);
    saveSidecar(projectId, viewId, updated);
    diagramStore.updateNodes('story-structure', nodes);
  }

  function handleNodeDoubleClick(event: CustomEvent<{ node: any }>) {
    const node = event.detail.node;
    const parsed = parseStableId(node.id);
    if (parsed) {
      // Navigate to source — dispatch custom event for parent to handle
      window.dispatchEvent(
        new CustomEvent('actone:navigate-to-source', {
          detail: { type: parsed.type, name: parsed.name },
        }),
      );
    }
  }

  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
    contextMenu = { x: event.clientX, y: event.clientY };
  }

  function handleNodeContextMenu(event: CustomEvent<{ node: any; event: MouseEvent }>) {
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

  function handleCreateScene() {
    const name = prompt('Scene name:');
    if (!name) return;
    executeOperation({ kind: 'create', elementType: 'scene', name });
  }

  function handleDeleteScene() {
    if (!contextMenu?.nodeId) return;
    const parsed = parseStableId(contextMenu.nodeId);
    if (!parsed) return;
    executeOperation({ kind: 'delete', elementType: 'scene', name: parsed.name });
  }

  function handleRenameScene() {
    if (!contextMenu?.nodeId) return;
    const parsed = parseStableId(contextMenu.nodeId);
    if (!parsed) return;
    const newName = prompt('New name:', parsed.name);
    if (!newName || newName === parsed.name) return;
    executeOperation({ kind: 'rename', elementType: 'scene', oldName: parsed.name, newName });
  }
</script>

{#if !projectStore.isLoaded}
  <div class="diagram-container flex items-center justify-center">
    <EmptyState message="No project loaded" description="Create or open a project to see the story structure diagram." />
  </div>
{:else if diagramLoading && nodes.length === 0}
  <div class="diagram-container flex items-center justify-center">
    <LoadingSpinner label="Loading diagram..." />
  </div>
{:else}
<div class="diagram-container" role="presentation" oncontextmenu={handleContextMenu}>
  <SvelteFlow
    {nodes}
    {edges}
    {nodeTypes}
    {edgeTypes}
    fitView
    on:nodedragstop={handleNodeDragStop}
    on:nodedoubleclick={handleNodeDoubleClick}
    on:nodecontextmenu={handleNodeContextMenu}
  >
    <Controls />
    <Background />
    <MiniMap />
  </SvelteFlow>

  {#if contextMenu}
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
        <button role="menuitem" onclick={handleCreateScene}>New Scene</button>
        {#if contextMenu.nodeId}
          <button role="menuitem" onclick={handleRenameScene}>Rename Scene</button>
          <button role="menuitem" class="danger" onclick={handleDeleteScene}>Delete Scene</button>
        {/if}
      </div>
    </div>
  {/if}
</div>
{/if}

<style>
  .diagram-container {
    width: 100%;
    height: 100vh;
    background: #0f172a;
  }

  .context-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
  }

  .context-menu {
    position: fixed;
    background: #1e293b;
    border: 1px solid #334155;
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
    color: #e2e8f0;
    text-align: left;
    font-size: 13px;
    border-radius: 4px;
    cursor: pointer;
  }

  .context-menu button:hover {
    background: #334155;
  }

  .context-menu button.danger {
    color: #ef4444;
  }

  .context-menu button.danger:hover {
    background: #7f1d1d33;
  }
</style>
