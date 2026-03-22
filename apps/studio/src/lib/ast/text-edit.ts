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

