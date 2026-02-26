<script lang="ts">
  /**
   * T072: Custom SvelteFlow edge for beat connections.
   * Colored by beat type, labeled with beat name.
   */
  import { getBezierPath } from '@xyflow/svelte';
  import type { BeatEdgeData } from '@repo/shared';

  interface Props {
    id: string;
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourcePosition: string;
    targetPosition: string;
    data: BeatEdgeData & { label: string; color: string };
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
</script>

<g>
  <path
    {id}
    class="beat-edge"
    d={path[0]}
    stroke={data.color}
    stroke-width={2}
    fill="none"
    marker-end={markerEnd}
  />
  {#if data.label}
    <text>
      <textPath
        href="#{id}"
        startOffset="50%"
        text-anchor="middle"
        class="beat-label"
        fill={data.color}
      >
        {data.label}
      </textPath>
    </text>
  {/if}
</g>

<style>
  .beat-edge {
    stroke-linecap: round;
  }

  .beat-label {
    font-size: 10px;
    font-weight: 500;
    dominant-baseline: text-after-edge;
  }
</style>
