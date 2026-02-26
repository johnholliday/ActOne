<script lang="ts">
  /**
   * T057: Semantic project navigator tree.
   *
   * Displays project elements organized by type (Characters, Worlds, etc.)
   * with click-to-navigate functionality.
   */
  import type { TreeNode } from '$lib/project/project-tree.js';

  interface Props {
    tree: TreeNode[];
    onselect?: (node: TreeNode) => void;
  }

  let { tree, onselect }: Props = $props();

  let expandedGroups = $state<Set<string>>(new Set());

  function toggleGroup(id: string) {
    const next = new Set(expandedGroups);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    expandedGroups = next;
  }

  function handleSelect(node: TreeNode) {
    onselect?.(node);
  }
</script>

<div class="flex flex-col gap-0.5 text-xs">
  {#each tree as group}
    <div>
      <!-- Group header -->
      <button
        class="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-white/60 hover:bg-white/5 hover:text-white/80"
        onclick={() => toggleGroup(group.id)}
      >
        <span class="text-[10px] text-white/30">
          {expandedGroups.has(group.id) ? '▾' : '▸'}
        </span>
        <span class="font-medium">{group.label}</span>
      </button>

      <!-- Group children -->
      {#if expandedGroups.has(group.id) && group.children}
        <div class="ml-3 flex flex-col gap-0.5">
          {#each group.children as child}
            <button
              class="flex w-full items-center gap-1.5 rounded px-2 py-0.5 text-left text-white/50 hover:bg-white/5 hover:text-white/70"
              onclick={() => handleSelect(child)}
            >
              <span class="inline-block w-4 text-center text-[10px] text-white/25">
                {#if child.type === 'character'}●
                {:else if child.type === 'scene'}▪
                {:else if child.type === 'world'}◆
                {:else if child.type === 'theme'}✦
                {:else if child.type === 'plot'}—
                {:else}·
                {/if}
              </span>
              {child.label}
            </button>

            <!-- Nested children (locations, layers, etc.) -->
            {#if child.children && child.children.length > 0}
              <div class="ml-5 flex flex-col gap-0.5">
                {#each child.children as nested}
                  <button
                    class="flex w-full items-center gap-1 rounded px-2 py-0.5 text-left text-white/40 hover:bg-white/5 hover:text-white/60"
                    onclick={() => handleSelect(nested)}
                  >
                    <span class="text-[10px] text-white/20">·</span>
                    {nested.label}
                  </button>
                {/each}
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  {/each}

  {#if tree.length === 0}
    <p class="px-2 py-4 text-center text-white/25">
      No elements yet. Start writing your story.
    </p>
  {/if}
</div>
