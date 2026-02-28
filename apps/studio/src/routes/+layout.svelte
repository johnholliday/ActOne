<script lang="ts">
  /**
   * T135: Resizable three-zone layout with drag handles
   * and panel visibility persistence.
   */
  import { invalidate } from '$app/navigation';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import '../app.css';
  import { uiStore, type DiagramView } from '$lib/stores/ui.svelte.js';
  import { projectStore, type ProjectMeta, type SourceFileEntry } from '$lib/stores/project.svelte.js';
  import { astStore } from '$lib/stores/ast.svelte.js';
  import { editorStore } from '$lib/stores/editor.svelte.js';
  import { extractAnalytics } from '$lib/project/analytics.js';
  import { requestTransition } from '$lib/project/lifecycle.js';
  import MenuBar from '$lib/components/MenuBar.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import FileText from 'lucide-svelte/icons/file-text';
  import BookOpen from 'lucide-svelte/icons/book-open';
  import GitBranch from 'lucide-svelte/icons/git-branch';
  import ImageIcon from 'lucide-svelte/icons/image';
  import Book from 'lucide-svelte/icons/book';
  import Activity from 'lucide-svelte/icons/activity';
  import File from 'lucide-svelte/icons/file';
  import ChevronUp from 'lucide-svelte/icons/chevron-up';
  import ChevronDown from 'lucide-svelte/icons/chevron-down';

  import type { LifecycleStage } from '@repo/shared';

  let { data, children } = $props();

  /* ── New Project Dialog ──────────────────────────────────────── */
  let showNewProjectDialog = $state(false);
  let newProjectTitle = $state('');
  let newProjectAuthor = $state('');
  let newProjectGenre = $state('');
  let newProjectCreating = $state(false);
  let newProjectError = $state('');

  /* ── Project Selector ─────────────────────────────────────── */
  let projectSelectorOpen = $state(false);

  /* ── User Profile Menu ──────────────────────────────────────── */
  let profileMenuOpen = $state(false);

  /* ── Status Toast ───────────────────────────────────────────── */
  let toastMessage = $state('');
  let toastVisible = $state(false);

  function showToast(message: string) {
    toastMessage = message;
    toastVisible = true;
    setTimeout(() => { toastVisible = false; }, 3000);
  }

  /* ── AbortController for in-flight menu actions ─────────────── */
  let activeAbort = $state<AbortController | null>(null);

  function getAbortSignal(): AbortSignal {
    activeAbort?.abort();
    const controller = new AbortController();
    activeAbort = controller;
    return controller.signal;
  }

  let sidebarWidth = $state(256);
  let bottomHeight = $state(192);
  let resizingSidebar = $state(false);
  let resizingBottom = $state(false);
  let bottomTab = $state<'problems' | 'output' | 'terminal'>('problems');

  const navItems = [
    { icon: FileText, label: 'Editor', route: '/', match: (p: string) => p === '/' },
    { icon: BookOpen, label: 'Story Bible', route: '/story-bible', match: (p: string) => p.startsWith('/story-bible') },
    { icon: GitBranch, label: 'Diagrams', route: '/diagram/story-structure', match: (p: string) => p.startsWith('/diagram') },
    { icon: ImageIcon, label: 'Gallery', route: '/gallery', match: (p: string) => p.startsWith('/gallery') },
    { icon: Book, label: 'Reading Mode', route: '/reading-mode', match: (p: string) => p.startsWith('/reading-mode') },
    { icon: Activity, label: 'Statistics', route: '/statistics', match: (p: string) => p.startsWith('/statistics') },
  ] as const;

  /** Extract user initials from validated user metadata */
  const userInitials = $derived.by(() => {
    const meta = data.user?.user_metadata;
    if (!meta) return '?';
    const name = (meta.full_name ?? meta.name ?? data.user?.email ?? '') as string;
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0]![0]!.toUpperCase();
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  });

  const userName = $derived.by(() => {
    const meta = data.user?.user_metadata;
    return ((meta?.full_name ?? meta?.name ?? '') as string) || 'User';
  });

  const userEmail = $derived(data.user?.email ?? '');

  /** Avatar URL from OAuth provider (GitHub: avatar_url, Google: avatar_url or picture) */
  const userAvatarUrl = $derived.by(() => {
    const meta = data.user?.user_metadata;
    return ((meta?.avatar_url ?? meta?.picture ?? '') as string) || '';
  });

  /* ── T009: New project creation handler ──────────────────────── */
  async function handleCreateProject() {
    if (!newProjectTitle.trim()) {
      newProjectError = 'Project title is required';
      return;
    }
    newProjectCreating = true;
    newProjectError = '';
    try {
      const res = await fetch('/api/project/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProjectTitle.trim(),
          authorName: newProjectAuthor.trim() || undefined,
          genre: newProjectGenre.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        newProjectError = text || `Error ${res.status}`;
        return;
      }

      const result = await res.json() as { id: string; title: string; entryFilePath: string };

      // Load the newly created project into the store
      await projectStore.loadFromServer(data.supabase);

      // Refresh server-side data so data.projects includes the new project
      await invalidate('supabase:auth');

      showNewProjectDialog = false;
      newProjectTitle = '';
      newProjectAuthor = '';
      newProjectGenre = '';

      // Navigate to editor
      await goto('/');
    } catch (err) {
      newProjectError = err instanceof Error ? err.message : 'Failed to create project';
    } finally {
      newProjectCreating = false;
    }
  }

  /* ── Project switch handler ────────────────────────────────── */
  async function handleSwitchProject(projectId: string) {
    projectSelectorOpen = false;
    if (projectId === projectStore.project?.id) return;
    await projectStore.loadById(data.supabase, projectId);
    // Refresh server-side data to keep data.projects up to date
    await invalidate('supabase:auth');
    // Navigate to editor with fresh project
    await goto('/');
  }

  /* ── T021: Advance lifecycle stage handler ─────────────────── */
  async function handleAdvanceStage(target: LifecycleStage) {
    const projectId = projectStore.project?.id;
    if (!projectId) return;
    const signal = getAbortSignal();
    try {
      const result = await requestTransition(projectId, target);
      if (signal.aborted) return;
      if (result.success) {
        projectStore.updateStage(result.currentStage);
        showToast(`Stage advanced to ${result.currentStage}`);
      } else {
        showToast(`Failed: ${result.error ?? 'Unknown error'}`);
      }
    } catch (err) {
      if (signal.aborted) return;
      showToast('Failed to advance stage');
    }
  }

  /* ── T022: Take analytics snapshot handler ─────────────────── */
  async function handleSnapshot() {
    const projectId = projectStore.project?.id;
    const ast = astStore.activeAst;
    if (!projectId || !ast) return;
    const signal = getAbortSignal();
    try {
      const analytics = extractAnalytics(ast);
      const body = {
        projectId,
        wordCount: analytics.wordCount,
        sceneCount: analytics.sceneCount,
        characterCount: analytics.characterCount,
        metrics: {
          sceneTypeDistribution: analytics.sceneTypeDistribution,
          characterScreenTime: Object.fromEntries(
            analytics.characterScreenTime.map((c) => [c.name, c.sceneCount]),
          ),
          pacingRhythm: analytics.pacingRhythm.map((p) => p.sceneType),
        },
      };
      const res = await fetch('/api/analytics/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      });
      if (signal.aborted) return;
      if (res.ok) {
        const data = await res.json() as { capturedAt: string };
        showToast(`Snapshot captured at ${new Date(data.capturedAt).toLocaleTimeString()}`);
      } else {
        showToast('Failed to capture snapshot');
      }
    } catch (err) {
      if (signal.aborted) return;
      showToast('Failed to capture snapshot');
    }
  }

  /* ── T023: Diagram navigation handler ──────────────────────── */
  function handleDiagram(view: DiagramView) {
    const routeMap: Record<DiagramView, string> = {
      'story-structure': '/diagram/story-structure',
      'character-network': '/diagram/character-network',
      'world-map': '/diagram/world-map',
      'timeline': '/diagram/timeline',
      'interaction-sequence': '/diagram/interaction',
    };
    uiStore.setDiagramView(view);
    void goto(routeMap[view]);
  }

  /* ── T024: Generate prose handler ──────────────────────────── */
  function handleGenerate() {
    window.dispatchEvent(new CustomEvent('actone:generate-prose'));
  }

  /* ── T032: Sign out handler ────────────────────────────────── */
  async function handleSignOut() {
    // T033: Check for unsaved changes before signing out
    if (editorStore.hasUnsavedChanges) {
      const confirmed = confirm('You have unsaved changes. Discard changes and sign out?');
      if (!confirmed) return;
    }
    await data.supabase.auth.signOut();
    projectStore.clear();
    await goto('/auth');
  }

  onMount(() => {
    const {
      data: { subscription },
    } = data.supabase.auth.onAuthStateChange((_event: string, newSession: unknown) => {
      if (newSession !== data.session) {
        invalidate('supabase:auth');
      }
    });

    // T005: Load the most recent project on mount if server data provides projects
    if (data.session) {
      void (async () => {
        await projectStore.loadFromServer(data.supabase);

        // Auto-create a default project for new users with no projects
        if (!projectStore.isLoaded) {
          try {
            const res = await fetch('/api/project/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: 'My Story' }),
            });
            if (res.ok) {
              await projectStore.loadFromServer(data.supabase);
            }
          } catch {
            // Silent — user can create manually via New Project dialog
          }
        }
      })();
    } else {
      // No session — nothing to load, allow pages to render immediately
      projectStore.loading = false;
    }

    // T136: Global keyboard shortcuts
    function handleKeydown(e: KeyboardEvent) {
      // Ctrl+G: Generate scene prose
      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        handleGenerate();
      }
      // Ctrl+1–5: Switch diagram views
      if (e.ctrlKey && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const views = [
          '/diagram/story-structure',
          '/diagram/character-network',
          '/diagram/world-map',
          '/diagram/timeline',
          '/diagram/interaction',
        ] as const;
        const idx = parseInt(e.key) - 1;
        if (views[idx]) void goto(views[idx]);
      }
      // Ctrl+B: Toggle sidebar
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        uiStore.toggleSidebar();
      }
      // Ctrl+J: Toggle bottom panel
      if (e.ctrlKey && e.key === 'j') {
        e.preventDefault();
        uiStore.toggleBottomPanel();
      }
      // Ctrl+Shift+F: Format document
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('actone:format-document'));
      }
    }
    window.addEventListener('keydown', handleKeydown);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('keydown', handleKeydown);
    };
  });

  function handleSidebarMouseDown(e: MouseEvent) {
    e.preventDefault();
    resizingSidebar = true;
    const onMouseMove = (e: MouseEvent) => {
      sidebarWidth = Math.max(180, Math.min(480, e.clientX));
    };
    const onMouseUp = () => {
      resizingSidebar = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function handleBottomMouseDown(e: MouseEvent) {
    e.preventDefault();
    resizingBottom = true;
    const onMouseMove = (e: MouseEvent) => {
      bottomHeight = Math.max(100, Math.min(500, window.innerHeight - e.clientY));
    };
    const onMouseUp = () => {
      resizingBottom = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }
</script>

<svelte:window onclick={() => { profileMenuOpen = false; projectSelectorOpen = false; }} />

{#if !data.session}
  <!-- Unauthenticated: render page content directly (e.g. /auth) -->
  {@render children()}
{:else}
  <div class="flex h-screen w-screen overflow-hidden bg-surface-900 text-white">
    <!-- Sidebar -->
    {#if uiStore.sidebarVisible}
      <aside
        class="flex flex-col border-r border-[#252525] bg-surface-800"
        style="width: {sidebarWidth}px;"
      >
        <!-- Sidebar header -->
        <div class="flex h-12 items-center gap-2 px-4">
          <img src="/images/masks.png" alt="ActOne" class="h-7 w-7" />
          <span class="text-[13px] font-semibold text-white" style="font-family: 'Cormorant Garamond', serif; letter-spacing: 4px;">ACTONE</span>
        </div>

        <!-- Navigation items -->
        <nav class="flex flex-col gap-0.5 px-2 py-2">
          {#each navItems as item}
            {@const active = item.match(page.url.pathname)}
            <a
              href={item.route}
              class="flex h-8 items-center gap-2.5 rounded px-2.5 text-[13px] transition-colors
                {active ? 'bg-[#F59E0B40] text-amber-300' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}"
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </a>
          {/each}
        </nav>

        <!-- PROJECT files section with project selector -->
        <div class="relative flex flex-col px-2 pt-4">
          <button
            class="flex items-center gap-1 px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600 hover:text-zinc-400"
            onclick={(e) => { e.stopPropagation(); projectSelectorOpen = !projectSelectorOpen; }}
          >
            <span class="truncate">{projectStore.project?.title ?? 'PROJECT'}</span>
            <ChevronDown size={10} class="shrink-0 transition-transform {projectSelectorOpen ? 'rotate-180' : ''}" />
          </button>

          {#if projectSelectorOpen}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              class="absolute left-2 right-2 top-full z-50 mt-0.5 max-h-64 overflow-y-auto rounded-md border border-[#252525] bg-surface-800 py-1 shadow-lg"
              role="menu"
              tabindex="-1"
              onclick={(e) => e.stopPropagation()}
            >
              {#each data.projects as p}
                <button
                  class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-white/70 hover:bg-white/10"
                  role="menuitem"
                  onclick={() => void handleSwitchProject(p.id)}
                >
                  {#if p.id === projectStore.project?.id}
                    <span class="w-4 text-amber-400">&#10003;</span>
                  {:else}
                    <span class="w-4"></span>
                  {/if}
                  <span class="truncate">{p.title}</span>
                </button>
              {/each}

              {#if data.projects.length > 0}
                <div class="my-1 border-t border-[#252525]"></div>
              {/if}

              <button
                class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-amber-400 hover:bg-white/10"
                role="menuitem"
                onclick={() => { projectSelectorOpen = false; showNewProjectDialog = true; }}
              >
                <span class="w-4">+</span>
                <span>New Project</span>
              </button>
            </div>
          {/if}

          <div class="flex flex-col gap-0">
            {#each projectStore.files as file}
              {@const isActive = projectStore.entryFile?.id === file.id}
              <button
                class="flex h-7 items-center gap-2 rounded px-2.5 text-[12px] transition-colors
                  {isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-300'}"
              >
                <File size={14} />
                <span class="truncate">{file.filePath}</span>
              </button>
            {/each}
          </div>
        </div>

        <!-- Spacer -->
        <div class="flex-1"></div>

        <!-- T031: User profile footer with popup menu -->
        <div class="relative">
          <button
            class="flex w-full items-center gap-3 border-t border-[#252525] px-3 py-3 transition-colors hover:bg-white/5"
            onclick={(e) => { e.stopPropagation(); profileMenuOpen = !profileMenuOpen; }}
          >
            {#if userAvatarUrl}
              <img src={userAvatarUrl} alt={userName} class="h-8 w-8 shrink-0 rounded-full object-cover" />
            {:else}
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-600 text-[11px] font-semibold text-white">
                {userInitials}
              </div>
            {/if}
            <div class="min-w-0 flex-1 text-left">
              <div class="truncate text-[12px] font-medium text-white">{userName}</div>
              <div class="truncate text-[11px] text-zinc-500">{userEmail}</div>
            </div>
            <ChevronUp size={14} class="shrink-0 text-zinc-500 transition-transform {profileMenuOpen ? '' : 'rotate-180'}" />
          </button>

          {#if profileMenuOpen}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              class="absolute bottom-full left-0 z-50 mb-1 w-full rounded-md border border-[#252525] bg-surface-800 py-1 shadow-lg"
              role="menu"
              tabindex="-1"
              onclick={(e) => e.stopPropagation()}
            >
              <button
                class="flex w-full items-center px-3 py-1.5 text-left text-[12px] text-white/70 hover:bg-white/10 hover:text-white/90"
                role="menuitem"
                onclick={() => { profileMenuOpen = false; void goto('/settings/profile'); }}
              >
                Profile Settings
              </button>
              <button
                class="flex w-full items-center px-3 py-1.5 text-left text-[12px] text-white/70 hover:bg-white/10 hover:text-white/90"
                role="menuitem"
                onclick={() => { profileMenuOpen = false; void goto('/settings/account'); }}
              >
                Account Settings
              </button>
              <button
                class="flex w-full items-center px-3 py-1.5 text-left text-[12px] text-white/70 hover:bg-white/10 hover:text-white/90"
                role="menuitem"
                onclick={() => { profileMenuOpen = false; void goto('/settings/appearance'); }}
              >
                Appearance
              </button>
              <div class="my-1 border-t border-[#252525]"></div>
              <button
                class="flex w-full items-center px-3 py-1.5 text-left text-[12px] text-red-400 hover:bg-white/10 hover:text-red-300"
                role="menuitem"
                onclick={() => { profileMenuOpen = false; void handleSignOut(); }}
              >
                Sign Out
              </button>
            </div>
          {/if}
        </div>
      </aside>

      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div
        class="w-1 cursor-col-resize bg-transparent hover:bg-amber-500/30 {resizingSidebar ? 'bg-amber-500/50' : ''}"
        role="separator"
        tabindex="-1"
        onmousedown={handleSidebarMouseDown}
      ></div>
    {/if}

    <!-- Main content area -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- Top toolbar zone -->
      <header class="flex h-10 items-center border-b border-[#252525] bg-surface-800 px-2">
        <MenuBar
          oncreateproject={() => { showNewProjectDialog = true; }}
          onadvancestage={handleAdvanceStage}
          onsnapshot={handleSnapshot}
          ondiagram={handleDiagram}
          ongenerate={handleGenerate}
          onnavigate={(path) => void goto(path)}
        />
      </header>

      <!-- Primary content -->
      <main class="flex-1 overflow-hidden">
        {@render children()}
      </main>

      <!-- Bottom panel resize handle -->
      {#if uiStore.bottomPanelVisible}
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
          class="h-1 cursor-row-resize bg-transparent hover:bg-amber-500/30 {resizingBottom ? 'bg-amber-500/50' : ''}"
          role="separator"
          tabindex="-1"
          onmousedown={handleBottomMouseDown}
        ></div>

        <!-- Bottom panel zone (diagnostics, output) -->
        <div
          class="flex flex-col border-t border-[#252525] bg-surface-850"
          style="height: {bottomHeight}px;"
        >
          <!-- Tab bar -->
          <div class="flex h-8 items-center gap-4 border-b border-[#252525] px-3">
            {#each ['problems', 'output', 'terminal'] as tab}
              <button
                class="text-[12px] capitalize transition-colors
                  {bottomTab === tab ? 'font-medium text-amber-300' : 'text-zinc-500 hover:text-zinc-300'}"
                onclick={() => bottomTab = tab as typeof bottomTab}
              >
                {tab === 'problems' ? 'Problems' : tab === 'output' ? 'Output' : 'Terminal'}
              </button>
            {/each}
          </div>
          <!-- Tab content -->
          <div class="flex-1 overflow-auto p-3 text-[12px] text-zinc-400">
            {#if bottomTab === 'problems'}
              No problems detected.
            {:else if bottomTab === 'output'}
              <!-- Output content placeholder -->
            {:else}
              <!-- Terminal content placeholder -->
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- T008: New Project Dialog -->
  {#if showNewProjectDialog}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      onclick={() => { if (!newProjectCreating) showNewProjectDialog = false; }}
    >
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <div
        class="w-full max-w-md rounded-lg border border-[#252525] bg-surface-800 p-6 shadow-xl"
        role="presentation"
        onclick={(e) => e.stopPropagation()}
      >
        <h2 class="mb-4 text-lg font-semibold text-white">New Project</h2>

        {#if newProjectError}
          <div class="mb-3 rounded bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {newProjectError}
          </div>
        {/if}

        <div class="mb-3">
          <label for="np-title" class="mb-1 block text-xs font-medium text-zinc-400">Project Title *</label>
          <input
            id="np-title"
            type="text"
            bind:value={newProjectTitle}
            class="w-full rounded border border-[#333] bg-surface-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
            placeholder="My Story"
            disabled={newProjectCreating}
            onkeydown={(e) => { if (e.key === 'Enter') void handleCreateProject(); }}
          />
        </div>

        <div class="mb-3">
          <label for="np-author" class="mb-1 block text-xs font-medium text-zinc-400">Author Name</label>
          <input
            id="np-author"
            type="text"
            bind:value={newProjectAuthor}
            class="w-full rounded border border-[#333] bg-surface-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
            placeholder="Author name"
            disabled={newProjectCreating}
          />
        </div>

        <div class="mb-4">
          <label for="np-genre" class="mb-1 block text-xs font-medium text-zinc-400">Genre</label>
          <input
            id="np-genre"
            type="text"
            bind:value={newProjectGenre}
            class="w-full rounded border border-[#333] bg-surface-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
            placeholder="Fantasy, Sci-Fi, etc."
            disabled={newProjectCreating}
          />
        </div>

        <div class="flex justify-end gap-2">
          <button
            class="rounded px-4 py-2 text-sm text-zinc-400 hover:text-white"
            onclick={() => { showNewProjectDialog = false; newProjectError = ''; }}
            disabled={newProjectCreating}
          >
            Cancel
          </button>
          <button
            class="flex items-center gap-2 rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
            onclick={() => void handleCreateProject()}
            disabled={newProjectCreating}
          >
            {#if newProjectCreating}
              <LoadingSpinner size="sm" />
            {/if}
            Create Project
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Toast notification -->
  {#if toastVisible}
    <div class="fixed bottom-4 right-4 z-50 rounded-lg border border-[#252525] bg-surface-800 px-4 py-2 text-xs text-zinc-300 shadow-lg">
      {toastMessage}
    </div>
  {/if}
{/if}
