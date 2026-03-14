<script lang="ts">
  /**
   * T059: Menu bar with File, Edit, View, Run, Help menus.
   */
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { projectStore } from '$lib/stores/project.svelte.js';
  import { uiStore } from '$lib/stores/ui.svelte.js';
  import type { DiagramView } from '$lib/stores/ui.svelte.js';
  import { parseAppearancePrefs } from '$lib/settings/appearance.js';
  import { openPanel, togglePanel, getDockApi } from '$lib/dockview/panel-actions.js';
  import { clearLayout } from '$lib/dockview/layout-persistence.js';
  import { applyDefaultLayout } from '$lib/dockview/default-layout.js';
  import { getDocPanelState } from '$lib/stores/doc-panel.svelte.js';
  import { getValidTargets, getStageLabel } from '$lib/project/lifecycle.js';
  import type { LifecycleStage } from '@actone/shared';

  interface Props {
    oncreateproject?: () => void;
    oncreatefile?: () => void;
    onadvancestage?: (target: LifecycleStage) => void;
    onsnapshot?: () => void;
    ongenerate?: () => void;
  }

  let { oncreateproject, oncreatefile, onadvancestage, onsnapshot, ongenerate }: Props = $props();

  let openMenu = $state<string | null>(null);
  let openSubmenu = $state<string | null>(null);
  let wordWrapEnabled = $state(false);
  let autoSaveEnabled = $state(true);

  onMount(() => {
    // Read initial word wrap state
    const prefs = parseAppearancePrefs(localStorage.getItem('actone:appearance'));
    wordWrapEnabled = prefs.wordWrap;

    // Read initial auto-save state
    const savedAutoSave = localStorage.getItem('actone:auto-save');
    autoSaveEnabled = savedAutoSave !== 'false';

    function handleWordWrapChanged(e: Event) {
      const detail = (e as CustomEvent<{ wordWrap: boolean }>).detail;
      wordWrapEnabled = detail.wordWrap;
    }

    function handleAutoSaveChanged(e: Event) {
      const detail = (e as CustomEvent<{ autoSave: boolean }>).detail;
      autoSaveEnabled = detail.autoSave;
    }

    window.addEventListener('actone:word-wrap-changed', handleWordWrapChanged);
    window.addEventListener('actone:auto-save-changed', handleAutoSaveChanged);

    return () => {
      window.removeEventListener('actone:word-wrap-changed', handleWordWrapChanged);
      window.removeEventListener('actone:auto-save-changed', handleAutoSaveChanged);
    };
  });

  function toggleMenu(name: string) {
    openMenu = openMenu === name ? null : name;
    openSubmenu = null;
  }

  function closeMenus() {
    openMenu = null;
    openSubmenu = null;
  }

  function toggleAutoSave() {
    autoSaveEnabled = !autoSaveEnabled;
    localStorage.setItem('actone:auto-save', String(autoSaveEnabled));
    window.dispatchEvent(new CustomEvent('actone:auto-save-changed', { detail: { autoSave: autoSaveEnabled } }));
  }

  async function downloadProject() {
    const project = projectStore.project;
    if (!project) return;

    const res = await fetch(`/api/project/${project.id}/download`);
    if (!res.ok) return;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = res.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1]
      ?? `${project.title}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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

  function isPanelOpen(panelId: string): boolean {
    const api = getDockApi();
    if (!api) return false;
    try {
      return !!api.getPanel(panelId);
    } catch {
      return false;
    }
  }

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
      class="rounded px-2.5 py-1 text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
      onclick={(e) => { e.stopPropagation(); toggleMenu('file'); }}
    >
      File
    </button>

    {#if openMenu === 'file'}
      <div
        class="absolute left-0 top-full z-50 mt-0.5 min-w-52 rounded-md border border-border bg-surface-800 py-1 shadow-lg"
        role="menu"
        tabindex="-1"
        onkeydown={(e) => { if (e.key === 'Escape') closeMenus(); }}
        onclick={(e) => e.stopPropagation()}
      >
        <!-- New File / New Project -->
        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary {!projectStore.isLoaded ? 'cursor-not-allowed opacity-30' : ''}"
          onclick={() => { oncreatefile?.(); closeMenus(); }}
          onmouseenter={() => { openSubmenu = null; }}
          disabled={!projectStore.isLoaded}
          role="menuitem"
        >
          <span>New File...</span>
          <span class="text-[10px] text-text-muted">Ctrl+N</span>
        </button>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { oncreateproject?.(); closeMenus(); }}
          onmouseenter={() => { openSubmenu = null; }}
          role="menuitem"
        >
          <span>New Project...</span>
          <span class="text-[10px] text-text-muted">Ctrl+Shift+N</span>
        </button>

        <div class="my-1 border-t border-border"></div>

        <!-- Open Project / Open Recent -->
        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { window.dispatchEvent(new CustomEvent('actone:open-project')); closeMenus(); }}
          onmouseenter={() => { openSubmenu = null; }}
          role="menuitem"
        >
          <span>Open Project...</span>
          <span class="text-[10px] text-text-muted">Ctrl+O</span>
        </button>

        <!-- Open Recent submenu -->
        <div
          class="relative"
          onmouseenter={() => { openSubmenu = 'recent'; }}
          onmouseleave={() => { openSubmenu = openSubmenu === 'recent' ? null : openSubmenu; }}
          role="none"
        >
          <button
            class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
            role="menuitem"
          >
            <span>Open Recent</span>
            <span class="text-[10px] text-text-muted">&#9656;</span>
          </button>

          {#if openSubmenu === 'recent'}
            <div
              class="absolute left-full top-0 z-50 ml-0.5 min-w-44 rounded-md border border-border bg-surface-800 py-1 shadow-lg"
              role="menu"
            >
              <p class="px-3 py-1.5 text-text-muted italic">No recent projects</p>

              <div class="my-1 border-t border-border"></div>

              <button
                class="flex w-full items-center px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
                onclick={() => { window.dispatchEvent(new CustomEvent('actone:clear-recent')); closeMenus(); }}
                role="menuitem"
              >
                Clear Recently Opened...
              </button>
            </div>
          {/if}
        </div>

        <div class="my-1 border-t border-border"></div>

        <!-- Save / Save As / Save All -->
        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary {!projectStore.isLoaded ? 'cursor-not-allowed opacity-30' : ''}"
          onclick={() => { window.dispatchEvent(new CustomEvent('actone:save-file')); closeMenus(); }}
          onmouseenter={() => { openSubmenu = null; }}
          disabled={!projectStore.isLoaded}
          role="menuitem"
        >
          <span>Save</span>
          <span class="text-[10px] text-text-muted">Ctrl+S</span>
        </button>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary {!projectStore.isLoaded ? 'cursor-not-allowed opacity-30' : ''}"
          onclick={() => { window.dispatchEvent(new CustomEvent('actone:save-file-as')); closeMenus(); }}
          onmouseenter={() => { openSubmenu = null; }}
          disabled={!projectStore.isLoaded}
          role="menuitem"
        >
          <span>Save As...</span>
          <span class="text-[10px] text-text-muted">Ctrl+Shift+S</span>
        </button>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary {!projectStore.isLoaded ? 'cursor-not-allowed opacity-30' : ''}"
          onclick={() => { window.dispatchEvent(new CustomEvent('actone:save-all')); closeMenus(); }}
          onmouseenter={() => { openSubmenu = null; }}
          disabled={!projectStore.isLoaded}
          role="menuitem"
        >
          <span>Save All</span>
          <span class="text-[10px] text-text-muted">Ctrl+K S</span>
        </button>

        <div class="my-1 border-t border-border"></div>

        <!-- Download Project -->
        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary {!projectStore.isLoaded ? 'cursor-not-allowed opacity-30' : ''}"
          onclick={() => { void downloadProject(); closeMenus(); }}
          onmouseenter={() => { openSubmenu = null; }}
          disabled={!projectStore.isLoaded}
          role="menuitem"
        >
          <span>Download Project (.zip)</span>
        </button>

        <div class="my-1 border-t border-border"></div>

        <!-- Auto Save -->
        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { toggleAutoSave(); closeMenus(); }}
          onmouseenter={() => { openSubmenu = null; }}
          role="menuitem"
        >
          <span>Auto Save</span>
          {#if autoSaveEnabled}
            <span class="text-[10px] text-amber-400">&check;</span>
          {/if}
        </button>

        <!-- Preferences submenu -->
        <div
          class="relative"
          onmouseenter={() => { openSubmenu = 'preferences'; }}
          onmouseleave={() => { openSubmenu = openSubmenu === 'preferences' ? null : openSubmenu; }}
          role="none"
        >
          <button
            class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
            role="menuitem"
          >
            <span>Preferences</span>
            <span class="text-[10px] text-text-muted">&#9656;</span>
          </button>

          {#if openSubmenu === 'preferences'}
            <div
              class="absolute left-full top-0 z-50 ml-0.5 min-w-48 rounded-md border border-border bg-surface-800 py-1 shadow-lg"
              role="menu"
            >
              <button
                class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
                onclick={() => { void goto('/settings/appearance'); closeMenus(); }}
                role="menuitem"
              >
                <span>Settings</span>
                <span class="text-[10px] text-text-muted">Ctrl+,</span>
              </button>

              <button
                class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
                onclick={() => { window.dispatchEvent(new CustomEvent('actone:open-keybindings')); closeMenus(); }}
                role="menuitem"
              >
                <span>Keyboard Shortcuts</span>
                <span class="text-[10px] text-text-muted">Ctrl+K Ctrl+S</span>
              </button>
            </div>
          {/if}
        </div>

        <div class="my-1 border-t border-border"></div>

        <!-- Exit -->
        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { window.close(); closeMenus(); }}
          onmouseenter={() => { openSubmenu = null; }}
          role="menuitem"
        >
          Exit
        </button>
      </div>
    {/if}
  </div>

  <!-- Edit Menu -->
  <div class="relative">
    <button
      class="rounded px-2.5 py-1 text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
      onclick={(e) => { e.stopPropagation(); toggleMenu('edit'); }}
    >
      Edit
    </button>

    {#if openMenu === 'edit'}
      <div
        class="absolute left-0 top-full z-50 mt-0.5 min-w-48 rounded-md border border-border bg-surface-800 py-1 shadow-lg"
        role="menu"
        tabindex="-1"
        onkeydown={(e) => { if (e.key === 'Escape') closeMenus(); }}
        onclick={(e) => e.stopPropagation()}
      >
        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { document.execCommand('undo'); closeMenus(); }}
          role="menuitem"
        >
          <span>Undo</span>
          <span class="text-[10px] text-text-muted">Ctrl+Z</span>
        </button>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { document.execCommand('redo'); closeMenus(); }}
          role="menuitem"
        >
          <span>Redo</span>
          <span class="text-[10px] text-text-muted">Ctrl+Y</span>
        </button>

        <div class="my-1 border-t border-border"></div>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { document.execCommand('cut'); closeMenus(); }}
          role="menuitem"
        >
          <span>Cut</span>
          <span class="text-[10px] text-text-muted">Ctrl+X</span>
        </button>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { document.execCommand('copy'); closeMenus(); }}
          role="menuitem"
        >
          <span>Copy</span>
          <span class="text-[10px] text-text-muted">Ctrl+C</span>
        </button>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { document.execCommand('paste'); closeMenus(); }}
          role="menuitem"
        >
          <span>Paste</span>
          <span class="text-[10px] text-text-muted">Ctrl+V</span>
        </button>

        <div class="my-1 border-t border-border"></div>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { window.dispatchEvent(new CustomEvent('actone:format-document')); closeMenus(); }}
          role="menuitem"
        >
          <span>Format Document</span>
          <span class="text-[10px] text-text-muted">Ctrl+Shift+F</span>
        </button>

        <div class="my-1 border-t border-border"></div>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { window.dispatchEvent(new CustomEvent('actone:find')); closeMenus(); }}
          role="menuitem"
        >
          <span>Find</span>
          <span class="text-[10px] text-text-muted">Ctrl+F</span>
        </button>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { window.dispatchEvent(new CustomEvent('actone:replace')); closeMenus(); }}
          role="menuitem"
        >
          <span>Replace</span>
          <span class="text-[10px] text-text-muted">Ctrl+H</span>
        </button>

        <div class="my-1 border-t border-border"></div>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { window.dispatchEvent(new CustomEvent('actone:find-in-files')); closeMenus(); }}
          role="menuitem"
        >
          <span>Find in Files</span>
          <span class="text-[10px] text-text-muted">Ctrl+Shift+F</span>
        </button>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { window.dispatchEvent(new CustomEvent('actone:replace-in-files')); closeMenus(); }}
          role="menuitem"
        >
          <span>Replace in Files</span>
          <span class="text-[10px] text-text-muted">Ctrl+Shift+H</span>
        </button>
      </div>
    {/if}
  </div>

  <!-- View Menu -->
  <div class="relative">
    <button
      class="rounded px-2.5 py-1 text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
      onclick={(e) => { e.stopPropagation(); toggleMenu('view'); }}
    >
      View
    </button>

    {#if openMenu === 'view'}
      <div
        class="absolute left-0 top-full z-50 mt-0.5 min-w-48 rounded-md border border-border bg-surface-800 py-1 shadow-lg"
        role="menu"
        tabindex="-1"
        onkeydown={(e) => { if (e.key === 'Escape') closeMenus(); }}
        onclick={(e) => e.stopPropagation()}
      >
        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { uiStore.toggleSidebar(); closeMenus(); }}
          role="menuitem"
        >
          <span>Sidebar</span>
          <span class="flex items-center gap-2">
            <span class="text-[10px] text-text-muted">Ctrl+B</span>
            {#if uiStore.sidebarVisible}
              <span class="text-[10px] text-amber-400">&check;</span>
            {/if}
          </span>
        </button>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { uiStore.toggleStatusBar(); closeMenus(); }}
          role="menuitem"
        >
          <span>Status Bar</span>
          {#if uiStore.statusBarVisible}
            <span class="text-[10px] text-amber-400">&check;</span>
          {/if}
        </button>

        <div class="my-1 border-t border-border"></div>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { uiStore.toggleOutline(); closeMenus(); }}
          role="menuitem"
        >
          <span>Outline</span>
          {#if uiStore.outlineVisible}
            <span class="text-[10px] text-amber-400">&check;</span>
          {/if}
        </button>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { togglePanel('problems'); closeMenus(); }}
          role="menuitem"
        >
          <span>Problems</span>
          {#if isPanelOpen('problems')}
            <span class="text-[10px] text-amber-400">&check;</span>
          {/if}
        </button>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { togglePanel('output'); closeMenus(); }}
          role="menuitem"
        >
          <span>Output</span>
          {#if isPanelOpen('output')}
            <span class="text-[10px] text-amber-400">&check;</span>
          {/if}
        </button>

        <div class="my-1 border-t border-border"></div>

        <div class="px-3 py-1 text-[10px] uppercase tracking-wider text-text-muted">
          Diagrams
        </div>

        {#each diagramViews as view}
          <button
            class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
            onclick={() => { togglePanel(diagramPanelMap[view.id]); closeMenus(); }}
            role="menuitem"
          >
            <span>{view.label}</span>
            {#if isPanelOpen(diagramPanelMap[view.id])}
              <span class="text-[10px] text-amber-400">&check;</span>
            {/if}
          </button>
        {/each}

        <div class="my-1 border-t border-border"></div>

        <div class="px-3 py-1 text-[10px] uppercase tracking-wider text-text-muted">
          Reference
        </div>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { togglePanel('story-bible'); closeMenus(); }}
          role="menuitem"
        >
          <span>Story Bible</span>
          {#if isPanelOpen('story-bible')}
            <span class="text-[10px] text-amber-400">&check;</span>
          {/if}
        </button>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { togglePanel('statistics'); closeMenus(); }}
          role="menuitem"
        >
          <span>Statistics</span>
          {#if isPanelOpen('statistics')}
            <span class="text-[10px] text-amber-400">&check;</span>
          {/if}
        </button>

        <div class="my-1 border-t border-border"></div>

        <div class="px-3 py-1 text-[10px] uppercase tracking-wider text-text-muted">
          Preview
        </div>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { uiStore.toggleReadingMode(); closeMenus(); }}
          role="menuitem"
        >
          <span>Reading Mode</span>
          {#if uiStore.readingModeVisible}
            <span class="text-[10px] text-amber-400">&check;</span>
          {/if}
        </button>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { togglePanel('spread-preview'); closeMenus(); }}
          role="menuitem"
        >
          <span>Spread Preview</span>
          {#if isPanelOpen('spread-preview')}
            <span class="text-[10px] text-amber-400">&check;</span>
          {/if}
        </button>

        <div class="my-1 border-t border-border"></div>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { window.dispatchEvent(new CustomEvent('actone:toggle-word-wrap')); closeMenus(); }}
          role="menuitem"
        >
          <span>Word Wrap</span>
          <span class="flex items-center gap-2">
            <span class="text-[10px] text-text-muted">Alt+Z</span>
            {#if wordWrapEnabled}
              <span class="text-[10px] text-amber-400">&check;</span>
            {/if}
          </span>
        </button>

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { handleResetLayout(); closeMenus(); }}
          role="menuitem"
        >
          Reset Layout
        </button>
      </div>
    {/if}
  </div>

  <!-- Run Menu -->
  <div class="relative">
    <button
      class="rounded px-2.5 py-1 text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
      onclick={(e) => { e.stopPropagation(); toggleMenu('run'); }}
    >
      Run
    </button>

    {#if openMenu === 'run'}
      <div
        class="absolute left-0 top-full z-50 mt-0.5 min-w-48 rounded-md border border-border bg-surface-800 py-1 shadow-lg"
        role="menu"
        tabindex="-1"
        onkeydown={(e) => { if (e.key === 'Escape') closeMenus(); }}
        onclick={(e) => e.stopPropagation()}
      >
        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary {!projectStore.isLoaded ? 'cursor-not-allowed opacity-30' : ''}"
          onclick={() => { ongenerate?.(); closeMenus(); }}
          disabled={!projectStore.isLoaded}
          role="menuitem"
        >
          <span>Scene Prose</span>
          <span class="text-[10px] text-text-muted">Ctrl+G</span>
        </button>

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary {!projectStore.isLoaded ? 'cursor-not-allowed opacity-30' : ''}"
          onclick={() => { openPanel('gallery'); closeMenus(); }}
          disabled={!projectStore.isLoaded}
          role="menuitem"
        >
          Visual Assets
        </button>

        <div class="my-1 border-t border-border"></div>

        {#if projectStore.isLoaded && validTargets.length > 0}
          <div class="px-3 py-1 text-[10px] uppercase tracking-wider text-text-muted">
            Advance Stage
          </div>
          {#each validTargets as target}
            <button
              class="flex w-full items-center px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
              onclick={() => { onadvancestage?.(target); closeMenus(); }}
              role="menuitem"
            >
              &rarr; {getStageLabel(target)}
            </button>
          {/each}
        {/if}

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary {!projectStore.isLoaded ? 'cursor-not-allowed opacity-30' : ''}"
          onclick={() => { onsnapshot?.(); closeMenus(); }}
          disabled={!projectStore.isLoaded}
          role="menuitem"
        >
          Take Snapshot
        </button>

        <div class="my-1 border-t border-border"></div>

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary {!projectStore.isLoaded ? 'cursor-not-allowed opacity-30' : ''}"
          onclick={() => { openPanel('export'); closeMenus(); }}
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
      class="rounded px-2.5 py-1 text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
      onclick={(e) => { e.stopPropagation(); toggleMenu('help'); }}
    >
      Help
    </button>

    {#if openMenu === 'help'}
      <div
        class="absolute left-0 top-full z-50 mt-0.5 min-w-56 rounded-md border border-border bg-surface-800 py-1 shadow-lg"
        role="menu"
        tabindex="-1"
        onkeydown={(e) => { if (e.key === 'Escape') closeMenus(); }}
        onclick={(e) => e.stopPropagation()}
      >
        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { window.dispatchEvent(new CustomEvent('actone:welcome')); closeMenus(); }}
          role="menuitem"
        >
          Welcome
        </button>

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { getDocPanelState().openDoc('getting-started/01-introduction'); closeMenus(); }}
          role="menuitem"
        >
          User's Guide
        </button>

        <div class="my-1 border-t border-border"></div>

        <button
          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { window.dispatchEvent(new CustomEvent('actone:keyboard-shortcuts-ref')); closeMenus(); }}
          role="menuitem"
        >
          <span>Keyboard Shortcuts Reference</span>
          <span class="text-[10px] text-text-muted">Ctrl+K Ctrl+R</span>
        </button>

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { window.dispatchEvent(new CustomEvent('actone:video-tutorials')); closeMenus(); }}
          role="menuitem"
        >
          Video Tutorials
        </button>

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { window.dispatchEvent(new CustomEvent('actone:tips-and-tricks')); closeMenus(); }}
          role="menuitem"
        >
          Tips and Tricks
        </button>

        <div class="my-1 border-t border-border"></div>

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { window.dispatchEvent(new CustomEvent('actone:report-issue')); closeMenus(); }}
          role="menuitem"
        >
          Report Issue
        </button>

        <div class="my-1 border-t border-border"></div>

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { window.dispatchEvent(new CustomEvent('actone:view-license')); closeMenus(); }}
          role="menuitem"
        >
          View License
        </button>

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { window.dispatchEvent(new CustomEvent('actone:privacy-statement')); closeMenus(); }}
          role="menuitem"
        >
          Privacy Statement
        </button>

        <div class="my-1 border-t border-border"></div>

        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
          onclick={() => { window.dispatchEvent(new CustomEvent('actone:about')); closeMenus(); }}
          role="menuitem"
        >
          About
        </button>
      </div>
    {/if}
  </div>
</nav>
