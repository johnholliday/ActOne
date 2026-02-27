<script lang="ts">
  /**
   * T111 + T037-T040: Gallery page.
   *
   * Search, filter by type/character/scene, sort, compare mode,
   * and approval workflow. Wired to server-loaded assets.
   */
  import { page } from '$app/state';
  import { projectStore } from '$lib/stores/project.svelte.js';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';

  let filter = $state<string>('all');
  let searchQuery = $state('');
  let sortBy = $state<'newest' | 'oldest' | 'name'>('newest');
  let compareMode = $state(false);
  let selectedForCompare = $state<string[]>([]);
  let updatingId = $state<string | null>(null);

  interface Asset {
    id: string;
    type: string;
    label: string;
    storageUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
  }

  // T038: Consume server-loaded assets from +page.server.ts
  let assets = $state<Asset[]>((page.data as { assets?: Asset[] }).assets ?? []);

  $effect(() => {
    const serverAssets = (page.data as { assets?: Asset[] }).assets;
    if (serverAssets) {
      assets = serverAssets;
    }
  });

  const filters = ['all', 'portrait', 'scene', 'cover', 'style-board'];

  const filteredAssets = $derived(
    assets
      .filter((a) => filter === 'all' || a.type === filter)
      .filter((a) =>
        searchQuery === '' ||
        a.label.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => {
        if (sortBy === 'newest') return b.createdAt.localeCompare(a.createdAt);
        if (sortBy === 'oldest') return a.createdAt.localeCompare(b.createdAt);
        return a.label.localeCompare(b.label);
      }),
  );

  function toggleCompare(id: string) {
    if (selectedForCompare.includes(id)) {
      selectedForCompare = selectedForCompare.filter((s) => s !== id);
    } else if (selectedForCompare.length < 2) {
      selectedForCompare = [...selectedForCompare, id];
    }
  }

  // T039: Approve/reject action handlers
  async function updateAssetStatus(assetId: string, status: 'approved' | 'rejected') {
    updatingId = assetId;
    try {
      const supabase = page.data.supabase;
      const { error } = await supabase
        .from('assets')
        .update({ status })
        .eq('id', assetId);

      if (error) {
        console.error('Failed to update asset status:', error.message);
        return;
      }

      // Reactively update the local asset list
      assets = assets.map((a) => (a.id === assetId ? { ...a, status } : a));
    } finally {
      updatingId = null;
    }
  }
</script>

{#if !projectStore.isLoaded}
  <div class="gallery">
    <EmptyState message="No project loaded" description="Create or open a project to browse visual assets." />
  </div>
{:else if projectStore.loading}
  <div class="gallery gallery-center">
    <LoadingSpinner label="Loading gallery..." />
  </div>
{:else}
<div class="gallery">
  <div class="gallery-header">
    <h1>Gallery</h1>
    <div class="controls">
      <input
        type="search"
        placeholder="Search assets..."
        bind:value={searchQuery}
        class="search-input"
      />
      <select bind:value={sortBy} class="sort-select">
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="name">Name</option>
      </select>
      <button
        class="compare-toggle"
        class:active={compareMode}
        onclick={() => {
          compareMode = !compareMode;
          selectedForCompare = [];
        }}
      >
        Compare
      </button>
    </div>
  </div>

  <nav class="filter-tabs">
    {#each filters as f}
      <button
        class="filter-tab"
        class:active={filter === f}
        onclick={() => (filter = f)}
      >
        {f === 'all' ? 'All' : f.replace('-', ' ')}
      </button>
    {/each}
  </nav>

  {#if compareMode && selectedForCompare.length === 2}
    <div class="compare-view">
      {#each selectedForCompare as id}
        {@const asset = assets.find((a) => a.id === id)}
        {#if asset}
          <div class="compare-item">
            <img src={asset.storageUrl} alt={asset.label} />
            <div class="compare-label">{asset.label}</div>
          </div>
        {/if}
      {/each}
    </div>
  {/if}

  <div class="asset-grid">
    {#each filteredAssets as asset}
      <div
        class="asset-card"
        class:selected={selectedForCompare.includes(asset.id)}
      >
        {#if asset.storageUrl}
          <img src={asset.storageUrl} alt={asset.label} class="asset-thumb" />
        {:else}
          <div class="asset-placeholder">No image</div>
        {/if}
        <div class="asset-info">
          <span class="asset-label">{asset.label}</span>
          <span class="asset-type">{asset.type}</span>
          <span class="asset-status" class:approved={asset.status === 'approved'} class:rejected={asset.status === 'rejected'}>
            {asset.status}
          </span>
        </div>
        <div class="asset-actions">
          {#if compareMode}
            <button onclick={() => toggleCompare(asset.id)}>
              {selectedForCompare.includes(asset.id) ? 'Deselect' : 'Select'}
            </button>
          {:else}
            <button
              class="approve"
              disabled={updatingId === asset.id || asset.status === 'approved'}
              onclick={() => void updateAssetStatus(asset.id, 'approved')}
            >
              {updatingId === asset.id ? '...' : 'Approve'}
            </button>
            <button
              class="reject"
              disabled={updatingId === asset.id || asset.status === 'rejected'}
              onclick={() => void updateAssetStatus(asset.id, 'rejected')}
            >
              {updatingId === asset.id ? '...' : 'Reject'}
            </button>
            <button class="regen">Regenerate</button>
          {/if}
        </div>
      </div>
    {/each}
    {#if filteredAssets.length === 0}
      <EmptyState message="No assets yet" description="Generate visual assets from the Run menu." />
    {/if}
  </div>
</div>
{/if}

<style>
  .gallery { max-width: 1200px; margin: 0 auto; padding: 24px; color: #e2e8f0; }
  h1 { font-size: 24px; font-weight: 700; margin: 0; }

  .gallery-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .controls { display: flex; gap: 8px; align-items: center; }

  .search-input {
    background: #0f172a; border: 1px solid #334155; color: #e2e8f0;
    padding: 6px 12px; border-radius: 4px; font-size: 12px; width: 200px;
  }

  .sort-select {
    background: #0f172a; border: 1px solid #334155; color: #e2e8f0;
    padding: 6px 8px; border-radius: 4px; font-size: 12px;
  }

  .compare-toggle {
    padding: 6px 12px; background: #334155; border: none; color: #e2e8f0;
    border-radius: 4px; font-size: 12px; cursor: pointer;
  }
  .compare-toggle.active { background: #3b82f6; }

  .filter-tabs { display: flex; gap: 2px; margin-bottom: 16px; border-bottom: 1px solid #334155; }
  .filter-tab {
    padding: 6px 12px; background: none; border: none; color: #64748b;
    font-size: 12px; cursor: pointer; border-bottom: 2px solid transparent;
    text-transform: capitalize;
  }
  .filter-tab:hover { color: #94a3b8; }
  .filter-tab.active { color: #e2e8f0; border-bottom-color: #3b82f6; }

  .compare-view { display: flex; gap: 16px; margin-bottom: 16px; }
  .compare-item { flex: 1; background: #1e293b; border-radius: 8px; overflow: hidden; }
  .compare-item img { width: 100%; aspect-ratio: 1; object-fit: cover; }
  .compare-label { padding: 8px; font-size: 13px; text-align: center; }

  .asset-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }

  .asset-card {
    background: #1e293b; border: 1px solid #334155; border-radius: 8px;
    overflow: hidden;
  }
  .asset-card.selected { border-color: #3b82f6; }

  .asset-thumb { width: 100%; aspect-ratio: 1; object-fit: cover; }
  .asset-placeholder {
    width: 100%; aspect-ratio: 1; background: #0f172a; display: flex;
    align-items: center; justify-content: center; color: #475569; font-size: 12px;
  }

  .asset-info { padding: 8px; display: flex; justify-content: space-between; }
  .asset-label { font-size: 12px; font-weight: 600; }
  .asset-type { font-size: 10px; color: #64748b; text-transform: capitalize; }

  .asset-actions { padding: 4px 8px 8px; display: flex; gap: 4px; }
  .asset-actions button {
    flex: 1; padding: 4px; background: #334155; border: none; color: #94a3b8;
    border-radius: 4px; font-size: 10px; cursor: pointer;
  }
  .asset-actions button:hover { background: #475569; }
  .asset-actions .approve { color: #10b981; }
  .asset-actions .reject { color: #ef4444; }
  .asset-actions .regen { color: #3b82f6; }

  .gallery-center { display: flex; align-items: center; justify-content: center; min-height: 60vh; }

  .asset-status {
    font-size: 9px; text-transform: uppercase; padding: 1px 4px;
    border-radius: 3px; background: #334155; color: #94a3b8;
  }
  .asset-status.approved { background: rgba(16, 185, 129, 0.15); color: #10b981; }
  .asset-status.rejected { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

  .asset-actions button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
