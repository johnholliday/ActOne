<script lang="ts">
  import type { DocumentSymbol } from '$lib/editor/langium-client.js';
  import type { CursorPosition } from '$lib/stores/editor.svelte.js';
  import FileCode from 'lucide-svelte/icons/file-code';
  import ChevronRight from 'lucide-svelte/icons/chevron-right';

  interface Props {
    symbols: DocumentSymbol[];
    cursor: CursorPosition;
    fileName: string;
  }

  let { symbols, cursor, fileName }: Props = $props();

  /**
   * Walk the DocumentSymbol tree to find the deepest symbol
   * whose range contains the cursor position.
   * LSP lines are 0-based; CursorPosition lines are 1-based.
   */
  function findBreadcrumbPath(
    syms: DocumentSymbol[],
    cursorLine: number,
    cursorCol: number,
  ): DocumentSymbol[] {
    const lspLine = cursorLine - 1;
    const lspChar = cursorCol - 1;

    for (const sym of syms) {
      const { start, end } = sym.range;
      const afterStart =
        lspLine > start.line || (lspLine === start.line && lspChar >= start.character);
      const beforeEnd =
        lspLine < end.line || (lspLine === end.line && lspChar <= end.character);

      if (afterStart && beforeEnd) {
        if (sym.children && sym.children.length > 0) {
          const childPath = findBreadcrumbPath(sym.children, cursorLine, cursorCol);
          return [sym, ...childPath];
        }
        return [sym];
      }
    }
    return [];
  }

  const breadcrumbPath = $derived(findBreadcrumbPath(symbols, cursor.line, cursor.column));
</script>

<div class="flex h-[22px] items-center gap-0.5 overflow-hidden border-b border-[#252525] bg-surface-850 px-3 text-[11px] text-white/40">
  <FileCode size={11} class="shrink-0 text-amber-500/50" />
  <span class="ml-1 truncate">{fileName}</span>
  {#each breadcrumbPath as sym}
    <ChevronRight size={10} class="shrink-0 text-white/20" />
    <span class="truncate">{sym.name}</span>
  {/each}
</div>
