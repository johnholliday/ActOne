<script lang="ts">
  /**
   * Spread Preview panel: Two-page spreads at print aspect ratio
   * with optional bleed/margin guide overlays.
   * Extracted from spread-preview route for dockview.
   */
  import type { DockviewPanelApi, DockviewApi } from 'dockview-core';
  import type { Writable } from 'svelte/store';
  import { TRIM_SIZES } from '$lib/publishing/pdf-generator.js';
  import { projectStore } from '$lib/stores/project.svelte.js';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';

  interface Props {
    api: DockviewPanelApi;
    containerApi: DockviewApi;
    title: string;
    panelParams: Writable<Record<string, unknown>>;
  }

  let { api, containerApi, title, panelParams }: Props = $props();

  let selectedTrimSize = $state(2); // 6x9
  let showGuides = $state(true);
  let showPanelOverlays = $state(false);
  let currentSpread = $state(0);

  const trimSize = $derived(TRIM_SIZES[selectedTrimSize]!);
  const aspectRatio = $derived(trimSize.width / trimSize.height);
  const pageHeight = 600;
  const pageWidth = $derived(Math.round(pageHeight * aspectRatio));

  let previewHtml = $state('');
  let previewLoading = $state(false);
  let previewError = $state('');
  let pages = $state<string[]>([]);

  const totalSpreads = $derived(Math.max(1, Math.ceil(pages.length / 2)));

  async function loadPreview() {
    const projectId = projectStore.project?.id;
    if (!projectId) return;
    previewLoading = true;
    previewError = '';
    try {
      const res = await fetch(`/api/publishing/preview?projectId=${projectId}`);
      if (!res.ok) {
        previewError = `Failed to load preview (${res.status})`;
        return;
      }
      previewHtml = await res.text();
      splitIntoPages(previewHtml);
    } catch (err) {
      previewError = err instanceof Error ? err.message : 'Failed to load preview';
    } finally {
      previewLoading = false;
    }
  }

  function splitIntoPages(html: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const elements = Array.from(doc.body.children);

    const result: string[] = [];
    let currentPage = '';
    let charCount = 0;
    const charsPerPage = 1800;

    for (const el of elements) {
      const text = el.textContent ?? '';
      if (charCount + text.length > charsPerPage && currentPage) {
        result.push(currentPage);
        currentPage = '';
        charCount = 0;
      }
      currentPage += el.outerHTML;
      charCount += text.length;
    }
    if (currentPage) {
      result.push(currentPage);
    }

    pages = result.length > 0 ? result : [];
    currentSpread = 0;
  }

  $effect(() => {
    if (projectStore.project?.id) {
      void loadPreview();
    }
  });
</script>

{#if !projectStore.isLoaded}
  <div class="spread-preview">
    <EmptyState message="No project loaded" description="Create or open a project to preview your manuscript." />
  </div>
{:else if previewLoading}
  <div class="spread-preview">
    <LoadingSpinner label="Loading preview..." />
  </div>
{:else if previewError}
  <div class="spread-preview">
    <div style="text-align: center; color: #ef4444;">
      <p>{previewError}</p>
      <button class="retry-btn" onclick={() => void loadPreview()}>Retry</button>
    </div>
  </div>
{:else if pages.length === 0}
  <div class="spread-preview">
    <EmptyState message="No content to preview" description="Generate and accept prose to see your manuscript in spread view." />
  </div>
{:else}
<div class="spread-preview">
  <div class="controls">
    <select bind:value={selectedTrimSize}>
      {#each TRIM_SIZES as size, i}
        <option value={i}>{size.name}</option>
      {/each}
    </select>

    <label class="guide-toggle">
      <input type="checkbox" bind:checked={showGuides} />
      Show Guides
    </label>

    <label class="guide-toggle">
      <input type="checkbox" bind:checked={showPanelOverlays} />
      Panel Overlays
    </label>

    <div class="nav-buttons">
      <button
        disabled={currentSpread <= 0}
        onclick={() => (currentSpread = Math.max(0, currentSpread - 1))}
      >
        Previous
      </button>
      <span>Spread {currentSpread + 1} / {totalSpreads}</span>
      <button
        disabled={currentSpread >= totalSpreads - 1}
        onclick={() => (currentSpread = Math.min(totalSpreads - 1, currentSpread + 1))}
      >
        Next
      </button>
    </div>
  </div>

  <div class="spread" style="height: {pageHeight}px;">
    <div class="page left" style="width: {pageWidth}px; height: {pageHeight}px;">
      {#if showGuides}
        <div class="bleed-guide"></div>
        <div class="margin-guide"></div>
      {/if}
      <div class="page-content manuscript">
        {#if pages[currentSpread * 2]}
          {@html pages[currentSpread * 2]}
        {/if}
      </div>
    </div>

    <div class="page right" style="width: {pageWidth}px; height: {pageHeight}px;">
      {#if showGuides}
        <div class="bleed-guide"></div>
        <div class="margin-guide"></div>
      {/if}
      <div class="page-content manuscript">
        {#if pages[currentSpread * 2 + 1]}
          {@html pages[currentSpread * 2 + 1]}
        {/if}
      </div>
    </div>
  </div>
</div>
{/if}

<style>
  .spread-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px;
    background: #374151;
    height: 100%;
    overflow-y: auto;
    color: #e2e8f0;
  }

  .controls {
    display: flex;
    gap: 16px;
    align-items: center;
    margin-bottom: 24px;
    font-size: 13px;
  }

  .controls select {
    background: #1e293b;
    border: 1px solid #4b5563;
    color: #e2e8f0;
    padding: 4px 8px;
    border-radius: 4px;
  }

  .guide-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
  }

  .nav-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .nav-buttons button {
    padding: 4px 12px;
    background: #4b5563;
    border: none;
    color: #e2e8f0;
    border-radius: 4px;
    cursor: pointer;
  }

  .nav-buttons button:disabled { opacity: 0.4; cursor: not-allowed; }

  .retry-btn {
    margin-top: 12px;
    padding: 6px 16px;
    background: #d97706;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .spread {
    display: flex;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }

  .page {
    background: #faf9f6;
    position: relative;
    overflow: hidden;
  }

  .page.left { border-right: 1px solid #d1d5db; }

  .bleed-guide {
    position: absolute;
    inset: 0;
    border: 2px dashed rgba(239, 68, 68, 0.3);
    pointer-events: none;
  }

  .margin-guide {
    position: absolute;
    inset: 8%;
    border: 1px dashed rgba(59, 130, 246, 0.3);
    pointer-events: none;
  }

  .page-content {
    position: absolute;
    inset: 10%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .manuscript {
    overflow: hidden;
    font-family: Georgia, serif;
    font-size: 11px;
    line-height: 1.6;
    color: #1a1a1a;
    text-align: justify;
  }

  .manuscript :global(h1),
  .manuscript :global(h2),
  .manuscript :global(h3) {
    font-family: Georgia, serif;
    color: #111;
    margin: 0 0 8px;
  }

  .manuscript :global(p) {
    margin: 0 0 6px;
    text-indent: 1.5em;
  }

  .manuscript :global(p:first-child) {
    text-indent: 0;
  }
</style>
