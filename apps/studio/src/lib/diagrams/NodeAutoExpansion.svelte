<script lang="ts">
  /**
   * Auto-expand parent nodes when children are dragged near/beyond edges.
   * Must be rendered as a child of <SvelteFlow> to access useSvelteFlow().
   *
   * Based on: https://github.com/xyflow/xyflow/issues/5016
   */
  import { useSvelteFlow, type Node } from '@xyflow/svelte';
  import { expandGroupNodes } from '$lib/diagrams/layout/node-expansions.js';

  const GROUP_PADDING = 20;
  const GROUP_PADDING_TOP = 120;

  let { getNodes, updateNode } = $derived(useSvelteFlow());

  let lastHash = 0;

  function hashPositions(currentNodes: Node[]): number {
    let h = 0x811c9dc5;
    for (const n of currentNodes) {
      h ^= (n.position.x * 73856093) | 0;
      h = Math.imul(h, 0x01000193);
      h ^= (n.position.y * 19349663) | 0;
      h = Math.imul(h, 0x01000193);
      h ^= ((n.width ?? 0) * 83492791) | 0;
      h = Math.imul(h, 0x01000193);
      h ^= ((n.height ?? 0) * 41729581) | 0;
      h = Math.imul(h, 0x01000193);
    }
    return h;
  }

  export function onNodeInteraction(d: { targetNode?: Node; node?: Node }) {
    const node = d.targetNode ?? d.node;
    if (node && !node.parentId) return;

    const currentNodes = getNodes();
    const currentHash = hashPositions(currentNodes);
    if (currentHash === lastHash) return;
    lastHash = currentHash;

    const expanded = expandGroupNodes(currentNodes, GROUP_PADDING, GROUP_PADDING_TOP);
    for (const n of expanded) {
      updateNode(n.id, n, { replace: true });
    }
  }
</script>
