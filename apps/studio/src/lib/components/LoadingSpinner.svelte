<script lang="ts">
  /**
   * T001: Inline loading spinner with small/centered variant.
   */
  interface Props {
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Optional label shown below the spinner */
    label?: string;
  }

  let { size = 'md', label }: Props = $props();

  const sizeClasses: Record<string, string> = {
    sm: 'h-4 w-4 border-[1.5px]',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-2',
  };
</script>

<div class="flex flex-col items-center justify-center gap-2">
  <div
    class="animate-spin rounded-full border-amber-400 border-t-transparent {sizeClasses[size]}"
    role="status"
    aria-label={label ?? 'Loading'}
  ></div>
  {#if label}
    <span class="text-xs text-zinc-500">{label}</span>
  {/if}
</div>
