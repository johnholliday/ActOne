<script lang="ts">
  /**
   * T036: Appearance Settings page.
   * Theme selector, editor font size, editor font family.
   * Preferences saved to localStorage.
   */
  import { onMount } from 'svelte';
  import { parseAppearancePrefs, serializeAppearancePrefs } from '$lib/settings/appearance.js';

  let theme = $state<'dark' | 'light' | 'system'>('dark');
  let fontSize = $state(14);
  let fontFamily = $state<string>('JetBrains Mono');
  let saved = $state(false);

  const fontOptions = [
    'JetBrains Mono',
    'Fira Code',
    'Source Code Pro',
    'Cascadia Code',
    'Menlo',
    'Consolas',
    'monospace',
  ];

  onMount(() => {
    const stored = localStorage.getItem('actone:appearance');
    const prefs = parseAppearancePrefs(stored);
    theme = prefs.theme;
    fontSize = prefs.fontSize;
    fontFamily = prefs.fontFamily;
  });

  function save() {
    localStorage.setItem('actone:appearance', serializeAppearancePrefs({ theme, fontSize, fontFamily }));
    saved = true;
    setTimeout(() => { saved = false; }, 2000);
  }
</script>

<div class="mx-auto max-w-lg px-6 py-12 text-white">
  <h1 class="mb-6 text-xl font-bold">Appearance</h1>

  {#if saved}
    <div class="mb-4 rounded bg-green-500/10 px-3 py-2 text-xs text-green-400">
      Preferences saved
    </div>
  {/if}

  <!-- Theme -->
  <div class="mb-6">
    <span class="mb-2 block text-xs font-medium text-zinc-400">Theme</span>
    <div class="flex gap-2">
      {#each [{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }, { value: 'system', label: 'System' }] as opt}
        <label
          class="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors
            {theme === opt.value ? 'border-amber-500/50 bg-amber-500/5 text-white' : 'border-[#333] text-zinc-400 hover:border-[#444]'}"
        >
          <input
            type="radio"
            name="theme"
            value={opt.value}
            bind:group={theme}
            class="sr-only"
          />
          {opt.label}
        </label>
      {/each}
    </div>
  </div>

  <!-- Font Size -->
  <div class="mb-6">
    <label for="ap-fontsize" class="mb-2 block text-xs font-medium text-zinc-400">
      Editor Font Size: {fontSize}px
    </label>
    <input
      id="ap-fontsize"
      type="range"
      min="10"
      max="24"
      step="1"
      bind:value={fontSize}
      class="w-full accent-amber-500"
    />
    <div class="mt-1 flex justify-between text-[10px] text-zinc-600">
      <span>10px</span>
      <span>24px</span>
    </div>
  </div>

  <!-- Font Family -->
  <div class="mb-6">
    <label for="ap-fontfamily" class="mb-2 block text-xs font-medium text-zinc-400">Editor Font</label>
    <select
      id="ap-fontfamily"
      bind:value={fontFamily}
      class="w-full rounded border border-[#333] bg-surface-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
    >
      {#each fontOptions as font}
        <option value={font}>{font}</option>
      {/each}
    </select>
    <div class="mt-2 rounded border border-[#333] bg-surface-900 p-3 text-sm text-zinc-300" style="font-family: '{fontFamily}', monospace; font-size: {fontSize}px;">
      story "Preview" {'{'}<br/>
      &nbsp;&nbsp;The quick brown fox<br/>
      {'}'}
    </div>
  </div>

  <button
    class="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
    onclick={save}
  >
    Save Preferences
  </button>
</div>
