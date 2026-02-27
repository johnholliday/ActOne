<script lang="ts">
  /**
   * T035: Account Settings page.
   * Email display, password change, linked OAuth accounts.
   */
  import { page } from '$app/state';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { validatePasswordChange } from '$lib/validation/password.js';

  let saving = $state(false);
  let message = $state('');
  let messageType = $state<'success' | 'error'>('success');
  let newPassword = $state('');
  let confirmPassword = $state('');

  const user = $derived(page.data.session?.user);
  const email = $derived(user?.email ?? '');
  const identities = $derived(user?.identities ?? []);

  async function handlePasswordChange() {
    const validation = validatePasswordChange(newPassword, confirmPassword);
    if (!validation.valid) {
      message = validation.error;
      messageType = 'error';
      return;
    }

    saving = true;
    message = '';
    try {
      const supabase = page.data.supabase;
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        message = error.message;
        messageType = 'error';
      } else {
        message = 'Password updated successfully';
        messageType = 'success';
        newPassword = '';
        confirmPassword = '';
      }
    } catch (err) {
      message = err instanceof Error ? err.message : 'Failed to update password';
      messageType = 'error';
    } finally {
      saving = false;
    }
  }
</script>

<div class="mx-auto max-w-lg px-6 py-12 text-white">
  <h1 class="mb-6 text-xl font-bold">Account Settings</h1>

  {#if message}
    <div class="mb-4 rounded px-3 py-2 text-xs {messageType === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}">
      {message}
    </div>
  {/if}

  <!-- Email (read-only) -->
  <div class="mb-6">
    <span class="mb-1 block text-xs font-medium text-zinc-400">Email</span>
    <div class="rounded border border-[#333] bg-surface-900 px-3 py-2 text-sm text-zinc-400">
      {email}
    </div>
  </div>

  <!-- Password Change -->
  <div class="mb-4">
    <h2 class="mb-3 text-sm font-semibold text-zinc-300">Change Password</h2>
    <div class="mb-3">
      <label for="as-pw" class="mb-1 block text-xs font-medium text-zinc-400">New Password</label>
      <input
        id="as-pw"
        type="password"
        bind:value={newPassword}
        class="w-full rounded border border-[#333] bg-surface-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
        placeholder="Minimum 8 characters"
        disabled={saving}
      />
    </div>
    <div class="mb-4">
      <label for="as-pw-confirm" class="mb-1 block text-xs font-medium text-zinc-400">Confirm Password</label>
      <input
        id="as-pw-confirm"
        type="password"
        bind:value={confirmPassword}
        class="w-full rounded border border-[#333] bg-surface-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
        disabled={saving}
      />
    </div>
    <button
      class="flex items-center gap-2 rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
      onclick={() => void handlePasswordChange()}
      disabled={saving}
    >
      {#if saving}<LoadingSpinner size="sm" />{/if}
      Update Password
    </button>
  </div>

  <!-- Linked Accounts -->
  <div class="mt-8">
    <h2 class="mb-3 text-sm font-semibold text-zinc-300">Linked Accounts</h2>
    {#if identities.length === 0}
      <p class="text-xs text-zinc-500">No linked accounts.</p>
    {:else}
      <div class="space-y-2">
        {#each identities as identity}
          <div class="flex items-center gap-3 rounded border border-[#333] bg-surface-900 px-3 py-2">
            <span class="text-sm font-medium capitalize text-zinc-300">{identity.provider}</span>
            <span class="ml-auto text-xs text-zinc-500">
              Connected {new Date(identity.created_at).toLocaleDateString()}
            </span>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
