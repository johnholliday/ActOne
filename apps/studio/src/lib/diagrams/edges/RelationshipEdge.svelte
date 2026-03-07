<script lang="ts">
  /**
   * T072: Custom SvelteFlow edge for character relationships.
   * Width by weight, dashed for dynamic, colored by sentiment.
   */
  import { getBezierPath } from '@xyflow/svelte';
  import type { RelationshipEdgeData } from '@actone/shared';

  interface Props {
    id: string;
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourcePosition: string;
    targetPosition: string;
    data: RelationshipEdgeData & { label: string; color: string };
    markerEnd?: string;
  }

  let {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    markerEnd,
  }: Props = $props();

  const path = $derived(
    getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition: sourcePosition as any,
      targetPosition: targetPosition as any,
    }),
  );

  const strokeWidth = $derived(Math.max(1, Math.min(5, data.weight / 2)));
  const dashArray = $derived(data.dynamic ? '6 4' : 'none');
</script>

<g>
  <path
    {id}
    class="relationship-edge"
    d={path[0]}
    stroke={data.color}
    stroke-width={strokeWidth}
    stroke-dasharray={dashArray}
    fill="none"
    marker-end={markerEnd}
  />
  {#if data.label}
    <text>
      <textPath
        href="#{id}"
        startOffset="50%"
        text-anchor="middle"
        class="rel-label"
        fill="#a1a1aa"
      >
        {data.label}
      </textPath>
    </text>
  {/if}
</g>

<style>
  .relationship-edge {
    stroke-linecap: round;
  }

  .rel-label {
    font-size: 10px;
    dominant-baseline: text-after-edge;
  }
</style>
