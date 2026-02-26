import type { AstNode } from 'langium';
import {
  AbstractSemanticTokenProvider,
  AllSemanticTokenTypes,
  type SemanticTokenAcceptor,
} from 'langium/lsp';
import {
  isCharacterDef,
  isWorldDef,
  isThemeDef,
  isTimelineDef,
  isSceneDef,
  isPlotDef,
  isInteractionDef,
  isPersonalityTrait,
  isMoodEntry,
  isStyleMixEntry,
} from '../generated/ast.js';

/**
 * Semantic token provider for ActOne DSL.
 *
 * Distinguishes:
 *  - Definitions (character, world, etc. names) → type
 *  - Trait/mood names → property
 *  - Style mix character references → variable
 */
export class ActOneSemanticTokenProvider extends AbstractSemanticTokenProvider {
  protected override highlightElement(
    node: AstNode,
    acceptor: SemanticTokenAcceptor,
  ): void {
    // Highlight definition names as "type" tokens
    if (
      isCharacterDef(node) ||
      isWorldDef(node) ||
      isThemeDef(node) ||
      isTimelineDef(node) ||
      isSceneDef(node) ||
      isPlotDef(node) ||
      isInteractionDef(node)
    ) {
      acceptor({
        node,
        property: 'name',
        type: 'type',
      });
    }

    // Highlight trait/mood names as "property" tokens
    if (isPersonalityTrait(node) || isMoodEntry(node)) {
      acceptor({
        node,
        property: 'name',
        type: 'property',
      });
    }

    // Highlight style mix character references
    if (isStyleMixEntry(node) && node.character) {
      acceptor({
        node,
        property: 'character',
        type: 'variable',
      });
    }
  }
}
