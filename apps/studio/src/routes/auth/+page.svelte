<script lang="ts">
  import { enhance } from '$app/forms';

  let mode: 'login' | 'signup' = $state('login');
</script>

<div class="flex min-h-screen items-center justify-center bg-surface-900">
  <div class="w-full max-w-sm rounded-lg border border-white/10 bg-surface-800 p-8">
    <h1 class="mb-6 text-center text-2xl font-bold text-white">
      {mode === 'login' ? 'Sign In' : 'Create Account'}
    </h1>

    <form method="POST" action="?/{mode}" use:enhance class="space-y-4">
      <div>
        <label for="email" class="mb-1 block text-sm text-white/70">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          class="w-full rounded border border-white/20 bg-surface-700 px-3 py-2 text-white placeholder-white/40 focus:border-accent-500 focus:outline-none"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label for="password" class="mb-1 block text-sm text-white/70">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minlength="8"
          class="w-full rounded border border-white/20 bg-surface-700 px-3 py-2 text-white placeholder-white/40 focus:border-accent-500 focus:outline-none"
          placeholder="Min 8 characters"
        />
      </div>

      <button
        type="submit"
        class="w-full rounded bg-accent-600 py-2 font-medium text-white hover:bg-accent-500 transition-colors"
      >
        {mode === 'login' ? 'Sign In' : 'Create Account'}
      </button>
    </form>

    <p class="mt-4 text-center text-sm text-white/50">
      {#if mode === 'login'}
        Don't have an account?
        <button class="text-accent-400 hover:underline" onclick={() => (mode = 'signup')}>
          Sign up
        </button>
      {:else}
        Already have an account?
        <button class="text-accent-400 hover:underline" onclick={() => (mode = 'login')}>
          Sign in
        </button>
      {/if}
    </p>
  </div>
</div>
