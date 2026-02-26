import type {
  LifecycleStage,
  CompositionMode,
} from '@repo/shared';

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

  load(project: ProjectMeta, files: SourceFileEntry[]) {
    this.project = project;
    this.files = files;
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
