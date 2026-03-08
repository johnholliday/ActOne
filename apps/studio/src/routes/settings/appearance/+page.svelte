<script lang="ts">
  /**
   * T036: Appearance Settings page.
   * Theme selector, editor font size, editor font family.
   * Preferences saved to localStorage.
   */
  import { onMount } from 'svelte';
  import { parseAppearancePrefs, serializeAppearancePrefs } from '$lib/settings/appearance.js';
  import {
    parseDiagramPrefs,
    serializeDiagramPrefs,
    DIAGRAM_STYLE_CONFIGS,
    type DiagramStyle,
    type BackgroundPattern,
    type EdgeAnimation,
    type SwimLaneDisplay,
  } from '$lib/settings/diagram.js';
  import { uiStore } from '$lib/stores/ui.svelte.js';

  let theme = $state<'dark' | 'light' | 'system'>('dark');
  let fontSize = $state(14);
  let fontFamily = $state<string>('JetBrains Mono');
  let wordWrap = $state(false);
  let saved = $state(false);

  /* ── Diagram prefs ──────────────────────────────────────── */
  let diagramStyle = $state<DiagramStyle>('dark');
  let backgroundVariant = $state<BackgroundPattern>('dots');
  let snapToGrid = $state(false);
  let gridSize = $state(20);
  let edgeAnimation = $state<EdgeAnimation>('ants');
  let swimLaneDisplay = $state<SwimLaneDisplay>('fill');
  let swimLaneOpacity = $state(0.2);

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
    wordWrap = prefs.wordWrap;

    const diagramStored = localStorage.getItem('actone:diagram');
    const dPrefs = parseDiagramPrefs(diagramStored);
    diagramStyle = dPrefs.style;
    backgroundVariant = dPrefs.backgroundVariant;
    snapToGrid = dPrefs.snapToGrid;
    gridSize = dPrefs.gridSize;
    edgeAnimation = dPrefs.edgeAnimation;
    swimLaneDisplay = dPrefs.swimLaneDisplay;
    swimLaneOpacity = dPrefs.swimLaneOpacity;
  });

  function save() {
    localStorage.setItem('actone:appearance', serializeAppearancePrefs({ theme, fontSize, fontFamily, wordWrap }));
    localStorage.setItem(
      'actone:diagram',
      serializeDiagramPrefs({
        style: diagramStyle,
        backgroundVariant,
        snapToGrid,
        gridSize,
        edgeAnimation,
        swimLaneDisplay,
        swimLaneOpacity,
      }),
    );
    window.dispatchEvent(new CustomEvent('actone:diagram-prefs-changed'));
    saved = true;
    setTimeout(() => { saved = false; }, 2000);
  }
</script>

<div class="mx-auto max-w-lg px-6 py-12 text-text-primary">
  <h1 class="mb-6 text-xl font-bold">Appearance</h1>

  {#if saved}
    <div class="mb-4 rounded bg-green-500/10 px-3 py-2 text-xs text-green-400">
      Preferences saved
    </div>
  {/if}

  <!-- Theme -->
  <div class="mb-6">
    <span class="mb-2 block text-xs font-medium text-text-secondary">Theme</span>
    <div class="flex gap-2">
      {#each [
        { value: 'dark' as const, label: 'Dark' },
        { value: 'light' as const, label: 'Light' },
      ] as opt}
        <label
          class="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors
            {theme === opt.value ? 'border-amber-500/50 bg-amber-500/5 text-text-primary' : 'border-border text-text-secondary hover:border-surface-overlay'}"
        >
          <input
            type="radio"
            name="theme"
            value={opt.value}
            bind:group={theme}
            onchange={() => { uiStore.setTheme(opt.value); }}
            class="sr-only"
          />
          {opt.label}
        </label>
      {/each}
    </div>
  </div>

  <!-- Font Size -->
  <div class="mb-6">
    <label for="ap-fontsize" class="mb-2 block text-xs font-medium text-text-secondary">
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
    <div class="mt-1 flex justify-between text-[10px] text-text-muted">
      <span>10px</span>
      <span>24px</span>
    </div>
  </div>

  <!-- Font Family -->
  <div class="mb-6">
    <label for="ap-fontfamily" class="mb-2 block text-xs font-medium text-text-secondary">Editor Font</label>
    <select
      id="ap-fontfamily"
      bind:value={fontFamily}
      class="w-full rounded border border-border bg-surface-900 px-3 py-2 text-sm text-text-primary focus:border-amber-500 focus:outline-none"
    >
      {#each fontOptions as font}
        <option value={font}>{font}</option>
      {/each}
    </select>
    <div class="mt-2 rounded border border-border bg-surface-900 p-3 text-sm text-text-secondary" style="font-family: '{fontFamily}', monospace; font-size: {fontSize}px;">
      story "Preview" {'{'}<br/>
      &nbsp;&nbsp;The quick brown fox<br/>
      {'}'}
    </div>
  </div>

  <!-- Word Wrap -->
  <div class="mb-6">
    <label class="flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        bind:checked={wordWrap}
        class="h-4 w-4 rounded border-border bg-surface-900 accent-amber-500"
      />
      <span class="text-sm text-text-secondary">Word Wrap</span>
    </label>
    <p class="mt-1 text-[11px] text-text-muted">Wrap long lines instead of scrolling horizontally</p>
  </div>

  <!-- ── Diagram Canvas ──────────────────────────────────── -->
  <h2 class="mb-4 mt-8 border-t border-border pt-6 text-lg font-semibold">Diagram Canvas</h2>

  <!-- Canvas Style -->
  <div class="mb-6">
    <span class="mb-2 block text-xs font-medium text-text-secondary">Canvas Style</span>
    <div class="flex gap-2">
      {#each [
        { value: 'dark', label: 'Dark', bg: '#0D0D0D', dot: '#252525' },
        { value: 'blueprint', label: 'Blueprint', bg: '#0a1628', dot: '#1e3a5f' },
      ] as opt}
        <label
          class="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors
            {diagramStyle === opt.value ? 'border-amber-500/50 bg-amber-500/5 text-text-primary' : 'border-border text-text-secondary hover:border-surface-overlay'}"
        >
          <input
            type="radio"
            name="diagramStyle"
            value={opt.value}
            bind:group={diagramStyle}
            class="sr-only"
          />
          <span
            class="inline-block h-4 w-4 rounded border border-surface-overlay"
            style="background: {opt.bg}; box-shadow: inset 0 0 0 1px {opt.dot};"
          ></span>
          {opt.label}
        </label>
      {/each}
    </div>
  </div>

  <!-- Background Pattern -->
  <div class="mb-6">
    <span class="mb-2 block text-xs font-medium text-text-secondary">Background Pattern</span>
    <div class="flex gap-2">
      {#each [
        { value: 'dots', label: 'Dots' },
        { value: 'lines', label: 'Lines' },
        { value: 'cross', label: 'Cross' },
      ] as opt}
        <label
          class="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors
            {backgroundVariant === opt.value ? 'border-amber-500/50 bg-amber-500/5 text-text-primary' : 'border-border text-text-secondary hover:border-surface-overlay'}"
        >
          <input
            type="radio"
            name="bgVariant"
            value={opt.value}
            bind:group={backgroundVariant}
            class="sr-only"
          />
          {opt.label}
        </label>
      {/each}
    </div>
  </div>

  <!-- Snap to Grid -->
  <div class="mb-6">
    <label class="flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        bind:checked={snapToGrid}
        class="h-4 w-4 rounded border-border bg-surface-900 accent-amber-500"
      />
      <span class="text-sm text-text-secondary">Snap to Grid</span>
    </label>
    <p class="mt-1 text-[11px] text-text-muted">Snap nodes to the grid when dragging</p>
  </div>

  <!-- Grid Size -->
  <div class="mb-6">
    <label for="ap-gridsize" class="mb-2 block text-xs font-medium text-text-secondary">
      Grid Size: {gridSize}px
    </label>
    <input
      id="ap-gridsize"
      type="range"
      min="5"
      max="100"
      step="5"
      bind:value={gridSize}
      class="w-full accent-amber-500"
    />
    <div class="mt-1 flex justify-between text-[10px] text-text-muted">
      <span>5px</span>
      <span>100px</span>
    </div>
  </div>

  <!-- Edge Animation -->
  <div class="mb-6">
    <span class="mb-2 block text-xs font-medium text-text-secondary">Edge Direction Indicator</span>
    <div class="flex gap-2">
      {#each [
        { value: 'ants' as const, label: 'Marching Ants' },
        { value: 'arrows' as const, label: 'Arrows' },
      ] as opt}
        <label
          class="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors
            {edgeAnimation === opt.value ? 'border-amber-500/50 bg-amber-500/5 text-text-primary' : 'border-border text-text-secondary hover:border-surface-overlay'}"
        >
          <input
            type="radio"
            name="edgeAnimation"
            value={opt.value}
            bind:group={edgeAnimation}
            class="sr-only"
          />
          {opt.label}
        </label>
      {/each}
    </div>
    <p class="mt-1 text-[11px] text-text-muted">How directional edges indicate flow direction</p>
  </div>

  <!-- Swim Lane Display -->
  <div class="mb-6">
    <span class="mb-2 block text-xs font-medium text-text-secondary">Timeline Swim Lanes</span>
    <div class="flex gap-2">
      {#each [
        { value: 'fill' as const, label: 'Filled' },
        { value: 'outline' as const, label: 'Outline' },
      ] as opt}
        <label
          class="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors
            {swimLaneDisplay === opt.value ? 'border-amber-500/50 bg-amber-500/5 text-text-primary' : 'border-border text-text-secondary hover:border-surface-overlay'}"
        >
          <input
            type="radio"
            name="swimLaneDisplay"
            value={opt.value}
            bind:group={swimLaneDisplay}
            class="sr-only"
          />
          {opt.label}
        </label>
      {/each}
    </div>
    <p class="mt-1 text-[11px] text-text-muted">How timeline swim-lane containers are displayed</p>
  </div>

  <!-- Swim Lane Opacity (only when fill mode) -->
  {#if swimLaneDisplay === 'fill'}
    <div class="mb-6">
      <label for="ap-laneopacity" class="mb-2 block text-xs font-medium text-text-secondary">
        Swim Lane Opacity: {Math.round(swimLaneOpacity * 100)}%
      </label>
      <input
        id="ap-laneopacity"
        type="range"
        min="0.05"
        max="0.5"
        step="0.05"
        bind:value={swimLaneOpacity}
        class="w-full accent-amber-500"
      />
      <div class="mt-1 flex justify-between text-[10px] text-text-muted">
        <span>5%</span>
        <span>50%</span>
      </div>
    </div>
  {/if}

  <button
    class="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
    onclick={save}
  >
    Save Preferences
  </button>
</div>
