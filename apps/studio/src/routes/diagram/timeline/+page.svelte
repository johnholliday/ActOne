<script lang="ts">
  /**
   * T079: Timeline diagram route.
   *
   * SvelteFlow canvas with horizontal swim-lanes per layer,
   * scene blocks, and arc phase bands.
   */
  import { SvelteFlow, Controls, Background, MiniMap } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';

  import TimelineBlock from '$lib/diagrams/nodes/TimelineBlock.svelte';
  import BeatEdge from '$lib/diagrams/edges/BeatEdge.svelte';
  import { transformTimeline } from '$lib/diagrams/transformers/timeline.js';
  import { computeLayout } from '$lib/diagrams/layout/elk-layout.js';
  import { loadSidecar, saveSidecar, setOverride, applyOverrides } from '$lib/diagrams/layout/sidecar.js';
  import { diagramStore } from '$lib/stores/diagrams.svelte.js';
  import { astStore } from '$lib/stores/ast.svelte.js';
  import { parseStableId } from '$lib/diagrams/operations/stable-refs.js';

  const nodeTypes = { 'timeline-block': TimelineBlock };
  const edgeTypes = { beat: BeatEdge };

  let nodes = $state<any[]>([]);
  let edges = $state<any[]>([]);

  const projectId = 'default';
  const viewId = 'timeline';

  async function refresh() {
    const ast = astStore.activeAst;
    if (!ast) return;

    const result = transformTimeline(ast);
    const layoutNodes = result.nodes.map((n) => ({
      id: n.id,
      width: n.width ?? (n.type === 'timeline-layer' ? 800 : 140),
      height: n.height ?? (n.type === 'timeline-layer' ? 100 : 60),
      parentId: n.parentId,
    }));
    const layoutEdges = result.edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    }));

    const layout = await computeLayout('timeline', layoutNodes, layoutEdges);
    const sidecar = loadSidecar(projectId, viewId);
    const positions = applyOverrides(layout.nodes, sidecar);

    nodes = result.nodes.map((n) => {
      const pos = positions.get(n.id);
      return { ...n, position: pos ?? n.position };
    });
    edges = result.edges;
    diagramStore.setView('timeline', nodes, edges);
  }

  $effect(() => {
    void refresh();
  });

  function handleNodeDragStop(event: CustomEvent<{ node: any }>) {
    const node = event.detail.node;
    const sidecar = loadSidecar(projectId, viewId);
    const updated = setOverride(sidecar, node.id, node.position);
    saveSidecar(projectId, viewId, updated);
    diagramStore.updateNodes('timeline', nodes);
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
