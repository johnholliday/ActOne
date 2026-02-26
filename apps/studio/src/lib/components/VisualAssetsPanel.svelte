<script lang="ts">
  /**
   * T112: Visual Assets Panel.
   *
   * Type filter tabs, backend dropdown, thumbnail grid,
   * and detail panel with approval controls.
   */
  let activeType = $state<string>('all');
  let selectedBackend = $state<string>('');

  const types = ['all', 'portrait', 'scene', 'cover', 'style-board'];
  const imageBackends = [
    { id: 'midjourney', name: 'Midjourney' },
    { id: 'dalle', name: 'DALL-E 3' },
    { id: 'flux', name: 'Flux' },
    { id: 'local-sd', name: 'Local SD' },
  ];
</script>

<div class="visual-panel">
  <h3>Visual Assets</h3>

  <div class="type-tabs">
    {#each types as t}
      <button
        class="type-tab"
        class:active={activeType === t}
        onclick={() => (activeType = t)}
      >
        {t === 'all' ? 'All' : t}
      </button>
    {/each}
  </div>

  <div class="field">
    <label for="img-backend">Backend</label>
    <select id="img-backend" bind:value={selectedBackend}>
      <option value="">Select backend...</option>
      {#each imageBackends as backend}
        <option value={backend.id}>{backend.name}</option>
      {/each}
    </select>
  </div>

  <div class="thumb-grid">
    <div class="empty-state">
      No assets. Use Generate &gt; Visual Assets to create images.
    </div>
  </div>
</div>

<style>
  .visual-panel {
    padding: 12px;
    background: #1e293b;
    border-radius: 8px;
    font-size: 13px;
    color: #e2e8f0;
  }

  h3 { margin: 0 0 8px; font-size: 14px; font-weight: 600; }

  .type-tabs { display: flex; gap: 2px; margin-bottom: 8px; }
  .type-tab {
    padding: 4px 8px; background: none; border: none; color: #64748b;
    font-size: 11px; cursor: pointer; border-radius: 3px; text-transform: capitalize;
  }
  .type-tab:hover { color: #94a3b8; background: #334155; }
  .type-tab.active { color: #e2e8f0; background: #334155; }

  .field { margin-bottom: 8px; }
  label { display: block; font-size: 10px; color: #94a3b8; margin-bottom: 3px; }
  select {
    width: 100%; background: #0f172a; border: 1px solid #334155;
    color: #e2e8f0; padding: 5px 8px; border-radius: 4px; font-size: 11px;
  }

  .thumb-grid { min-height: 60px; }
  .empty-state { text-align: center; color: #475569; padding: 20px; font-size: 11px; }
</style>
