<script lang="ts">
  /**
   * Problems panel: shows Langium diagnostics for the active file.
   * Standalone dockview panel (split from former DiagnosticsPanel).
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

  const diagnostics = $derived(astStore.activeUri ? astStore.getDiagnostics(astStore.activeUri) : []);
  const diagnosticCount = $derived(editorStore.diagnosticCount);
</script>

<div class="flex h-full w-full flex-col overflow-hidden bg-surface-850">
  <div class="flex-1 overflow-y-auto px-3 py-1 text-xs font-mono">
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
  </div>
</div>
