<script lang="ts">
  /**
   * T071: Custom SvelteFlow node for locations.
   * Colored by atmosphere intensity, shows scene markers.
   */
  import { Handle, Position } from '@xyflow/svelte';
  import type { LocationNodeData } from '@repo/shared';

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
  <Handle type="target" position={Position.Top} />
  <Handle type="source" position={Position.Bottom} />
</div>

<style>
  .location-node {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 8px 12px;
    min-width: 120px;
    font-size: 12px;
    color: #e2e8f0;
  }

  .location-name {
    font-weight: 600;
    margin-bottom: 4px;
  }

  .location-desc {
    font-size: 10px;
    color: #94a3b8;
    margin-bottom: 4px;
  }

  .location-atmosphere {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    margin-bottom: 4px;
  }

  .attr-badge {
    font-size: 9px;
    background: #334155;
    padding: 1px 4px;
    border-radius: 3px;
    color: #cbd5e1;
  }

  .scene-markers {
    font-size: 10px;
    color: #64748b;
  }
</style>
