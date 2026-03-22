import type { AstNode } from 'langium';
import {
  AbstractSemanticTokenProvider,
  type SemanticTokenAcceptor,
} from 'langium/lsp';
import {
  isStory,
  isCharacterDef,
  isWorldDef,
  isThemeDef,
  isTimelineDef,
  isSceneDef,
  isPlotDef,
  isInteractionDef,
  isGenerateBlock,
  isPersonalityTrait,
  isMoodEntry,
  isStyleMixEntry,
  isNatureProp,
  isBioProp,
  isRoleProp,
  isPersonalityProp,
  isVoiceProp,
  isGoalsProp,
  isConflictsProp,
  isRelationshipsProp,
  isArcProp,
  isSecretProp,
  isLocationBlock,
  isRuleBlock,
} from '../generated/ast.js';

/**
 * Semantic token provider for ActOne DSL.
 *
 * Highlights:
 *  - Keywords (story, character, world, etc.) → keyword
 *  - Definition names (character/world/etc. names) → type
 *  - Property keywords (bio, voice, nature, etc.) → keyword
 *  - Trait/mood names → property
 *  - Style mix character references → variable
 *  - String literals → string
 *  - Number literals → number
 */
export class ActOneSemanticTokenProvider extends AbstractSemanticTokenProvider {
  protected override highlightElement(
    node: AstNode,
    acceptor: SemanticTokenAcceptor,
  ): void {

    // ── Definition-level keyword + name highlighting ──────────────

    if (isStory(node)) {
      acceptor({ node, keyword: 'story', type: 'keyword' });
      acceptor({ node, property: 'name', type: 'string' });
    }

    if (isCharacterDef(node)) {
      acceptor({ node, keyword: 'character', type: 'keyword' });
      acceptor({ node, property: 'name', type: 'type' });
    }

    if (isWorldDef(node)) {
      acceptor({ node, keyword: 'world', type: 'keyword' });
      acceptor({ node, property: 'name', type: 'type' });
    }

    if (isThemeDef(node)) {
      acceptor({ node, keyword: 'theme', type: 'keyword' });
      acceptor({ node, property: 'name', type: 'type' });
    }

    if (isTimelineDef(node)) {
      acceptor({ node, keyword: 'timeline', type: 'keyword' });
      acceptor({ node, property: 'name', type: 'type' });
    }

    if (isSceneDef(node)) {
      acceptor({ node, keyword: 'scene', type: 'keyword' });
      acceptor({ node, property: 'name', type: 'type' });
    }

    if (isPlotDef(node)) {
      acceptor({ node, keyword: 'plot', type: 'keyword' });
      acceptor({ node, property: 'name', type: 'type' });
    }

    if (isInteractionDef(node)) {
      acceptor({ node, keyword: 'interaction', type: 'keyword' });
      acceptor({ node, property: 'name', type: 'type' });
    }

    if (isGenerateBlock(node)) {
      acceptor({ node, keyword: 'generate', type: 'keyword' });
    }

    // ── Property keyword highlighting ────────────────────────────

    if (isNatureProp(node)) {
      acceptor({ node, keyword: 'nature', type: 'keyword' });
    }
    if (isBioProp(node)) {
      acceptor({ node, keyword: 'bio', type: 'keyword' });
    }
    if (isRoleProp(node)) {
      acceptor({ node, keyword: 'role', type: 'keyword' });
    }
    if (isPersonalityProp(node)) {
      acceptor({ node, keyword: 'personality', type: 'keyword' });
    }
    if (isVoiceProp(node)) {
      acceptor({ node, keyword: 'voice', type: 'keyword' });
    }
    if (isGoalsProp(node)) {
      acceptor({ node, keyword: 'goals', type: 'keyword' });
    }
    if (isConflictsProp(node)) {
      acceptor({ node, keyword: 'conflicts', type: 'keyword' });
    }
    if (isRelationshipsProp(node)) {
      acceptor({ node, keyword: 'relationships', type: 'keyword' });
    }
    if (isArcProp(node)) {
      acceptor({ node, keyword: 'arc', type: 'keyword' });
    }
    if (isSecretProp(node)) {
      acceptor({ node, keyword: 'secret', type: 'keyword' });
    }
    if (isLocationBlock(node)) {
      acceptor({ node, keyword: 'locations', type: 'keyword' });
    }
    if (isRuleBlock(node)) {
      acceptor({ node, keyword: 'rules', type: 'keyword' });
    }

    // ── Trait/mood and style mix highlighting ─────────────────────

    if (isPersonalityTrait(node) || isMoodEntry(node)) {
      acceptor({ node, property: 'name', type: 'property' });
    }

    if (isStyleMixEntry(node) && node.character) {
      acceptor({ node, property: 'character', type: 'variable' });
    }
  }
}
