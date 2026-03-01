<script lang="ts">
  // This view is now a dockview panel. Redirect to main page.
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  onMount(() => { void goto('/'); });
</script>
