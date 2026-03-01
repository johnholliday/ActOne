<script lang="ts">
  /**
   * T059: Menu bar with File, Edit, View, Run, Help menus.
   */
  import { onMount } from 'svelte';
  import { projectStore } from '$lib/stores/project.svelte.js';
  import { uiStore, type DiagramView } from '$lib/stores/ui.svelte.js';
  import { getValidTargets, getStageLabel } from '$lib/project/lifecycle.js';
  import { parseAppearancePrefs } from '$lib/settings/appearance.js';
  import { openPanel, getDockApi } from '$lib/dockview/panel-actions.js';
  import { clearLayout } from '$lib/dockview/layout-persistence.js';
  import { applyDefaultLayout } from '$lib/dockview/default-layout.js';
  import type { LifecycleStage } from '@repo/shared';

  interface Props {
    oncreateproject?: () => void;
    onadvancestage?: (target: LifecycleStage) => void;
    onsnapshot?: () => void;
    ongenerate?: () => void;
  }

  let { oncreateproject, onadvancestage, onsnapshot, ongenerate }: Props = $props();

  let openMenu = $state<string | null>(null);
  let wordWrapEnabled = $state(false);

  onMount(() => {
    // Read initial word wrap state
    const prefs = parseAppearancePrefs(localStorage.getItem('actone:appearance'));
    wordWrapEnabled = prefs.wordWrap;

    function handleWordWrapChanged(e: Event) {
      const detail = (e as CustomEvent<{ wordWrap: boolean }>).detail;
      wordWrapEnabled = detail.wordWrap;
    }
    window.addEventListener('actone:word-wrap-changed', handleWordWrapChanged);

    return () => {
      window.removeEventListener('actone:word-wrap-changed', handleWordWrapChanged);
    };
  });

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

  const diagramPanelMap: Record<DiagramView, string> = {
    'story-structure': 'diagram-story-structure',
    'character-network': 'diagram-character-network',
    'world-map': 'diagram-world-map',
    'timeline': 'diagram-timeline',
    'interaction-sequence': 'diagram-interaction',
  };

  function handleResetLayout() {
    clearLayout();
    const api = getDockApi();
    if (api) applyDefaultLayout(api);
  }
</script>

<svelte:window onclick={closeMenus} />

<nav class="flex h-full items-center gap-0.5 text-xs">
  <!-- File Menu -->
  <div class="relative">
    <button
      class="rounded px-2.5 py-1 text-white/60 hover:bg-white/10 hover:text-white/90"
      onclick={(e) => { e.stopPropagation(); toggleMenu('file'); }}
    >
      File
    </button>

    {#if openMenu === 'file'}
      <div
        class="absolute left-0 top-full z-50 mt-0.5 min-w-44 rounded-md border border-[#252525] bg-surface-800 py-1 shadow-lg"
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

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90"
          onclick={() => { window.dispatchEvent(new CustomEvent('actone:open-project')); closeMenus(); }}
          role="menuitem"
        >
          <span>Open Project...</span>
          <span class="text-[10px] text-white/30">Ctrl+O</span>
        </button>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90 {!projectStore.isLoaded ? 'cursor-not-allowed opacity-30' : ''}"
          onclick={() => { window.dispatchEvent(new CustomEvent('actone:save-file')); closeMenus(); }}
          disabled={!projectStore.isLoaded}
          role="menuitem"
        >
          <span>Save</span>
          <span class="text-[10px] text-white/30">Ctrl+S</span>
        </button>

        <div class="my-1 border-t border-[#252525]"></div>

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
              &rarr; {getStageLabel(target)}
            </button>
          {/each}
        {/if}

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90 {!projectStore.isLoaded ? 'cursor-not-allowed opacity-30' : ''}"
          onclick={() => { onsnapshot?.(); closeMenus(); }}
          disabled={!projectStore.isLoaded}
          role="menuitem"
        >
          Take Snapshot
        </button>

        <div class="my-1 border-t border-[#252525]"></div>

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90 {!projectStore.isLoaded ? 'cursor-not-allowed opacity-30' : ''}"
          onclick={() => { openPanel('export'); closeMenus(); }}
          disabled={!projectStore.isLoaded}
          role="menuitem"
        >
          Export Manuscript
        </button>
      </div>
    {/if}
  </div>

  <!-- Edit Menu -->
  <div class="relative">
    <button
      class="rounded px-2.5 py-1 text-white/60 hover:bg-white/10 hover:text-white/90"
      onclick={(e) => { e.stopPropagation(); toggleMenu('edit'); }}
    >
      Edit
    </button>

    {#if openMenu === 'edit'}
      <div
        class="absolute left-0 top-full z-50 mt-0.5 min-w-44 rounded-md border border-[#252525] bg-surface-800 py-1 shadow-lg"
        role="menu"
        tabindex="-1"
        onkeydown={(e) => { if (e.key === 'Escape') closeMenus(); }}
        onclick={(e) => e.stopPropagation()}
      >
        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90"
          onclick={() => { window.dispatchEvent(new CustomEvent('actone:format-document')); closeMenus(); }}
          role="menuitem"
        >
          <span>Format Document</span>
          <span class="text-[10px] text-white/30">Ctrl+Shift+F</span>
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
        class="absolute left-0 top-full z-50 mt-0.5 min-w-48 rounded-md border border-[#252525] bg-surface-800 py-1 shadow-lg"
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
          <span class="flex items-center gap-2">
            <span class="text-[10px] text-white/30">Ctrl+B</span>
            {#if uiStore.sidebarVisible}
              <span class="text-[10px] text-amber-400">&check;</span>
            {/if}
          </span>
        </button>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90"
          onclick={() => { window.dispatchEvent(new CustomEvent('actone:toggle-word-wrap')); closeMenus(); }}
          role="menuitem"
        >
          <span>Word Wrap</span>
          <span class="flex items-center gap-2">
            <span class="text-[10px] text-white/30">Alt+Z</span>
            {#if wordWrapEnabled}
              <span class="text-[10px] text-amber-400">&check;</span>
            {/if}
          </span>
        </button>

        <div class="my-1 border-t border-[#252525]"></div>

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90"
          onclick={() => { handleResetLayout(); closeMenus(); }}
          role="menuitem"
        >
          Reset Layout
        </button>

        <div class="my-1 border-t border-[#252525]"></div>

        <div class="px-3 py-1 text-[10px] uppercase tracking-wider text-white/30">
          Diagrams
        </div>

        {#each diagramViews as view}
          <button
            class="flex w-full items-center justify-between px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90"
            onclick={() => { uiStore.setDiagramView(view.id); openPanel(diagramPanelMap[view.id]); closeMenus(); }}
            role="menuitem"
          >
            <span>{view.label}</span>
            {#if uiStore.activeDiagramView === view.id}
              <span class="text-[10px] text-amber-400">&bull;</span>
            {/if}
          </button>
        {/each}

        <div class="my-1 border-t border-[#252525]"></div>

        <div class="px-3 py-1 text-[10px] uppercase tracking-wider text-white/30">
          Reference
        </div>

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90"
          onclick={() => { openPanel('story-bible'); closeMenus(); }}
          role="menuitem"
        >
          Story Bible
        </button>

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90"
          onclick={() => { openPanel('statistics'); closeMenus(); }}
          role="menuitem"
        >
          Statistics
        </button>

        <div class="my-1 border-t border-[#252525]"></div>

        <div class="px-3 py-1 text-[10px] uppercase tracking-wider text-white/30">
          Preview
        </div>

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90"
          onclick={() => { openPanel('reading-mode'); closeMenus(); }}
          role="menuitem"
        >
          Reading Mode
        </button>

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-white/70 hover:bg-white/10 hover:text-white/90"
          onclick={() => { openPanel('spread-preview'); closeMenus(); }}
          role="menuitem"
        >
          Spread Preview
        </button>
      </div>
    {/if}
  </div>

  <!-- Run Menu -->
  <div class="relative">
    <button
      class="rounded px-2.5 py-1 text-white/60 hover:bg-white/10 hover:text-white/90"
      onclick={(e) => { e.stopPropagation(); toggleMenu('run'); }}
    >
      Run
    </button>

    {#if openMenu === 'run'}
      <div
        class="absolute left-0 top-full z-50 mt-0.5 min-w-44 rounded-md border border-[#252525] bg-surface-800 py-1 shadow-lg"
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
          onclick={() => { openPanel('gallery'); closeMenus(); }}
          disabled={!projectStore.isLoaded}
          role="menuitem"
        >
          Visual Assets
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
        class="absolute left-0 top-full z-50 mt-0.5 min-w-44 rounded-md border border-[#252525] bg-surface-800 py-1 shadow-lg"
        role="menu"
        tabindex="-1"
        onkeydown={(e) => { if (e.key === 'Escape') closeMenus(); }}
        onclick={(e) => e.stopPropagation()}
      >
        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-white/30 cursor-not-allowed opacity-50"
          disabled
          role="menuitem"
        >
          <span>User's Guide</span>
          <span class="text-[9px] rounded bg-white/10 px-1.5 py-0.5 text-white/40">Coming Soon</span>
        </button>

        <div class="my-1 border-t border-[#252525]"></div>

        <div class="px-3 py-1 text-[10px] uppercase tracking-wider text-white/30">
          Keyboard Shortcuts
        </div>

        <div class="px-3 py-1.5 text-[11px] text-white/40">
          <div class="flex justify-between"><span>Save</span><span>Ctrl+S</span></div>
          <div class="flex justify-between"><span>Open Project</span><span>Ctrl+O</span></div>
          <div class="flex justify-between"><span>Generate Prose</span><span>Ctrl+G</span></div>
          <div class="flex justify-between"><span>Toggle Sidebar</span><span>Ctrl+B</span></div>
          <div class="flex justify-between"><span>Word Wrap</span><span>Alt+Z</span></div>
          <div class="flex justify-between"><span>Format Document</span><span>Ctrl+Shift+F</span></div>
          <div class="flex justify-between"><span>Diagram 1–5</span><span>Ctrl+1–5</span></div>
        </div>
      </div>
    {/if}
  </div>
</nav>
