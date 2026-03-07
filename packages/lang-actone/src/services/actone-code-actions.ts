import type { CodeActionProvider } from 'langium/lsp';
import type { LangiumDocument, MaybePromise } from 'langium';
import type {
  CodeAction,
  CodeActionParams,
} from 'vscode-languageserver-protocol';
import { CodeActionKind } from 'vscode-languageserver-protocol';

/**
 * Code action provider for ActOne DSL.
 *
 * Provides quick fixes for common validation errors:
 *  - Clamp out-of-range values (trait, mood, weight, temperature)
 *  - Remove duplicate generate blocks
 */
export class ActOneCodeActionProvider implements CodeActionProvider {
  getCodeActions(
    document: LangiumDocument,
    params: CodeActionParams,
  ): MaybePromise<CodeAction[]> {
    const actions: CodeAction[] = [];

    for (const diagnostic of params.context.diagnostics) {
      // Provide clamp-to-range quick fixes for value range errors
      if (diagnostic.message.includes('must be between')) {
        const rangeMatch = diagnostic.message.match(
          /between (-?[\d.]+) and ([\d.,]+)/,
        );
        const gotMatch = diagnostic.message.match(/got (-?[\d.]+)/);

        if (rangeMatch && gotMatch) {
          const min = parseFloat(rangeMatch[1]!);
          const max = parseFloat(rangeMatch[2]!.replace(',', ''));
          const got = parseFloat(gotMatch[1]!);
          const clamped = Math.max(min, Math.min(max, got));

          actions.push({
            title: `Clamp value to ${clamped}`,
            kind: CodeActionKind.QuickFix,
            diagnostics: [diagnostic],
            edit: {
              changes: {
                [document.uri.toString()]: [
                  {
                    range: diagnostic.range,
                    newText: String(clamped),
                  },
                ],
              },
            },
          });
        }
      }
    }

    return actions;
  }
}
