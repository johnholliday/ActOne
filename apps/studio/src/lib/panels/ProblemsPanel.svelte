<script lang="ts">
  /**
   * Problems panel: shows Langium diagnostics for ALL project files,
   * grouped by file. Clicking a diagnostic navigates to the position
   * in the editor, opening the file if necessary.
   */
  import type { DockviewPanelApi, DockviewApi } from 'dockview-core';
  import type { Writable } from 'svelte/store';
  import type { Diagnostic } from '$lib/editor/langium-client.js';
  import { astStore } from '$lib/stores/ast.svelte.js';
  import { editorStore } from '$lib/stores/editor.svelte.js';
  import { projectStore } from '$lib/stores/project.svelte.js';
  import ChevronRight from 'lucide-svelte/icons/chevron-right';

  interface Props {
    api: DockviewPanelApi;
    containerApi: DockviewApi;
    title: string;
    panelParams: Writable<Record<string, unknown>>;
  }

  let { api, containerApi, title, panelParams }: Props = $props();

  /* ── Derived data ─────────────────────────────────────────── */

  const fileDiagnostics = $derived(astStore.allFileDiagnostics);
  const totalCount = $derived(astStore.totalDiagnostics);
  const fileCount = $derived(fileDiagnostics.length);

  /* ── Collapse state per file URI ──────────────────────────── */

  let collapsed = $state<Record<string, boolean>>({});

  function toggleFile(uri: string) {
    collapsed = { ...collapsed, [uri]: !collapsed[uri] };
  }

  /* ── Helpers ──────────────────────────────────────────────── */

  /** Extract display filename from a file:///path URI */
  function displayName(uri: string): string {
    const path = uri.replace(/^file:\/\/\//, '');
    const parts = path.split('/');
    return parts[parts.length - 1] ?? path;
  }

  /** Resolve a URI to the project file entry */
  function resolveFileFromUri(uri: string): { id: string; filePath: string } | null {
    const filePath = uri.replace(/^file:\/\/\//, '');
    const file = projectStore.files.find((f) => f.filePath === filePath);
    return file ? { id: file.id, filePath: file.filePath } : null;
  }

  /* ── Navigation ───────────────────────────────────────────── */

  function navigateToDiagnostic(uri: string, line: number, character: number) {
    const activeUri = astStore.activeUri;

    if (uri === activeUri) {
      // Same file — navigate directly
      window.dispatchEvent(
        new CustomEvent('actone:outline-navigate', {
          detail: { line, character },
        }),
      );
      return;
    }

    // Different file — open it first, then navigate after a brief delay
    const file = resolveFileFromUri(uri);
    if (!file) return;

    window.dispatchEvent(
      new CustomEvent('actone:open-file', {
        detail: { id: file.id, filePath: file.filePath },
      }),
    );

    // Brief delay to let the file switch + CodeMirror init settle
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('actone:outline-navigate', {
          detail: { line, character },
        }),
      );
    }, 150);
  }
</script>

<div class="flex h-full w-full flex-col overflow-hidden bg-surface-850">
  <!-- Summary header -->
  <div class="flex h-7 shrink-0 items-center border-b border-border px-3">
    <span class="text-[10px] text-text-muted">
      {#if totalCount === 0}
        No problems detected
      {:else}
        {totalCount} {totalCount === 1 ? 'problem' : 'problems'} in {fileCount} {fileCount === 1 ? 'file' : 'files'}
      {/if}
    </span>
  </div>

  <!-- Diagnostic list -->
  <div class="flex-1 overflow-y-auto px-1 py-1 text-xs font-mono">
    {#if totalCount === 0}
      <p class="px-2 py-2 text-text-muted">No problems detected.</p>
    {:else}
      {#each fileDiagnostics as { uri, diagnostics }}
        <!-- File header -->
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
        <div
          class="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-[10px] font-semibold text-text-secondary hover:bg-surface-raised/20"
          onclick={() => toggleFile(uri)}
        >
          <ChevronRight
            size={10}
            class="shrink-0 transition-transform {collapsed[uri] ? '' : 'rotate-90'}"
          />
          <span class="truncate">{displayName(uri)}</span>
          <span class="ml-auto font-normal text-text-muted">({diagnostics.length})</span>
        </div>

        <!-- Diagnostics under this file -->
        {#if !collapsed[uri]}
          <ul class="mb-1">
            {#each diagnostics as d}
              <li>
                <button
                  class="flex w-full items-start gap-2 rounded px-2 py-0.5 pl-6 text-left hover:bg-surface-raised/20"
                  onclick={() => navigateToDiagnostic(uri, d.range.start.line, d.range.start.character)}
                >
                  <span class="shrink-0 {d.severity === 1 ? 'text-red-400' : d.severity === 2 ? 'text-yellow-400' : 'text-blue-400'}">
                    {d.severity === 1 ? '●' : d.severity === 2 ? '▲' : 'ℹ'}
                  </span>
                  <span class="flex-1 text-text-secondary">{d.message}</span>
                  <span class="shrink-0 text-text-muted">
                    [{d.range.start.line + 1}:{d.range.start.character + 1}]
                  </span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      {/each}
    {/if}
  </div>
</div>
