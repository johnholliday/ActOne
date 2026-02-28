import type { LifecycleStage, CompositionMode } from '@repo/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { loadProjectFromSupabase, loadProjectByIdFromSupabase } from './project-loader.js';

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

/** Global project state using Svelte 5 runes */
class ProjectStore {
  /** Currently loaded project (null if none) */
  project = $state<ProjectMeta | null>(null);

  /** All source files for the active project */
  files = $state<SourceFileEntry[]>([]);

  /** Whether a project is currently loaded */
  isLoaded = $derived(this.project !== null);

  /** The entry (main) file of the project */
  entryFile = $derived(this.files.find((f) => f.isEntry) ?? null);

  /** Whether the store is currently loading data (starts true to prevent premature UI mount) */
  loading = $state(true);

  load(project: ProjectMeta, files: SourceFileEntry[]) {
    this.project = project;
    this.files = files;
  }

  /**
   * T003: Load the user's most recent project from the database via Supabase client.
   * Fetches project metadata and source files, populates project and files state.
   */
  async loadFromServer(supabase: SupabaseClient): Promise<void> {
    this.loading = true;
    try {
      const result = await loadProjectFromSupabase(supabase);
      if (!result.success) {
        this.clear();
        return;
      }
      this.project = result.project;
      this.files = result.files;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Load a specific project by ID from the database via Supabase client.
   * Used by the project selector to switch between projects.
   */
  async loadById(supabase: SupabaseClient, projectId: string): Promise<void> {
    this.loading = true;
    try {
      const result = await loadProjectByIdFromSupabase(supabase, projectId);
      if (!result.success) {
        this.clear();
        return;
      }
      this.project = result.project;
      this.files = result.files;
    } finally {
      this.loading = false;
    }
  }

  clear() {
    this.project = null;
    this.files = [];
  }

  updateStage(stage: LifecycleStage) {
    if (this.project) {
      this.project = { ...this.project, lifecycleStage: stage };
    }
  }

  updateCompositionMode(mode: CompositionMode) {
    if (this.project) {
      this.project = { ...this.project, compositionMode: mode };
    }
  }

  addFile(file: SourceFileEntry) {
    this.files = [...this.files, file];
  }

  removeFile(fileId: string) {
    this.files = this.files.filter((f) => f.id !== fileId);
  }
}

export const projectStore = new ProjectStore();
