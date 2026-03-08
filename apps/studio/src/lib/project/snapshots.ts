/**
 * T051: Snapshot capture and restore logic.
 *
 * Snapshots freeze all file contents and statistics at a point in time,
 * allowing authors to restore previous versions.
 */

import type { LifecycleStage } from '@actone/shared';

export interface SnapshotInput {
  projectId: string;
  tag: string;
  stage: LifecycleStage;
  notes?: string;
  wordCount?: number;
  sceneCount?: number;
  characterCount?: number;
}

export interface SnapshotEntry {
  id: string;
  tag: string;
  stage: LifecycleStage;
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
 * Generate a snapshot tag from stage and timestamp.
 */
export function generateSnapshotTag(stage: LifecycleStage): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0]?.replace(/:/g, '');
  return `${stage}-${date}-${time}`;
}

/**
 * Count words in content (for snapshot statistics).
 */
export function countWords(content: string): number {
  return content
    .replace(/\/\/.*/g, '') // strip single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // strip multi-line comments
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .length;
}

/**
 * Count story elements by type in raw content.
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
 */
export function aggregateStats(
  files: Array<{ content: string }>,
): { wordCount: number; sceneCount: number; characterCount: number } {
  let wordCount = 0;
  let sceneCount = 0;
  let characterCount = 0;

  for (const file of files) {
    wordCount += countWords(file.content);
    const counts = countElements(file.content);
    sceneCount += counts.scenes;
    characterCount += counts.characters;
  }

  return { wordCount, sceneCount, characterCount };
}
