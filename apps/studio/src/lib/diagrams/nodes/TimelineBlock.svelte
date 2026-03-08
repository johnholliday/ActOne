<script lang="ts">
  /**
   * T071: Custom SvelteFlow node for timeline scene blocks.
   * Colored by scene type within swim-lane layers.
   */
  import { Handle, Position } from '@xyflow/svelte';
  import type { TimelineBlockData } from '@actone/shared';

  interface Props {
    id: string;
    data: TimelineBlockData & { label: string; color: string };
  }

  let { id, data }: Props = $props();
</script>

<div
  class="timeline-block"
  style="border-left: 3px solid {data.color};"
>
  <div class="block-name">{data.label}</div>
  <div class="block-type" style="color: {data.color};">{data.sceneType}</div>
  {#if data.estimatedWordCount > 0}
    <div class="block-words">{data.estimatedWordCount}w</div>
  {/if}
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
  .timeline-block {
    background: #171717;
    border: 1px solid #252525;
    border-radius: 4px;
    padding: 6px 10px;
    min-width: 100px;
    font-size: 11px;
    color: #f8fafc;
  }

  .block-name {
    font-weight: 600;
    margin-bottom: 2px;
  }

  .block-type {
    font-size: 9px;
    text-transform: uppercase;
    font-weight: 600;
  }

  .block-words {
    font-size: 9px;
    color: #52525b;
    text-align: right;
  }

  .timeline-block :global(.svelte-flow__handle) {
    opacity: 0;
    width: 1px;
    height: 1px;
  }
</style>
