<script lang="ts">
  import { onMount } from 'svelte';
  import { untrack } from 'svelte';
  import EditorPane from '$lib/editor/EditorPane.svelte';
  import { editorStore } from '$lib/stores/editor.svelte.js';
  import { astStore } from '$lib/stores/ast.svelte.js';
  import { uiStore } from '$lib/stores/ui.svelte.js';
  import { projectStore } from '$lib/stores/project.svelte.js';
  import { saveFileContent } from '$lib/editor/supabase-client.js';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import type { DocumentSymbol } from '$lib/editor/langium-client.js';
  import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
  import { page } from '$app/state';

  /* ── State ─────────────────────────────────────────────────────── */

  let editorPane = $state<EditorPane | undefined>(undefined);
  let symbols = $state<DocumentSymbol[]>([]);
  let activeTab = $state<'diagnostics' | 'output' | 'outline'>('diagnostics');
  let resizingOutline = $state(false);

  /* ── Register entry file with editor store ────────────────── */

  $effect(() => {
    const entry = projectStore.entryFile;
    if (entry) {
      untrack(() => editorStore.open({ id: entry.id, filePath: entry.filePath }));
    }
  });

  /* ── Save orchestration ──────────────────────────────────── */

  const AUTO_SAVE_DELAY_MS = 3000;
  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  let isSaving = false;
  let contentChangedDuringSave = false;

  async function performSave() {
    const fileId = editorStore.activeFileId;
    if (!fileId || isSaving) return;

    const content = editorPane?.getText?.();
    if (content == null) return;

    isSaving = true;
    contentChangedDuringSave = false;
    editorStore.setSaveStatus('saving');

    try {
      const supabase = page.data?.supabase;
      if (!supabase) throw new Error('No supabase client');

      const ok = await saveFileContent(supabase, fileId, content);
      if (!ok) throw new Error('Save failed');

      editorStore.markClean(fileId);
      editorStore.setSaveStatus('saved');

      // Fade back to idle after 2 seconds
      setTimeout(() => {
        if (editorStore.saveStatus === 'saved') {
          editorStore.setSaveStatus('idle');
        }
      }, 2000);
    } catch (err) {
      console.error('[ActOne] Save failed:', err);
      editorStore.setSaveStatus('error');
    } finally {
      isSaving = false;
      if (contentChangedDuringSave) {
        scheduleAutoSave();
      }
    }
  }

  function scheduleAutoSave() {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      void performSave();
    }, AUTO_SAVE_DELAY_MS);
  }

  function handleManualSave() {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    void performSave();
  }

  /** T010: Load content from the active project's entry file, or fall back to sample */
  const editorContent = $derived.by(() => {
    const entry = projectStore.entryFile;
    if (entry?.content) return entry.content;
    if (projectStore.isLoaded) {
      return `story "${projectStore.project?.title ?? 'Untitled Story'}" {\n}\n`;
    }
    return `story "Untitled Story" {\n}\n`;
  });

  /** Track the active file name for the toolbar */
  const activeFileName = $derived(projectStore.entryFile?.filePath ?? 'model.actone');

  /** URI for the editor document — must match what the LSP workspace uses */
  const editorUri = $derived(
    projectStore.entryFile ? `file:///${projectStore.entryFile.filePath}` : 'inmemory://model.actone',
  );

  /* ── Project context for Langium workspace initialization ────── */

  const projectContext = $derived.by(() => {
    const project = projectStore.project;
    if (!project) return null;

    const session = page.data?.session;
    const authToken = session?.access_token ?? '';

    return {
      projectId: project.id,
      supabaseUrl: PUBLIC_SUPABASE_URL,
      supabaseAnonKey: PUBLIC_SUPABASE_ANON_KEY,
      authToken,
      compositionMode: project.compositionMode,
      // Exclude entry file — it's already opened via didOpen
      fileOrder: projectStore.files
        .filter((f) => !f.isEntry)
        .map((f, i) => ({
          uri: `file:///${f.filePath}`,
          priority: i + 1,
        })),
    };
  });

  /* ── Derived ───────────────────────────────────────────────────── */

  const diagnostics = $derived(astStore.activeUri ? astStore.getDiagnostics(astStore.activeUri) : []);
  const diagnosticCount = $derived(editorStore.diagnosticCount);
  const cursor = $derived(editorStore.cursor);

  /* ── Handlers ──────────────────────────────────────────────────── */

  function handleChange(_content: string) {
    if (editorStore.activeFileId) {
      editorStore.markDirty(editorStore.activeFileId);
    }

    // Flag that content changed during an in-flight save
    if (isSaving) {
      contentChangedDuringSave = true;
    } else {
      scheduleAutoSave();
    }

    // Refresh outline symbols after change settles
    refreshSymbols();
  }

  let symbolTimer: ReturnType<typeof setTimeout> | null = null;
  function refreshSymbols() {
    if (symbolTimer) clearTimeout(symbolTimer);
    symbolTimer = setTimeout(async () => {
      const client = editorPane?.getClient?.();
      if (!client?.isReady) return;
      try {
        const result = await client.documentSymbol(editorUri);
        symbols = result ?? [];
      } catch {
        // Silently ignore
      }
    }, 600);
  }

  async function handleFormat() {
    await editorPane?.format?.();
  }

  /* ── Save event listener ─────────────────────────────────── */

  onMount(() => {
    function onSaveFile() {
      handleManualSave();
    }
    window.addEventListener('actone:save-file', onSaveFile);
    return () => {
      window.removeEventListener('actone:save-file', onSaveFile);
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
  });

  /* ── Symbol Kind → Icon ────────────────────────────────────────── */

  function symbolKindLabel(kind: number): string {
    switch (kind) {
      case 5: return 'cls'; // Class → Story
      case 8: return 'fld'; // Field → Property
      case 23: return 'obj'; // Struct → Element
      default: return '•';
    }
  }

  function handleOutlineMouseDown(e: MouseEvent) {
    e.preventDefault();
    resizingOutline = true;
    const startX = e.clientX;
    const startWidth = uiStore.outlineWidth;
    const onMouseMove = (ev: MouseEvent) => {
      uiStore.resizeOutline(startWidth + (startX - ev.clientX));
    };
    const onMouseUp = () => {
      resizingOutline = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.dispatchEvent(new CustomEvent('actone:persist-layout'));
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }
</script>

<svelte:head>
  <title>ActOne Studio</title>
</svelte:head>

<div class="flex h-full w-full overflow-hidden">
  <!-- Editor area -->
  <div class="flex flex-1 flex-col overflow-hidden">
    <!-- Editor toolbar -->
    <div class="flex h-8 items-center gap-2 border-b border-white/10 bg-surface-850 px-3 text-xs text-white/60">
      <span class="font-medium text-white/80">{activeFileName}</span>
      {#if editorStore.saveStatus === 'saving'}
        <span class="text-amber-400">Saving...</span>
      {:else if editorStore.saveStatus === 'saved'}
        <span class="text-green-400">Saved</span>
      {:else if editorStore.saveStatus === 'error'}
        <span class="text-red-400">Save failed</span>
      {/if}
      <span class="ml-auto">
        Ln {cursor.line}, Col {cursor.column}
      </span>
      <button
        class="rounded px-2 py-0.5 text-white/50 hover:bg-white/10 hover:text-white/80"
        onclick={handleFormat}
      >
        Format
      </button>
    </div>

    <!-- CodeMirror Editor -->
    <div class="flex-1 overflow-hidden">
      {#if projectStore.loading}
        <div class="flex h-full items-center justify-center">
          <LoadingSpinner label="Loading project..." />
        </div>
      {:else}
        <EditorPane
          bind:this={editorPane}
          uri={editorUri}
          initialContent={editorContent}
          onchange={handleChange}
          {projectContext}
        />
      {/if}
    </div>
  </div>

  <!-- Outline panel (right side) — independent of sidebar -->
  {#if uiStore.outlineVisible && uiStore.outlineDockPosition === 'right'}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="w-1 cursor-col-resize bg-transparent hover:bg-amber-500/30 {resizingOutline ? 'bg-amber-500/50' : ''}"
      role="separator"
      tabindex="-1"
      onmousedown={handleOutlineMouseDown}
    ></div>
    <aside class="flex flex-col border-l border-white/10 bg-surface-850" style="width: {uiStore.outlineWidth}px;">
      <div class="flex h-8 items-center border-b border-white/10 px-3 text-xs font-semibold uppercase tracking-wider text-white/50">
        Outline
      </div>
      <div class="flex-1 overflow-y-auto p-2 text-xs">
        {@render outlineContent()}
      </div>
    </aside>
  {/if}
</div>

<!-- Bottom panel: Diagnostics -->
{#if uiStore.bottomPanelVisible}
  <div
    class="border-t border-white/10 bg-surface-850"
    style="height: {uiStore.bottomPanelHeight}px;"
  >
    <!-- Tab bar -->
    <div class="flex h-7 items-center border-b border-white/10 px-3 text-xs">
      <button
        class="mr-3 pb-0.5 {activeTab === 'diagnostics' ? 'border-b border-amber-400 text-white/90' : 'text-white/40 hover:text-white/60'}"
        onclick={() => (activeTab = 'diagnostics')}
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
      {#if uiStore.outlineVisible && uiStore.outlineDockPosition === 'bottom'}
        <button
          class="pb-0.5 {activeTab === 'outline' ? 'border-b border-amber-400 text-white/90' : 'text-white/40 hover:text-white/60'}"
          onclick={() => (activeTab = 'outline')}
        >
          Outline
        </button>
      {/if}
    </div>

    <!-- Panel content -->
    <div class="h-full overflow-y-auto px-3 py-1 text-xs font-mono">
      {#if activeTab === 'outline' && uiStore.outlineVisible && uiStore.outlineDockPosition === 'bottom'}
        <div class="font-sans">
          {@render outlineContent()}
        </div>
      {:else if activeTab === 'diagnostics'}
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
{/if}

{#snippet outlineContent()}
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
{/snippet}
