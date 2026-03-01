<script lang="ts">
  /**
   * Diagnostics panel: Problems and Output tabs.
   * Extracted from +page.svelte bottom panel for dockview.
   */
  import type { DockviewPanelApi, DockviewApi } from 'dockview-core';
  import type { Writable } from 'svelte/store';
  import { astStore } from '$lib/stores/ast.svelte.js';
  import { editorStore } from '$lib/stores/editor.svelte.js';

  interface Props {
    api: DockviewPanelApi;
    containerApi: DockviewApi;
    title: string;
    panelParams: Writable<Record<string, unknown>>;
  }

  let { api, containerApi, title, panelParams }: Props = $props();

  let activeTab = $state<'problems' | 'output'>('problems');

  const diagnostics = $derived(astStore.activeUri ? astStore.getDiagnostics(astStore.activeUri) : []);
  const diagnosticCount = $derived(editorStore.diagnosticCount);
</script>

<div class="flex h-full w-full flex-col overflow-hidden bg-surface-850">
  <!-- Tab bar -->
  <div class="flex h-7 items-center border-b border-white/10 px-3 text-xs">
    <button
      class="mr-3 pb-0.5 {activeTab === 'problems' ? 'border-b border-amber-400 text-white/90' : 'text-white/40 hover:text-white/60'}"
      onclick={() => (activeTab = 'problems')}
    >
      Problems
      {#if diagnosticCount > 0}
        <span class="ml-1 rounded-full bg-red-500/20 px-1.5 text-[10px] text-red-400">
          {diagnosticCount}
        </span>
      {/if}
    </button>
    <button
      class="mr-3 pb-0.5 {activeTab === 'output' ? 'border-b border-amber-400 text-white/90' : 'text-white/40 hover:text-white/60'}"
      onclick={() => (activeTab = 'output')}
    >
      Output
    </button>
  </div>

  <!-- Panel content -->
  <div class="flex-1 overflow-y-auto px-3 py-1 text-xs font-mono">
    {#if activeTab === 'problems'}
      {#if diagnostics.length === 0}
        <p class="py-2 text-white/30">No problems detected.</p>
      {:else}
        <ul class="space-y-0.5">
          {#each diagnostics as d}
            <li class="flex items-start gap-2 rounded px-1 py-0.5 hover:bg-white/5">
              <span class={d.severity === 1 ? 'text-red-400' : d.severity === 2 ? 'text-yellow-400' : 'text-blue-400'}>
                {d.severity === 1 ? '●' : d.severity === 2 ? '▲' : 'ℹ'}
              </span>
              <span class="text-white/70">{d.message}</span>
              <span class="ml-auto text-white/30">
                [{d.range.start.line + 1}:{d.range.start.character + 1}]
              </span>
            </li>
          {/each}
        </ul>
      {/if}
    {:else if activeTab === 'output'}
      <p class="py-2 text-white/30">No output.</p>
    {/if}
  </div>
</div>
