/**
 * T062: TextEdit types and apply/sort utilities for diagram-to-source editing.
 */

export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface TextEdit {
  range: Range;
  newText: string;
}

/** Sort text edits in reverse document order (last first) for safe application. */
export function sortEditsReverse(edits: TextEdit[]): TextEdit[] {
  return [...edits].sort((a, b) => {
    const lineDiff = b.range.start.line - a.range.start.line;
    if (lineDiff !== 0) return lineDiff;
    return b.range.start.character - a.range.start.character;
  });
}

/** Apply text edits to a document string (edits must be in reverse order). */
export function applyEdits(text: string, edits: TextEdit[]): string {
  const sorted = sortEditsReverse(edits);
  const lines = text.split('\n');

  for (const edit of sorted) {
    const startOffset = positionToOffset(lines, edit.range.start);
    const endOffset = positionToOffset(lines, edit.range.end);
    text = text.substring(0, startOffset) + edit.newText + text.substring(endOffset);
    // Recalculate lines after each edit
    lines.length = 0;
    lines.push(...text.split('\n'));
  }

  return text;
}

/** Convert a Position to an absolute character offset in the text. */
function positionToOffset(lines: string[], pos: Position): number {
  let offset = 0;
  for (let i = 0; i < pos.line && i < lines.length; i++) {
    offset += (lines[i]?.length ?? 0) + 1; // +1 for newline
  }
  return offset + pos.character;
}

/** Create a TextEdit for inserting text at a position. */
export function insertAt(pos: Position, text: string): TextEdit {
  return { range: { start: pos, end: pos }, newText: text };
}

/** Create a TextEdit for replacing a range with new text. */
export function replaceRange(range: Range, newText: string): TextEdit {
  return { range, newText };
}

/** Create a TextEdit for deleting a range. */
export function deleteRange(range: Range): TextEdit {
  return { range, newText: '' };
}
