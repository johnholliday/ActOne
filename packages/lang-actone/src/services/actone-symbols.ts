import type { AstNode, CstNode, LangiumDocument } from 'langium';
import { DefaultDocumentSymbolProvider } from 'langium/lsp';
import type { DocumentSymbol } from 'vscode-languageserver-protocol';
import { SymbolKind } from 'vscode-languageserver-protocol';
import {
  isCharacterDef,
  isWorldDef,
  isThemeDef,
  isTimelineDef,
  isSceneDef,
  isPlotDef,
  isInteractionDef,
  isGenerateBlock,
} from '../generated/ast.js';

/**
 * Document symbol provider for ActOne DSL.
 *
 * Provides a hierarchical outline organized by element type with
 * appropriate symbol kinds for each DSL construct.
 */
export class ActOneDocumentSymbolProvider extends DefaultDocumentSymbolProvider {
  protected override createSymbol(
    document: LangiumDocument,
    astNode: AstNode,
    cstNode: CstNode,
    nameNode: CstNode,
    computedName?: string,
  ): DocumentSymbol {
    // Strip surrounding quotes from DefinitionName (ID | STRING) so that
    // symbol names match the serialized AST names used by the outline panel.
    const cleanedName = computedName ? this.stripQuotes(computedName) : undefined;
    const symbol = super.createSymbol(
      document,
      astNode,
      cstNode,
      nameNode,
      cleanedName,
    );
    symbol.kind = this.getActOneSymbolKind(astNode);
    return symbol;
  }

  private stripQuotes(name: string): string {
    if ((name.startsWith('"') && name.endsWith('"')) ||
        (name.startsWith("'") && name.endsWith("'"))) {
      return name.slice(1, -1);
    }
    return name;
  }

  private getActOneSymbolKind(node: AstNode): SymbolKind {
    if (isCharacterDef(node)) return SymbolKind.Class;
    if (isWorldDef(node)) return SymbolKind.Namespace;
    if (isThemeDef(node)) return SymbolKind.Constant;
    if (isTimelineDef(node)) return SymbolKind.Enum;
    if (isSceneDef(node)) return SymbolKind.Function;
    if (isPlotDef(node)) return SymbolKind.Struct;
    if (isInteractionDef(node)) return SymbolKind.Event;
    if (isGenerateBlock(node)) return SymbolKind.Object;
    return SymbolKind.Field;
  }
}
