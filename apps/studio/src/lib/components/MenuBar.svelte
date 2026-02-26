<script lang="ts">
  /**
   * T059: Menu bar with Project and View menus.
   */
  import { projectStore } from '$lib/stores/project.svelte.js';
  import { uiStore, type DiagramView } from '$lib/stores/ui.svelte.js';
  import { getValidTargets, getStageLabel } from '$lib/project/lifecycle.js';
  import type { LifecycleStage } from '@repo/shared';

  interface Props {
    oncreateproject?: () => void;
    onadvancestage?: (target: LifecycleStage) => void;
    onsnapshot?: () => void;
    ondiagram?: (view: DiagramView) => void;
    ongenerate?: () => void;
    onnavigate?: (path: string) => void;
  }

  let { oncreateproject, onadvancestage, onsnapshot, ondiagram, ongenerate, onnavigate }: Props = $props();

  let openMenu = $state<string | null>(null);

  function toggleMenu(name: string) {
    openMenu = openMenu === name ? null : name;
  }

  function closeMenus() {
    openMenu = null;
  }

  const validTargets = $derived(
    projectStore.project
      ? getValidTargets(projectStore.project.lifecycleStage)
      : [],
  );

  const diagramViews: Array<{ id: DiagramView; label: string }> = [
    { id: 'story-structure', label: 'Story Structure' },
    { id: 'character-network', label: 'Character Network' },
    { id: 'world-map', label: 'World Map' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'interaction-sequence', label: 'Interaction Sequence' },
  ];
</script>

<svelte:window onclick={closeMenus} />

<nav class="flex h-full items-center gap-0.5 text-xs">
  <!-- Project Menu -->
  <div class="relative">
    <button
      class="rounded px-2.5 py-1 text-white/60 hover:bg-white/10 hover:text-white/90"
      onclick={(e) => { e.stopPropagation(); toggleMenu('project'); }}
    >
      Project
    </button>

    {#if openMenu === 'project'}
      <div
        class="absolute left-0 top-full z-50 mt-0.5 min-w-44 rounded-md border border-white/10 bg-surface-800 py-1 shadow-lg"
        role="menu"
        tabindex="-1"
        onkeydown={(e) => { if (e.key === 'Escape') closeMenus(); }}
        onclick={(e) => e.stopPropagation()}
      >
        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90"
          onclick={() => { oncreateproject?.(); closeMenus(); }}
          role="menuitem"
        >
          New Project
        </button>

        <div class="my-1 border-t border-white/10"></div>

        {#if projectStore.isLoaded && validTargets.length > 0}
          <div class="px-3 py-1 text-[10px] uppercase tracking-wider text-white/30">
            Advance Stage
          </div>
          {#each validTargets as target}
            <button
              class="flex w-full items-center px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90"
              onclick={() => { onadvancestage?.(target); closeMenus(); }}
              role="menuitem"
            >
              → {getStageLabel(target)}
            </button>
          {/each}

          <div class="my-1 border-t border-white/10"></div>
        {/if}

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90 {!projectStore.isLoaded ? 'cursor-not-allowed opacity-30' : ''}"
          onclick={() => { onsnapshot?.(); closeMenus(); }}
          disabled={!projectStore.isLoaded}
          role="menuitem"
        >
          Take Snapshot
        </button>
      </div>
    {/if}
  </div>

  <!-- Generate Menu -->
  <div class="relative">
    <button
      class="rounded px-2.5 py-1 text-white/60 hover:bg-white/10 hover:text-white/90"
      onclick={(e) => { e.stopPropagation(); toggleMenu('generate'); }}
    >
      Generate
    </button>

    {#if openMenu === 'generate'}
      <div
        class="absolute left-0 top-full z-50 mt-0.5 min-w-44 rounded-md border border-white/10 bg-surface-800 py-1 shadow-lg"
        role="menu"
        tabindex="-1"
        onkeydown={(e) => { if (e.key === 'Escape') closeMenus(); }}
        onclick={(e) => e.stopPropagation()}
      >
        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90 {!projectStore.isLoaded ? 'cursor-not-allowed opacity-30' : ''}"
          onclick={() => { ongenerate?.(); closeMenus(); }}
          disabled={!projectStore.isLoaded}
          role="menuitem"
        >
          <span>Scene Prose</span>
          <span class="text-[10px] text-white/30">Ctrl+G</span>
        </button>

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90 {!projectStore.isLoaded ? 'cursor-not-allowed opacity-30' : ''}"
          onclick={() => { onnavigate?.('/gallery'); closeMenus(); }}
          disabled={!projectStore.isLoaded}
          role="menuitem"
        >
          Visual Assets
        </button>
      </div>
    {/if}
  </div>

  <!-- View Menu -->
  <div class="relative">
    <button
      class="rounded px-2.5 py-1 text-white/60 hover:bg-white/10 hover:text-white/90"
      onclick={(e) => { e.stopPropagation(); toggleMenu('view'); }}
    >
      View
    </button>

    {#if openMenu === 'view'}
      <div
        class="absolute left-0 top-full z-50 mt-0.5 min-w-48 rounded-md border border-white/10 bg-surface-800 py-1 shadow-lg"
        role="menu"
        tabindex="-1"
        onkeydown={(e) => { if (e.key === 'Escape') closeMenus(); }}
        onclick={(e) => e.stopPropagation()}
      >
        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90"
          onclick={() => { uiStore.toggleSidebar(); closeMenus(); }}
          role="menuitem"
        >
          <span>Sidebar</span>
          {#if uiStore.sidebarVisible}
            <span class="text-[10px] text-indigo-400">✓</span>
          {/if}
        </button>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90"
          onclick={() => { uiStore.toggleBottomPanel(); closeMenus(); }}
          role="menuitem"
        >
          <span>Bottom Panel</span>
          {#if uiStore.bottomPanelVisible}
            <span class="text-[10px] text-indigo-400">✓</span>
          {/if}
        </button>

        <div class="my-1 border-t border-white/10"></div>

        <div class="px-3 py-1 text-[10px] uppercase tracking-wider text-white/30">
          Diagrams
        </div>

        {#each diagramViews as view}
          <button
            class="flex w-full items-center justify-between px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90"
            onclick={() => { ondiagram?.(view.id); closeMenus(); }}
            role="menuitem"
          >
            <span>{view.label}</span>
            {#if uiStore.activeDiagramView === view.id}
              <span class="text-[10px] text-indigo-400">●</span>
            {/if}
          </button>
        {/each}

        <div class="my-1 border-t border-white/10"></div>

        <div class="px-3 py-1 text-[10px] uppercase tracking-wider text-white/30">
          Reference
        </div>

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90"
          onclick={() => { onnavigate?.('/story-bible'); closeMenus(); }}
          role="menuitem"
        >
          Story Bible
        </button>

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90"
          onclick={() => { onnavigate?.('/statistics'); closeMenus(); }}
          role="menuitem"
        >
          Statistics
        </button>

        <div class="my-1 border-t border-white/10"></div>

        <div class="px-3 py-1 text-[10px] uppercase tracking-wider text-white/30">
          Preview
        </div>

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90"
          onclick={() => { onnavigate?.('/reading-mode'); closeMenus(); }}
          role="menuitem"
        >
          Reading Mode
        </button>

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90"
          onclick={() => { onnavigate?.('/spread-preview'); closeMenus(); }}
          role="menuitem"
        >
          Spread Preview
        </button>
      </div>
    {/if}
  </div>

  <!-- Publish Menu -->
  <div class="relative">
    <button
      class="rounded px-2.5 py-1 text-white/60 hover:bg-white/10 hover:text-white/90"
      onclick={(e) => { e.stopPropagation(); toggleMenu('publish'); }}
    >
      Publish
    </button>

    {#if openMenu === 'publish'}
      <div
        class="absolute left-0 top-full z-50 mt-0.5 min-w-44 rounded-md border border-white/10 bg-surface-800 py-1 shadow-lg"
        role="menu"
        tabindex="-1"
        onkeydown={(e) => { if (e.key === 'Escape') closeMenus(); }}
        onclick={(e) => e.stopPropagation()}
      >
        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90 {!projectStore.isLoaded ? 'cursor-not-allowed opacity-30' : ''}"
          onclick={() => { onnavigate?.('/export'); closeMenus(); }}
          disabled={!projectStore.isLoaded}
          role="menuitem"
        >
          Export Manuscript
        </button>
      </div>
    {/if}
  </div>

  <!-- Help Menu -->
  <div class="relative">
    <button
      class="rounded px-2.5 py-1 text-white/60 hover:bg-white/10 hover:text-white/90"
      onclick={(e) => { e.stopPropagation(); toggleMenu('help'); }}
    >
      Help
    </button>

    {#if openMenu === 'help'}
      <div
        class="absolute left-0 top-full z-50 mt-0.5 min-w-44 rounded-md border border-white/10 bg-surface-800 py-1 shadow-lg"
        role="menu"
        tabindex="-1"
        onkeydown={(e) => { if (e.key === 'Escape') closeMenus(); }}
        onclick={(e) => e.stopPropagation()}
      >
        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90"
          onclick={() => { onnavigate?.('/help'); closeMenus(); }}
          role="menuitem"
        >
          User's Guide
        </button>

        <div class="my-1 border-t border-white/10"></div>

        <div class="px-3 py-1 text-[10px] uppercase tracking-wider text-white/30">
          Keyboard Shortcuts
        </div>

        <div class="px-3 py-1.5 text-[11px] text-white/40">
          <div class="flex justify-between"><span>Generate Prose</span><span>Ctrl+G</span></div>
          <div class="flex justify-between"><span>Toggle Sidebar</span><span>Ctrl+B</span></div>
          <div class="flex justify-between"><span>Toggle Bottom</span><span>Ctrl+J</span></div>
          <div class="flex justify-between"><span>Format Document</span><span>Ctrl+Shift+F</span></div>
          <div class="flex justify-between"><span>Diagram 1–5</span><span>Ctrl+1–5</span></div>
        </div>
      </div>
    {/if}
  </div>
</nav>
