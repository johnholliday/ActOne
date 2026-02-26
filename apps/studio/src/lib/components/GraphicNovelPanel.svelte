<script lang="ts">
  /**
   * T133: Graphic Novel Panel.
   *
   * Layout selector, page preview, per-panel controls,
   * page filmstrip, navigation, and export.
   */
  import { PANEL_LAYOUTS, suggestLayout, getLayout } from '$lib/graphic-novel/panel-generator.js';
  import { renderPageSvg, type PageConfig, type PanelContent } from '$lib/graphic-novel/page-renderer.js';

  let selectedLayout = $state('4-grid');
  let currentPage = $state(0);
  let pages = $state<PageConfig[]>([]);

  const layout = $derived(getLayout(selectedLayout));

  const pageSvg = $derived(
    pages[currentPage]
      ? renderPageSvg(pages[currentPage]!)
      : '',
  );
</script>

<div class="graphic-novel-panel">
  <h3>Graphic Novel</h3>

  <div class="layout-selector">
    <label for="layout-select">Layout</label>
    <select id="layout-select" bind:value={selectedLayout}>
      {#each PANEL_LAYOUTS as l}
        <option value={l.id}>{l.name} ({l.panels.length} panels)</option>
      {/each}
    </select>
  </div>

  <div class="page-preview">
    {#if pageSvg}
      {@html pageSvg}
    {:else}
      <div class="empty-page">
        No pages yet. Generate panels to create comic pages.
      </div>
    {/if}
  </div>

  {#if layout}
    <div class="panel-grid">
      {#each layout.panels as panel, i}
        <div class="panel-control">
          <span class="panel-label">Panel {i + 1}</span>
          <button class="regen-btn">Regenerate</button>
        </div>
      {/each}
    </div>
  {/if}

  <div class="filmstrip">
    {#each pages as page, i}
      <button
        class="filmstrip-thumb"
        class:active={currentPage === i}
        onclick={() => (currentPage = i)}
      >
        {i + 1}
      </button>
    {/each}
    {#if pages.length === 0}
      <div class="filmstrip-empty">No pages</div>
    {/if}
  </div>

  <div class="page-nav">
    <button
      disabled={currentPage <= 0}
      onclick={() => (currentPage = Math.max(0, currentPage - 1))}
    >
      Previous
    </button>
    <span>Page {currentPage + 1} of {pages.length || 1}</span>
    <button
      disabled={currentPage >= pages.length - 1}
      onclick={() => (currentPage = Math.min(pages.length - 1, currentPage + 1))}
    >
      Next
    </button>
  </div>
</div>

<style>
  .graphic-novel-panel { padding: 12px; background: #1e293b; border-radius: 8px; color: #e2e8f0; font-size: 13px; }
  h3 { margin: 0 0 12px; font-size: 14px; font-weight: 600; }

  .layout-selector { margin-bottom: 12px; }
  .layout-selector label { display: block; font-size: 10px; color: #94a3b8; margin-bottom: 3px; }
  .layout-selector select {
    width: 100%; background: #0f172a; border: 1px solid #334155;
    color: #e2e8f0; padding: 5px 8px; border-radius: 4px; font-size: 11px;
  }

  .page-preview {
    background: #0f172a; border: 1px solid #334155; border-radius: 6px;
    aspect-ratio: 0.7; display: flex; align-items: center; justify-content: center;
    overflow: hidden; margin-bottom: 12px;
  }

  .empty-page { color: #475569; font-size: 11px; }

  .panel-grid { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
  .panel-control { display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: #0f172a; border-radius: 4px; }
  .panel-label { font-size: 11px; color: #94a3b8; }
  .regen-btn {
    padding: 2px 8px; background: #334155; border: none; color: #94a3b8;
    border-radius: 3px; font-size: 10px; cursor: pointer;
  }
  .regen-btn:hover { background: #475569; }

  .filmstrip { display: flex; gap: 4px; margin-bottom: 8px; overflow-x: auto; }
  .filmstrip-thumb {
    width: 32px; height: 40px; background: #334155; border: 1px solid #475569;
    border-radius: 3px; color: #94a3b8; font-size: 10px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .filmstrip-thumb.active { border-color: #3b82f6; background: #3b82f633; }
  .filmstrip-empty { font-size: 10px; color: #475569; }

  .page-nav { display: flex; justify-content: space-between; align-items: center; font-size: 11px; }
  .page-nav button {
    padding: 4px 12px; background: #334155; border: none; color: #94a3b8;
    border-radius: 4px; font-size: 11px; cursor: pointer;
  }
  .page-nav button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
