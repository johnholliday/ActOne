<script lang="ts">
  /**
   * T072: Custom SvelteFlow edge for character relationships.
   * Width by weight, dashed for dynamic, colored by sentiment.
   * Supports arrows or marching ants for direction indication.
   */
  import { getBezierPath } from '@xyflow/svelte';
  import type { RelationshipEdgeData } from '@actone/shared';
  import { buildRoutePath } from './route-path.js';

  interface Props {
    id: string;
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourcePosition: string;
    targetPosition: string;
    data: RelationshipEdgeData & {
      label: string;
      color: string;
      routePoints?: { x: number; y: number }[];
      edgeAnimation?: 'ants' | 'arrows';
    };
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

  const useAnts = $derived(data.edgeAnimation !== 'arrows');

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
      const bendPoints = data.routePoints.slice(1, -1);
      return buildRoutePath([{ x: sourceX, y: sourceY }, ...bendPoints, { x: targetX, y: targetY }]);
    }
    return bezierPath[0];
  });

  const strokeWidth = $derived(Math.max(0.5, Math.min(1.5, data.weight / 5)));
  const dashArray = $derived.by(() => {
    if (useAnts) return '3 2';
    if (data.dynamic) return '3 2';
    return 'none';
  });
</script>

<g>
  <path
    {id}
    class="relationship-edge"
    class:ants={useAnts}
    d={pathD}
    stroke={data.color}
    stroke-width={strokeWidth}
    stroke-dasharray={dashArray}
    fill="none"
    marker-end={useAnts ? undefined : markerEnd}
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

  .relationship-edge.ants {
    animation: march 0.5s linear infinite;
  }

  @keyframes march {
    to {
      stroke-dashoffset: -5;
    }
  }

  .rel-label {
    font-size: 9px;
    dominant-baseline: text-after-edge;
  }
</style>
