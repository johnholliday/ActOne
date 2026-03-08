<script lang="ts">
  /**
   * T071: Custom SvelteFlow node for interaction lifelines.
   * Header box at top with a vertical dashed bar extending downward.
   */
  import { Handle, Position } from '@xyflow/svelte';
  import type { LifelineData } from '@actone/shared';

  interface Props {
    id: string;
    data: LifelineData & { label: string; color: string; lifelineHeight?: number };
  }

  let { id, data }: Props = $props();

  const barHeight = $derived(data.lifelineHeight ?? 300);
</script>

<div class="lifeline-node">
  <div
    class="lifeline-header"
    style="background: {data.color}33; border-color: {data.color};"
  >
    <div class="lifeline-name">{data.label}</div>
    <div class="lifeline-nature" style="color: {data.color};">{data.nature}</div>
  </div>
  <div class="lifeline-bar" style="height: {barHeight}px; border-color: {data.color}44;"></div>
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
  .lifeline-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 80px;
  }

  .lifeline-header {
    border: 2px solid;
    border-radius: 6px;
    padding: 6px 12px;
    text-align: center;
    background: #171717;
  }

  .lifeline-name {
    font-weight: 700;
    font-size: 12px;
    color: #f8fafc;
  }

  .lifeline-nature {
    font-size: 9px;
    text-transform: uppercase;
    font-weight: 600;
  }

  .lifeline-bar {
    width: 0;
    border-left: 2px dashed;
    margin-top: 4px;
  }

  .lifeline-node :global(.svelte-flow__handle) {
    opacity: 0;
    width: 1px;
    height: 1px;
  }
</style>
