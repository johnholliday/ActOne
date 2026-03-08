<script lang="ts">
  /**
   * T071: Custom SvelteFlow node for locations.
   * Colored by atmosphere intensity, shows scene markers.
   */
  import { Handle, Position } from '@xyflow/svelte';
  import type { LocationNodeData } from '@actone/shared';

  interface Props {
    id: string;
    data: LocationNodeData & { label: string; color: string };
  }

  let { id, data }: Props = $props();
</script>

<div
  class="location-node"
  style="border-color: {data.color};"
>
  <div class="location-name">{data.label}</div>
  {#if data.description}
    <div class="location-desc">{data.description}</div>
  {/if}
  {#if data.atmosphere.length > 0}
    <div class="location-atmosphere">
      {#each data.atmosphere.slice(0, 3) as attr}
        <span class="attr-badge" style="opacity: {0.5 + attr.value * 0.5};">
          {attr.name}
        </span>
      {/each}
    </div>
  {/if}
  {#if data.sceneMarkers.length > 0}
    <div class="scene-markers">
      {data.sceneMarkers.length} scene{data.sceneMarkers.length !== 1 ? 's' : ''}
    </div>
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
  .location-node {
    background: #171717;
    border: 1px solid #252525;
    border-radius: 8px;
    padding: 8px 12px;
    width: 220px;
    font-size: 12px;
    color: #f8fafc;
  }

  .location-name {
    font-weight: 600;
    margin-bottom: 4px;
  }

  .location-desc {
    font-size: 10px;
    color: #a1a1aa;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .location-atmosphere {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    margin-bottom: 4px;
  }

  .attr-badge {
    font-size: 9px;
    background: #252525;
    padding: 1px 4px;
    border-radius: 3px;
    color: #d4d4d8;
  }

  .scene-markers {
    font-size: 10px;
    color: #71717a;
  }

  .location-node :global(.svelte-flow__handle) {
    opacity: 0;
    width: 1px;
    height: 1px;
  }
</style>
