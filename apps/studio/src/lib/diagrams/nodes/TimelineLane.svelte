<script lang="ts">
  /**
   * Custom SvelteFlow group node for timeline swim-lane containers.
   * Displays layer name, optional period. Supports fill vs outline display mode.
   * Header is positioned above the child area and rendered on top of children.
   */
  import { Handle, Position } from '@xyflow/svelte';
  import type { TimelineLayerData } from '@actone/shared';

  interface Props {
    id: string;
    data: TimelineLayerData & {
      label: string;
      color: string;
      swimLaneDisplay?: 'fill' | 'outline';
      swimLaneOpacity?: number;
    };
  }

  let { id, data }: Props = $props();

  const display = $derived(data.swimLaneDisplay ?? 'fill');
  const opacity = $derived(data.swimLaneOpacity ?? 0.2);
  const bgColor = $derived(data.color || '#252525');
</script>

<div
  class="timeline-lane"
  class:fill-mode={display === 'fill'}
  class:outline-mode={display === 'outline'}
  style="
    {display === 'fill'
      ? `background: color-mix(in srgb, ${bgColor} ${Math.round(opacity * 100)}%, transparent); border-color: ${bgColor};`
      : `border-color: ${bgColor}; background: transparent;`}
  "
>
  <div class="lane-header" style="background: color-mix(in srgb, ${bgColor} 30%, transparent);">
    <div class="lane-name">{data.label}</div>
    {#if data.period}
      <div class="lane-period">{data.period}</div>
    {/if}
    {#if data.description}
      <div class="lane-desc">{data.description}</div>
    {/if}
  </div>
  <Handle id="top-src" type="source" position={Position.Top} />
  <Handle id="top-tgt" type="target" position={Position.Top} />
  <Handle id="bottom-src" type="source" position={Position.Bottom} />
  <Handle id="bottom-tgt" type="target" position={Position.Bottom} />
  <Handle id="left-src" type="source" position={Position.Left} />
  <Handle id="left-tgt" type="target" position={Position.Left} />
  <Handle id="right-src" type="source" position={Position.Right} />
  <Handle id="right-tgt" type="target" position={Position.Right} />
</div>

<style>
  .timeline-lane {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    box-sizing: border-box;
    overflow: hidden;
    position: relative;
  }

  .timeline-lane.fill-mode {
    border: 1px solid;
  }

  .timeline-lane.outline-mode {
    border: 1px dashed;
  }

  .lane-header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1;
    padding: 8px 12px;
    border-radius: 8px 8px 0 0;
    pointer-events: none;
  }

  .lane-name {
    font-weight: 700;
    font-size: 12px;
    color: #f8fafc;
  }

  .lane-period {
    font-size: 10px;
    color: #71717a;
    font-style: italic;
    margin-top: 1px;
  }

  .lane-desc {
    font-size: 10px;
    color: #a1a1aa;
    line-height: 1.4;
    margin-top: 3px;
  }

  .timeline-lane :global(.svelte-flow__handle) {
    opacity: 0;
    width: 1px;
    height: 1px;
    pointer-events: none;
  }
</style>
