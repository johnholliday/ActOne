<script lang="ts">
  /**
   * Outline panel: Hierarchical element tree organized by category.
   *
   * Driven by the merged AST (`astStore.activeElements`) so it displays
   * elements from ALL project files, not just the active editor tab.
   * Double-clicking an element opens/focuses the source file and navigates
   * to the element's position.
   *
   * Rendered as a fixed sidebar outside dockview (not draggable/dockable).
   * Communicates with EditorPanel via window events:
   *   - Listens: 'actone:symbols-updated' (document symbols for navigation)
   *   - Dispatches: 'actone:open-file' (opens a file if not already open)
   *   - Dispatches: 'actone:outline-navigate' (navigates to a position)
   *   - Dispatches: 'actone:request-symbols' (requests current symbols on mount)
   */
  import { onMount } from 'svelte';
  import type { DocumentSymbol } from '$lib/editor/langium-client.js';
  import type { SerializedStoryElement } from '@repo/shared';
  import { astStore } from '$lib/stores/ast.svelte.js';
  import { projectStore } from '$lib/stores/project.svelte.js';
  import Globe from 'lucide-svelte/icons/globe';
  import Users from 'lucide-svelte/icons/users';
  import Palette from 'lucide-svelte/icons/palette';
  import Clock from 'lucide-svelte/icons/clock';
  import Film from 'lucide-svelte/icons/film';
  import GitBranch from 'lucide-svelte/icons/git-branch';
  import MessageSquare from 'lucide-svelte/icons/message-square';
  import Settings from 'lucide-svelte/icons/settings';
  import ChevronRight from 'lucide-svelte/icons/chevron-right';

  /** Document symbols from the active file — used only for click-to-navigate */
  let docSymbols = $state<DocumentSymbol[]>([]);

  /* ── Category definitions ────────────────────────────────── */

  interface Category {
    label: string;
    icon: typeof Globe;
    iconColor: string;
    types: string[];
  }

  const categories: Category[] = [
    { label: 'World',        icon: Globe,          iconColor: 'text-emerald-400', types: ['WorldDef'] },
    { label: 'Characters',   icon: Users,          iconColor: 'text-blue-400',    types: ['CharacterDef'] },
    { label: 'Themes',       icon: Palette,        iconColor: 'text-purple-400',  types: ['ThemeDef'] },
    { label: 'Timeline',     icon: Clock,          iconColor: 'text-cyan-400',    types: ['TimelineDef'] },
    { label: 'Plot',         icon: GitBranch,      iconColor: 'text-orange-400',  types: ['PlotDef'] },
    { label: 'Scenes',       icon: Film,           iconColor: 'text-amber-400',   types: ['SceneDef'] },
    { label: 'Interactions', icon: MessageSquare,   iconColor: 'text-pink-400',    types: ['InteractionDef'] },
    { label: 'Settings',     icon: Settings,        iconColor: 'text-zinc-400',    types: ['GenerateBlock'] },
  ];

  /* ── LSP SymbolKind map (for matching doc symbols to AST types) ── */

  const typeToSymbolKind: Record<string, number> = {
    WorldDef: 3,        // Namespace
    CharacterDef: 5,    // Class
    TimelineDef: 10,    // Enum
    SceneDef: 12,       // Function
    ThemeDef: 14,       // Constant
    GenerateBlock: 19,  // Object
    PlotDef: 23,        // Struct
    InteractionDef: 24, // Event
  };

  /* ── Derived: elements from the merged AST ─────────────── */

  const elements = $derived(astStore.activeElements);

  const storyName = $derived(astStore.mergedAst?.name ?? astStore.activeAst?.ast?.name ?? '');

  function getElementsForCategory(cat: Category): SerializedStoryElement[] {
    return elements.filter((el) => cat.types.includes(el.$type));
  }

  /** Get display name for an element */
  function getElementName(el: SerializedStoryElement): string {
    if (el.$type === 'GenerateBlock') {
      return el.genre ?? 'Generate';
    }
    return el.name;
  }

  /** Get sub-items for expandable elements */
  function getChildren(el: SerializedStoryElement): Array<{ name: string }> {
    if (el.$type === 'WorldDef') return el.locations;
    if (el.$type === 'TimelineDef') return el.layers;
    return [];
  }

  /* ── Collapse state per category ─────────────────────────── */

  let collapsed = $state<Record<string, boolean>>({});

  function toggleCategory(label: string) {
    collapsed = { ...collapsed, [label]: !collapsed[label] };
  }

  /* ── Collapse state per element (for children) ────────────── */

  let symbolCollapsed = $state<Record<string, boolean>>({});

  function toggleSymbol(name: string) {
    symbolCollapsed = { ...symbolCollapsed, [name]: !symbolCollapsed[name] };
  }

  /* ── Navigation ──────────────────────────────────────────── */

  /**
   * Search document symbols recursively for a symbol matching name+kind.
   */
  function findDocSymbol(name: string, $type: string, syms: DocumentSymbol[] = docSymbols): DocumentSymbol | null {
    const kind = typeToSymbolKind[$type];
    if (kind === undefined) return null;

    for (const sym of syms) {
      if (sym.name === name && sym.kind === kind) return sym;
      if (sym.children) {
        const found = findDocSymbol(name, $type, sym.children);
        if (found) return found;
      }
    }
    return null;
  }

  /** Find a child symbol (e.g., a location inside a world) by name */
  function findChildDocSymbol(parentName: string, childName: string, syms: DocumentSymbol[] = docSymbols): DocumentSymbol | null {
    for (const sym of syms) {
      if (sym.name === parentName && sym.children) {
        for (const child of sym.children) {
          if (child.name === childName) return child;
        }
      }
      if (sym.children) {
        const found = findChildDocSymbol(parentName, childName, sym.children);
        if (found) return found;
      }
    }
    return null;
  }

  /** Resolve a URI (file:///path) to the project file entry */
  function resolveFileFromUri(uri: string): { id: string; filePath: string } | null {
    const filePath = uri.replace(/^file:\/\/\//, '');
    const file = projectStore.files.find((f) => f.filePath === filePath);
    return file ? { id: file.id, filePath: file.filePath } : null;
  }

  /**
   * Navigate to a symbol position in the editor. Dispatches the event
   * and waits for the symbols-updated callback to fire when a file switch
   * is needed, then navigates to the element position.
   */
  function dispatchNavigate(sym: DocumentSymbol) {
    window.dispatchEvent(
      new CustomEvent('actone:outline-navigate', {
        detail: {
          line: sym.selectionRange.start.line,
          character: sym.selectionRange.start.character,
        },
      }),
    );
  }

  /**
   * Navigate to an element by name+kind once symbols are available.
   * If docSymbols is empty, requests a fresh update and waits.
   */
  function navigateWithSymbols(
    name: string,
    elType: string,
    syms: DocumentSymbol[],
  ) {
    const sym = findDocSymbol(name, elType, syms);
    if (sym) dispatchNavigate(sym);
  }

  /**
   * Open/focus the source file for an element and navigate to it.
   * If the element is in a different file, switches tabs first.
   */
  function navigateTo(el: SerializedStoryElement) {
    const name = getElementName(el);
    const sourceUri = astStore.findElementSource(name, el.$type);

    // Same file (or source unknown — try current file)
    if (!sourceUri || sourceUri === astStore.activeUri) {
      // If we have symbols, navigate immediately
      if (docSymbols.length > 0) {
        navigateWithSymbols(name, el.$type, docSymbols);
        return;
      }
      // No symbols yet — request them and navigate when they arrive
      function onReady(e: Event) {
        window.removeEventListener('actone:symbols-updated', onReady);
        const syms = (e as CustomEvent<{ symbols: DocumentSymbol[] }>).detail.symbols;
        navigateWithSymbols(name, el.$type, syms);
      }
      window.addEventListener('actone:symbols-updated', onReady);
      window.dispatchEvent(new CustomEvent('actone:request-symbols'));
      setTimeout(() => window.removeEventListener('actone:symbols-updated', onReady), 3000);
      return;
    }

    // Element is in a different file — open/focus that file first
    const file = resolveFileFromUri(sourceUri);
    if (!file) return;

    // Listen for symbols-updated (fired after the file switch completes)
    // so we can navigate once the new file's symbols are available.
    function onSymbolsReady(e: Event) {
      window.removeEventListener('actone:symbols-updated', onSymbolsReady);
      const newSymbols = (e as CustomEvent<{ symbols: DocumentSymbol[] }>).detail.symbols;
      navigateWithSymbols(name, el.$type, newSymbols);
    }
    window.addEventListener('actone:symbols-updated', onSymbolsReady);

    // Dispatch open-file event (EditorPanel handles tab switch)
    window.dispatchEvent(
      new CustomEvent('actone:open-file', {
        detail: { id: file.id, filePath: file.filePath },
      }),
    );

    // Safety timeout: remove listener if symbols never arrive
    setTimeout(() => {
      window.removeEventListener('actone:symbols-updated', onSymbolsReady);
    }, 3000);
  }

  function navigateToChild(parentEl: SerializedStoryElement, childName: string) {
    const parentName = getElementName(parentEl);
    const sourceUri = astStore.findElementSource(parentName, parentEl.$type);

    if (!sourceUri || sourceUri === astStore.activeUri) {
      if (docSymbols.length > 0) {
        const sym = findChildDocSymbol(parentName, childName);
        if (sym) dispatchNavigate(sym);
        return;
      }
      function onReady(e: Event) {
        window.removeEventListener('actone:symbols-updated', onReady);
        const syms = (e as CustomEvent<{ symbols: DocumentSymbol[] }>).detail.symbols;
        const sym = findChildDocSymbol(parentName, childName, syms);
        if (sym) dispatchNavigate(sym);
      }
      window.addEventListener('actone:symbols-updated', onReady);
      window.dispatchEvent(new CustomEvent('actone:request-symbols'));
      setTimeout(() => window.removeEventListener('actone:symbols-updated', onReady), 3000);
      return;
    }

    const file = resolveFileFromUri(sourceUri);
    if (!file) return;

    function onSymbolsReady(e: Event) {
      window.removeEventListener('actone:symbols-updated', onSymbolsReady);
      const newSymbols = (e as CustomEvent<{ symbols: DocumentSymbol[] }>).detail.symbols;
      const sym = findChildDocSymbol(parentName, childName, newSymbols);
      if (sym) dispatchNavigate(sym);
    }
    window.addEventListener('actone:symbols-updated', onSymbolsReady);

    window.dispatchEvent(
      new CustomEvent('actone:open-file', {
        detail: { id: file.id, filePath: file.filePath },
      }),
    );

    setTimeout(() => {
      window.removeEventListener('actone:symbols-updated', onSymbolsReady);
    }, 3000);
  }

  /* ── Context menu ───────────────────────────────────────── */

  const EXTRACTABLE_TYPES = new Set([
    'CharacterDef', 'WorldDef', 'ThemeDef', 'TimelineDef',
    'SceneDef', 'PlotDef', 'InteractionDef',
  ]);

  let contextMenu = $state<{ x: number; y: number; el: SerializedStoryElement } | null>(null);
  let panelEl = $state<HTMLElement | undefined>(undefined);

  function isExtractDisabled(el: SerializedStoryElement): boolean {
    const targetPath = getElementName(el).toLowerCase().replace(/\s+/g, '-') + '.actone';
    return projectStore.files.some((f) => f.filePath === targetPath);
  }

  function handleElementContextMenu(e: MouseEvent, el: SerializedStoryElement) {
    e.preventDefault();
    if (!panelEl) return;
    const row = e.currentTarget as HTMLElement;
    const rowRect = row.getBoundingClientRect();
    const panelRect = panelEl.getBoundingClientRect();
    // Position relative to the panel: left-aligned with row, just below it
    contextMenu = {
      x: rowRect.left - panelRect.left + 8,
      y: rowRect.bottom - panelRect.top + 2,
      el,
    };
  }

  function closeContextMenu() {
    contextMenu = null;
  }

  function handleGoTo() {
    if (!contextMenu) return;
    navigateTo(contextMenu.el);
    closeContextMenu();
  }

  function handleExtract() {
    if (!contextMenu) return;
    const el = contextMenu.el;
    const name = getElementName(el);
    const sourceUri = astStore.findElementSource(name, el.$type);
    closeContextMenu();
    window.dispatchEvent(
      new CustomEvent('actone:extract-element', {
        detail: { name, $type: el.$type, sourceUri },
      }),
    );
  }

  /* ── Listen for document symbol updates (for navigation) ── */

  onMount(() => {
    function handleSymbolsUpdated(e: Event) {
      const detail = (e as CustomEvent<{ symbols: DocumentSymbol[] }>).detail;
      docSymbols = detail.symbols;
    }
    window.addEventListener('actone:symbols-updated', handleSymbolsUpdated);

    // Request current symbols from the editor for navigation support
    window.dispatchEvent(new CustomEvent('actone:request-symbols'));

    return () => {
      window.removeEventListener('actone:symbols-updated', handleSymbolsUpdated);
    };
  });
</script>

<div bind:this={panelEl} class="relative flex h-full w-full flex-col overflow-hidden bg-surface-850">
  <!-- Header -->
  <div class="flex h-8 shrink-0 items-center border-b border-border px-3">
    <span class="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Outline</span>
    {#if storyName}
      <span class="ml-2 truncate text-[10px] text-text-muted">{storyName}</span>
    {/if}
  </div>

  <div class="flex-1 overflow-y-auto px-1 py-2 text-xs">
    {#if elements.length === 0}
      <p class="px-3 py-4 text-center text-text-muted">No elements</p>
    {:else}
      {#each categories as cat}
        {@const items = getElementsForCategory(cat)}
        {#if items.length > 0}
          <!-- Category header -->
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
          <div
            class="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted hover:bg-surface-raised/20 hover:text-text-secondary"
            onclick={() => toggleCategory(cat.label)}
          >
            <ChevronRight
              size={10}
              class="shrink-0 transition-transform {collapsed[cat.label] ? '' : 'rotate-90'}"
            />
            <cat.icon size={11} class="shrink-0 {cat.iconColor}" />
            <span>{cat.label}</span>
            <span class="ml-auto font-normal text-text-muted">{items.length}</span>
          </div>

          {#if !collapsed[cat.label]}
            <ul class="mb-1">
              {#each items as el}
                {@const name = getElementName(el)}
                {@const children = getChildren(el)}
                {@const hasChildren = children.length > 0}
                <li>
                  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
                  <div
                    class="flex cursor-pointer items-center gap-1 rounded py-0.5 pl-5 pr-2 text-text-secondary hover:bg-surface-raised/20 hover:text-text-primary"
                    ondblclick={() => navigateTo(el)}
                    oncontextmenu={(e) => handleElementContextMenu(e, el)}
                  >
                    {#if hasChildren}
                      <button
                        class="shrink-0 rounded p-0.5 text-text-muted hover:text-text-secondary"
                        onclick={(e) => { e.stopPropagation(); toggleSymbol(name); }}
                      >
                        <ChevronRight
                          size={10}
                          class="transition-transform {symbolCollapsed[name] ? '' : 'rotate-90'}"
                        />
                      </button>
                    {:else}
                      <span class="w-[18px] shrink-0"></span>
                    {/if}
                    <span class="truncate">{name}</span>
                  </div>

                  {#if hasChildren && !symbolCollapsed[name]}
                    <ul>
                      {#each children as child}
                        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
                        <li
                          class="cursor-pointer truncate rounded py-0.5 pl-11 pr-2 text-text-muted hover:bg-surface-raised/20 hover:text-text-secondary"
                          ondblclick={() => navigateToChild(el, child.name)}
                        >
                          {child.name}
                        </li>
                      {/each}
                    </ul>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        {/if}
      {/each}
    {/if}
  </div>

  {#if contextMenu}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="context-overlay"
      role="presentation"
      onclick={closeContextMenu}
    >
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <div
        class="context-menu"
        role="menu"
        tabindex="-1"
        style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.key === 'Escape' && closeContextMenu()}
      >
        <button role="menuitem" onclick={handleGoTo}>Go to...</button>
        {#if EXTRACTABLE_TYPES.has(contextMenu.el.$type)}
          {@const disabled = isExtractDisabled(contextMenu.el)}
          <button
            role="menuitem"
            disabled={disabled}
            class:disabled
            onclick={handleExtract}
          >
            Extract...{#if disabled} <span class="hint">(file exists)</span>{/if}
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .context-overlay {
    position: absolute;
    inset: 0;
    z-index: 100;
  }

  .context-menu {
    position: absolute;
    background: var(--color-surface-800);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 4px;
    min-width: 160px;
    z-index: 101;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .context-menu button {
    display: block;
    width: 100%;
    padding: 6px 12px;
    background: none;
    border: none;
    color: var(--color-text-primary);
    text-align: left;
    font-size: 13px;
    border-radius: 4px;
    cursor: pointer;
  }

  .context-menu button:hover:not(:disabled) {
    background: var(--color-surface-raised);
  }

  .context-menu button.disabled {
    color: var(--color-text-muted);
    cursor: default;
  }

  .context-menu .hint {
    color: var(--color-text-muted);
    font-size: 11px;
    margin-left: 4px;
  }
</style>
