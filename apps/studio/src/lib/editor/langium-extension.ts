/**
 * CodeMirror 6 extension that bridges to the Langium web worker via LangiumClient.
 *
 * Provides: diagnostics (linter), autocompletion, hover tooltips, and
 * didChange notifications. Semantic token highlighting is fetched on demand.
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
} from '@codemirror/view';
import { setDiagnostics, type Diagnostic as CmDiagnostic } from '@codemirror/lint';
import {
  autocompletion,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete';
import type {
  LangiumClient,
  Diagnostic as LspDiagnostic,
  DiagnosticSeverity,
  CompletionItem,
  CompletionList,
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
 * Semantic token legend matching the Langium server's registration.
 * Must align with the token types the server advertises in its
 * ServerCapabilities.semanticTokensProvider.legend.tokenTypes.
 */
const TOKEN_TYPE_MAP: Record<number, string> = {
  0: 'cm-semantic-comment',
  1: 'cm-semantic-keyword',
  2: 'cm-semantic-string',
  3: 'cm-semantic-number',
  4: 'cm-semantic-type',
  5: 'cm-semantic-property',
  6: 'cm-semantic-variable',
  7: 'cm-semantic-function',
  8: 'cm-semantic-enum',
  9: 'cm-semantic-enumMember',
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

/* ── Build the Extension ─────────────────────────────────────────── */

/**
 * Create a CodeMirror extension that bridges to the given LangiumClient.
 *
 * @param client - The LangiumClient instance
 * @param uri - The document URI used in LSP protocol
 */
export function langiumExtension(client: LangiumClient, uri: string): Extension {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let semanticTimer: ReturnType<typeof setTimeout> | null = null;

  /** ViewPlugin that sends didChange notifications on document edits. */
  const changePlugin = ViewPlugin.define((view) => {
    return {
      update(update: ViewUpdate) {
        if (!update.docChanged || !client.isReady) return;

        // Debounce didChange notifications (150ms)
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const text = update.state.doc.toString();
          client.didChange(uri, text);

          // Refresh semantic tokens after a change settles (500ms)
          if (semanticTimer) clearTimeout(semanticTimer);
          semanticTimer = setTimeout(() => {
            fetchSemanticTokens(client, uri, view);
          }, 500);
        }, 150);
      },
      destroy() {
        if (debounceTimer) clearTimeout(debounceTimer);
        if (semanticTimer) clearTimeout(semanticTimer);
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
      const result = await client.completion(uri, pos);
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
      const hover = await client.hover(uri, lspPos);
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

  return [
    diagnosticsField,
    semanticTokenField,
    changePlugin,
    autocompletion({ override: [completionSource] }),
    hoverProvider,
  ];
}

/* ── Diagnostic Push Helpers ─────────────────────────────────────── */

/**
 * Push diagnostics from the LSP publishDiagnostics notification
 * into the CodeMirror editor view.
 */
export function pushDiagnostics(view: EditorView, diagnostics: LspDiagnostic[]): void {
  const cmDiagnostics = lspDiagnosticsToCm(view.state.doc, diagnostics);
  view.dispatch(
    setDiagnostics(view.state, cmDiagnostics),
    { effects: setLspDiagnostics.of(diagnostics) },
  );
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
  if (!client.isReady) return;

  try {
    const tokens = await client.semanticTokensFull(uri);
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

    view.dispatch({ effects: setSemanticDecorations.of(decorations) });
  } catch {
    // Silently fail — semantic tokens are cosmetic
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
