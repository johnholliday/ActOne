<script lang="ts">
  import { getDocPanelState, initDocPanelState } from '$lib/stores/doc-panel.svelte.js';
  import { onMount } from 'svelte';
  import X from 'lucide-svelte/icons/x';
  import ExternalLink from 'lucide-svelte/icons/external-link';
  import './guide-panel.css';

  const docPanel = getDocPanelState();

  let contentEl: HTMLElement | undefined = $state();
  let dragging = $state(false);

  onMount(() => {
    initDocPanelState();
  });

  // Scroll to top when doc content changes
  $effect(() => {
    if (docPanel.docHtml && contentEl) {
      contentEl.scrollTop = 0;
    }
  });

  // --- Resize drag on RIGHT edge ---
  function onResizePointerDown(e: PointerEvent) {
    e.preventDefault();
    dragging = true;
    const startX = e.clientX;
    const startWidth = docPanel.width;

    function onPointerMove(ev: PointerEvent) {
      const delta = ev.clientX - startX;
      docPanel.setWidth(startWidth + delta);
    }

    function onPointerUp() {
      dragging = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  $effect(() => {
    if (dragging) {
      document.body.classList.add('select-none', 'cursor-col-resize');
      return () => {
        document.body.classList.remove('select-none', 'cursor-col-resize');
      };
    }
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && docPanel.open) {
      docPanel.close();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if docPanel.open}
  <aside
    class="bg-background relative flex min-h-0 shrink-0 flex-col overflow-hidden border-r"
    style:width="{docPanel.width}px"
    aria-label="Documentation panel"
  >
    <!-- Header -->
    <div class="flex shrink-0 items-center justify-between border-b px-4 py-3">
      <h2 class="text-foreground text-sm font-semibold">Documentation</h2>
      <div class="flex items-center gap-2">
        <a
          href="/guide/"
          class="text-muted-foreground hover:text-foreground text-xs"
          target="_blank"
          rel="noopener noreferrer"
          title="Open full guide in new tab"
        >
          <ExternalLink class="size-3.5" />
        </a>
        <button
          type="button"
          onclick={() => docPanel.close()}
          class="text-muted-foreground hover:text-foreground flex h-6 w-6 items-center justify-center rounded"
          aria-label="Close documentation panel"
        >
          <X class="size-4" />
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div
      class="guide-content flex-1 overflow-y-auto px-5 py-4"
      role="region"
      aria-label="Guide content"
      bind:this={contentEl}
      onclick={(e) => docPanel.handleContentClick(e, contentEl)}
      onkeydown={(e) => { if (e.key === 'Enter') docPanel.handleContentClick(e as unknown as MouseEvent, contentEl); }}
    >
      {#if docPanel.loading}
        <div class="flex items-center justify-center py-12">
          <div
            class="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-green-600"
          ></div>
        </div>
      {:else if docPanel.error}
        <div
          class="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
        >
          {docPanel.error}
        </div>
      {:else}
        {@html docPanel.docHtml}
      {/if}
    </div>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="absolute right-0 top-0 z-20 h-full w-1.5 cursor-col-resize select-none"
      role="separator"
      aria-label="Resize documentation panel"
      class:bg-green-500={dragging}
      class:hover:bg-gray-300={!dragging}
      class:dark:hover:bg-gray-600={!dragging}
      onpointerdown={onResizePointerDown}
    ></div>
  </aside>
{/if}
