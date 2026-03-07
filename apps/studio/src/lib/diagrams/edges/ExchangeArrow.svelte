<script lang="ts">
  /**
   * T072: Custom SvelteFlow edge for interaction exchanges.
   * Horizontal arrows with pattern step and style mix indicators.
   */
  import { getBezierPath } from '@xyflow/svelte';
  import type { ExchangeArrowData } from '@actone/shared';

  interface Props {
    id: string;
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourcePosition: string;
    targetPosition: string;
    data: ExchangeArrowData & { label: string; color: string };
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

  const styleMixLabel = $derived(
    Object.entries(data.styleMix)
      .map(([name, value]) => `${name}: ${Math.round(value * 100)}%`)
      .join(' | '),
  );
</script>

<g>
  <path
    {id}
    class="exchange-edge"
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
        class="exchange-label"
        fill="#f8fafc"
      >
        {data.label}
      </textPath>
    </text>
  {/if}
  {#if styleMixLabel}
    <text>
      <textPath
        href="#{id}"
        startOffset="50%"
        text-anchor="middle"
        class="exchange-mix"
        fill="#71717a"
        dy="14"
      >
        {styleMixLabel}
      </textPath>
    </text>
  {/if}
</g>

<style>
  .exchange-edge {
    stroke-linecap: round;
  }

  .exchange-label {
    font-size: 10px;
    font-weight: 600;
    dominant-baseline: text-after-edge;
  }

  .exchange-mix {
    font-size: 8px;
    dominant-baseline: text-after-edge;
  }
</style>
