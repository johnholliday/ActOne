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
  import { editorStore } from '$lib/stores/editor.svelte.js';
  import { astStore } from '$lib/stores/ast.svelte.js';
  import { projectStore } from '$lib/stores/project.svelte.js';
  import { saveFileContent } from '$lib/editor/supabase-client.js';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
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

  const activeFileName = $derived(projectStore.entryFile?.filePath ?? 'model.actone');

  const editorUri = $derived(
    projectStore.entryFile ? `file:///${projectStore.entryFile.filePath}` : 'inmemory://model.actone',
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
</script>

<div class="flex h-full w-full flex-col overflow-hidden">
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
