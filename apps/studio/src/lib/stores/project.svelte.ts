import type { LifecycleStage, CompositionMode } from '@repo/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { loadProjectByIdFromSupabase } from './project-loader.js';
import { workspaceStore } from './workspace.svelte.js';

/** Minimal project metadata for the active project */
export interface ProjectMeta {
  id: string;
  title: string;
  authorName: string | null;
  genre: string | null;
  compositionMode: CompositionMode;
  lifecycleStage: LifecycleStage;
  publishingMode: 'text' | 'graphic-novel';
  grammarVersion: string | null;
  grammarFingerprint: string | null;
}

/** Source file entry for the project navigator */
export interface SourceFileEntry {
  id: string;
  filePath: string;
  isEntry: boolean;
  content?: string;
}

/** Server-loaded project data from the layout load function */
export interface ServerProject {
  id: string;
  title: string;
  authorName: string | null;
  genre: string | null;
  compositionMode: CompositionMode;
  lifecycleStage: LifecycleStage;
  publishingMode: 'text' | 'graphic-novel';
  grammarVersion: string | null;
  grammarFingerprint: string | null;
}

/** Cached project data for multi-project support */
export interface ProjectCache {
  meta: ProjectMeta;
  files: SourceFileEntry[];
}

/** Global project state using Svelte 5 runes — supports multiple loaded projects */
class ProjectStore {
  /** Cache of all loaded projects keyed by project ID */
  loadedProjects = $state<Map<string, ProjectCache>>(new Map());

  /** Whether the store is currently loading data (starts true to prevent premature UI mount) */
  loading = $state(true);

  /** Active project metadata (derived from workspace active project) */
  project = $derived<ProjectMeta | null>(
    workspaceStore.activeProjectId
      ? this.loadedProjects.get(workspaceStore.activeProjectId)?.meta ?? null
      : null,
  );

  /** All source files for the active project */
  files = $derived<SourceFileEntry[]>(
    workspaceStore.activeProjectId
      ? this.loadedProjects.get(workspaceStore.activeProjectId)?.files ?? []
      : [],
  );

  /** Whether a project is currently loaded */
  isLoaded = $derived(this.project !== null);

  /** The entry (main) file of the active project */
  entryFile = $derived(this.files.find((f) => f.isEntry) ?? null);

  /** Get cached data for a specific project */
  getProject(projectId: string): ProjectCache | undefined {
    return this.loadedProjects.get(projectId);
  }

  /** Get files for a specific project (not just the active one) */
  getFilesForProject(projectId: string): SourceFileEntry[] {
    return this.loadedProjects.get(projectId)?.files ?? [];
  }

  /** Load a project by its metadata and files directly (e.g. from server data) */
  load(project: ProjectMeta, files: SourceFileEntry[]) {
    const next = new Map(this.loadedProjects);
    next.set(project.id, { meta: project, files });
    this.loadedProjects = next;
  }

  /**
   * Load a specific project by ID from the database and cache it.
   * Returns true if loaded successfully, false otherwise.
   */
  async loadById(supabase: SupabaseClient, projectId: string): Promise<boolean> {
    this.loading = true;
    try {
      // If already cached, no need to reload
      if (this.loadedProjects.has(projectId)) {
        return true;
      }
      const result = await loadProjectByIdFromSupabase(supabase, projectId);
      if (!result.success) {
        return false;
      }
      const next = new Map(this.loadedProjects);
      next.set(projectId, { meta: result.project, files: result.files });
      this.loadedProjects = next;
      return true;
    } finally {
      this.loading = false;
    }
  }

  /** Remove a project from the cache */
  unloadProject(projectId: string): void {
    const next = new Map(this.loadedProjects);
    next.delete(projectId);
    this.loadedProjects = next;
  }

  /** Clear all cached projects */
  clear() {
    this.loadedProjects = new Map();
  }

  updateStage(stage: LifecycleStage) {
    const activeId = workspaceStore.activeProjectId;
    if (!activeId) return;
    const cached = this.loadedProjects.get(activeId);
    if (!cached) return;
    const next = new Map(this.loadedProjects);
    next.set(activeId, {
      ...cached,
      meta: { ...cached.meta, lifecycleStage: stage },
    });
    this.loadedProjects = next;
  }

  updateCompositionMode(mode: CompositionMode) {
    const activeId = workspaceStore.activeProjectId;
    if (!activeId) return;
    const cached = this.loadedProjects.get(activeId);
    if (!cached) return;
    const next = new Map(this.loadedProjects);
    next.set(activeId, {
      ...cached,
      meta: { ...cached.meta, compositionMode: mode },
    });
    this.loadedProjects = next;
  }

  addFile(file: SourceFileEntry) {
    const activeId = workspaceStore.activeProjectId;
    if (!activeId) return;
    const cached = this.loadedProjects.get(activeId);
    if (!cached) return;
    const next = new Map(this.loadedProjects);
    next.set(activeId, {
      ...cached,
      files: [...cached.files, file],
    });
    this.loadedProjects = next;
  }

  renameFile(fileId: string, newFilePath: string) {
    const activeId = workspaceStore.activeProjectId;
    if (!activeId) return;
    const cached = this.loadedProjects.get(activeId);
    if (!cached) return;
    const next = new Map(this.loadedProjects);
    next.set(activeId, {
      ...cached,
      files: cached.files.map((f) =>
        f.id === fileId ? { ...f, filePath: newFilePath } : f,
      ),
    });
    this.loadedProjects = next;
  }

  removeFile(fileId: string) {
    const activeId = workspaceStore.activeProjectId;
    if (!activeId) return;
    const cached = this.loadedProjects.get(activeId);
    if (!cached) return;
    const next = new Map(this.loadedProjects);
    next.set(activeId, {
      ...cached,
      files: cached.files.filter((f) => f.id !== fileId),
    });
    this.loadedProjects = next;
  }
}

export const projectStore = new ProjectStore();
