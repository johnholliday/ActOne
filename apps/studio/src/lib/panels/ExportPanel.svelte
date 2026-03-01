<script lang="ts">
  /**
   * Export panel: Format selection and download trigger.
   * Extracted from export route for dockview.
   */
  import type { DockviewPanelApi, DockviewApi } from 'dockview-core';
  import type { Writable } from 'svelte/store';
  import { projectStore } from '$lib/stores/project.svelte.js';
  import { requestExport } from '$lib/export/export-handler.js';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';

  interface Props {
    api: DockviewPanelApi;
    containerApi: DockviewApi;
    title: string;
    panelParams: Writable<Record<string, unknown>>;
  }

  let { api, containerApi, title, panelParams }: Props = $props();

  let selectedFormat = $state<'docx' | 'epub' | 'pdf'>('docx');
  let exporting = $state(false);
  let exportError = $state('');
  let exportSuccess = $state('');

  const formats = [
    { value: 'docx' as const, label: 'DOCX', description: 'Microsoft Word document' },
    { value: 'epub' as const, label: 'EPUB', description: 'E-book format' },
    { value: 'pdf' as const, label: 'PDF', description: 'Print-ready document' },
  ];

  async function handleExport() {
    const projectId = projectStore.project?.id;
    if (!projectId) return;

    exporting = true;
    exportError = '';
    exportSuccess = '';

    try {
      const result = await requestExport(fetch, projectId, selectedFormat);

      if (!result.success) {
        exportError = result.error;
        return;
      }

      for (const download of result.downloads) {
        const link = document.createElement('a');
        link.href = download.url;
        link.download = `${projectStore.project?.title ?? 'manuscript'}.${download.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      exportSuccess = `Exported as ${selectedFormat.toUpperCase()} successfully!`;
    } catch (err) {
      exportError = err instanceof Error ? err.message : 'Export failed';
    } finally {
      exporting = false;
    }
  }
</script>

<div class="export-panel">
  {#if !projectStore.isLoaded}
    <EmptyState
      message="No project loaded"
      description="Create or open a project before exporting."
    />
  {:else}
    <h1 class="mb-2 text-xl font-bold">Export Manuscript</h1>
    <p class="mb-6 text-sm text-zinc-400">
      Export <span class="font-medium text-white">{projectStore.project?.title}</span> in your preferred format.
    </p>

    {#if exportError}
      <div class="mb-4 rounded bg-red-500/10 px-3 py-2 text-xs text-red-400">
        {exportError}
        <button
          class="ml-2 underline hover:text-red-300"
          onclick={() => void handleExport()}
        >
          Retry
        </button>
      </div>
    {/if}

    {#if exportSuccess}
      <div class="mb-4 rounded bg-green-500/10 px-3 py-2 text-xs text-green-400">
        {exportSuccess}
      </div>
    {/if}

    <div class="mb-6 space-y-2">
      {#each formats as fmt}
        <label
          class="flex cursor-pointer items-center gap-3 rounded-lg border border-[#252525] p-3 transition-colors
            {selectedFormat === fmt.value ? 'border-amber-500/50 bg-amber-500/5' : 'hover:border-[#333] hover:bg-white/5'}"
        >
          <input
            type="radio"
            name="format"
            value={fmt.value}
            bind:group={selectedFormat}
            class="accent-amber-500"
          />
          <div>
            <div class="text-sm font-medium">{fmt.label}</div>
            <div class="text-xs text-zinc-500">{fmt.description}</div>
          </div>
        </label>
      {/each}
    </div>

    <button
      class="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
      onclick={() => void handleExport()}
      disabled={exporting}
    >
      {#if exporting}
        <LoadingSpinner size="sm" />
      {/if}
      Export as {selectedFormat.toUpperCase()}
    </button>
  {/if}
</div>

<style>
  .export-panel {
    max-width: 512px;
    margin: 0 auto;
    padding: 48px 24px;
    color: white;
    height: 100%;
    overflow-y: auto;
  }
</style>
