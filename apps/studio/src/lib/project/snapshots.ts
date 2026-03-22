/**
 * T051: Snapshot capture and restore logic.
 *
 * Core snapshot utilities (generateSnapshotTag, countWords) are now
 * provided by @docugenix/sanyam-projects. This module retains the
 * ActOne-specific grammar element counting and aggregation, which is
 * injected into sanyam-projects via the `aggregateStats` config hook.
 */

// Re-export sanyam-projects utilities for backward compatibility
export { generateSnapshotTag, countWords } from '@docugenix/sanyam-projects/services';

export interface SnapshotEntry {
  id: string;
  tag: string;
  stage: string;
  wordCount: number;
  sceneCount: number;
  characterCount: number;
  notes: string | null;
  createdAt: string;
}

export interface SnapshotFile {
  filePath: string;
  content: string;
}

/**
 * Count story elements by type in raw content.
 * ActOne-specific: counts scene and character definitions by grammar pattern.
 */
export function countElements(content: string): {
  scenes: number;
  characters: number;
} {
  const sceneMatches = content.match(/\bscene\s+"[^"]*"\s*\{/g);
  const characterMatches = content.match(/\bcharacter\s+"[^"]*"\s*\{/g);
  return {
    scenes: sceneMatches?.length ?? 0,
    characters: characterMatches?.length ?? 0,
  };
}

/**
 * Aggregate statistics across multiple source files.
 * ActOne-specific: counts words, scenes, and characters.
 * Used as the `aggregateStats` hook for sanyam-projects's createProjectRoutes.
 */
export function aggregateStats(
  files: Array<{ content: string }>,
): { wordCount: number; sceneCount: number; characterCount: number } {
  // Import countWords dynamically to avoid circular dependency at module level
  let wordCount = 0;
  let sceneCount = 0;
  let characterCount = 0;

  for (const file of files) {
    // Count words using the same logic as sanyam-projects
    wordCount += file.content
      .replace(/\/\/.*/g, '') // strip single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // strip multi-line comments
      .split(/\s+/)
      .filter((w) => w.length > 0)
      .length;
    const counts = countElements(file.content);
    sceneCount += counts.scenes;
    characterCount += counts.characters;
  }

  return { wordCount, sceneCount, characterCount };
}
