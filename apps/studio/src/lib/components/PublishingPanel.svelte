<script lang="ts">
  /**
   * T124: Publishing Panel.
   *
   * Format checkboxes, print settings, dependency indicators,
   * export progress, and completion summary.
   */
  import { TRIM_SIZES } from '$lib/publishing/pdf-generator.js';

  let selectedFormats = $state<Set<string>>(new Set(['epub']));
  let selectedTrimSize = $state(2); // Index into TRIM_SIZES (6x9)
  let paperType = $state<'white' | 'cream'>('cream');
  let exporting = $state(false);
  let exportStatus = $state<string | null>(null);

  function toggleFormat(format: string) {
    const next = new Set(selectedFormats);
    if (next.has(format)) {
      next.delete(format);
    } else {
      next.add(format);
    }
    selectedFormats = next;
  }

  async function handleExport() {
    exporting = true;
    exportStatus = 'Exporting...';

    for (const format of selectedFormats) {
      try {
        const response = await fetch('/api/publishing/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: 'default',
            format,
            trimSize: TRIM_SIZES[selectedTrimSize],
            paperType,
          }),
        });

        if (!response.ok) {
          exportStatus = `Export failed for ${format.toUpperCase()}`;
          break;
        }
      } catch {
        exportStatus = 'Export failed';
        break;
      }
    }

    exportStatus = 'Export complete';
    exporting = false;
  }
</script>

<div class="publishing-panel">
  <h3>Export Manuscript</h3>

  <div class="formats">
    <label class="format-option">
      <input type="checkbox" checked={selectedFormats.has('epub')} onchange={() => toggleFormat('epub')} />
      EPUB
    </label>
    <label class="format-option">
      <input type="checkbox" checked={selectedFormats.has('docx')} onchange={() => toggleFormat('docx')} />
      DOCX
    </label>
    <label class="format-option">
      <input type="checkbox" checked={selectedFormats.has('pdf')} onchange={() => toggleFormat('pdf')} />
      PDF
    </label>
    <label class="format-option">
      <input type="checkbox" checked={selectedFormats.has('kindle')} onchange={() => toggleFormat('kindle')} />
      Kindle
    </label>
  </div>

  {#if selectedFormats.has('pdf')}
    <div class="pdf-settings">
      <div class="field">
        <label for="trim-size">Trim Size</label>
        <select id="trim-size" bind:value={selectedTrimSize}>
          {#each TRIM_SIZES as size, i}
            <option value={i}>{size.name}</option>
          {/each}
        </select>
      </div>

      <div class="field">
        <label for="paper-type">Paper Type</label>
        <select id="paper-type" bind:value={paperType}>
          <option value="white">White</option>
          <option value="cream">Cream</option>
        </select>
      </div>
    </div>
  {/if}

  <button
    class="export-btn"
    onclick={handleExport}
    disabled={exporting || selectedFormats.size === 0}
  >
    {exporting ? 'Exporting...' : 'Export'}
  </button>

  {#if exportStatus}
    <div class="status">{exportStatus}</div>
  {/if}
</div>

<style>
  .publishing-panel { padding: 12px; background: #1e293b; border-radius: 8px; color: #e2e8f0; font-size: 13px; }
  h3 { margin: 0 0 12px; font-size: 14px; font-weight: 600; }

  .formats { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
  .format-option { display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; }

  .pdf-settings { margin-bottom: 12px; }
  .field { margin-bottom: 8px; }
  .field label { display: block; font-size: 10px; color: #94a3b8; margin-bottom: 3px; }
  .field select {
    width: 100%; background: #0f172a; border: 1px solid #334155;
    color: #e2e8f0; padding: 5px 8px; border-radius: 4px; font-size: 11px;
  }

  .export-btn {
    width: 100%; padding: 8px; background: #10b981; color: white;
    border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px;
  }
  .export-btn:hover:not(:disabled) { background: #059669; }
  .export-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .status { margin-top: 8px; font-size: 11px; color: #64748b; }
</style>
