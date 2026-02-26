<script lang="ts">
  /**
   * T125: Reading Mode page.
   *
   * Book-like typography with TOC, chapter navigation, drop caps,
   * scene break markers, and reading time estimate.
   */
  let previewHtml = $state('');
  let loading = $state(true);

  async function loadPreview() {
    try {
      const response = await fetch('/api/publishing/preview?projectId=default');
      if (response.ok) {
        previewHtml = await response.text();
      }
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    void loadPreview();
  });
</script>

<div class="reading-mode">
  {#if loading}
    <div class="loading">Loading preview...</div>
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
</style>
