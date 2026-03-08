import type {
  AstNode,
  AstNodeDescription,
  LangiumCoreServices,
  LangiumDocuments,
  ReferenceInfo,
  Scope,
} from 'langium';
import { DefaultScopeProvider, MapScope, EMPTY_SCOPE } from 'langium';
import {
  isDocument,
  isWorldDef,
  isSceneDef,
  isTimelineDef,
  type Document,
  type StoryElement,
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
 * In single-file mode, scopes from the current file's Document node.
 * In multi-file mode, uses composition mode to resolve across files:
 *  - merge: all files contribute to one namespace (duplicates = error)
 *  - overlay: last-defined wins (by file priority)
 *  - sequential: per-file namespaces only (no cross-file resolution)
 *
 * Collects elements from both Document.story.elements and Document.elements,
 * enabling standalone component definitions outside a `story` block.
 */
export class ActOneScopeProvider extends DefaultScopeProvider {
  /** Access to all workspace documents for cross-file resolution */
  private readonly langiumDocuments: LangiumDocuments;

  /** Current composition mode (set by worker on project open) */
  compositionMode: CompositionMode = 'merge';

  /** File priority ordering for overlay mode (URI → priority) */
  filePriorities: Map<string, number> = new Map();

  constructor(services: LangiumCoreServices) {
    super(services);
    this.langiumDocuments = services.shared.workspace.LangiumDocuments;
  }

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

    if (referenceType === 'WorldDef') {
      return this.getWorldScope(context.container);
    }

    if (referenceType === 'SceneDef') {
      return this.getSceneScope(context.container);
    }

    return super.getScope(context);
  }

  /**
   * Collect all StoryElement nodes visible from the given node's context.
   * Traverses both Document.story.elements and Document.elements for each document.
   * In merge/overlay mode, collects from all workspace documents.
   * In sequential mode, only the current file's document.
   */
  private collectDocumentElements(node: AstNode): StoryElement[] {
    const currentDoc = this.findDocument(node);

    if (this.compositionMode === 'sequential') {
      if (!currentDoc) return [];
      return [...(currentDoc.story?.elements ?? []), ...currentDoc.elements];
    }

    // Multi-file: iterate all workspace documents directly.
    // Note: Document nodes have no `name` property so they are never exported
    // to the index — indexManager.allElements('Document') returns nothing.
    // We must use LangiumDocuments.all to access cross-file Document roots.
    const documents: Document[] = [];
    for (const langDoc of this.langiumDocuments.all) {
      const root = langDoc.parseResult?.value;
      if (root && isDocument(root)) {
        documents.push(root);
      }
    }

    // Fallback to current document if workspace is empty
    if (documents.length === 0 && currentDoc) {
      documents.push(currentDoc);
    }

    // For overlay mode, sort by file priority (lower priority first, higher wins)
    if (this.compositionMode === 'overlay' && documents.length > 1) {
      documents.sort((a, b) => {
        const uriA = a.$document?.uri?.toString() ?? '';
        const uriB = b.$document?.uri?.toString() ?? '';
        const prioA = this.filePriorities.get(uriA) ?? 0;
        const prioB = this.filePriorities.get(uriB) ?? 0;
        return prioA - prioB;
      });
    }

    // Flatten all elements from all documents (story.elements + standalone elements)
    const allElements: StoryElement[] = [];
    for (const doc of documents) {
      if (doc.story) {
        allElements.push(...doc.story.elements);
      }
      allElements.push(...doc.elements);
    }
    return allElements;
  }

  private getCharacterScope(node: AstNode): Scope {
    const elements = this.collectDocumentElements(node);
    if (elements.length === 0) return EMPTY_SCOPE;

    const descriptions: AstNodeDescription[] = [];
    const seen = new Map<string, AstNodeDescription>();

    for (const element of elements) {
      if (element.$type === 'CharacterDef') {
        const desc = this.descriptions.createDescription(element, element.name);
        if (this.compositionMode === 'overlay') {
          seen.set(element.name, desc); // last wins
        } else {
          descriptions.push(desc);
        }
      }
    }

    if (this.compositionMode === 'overlay') {
      return new MapScope(Array.from(seen.values()));
    }
    return new MapScope(descriptions);
  }

  private getLocationScope(node: AstNode): Scope {
    const elements = this.collectDocumentElements(node);
    if (elements.length === 0) return EMPTY_SCOPE;

    const descriptions: AstNodeDescription[] = [];
    const seen = new Map<string, AstNodeDescription>();

    for (const element of elements) {
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

    if (this.compositionMode === 'overlay') {
      return new MapScope(Array.from(seen.values()));
    }
    return new MapScope(descriptions);
  }

  private getTimelineLayerScope(node: AstNode): Scope {
    const elements = this.collectDocumentElements(node);
    if (elements.length === 0) return EMPTY_SCOPE;

    const descriptions: AstNodeDescription[] = [];
    const seen = new Map<string, AstNodeDescription>();

    for (const element of elements) {
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

    if (this.compositionMode === 'overlay') {
      return new MapScope(Array.from(seen.values()));
    }
    return new MapScope(descriptions);
  }

  private getWorldScope(node: AstNode): Scope {
    const elements = this.collectDocumentElements(node);
    if (elements.length === 0) return EMPTY_SCOPE;

    const descriptions: AstNodeDescription[] = [];
    const seen = new Map<string, AstNodeDescription>();

    for (const element of elements) {
      if (isWorldDef(element)) {
        const desc = this.descriptions.createDescription(element, element.name);
        if (this.compositionMode === 'overlay') {
          seen.set(element.name, desc); // last wins
        } else {
          descriptions.push(desc);
        }
      }
    }

    if (this.compositionMode === 'overlay') {
      return new MapScope(Array.from(seen.values()));
    }
    return new MapScope(descriptions);
  }

  private getSceneScope(node: AstNode): Scope {
    const elements = this.collectDocumentElements(node);
    if (elements.length === 0) return EMPTY_SCOPE;

    const descriptions: AstNodeDescription[] = [];
    const seen = new Map<string, AstNodeDescription>();

    for (const element of elements) {
      if (isSceneDef(element)) {
        const desc = this.descriptions.createDescription(element, element.name);
        if (this.compositionMode === 'overlay') {
          seen.set(element.name, desc); // last wins
        } else {
          descriptions.push(desc);
        }
      }
    }

    if (this.compositionMode === 'overlay') {
      return new MapScope(Array.from(seen.values()));
    }
    return new MapScope(descriptions);
  }

  /** Walk up the $container chain to find the Document root. */
  private findDocument(node: AstNode): Document | undefined {
    let current: AstNode | undefined = node;
    while (current) {
      if (isDocument(current)) return current;
      current = current.$container;
    }
    return undefined;
  }
}
