import type { LifecycleStage, CompositionMode } from '@repo/shared';
import type { SupabaseClient } from '@supabase/supabase-js';

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

  /** Whether the store is currently loading data */
  loading = $state(false);

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
      // Fetch the most recently modified project for the current user
      const { data: projectRow, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .order('modified_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (projectError || !projectRow) {
        this.clear();
        return;
      }

      // Fetch source files for this project
      const { data: fileRows, error: filesError } = await supabase
        .from('source_files')
        .select('id, file_path, is_entry, content')
        .eq('project_id', projectRow.id)
        .order('file_path', { ascending: true });

      if (filesError) {
        this.clear();
        return;
      }

      const meta: ProjectMeta = {
        id: projectRow.id,
        title: projectRow.title,
        authorName: projectRow.author_name,
        genre: projectRow.genre,
        compositionMode: projectRow.composition_mode,
        lifecycleStage: projectRow.lifecycle_stage,
        publishingMode: projectRow.publishing_mode,
        grammarVersion: projectRow.grammar_version,
        grammarFingerprint: projectRow.grammar_fingerprint,
      };

      const files: SourceFileEntry[] = (fileRows ?? []).map((f: Record<string, unknown>) => ({
        id: f.id as string,
        filePath: f.file_path as string,
        isEntry: f.is_entry as boolean,
        content: f.content as string | undefined,
      }));

      this.project = meta;
      this.files = files;
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
