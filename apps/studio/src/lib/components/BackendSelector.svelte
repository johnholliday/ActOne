<script lang="ts">
  /**
   * T098: Backend Selector.
   *
   * Shows backend list with availability indicators (green/red),
   * active marker, and switch action.
   */
  import { backendStore } from '$lib/stores/backends.svelte.js';
  import { onMount } from 'svelte';

  onMount(() => {
    void backendStore.refresh();
  });
</script>

<div class="backend-selector">
  <h4>AI Backends</h4>

  {#if backendStore.loading}
    <div class="loading">Loading backends...</div>
  {:else if backendStore.error}
    <div class="error">{backendStore.error}</div>
  {:else if backendStore.backends.length === 0}
    <div class="empty">No backends configured</div>
  {:else}
    <div class="backend-list">
      {#each backendStore.backends as backend}
        <button
          class="backend-item"
          class:active={backend.id === backendStore.activeId}
          onclick={() => backendStore.switchBackend(backend.id)}
        >
          <span
            class="availability-dot"
            class:available={backend.available}
            class:unavailable={!backend.available}
          ></span>
          <span class="backend-name">{backend.name}</span>
          {#if backend.id === backendStore.activeId}
            <span class="active-badge">Active</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .backend-selector {
    padding: 8px;
  }

  h4 {
    margin: 0 0 8px;
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
  }

  .loading, .error, .empty {
    font-size: 11px;
    color: #64748b;
    padding: 8px;
  }

  .error {
    color: #ef4444;
  }

  .backend-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .backend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: none;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    color: #e2e8f0;
    font-size: 12px;
    text-align: left;
    width: 100%;
  }

  .backend-item:hover {
    background: #334155;
  }

  .backend-item.active {
    border-color: #3b82f644;
    background: #3b82f611;
  }

  .availability-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .availability-dot.available {
    background: #10b981;
  }

  .availability-dot.unavailable {
    background: #ef4444;
  }

  .backend-name {
    flex: 1;
  }

  .active-badge {
    font-size: 9px;
    padding: 1px 4px;
    background: #3b82f633;
    color: #3b82f6;
    border-radius: 3px;
    text-transform: uppercase;
    font-weight: 600;
  }
</style>
