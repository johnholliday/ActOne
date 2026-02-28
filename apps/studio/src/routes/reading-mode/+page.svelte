<script lang="ts">
  /**
   * T125 + T019: Reading Mode page.
   *
   * Book-like typography with TOC, chapter navigation, drop caps,
   * scene break markers, and reading time estimate.
   * T019: Fetches accepted prose drafts from the active project.
   */
  import { projectStore } from '$lib/stores/project.svelte.js';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';

  let previewHtml = $state('');
  let loading = $state(false);
  let loadError = $state('');

  async function loadPreview() {
    const projectId = projectStore.project?.id;
    if (!projectId) return;
    loading = true;
    loadError = '';
    try {
      const response = await fetch(`/api/publishing/preview?projectId=${projectId}`);
      if (response.ok) {
        previewHtml = await response.text();
      } else {
        loadError = `Failed to load preview (${response.status})`;
      }
    } catch (err) {
      loadError = err instanceof Error ? err.message : 'Failed to load preview';
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (projectStore.project?.id) {
      void loadPreview();
    }
  });
</script>

<div class="reading-mode">
  {#if !projectStore.isLoaded}
    <div class="empty">
      <EmptyState message="No project loaded" description="Create or open a project to read your manuscript." />
    </div>
  {:else if loading}
    <div class="loading"><LoadingSpinner label="Loading preview..." /></div>
  {:else if loadError}
    <div class="empty">
      <div>
        <p>{loadError}</p>
        <button class="retry-btn" onclick={() => void loadPreview()}>Retry</button>
      </div>
    </div>
  {:else if previewHtml}
    {@html previewHtml}
  {:else}
    <div class="empty">
      No accepted drafts available for reading mode.
      Generate and accept prose to preview your manuscript.
    </div>
  {/if}
</div>

<style>
  .reading-mode {
    background: #faf9f6;
    min-height: 100vh;
  }

  .loading, .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    color: #666;
    font-family: Georgia, serif;
    font-size: 16px;
  }

  .retry-btn {
    margin-top: 12px;
    padding: 6px 16px;
    background: #d97706;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
  }
  .retry-btn:hover { background: #b45309; }
</style>
