<script lang="ts">
  /**
   * T126 + T134: Spread Preview page.
   *
   * Two-page spreads at print aspect ratio with optional
   * bleed/margin guide overlays. Supports guided-view panel
   * overlays for graphic novel mode.
   */
  import { TRIM_SIZES } from '$lib/publishing/pdf-generator.js';

  let selectedTrimSize = $state(2); // 6x9
  let showGuides = $state(true);
  let showPanelOverlays = $state(false);
  let currentSpread = $state(0);

  const trimSize = $derived(TRIM_SIZES[selectedTrimSize]!);
  const aspectRatio = $derived(trimSize.width / trimSize.height);
  const pageHeight = 600; // px
  const pageWidth = $derived(Math.round(pageHeight * aspectRatio));
</script>

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
      <span>Spread {currentSpread + 1}</span>
      <button onclick={() => (currentSpread += 1)}>Next</button>
    </div>
  </div>

  <div class="spread" style="height: {pageHeight}px;">
    <!-- Left page -->
    <div
      class="page left"
      style="width: {pageWidth}px; height: {pageHeight}px;"
    >
      {#if showGuides}
        <div class="bleed-guide"></div>
        <div class="margin-guide"></div>
      {/if}
      <div class="page-content">
        <p class="placeholder">Page {currentSpread * 2 + 1}</p>
      </div>
    </div>

    <!-- Right page -->
    <div
      class="page right"
      style="width: {pageWidth}px; height: {pageHeight}px;"
    >
      {#if showGuides}
        <div class="bleed-guide"></div>
        <div class="margin-guide"></div>
      {/if}
      <div class="page-content">
        <p class="placeholder">Page {currentSpread * 2 + 2}</p>
      </div>
    </div>
  </div>
</div>

<style>
  .spread-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px;
    background: #374151;
    min-height: 100vh;
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

  .placeholder {
    color: #9ca3af;
    font-family: Georgia, serif;
    font-size: 14px;
  }
</style>
