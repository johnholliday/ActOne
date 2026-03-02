<script lang="ts">
  /**
   * T002: Empty state component with icon, message, and optional CTA button.
   */
  import type { Snippet } from 'svelte';
  import FileText from 'lucide-svelte/icons/file-text';

  interface Props {
    /** Main message */
    message: string;
    /** Optional secondary description */
    description?: string;
    /** CTA button label */
    actionLabel?: string;
    /** CTA button handler */
    onaction?: () => void;
    /** Optional icon snippet override */
    icon?: Snippet;
  }

  let { message, description, actionLabel, onaction, icon }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
  {#if icon}
    {@render icon()}
  {:else}
    <FileText size={32} class="text-text-muted" />
  {/if}
  <p class="text-sm font-medium text-text-secondary">{message}</p>
  {#if description}
    <p class="max-w-sm text-xs text-text-muted">{description}</p>
  {/if}
  {#if actionLabel && onaction}
    <button
      class="mt-2 rounded-md bg-amber-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-500"
      onclick={onaction}
    >
      {actionLabel}
    </button>
  {/if}
</div>
