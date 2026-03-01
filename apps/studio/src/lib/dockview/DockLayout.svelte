<script lang="ts">
  /**
   * DockLayout: Svelte 5 wrapper for dockview-core.
   *
   * Dynamically imports dockview-core in onMount (SSR-safe),
   * creates the dockview instance with the panel registry's
   * createComponent factory, and manages the lifecycle.
   */
  import { onMount } from 'svelte';
  import type { DockviewApi } from 'dockview-core';
  import { createComponent } from './panel-registry.js';
  import { saveLayout, restoreOrDefault } from './layout-persistence.js';
  import { applyDefaultLayout } from './default-layout.js';
  // Side-effect import: registers all panel components before dockview init
  import './panel-registry-init.js';

  interface Props {
    onReady?: (api: DockviewApi) => void;
    class?: string;
  }

  let { onReady, class: className = '' }: Props = $props();

  let containerEl: HTMLDivElement | undefined = $state(undefined);

  onMount(() => {
    let api: DockviewApi | undefined;
    const disposables: Array<{ dispose(): void }> = [];

    void (async () => {
      if (!containerEl) return;

      const { createDockview, themeDark } = await import('dockview-core');

      api = createDockview(containerEl, {
        createComponent,
        theme: themeDark,
        className: 'actone-dockview',
        singleTabMode: 'fullwidth',
      });

      // Restore saved layout or apply default
      restoreOrDefault(api);

      // Persist layout on changes (debounced via saveLayout)
      disposables.push(
        api.onDidLayoutChange(() => saveLayout(api!)),
      );

      // If user closes all panels, reopen the default layout
      disposables.push(
        api.onDidRemovePanel(() => {
          if (api && api.panels.length === 0) {
            applyDefaultLayout(api);
          }
        }),
      );

      onReady?.(api);
    })();

    return () => {
      for (const d of disposables) d.dispose();
      api?.dispose();
    };
  });
</script>

<div
  bind:this={containerEl}
  class="h-full w-full {className}"
></div>
