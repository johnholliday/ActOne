/** Editor state using Svelte 5 runes */

/** Information about a currently open file tab */
export interface OpenFile {
  id: string;
  filePath: string;
  isDirty: boolean;
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

  /** Current cursor position */
  cursor = $state<CursorPosition>({ line: 1, column: 1 });

  /** Number of diagnostics (errors + warnings) */
  diagnosticCount = $state(0);

  /** The active open file entry */
  activeFile = $derived(
    this.openFiles.find((f) => f.id === this.activeFileId) ?? null,
  );

  /** Whether any open file has unsaved changes */
  hasUnsavedChanges = $derived(this.openFiles.some((f) => f.isDirty));

  open(file: { id: string; filePath: string }) {
    if (!this.openFiles.some((f) => f.id === file.id)) {
      this.openFiles = [
        ...this.openFiles,
        { id: file.id, filePath: file.filePath, isDirty: false },
      ];
    }
    this.activeFileId = file.id;
  }

  close(fileId: string) {
    this.openFiles = this.openFiles.filter((f) => f.id !== fileId);
    if (this.activeFileId === fileId) {
      this.activeFileId = this.openFiles[0]?.id ?? null;
    }
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

  closeAll() {
    this.openFiles = [];
    this.activeFileId = null;
  }
}

export const editorStore = new EditorStore();
