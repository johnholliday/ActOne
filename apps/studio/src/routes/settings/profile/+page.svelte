<script lang="ts">
  /**
   * T034: Profile Settings page.
   * Update display name and avatar URL.
   */
  import { page } from '$app/state';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  let saving = $state(false);
  let message = $state('');
  let messageType = $state<'success' | 'error'>('success');

  const user = $derived(page.data.session?.user);
  let fullName = $state('');
  let avatarUrl = $state('');

  $effect(() => {
    const meta = user?.user_metadata;
    fullName = ((meta?.full_name ?? meta?.name ?? '') as string);
    avatarUrl = ((meta?.avatar_url ?? '') as string);
  });

  async function handleSave() {
    saving = true;
    message = '';
    try {
      const supabase = page.data.supabase;
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName, avatar_url: avatarUrl },
      });

      if (error) {
        message = error.message;
        messageType = 'error';
      } else {
        message = 'Profile updated successfully';
        messageType = 'success';
      }
    } catch (err) {
      message = err instanceof Error ? err.message : 'Failed to update profile';
      messageType = 'error';
    } finally {
      saving = false;
    }
  }
</script>

<div class="mx-auto max-w-lg px-6 py-12 text-white">
  <h1 class="mb-6 text-xl font-bold">Profile Settings</h1>

  {#if message}
    <div class="mb-4 rounded px-3 py-2 text-xs {messageType === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}">
      {message}
    </div>
  {/if}

  <div class="mb-4">
    <label for="ps-name" class="mb-1 block text-xs font-medium text-zinc-400">Display Name</label>
    <input
      id="ps-name"
      type="text"
      bind:value={fullName}
      class="w-full rounded border border-[#333] bg-surface-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
      disabled={saving}
    />
  </div>

  <div class="mb-6">
    <label for="ps-avatar" class="mb-1 block text-xs font-medium text-zinc-400">Avatar URL</label>
    <input
      id="ps-avatar"
      type="url"
      bind:value={avatarUrl}
      class="w-full rounded border border-[#333] bg-surface-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
      placeholder="https://example.com/avatar.jpg"
      disabled={saving}
    />
    {#if avatarUrl}
      <img src={avatarUrl} alt="Avatar preview" class="mt-2 h-16 w-16 rounded-full object-cover" />
    {/if}
  </div>

  <button
    class="flex items-center gap-2 rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
    onclick={() => void handleSave()}
    disabled={saving}
  >
    {#if saving}<LoadingSpinner size="sm" />{/if}
    Save Changes
  </button>
</div>
