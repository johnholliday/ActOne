<script lang="ts">
  /**
   * T071: Custom SvelteFlow group node for worlds.
   * Dark container with world name and period.
   */
  import type { WorldContainerData } from '@repo/shared';

  interface Props {
    id: string;
    data: WorldContainerData & { label: string; color: string };
  }

  let { id, data }: Props = $props();
</script>

<div class="world-container">
  <div class="world-header">
    <span class="world-name">{data.label}</span>
    {#if data.period}
      <span class="world-period">{data.period}</span>
    {/if}
  </div>
</div>

<style>
  .world-container {
    background: #0D0D0D;
    border: 1px dashed #252525;
    border-radius: 12px;
    padding: 12px;
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
