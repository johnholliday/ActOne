<script lang="ts">
  /**
   * Outline panel: Document symbol tree.
   * Extracted from +page.svelte outline for dockview.
   */
  import { onMount } from 'svelte';
  import type { DockviewPanelApi, DockviewApi } from 'dockview-core';
  import type { Writable } from 'svelte/store';
  import type { DocumentSymbol } from '$lib/editor/langium-client.js';

  interface Props {
    api: DockviewPanelApi;
    containerApi: DockviewApi;
    title: string;
    panelParams: Writable<Record<string, unknown>>;
  }

  let { api, containerApi, title, panelParams }: Props = $props();

  let symbols = $state<DocumentSymbol[]>([]);

  function symbolKindLabel(kind: number): string {
    switch (kind) {
      case 5: return 'cls';
      case 8: return 'fld';
      case 23: return 'obj';
      default: return '•';
    }
  }

  /**
   * Listen for symbol updates from the editor panel.
   * The editor dispatches 'actone:symbols-updated' with the current symbols.
   */
  onMount(() => {
    function handleSymbolsUpdated(e: Event) {
      const detail = (e as CustomEvent<{ symbols: DocumentSymbol[] }>).detail;
      symbols = detail.symbols;
    }
    window.addEventListener('actone:symbols-updated', handleSymbolsUpdated);
    return () => {
      window.removeEventListener('actone:symbols-updated', handleSymbolsUpdated);
    };
  });
</script>

<div class="flex h-full w-full flex-col overflow-hidden bg-surface-850">
  <div class="flex-1 overflow-y-auto p-2 text-xs">
    {#if symbols.length === 0}
      <p class="px-2 py-4 text-center text-white/30">No symbols</p>
    {:else}
      <ul class="space-y-0.5">
        {#each symbols as symbol}
          <li class="rounded px-2 py-1 text-white/70 hover:bg-white/5">
            <span class="mr-1.5 inline-block w-6 text-center font-mono text-[10px] text-white/30">
              {symbolKindLabel(symbol.kind)}
            </span>
            {symbol.name}
            {#if symbol.children && symbol.children.length > 0}
              <ul class="ml-4 mt-0.5 space-y-0.5">
                {#each symbol.children as child}
                  <li class="rounded px-2 py-0.5 text-white/50 hover:bg-white/5">
                    <span class="mr-1.5 inline-block w-6 text-center font-mono text-[10px] text-white/20">
                      {symbolKindLabel(child.kind)}
                    </span>
                    {child.name}
                  </li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
