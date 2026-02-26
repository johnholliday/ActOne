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

  /** All story elements from the active AST */
  activeElements = $derived<SerializedStoryElement[]>(
    this.activeAst?.ast?.elements ?? [],
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

  /** Remove a file's AST data (on close) */
  removeFile(uri: string): void {
    const next = new Map(this.fileAsts);
    next.delete(uri);
    this.fileAsts = next;
  }

  /** Clear all AST state */
  clear(): void {
    this.fileAsts = new Map();
    this.activeUri = null;
  }
}

export const astStore = new AstStore();
