<script lang="ts">
  /**
   * T080: Interaction Sequence diagram route.
   *
   * SvelteFlow canvas with character lifelines and exchange arrows.
   * Supports double-click-to-navigate to source.
   */
  import { SvelteFlow, Controls, Background, MiniMap } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';

  import LifelineNode from '$lib/diagrams/nodes/LifelineNode.svelte';
  import ExchangeArrow from '$lib/diagrams/edges/ExchangeArrow.svelte';
  import { transformInteractionSequence } from '$lib/diagrams/transformers/interaction-sequence.js';
  import { computeLayout } from '$lib/diagrams/layout/elk-layout.js';
  import { loadSidecar, saveSidecar, setOverride, applyOverrides } from '$lib/diagrams/layout/sidecar.js';
  import { diagramStore } from '$lib/stores/diagrams.svelte.js';
  import { astStore } from '$lib/stores/ast.svelte.js';
  import { projectStore } from '$lib/stores/project.svelte.js';
  import { parseStableId } from '$lib/diagrams/operations/stable-refs.js';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';

  const nodeTypes = { lifeline: LifelineNode };
  const edgeTypes = { exchange: ExchangeArrow };

  let nodes = $state<any[]>([]);
  let edges = $state<any[]>([]);
  let diagramLoading = $state(true);

  const projectId = $derived(projectStore.project?.id ?? '');
  const viewId = 'interaction-sequence';

  async function refresh() {
    const ast = astStore.activeAst;
    if (!ast || !projectId) { diagramLoading = false; return; }
    diagramLoading = true;
    try {
    const result = transformInteractionSequence(ast);
    const layoutNodes = result.nodes.map((n) => ({
      id: n.id,
      width: n.width ?? 100,
      height: n.height ?? 350,
    }));
    const layoutEdges = result.edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    }));

    const layout = await computeLayout('interaction-sequence', layoutNodes, layoutEdges);
    const sidecar = loadSidecar(projectId, viewId);
    const positions = applyOverrides(layout.nodes, sidecar);

    nodes = result.nodes.map((n) => {
      const pos = positions.get(n.id);
      return { ...n, position: pos ?? n.position };
    });
    edges = result.edges;
    diagramStore.setView('interaction-sequence', nodes, edges);
    } finally { diagramLoading = false; }
  }

  $effect(() => {
    void refresh();
  });

  function handleNodeDragStop(event: CustomEvent<{ node: any }>) {
    const node = event.detail.node;
    const sidecar = loadSidecar(projectId, viewId);
    const updated = setOverride(sidecar, node.id, node.position);
    saveSidecar(projectId, viewId, updated);
    diagramStore.updateNodes('interaction-sequence', nodes);
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
</script>

{#if !projectStore.isLoaded}
  <div class="diagram-container flex items-center justify-center">
    <EmptyState message="No project loaded" description="Create or open a project to see the interaction sequence." />
  </div>
{:else if diagramLoading && nodes.length === 0}
  <div class="diagram-container flex items-center justify-center">
    <LoadingSpinner label="Loading diagram..." />
  </div>
{:else}
<div class="diagram-container">
  <SvelteFlow
    {nodes}
    {edges}
    {nodeTypes}
    {edgeTypes}
    fitView
    on:nodedragstop={handleNodeDragStop}
    on:nodedoubleclick={handleNodeDoubleClick}
  >
    <Controls />
    <Background />
    <MiniMap />
  </SvelteFlow>
</div>
{/if}

<style>
  .diagram-container {
    width: 100%;
    height: 100vh;
    background: #0f172a;
  }
</style>
