/** Editor state using Svelte 5 runes */

import { workspaceStore } from './workspace.svelte.js';

/** Information about a currently open file tab */
export interface OpenFile {
  id: string;
  filePath: string;
  isDirty: boolean;
  /** Project this file belongs to */
  projectId: string;
  /** Project title for tab disambiguation */
  projectTitle: string;
}

/** Cursor/selection position in the editor */
export interface CursorPosition {
  line: number;
  column: number;
}

class EditorStore {
  /** Currently open file tabs */
  openFiles = $state<OpenFile[]>([]);

  /** ID of the active (focused) file */
  activeFileId = $state<string | null>(null);

  /** In-memory content cache for unsaved edits across tab switches */
  private contentBuffers = new Map<string, string>();

  /** Current cursor position */
  cursor = $state<CursorPosition>({ line: 1, column: 1 });

  /** Number of diagnostics (errors + warnings) */
  diagnosticCount = $state(0);

  /** Current save status */
  saveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');

  /** Timestamp of last successful save */
  lastSavedAt = $state<Date | null>(null);

  /** The active open file entry */
  activeFile = $derived(
    this.openFiles.find((f) => f.id === this.activeFileId) ?? null,
  );

  /** Whether any open file has unsaved changes */
  hasUnsavedChanges = $derived(this.openFiles.some((f) => f.isDirty));

  /**
   * When the active file changes and belongs to a different project,
   * update the workspace active project. This is called externally
   * by the layout to drive context switching.
   */
  syncActiveProject(): void {
    const activeFile = this.openFiles.find((f) => f.id === this.activeFileId);
    if (activeFile && activeFile.projectId !== workspaceStore.activeProjectId) {
      workspaceStore.setActiveProject(activeFile.projectId);
    }
  }

  open(file: { id: string; filePath: string; projectId: string; projectTitle: string }) {
    this.ensure(file);
    this.activeFileId = file.id;
    this.syncActiveProject();
  }

  /** Add file to open tabs without changing the active file */
  ensure(file: { id: string; filePath: string; projectId: string; projectTitle: string }) {
    if (!this.openFiles.some((f) => f.id === file.id)) {
      this.openFiles = [
        ...this.openFiles,
        {
          id: file.id,
          filePath: file.filePath,
          isDirty: false,
          projectId: file.projectId,
          projectTitle: file.projectTitle,
        },
      ];
    }
  }

  close(fileId: string) {
    if (this.openFiles.length <= 1) return;
    this.removeBuffer(fileId);
    this.openFiles = this.openFiles.filter((f) => f.id !== fileId);
    if (this.activeFileId === fileId) {
      this.activeFileId = this.openFiles[0]?.id ?? null;
      this.syncActiveProject();
    }
  }

  /** Close a tab without the "last tab" guard (used for delete) */
  forceClose(fileId: string) {
    this.removeBuffer(fileId);
    this.openFiles = this.openFiles.filter((f) => f.id !== fileId);
    if (this.activeFileId === fileId) {
      this.activeFileId = this.openFiles[0]?.id ?? null;
      this.syncActiveProject();
    }
  }

  /** Close all tabs for a specific project */
  closeAllForProject(projectId: string): void {
    const wasActive = this.openFiles.find(
      (f) => f.id === this.activeFileId,
    )?.projectId === projectId;

    // Remove buffers for all project files
    for (const f of this.openFiles) {
      if (f.projectId === projectId) {
        this.contentBuffers.delete(f.id);
      }
    }

    this.openFiles = this.openFiles.filter((f) => f.projectId !== projectId);

    if (wasActive) {
      this.activeFileId = this.openFiles[this.openFiles.length - 1]?.id ?? null;
      this.syncActiveProject();
    }
  }

  /** Get all open files for a specific project */
  getFilesForProject(projectId: string): OpenFile[] {
    return this.openFiles.filter((f) => f.projectId === projectId);
  }

  /** Update filePath for an open file tab (used for rename) */
  renameFile(fileId: string, newFilePath: string) {
    this.openFiles = this.openFiles.map((f) =>
      f.id === fileId ? { ...f, filePath: newFilePath } : f,
    );
  }

  markDirty(fileId: string) {
    this.openFiles = this.openFiles.map((f) =>
      f.id === fileId ? { ...f, isDirty: true } : f,
    );
  }

  markClean(fileId: string) {
    this.openFiles = this.openFiles.map((f) =>
      f.id === fileId ? { ...f, isDirty: false } : f,
    );
  }

  updateCursor(position: CursorPosition) {
    this.cursor = position;
  }

  updateDiagnosticCount(count: number) {
    this.diagnosticCount = count;
  }

  setSaveStatus(status: 'idle' | 'saving' | 'saved' | 'error') {
    this.saveStatus = status;
    if (status === 'saved') {
      this.lastSavedAt = new Date();
    }
  }

  /** Store content in the buffer for a file */
  setBuffer(fileId: string, content: string) {
    this.contentBuffers.set(fileId, content);
  }

  /** Retrieve buffered content for a file */
  getBuffer(fileId: string): string | undefined {
    return this.contentBuffers.get(fileId);
  }

  /** Remove buffered content for a file */
  removeBuffer(fileId: string) {
    this.contentBuffers.delete(fileId);
  }

  /** Switch active tab without re-opening */
  setActiveFile(fileId: string) {
    this.activeFileId = fileId;
    this.syncActiveProject();
  }

  closeAll() {
    this.contentBuffers.clear();
    this.openFiles = [];
    this.activeFileId = null;
  }
}

export const editorStore = new EditorStore();
