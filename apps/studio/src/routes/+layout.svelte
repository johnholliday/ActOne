<script lang="ts">
  /**
   * T135: Resizable three-zone layout with drag handles
   * and panel visibility persistence.
   */
  import { invalidate } from '$app/navigation';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import '../app.css';
  import { uiStore } from '$lib/stores/ui.svelte.js';
  import MenuBar from '$lib/components/MenuBar.svelte';

  let { data, children } = $props();

  let sidebarWidth = $state(256);
  let bottomHeight = $state(192);
  let resizingSidebar = $state(false);
  let resizingBottom = $state(false);

  onMount(() => {
    const {
      data: { subscription },
    } = data.supabase.auth.onAuthStateChange((_event: string, newSession: unknown) => {
      if (newSession !== data.session) {
        invalidate('supabase:auth');
      }
    });

    // T136: Global keyboard shortcuts
    function handleKeydown(e: KeyboardEvent) {
      // Ctrl+G: Generate scene prose
      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('actone:generate-prose'));
      }
      // Ctrl+1–5: Switch diagram views
      if (e.ctrlKey && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const views = [
          '/diagram/story-structure',
          '/diagram/character-network',
          '/diagram/world-map',
          '/diagram/timeline',
          '/diagram/interaction',
        ] as const;
        const idx = parseInt(e.key) - 1;
        if (views[idx]) void goto(views[idx]);
      }
      // Ctrl+B: Toggle sidebar
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        uiStore.toggleSidebar();
      }
      // Ctrl+J: Toggle bottom panel
      if (e.ctrlKey && e.key === 'j') {
        e.preventDefault();
        uiStore.toggleBottomPanel();
      }
      // Ctrl+Shift+F: Format document
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('actone:format-document'));
      }
    }
    window.addEventListener('keydown', handleKeydown);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('keydown', handleKeydown);
    };
  });

  function handleSidebarMouseDown(e: MouseEvent) {
    e.preventDefault();
    resizingSidebar = true;
    const onMouseMove = (e: MouseEvent) => {
      sidebarWidth = Math.max(180, Math.min(480, e.clientX));
    };
    const onMouseUp = () => {
      resizingSidebar = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function handleBottomMouseDown(e: MouseEvent) {
    e.preventDefault();
    resizingBottom = true;
    const onMouseMove = (e: MouseEvent) => {
      bottomHeight = Math.max(100, Math.min(500, window.innerHeight - e.clientY));
    };
    const onMouseUp = () => {
      resizingBottom = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }
</script>

{#if !data.session}
  <!-- Unauthenticated: render page content directly (e.g. /auth) -->
  {@render children()}
{:else}
  <div class="flex h-screen w-screen overflow-hidden bg-surface-900 text-white">
    <!-- Sidebar -->
    {#if uiStore.sidebarVisible}
      <aside
        class="flex flex-col border-r border-white/10 bg-surface-800"
        style="width: {sidebarWidth}px;"
      >
        <div class="flex h-12 items-center px-4 font-semibold tracking-wide">
          ActOne Studio
        </div>
        <nav class="flex-1 overflow-y-auto px-2 py-2">
          <!-- Project navigator will be injected here -->
        </nav>
      </aside>

      <!-- Sidebar resize handle -->
      <div
        class="w-1 cursor-col-resize bg-transparent hover:bg-indigo-500/30 {resizingSidebar ? 'bg-indigo-500/50' : ''}"
        role="separator"
        tabindex="-1"
        onmousedown={handleSidebarMouseDown}
      ></div>
    {/if}

    <!-- Main content area -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- Top toolbar zone -->
      <header class="flex h-10 items-center border-b border-white/10 bg-surface-800 px-2">
        <MenuBar
          onnavigate={(path) => void goto(path)}
        />
      </header>

      <!-- Primary content -->
      <main class="flex-1 overflow-hidden">
        {@render children()}
      </main>

      <!-- Bottom panel resize handle -->
      {#if uiStore.bottomPanelVisible}
        <div
          class="h-1 cursor-row-resize bg-transparent hover:bg-indigo-500/30 {resizingBottom ? 'bg-indigo-500/50' : ''}"
          role="separator"
          tabindex="-1"
          onmousedown={handleBottomMouseDown}
        ></div>

        <!-- Bottom panel zone (diagnostics, output) -->
        <div
          class="border-t border-white/10 bg-surface-850"
          style="height: {bottomHeight}px;"
        >
          <!-- Bottom panel content injected per-route -->
        </div>
      {/if}
    </div>
  </div>
{/if}
