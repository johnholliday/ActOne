<script lang="ts">
  /**
   * T071: Custom SvelteFlow group node for worlds.
   * Semi-transparent container with world name and period.
   */
  import type { WorldContainerData } from '@actone/shared';

  interface Props {
    id: string;
    data: WorldContainerData & { label: string; color: string };
  }

  let { id, data }: Props = $props();

  const bgColor = $derived(data.color || '#3b82f6');
</script>

<div
  class="world-container"
  style="background: color-mix(in srgb, {bgColor} 15%, transparent); border-color: {bgColor};"
>
  <div class="world-header">
    <span class="world-name">{data.label}</span>
    {#if data.period}
      <span class="world-period">{data.period}</span>
    {/if}
  </div>
</div>

<style>
  .world-container {
    width: 100%;
    height: 100%;
    border: 1px solid;
    border-radius: 12px;
    padding: 12px;
    box-sizing: border-box;
    overflow: visible;
    min-width: 300px;
    min-height: 200px;
  }

  .world-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .world-name {
    font-weight: 700;
    font-size: 14px;
    color: #f8fafc;
  }

  .world-period {
    font-size: 11px;
    color: #71717a;
    font-style: italic;
  }
</style>
