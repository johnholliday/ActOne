/**
 * T036: Conflict detection and resolution tests.
 *
 * Tests detectConflicts(), resolveConflicts(), hasConflicts()
 * for concurrent diagram and source edits.
 */

import { describe, it, expect } from 'vitest';
import {
  detectConflicts,
  resolveConflicts,
  hasConflicts,
} from '$lib/diagrams/operations/conflict-resolver.js';
import type { ConflictInfo, ResolutionStrategy } from '$lib/diagrams/operations/conflict-resolver.js';
import type { TextEdit } from '$lib/ast/text-edit.js';

// The conflict resolver uses offset-based overlap detection.
// TextEdit has { range: Range, newText: string } but the resolver accesses
// .offset and .length directly. We create edit objects matching what the code expects.
function makeEdit(offset: number, length: number, newText: string): TextEdit {
  return { offset, length, newText } as unknown as TextEdit;
}

describe('detectConflicts', () => {
  it('detects overlapping edits', () => {
    const diagramEdits = [makeEdit(10, 5, 'diagram')]; // [10..15]
    const sourceEdits = [makeEdit(12, 3, 'source')]; // [12..15]

    const conflicts = detectConflicts(diagramEdits, sourceEdits);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]!.diagramEdit).toBe(diagramEdits[0]);
    expect(conflicts[0]!.sourceEdit).toBe(sourceEdits[0]);
  });

  it('returns empty for non-overlapping edits', () => {
    const diagramEdits = [makeEdit(0, 5, 'diagram')]; // [0..5]
    const sourceEdits = [makeEdit(10, 5, 'source')]; // [10..15]

    expect(detectConflicts(diagramEdits, sourceEdits)).toHaveLength(0);
  });

  it('detects adjacent-boundary non-overlap correctly', () => {
    const diagramEdits = [makeEdit(0, 5, 'diagram')]; // [0..5]
    const sourceEdits = [makeEdit(5, 5, 'source')]; // [5..10]

    // [0..5) and [5..10) don't overlap: 5 < 5 is false
    expect(detectConflicts(diagramEdits, sourceEdits)).toHaveLength(0);
  });

  it('detects multiple conflicts', () => {
    const diagramEdits = [makeEdit(10, 5, 'd1'), makeEdit(30, 5, 'd2')];
    const sourceEdits = [makeEdit(12, 3, 's1'), makeEdit(32, 3, 's2')];

    const conflicts = detectConflicts(diagramEdits, sourceEdits);
    expect(conflicts).toHaveLength(2);
  });

  it('includes description in conflict info', () => {
    const diagramEdits = [makeEdit(10, 5, 'diagram')];
    const sourceEdits = [makeEdit(12, 3, 'source')];

    const conflicts = detectConflicts(diagramEdits, sourceEdits);
    expect(conflicts[0]!.description).toBeTruthy();
    expect(typeof conflicts[0]!.description).toBe('string');
  });

  it('handles insert-vs-modify overlap', () => {
    const diagramEdits = [makeEdit(10, 0, 'insert')]; // insert at 10
    const sourceEdits = [makeEdit(8, 5, 'modify')]; // [8..13] contains 10

    const conflicts = detectConflicts(diagramEdits, sourceEdits);
    expect(conflicts).toHaveLength(1);
  });
});

describe('hasConflicts', () => {
  it('returns true when conflicts exist', () => {
    expect(hasConflicts([makeEdit(10, 5, 'a')], [makeEdit(12, 3, 'b')])).toBe(
      true,
    );
  });

  it('returns false when no conflicts', () => {
    expect(hasConflicts([makeEdit(0, 5, 'a')], [makeEdit(10, 5, 'b')])).toBe(
      false,
    );
  });

  it('returns false for empty edit arrays', () => {
    expect(hasConflicts([], [])).toBe(false);
    expect(hasConflicts([makeEdit(0, 5, 'a')], [])).toBe(false);
    expect(hasConflicts([], [makeEdit(0, 5, 'b')])).toBe(false);
  });
});

describe('resolveConflicts', () => {
  const diagramEdits = [makeEdit(10, 5, 'diagram')];
  const sourceEdits = [makeEdit(12, 3, 'source')];

  function getConflicts(): ConflictInfo[] {
    return detectConflicts(diagramEdits, sourceEdits);
  }

  describe('keep-diagram strategy', () => {
    it('keeps diagram edits and removes conflicting source edits', () => {
      const conflicts = getConflicts();
      const resolved = resolveConflicts(
        diagramEdits,
        sourceEdits,
        conflicts,
        'keep-diagram',
      );
      expect(resolved).toContain(diagramEdits[0]);
      expect(resolved).not.toContain(sourceEdits[0]);
    });

    it('preserves non-conflicting source edits', () => {
      const extraSource = makeEdit(50, 3, 'extra');
      const allSourceEdits = [...sourceEdits, extraSource];
      const conflicts = detectConflicts(diagramEdits, allSourceEdits);
      const resolved = resolveConflicts(
        diagramEdits,
        allSourceEdits,
        conflicts,
        'keep-diagram',
      );
      expect(resolved).toContain(extraSource);
    });
  });

  describe('keep-source strategy', () => {
    it('keeps source edits and removes conflicting diagram edits', () => {
      const conflicts = getConflicts();
      const resolved = resolveConflicts(
        diagramEdits,
        sourceEdits,
        conflicts,
        'keep-source',
      );
      expect(resolved).toContain(sourceEdits[0]);
      expect(resolved).not.toContain(diagramEdits[0]);
    });
  });

  describe('merge strategy', () => {
    it('keeps non-conflicting edits from both sides', () => {
      const extraDiagram = makeEdit(50, 3, 'extra-d');
      const extraSource = makeEdit(80, 3, 'extra-s');
      const allDiagram = [...diagramEdits, extraDiagram];
      const allSource = [...sourceEdits, extraSource];
      const conflicts = detectConflicts(allDiagram, allSource);
      const resolved = resolveConflicts(
        allDiagram,
        allSource,
        conflicts,
        'merge',
      );
      expect(resolved).toContain(extraDiagram);
      expect(resolved).toContain(extraSource);
    });

    it('handles insert-vs-modify by keeping both', () => {
      const insertEdit = makeEdit(10, 0, 'insert');
      const modifyEdit = makeEdit(8, 5, 'modify');
      const conflicts = detectConflicts([insertEdit], [modifyEdit]);
      const resolved = resolveConflicts(
        [insertEdit],
        [modifyEdit],
        conflicts,
        'merge',
      );
      expect(resolved).toContain(insertEdit);
      expect(resolved).toContain(modifyEdit);
    });

    it('prefers source for overlapping modifications', () => {
      const conflicts = getConflicts();
      const resolved = resolveConflicts(
        diagramEdits,
        sourceEdits,
        conflicts,
        'merge',
      );
      // Both modify the same range — source should be preferred
      expect(resolved).toContain(sourceEdits[0]);
    });
  });

  describe('cancel strategy', () => {
    it('removes all conflicting edits', () => {
      const conflicts = getConflicts();
      const resolved = resolveConflicts(
        diagramEdits,
        sourceEdits,
        conflicts,
        'cancel',
      );
      expect(resolved).not.toContain(diagramEdits[0]);
      expect(resolved).not.toContain(sourceEdits[0]);
    });

    it('preserves non-conflicting source edits', () => {
      const extraSource = makeEdit(50, 3, 'extra');
      const allSource = [...sourceEdits, extraSource];
      const conflicts = detectConflicts(diagramEdits, allSource);
      const resolved = resolveConflicts(
        diagramEdits,
        allSource,
        conflicts,
        'cancel',
      );
      expect(resolved).toContain(extraSource);
    });
  });
});
