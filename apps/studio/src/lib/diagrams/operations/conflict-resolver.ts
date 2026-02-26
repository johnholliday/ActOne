/**
 * T075: Conflict resolver.
 *
 * Detects and manages resolution when diagram edits conflict
 * with concurrent source edits.
 */

import type { TextEdit } from '$lib/ast/text-edit.js';

export interface ConflictInfo {
  /** The diagram-generated edit that conflicts. */
  diagramEdit: TextEdit;
  /** The concurrent source edit that conflicts. */
  sourceEdit: TextEdit;
  /** Description of the conflict for user display. */
  description: string;
}

export type ResolutionStrategy =
  | 'keep-diagram'   // Apply diagram edit, discard source edit
  | 'keep-source'    // Keep source edit, discard diagram edit
  | 'merge'          // Attempt to merge both edits
  | 'cancel';        // Cancel both edits

/**
 * Detect conflicts between diagram-generated edits and concurrent source edits.
 *
 * Two edits conflict if their affected ranges overlap.
 */
export function detectConflicts(
  diagramEdits: TextEdit[],
  sourceEdits: TextEdit[],
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];

  for (const de of diagramEdits) {
    const deEnd = de.offset + de.length;
    for (const se of sourceEdits) {
      const seEnd = se.offset + se.length;

      // Check for range overlap
      if (de.offset < seEnd && se.offset < deEnd) {
        conflicts.push({
          diagramEdit: de,
          sourceEdit: se,
          description: buildConflictDescription(de, se),
        });
      }
    }
  }

  return conflicts;
}

/**
 * Resolve conflicts by applying the chosen strategy.
 *
 * Returns the final set of edits to apply.
 */
export function resolveConflicts(
  diagramEdits: TextEdit[],
  sourceEdits: TextEdit[],
  conflicts: ConflictInfo[],
  strategy: ResolutionStrategy,
): TextEdit[] {
  switch (strategy) {
    case 'keep-diagram': {
      // Apply all diagram edits, remove conflicting source edits
      const conflictingSourceEdits = new Set(conflicts.map((c) => c.sourceEdit));
      const safeSourceEdits = sourceEdits.filter((e) => !conflictingSourceEdits.has(e));
      return [...safeSourceEdits, ...diagramEdits];
    }

    case 'keep-source': {
      // Keep all source edits, remove conflicting diagram edits
      const conflictingDiagramEdits = new Set(conflicts.map((c) => c.diagramEdit));
      const safeDiagramEdits = diagramEdits.filter((e) => !conflictingDiagramEdits.has(e));
      return [...sourceEdits, ...safeDiagramEdits];
    }

    case 'merge': {
      // Attempt to merge: apply non-conflicting edits from both sides
      const conflictingDiagramEdits = new Set(conflicts.map((c) => c.diagramEdit));
      const conflictingSourceEdits = new Set(conflicts.map((c) => c.sourceEdit));
      const safeDiagramEdits = diagramEdits.filter((e) => !conflictingDiagramEdits.has(e));
      const safeSourceEdits = sourceEdits.filter((e) => !conflictingSourceEdits.has(e));

      // For conflicts, try to reconcile by adjusting offsets
      const mergedConflictEdits: TextEdit[] = [];
      for (const conflict of conflicts) {
        // If diagram is an insert (length 0) and source is a modification, keep both
        if (conflict.diagramEdit.length === 0) {
          mergedConflictEdits.push(conflict.sourceEdit);
          mergedConflictEdits.push(conflict.diagramEdit);
        } else if (conflict.sourceEdit.length === 0) {
          mergedConflictEdits.push(conflict.diagramEdit);
          mergedConflictEdits.push(conflict.sourceEdit);
        } else {
          // Both modify the same range — prefer source (user's manual edit)
          mergedConflictEdits.push(conflict.sourceEdit);
        }
      }

      return [...safeSourceEdits, ...safeDiagramEdits, ...mergedConflictEdits];
    }

    case 'cancel':
      // Cancel everything — return only non-conflicting source edits
      return sourceEdits.filter(
        (e) => !conflicts.some((c) => c.sourceEdit === e),
      );
  }
}

/**
 * Check if there are any pending conflicts that need user resolution.
 */
export function hasConflicts(
  diagramEdits: TextEdit[],
  sourceEdits: TextEdit[],
): boolean {
  return detectConflicts(diagramEdits, sourceEdits).length > 0;
}

function buildConflictDescription(de: TextEdit, se: TextEdit): string {
  const deRange = `[${de.offset}..${de.offset + de.length}]`;
  const seRange = `[${se.offset}..${se.offset + se.length}]`;

  if (de.length === 0 && se.length === 0) {
    return `Both diagram and source insert at position ${de.offset}`;
  }
  if (de.length === 0) {
    return `Diagram inserts at ${de.offset}, source modifies ${seRange}`;
  }
  if (se.length === 0) {
    return `Source inserts at ${se.offset}, diagram modifies ${deRange}`;
  }
  return `Overlapping modifications: diagram ${deRange}, source ${seRange}`;
}
