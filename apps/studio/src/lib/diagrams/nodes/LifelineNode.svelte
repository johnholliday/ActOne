<script lang="ts">
  /**
   * T071: Custom SvelteFlow node for interaction lifelines.
   * Vertical bar representing a character in sequence diagrams.
   */
  import { Handle, Position } from '@xyflow/svelte';
  import type { LifelineData } from '@actone/shared';

  interface Props {
    id: string;
    data: LifelineData & { label: string; color: string };
  }

  let { id, data }: Props = $props();
</script>

<div class="lifeline-node">
  <div
    class="lifeline-header"
    style="background: {data.color}33; border-color: {data.color};"
  >
    <div class="lifeline-name">{data.label}</div>
    <div class="lifeline-nature" style="color: {data.color};">{data.nature}</div>
  </div>
  <div class="lifeline-bar" style="background: {data.color}44;"></div>
  <Handle type="target" position={Position.Left} />
  <Handle type="source" position={Position.Right} />
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
    width: 2px;
    height: 300px;
    margin-top: 4px;
  }
</style>
