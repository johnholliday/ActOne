<script lang="ts">
  import { getDocPanelState } from '$lib/stores/doc-panel.svelte.js';
  import ChevronRight from 'lucide-svelte/icons/chevron-right';
  import ChevronDown from 'lucide-svelte/icons/chevron-down';
  import BookOpen from 'lucide-svelte/icons/book-open';
  import FileText from 'lucide-svelte/icons/file-text';

  const docPanel = getDocPanelState();

  interface DocPage {
    title: string;
    url: string;
  }

  interface DocSectionEntry {
    key: string;
    title: string;
    pages: DocPage[];
  }

  interface DocNav {
    sections: DocSectionEntry[];
  }

  let expanded = $state(true);
  let expandedSections = $state<Record<string, boolean>>({});
  let navigation = $state<DocNav | null>(null);

  // Fetch navigation.json on first render
  $effect(() => {
    if (!navigation) {
      fetch('/guide/navigation.json')
        .then((res) => (res.ok ? (res.json() as Promise<DocNav>) : null))
        .catch(() => null)
        .then((data) => {
          if (data) navigation = data;
        });
    }
  });

  function toggleSection(key: string) {
    expandedSections = { ...expandedSections, [key]: !expandedSections[key] };
  }

  function isSectionExpanded(key: string): boolean {
    return expandedSections[key] ?? false;
  }

  /** Convert a navigation URL like "/getting-started/01-introduction/" to a doc slug */
  function urlToSlug(url: string): string {
    return url.replace(/^\//, '').replace(/\/$/, '');
  }

  function handlePageClick(url: string) {
    const slug = urlToSlug(url);
    docPanel.openDoc(slug);
  }

  function isActivePage(url: string): boolean {
    return docPanel.open && docPanel.docSlug === urlToSlug(url);
  }
</script>

<div class="flex flex-col px-2 pt-4">
  <!-- Section header -->
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="flex items-center gap-1 px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-text-muted hover:text-text-secondary cursor-pointer"
    onclick={() => { expanded = !expanded; }}
  >
    <span class="truncate">DOCUMENTATION</span>
    <ChevronDown size={10} class="shrink-0 transition-transform {expanded ? '' : '-rotate-90'}" />
  </div>

  {#if expanded && navigation}
    <div class="flex flex-col">
      {#each navigation.sections as section}
        <!-- Sub-section header (e.g., Getting Started) -->
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
        <div
          class="flex h-7 cursor-pointer items-center gap-1.5 rounded px-2.5 text-[12px] font-medium text-text-secondary hover:bg-surface-raised/20"
          onclick={() => toggleSection(section.key)}
        >
          {#if isSectionExpanded(section.key)}
            <ChevronDown size={12} class="shrink-0 text-text-muted" />
            <BookOpen size={14} class="shrink-0 text-green-500/70" />
          {:else}
            <ChevronRight size={12} class="shrink-0 text-text-muted" />
            <BookOpen size={14} class="shrink-0 text-green-500/70" />
          {/if}
          <span class="truncate">{section.title}</span>
        </div>

        <!-- Pages list -->
        {#if isSectionExpanded(section.key)}
          <div class="ml-2 flex flex-col gap-0">
            {#each section.pages as page}
              {@const active = isActivePage(page.url)}
              <button
                class="flex h-7 items-center gap-2 rounded px-2.5 text-[12px] transition-colors
                  {active ? 'text-text-primary bg-surface-raised/20' : 'text-text-secondary hover:text-text-primary'}"
                onclick={() => handlePageClick(page.url)}
              >
                <FileText size={14} class="shrink-0 {active ? 'text-green-500/70' : ''}" />
                <span class="truncate">{page.title}</span>
              </button>
            {/each}
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>
