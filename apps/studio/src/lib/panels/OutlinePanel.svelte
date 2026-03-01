<script lang="ts">
  /**
   * Outline panel: Hierarchical document symbol tree organized by category.
   * Clicking a symbol navigates to its position in the active editor.
   *
   * Rendered as a fixed sidebar outside dockview (not draggable/dockable).
   * Communicates with EditorPanel via window events:
   *   - Listens: 'actone:symbols-updated' (symbol data from editor)
   *   - Dispatches: 'actone:outline-navigate' (user clicks a symbol)
   *   - Dispatches: 'actone:request-symbols' (requests current symbols on mount)
   */
  import { onMount } from 'svelte';
  import type { DocumentSymbol } from '$lib/editor/langium-client.js';
  import Globe from 'lucide-svelte/icons/globe';
  import Users from 'lucide-svelte/icons/users';
  import Palette from 'lucide-svelte/icons/palette';
  import Clock from 'lucide-svelte/icons/clock';
  import Film from 'lucide-svelte/icons/film';
  import GitBranch from 'lucide-svelte/icons/git-branch';
  import MessageSquare from 'lucide-svelte/icons/message-square';
  import Settings from 'lucide-svelte/icons/settings';
  import ChevronRight from 'lucide-svelte/icons/chevron-right';

  let symbols = $state<DocumentSymbol[]>([]);

  /* ── SymbolKind constants (LSP) ──────────────────────────── */
  const SK_NAMESPACE = 3;   // World
  const SK_CLASS = 5;       // Character
  const SK_ENUM = 10;       // Timeline
  const SK_FUNCTION = 12;   // Scene
  const SK_CONSTANT = 14;   // Theme
  const SK_OBJECT = 19;     // GenerateBlock
  const SK_STRUCT = 23;     // Plot
  const SK_EVENT = 24;      // Interaction

  /* ── Category definitions ────────────────────────────────── */

  interface Category {
    label: string;
    icon: typeof Globe;
    iconColor: string;
    kinds: number[];
  }

  const categories: Category[] = [
    { label: 'World',        icon: Globe,          iconColor: 'text-emerald-400', kinds: [SK_NAMESPACE] },
    { label: 'Characters',   icon: Users,          iconColor: 'text-blue-400',    kinds: [SK_CLASS] },
    { label: 'Themes',       icon: Palette,        iconColor: 'text-purple-400',  kinds: [SK_CONSTANT] },
    { label: 'Timeline',     icon: Clock,          iconColor: 'text-cyan-400',    kinds: [SK_ENUM] },
    { label: 'Plot',         icon: GitBranch,      iconColor: 'text-orange-400',  kinds: [SK_STRUCT] },
    { label: 'Scenes',       icon: Film,           iconColor: 'text-amber-400',   kinds: [SK_FUNCTION] },
    { label: 'Interactions', icon: MessageSquare,   iconColor: 'text-pink-400',    kinds: [SK_EVENT] },
    { label: 'Settings',     icon: Settings,        iconColor: 'text-zinc-400',    kinds: [SK_OBJECT] },
  ];

  /* ── Derived: story children grouped by category ─────────── */

  const storyChildren = $derived(
    symbols.length > 0 && symbols[0]?.children ? symbols[0].children : [],
  );

  const storyName = $derived(
    symbols.length > 0 ? symbols[0]?.name ?? '' : '',
  );

  function getSymbolsForCategory(cat: Category): DocumentSymbol[] {
    return storyChildren.filter((s) => cat.kinds.includes(s.kind));
  }

  /* ── Collapse state per category ─────────────────────────── */

  let collapsed = $state<Record<string, boolean>>({});

  function toggleCategory(label: string) {
    collapsed = { ...collapsed, [label]: !collapsed[label] };
  }

  /* ── Collapse state per symbol (for children) ────────────── */

  let symbolCollapsed = $state<Record<string, boolean>>({});

  function toggleSymbol(name: string) {
    symbolCollapsed = { ...symbolCollapsed, [name]: !symbolCollapsed[name] };
  }

  /* ── Navigation ──────────────────────────────────────────── */

  function navigateTo(sym: DocumentSymbol) {
    window.dispatchEvent(
      new CustomEvent('actone:outline-navigate', {
        detail: {
          line: sym.selectionRange.start.line,
          character: sym.selectionRange.start.character,
        },
      }),
    );
  }

  /* ── Listen for symbol updates ───────────────────────────── */

  onMount(() => {
    function handleSymbolsUpdated(e: Event) {
      const detail = (e as CustomEvent<{ symbols: DocumentSymbol[] }>).detail;
      symbols = detail.symbols;
    }
    window.addEventListener('actone:symbols-updated', handleSymbolsUpdated);

    // Request current symbols from the editor so the outline isn't blank on mount
    window.dispatchEvent(new CustomEvent('actone:request-symbols'));

    return () => {
      window.removeEventListener('actone:symbols-updated', handleSymbolsUpdated);
    };
  });
</script>

<div class="flex h-full w-full flex-col overflow-hidden bg-surface-850">
  <!-- Header -->
  <div class="flex h-8 shrink-0 items-center border-b border-[#252525] px-3">
    <span class="text-[10px] font-semibold uppercase tracking-wider text-white/40">Outline</span>
  </div>

  <div class="flex-1 overflow-y-auto px-1 py-2 text-xs">
    {#if symbols.length === 0}
      <p class="px-3 py-4 text-center text-white/30">No symbols</p>
    {:else}
      {#each categories as cat}
        {@const items = getSymbolsForCategory(cat)}
        {#if items.length > 0}
          <!-- Category header -->
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
          <div
            class="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/40 hover:bg-white/5 hover:text-white/50"
            onclick={() => toggleCategory(cat.label)}
          >
            <ChevronRight
              size={10}
              class="shrink-0 transition-transform {collapsed[cat.label] ? '' : 'rotate-90'}"
            />
            <cat.icon size={11} class="shrink-0 {cat.iconColor}" />
            <span>{cat.label}</span>
            <span class="ml-auto font-normal text-white/20">{items.length}</span>
          </div>

          {#if !collapsed[cat.label]}
            <ul class="mb-1">
              {#each items as sym}
                {@const hasChildren = sym.children && sym.children.length > 0}
                <li>
                  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
                  <div
                    class="flex cursor-pointer items-center gap-1 rounded py-0.5 pl-5 pr-2 text-white/70 hover:bg-white/5 hover:text-white/90"
                    onclick={() => navigateTo(sym)}
                  >
                    {#if hasChildren}
                      <button
                        class="shrink-0 rounded p-0.5 text-white/30 hover:text-white/60"
                        onclick={(e) => { e.stopPropagation(); toggleSymbol(sym.name); }}
                      >
                        <ChevronRight
                          size={10}
                          class="transition-transform {symbolCollapsed[sym.name] ? '' : 'rotate-90'}"
                        />
                      </button>
                    {:else}
                      <span class="w-[18px] shrink-0"></span>
                    {/if}
                    <span class="truncate">{sym.name}</span>
                  </div>

                  {#if hasChildren && !symbolCollapsed[sym.name]}
                    <ul>
                      {#each sym.children ?? [] as child}
                        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
                        <li
                          class="cursor-pointer truncate rounded py-0.5 pl-11 pr-2 text-white/40 hover:bg-white/5 hover:text-white/60"
                          onclick={() => navigateTo(child)}
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
</div>
