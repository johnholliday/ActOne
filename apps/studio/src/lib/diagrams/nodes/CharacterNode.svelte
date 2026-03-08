<script lang="ts">
  /**
   * T071: Custom SvelteFlow node for characters.
   * Circle-shaped, sized by scene count, colored by nature.
   */
  import { Handle, Position } from '@xyflow/svelte';
  import type { CharacterNodeData } from '@actone/shared';

  interface Props {
    id: string;
    data: CharacterNodeData & { label: string; color: string };
  }

  let { id, data }: Props = $props();

  const size = $derived(Math.max(60, Math.min(120, 40 + data.sceneCount * 10)));
</script>

<div
  class="character-node"
  style="
    width: {size}px;
    height: {size}px;
    border-color: {data.color};
    background: {data.color}22;
  "
>
  <div class="character-name">{data.label}</div>
  {#if data.role}
    <div class="character-role">{data.role}</div>
  {/if}
  <div class="character-nature" style="color: {data.color};">{data.nature}</div>
  {#if data.topTraits.length > 0}
    <div class="character-traits">
      {data.topTraits.map((t) => t.name).join(', ')}
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
  .character-node {
    border: 2px solid;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px;
    font-size: 11px;
    color: #f8fafc;
    text-align: center;
    overflow: hidden;
  }

  .character-name {
    font-weight: 700;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .character-role {
    font-size: 9px;
    color: #a1a1aa;
  }

  .character-nature {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .character-traits {
    font-size: 8px;
    color: #71717a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .character-node :global(.svelte-flow__handle) {
    opacity: 0;
    width: 1px;
    height: 1px;
  }
</style>
