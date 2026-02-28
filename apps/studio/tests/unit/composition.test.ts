/**
 * T033: Composition mode logic tests.
 *
 * Tests all three composition modes: merge, overlay, sequential.
 */

import { describe, it, expect } from 'vitest';
import {
  getModeDescription,
  sortByPriority,
  detectMergeConflicts,
  resolveOverlayName,
  qualifyName,
} from '$lib/project/composition.js';
import type { FileEntry } from '$lib/project/composition.js';

describe('getModeDescription', () => {
  it('returns description for merge mode', () => {
    const desc = getModeDescription('merge');
    expect(desc).toContain('Unified namespace');
    expect(desc).toContain('Duplicate');
  });

  it('returns description for overlay mode', () => {
    const desc = getModeDescription('overlay');
    expect(desc).toContain('Last-defined wins');
  });

  it('returns description for sequential mode', () => {
    const desc = getModeDescription('sequential');
    expect(desc).toContain('own namespace');
    expect(desc).toContain('qualified');
  });
});

describe('sortByPriority', () => {
  it('sorts files by ascending priority', () => {
    const files: FileEntry[] = [
      { uri: 'c.actone', priority: 3 },
      { uri: 'a.actone', priority: 1 },
      { uri: 'b.actone', priority: 2 },
    ];
    const sorted = sortByPriority(files);
    expect(sorted.map((f) => f.uri)).toEqual([
      'a.actone',
      'b.actone',
      'c.actone',
    ]);
  });

  it('does not mutate the original array', () => {
    const files: FileEntry[] = [
      { uri: 'b.actone', priority: 2 },
      { uri: 'a.actone', priority: 1 },
    ];
    const original = [...files];
    sortByPriority(files);
    expect(files).toEqual(original);
  });

  it('handles empty array', () => {
    expect(sortByPriority([])).toEqual([]);
  });
});

describe('detectMergeConflicts', () => {
  it('detects duplicate names across files', () => {
    const fileNames = new Map([
      ['file1.actone', [{ name: 'Elena', type: 'character' }]],
      ['file2.actone', [{ name: 'Elena', type: 'character' }]],
    ]);
    const conflicts = detectMergeConflicts(fileNames);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]!.name).toBe('Elena');
    expect(conflicts[0]!.type).toBe('character');
    expect(conflicts[0]!.files).toContain('file1.actone');
    expect(conflicts[0]!.files).toContain('file2.actone');
  });

  it('allows same name with different types', () => {
    const fileNames = new Map([
      ['file1.actone', [{ name: 'Opening', type: 'scene' }]],
      ['file2.actone', [{ name: 'Opening', type: 'theme' }]],
    ]);
    const conflicts = detectMergeConflicts(fileNames);
    expect(conflicts).toHaveLength(0);
  });

  it('detects multiple conflicts', () => {
    const fileNames = new Map([
      [
        'file1.actone',
        [
          { name: 'Elena', type: 'character' },
          { name: 'Studio', type: 'location' },
        ],
      ],
      [
        'file2.actone',
        [
          { name: 'Elena', type: 'character' },
          { name: 'Studio', type: 'location' },
        ],
      ],
    ]);
    const conflicts = detectMergeConflicts(fileNames);
    expect(conflicts).toHaveLength(2);
  });

  it('returns empty array when no conflicts', () => {
    const fileNames = new Map([
      ['file1.actone', [{ name: 'Elena', type: 'character' }]],
      ['file2.actone', [{ name: 'Marco', type: 'character' }]],
    ]);
    expect(detectMergeConflicts(fileNames)).toHaveLength(0);
  });
});

describe('resolveOverlayName', () => {
  it('returns URI of highest-priority file', () => {
    const fileNames = new Map([
      ['low.actone', [{ name: 'Elena', type: 'character' }]],
      ['high.actone', [{ name: 'Elena', type: 'character' }]],
    ]);
    const filePriorities = new Map([
      ['low.actone', 1],
      ['high.actone', 10],
    ]);
    const result = resolveOverlayName('Elena', 'character', fileNames, filePriorities);
    expect(result).toBe('high.actone');
  });

  it('returns null when name not found', () => {
    const fileNames = new Map([
      ['file.actone', [{ name: 'Elena', type: 'character' }]],
    ]);
    const filePriorities = new Map([['file.actone', 1]]);
    const result = resolveOverlayName('Marco', 'character', fileNames, filePriorities);
    expect(result).toBeNull();
  });

  it('uses default priority 0 for unset files', () => {
    const fileNames = new Map([
      ['a.actone', [{ name: 'Elena', type: 'character' }]],
      ['b.actone', [{ name: 'Elena', type: 'character' }]],
    ]);
    const filePriorities = new Map([['a.actone', 5]]);
    const result = resolveOverlayName('Elena', 'character', fileNames, filePriorities);
    expect(result).toBe('a.actone');
  });
});

describe('qualifyName', () => {
  it('builds qualified name from URI and name', () => {
    expect(qualifyName('/path/to/characters.actone', 'Elena')).toBe(
      'characters:Elena',
    );
  });

  it('strips .actone extension', () => {
    expect(qualifyName('worlds.actone', 'QuantumLab')).toBe(
      'worlds:QuantumLab',
    );
  });

  it('uses last path segment', () => {
    expect(qualifyName('a/b/c/file.actone', 'Name')).toBe('file:Name');
  });

  it('handles URI without extension', () => {
    expect(qualifyName('file', 'Name')).toBe('file:Name');
  });
});
