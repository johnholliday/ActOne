/**
 * Regex-based keyword highlighting for the ActOne DSL.
 *
 * Provides fallback syntax highlighting that works even when the Langium
 * parser's error recovery prevents AST construction for some blocks.
 * When semantic tokens from Langium are also available, both decorations
 * use the same CSS classes, so they stack harmlessly.
 */

import { ViewPlugin, Decoration, type DecorationSet, type EditorView, type ViewUpdate } from '@codemirror/view';

/** Top-level block definition keywords */
const BLOCK_KEYWORDS = new Set([
  'story', 'character', 'world', 'scene', 'plot', 'interaction',
  'generate', 'theme', 'timeline',
]);

/** Property keywords that appear inside block definitions */
const PROPERTY_KEYWORDS = new Set([
  // Character properties
  'nature', 'bio', 'role', 'personality', 'voice', 'quirks',
  'goals', 'conflicts', 'strengths', 'flaws', 'relationships',
  'arc', 'symbols', 'secret', 'notes',
  // World properties
  'locations', 'rules', 'period', 'sensory',
  // Location/rule entry properties
  'name', 'description', 'rule', 'category',
  // Scene properties
  'type', 'location', 'pov', 'layer', 'participants', 'atmosphere',
  'objective', 'trigger', 'transition',
  // Generate settings
  'genre', 'tone', 'tense', 'pacing', 'default_pov', 'chapter_breaks',
  // Theme properties
  'motifs', 'counter_themes',
  // Timeline properties
  'events',
  // Interaction properties
  'subtext', 'power_dynamic',
  // Plot properties
  'conflict_type', 'converges_at',
]);

const keywordDeco = Decoration.mark({ class: 'cm-semantic-keyword' });

/**
 * Build keyword decorations by scanning each line for a leading keyword.
 * Only highlights the first identifier on each non-comment line, avoiding
 * false positives inside strings (ActOne strings cannot span lines).
 */
function buildDecorations(view: EditorView): DecorationSet {
  const ranges: { from: number; to: number }[] = [];
  const doc = view.state.doc;

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const text = line.text;

    // Skip empty lines and comment lines
    const trimmed = text.trimStart();
    if (
      !trimmed ||
      trimmed.startsWith('//') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*')
    ) {
      continue;
    }

    // Extract the first word (identifier) on the line
    const match = trimmed.match(/^([a-zA-Z_]\w*)\b/);
    if (!match || !match[1]) continue;

    const word = match[1];
    if (BLOCK_KEYWORDS.has(word) || PROPERTY_KEYWORDS.has(word)) {
      const offset = text.length - trimmed.length; // leading whitespace
      const from = line.from + offset;
      const to = from + word.length;
      ranges.push({ from, to });
    }
  }

  return Decoration.set(
    ranges.map((r) => keywordDeco.range(r.from, r.to)),
  );
}

/**
 * CodeMirror ViewPlugin that provides regex-based keyword highlighting.
 * Recomputes on document or viewport changes.
 */
export const actoneKeywordHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);
