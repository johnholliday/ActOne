<script lang="ts">
  /**
   * T072: Custom SvelteFlow edge for interaction exchanges.
   * Renders as a horizontal arrow at a fixed Y position along lifelines,
   * producing a standard sequence diagram layout.
   */
  import type { ExchangeArrowData } from '@actone/shared';

  interface Props {
    id: string;
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourcePosition: string;
    targetPosition: string;
    data: ExchangeArrowData & {
      label: string;
      color: string;
      exchangeY?: number;
      sourceX?: number;
      targetX?: number;
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

  /** Use the transformer-computed positions when available, otherwise fall back to handle positions. */
  const y = $derived(data.exchangeY ?? (sourceY + targetY) / 2);
  const x1 = $derived(data.sourceX ?? sourceX);
  const x2 = $derived(data.targetX ?? targetX);

  const pathD = $derived(`M ${x1} ${y} L ${x2} ${y}`);
  const labelX = $derived((x1 + x2) / 2);
  const goingLeft = $derived(x2 < x1);

  const styleMixLabel = $derived(
    Object.entries(data.styleMix)
      .map(([name, value]) => `${name}: ${Math.round(value * 100)}%`)
      .join(' | '),
  );
</script>

<g>
  <!-- Arrow line -->
  <path
    {id}
    class="exchange-edge"
    d={pathD}
    stroke={data.color}
    stroke-width={2}
    fill="none"
    marker-end={markerEnd}
  />
  <!-- Arrowhead (manual since we bypass SvelteFlow's marker system) -->
  {#if !markerEnd}
    {@const tipX = x2}
    {@const dir = goingLeft ? 1 : -1}
    <polygon
      points="{tipX},{y} {tipX + dir * 8},{y - 4} {tipX + dir * 8},{y + 4}"
      fill={data.color}
    />
  {/if}
  <!-- Label above the arrow -->
  {#if data.label}
    <text
      x={labelX}
      y={y - 8}
      text-anchor="middle"
      class="exchange-label"
      fill="#f8fafc"
    >
      {data.label}
    </text>
  {/if}
  <!-- Style mix below the arrow -->
  {#if styleMixLabel}
    <text
      x={labelX}
      y={y + 16}
      text-anchor="middle"
      class="exchange-mix"
      fill="#71717a"
    >
      {styleMixLabel}
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
  }

  .exchange-mix {
    font-size: 8px;
  }
</style>
