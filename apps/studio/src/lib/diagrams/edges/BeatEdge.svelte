<script lang="ts">
  /**
   * T072: Custom SvelteFlow edge for beat connections.
   * Colored by beat type, labeled with beat name.
   * Supports arrows or marching ants for direction indication.
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
    data: BeatEdgeData & {
      label: string;
      color: string;
      routePoints?: { x: number; y: number }[];
      edgeAnimation?: 'ants' | 'arrows' | 'dotted';
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

  const useAnts = $derived(data.edgeAnimation === 'ants');
  const useDotted = $derived(data.edgeAnimation === 'dotted');
  const useArrows = $derived(data.edgeAnimation === 'arrows');

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
</script>

<g>
  <path
    {id}
    class="beat-edge"
    class:ants={useAnts}
    d={pathD}
    stroke={data.color}
    stroke-width={useDotted ? 2.5 : 2}
    stroke-dasharray={useDotted ? '1 8' : useAnts ? '6 4' : 'none'}
    fill="none"
    marker-end={useArrows ? markerEnd : undefined}
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

  .beat-edge.ants {
    animation: march 0.5s linear infinite;
  }

  @keyframes march {
    to {
      stroke-dashoffset: -10;
    }
  }

  .beat-label {
    font-size: 10px;
    font-weight: 500;
    dominant-baseline: text-after-edge;
  }
</style>
