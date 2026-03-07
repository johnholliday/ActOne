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
  import { uiStore } from '$lib/stores/ui.svelte.js';
  import { parseLayoutPrefs, serializeLayoutPrefs } from '$lib/settings/layout.js';
  import { projectStore } from '$lib/stores/project.svelte.js';
  import { astStore } from '$lib/stores/ast.svelte.js';
  import { editorStore } from '$lib/stores/editor.svelte.js';
  import { workspaceStore } from '$lib/stores/workspace.svelte.js';
  import { createFile, deleteFile, renameFile, loadFileContent, saveFileContent } from '$lib/editor/supabase-client.js';
  import { extractAnalytics } from '$lib/project/analytics.js';
  import { getStageLabel, requestTransition } from '$lib/project/lifecycle.js';
  import MenuBar from '$lib/components/MenuBar.svelte';
  import StatusBar from '$lib/components/StatusBar.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import DockLayout from '$lib/dockview/DockLayout.svelte';
  import ReadingModePanel from '$lib/panels/ReadingModePanel.svelte';
  import { setDockApi, openPanel } from '$lib/dockview/panel-actions.js';
  import type { DockviewApi } from 'dockview-core';
  import FileText from 'lucide-svelte/icons/file-text';
  import BookOpen from 'lucide-svelte/icons/book-open';
  import GitBranch from 'lucide-svelte/icons/git-branch';
  import ImageIcon from 'lucide-svelte/icons/image';
  import Book from 'lucide-svelte/icons/book';
  import Activity from 'lucide-svelte/icons/activity';
  import ChevronUp from 'lucide-svelte/icons/chevron-up';
  import ChevronDown from 'lucide-svelte/icons/chevron-down';
  import X from 'lucide-svelte/icons/x';
  import Sun from 'lucide-svelte/icons/sun';
  import Moon from 'lucide-svelte/icons/moon';
  import ProjectSection from '$lib/components/ProjectSection.svelte';
  import DocPanel from '$lib/components/DocPanel.svelte';
  import DocSection from '$lib/components/DocSection.svelte';

  import type { LifecycleStage } from '@actone/shared';

  let { data, children } = $props();

  /* ── New Project Dialog ──────────────────────────────────────── */
  let showNewProjectDialog = $state(false);
  let newProjectTitle = $state('');
  let newProjectAuthor = $state('');
  let newProjectGenre = $state('');
  let newProjectCreating = $state(false);
  let newProjectError = $state('');

  /* ── New File Dialog ────────────────────────────────────────── */
  let showNewFileDialog = $state(false);
  let newFileName = $state('');
  let newFileCreating = $state(false);
  let newFileError = $state('');

  /* ── File Context Menu ──────────────────────────────────── */
  import type { SourceFileEntry } from '$lib/stores/project.svelte.js';
  let fileContextMenu = $state<{ x: number; y: number; file: SourceFileEntry } | null>(null);

  function handleFileContextMenu(e: MouseEvent, file: SourceFileEntry) {
    e.preventDefault();
    e.stopPropagation();
    fileContextMenu = { x: e.clientX, y: e.clientY, file };
  }

  function closeFileContextMenu() {
    fileContextMenu = null;
  }

  /* ── Rename File Dialog ────────────────────────────────── */
  let showRenameDialog = $state(false);
  let renameTargetFile = $state<SourceFileEntry | null>(null);
  let renameNewName = $state('');
  let renameInProgress = $state(false);
  let renameError = $state('');

  async function handleRenameFile() {
    if (!renameTargetFile) return;
    const trimmed = renameNewName.trim();
    if (!trimmed) {
      renameError = 'File name is required';
      return;
    }
    const filePath = trimmed.endsWith('.actone') ? trimmed : `${trimmed}.actone`;
    if (filePath.toLowerCase() === renameTargetFile.filePath.toLowerCase()) {
      renameError = 'New name is the same as the current name';
      return;
    }
    const duplicate = projectStore.files.some(
      (f) => f.id !== renameTargetFile!.id && f.filePath.toLowerCase() === filePath.toLowerCase(),
    );
    if (duplicate) {
      renameError = `A file named "${filePath}" already exists`;
      return;
    }
    renameInProgress = true;
    renameError = '';
    try {
      const ok = await renameFile(data.supabase, renameTargetFile.id, filePath);
      if (!ok) {
        renameError = 'Failed to rename file';
        return;
      }
      projectStore.renameFile(renameTargetFile.id, filePath);
      editorStore.renameFile(renameTargetFile.id, filePath);
      // If this file is active, tell EditorPanel to update the Langium document URI
      if (editorStore.activeFileId === renameTargetFile.id) {
        window.dispatchEvent(
          new CustomEvent('actone:rename-active-file', {
            detail: { filePath },
          }),
        );
      }
      showRenameDialog = false;
      renameTargetFile = null;
      renameNewName = '';
    } catch (err) {
      renameError = err instanceof Error ? err.message : 'Failed to rename file';
    } finally {
      renameInProgress = false;
    }
  }

  /* ── Duplicate File Dialog ─────────────────────────────── */
  let showDuplicateDialog = $state(false);
  let duplicateTargetFile = $state<SourceFileEntry | null>(null);
  let duplicateNewName = $state('');
  let duplicateInProgress = $state(false);
  let duplicateError = $state('');

  async function handleDuplicateFile() {
    if (!duplicateTargetFile) return;
    const trimmed = duplicateNewName.trim();
    if (!trimmed) {
      duplicateError = 'File name is required';
      return;
    }
    const filePath = trimmed.endsWith('.actone') ? trimmed : `${trimmed}.actone`;
    const duplicate = projectStore.files.some(
      (f) => f.filePath.toLowerCase() === filePath.toLowerCase(),
    );
    if (duplicate) {
      duplicateError = `A file named "${filePath}" already exists`;
      return;
    }
    const projectId = projectStore.project?.id;
    if (!projectId) return;
    duplicateInProgress = true;
    duplicateError = '';
    try {
      // Load persisted content from DB (not unsaved buffer)
      const loaded = await loadFileContent(data.supabase, duplicateTargetFile.id);
      const content = loaded?.content ?? `// ${filePath}\n`;
      const newFile = await createFile(data.supabase, projectId, filePath, content);
      if (!newFile) {
        duplicateError = 'Failed to duplicate file';
        return;
      }
      projectStore.addFile({
        id: newFile.id,
        filePath: newFile.filePath,
        isEntry: newFile.isEntry,
      });
      window.dispatchEvent(
        new CustomEvent('actone:open-file', {
          detail: { id: newFile.id, filePath: newFile.filePath },
        }),
      );
      showDuplicateDialog = false;
      duplicateTargetFile = null;
      duplicateNewName = '';
    } catch (err) {
      duplicateError = err instanceof Error ? err.message : 'Failed to duplicate file';
    } finally {
      duplicateInProgress = false;
    }
  }

  /* ── Delete File Handler ───────────────────────────────── */
  async function handleDeleteFile(file: SourceFileEntry) {
    closeFileContextMenu();
    const confirmed = confirm(`Delete "${file.filePath}"? This cannot be undone.`);
    if (!confirmed) return;
    try {
      const ok = await deleteFile(data.supabase, file.id);
      if (!ok) return;
      editorStore.forceClose(file.id);
      projectStore.removeFile(file.id);
      // Notify Langium workspace so it removes the document from its index
      window.dispatchEvent(
        new CustomEvent('actone:remove-workspace-file', {
          detail: { filePath: `file:///${file.filePath}` },
        }),
      );
      // If no tabs remain, reopen the entry file
      if (editorStore.openFiles.length === 0) {
        const entry = projectStore.entryFile;
        if (entry) {
          window.dispatchEvent(
            new CustomEvent('actone:open-file', {
              detail: { id: entry.id, filePath: entry.filePath },
            }),
          );
        }
      }
    } catch {
      // Silent failure — file remains in sidebar
    }
  }

  /* ── Open Project Dialog ─────────────────────────────────── */
  let showOpenProjectDialog = $state(false);
  let openProjectSearch = $state('');
  let openProjectHighlight = $state(0);

  const filteredProjects = $derived.by(() => {
    const query = openProjectSearch.trim().toLowerCase();
    if (!query) return data.projects;
    return data.projects.filter((p) => p.title.toLowerCase().includes(query));
  });

  // Reset highlight when search filter changes
  $effect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    openProjectSearch;
    openProjectHighlight = 0;
  });

  function handleOpenProjectKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      openProjectHighlight = Math.min(openProjectHighlight + 1, filteredProjects.length - 1);
      scrollHighlightedIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      openProjectHighlight = Math.max(openProjectHighlight - 1, 0);
      scrollHighlightedIntoView();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredProjects[openProjectHighlight];
      if (target) {
        void handleOpenProjectFromDialog(target.id);
      }
    }
  }

  function scrollHighlightedIntoView() {
    // Use requestAnimationFrame to ensure DOM update has happened
    requestAnimationFrame(() => {
      const el = document.querySelector('[data-project-highlight="true"]');
      el?.scrollIntoView({ block: 'nearest' });
    });
  }

  async function handleOpenProjectFromDialog(projectId: string) {
    showOpenProjectDialog = false;
    openProjectSearch = '';
    await handleSwitchProject(projectId);
  }

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

  let resizingSidebar = $state(false);

  const navItems = [
    { icon: FileText, label: 'Editor', panelId: 'editor' },
    { icon: BookOpen, label: 'Story Bible', panelId: 'story-bible' },
    { icon: GitBranch, label: 'Diagrams', panelId: 'diagram-story-structure' },
    { icon: ImageIcon, label: 'Asset Gallery', panelId: 'gallery' },
    { icon: Book, label: 'Reading Mode', panelId: 'reading-mode' },
    { icon: Activity, label: 'Statistics', panelId: 'statistics' },
  ] as const;

  /** Whether the current route is a settings page (rendered outside dockview) */
  const isSettingsRoute = $derived(page.url.pathname.startsWith('/settings'));

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
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          title: newProjectTitle.trim(),
          authorName: newProjectAuthor.trim() || undefined,
          genre: newProjectGenre.trim() || undefined,
        }),
      });

      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        newProjectError = res.ok
          ? 'Unexpected response from server (not JSON). You may need to sign in again.'
          : `Error ${res.status}: server returned a non-JSON response`;
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null) as { message?: string } | null;
        newProjectError = body?.message || `Error ${res.status}`;
        return;
      }

      const result = await res.json() as { id: string; title: string; entryFilePath: string };

      // Load the newly created project into the cache
      await projectStore.loadById(data.supabase, result.id);

      // Add to workspace and make active
      workspaceStore.openProject(result.id);
      workspaceStore.setActiveProject(result.id);

      // Refresh server-side data so data.projects includes the new project
      await invalidate('supabase:auth');

      showNewProjectDialog = false;
      newProjectTitle = '';
      newProjectAuthor = '';
      newProjectGenre = '';

      // Open the new project's entry file in the editor
      const cached = projectStore.getProject(result.id);
      const entryFile = cached?.files.find((f) => f.filePath === result.entryFilePath);
      if (entryFile && cached) {
        window.dispatchEvent(
          new CustomEvent('actone:open-file', {
            detail: {
              id: entryFile.id,
              filePath: entryFile.filePath,
              projectId: cached.meta.id,
              projectTitle: cached.meta.title,
            },
          }),
        );
      }

      // Navigate to editor
      await goto('/');
    } catch (err) {
      newProjectError = err instanceof Error ? err.message : 'Failed to create project';
    } finally {
      newProjectCreating = false;
    }
  }

  /* ── New file creation handler ─────────────────────────────── */
  async function handleCreateFile() {
    const trimmed = newFileName.trim();
    if (!trimmed) {
      newFileError = 'File name is required';
      return;
    }
    const filePath = trimmed.endsWith('.actone') ? trimmed : `${trimmed}.actone`;
    const duplicate = projectStore.files.some(
      (f) => f.filePath.toLowerCase() === filePath.toLowerCase(),
    );
    if (duplicate) {
      newFileError = `A file named "${filePath}" already exists`;
      return;
    }
    const projectId = projectStore.project?.id;
    if (!projectId) return;
    newFileCreating = true;
    newFileError = '';
    try {
      const defaultContent = `// ${filePath}\n`;
      const newFile = await createFile(data.supabase, projectId, filePath, defaultContent);
      if (!newFile) {
        newFileError = 'Failed to create file';
        return;
      }
      projectStore.addFile({
        id: newFile.id,
        filePath: newFile.filePath,
        isEntry: newFile.isEntry,
      });
      window.dispatchEvent(
        new CustomEvent('actone:open-file', {
          detail: { id: newFile.id, filePath: newFile.filePath },
        }),
      );
      showNewFileDialog = false;
      newFileName = '';
    } catch (err) {
      newFileError = err instanceof Error ? err.message : 'Failed to create file';
    } finally {
      newFileCreating = false;
    }
  }

  /* ── Project switch handler (multi-project: adds to workspace) ─ */
  async function handleSwitchProject(projectId: string) {
    projectSelectorOpen = false;

    // Load if not yet in workspace
    if (!workspaceStore.isOpen(projectId)) {
      const loaded = await projectStore.loadById(data.supabase, projectId);
      if (!loaded) return;
      workspaceStore.openProject(projectId);
    }

    // Determine target file (existing tab or entry file)
    const cached = projectStore.getProject(projectId);
    if (!cached) return;
    const projectTabs = editorStore.getFilesForProject(projectId);
    const targetFile = projectTabs.length > 0
      ? projectTabs[0]!
      : cached.files.find((f) => f.isEntry);
    if (!targetFile) return;

    // Always route through actone:open-file → handleSwitchTab
    window.dispatchEvent(
      new CustomEvent('actone:open-file', {
        detail: {
          id: targetFile.id,
          filePath: targetFile.filePath,
          projectId: cached.meta.id,
          projectTitle: cached.meta.title,
        },
      }),
    );

    await invalidate('supabase:auth');
  }

  /* ── Project context menu ──────────────────────────────────── */
  let projectContextMenu = $state<{ x: number; y: number } | null>(null);

  function handleProjectContextMenu(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    projectContextMenu = { x: e.clientX, y: e.clientY };
  }

  function closeProjectContextMenu() {
    projectContextMenu = null;
  }

  async function handleCloseProject() {
    closeProjectContextMenu();
    const activeId = workspaceStore.activeProjectId;
    if (!activeId) return;

    // Check for unsaved changes in this project's tabs
    const projectFiles = editorStore.getFilesForProject(activeId);
    const hasDirty = projectFiles.some((f) => f.isDirty);
    if (hasDirty) {
      const confirmed = confirm('You have unsaved changes. Discard changes and close project?');
      if (!confirmed) return;
    }

    // Close all tabs for this project
    editorStore.closeAllForProject(activeId);
    // Remove from cache and workspace
    projectStore.unloadProject(activeId);
    workspaceStore.closeProject(activeId);
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

  /* ── Dockview ready handler ────────────────────────────────── */
  function handleDockReady(api: DockviewApi) {
    setDockApi(api);
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
    editorStore.closeAll();
    projectStore.clear();
    workspaceStore.clear();
    await goto('/auth');
  }

  /** Persist sidebar layout state to localStorage */
  function persistLayout() {
    localStorage.setItem('actone:layout', serializeLayoutPrefs({
      sidebarWidth: uiStore.sidebarWidth,
      sidebarVisible: uiStore.sidebarVisible,
      outlineVisible: uiStore.outlineVisible,
      outlineWidth: uiStore.outlineWidth,
      statusBarVisible: uiStore.statusBarVisible,
    }));
  }

  let layoutPrefsLoaded = $state(false);

  // Persist layout prefs reactively when toggle states change
  $effect(() => {
    // Read reactive values to establish tracking
    void uiStore.sidebarVisible;
    void uiStore.outlineVisible;
    void uiStore.outlineWidth;
    void uiStore.statusBarVisible;
    // Only persist after initial load to avoid overwriting with defaults
    if (layoutPrefsLoaded) {
      persistLayout();
    }
  });

  onMount(() => {
    // Apply theme from localStorage on mount
    uiStore.applyTheme();

    // Load sidebar preferences (panel layout is managed by dockview persistence)
    const layoutPrefs = parseLayoutPrefs(localStorage.getItem('actone:layout'));
    uiStore.resizeSidebar(layoutPrefs.sidebarWidth);
    uiStore.sidebarVisible = layoutPrefs.sidebarVisible;
    uiStore.outlineVisible = layoutPrefs.outlineVisible;
    uiStore.resizeOutline(layoutPrefs.outlineWidth);
    uiStore.statusBarVisible = layoutPrefs.statusBarVisible;
    layoutPrefsLoaded = true;

    const {
      data: { subscription },
    } = data.supabase.auth.onAuthStateChange((_event: string, newSession: unknown) => {
      if (newSession !== data.session) {
        invalidate('supabase:auth');
      }
    });

    // Restore workspace state and load all previously open projects
    if (data.session && data.user) {
      void (async () => {
        workspaceStore.restore(data.user!.id);

        if (workspaceStore.openProjectIds.length > 0) {
          // Batch-load all previously open projects
          const loadPromises = workspaceStore.openProjectIds.map((id) =>
            projectStore.loadById(data.supabase, id),
          );
          const results = await Promise.all(loadPromises);

          // Remove any projects that failed to load (deleted or inaccessible)
          workspaceStore.openProjectIds.forEach((id, i) => {
            if (!results[i]) {
              workspaceStore.closeProject(id);
            }
          });

          // If active project was removed, workspace will auto-pick last remaining
          projectStore.loading = false;
        } else {
          // No saved workspace — load the most recent project as default
          const mostRecent = data.projects?.[0];
          if (mostRecent) {
            await projectStore.loadById(data.supabase, mostRecent.id);
            workspaceStore.openProject(mostRecent.id);
            workspaceStore.setActiveProject(mostRecent.id);
          } else {
            // New user with no projects — auto-create a default project
            try {
              const res = await fetch('/api/project/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'My Story' }),
              });
              if (res.ok) {
                const result = await res.json() as { id: string };
                await projectStore.loadById(data.supabase, result.id);
                workspaceStore.openProject(result.id);
                workspaceStore.setActiveProject(result.id);
                await invalidate('supabase:auth');
              }
            } catch {
              // Silent — user can create manually via New Project dialog
            }
          }
          projectStore.loading = false;
        }
      })();
    } else {
      // No session — nothing to load, allow pages to render immediately
      projectStore.loading = false;
    }

    // T136: Global keyboard shortcuts
    function handleKeydown(e: KeyboardEvent) {
      // Ctrl+S: Save file
      if (e.ctrlKey && !e.shiftKey && e.key === 's') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('actone:save-file'));
      }
      // Ctrl+O: Open project dialog
      if (e.ctrlKey && !e.shiftKey && e.key === 'o') {
        e.preventDefault();
        showOpenProjectDialog = true;
      }
      // Ctrl+G: Generate scene prose
      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        handleGenerate();
      }
      // Ctrl+1–5: Open diagram panels
      if (e.ctrlKey && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const panels = [
          'diagram-story-structure',
          'diagram-character-network',
          'diagram-world-map',
          'diagram-timeline',
          'diagram-interaction',
        ] as const;
        const idx = parseInt(e.key) - 1;
        if (panels[idx]) openPanel(panels[idx]);
      }
      // Ctrl+B: Toggle sidebar
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        uiStore.toggleSidebar();
      }
      // Ctrl+Shift+F: Format document
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('actone:format-document'));
      }
      // Alt+Z: Toggle word wrap
      if (e.altKey && e.key === 'z') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('actone:toggle-word-wrap'));
      }
    }
    window.addEventListener('keydown', handleKeydown);

    function handleOpenProject() {
      showOpenProjectDialog = true;
    }
    window.addEventListener('actone:open-project', handleOpenProject);

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (editorStore.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);

    /* ── Extract element to new file ───────────────────────── */

    const TYPE_KEYWORDS: Record<string, string> = {
      CharacterDef: 'character',
      WorldDef: 'world',
      ThemeDef: 'theme',
      TimelineDef: 'timeline',
      SceneDef: 'scene',
      PlotDef: 'plot',
      InteractionDef: 'interaction',
    };


    function findElementRange(
      content: string,
      elType: string,
      name: string,
    ): { startLine: number; endLine: number } | null {
      const keyword = TYPE_KEYWORDS[elType];
      if (!keyword) return null;

      const lines = content.split('\n');
      // Match: keyword Name { or keyword "Name" {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(
        `^\\s*${keyword}\\s+(?:${escaped}|"${escaped}")\\s*\\{`,
      );

      for (let i = 0; i < lines.length; i++) {
        if (!pattern.test(lines[i]!)) continue;

        // Found the start — track brace depth to find closing }
        let depth = 0;
        for (let j = i; j < lines.length; j++) {
          for (const ch of lines[j]!) {
            if (ch === '{') depth++;
            else if (ch === '}') depth--;
          }
          if (depth === 0) {
            return { startLine: i, endLine: j };
          }
        }
        break; // Unbalanced braces — bail
      }
      return null;
    }

    async function handleExtractElement(e: Event) {
      const detail = (
        e as CustomEvent<{ name: string; $type: string; sourceUri: string | null }>
      ).detail;
      const name = detail.name;
      const elType = detail.$type;
      const sourceUri = detail.sourceUri;

      const projectId = projectStore.project?.id;
      if (!projectId || !sourceUri) {
        showToast('Cannot extract: no source file found');
        return;
      }

      // Resolve source file
      const filePath = sourceUri.replace(/^file:\/\/\//, '');
      const sourceFile = projectStore.files.find((f) => f.filePath === filePath);
      if (!sourceFile) {
        showToast('Cannot extract: source file not found');
        return;
      }

      // Compute target path
      const targetPath = name.toLowerCase().replace(/\s+/g, '-') + '.actone';
      if (projectStore.files.some((f) => f.filePath === targetPath)) {
        showToast(`File "${targetPath}" already exists`);
        return;
      }

      // Get source content (prefer in-memory buffer, fallback to DB)
      let content = editorStore.getBuffer(sourceFile.id);
      if (!content) {
        const loaded = await loadFileContent(data.supabase, sourceFile.id);
        content = loaded?.content ?? null;
      }
      if (!content) {
        showToast('Cannot extract: could not load source content');
        return;
      }

      // Find the element's range in source
      const range = findElementRange(content, elType, name);
      if (!range) {
        showToast(`Cannot extract: could not find "${name}" in source`);
        return;
      }

      const lines = content.split('\n');
      const extractedText = lines.slice(range.startLine, range.endLine + 1).join('\n').trim();

      // Remove the element from source (and clean up consecutive blank lines)
      const before = lines.slice(0, range.startLine);
      const after = lines.slice(range.endLine + 1);
      const joined = [...before, ...after].join('\n');
      const newSourceContent = joined.replace(/\n{3,}/g, '\n\n').trim() + '\n';

      try {
        // Create the new file
        const newFile = await createFile(data.supabase, projectId, targetPath, extractedText);
        if (!newFile) {
          showToast('Failed to create extracted file');
          return;
        }

        // Update the source file in DB
        const saved = await saveFileContent(data.supabase, sourceFile.id, newSourceContent);
        if (!saved) {
          showToast('Failed to update source file');
          return;
        }

        // Update stores
        projectStore.addFile({ id: newFile.id, filePath: targetPath, isEntry: false });
        editorStore.setBuffer(sourceFile.id, newSourceContent);

        // Notify Langium workspace about both files so cross-references resolve
        window.dispatchEvent(
          new CustomEvent('actone:update-workspace-file', {
            detail: { filePath: `file:///${sourceFile.filePath}`, content: newSourceContent },
          }),
        );
        window.dispatchEvent(
          new CustomEvent('actone:update-workspace-file', {
            detail: { filePath: `file:///${targetPath}`, content: extractedText },
          }),
        );

        // If source is currently active in editor, update CodeMirror
        if (editorStore.activeFileId === sourceFile.id) {
          window.dispatchEvent(
            new CustomEvent('actone:replace-file-content', {
              detail: { fileId: sourceFile.id, content: newSourceContent },
            }),
          );
        }

        // Open the new file in a new tab
        window.dispatchEvent(
          new CustomEvent('actone:open-file', {
            detail: { id: newFile.id, filePath: targetPath },
          }),
        );

        showToast(`Extracted "${name}" to ${targetPath}`);
      } catch (err) {
        showToast('Extraction failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    }
    window.addEventListener('actone:extract-element', handleExtractElement);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('actone:open-project', handleOpenProject);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('actone:extract-element', handleExtractElement);
    };
  });

  function handleSidebarMouseDown(e: MouseEvent) {
    e.preventDefault();
    resizingSidebar = true;
    const onMouseMove = (ev: MouseEvent) => {
      uiStore.resizeSidebar(ev.clientX);
    };
    const onMouseUp = () => {
      resizingSidebar = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      persistLayout();
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }



</script>

<svelte:window onclick={() => { profileMenuOpen = false; projectSelectorOpen = false; projectContextMenu = null; fileContextMenu = null; }} />

{#if !data.session}
  <!-- Unauthenticated: render page content directly (e.g. /auth) -->
  {@render children()}
{:else}
  <div class="flex h-screen w-screen overflow-hidden bg-surface-900 text-text-primary">
    <!-- Sidebar -->
    {#if uiStore.sidebarVisible}
      <aside
        class="flex flex-col border-r border-border bg-surface-800"
        style="width: {uiStore.sidebarWidth}px;"
      >
        <!-- Sidebar header -->
        <div class="flex h-12 items-center gap-2 px-4">
          <img src="/images/masks.png" alt="ActOne" class="h-7 w-7" />
          <span class="text-[13px] font-semibold text-text-primary" style="font-family: 'Cormorant Garamond', serif; letter-spacing: 4px;">ACTONE</span>
        </div>

        <!-- Navigation items -->
        <nav class="flex flex-col gap-0.5 px-2 py-2">
          {#each navItems as item}
            <button
              class="flex h-8 items-center gap-2.5 rounded px-2.5 text-[13px] transition-colors
                {item.panelId === 'reading-mode' && uiStore.readingModeVisible
                  ? 'text-text-primary bg-surface-raised/40'
                  : 'text-text-muted hover:bg-surface-raised/20 hover:text-text-secondary'}"
              onclick={() => {
                if (item.panelId === 'reading-mode') {
                  uiStore.toggleReadingMode();
                } else {
                  if (uiStore.readingModeVisible) uiStore.readingModeVisible = false;
                  openPanel(item.panelId);
                }
              }}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          {/each}
        </nav>

        <!-- PROJECT files section with project selector -->
        <div class="flex flex-col px-2 pt-4">
          <div class="relative">
            <button
              class="flex items-center gap-1 px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-text-muted hover:text-text-secondary"
              onclick={(e) => { e.stopPropagation(); projectSelectorOpen = !projectSelectorOpen; }}
            >
              <span class="truncate">PROJECTS</span>
              <ChevronDown size={10} class="shrink-0 transition-transform {projectSelectorOpen ? 'rotate-180' : ''}" />
            </button>

            {#if projectSelectorOpen}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <div
                class="absolute left-0 right-0 top-full z-50 mt-0.5 max-h-64 overflow-y-auto rounded-md border border-border bg-surface-800 py-1 shadow-lg"
                role="menu"
                tabindex="-1"
                onclick={(e) => e.stopPropagation()}
              >
              {#each data.projects as p}
                <button
                  class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-text-secondary hover:bg-surface-raised/40"
                  role="menuitem"
                  onclick={() => void handleSwitchProject(p.id)}
                >
                  {#if workspaceStore.isOpen(p.id)}
                    <span class="w-4 text-amber-400">&#10003;</span>
                  {:else}
                    <span class="w-4"></span>
                  {/if}
                  <span class="truncate">{p.title}</span>
                </button>
              {/each}

              {#if data.projects.length > 0}
                <div class="my-1 border-t border-border"></div>
              {/if}

              <button
                class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-amber-400 hover:bg-surface-raised/40"
                role="menuitem"
                onclick={() => { projectSelectorOpen = false; showNewProjectDialog = true; }}
              >
                <span class="w-4">+</span>
                <span>New Project</span>
              </button>
            </div>
          {/if}
          </div>

          {#each workspaceStore.openProjectIds as openProjectId (openProjectId)}
            {@const cached = projectStore.getProject(openProjectId)}
            {#if cached}
              <ProjectSection
                project={cached.meta}
                files={cached.files}
                active={openProjectId === workspaceStore.activeProjectId}
                onopenfile={(file) => {
                  window.dispatchEvent(new CustomEvent('actone:open-file', {
                    detail: {
                      id: file.id,
                      filePath: file.filePath,
                      projectId: cached.meta.id,
                      projectTitle: cached.meta.title,
                    },
                  }));
                }}
                oncontextmenu={handleProjectContextMenu}
                onfilecontextmenu={handleFileContextMenu}
              />
            {/if}
          {/each}
        </div>

        <!-- DOCUMENTATION TOC section -->
        <DocSection />

        <!-- Spacer -->
        <div class="flex-1"></div>

        <!-- T031: User profile footer with popup menu -->
        <div class="relative">
          <button
            class="flex w-full items-center gap-3 border-t border-border px-3 py-3 transition-colors hover:bg-surface-raised/20"
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
              <div class="truncate text-[12px] font-medium text-text-primary">{userName}</div>
              <div class="truncate text-[11px] text-text-muted">{userEmail}</div>
            </div>
            <ChevronUp size={14} class="shrink-0 text-text-muted transition-transform {profileMenuOpen ? '' : 'rotate-180'}" />
          </button>

          {#if profileMenuOpen}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              class="absolute bottom-full left-0 z-50 mb-1 w-full rounded-md border border-border bg-surface-800 py-1 shadow-lg"
              role="menu"
              tabindex="-1"
              onclick={(e) => e.stopPropagation()}
            >
              <button
                class="flex w-full items-center px-3 py-1.5 text-left text-[12px] text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
                role="menuitem"
                onclick={() => { profileMenuOpen = false; void goto('/settings/profile'); }}
              >
                Profile Settings
              </button>
              <button
                class="flex w-full items-center px-3 py-1.5 text-left text-[12px] text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
                role="menuitem"
                onclick={() => { profileMenuOpen = false; void goto('/settings/account'); }}
              >
                Account Settings
              </button>
              <button
                class="flex w-full items-center px-3 py-1.5 text-left text-[12px] text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary"
                role="menuitem"
                onclick={() => { profileMenuOpen = false; void goto('/settings/appearance'); }}
              >
                Appearance
              </button>
              <div class="my-1 border-t border-border"></div>
              <button
                class="flex w-full items-center px-3 py-1.5 text-left text-[12px] text-red-400 hover:bg-surface-raised/40 hover:text-red-300"
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
    <div class="relative flex flex-1 flex-col overflow-hidden">
      <!-- Top toolbar zone -->
      <header class="flex h-10 items-center border-b border-border bg-surface-800 px-2">
        <MenuBar
          oncreateproject={() => { showNewProjectDialog = true; }}
          oncreatefile={() => { showNewFileDialog = true; }}
          onadvancestage={handleAdvanceStage}
          onsnapshot={handleSnapshot}
          ongenerate={handleGenerate}
        />
        <div class="flex-1"></div>
        <button
          class="flex h-7 w-7 items-center justify-center rounded text-text-secondary transition-colors hover:bg-surface-raised/20 hover:text-text-primary"
          onclick={() => uiStore.toggleTheme()}
          title="Toggle theme"
        >
          {#if uiStore.theme === 'dark'}
            <Sun size={16} />
          {:else}
            <Moon size={16} />
          {/if}
        </button>
      </header>

      <!-- Primary content: DocPanel + DockLayout for workspace, or route children for settings -->
      <main class="flex flex-1 overflow-hidden">
        <DocPanel />
        {#if isSettingsRoute}
          <div class="relative flex-1 overflow-y-auto">
            <button
              class="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-800 text-text-secondary transition-colors hover:border-surface-overlay hover:text-text-primary"
              title="Close settings"
              aria-label="Close settings"
              onclick={() => void goto('/')}
            >
              <X size={16} />
            </button>
            {@render children()}
          </div>
        {:else}
          <DockLayout onReady={handleDockReady} class="flex-1" />
        {/if}
      </main>

      {#if !isSettingsRoute && projectStore.isLoaded && uiStore.statusBarVisible}
        <StatusBar onadvancestage={handleAdvanceStage} />
      {/if}

      <!-- Reading Mode overlay: covers menu bar, main content, and status bar -->
      {#if uiStore.readingModeVisible && !isSettingsRoute}
        <div class="absolute inset-0 z-10">
          <ReadingModePanel />
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
        class="w-full max-w-md rounded-lg border border-border bg-surface-800 p-6 shadow-xl"
        role="presentation"
        onclick={(e) => e.stopPropagation()}
      >
        <h2 class="mb-4 text-lg font-semibold text-text-primary">New Project</h2>

        {#if newProjectError}
          <div class="mb-3 rounded bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {newProjectError}
          </div>
        {/if}

        <div class="mb-3">
          <label for="np-title" class="mb-1 block text-xs font-medium text-text-secondary">Project Title *</label>
          <input
            id="np-title"
            type="text"
            bind:value={newProjectTitle}
            class="w-full rounded border border-border bg-surface-900 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-amber-500 focus:outline-none"
            placeholder="My Story"
            disabled={newProjectCreating}
            onkeydown={(e) => { if (e.key === 'Enter') void handleCreateProject(); }}
          />
        </div>

        <div class="mb-3">
          <label for="np-author" class="mb-1 block text-xs font-medium text-text-secondary">Author Name</label>
          <input
            id="np-author"
            type="text"
            bind:value={newProjectAuthor}
            class="w-full rounded border border-border bg-surface-900 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-amber-500 focus:outline-none"
            placeholder="Author name"
            disabled={newProjectCreating}
            onkeydown={(e) => { if (e.key === 'Enter') void handleCreateProject(); }}
          />
        </div>

        <div class="mb-4">
          <label for="np-genre" class="mb-1 block text-xs font-medium text-text-secondary">Genre</label>
          <input
            id="np-genre"
            type="text"
            bind:value={newProjectGenre}
            class="w-full rounded border border-border bg-surface-900 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-amber-500 focus:outline-none"
            placeholder="Fantasy, Sci-Fi, etc."
            disabled={newProjectCreating}
            onkeydown={(e) => { if (e.key === 'Enter') void handleCreateProject(); }}
          />
        </div>

        <div class="flex justify-end gap-2">
          <button
            class="rounded px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
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

  <!-- New File Dialog -->
  {#if showNewFileDialog}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      onclick={() => { if (!newFileCreating) { showNewFileDialog = false; newFileError = ''; newFileName = ''; } }}
    >
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <div
        class="w-full max-w-md rounded-lg border border-border bg-surface-800 p-6 shadow-xl"
        role="presentation"
        onclick={(e) => e.stopPropagation()}
      >
        <h2 class="mb-4 text-lg font-semibold text-text-primary">New File</h2>

        {#if newFileError}
          <div class="mb-3 rounded bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {newFileError}
          </div>
        {/if}

        <div class="mb-4">
          <label for="nf-name" class="mb-1 block text-xs font-medium text-text-secondary">File Name *</label>
          <input
            id="nf-name"
            type="text"
            bind:value={newFileName}
            class="w-full rounded border border-border bg-surface-900 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-amber-500 focus:outline-none"
            placeholder="chapter-2.actone"
            disabled={newFileCreating}
            autofocus
            onkeydown={(e) => { if (e.key === 'Enter') void handleCreateFile(); }}
          />
          <p class="mt-1 text-[11px] text-text-muted">.actone extension will be added automatically if omitted</p>
        </div>

        <div class="flex justify-end gap-2">
          <button
            class="rounded px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
            onclick={() => { showNewFileDialog = false; newFileError = ''; newFileName = ''; }}
            disabled={newFileCreating}
          >
            Cancel
          </button>
          <button
            class="flex items-center gap-2 rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
            onclick={() => void handleCreateFile()}
            disabled={newFileCreating}
          >
            {#if newFileCreating}
              <LoadingSpinner size="sm" />
            {/if}
            Create File
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Open Project Dialog -->
  {#if showOpenProjectDialog}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      onclick={() => { showOpenProjectDialog = false; openProjectSearch = ''; }}
      onkeydown={(e) => { if (e.key === 'Escape') { showOpenProjectDialog = false; openProjectSearch = ''; } }}
    >
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <div
        class="w-full max-w-lg rounded-lg border border-border bg-surface-800 p-6 shadow-xl"
        role="presentation"
        onclick={(e) => e.stopPropagation()}
      >
        <h2 class="mb-4 text-lg font-semibold text-text-primary">Open Project</h2>

        <div class="mb-3">
          <input
            type="text"
            bind:value={openProjectSearch}
            class="w-full rounded border border-border bg-surface-900 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-amber-500 focus:outline-none"
            placeholder="Search projects..."
            autofocus
            onkeydown={handleOpenProjectKeydown}
          />
        </div>

        <div class="max-h-80 overflow-y-auto">
          {#if filteredProjects.length === 0}
            <div class="py-8 text-center text-sm text-text-muted">
              {#if openProjectSearch.trim()}
                No projects match "{openProjectSearch.trim()}"
              {:else}
                No projects found
              {/if}
            </div>
          {:else}
            {#each filteredProjects as p, i}
              {@const isActive = workspaceStore.isOpen(p.id)}
              {@const isHighlighted = i === openProjectHighlight}
              {@const displayStage = isActive
                ? (projectStore.getProject(p.id)?.meta.lifecycleStage ?? (p.lifecycle_stage as import('@actone/shared').LifecycleStage | null))
                : (p.lifecycle_stage as import('@actone/shared').LifecycleStage | null)}
              <button
                class="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left transition-colors
                  {isActive ? 'bg-amber-500/10 text-amber-300' : isHighlighted ? 'bg-surface-raised/40 text-text-primary' : 'text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary'}"
                data-project-highlight={isHighlighted ? 'true' : undefined}
                onclick={() => void handleOpenProjectFromDialog(p.id)}
                onmouseenter={() => { openProjectHighlight = i; }}
              >
                <span class="w-5 shrink-0 text-center text-amber-400">
                  {#if isActive}&#10003;{/if}
                </span>
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-medium">{p.title}</div>
                  <div class="truncate text-[11px] text-text-muted">
                    {[p.author_name, p.genre].filter(Boolean).join(' · ')}
                    {#if p.modified_at}
                      {#if p.author_name || p.genre} · {/if}
                      Modified {new Date(p.modified_at).toLocaleDateString()}
                    {/if}
                  </div>
                </div>
                {#if displayStage}
                  <span class="shrink-0 rounded bg-surface-raised/20 px-2 py-0.5 text-[10px] text-text-secondary">
                    {getStageLabel(displayStage)}
                  </span>
                {/if}
              </button>
            {/each}
          {/if}
        </div>

        <div class="mt-4 flex justify-end">
          <button
            class="rounded px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
            onclick={() => { showOpenProjectDialog = false; openProjectSearch = ''; }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Project context menu -->
  {#if projectContextMenu}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-[100]" role="presentation"
         onclick={closeProjectContextMenu}>
      <div class="fixed z-[101] min-w-[160px] rounded-md border border-border bg-surface-800 py-1 shadow-lg"
           role="menu" style="left: {projectContextMenu.x}px; top: {projectContextMenu.y}px;">
        <button class="flex w-full items-center px-3 py-1.5 text-left text-[13px] text-text-secondary hover:bg-surface-raised/40"
                role="menuitem" onclick={() => { closeProjectContextMenu(); showNewFileDialog = true; }}>
          New File...
        </button>
        <div class="my-1 border-t border-border"></div>
        <button class="flex w-full items-center px-3 py-1.5 text-left text-[13px] text-text-secondary hover:bg-surface-raised/40"
                role="menuitem" onclick={() => void handleCloseProject()}>
          Close Project
        </button>
      </div>
    </div>
  {/if}

  <!-- File context menu -->
  {#if fileContextMenu}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-[100]" role="presentation"
         onclick={closeFileContextMenu}>
      <div class="fixed z-[101] min-w-[160px] rounded-md border border-border bg-surface-800 py-1 shadow-lg"
           role="menu" style="left: {fileContextMenu.x}px; top: {fileContextMenu.y}px;">
        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-[13px]
            {fileContextMenu.file.isEntry ? 'text-text-muted cursor-not-allowed' : 'text-text-secondary hover:bg-surface-raised/40'}"
          role="menuitem"
          disabled={fileContextMenu.file.isEntry}
          onclick={() => {
            const file = fileContextMenu!.file;
            closeFileContextMenu();
            renameTargetFile = file;
            renameNewName = file.filePath.replace(/\.actone$/, '');
            renameError = '';
            showRenameDialog = true;
          }}
        >
          Rename...
        </button>
        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-[13px] text-text-secondary hover:bg-surface-raised/40"
          role="menuitem"
          onclick={() => {
            const file = fileContextMenu!.file;
            closeFileContextMenu();
            duplicateTargetFile = file;
            duplicateNewName = `copy-of-${file.filePath.replace(/\.actone$/, '')}`;
            duplicateError = '';
            showDuplicateDialog = true;
          }}
        >
          Duplicate...
        </button>
        <div class="my-1 border-t border-border"></div>
        <button
          class="flex w-full items-center px-3 py-1.5 text-left text-[13px]
            {fileContextMenu.file.isEntry ? 'text-red-400/30 cursor-not-allowed' : 'text-red-400 hover:bg-surface-raised/40'}"
          role="menuitem"
          disabled={fileContextMenu.file.isEntry}
          onclick={() => { const file = fileContextMenu!.file; closeFileContextMenu(); void handleDeleteFile(file); }}
        >
          Delete
        </button>
      </div>
    </div>
  {/if}

  <!-- Rename File Dialog -->
  {#if showRenameDialog}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      onclick={() => { if (!renameInProgress) { showRenameDialog = false; renameError = ''; } }}
    >
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <div
        class="w-full max-w-md rounded-lg border border-border bg-surface-800 p-6 shadow-xl"
        role="presentation"
        onclick={(e) => e.stopPropagation()}
      >
        <h2 class="mb-4 text-lg font-semibold text-text-primary">Rename File</h2>

        {#if renameError}
          <div class="mb-3 rounded bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {renameError}
          </div>
        {/if}

        <div class="mb-4">
          <label for="rf-name" class="mb-1 block text-xs font-medium text-text-secondary">New File Name *</label>
          <input
            id="rf-name"
            type="text"
            bind:value={renameNewName}
            class="w-full rounded border border-border bg-surface-900 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-amber-500 focus:outline-none"
            placeholder="new-name.actone"
            disabled={renameInProgress}
            autofocus
            onkeydown={(e) => { if (e.key === 'Enter') void handleRenameFile(); }}
          />
          <p class="mt-1 text-[11px] text-text-muted">.actone extension will be added automatically if omitted</p>
        </div>

        <div class="flex justify-end gap-2">
          <button
            class="rounded px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
            onclick={() => { showRenameDialog = false; renameError = ''; }}
            disabled={renameInProgress}
          >
            Cancel
          </button>
          <button
            class="flex items-center gap-2 rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
            onclick={() => void handleRenameFile()}
            disabled={renameInProgress}
          >
            {#if renameInProgress}
              <LoadingSpinner size="sm" />
            {/if}
            Rename
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Duplicate File Dialog -->
  {#if showDuplicateDialog}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      onclick={() => { if (!duplicateInProgress) { showDuplicateDialog = false; duplicateError = ''; } }}
    >
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <div
        class="w-full max-w-md rounded-lg border border-border bg-surface-800 p-6 shadow-xl"
        role="presentation"
        onclick={(e) => e.stopPropagation()}
      >
        <h2 class="mb-4 text-lg font-semibold text-text-primary">Duplicate File</h2>

        {#if duplicateError}
          <div class="mb-3 rounded bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {duplicateError}
          </div>
        {/if}

        <div class="mb-4">
          <label for="df-name" class="mb-1 block text-xs font-medium text-text-secondary">New File Name *</label>
          <input
            id="df-name"
            type="text"
            bind:value={duplicateNewName}
            class="w-full rounded border border-border bg-surface-900 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-amber-500 focus:outline-none"
            placeholder="copy-of-file.actone"
            disabled={duplicateInProgress}
            autofocus
            onkeydown={(e) => { if (e.key === 'Enter') void handleDuplicateFile(); }}
          />
          <p class="mt-1 text-[11px] text-text-muted">.actone extension will be added automatically if omitted</p>
        </div>

        <div class="flex justify-end gap-2">
          <button
            class="rounded px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
            onclick={() => { showDuplicateDialog = false; duplicateError = ''; }}
            disabled={duplicateInProgress}
          >
            Cancel
          </button>
          <button
            class="flex items-center gap-2 rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
            onclick={() => void handleDuplicateFile()}
            disabled={duplicateInProgress}
          >
            {#if duplicateInProgress}
              <LoadingSpinner size="sm" />
            {/if}
            Duplicate
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Toast notification -->
  {#if toastVisible}
    <div class="fixed bottom-4 right-4 z-50 rounded-lg border border-border bg-surface-800 px-4 py-2 text-xs text-text-secondary shadow-lg">
      {toastMessage}
    </div>
  {/if}
{/if}
