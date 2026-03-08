<script lang="ts">
  /**
   * Workspace status bar — displays lifecycle stage badge, cursor position,
   * and diagnostic count at the bottom of the editor workspace.
   */
  import { projectStore } from '$lib/stores/project.svelte.js';
  import { editorStore } from '$lib/stores/editor.svelte.js';
  import { getStageLabel, getValidTargets } from '$lib/project/lifecycle.js';
  import { openPanel } from '$lib/dockview/panel-actions.js';
  import type { LifecycleStage } from '@actone/shared';

  interface Props {
    onadvancestage?: (target: LifecycleStage) => void;
  }

  let { onadvancestage }: Props = $props();

  let dropdownOpen = $state(false);

  const currentStage = $derived(projectStore.project?.lifecycleStage);
  const validTargets = $derived(currentStage ? getValidTargets(currentStage) : []);
  const hasTargets = $derived(validTargets.length > 0);

  const STAGES: LifecycleStage[] = ['concept', 'draft', 'revision', 'final', 'published'];

  const stageColors: Record<LifecycleStage, string> = {
    concept: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    draft: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    revision: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    final: 'bg-green-500/20 text-green-400 border-green-500/30',
    published: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  };

  function handleBadgeClick(e: MouseEvent) {
    if (!hasTargets) return;
    e.stopPropagation();
    dropdownOpen = !dropdownOpen;
  }

  function handleSelectTarget(target: LifecycleStage) {
    dropdownOpen = false;
    onadvancestage?.(target);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      dropdownOpen = false;
    }
  }

  $effect(() => {
    if (!dropdownOpen) return;

    function closeOnClickOutside() {
      dropdownOpen = false;
    }

    // Delay listener so the opening click doesn't immediately close it
    const timer = setTimeout(() => {
      window.addEventListener('click', closeOnClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', closeOnClickOutside);
    };
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<footer class="flex h-8 items-center border-t border-border bg-surface-800 px-3 text-xs">
  <!-- LEFT: lifecycle stage pipeline -->
  <div class="flex items-center gap-1">
    {#if currentStage}
      {#each STAGES as stage, i}
        {#if i > 0}
          <span class="text-[10px] text-text-muted">→</span>
        {/if}
        {#if stage === currentStage}
          <div class="relative">
            {#if hasTargets}
              <button
                class="rounded border px-2 py-0.5 text-[11px] font-medium leading-tight {stageColors[stage]}"
                onclick={handleBadgeClick}
              >
                {getStageLabel(stage)}
              </button>
            {:else}
              <span
                class="rounded border px-2 py-0.5 text-[11px] font-medium leading-tight {stageColors[stage]}"
              >
                {getStageLabel(stage)}
              </span>
            {/if}

            {#if dropdownOpen}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <div
                class="absolute bottom-full left-0 z-50 mb-1 min-w-[140px] rounded-md border border-border bg-surface-800 py-1 shadow-lg"
                role="menu"
                tabindex="-1"
                onclick={(e) => e.stopPropagation()}
              >
                {#each validTargets as target}
                  <button
                    class="flex w-full items-center px-3 py-1.5 text-left text-[12px] text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
                    role="menuitem"
                    onclick={() => handleSelectTarget(target)}
                  >
                    <span class="mr-2 inline-block h-2 w-2 rounded-full {stageColors[target].split(' ')[0]}"></span>
                    {getStageLabel(target)}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {:else}
          <span class="text-[11px] text-text-muted">{getStageLabel(stage)}</span>
        {/if}
      {/each}
    {/if}
  </div>

  <!-- Spacer -->
  <div class="flex-1"></div>

  <!-- RIGHT: cursor position and diagnostic count -->
  <div class="flex items-center gap-2 text-text-secondary">
    <span>Ln {editorStore.cursor.line}, Col {editorStore.cursor.column}</span>
    <span class="text-text-muted">|</span>
    <button
      class="cursor-pointer hover:underline {editorStore.diagnosticCount > 0 ? 'text-red-400' : ''}"
      onclick={() => openPanel('problems')}
    >
      {editorStore.diagnosticCount} {editorStore.diagnosticCount === 1 ? 'issue' : 'issues'}
    </button>
  </div>
</footer>
