/** AST store using Svelte 5 runes — holds the parsed serialized AST from the Langium worker */

import type { SerializedStory, SerializedStoryElement } from '@repo/shared';
import type { Diagnostic } from '$lib/editor/langium-client.js';

/** Per-file AST state */
export interface FileAst {
  uri: string;
  ast: SerializedStory | null;
  valid: boolean;
  errors: number;
  diagnostics: Diagnostic[];
}

class AstStore {
  /** Map of URI → parsed AST state */
  private fileAsts = $state<Map<string, FileAst>>(new Map());

  /** The URI of the file currently being viewed */
  activeUri = $state<string | null>(null);

  /** Merged AST across all project files (from actone/getMergedAst) */
  mergedAst = $state<SerializedStory | null>(null);

  /** Whether the merged AST is valid (no errors across all files) */
  mergedValid = $state(true);

  /** AST for the active file */
  activeAst = $derived(
    this.activeUri ? this.fileAsts.get(this.activeUri) ?? null : null,
  );

  /** Whether the active file's AST is valid (no errors) */
  isValid = $derived(this.activeAst?.valid ?? false);

  /** Total error count across all open files */
  totalErrors = $derived(
    Array.from(this.fileAsts.values()).reduce((sum, f) => sum + f.errors, 0),
  );

  /** Total diagnostic count across all open files */
  totalDiagnostics = $derived(
    Array.from(this.fileAsts.values()).reduce(
      (sum, f) => sum + f.diagnostics.length,
      0,
    ),
  );

  /** All diagnostics grouped by URI (only files with diagnostics) */
  allFileDiagnostics = $derived(
    Array.from(this.fileAsts.values())
      .filter((f) => f.diagnostics.length > 0)
      .map((f) => ({ uri: f.uri, diagnostics: f.diagnostics })),
  );

  /**
   * All story elements from the merged AST (cross-file consolidated).
   * Falls back to the active file's elements if no merged AST is available.
   */
  activeElements = $derived<SerializedStoryElement[]>(
    this.mergedAst?.elements ?? this.activeAst?.ast?.elements ?? [],
  );

  /** Update the AST for a specific file (called after actone/getSerializedAst response) */
  updateAst(uri: string, ast: SerializedStory | null, valid: boolean, errors: number): void {
    const existing = this.fileAsts.get(uri);
    const updated: FileAst = {
      uri,
      ast,
      valid,
      errors,
      diagnostics: existing?.diagnostics ?? [],
    };
    const next = new Map(this.fileAsts);
    next.set(uri, updated);
    this.fileAsts = next;
  }

  /** Update diagnostics for a specific file (called from publishDiagnostics) */
  updateDiagnostics(uri: string, diagnostics: Diagnostic[]): void {
    const existing = this.fileAsts.get(uri);
    const errors = diagnostics.filter((d) => d.severity === 1).length;
    const updated: FileAst = {
      uri,
      ast: existing?.ast ?? null,
      valid: errors === 0,
      errors,
      diagnostics,
    };
    const next = new Map(this.fileAsts);
    next.set(uri, updated);
    this.fileAsts = next;
  }

  /** Get diagnostics for a specific file */
  getDiagnostics(uri: string): Diagnostic[] {
    return this.fileAsts.get(uri)?.diagnostics ?? [];
  }

  /** Get AST for a specific file */
  getFileAst(uri: string): FileAst | null {
    return this.fileAsts.get(uri) ?? null;
  }

  /** Find which file URI contains an element by name and type */
  findElementSource(name: string, $type: string): string | null {
    for (const [uri, fileAst] of this.fileAsts) {
      if (!fileAst.ast) continue;
      for (const el of fileAst.ast.elements) {
        if (el.$type === $type && 'name' in el && el.name === name) {
          return uri;
        }
      }
    }
    return null;
  }

  /** Remove a file's AST data (on close) */
  removeFile(uri: string): void {
    const next = new Map(this.fileAsts);
    next.delete(uri);
    this.fileAsts = next;
  }

  /** Update the merged AST (called after actone/getMergedAst response) */
  updateMergedAst(ast: SerializedStory | null, valid: boolean): void {
    this.mergedAst = ast;
    this.mergedValid = valid;
  }

  /** Clear all AST state */
  clear(): void {
    this.fileAsts = new Map();
    this.activeUri = null;
    this.mergedAst = null;
    this.mergedValid = true;
  }
}

export const astStore = new AstStore();
