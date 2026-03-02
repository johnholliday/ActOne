<script lang="ts">
  /**
   * Editor panel: CodeMirror editor with toolbar, save orchestration,
   * and symbol refresh. Extracted from +page.svelte for dockview.
   */
  import { onMount } from 'svelte';
  import { untrack } from 'svelte';
  import type { DockviewPanelApi, DockviewApi } from 'dockview-core';
  import type { Writable } from 'svelte/store';
  import EditorPane from '$lib/editor/EditorPane.svelte';
  import OutlinePanel from '$lib/panels/OutlinePanel.svelte';
  import { editorStore } from '$lib/stores/editor.svelte.js';
  import { astStore } from '$lib/stores/ast.svelte.js';
  import { uiStore } from '$lib/stores/ui.svelte.js';
  import { projectStore } from '$lib/stores/project.svelte.js';
  import { saveFileContent, loadFileContent } from '$lib/editor/supabase-client.js';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import EditorTabBar from '$lib/components/EditorTabBar.svelte';
  import BreadcrumbBar from '$lib/components/BreadcrumbBar.svelte';
  import type { DocumentSymbol } from '$lib/editor/langium-client.js';
  import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
  import { page } from '$app/state';

  interface Props {
    api: DockviewPanelApi;
    containerApi: DockviewApi;
    title: string;
    panelParams: Writable<Record<string, unknown>>;
  }

  let { api, containerApi, title, panelParams }: Props = $props();

  /* ── State ─────────────────────────────────────────────────────── */

  let editorPane = $state<EditorPane | undefined>(undefined);
  let switchingTab = false;

  /* ── Outline resize ──────────────────────────────────────── */

  let resizingOutline = $state(false);
  let outlineContainerEl: HTMLDivElement | undefined = $state(undefined);

  function handleOutlineMouseDown(e: MouseEvent) {
    e.preventDefault();
    resizingOutline = true;
    const onMouseMove = (ev: MouseEvent) => {
      if (!outlineContainerEl) return;
      const rect = outlineContainerEl.getBoundingClientRect();
      uiStore.resizeOutline(ev.clientX - rect.left);
    };
    const onMouseUp = () => {
      resizingOutline = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  /* ── Register entry file with editor store ────────────────── */

  let entryFileOpened = false; // plain variable, NOT $state — no reactive tracking

  $effect(() => {
    const entry = projectStore.entryFile;
    if (entry && !entryFileOpened) {
      entryFileOpened = true;
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

  const editorContent = $derived.by(() => {
    const entry = projectStore.entryFile;
    if (entry?.content) return entry.content;
    if (projectStore.isLoaded) {
      return `story "${projectStore.project?.title ?? 'Untitled Story'}" {\n}\n`;
    }
    return `story "Untitled Story" {\n}\n`;
  });

  const activeFileName = $derived(editorStore.activeFile?.filePath ?? 'model.actone');

  const editorUri = $derived(
    editorStore.activeFile ? `file:///${editorStore.activeFile.filePath}` : 'inmemory://model.actone',
  );

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
      fileOrder: projectStore.files
        .filter((f) => !f.isEntry)
        .map((f, i) => ({
          uri: `file:///${f.filePath}`,
          priority: i + 1,
        })),
    };
  });

  const cursor = $derived(editorStore.cursor);

  /* ── Handlers ──────────────────────────────────────────────────── */

  let symbols = $state<DocumentSymbol[]>([]);

  function handleChange(_content: string) {
    if (switchingTab) return;

    if (editorStore.activeFileId) {
      editorStore.markDirty(editorStore.activeFileId);
    }

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
        // Dispatch for the OutlinePanel
        window.dispatchEvent(
          new CustomEvent('actone:symbols-updated', { detail: { symbols } }),
        );
      } catch {
        // Silently ignore
      }
    }, 600);
  }

  async function handleFormat() {
    await editorPane?.format?.();
  }

  /* ── Tab switching ───────────────────────────────────────── */

  async function handleSwitchTab(fileId: string) {
    if (fileId === editorStore.activeFileId) return;

    // Save current content to buffer
    const content = editorPane?.getText?.();
    if (editorStore.activeFileId && content != null) {
      editorStore.setBuffer(editorStore.activeFileId, content);
    }

    // Switch active file in store
    editorStore.setActiveFile(fileId);

    // Load content from buffer, project store, or Supabase
    let newContent = editorStore.getBuffer(fileId);
    if (newContent == null) {
      const fileEntry = projectStore.files.find((f) => f.id === fileId);
      if (fileEntry?.content != null) {
        newContent = fileEntry.content;
      } else {
        const supabase = page.data?.supabase;
        if (supabase) {
          const loaded = await loadFileContent(supabase, fileId);
          newContent = loaded?.content ?? '';
        } else {
          newContent = '';
        }
      }
      editorStore.setBuffer(fileId, newContent);
    }

    // Switch document in CodeMirror (suppress handleChange during setDocument)
    const filePath = editorStore.openFiles.find((f) => f.id === fileId)?.filePath ?? 'unknown.actone';
    switchingTab = true;
    editorPane?.setDocument?.(`file:///${filePath}`, newContent);
    switchingTab = false;

    // Refresh symbols
    refreshSymbols();
  }

  async function handleCloseTab(fileId: string) {
    if (editorStore.openFiles.length <= 1) return;
    const file = editorStore.openFiles.find((f) => f.id === fileId);
    if (file?.isDirty) {
      if (!confirm(`Discard changes to ${file.filePath}?`)) return;
    }

    const wasActive = fileId === editorStore.activeFileId;

    if (wasActive) {
      // Switch to next file BEFORE closing, so handleSwitchTab
      // properly buffers current content and loads the target
      const remaining = editorStore.openFiles.filter((f) => f.id !== fileId);
      const nextFileId = remaining[0]?.id;
      if (nextFileId) {
        await handleSwitchTab(nextFileId);
      }
    }

    // Now close — activeFileId already points elsewhere, so close()
    // won't interfere with the switch
    editorStore.close(fileId);
  }

  /* ── Save & open-file event listeners ────────────────────── */

  onMount(() => {
    function onSaveFile() {
      handleManualSave();
    }

    function handleOpenFile(e: Event) {
      const { id, filePath } = (e as CustomEvent).detail;
      editorStore.ensure({ id, filePath });
      void handleSwitchTab(id);
    }

    function handleOutlineNavigate(e: Event) {
      const { line, character } = (e as CustomEvent<{ line: number; character: number }>).detail;
      editorPane?.revealPosition?.(line, character);
    }

    function handleDiagnosticsReady() {
      refreshSymbols();
    }

    function handleRequestSymbols() {
      // Re-dispatch current symbols so the outline can populate on mount
      if (symbols.length > 0) {
        window.dispatchEvent(
          new CustomEvent('actone:symbols-updated', { detail: { symbols } }),
        );
      } else {
        // No cached symbols — trigger a fresh refresh
        refreshSymbols();
      }
    }

    function handleRenameActiveFile(e: Event) {
      const { filePath } = (e as CustomEvent<{ filePath: string }>).detail;
      const currentContent = editorPane?.getText?.() ?? '';
      editorPane?.setDocument?.(`file:///${filePath}`, currentContent);
      refreshSymbols();
    }

    window.addEventListener('actone:save-file', onSaveFile);
    window.addEventListener('actone:open-file', handleOpenFile);
    window.addEventListener('actone:outline-navigate', handleOutlineNavigate);
    window.addEventListener('actone:diagnostics-ready', handleDiagnosticsReady);
    window.addEventListener('actone:request-symbols', handleRequestSymbols);
    window.addEventListener('actone:rename-active-file', handleRenameActiveFile);

    return () => {
      window.removeEventListener('actone:save-file', onSaveFile);
      window.removeEventListener('actone:open-file', handleOpenFile);
      window.removeEventListener('actone:outline-navigate', handleOutlineNavigate);
      window.removeEventListener('actone:diagnostics-ready', handleDiagnosticsReady);
      window.removeEventListener('actone:request-symbols', handleRequestSymbols);
      window.removeEventListener('actone:rename-active-file', handleRenameActiveFile);
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
  });
</script>

<div class="flex h-full w-full overflow-hidden" data-editor-panel>
  <!-- Outline sidebar (inside editor panel, left of editor area) -->
  {#if uiStore.outlineVisible}
    <div
      bind:this={outlineContainerEl}
      class="flex shrink-0 border-r border-[#252525]"
      style="width: {uiStore.outlineWidth}px;"
    >
      <div class="flex-1 overflow-hidden">
        <OutlinePanel />
      </div>
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div
        class="w-1 cursor-col-resize bg-transparent hover:bg-amber-500/30 {resizingOutline ? 'bg-amber-500/50' : ''}"
        role="separator"
        tabindex="-1"
        onmousedown={handleOutlineMouseDown}
      ></div>
    </div>
  {/if}

  <!-- Editor area (tabs + breadcrumb + code editor) -->
  <div class="flex flex-1 flex-col overflow-hidden">
    {#if editorStore.openFiles.length > 0}
      <EditorTabBar
        onswitchtab={handleSwitchTab}
        onclosetab={handleCloseTab}
        onformat={handleFormat}
      />
      <BreadcrumbBar {symbols} {cursor} fileName={activeFileName} />
    {/if}

    <!-- CodeMirror Editor -->
    <div class="flex-1 overflow-hidden">
      {#if projectStore.loading}
        <div class="flex h-full items-center justify-center">
          <LoadingSpinner label="Loading project..." />
        </div>
      {:else if editorStore.openFiles.length === 0}
        <div class="flex h-full items-center justify-center">
          <EmptyState
            message="No file open"
            description="Open a project or file to start editing."
          />
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
</div>
