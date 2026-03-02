<script lang="ts">
  /**
   * Output panel: shows build/run output.
   * Standalone dockview panel (split from former DiagnosticsPanel).
   */
  import type { DockviewPanelApi, DockviewApi } from 'dockview-core';
  import type { Writable } from 'svelte/store';

  interface Props {
    api: DockviewPanelApi;
    containerApi: DockviewApi;
    title: string;
    panelParams: Writable<Record<string, unknown>>;
  }

  let { api, containerApi, title, panelParams }: Props = $props();
</script>

<div class="flex h-full w-full flex-col overflow-hidden bg-surface-850">
  <div class="flex-1 overflow-y-auto px-3 py-1 text-xs font-mono">
    <p class="py-2 text-white/30">No output.</p>
  </div>
</div>
