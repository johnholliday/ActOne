import type { AstNode } from 'langium';
import { AbstractFormatter, Formatting } from 'langium/lsp';
import * as ast from '../generated/ast.js';

/**
 * Document formatter for ActOne DSL.
 *
 * Normalizes:
 *  - 2-space indentation
 *  - Max 2 blank lines between top-level blocks
 *  - Preserves string content and comments
 */
export class ActOneFormatter extends AbstractFormatter {
  protected override format(node: AstNode): void {
    if (ast.isStory(node)) {
      this.formatStory(node);
    } else if (
      ast.isCharacterDef(node) ||
      ast.isWorldDef(node) ||
      ast.isThemeDef(node) ||
      ast.isTimelineDef(node) ||
      ast.isSceneDef(node) ||
      ast.isPlotDef(node) ||
      ast.isInteractionDef(node) ||
      ast.isGenerateBlock(node)
    ) {
      this.formatBlock(node);
    }
  }

  private formatStory(story: ast.Story): void {
    const formatter = this.getNodeFormatter(story);
    const openBrace = formatter.keyword('{');
    const closeBrace = formatter.keyword('}');

    openBrace.prepend(Formatting.oneSpace());
    formatter.interior(openBrace, closeBrace).prepend(Formatting.indent());
    closeBrace.prepend(Formatting.newLine());
  }

  private formatBlock(node: AstNode): void {
    const formatter = this.getNodeFormatter(node);
    const openBrace = formatter.keyword('{');
    const closeBrace = formatter.keyword('}');

    openBrace.prepend(Formatting.oneSpace());
    formatter.interior(openBrace, closeBrace).prepend(Formatting.indent());
    closeBrace.prepend(Formatting.newLine());
  }
}
