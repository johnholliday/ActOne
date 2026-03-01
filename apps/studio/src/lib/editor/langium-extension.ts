/**
 * CodeMirror 6 extension that bridges to the Langium web worker via LangiumClient.
 *
 * Provides: diagnostics (linter), autocompletion, hover tooltips,
 * didChange notifications, semantic token highlighting, go-to-definition,
 * find references, rename, code actions, and code folding.
 */

import { type Extension, StateField, StateEffect } from '@codemirror/state';
import {
  ViewPlugin,
  type ViewUpdate,
  EditorView,
  hoverTooltip,
  type Tooltip,
  Decoration,
  type DecorationSet,
  keymap,
  showDialog,
} from '@codemirror/view';
import { setDiagnostics, type Diagnostic as CmDiagnostic } from '@codemirror/lint';
import {
  autocompletion,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete';
import { foldService } from '@codemirror/language';
import type {
  LangiumClient,
  Diagnostic as LspDiagnostic,
  DiagnosticSeverity,
  CompletionItem,
  CompletionList,
  FoldingRange,
  WorkspaceEdit,
  TextEdit,
} from './langium-client.js';

/* ── Helpers: Position conversion ────────────────────────────────── */

function cmOffsetToLspPosition(
  doc: { lineAt(pos: number): { number: number; from: number } },
  offset: number,
): { line: number; character: number } {
  const line = doc.lineAt(offset);
  return { line: line.number - 1, character: offset - line.from };
}

function lspPositionToCmOffset(
  doc: { line(n: number): { from: number } },
  pos: { line: number; character: number },
): number {
  const line = doc.line(pos.line + 1);
  return line.from + pos.character;
}

/* ── Diagnostics ─────────────────────────────────────────────────── */

const setLspDiagnostics = StateEffect.define<LspDiagnostic[]>();

function lspSeverityToCm(
  severity: DiagnosticSeverity | undefined,
): 'error' | 'warning' | 'info' | 'hint' {
  switch (severity) {
    case 1:
      return 'error';
    case 2:
      return 'warning';
    case 3:
      return 'info';
    case 4:
      return 'hint';
    default:
      return 'info';
  }
}

function lspDiagnosticsToCm(
  doc: { line(n: number): { from: number } },
  diagnostics: LspDiagnostic[],
): CmDiagnostic[] {
  return diagnostics.map((d) => ({
    from: lspPositionToCmOffset(doc, d.range.start),
    to: lspPositionToCmOffset(doc, d.range.end),
    severity: lspSeverityToCm(d.severity),
    message: d.message,
    source: d.source,
  }));
}

/** Field that stores the latest LSP diagnostics and applies them to CodeMirror. */
const diagnosticsField = StateField.define<LspDiagnostic[]>({
  create() {
    return [];
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setLspDiagnostics)) {
        return effect.value;
      }
    }
    return value;
  },
});

/* ── Semantic Tokens ─────────────────────────────────────────────── */

/**
 * Semantic token legend matching Langium's AllSemanticTokenTypes ordering.
 * Indices are derived from Object.keys(AllSemanticTokenTypes) in langium/lsp:
 *   0=class, 1=comment, 2=enum, 3=enumMember, 4=event, 5=function,
 *   6=interface, 7=keyword, 8=macro, 9=method, 10=modifier, 11=namespace,
 *   12=number, 13=operator, 14=parameter, 15=property, 16=regexp,
 *   17=string, 18=struct, 19=type, 20=typeParameter, 21=variable, 22=decorator
 */
const TOKEN_TYPE_MAP: Record<number, string> = {
  0: 'cm-semantic-type',        // class → style like type
  1: 'cm-semantic-comment',     // comment
  2: 'cm-semantic-enum',        // enum
  3: 'cm-semantic-enumMember',  // enumMember
  5: 'cm-semantic-function',    // function
  7: 'cm-semantic-keyword',     // keyword
  12: 'cm-semantic-number',     // number
  15: 'cm-semantic-property',   // property
  17: 'cm-semantic-string',     // string
  19: 'cm-semantic-type',       // type
  21: 'cm-semantic-variable',   // variable
};

const setSemanticDecorations = StateEffect.define<DecorationSet>();

const semanticTokenField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setSemanticDecorations)) {
        return effect.value;
      }
    }
    // Remap decorations when the document changes
    if (tr.docChanged) {
      return value.map(tr.changes);
    }
    return value;
  },
  provide(field) {
    return EditorView.decorations.from(field);
  },
});

/* ── Reference Highlights ────────────────────────────────────────── */

const setReferenceHighlights = StateEffect.define<DecorationSet>();

const referenceHighlightField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setReferenceHighlights)) {
        return effect.value;
      }
    }
    // Clear highlights when document changes
    if (tr.docChanged) {
      return Decoration.none;
    }
    return value;
  },
  provide(field) {
    return EditorView.decorations.from(field);
  },
});

/* ── Folding Range Cache ─────────────────────────────────────────── */

interface CachedFoldRange {
  from: number;
  to: number;
}

const setFoldingRanges = StateEffect.define<CachedFoldRange[]>();

const foldingRangeField = StateField.define<CachedFoldRange[]>({
  create() {
    return [];
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setFoldingRanges)) {
        return effect.value;
      }
    }
    return value;
  },
});

/* ── Completion ──────────────────────────────────────────────────── */

function completionKindToType(kind?: number): string | undefined {
  // LSP CompletionItemKind → CodeMirror completion type
  switch (kind) {
    case 1:
      return 'text';
    case 2:
      return 'method';
    case 3:
      return 'function';
    case 5:
      return 'property';
    case 6:
      return 'variable';
    case 7:
      return 'class';
    case 9:
      return 'interface';
    case 13:
      return 'enum';
    case 14:
      return 'keyword';
    case 15:
      return 'text'; // snippet
    case 21:
      return 'constant';
    default:
      return undefined;
  }
}

/* ── Workspace Edit Application ──────────────────────────────────── */

/**
 * Apply a WorkspaceEdit to the CodeMirror view (same-file edits only).
 */
function applyWorkspaceEdit(
  edit: WorkspaceEdit,
  uri: string,
  view: EditorView,
): void {
  const fileEdits = edit.changes?.[uri];
  if (!fileEdits || fileEdits.length === 0) return;

  // Sort edits in reverse document order to preserve positions
  const sorted = [...fileEdits].sort((a, b) => {
    const lineDiff = b.range.start.line - a.range.start.line;
    if (lineDiff !== 0) return lineDiff;
    return b.range.start.character - a.range.start.character;
  });

  const changes = sorted.map((te: TextEdit) => ({
    from: lspPositionToCmOffset(view.state.doc, te.range.start),
    to: lspPositionToCmOffset(view.state.doc, te.range.end),
    insert: te.newText,
  }));

  view.dispatch({ changes });
}

/* ── Go-to-Definition ────────────────────────────────────────────── */

async function goToDefinition(
  client: LangiumClient,
  uri: string,
  view: EditorView,
  offset: number,
): Promise<boolean> {
  if (!client.isReady) return false;

  const pos = cmOffsetToLspPosition(view.state.doc, offset);

  try {
    const result = await client.definition(uri, pos);
    if (!result) return false;

    const locations = Array.isArray(result) ? result : [result];
    if (locations.length === 0) return false;

    const loc = locations[0]!;

    if (loc.uri === uri) {
      // Same file: move cursor to definition
      const targetOffset = lspPositionToCmOffset(view.state.doc, loc.range.start);
      view.dispatch({
        selection: { anchor: targetOffset },
        scrollIntoView: true,
      });
      view.focus();
    } else {
      // Cross-file: emit custom event
      view.dom.dispatchEvent(
        new CustomEvent('actone:navigateToDefinition', {
          bubbles: true,
          detail: { uri: loc.uri, range: loc.range },
        }),
      );
    }

    return true;
  } catch {
    return false;
  }
}

/* ── Find References ─────────────────────────────────────────────── */

async function findReferences(
  client: LangiumClient,
  uri: string,
  view: EditorView,
  offset: number,
): Promise<boolean> {
  if (!client.isReady) return false;

  const pos = cmOffsetToLspPosition(view.state.doc, offset);

  try {
    const locations = await client.references(uri, pos);
    if (!locations || locations.length === 0) {
      // Clear any existing highlights
      view.dispatch({ effects: setReferenceHighlights.of(Decoration.none) });
      return false;
    }

    // Filter to same-file locations
    const sameFile = locations.filter((loc) => loc.uri === uri);
    if (sameFile.length === 0) {
      view.dispatch({ effects: setReferenceHighlights.of(Decoration.none) });
      return false;
    }

    const marks = sameFile.map((loc) => {
      const from = lspPositionToCmOffset(view.state.doc, loc.range.start);
      const to = lspPositionToCmOffset(view.state.doc, loc.range.end);
      return Decoration.mark({ class: 'cm-reference-highlight' }).range(from, to);
    });

    // Sort by position (required for RangeSet)
    marks.sort((a, b) => a.from - b.from || a.to - b.to);

    view.dispatch({
      effects: setReferenceHighlights.of(Decoration.set(marks)),
    });

    return true;
  } catch {
    return false;
  }
}

/* ── Rename ──────────────────────────────────────────────────────── */

async function performRename(
  client: LangiumClient,
  uri: string,
  view: EditorView,
): Promise<boolean> {
  if (!client.isReady) return false;

  const offset = view.state.selection.main.head;
  const pos = cmOffsetToLspPosition(view.state.doc, offset);

  try {
    // Check if rename is possible and get current name
    const prepareResult = await client.prepareRename(uri, pos);
    if (!prepareResult) return false;

    let currentName = '';
    if ('placeholder' in prepareResult) {
      currentName = prepareResult.placeholder;
    } else if ('start' in prepareResult) {
      // It's a Range
      const from = lspPositionToCmOffset(view.state.doc, prepareResult.start);
      const to = lspPositionToCmOffset(view.state.doc, prepareResult.end);
      currentName = view.state.doc.sliceString(from, to);
    } else if ('range' in prepareResult) {
      const from = lspPositionToCmOffset(view.state.doc, prepareResult.range.start);
      const to = lspPositionToCmOffset(view.state.doc, prepareResult.range.end);
      currentName = view.state.doc.sliceString(from, to);
    }

    // Show rename dialog
    const { result, close } = showDialog(view, {
      label: 'Rename to:',
      input: { value: currentName, 'aria-label': 'New name' },
      class: 'cm-rename-dialog',
      focus: true,
      top: true,
    });

    const form = await result;
    if (!form) return false; // User pressed Escape

    const input = form.querySelector('input');
    const newName = input?.value?.trim();
    if (!newName || newName === currentName) {
      view.dispatch({ effects: close.of(null) });
      return false;
    }

    // Perform the rename
    const edit = await client.rename(uri, pos, newName);
    if (edit) {
      applyWorkspaceEdit(edit, uri, view);
    }

    return true;
  } catch {
    return false;
  }
}

/* ── Build the Extension ─────────────────────────────────────────── */

/**
 * Create a CodeMirror extension that bridges to the given LangiumClient.
 *
 * @param client - The LangiumClient instance
 * @param getUri - Accessor returning the current document URI (supports document switching)
 */
export function langiumExtension(client: LangiumClient, getUri: () => string): Extension {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let semanticTimer: ReturnType<typeof setTimeout> | null = null;
  let refClearTimer: ReturnType<typeof setTimeout> | null = null;

  /** ViewPlugin that sends didChange notifications on document edits. */
  const changePlugin = ViewPlugin.define((view) => {
    return {
      update(update: ViewUpdate) {
        if (!client.isReady) return;

        if (update.docChanged) {
          // Debounce didChange notifications (150ms)
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            const text = update.state.doc.toString();
            client.didChange(getUri(), text);

            // Refresh semantic tokens after a change settles (500ms)
            if (semanticTimer) clearTimeout(semanticTimer);
            semanticTimer = setTimeout(() => {
              fetchSemanticTokens(client, getUri(), view);
              fetchFoldingRanges(client, getUri(), view);
            }, 500);
          }, 150);
        }

        // Auto-clear reference highlights on selection change (debounced)
        if (update.selectionSet && !update.docChanged) {
          if (refClearTimer) clearTimeout(refClearTimer);
          refClearTimer = setTimeout(() => {
            const current = view.state.field(referenceHighlightField);
            if (current !== Decoration.none) {
              view.dispatch({
                effects: setReferenceHighlights.of(Decoration.none),
              });
            }
          }, 200);
        }
      },
      destroy() {
        if (debounceTimer) clearTimeout(debounceTimer);
        if (semanticTimer) clearTimeout(semanticTimer);
        if (refClearTimer) clearTimeout(refClearTimer);
      },
    };
  });

  /** Autocompletion source wired to the Langium completion provider. */
  const completionSource = async (
    context: CompletionContext,
  ): Promise<CompletionResult | null> => {
    if (!client.isReady) return null;

    const pos = cmOffsetToLspPosition(context.state.doc, context.pos);

    try {
      const result = await client.completion(getUri(), pos);
      if (!result) return null;

      const items: CompletionItem[] = Array.isArray(result)
        ? result
        : (result as CompletionList).items;

      if (!items || items.length === 0) return null;

      // Determine the completion span
      const word = context.matchBefore(/\w*/);
      const from = word ? word.from : context.pos;

      return {
        from,
        options: items.map((item) => ({
          label: item.label,
          type: completionKindToType(item.kind),
          detail: item.detail,
          info: typeof item.documentation === 'string'
            ? item.documentation
            : item.documentation?.value,
          apply: item.insertText ?? item.label,
        })),
      };
    } catch {
      return null;
    }
  };

  /** Hover tooltip provider wired to the Langium hover provider. */
  const hoverProvider = hoverTooltip(async (view, pos): Promise<Tooltip | null> => {
    if (!client.isReady) return null;

    const lspPos = cmOffsetToLspPosition(view.state.doc, pos);

    try {
      const hover = await client.hover(getUri(), lspPos);
      if (!hover) return null;

      const content =
        typeof hover.contents === 'string'
          ? hover.contents
          : hover.contents.value;

      if (!content) return null;

      return {
        pos,
        above: true,
        create() {
          const dom = document.createElement('div');
          dom.className = 'cm-hover-tooltip';
          dom.style.maxWidth = '500px';
          dom.style.padding = '8px 12px';
          dom.style.fontSize = '13px';
          dom.style.lineHeight = '1.5';
          dom.style.whiteSpace = 'pre-wrap';
          dom.textContent = content;
          return { dom };
        },
      };
    } catch {
      return null;
    }
  });

  /** Keybindings for LSP features. */
  const lspKeymap = keymap.of([
    {
      key: 'F12',
      run(view) {
        goToDefinition(client, getUri(), view, view.state.selection.main.head);
        return true;
      },
    },
    {
      key: 'Shift-F12',
      run(view) {
        findReferences(client, getUri(), view, view.state.selection.main.head);
        return true;
      },
    },
    {
      key: 'F2',
      run(view) {
        performRename(client, getUri(), view);
        return true;
      },
    },
  ]);

  /** Ctrl+Click handler for go-to-definition. */
  const ctrlClickHandler = EditorView.domEventHandlers({
    click(event, view) {
      if (!(event.ctrlKey || event.metaKey)) return false;
      const offset = view.posAtCoords({ x: event.clientX, y: event.clientY });
      if (offset === null) return false;
      event.preventDefault();
      goToDefinition(client, getUri(), view, offset);
      return true;
    },
  });

  /** Folding service that uses cached LSP folding ranges. */
  const lspFoldService = foldService.of((state, lineStart, lineEnd) => {
    const ranges = state.field(foldingRangeField);
    for (const range of ranges) {
      if (range.from >= lineStart && range.from <= lineEnd) {
        return { from: range.from, to: range.to };
      }
    }
    return null;
  });

  return [
    diagnosticsField,
    semanticTokenField,
    referenceHighlightField,
    foldingRangeField,
    changePlugin,
    autocompletion({ override: [completionSource] }),
    hoverProvider,
    lspKeymap,
    ctrlClickHandler,
    lspFoldService,
  ];
}

/* ── Diagnostic Push Helpers ─────────────────────────────────────── */

/**
 * Push diagnostics from the LSP publishDiagnostics notification
 * into the CodeMirror editor view, optionally enriching them with code actions.
 */
export async function pushDiagnostics(
  view: EditorView,
  diagnostics: LspDiagnostic[],
  client?: LangiumClient,
  uri?: string,
): Promise<void> {
  // Push diagnostics immediately
  const cmDiagnostics = lspDiagnosticsToCm(view.state.doc, diagnostics);
  view.dispatch(
    setDiagnostics(view.state, cmDiagnostics),
    { effects: setLspDiagnostics.of(diagnostics) },
  );

  // If client is provided, fetch code actions and enrich diagnostics
  if (client?.isReady && uri && diagnostics.length > 0) {
    try {
      // Compute the full range spanning all diagnostics
      let startLine = Infinity;
      let startChar = Infinity;
      let endLine = 0;
      let endChar = 0;
      for (const d of diagnostics) {
        if (
          d.range.start.line < startLine ||
          (d.range.start.line === startLine && d.range.start.character < startChar)
        ) {
          startLine = d.range.start.line;
          startChar = d.range.start.character;
        }
        if (
          d.range.end.line > endLine ||
          (d.range.end.line === endLine && d.range.end.character > endChar)
        ) {
          endLine = d.range.end.line;
          endChar = d.range.end.character;
        }
      }

      const fullRange = {
        start: { line: startLine, character: startChar },
        end: { line: endLine, character: endChar },
      };

      const actions = await client.codeAction(uri, fullRange, diagnostics);
      if (!actions || actions.length === 0) return;

      // Map actions to CM diagnostics
      const enriched: CmDiagnostic[] = diagnostics.map((d) => {
        const cmDiag: CmDiagnostic = {
          from: lspPositionToCmOffset(view.state.doc, d.range.start),
          to: lspPositionToCmOffset(view.state.doc, d.range.end),
          severity: lspSeverityToCm(d.severity),
          message: d.message,
          source: d.source,
        };

        // Find actions whose diagnostics overlap this diagnostic
        const matching = actions.filter((a) =>
          a.diagnostics?.some(
            (ad) =>
              ad.range.start.line === d.range.start.line &&
              ad.range.start.character === d.range.start.character &&
              ad.message === d.message,
          ),
        );

        if (matching.length > 0) {
          cmDiag.actions = matching.map((a) => ({
            name: a.title,
            apply(v: EditorView) {
              if (a.edit) {
                applyWorkspaceEdit(a.edit, uri, v);
              }
            },
          }));
        }

        return cmDiag;
      });

      view.dispatch(setDiagnostics(view.state, enriched));
    } catch {
      // Code actions are optional — silently ignore failures
    }
  }
}

/* ── Semantic Token Fetch ────────────────────────────────────────── */

/**
 * Fetch semantic tokens from the worker and apply them as decorations.
 */
async function fetchSemanticTokens(
  client: LangiumClient,
  uri: string,
  view: EditorView,
): Promise<void> {
  if (!client.isReady) {
    console.log('[SemanticTokens] client not ready, skipping');
    return;
  }

  try {
    console.log('[SemanticTokens] requesting tokens for', uri);
    const tokens = await client.semanticTokensFull(uri);
    console.log('[SemanticTokens] response:', tokens ? `${tokens.data?.length ?? 0} data entries` : 'null');
    if (!tokens || !tokens.data || tokens.data.length === 0) {
      view.dispatch({ effects: setSemanticDecorations.of(Decoration.none) });
      return;
    }

    const builder: { from: number; to: number; class: string }[] = [];
    const data = tokens.data;
    let line = 0;
    let character = 0;

    // Semantic tokens are encoded as deltas: [deltaLine, deltaChar, length, tokenType, tokenModifiers]
    for (let i = 0; i < data.length; i += 5) {
      const deltaLine = data[i]!;
      const deltaChar = data[i + 1]!;
      const length = data[i + 2]!;
      const tokenType = data[i + 3]!;

      line += deltaLine;
      character = deltaLine === 0 ? character + deltaChar : deltaChar;

      const className = TOKEN_TYPE_MAP[tokenType];
      if (!className) continue;

      const from = lspPositionToCmOffset(view.state.doc, { line, character });
      builder.push({ from, to: from + length, class: className });
    }

    // Sort by position (required for RangeSet)
    builder.sort((a, b) => a.from - b.from || a.to - b.to);

    const decorations = Decoration.set(
      builder.map((b) => Decoration.mark({ class: b.class }).range(b.from, b.to)),
    );

    console.log('[SemanticTokens] applied', builder.length, 'decorations');
    view.dispatch({ effects: setSemanticDecorations.of(decorations) });
  } catch (err) {
    console.error('[SemanticTokens] error:', err);
  }
}

/**
 * Trigger an initial semantic token fetch (e.g., after didOpen).
 */
export function refreshSemanticTokens(
  client: LangiumClient,
  uri: string,
  view: EditorView,
): void {
  fetchSemanticTokens(client, uri, view);
}

/* ── Folding Range Fetch ─────────────────────────────────────────── */

/**
 * Fetch folding ranges from the worker and cache them for the fold service.
 */
async function fetchFoldingRanges(
  client: LangiumClient,
  uri: string,
  view: EditorView,
): Promise<void> {
  if (!client.isReady) return;

  try {
    const ranges = await client.foldingRange(uri);
    if (!ranges || ranges.length === 0) {
      view.dispatch({ effects: setFoldingRanges.of([]) });
      return;
    }

    const cached: CachedFoldRange[] = ranges.map((r: FoldingRange) => {
      // Fold from end of start line to end of end line
      const startLine = view.state.doc.line(r.startLine + 1);
      const endLine = view.state.doc.line(r.endLine + 1);
      return {
        from: r.startCharacter != null
          ? startLine.from + r.startCharacter
          : startLine.to,
        to: r.endCharacter != null
          ? endLine.from + r.endCharacter
          : endLine.to,
      };
    });

    view.dispatch({ effects: setFoldingRanges.of(cached) });
  } catch {
    // Folding is non-critical
  }
}

/**
 * Trigger an initial folding range fetch (e.g., after didOpen).
 */
export function refreshFoldingRanges(
  client: LangiumClient,
  uri: string,
  view: EditorView,
): void {
  fetchFoldingRanges(client, uri, view);
}
