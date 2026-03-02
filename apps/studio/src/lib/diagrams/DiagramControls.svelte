<script lang="ts">
  /**
   * Diagram controls with auto-layout button that calls fitView after layout.
   * Must be rendered as a child of <SvelteFlow> to access useSvelteFlow().
   */
  import { Controls, ControlButton, useSvelteFlow } from '@xyflow/svelte';

  interface Props {
    onautolayout: () => Promise<void>;
  }

  let { onautolayout }: Props = $props();

  const { fitView } = useSvelteFlow();

  async function handleClick() {
    await onautolayout();
    fitView({ duration: 200 });
  }
</script>

<Controls>
  {#snippet children()}
    <ControlButton
      onclick={handleClick}
      title="Auto Layout"
      aria-label="Auto Layout"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    </ControlButton>
  {/snippet}
</Controls>
