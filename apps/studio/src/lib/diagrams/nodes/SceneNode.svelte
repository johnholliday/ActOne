<script lang="ts">
  /**
   * T071: Custom SvelteFlow node for scenes.
   * Color-coded by scene type, shows participants and location.
   */
  import { Handle, Position } from '@xyflow/svelte';
  import type { SceneNodeData } from '@actone/shared';

  interface Props {
    id: string;
    data: SceneNodeData & { label: string; color: string };
  }

  let { id, data }: Props = $props();
</script>

<div
  class="scene-node"
  style="border-color: {data.color}; border-left: 4px solid {data.color};"
>
  <div class="scene-header">
    <span class="scene-type" style="color: {data.color};">{data.sceneType}</span>
  </div>
  <div class="scene-name">{data.label}</div>
  {#if data.location}
    <div class="scene-location">{data.location}</div>
  {/if}
  {#if data.participants.length > 0}
    <div class="scene-participants">
      {data.participants.join(', ')}
    </div>
  {/if}
  {#if data.estimatedWordCount > 0}
    <div class="scene-wordcount">{data.estimatedWordCount} words</div>
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
  .scene-node {
    background: #171717;
    border: 1px solid #252525;
    border-radius: 6px;
    padding: 8px 12px;
    min-width: 140px;
    font-size: 12px;
    color: #f8fafc;
  }

  .scene-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .scene-type {
    font-size: 10px;
    text-transform: uppercase;
    font-weight: 600;
  }

  .scene-name {
    font-weight: 600;
    margin-bottom: 4px;
  }

  .scene-location {
    font-size: 10px;
    color: #a1a1aa;
  }

  .scene-participants {
    font-size: 10px;
    color: #71717a;
    margin-top: 4px;
  }

  .scene-wordcount {
    font-size: 10px;
    color: #52525b;
    margin-top: 2px;
    text-align: right;
  }

  .scene-node :global(.svelte-flow__handle) {
    opacity: 0;
    width: 1px;
    height: 1px;
  }
</style>
