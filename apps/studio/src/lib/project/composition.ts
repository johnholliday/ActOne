/**
 * T054: Composition mode logic.
 *
 * Defines how multi-file projects resolve names across files:
 * - merge: unified namespace, duplicate names are errors
 * - overlay: last-defined wins (by file priority)
 * - sequential: per-file namespaces, cross-file refs require qualified names
 */

import type { CompositionMode } from '@actone/shared';

export interface FileEntry {
  uri: string;
  priority: number;
}

export interface NameConflict {
  name: string;
  type: string;
  files: string[];
}

/**
 * Get a human-readable description of a composition mode.
 */
export function getModeDescription(mode: CompositionMode): string {
  switch (mode) {
    case 'merge':
      return 'Unified namespace across all files. Duplicate names are errors.';
    case 'overlay':
      return 'Last-defined wins by file priority. Lower priority files can override.';
    case 'sequential':
      return 'Each file has its own namespace. Cross-file references use qualified names.';
  }
}

/**
 * Sort files by priority for overlay resolution.
 * Higher priority = later in the list (wins on conflict).
 */
export function sortByPriority(files: FileEntry[]): FileEntry[] {
  return [...files].sort((a, b) => a.priority - b.priority);
}

/**
 * Detect naming conflicts in merge mode.
 * Returns a list of names that appear in multiple files.
 */
export function detectMergeConflicts(
  fileNames: Map<string, Array<{ name: string; type: string }>>,
): NameConflict[] {
  const nameIndex = new Map<string, { type: string; files: string[] }>();

  for (const [uri, names] of fileNames) {
    for (const { name, type } of names) {
      const key = `${type}:${name}`;
      const existing = nameIndex.get(key);
      if (existing) {
        existing.files.push(uri);
      } else {
        nameIndex.set(key, { type, files: [uri] });
      }
    }
  }

  const conflicts: NameConflict[] = [];
  for (const [key, { type, files }] of nameIndex) {
    if (files.length > 1) {
      const name = key.substring(type.length + 1);
      conflicts.push({ name, type, files });
    }
  }

  return conflicts;
}

/**
 * Resolve a name in overlay mode.
 * Returns the URI of the file whose definition should be used.
 */
export function resolveOverlayName(
  name: string,
  type: string,
  fileNames: Map<string, Array<{ name: string; type: string }>>,
  filePriorities: Map<string, number>,
): string | null {
  let bestUri: string | null = null;
  let bestPriority = -Infinity;

  for (const [uri, names] of fileNames) {
    const hasName = names.some((n) => n.name === name && n.type === type);
    if (hasName) {
      const priority = filePriorities.get(uri) ?? 0;
      if (priority > bestPriority) {
        bestPriority = priority;
        bestUri = uri;
      }
    }
  }

  return bestUri;
}

/**
 * Build a qualified name for sequential mode.
 * Format: "file:name" where file is the base filename without extension.
 */
export function qualifyName(uri: string, name: string): string {
  const fileName = uri.split('/').pop()?.replace(/\.actone$/, '') ?? 'unknown';
  return `${fileName}:${name}`;
}
