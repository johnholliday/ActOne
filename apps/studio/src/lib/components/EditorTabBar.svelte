<script lang="ts">
  import { editorStore } from '$lib/stores/editor.svelte.js';
  import FileCode from 'lucide-svelte/icons/file-code';
  import X from 'lucide-svelte/icons/x';
  import Wand from 'lucide-svelte/icons/wand';

  interface Props {
    onswitchtab: (fileId: string) => void;
    onclosetab: (fileId: string) => void;
    onformat: () => void;
  }

  let { onswitchtab, onclosetab, onformat }: Props = $props();
</script>

<div class="flex h-[35px] items-end border-b border-border bg-surface-800">
  <!-- Scrollable tabs -->
  <div class="flex flex-1 items-end overflow-x-auto">
    {#each editorStore.openFiles as file (file.id)}
      {@const isActive = file.id === editorStore.activeFileId}
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <div
        class="group relative flex h-[33px] min-w-0 max-w-[180px] cursor-pointer items-center gap-1.5 border-r border-border px-3 text-[12px] transition-colors
          {isActive
            ? 'bg-surface-850 text-text-primary'
            : 'bg-surface-800 text-text-secondary hover:bg-surface-850/50'}"
        onclick={() => onswitchtab(file.id)}
      >
        {#if isActive}
          <div class="absolute left-0 right-0 top-0 h-[2px] bg-amber-500"></div>
        {/if}
        <FileCode size={13} class="shrink-0 text-amber-500/70" />
        <span class="truncate">{file.filePath}</span>
        {#if file.isDirty}
          <span class="ml-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-text-secondary"></span>
        {/if}
        {#if editorStore.openFiles.length > 1}
          <button
            class="ml-auto shrink-0 rounded p-0.5 text-text-muted hover:bg-surface-raised/40 hover:text-text-secondary
              {isActive ? 'visible' : 'invisible group-hover:visible'}"
            onclick={(e) => { e.stopPropagation(); onclosetab(file.id); }}
            title="Close"
          >
            <X size={12} />
          </button>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Right toolbar -->
  <div class="flex h-[33px] items-center gap-1 px-2">
    {#if editorStore.saveStatus === 'saving'}
      <span class="text-[11px] text-amber-400">Saving...</span>
    {:else if editorStore.saveStatus === 'saved'}
      <span class="text-[11px] text-green-400">Saved</span>
    {:else if editorStore.saveStatus === 'error'}
      <span class="text-[11px] text-red-400">Save failed</span>
    {/if}
    <button
      class="rounded p-1 text-text-muted hover:bg-surface-raised/40 hover:text-text-secondary"
      onclick={onformat}
      title="Format Document (Ctrl+Shift+F)"
    >
      <Wand size={14} />
    </button>
  </div>
</div>
