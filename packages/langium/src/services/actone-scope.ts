import type {
  AstNode,
  AstNodeDescription,
  ReferenceInfo,
  Scope,
} from 'langium';
import { DefaultScopeProvider, MapScope, EMPTY_SCOPE } from 'langium';
import {
  isStory,
  isWorldDef,
  isTimelineDef,
  type Story,
} from '../generated/ast.js';

/**
 * Composition mode for multi-file projects.
 * Set externally by the worker when a project is opened.
 */
export type CompositionMode = 'merge' | 'overlay' | 'sequential';

/**
 * Custom scope provider for ActOne DSL.
 *
 * Handles cross-reference resolution:
 *  - Character references (participants, pov, relationships, style_mix)
 *  - Location references (scene location, connects_to)
 *  - Timeline layer references (scene layer)
 *
 * In single-file mode, scopes from the current file's Story node.
 * In multi-file mode, uses composition mode to resolve across files:
 *  - merge: all files contribute to one namespace (duplicates = error)
 *  - overlay: last-defined wins (by file priority)
 *  - sequential: per-file namespaces only (no cross-file resolution)
 */
export class ActOneScopeProvider extends DefaultScopeProvider {
  /** Current composition mode (set by worker on project open) */
  compositionMode: CompositionMode = 'merge';

  /** File priority ordering for overlay mode (URI → priority) */
  filePriorities: Map<string, number> = new Map();

  override getScope(context: ReferenceInfo): Scope {
    const referenceType = this.reflection.getReferenceType(context);

    if (referenceType === 'CharacterDef') {
      return this.getCharacterScope(context.container);
    }

    if (referenceType === 'LocationEntry') {
      return this.getLocationScope(context.container);
    }

    if (referenceType === 'TimelineLayer') {
      return this.getTimelineLayerScope(context.container);
    }

    return super.getScope(context);
  }

  /**
   * Collect all stories visible from the given node's context.
   * In merge/overlay mode, uses the global index to find all CharacterDef/etc.
   * across all documents. In sequential mode, only the local file.
   */
  private collectStories(node: AstNode): Story[] {
    const currentStory = this.findStory(node);

    if (this.compositionMode === 'sequential') {
      return currentStory ? [currentStory] : [];
    }

    // Multi-file: use indexManager to find all exported descriptions
    // across workspace documents. For now, we collect Story roots.
    const stories: Story[] = [];
    const allDescriptions = this.indexManager.allElements('Story');
    for (const desc of allDescriptions) {
      const docNode = desc.node;
      if (docNode && isStory(docNode)) {
        stories.push(docNode);
      }
    }

    // For overlay mode, sort by file priority (lower priority first, higher wins)
    if (this.compositionMode === 'overlay' && stories.length > 1) {
      stories.sort((a, b) => {
        const uriA = a.$document?.uri?.toString() ?? '';
        const uriB = b.$document?.uri?.toString() ?? '';
        const prioA = this.filePriorities.get(uriA) ?? 0;
        const prioB = this.filePriorities.get(uriB) ?? 0;
        return prioA - prioB;
      });
    }

    // Fallback to current story if index is empty
    return stories.length > 0 ? stories : (currentStory ? [currentStory] : []);
  }

  private getCharacterScope(node: AstNode): Scope {
    const stories = this.collectStories(node);
    if (stories.length === 0) return EMPTY_SCOPE;

    const descriptions: AstNodeDescription[] = [];
    const seen = new Map<string, AstNodeDescription>();

    for (const story of stories) {
      for (const element of story.elements) {
        if (element.$type === 'CharacterDef') {
          const desc = this.descriptions.createDescription(element, element.name);
          if (this.compositionMode === 'overlay') {
            seen.set(element.name, desc); // last wins
          } else {
            descriptions.push(desc);
          }
        }
      }
    }

    if (this.compositionMode === 'overlay') {
      return new MapScope(Array.from(seen.values()));
    }
    return new MapScope(descriptions);
  }

  private getLocationScope(node: AstNode): Scope {
    const stories = this.collectStories(node);
    if (stories.length === 0) return EMPTY_SCOPE;

    const descriptions: AstNodeDescription[] = [];
    const seen = new Map<string, AstNodeDescription>();

    for (const story of stories) {
      for (const element of story.elements) {
        if (isWorldDef(element)) {
          for (const prop of element.properties) {
            if (prop.$type === 'LocationBlock') {
              for (const loc of prop.locations) {
                const desc = this.descriptions.createDescription(loc, loc.name);
                if (this.compositionMode === 'overlay') {
                  seen.set(loc.name, desc);
                } else {
                  descriptions.push(desc);
                }
              }
            }
          }
        }
      }
    }

    if (this.compositionMode === 'overlay') {
      return new MapScope(Array.from(seen.values()));
    }
    return new MapScope(descriptions);
  }

  private getTimelineLayerScope(node: AstNode): Scope {
    const stories = this.collectStories(node);
    if (stories.length === 0) return EMPTY_SCOPE;

    const descriptions: AstNodeDescription[] = [];
    const seen = new Map<string, AstNodeDescription>();

    for (const story of stories) {
      for (const element of story.elements) {
        if (isTimelineDef(element)) {
          for (const prop of element.properties) {
            if (prop.$type === 'TimelineLayersProp') {
              for (const layer of prop.layers) {
                const desc = this.descriptions.createDescription(layer, layer.name);
                if (this.compositionMode === 'overlay') {
                  seen.set(layer.name, desc);
                } else {
                  descriptions.push(desc);
                }
              }
            }
          }
        }
      }
    }

    if (this.compositionMode === 'overlay') {
      return new MapScope(Array.from(seen.values()));
    }
    return new MapScope(descriptions);
  }

  private findStory(node: AstNode): Story | undefined {
    let current: AstNode | undefined = node;
    while (current) {
      if (isStory(current)) return current;
      current = current.$container;
    }
    return undefined;
  }
}
