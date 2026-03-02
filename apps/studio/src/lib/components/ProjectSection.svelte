<script lang="ts">
  import { editorStore } from '$lib/stores/editor.svelte.js';
  import type { ProjectMeta, SourceFileEntry } from '$lib/stores/project.svelte.js';
  import FolderOpen from 'lucide-svelte/icons/folder-open';
  import FolderClosed from 'lucide-svelte/icons/folder-closed';
  import ChevronRight from 'lucide-svelte/icons/chevron-right';
  import ChevronDown from 'lucide-svelte/icons/chevron-down';
  import File from 'lucide-svelte/icons/file';
  import FileCode from 'lucide-svelte/icons/file-code';

  interface Props {
    project: ProjectMeta;
    files: SourceFileEntry[];
    onopenfile: (file: { id: string; filePath: string }) => void;
    oncontextmenu: (event: MouseEvent) => void;
    onfilecontextmenu: (event: MouseEvent, file: SourceFileEntry) => void;
  }

  let { project, files, onopenfile, oncontextmenu, onfilecontextmenu }: Props = $props();

  let expanded = $state(true);
</script>

<div class="flex flex-col">
  <!-- Project header row -->
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="flex h-7 cursor-pointer items-center gap-1.5 rounded px-2.5 text-[12px] font-medium text-zinc-300 hover:bg-white/5"
    onclick={() => { expanded = !expanded; }}
    oncontextmenu={oncontextmenu}
  >
    {#if expanded}
      <ChevronDown size={12} class="shrink-0 text-zinc-500" />
      <FolderOpen size={14} class="shrink-0 text-amber-500/70" />
    {:else}
      <ChevronRight size={12} class="shrink-0 text-zinc-500" />
      <FolderClosed size={14} class="shrink-0 text-amber-500/70" />
    {/if}
    <span class="truncate">{project.title}</span>
  </div>

  <!-- File list (when expanded) -->
  {#if expanded}
    <div class="ml-2 flex flex-col gap-0">
      {#each files as file}
        {@const isActive = editorStore.activeFileId === file.id}
        <button
          class="flex h-7 items-center gap-2 rounded px-2.5 text-[12px] transition-colors
            {isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-300'}"
          onclick={() => onopenfile({ id: file.id, filePath: file.filePath })}
          oncontextmenu={(e) => onfilecontextmenu(e, file)}
        >
          {#if file.isEntry}
            <FileCode size={14} class="shrink-0 text-amber-500/70" />
          {:else}
            <File size={14} class="shrink-0" />
          {/if}
          <span class="truncate">{file.filePath}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>
