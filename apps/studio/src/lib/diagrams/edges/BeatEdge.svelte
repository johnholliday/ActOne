<script lang="ts">
  /**
   * T072: Custom SvelteFlow edge for beat connections.
   * Colored by beat type, labeled with beat name.
   */
  import { getBezierPath } from '@xyflow/svelte';
  import type { BeatEdgeData } from '@actone/shared';
  import { buildRoutePath } from './route-path.js';

  interface Props {
    id: string;
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourcePosition: string;
    targetPosition: string;
    data: BeatEdgeData & { label: string; color: string; routePoints?: { x: number; y: number }[] };
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

  const bezierPath = $derived(
    getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition: sourcePosition as any,
      targetPosition: targetPosition as any,
    }),
  );

  const pathD = $derived.by(() => {
    if (data.routePoints && data.routePoints.length > 2) {
      // Use SvelteFlow handles as start/end, ELK bend points for routing
      const bendPoints = data.routePoints.slice(1, -1);
      return buildRoutePath([{ x: sourceX, y: sourceY }, ...bendPoints, { x: targetX, y: targetY }]);
    }
    return bezierPath[0];
  });
</script>

<g>
  <path
    {id}
    class="beat-edge"
    d={pathD}
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
