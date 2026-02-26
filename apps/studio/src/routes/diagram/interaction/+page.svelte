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
  import { parseStableId } from '$lib/diagrams/operations/stable-refs.js';

  const nodeTypes = { lifeline: LifelineNode };
  const edgeTypes = { exchange: ExchangeArrow };

  let nodes = $state<any[]>([]);
  let edges = $state<any[]>([]);

  const projectId = 'default';
  const viewId = 'interaction-sequence';

  async function refresh() {
    const ast = astStore.activeAst;
    if (!ast) return;

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

<style>
  .diagram-container {
    width: 100%;
    height: 100vh;
    background: #0f172a;
  }
</style>
