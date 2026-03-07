/**
 * T060 (part 2): Visitor pattern for traversing serialized ASTs.
 */

import type {
  SerializedStory,
  SerializedStoryElement,
  SerializedCharacterDef,
  SerializedWorldDef,
  SerializedThemeDef,
  SerializedTimelineDef,
  SerializedSceneDef,
  SerializedPlotDef,
  SerializedInteractionDef,
  SerializedGenerateBlock,
} from '@actone/shared';

export interface AstVisitor<T = void> {
  visitStory?(story: SerializedStory): T;
  visitCharacter?(character: SerializedCharacterDef): T;
  visitWorld?(world: SerializedWorldDef): T;
  visitTheme?(theme: SerializedThemeDef): T;
  visitTimeline?(timeline: SerializedTimelineDef): T;
  visitScene?(scene: SerializedSceneDef): T;
  visitPlot?(plot: SerializedPlotDef): T;
  visitInteraction?(interaction: SerializedInteractionDef): T;
  visitGenerateBlock?(block: SerializedGenerateBlock): T;
}

/**
 * Walk a serialized story AST, calling visitor methods for each element.
 */
export function walkStory<T>(story: SerializedStory, visitor: AstVisitor<T>): T[] {
  const results: T[] = [];

  const storyResult = visitor.visitStory?.(story);
  if (storyResult !== undefined) results.push(storyResult);

  for (const element of story.elements) {
    const result = visitElement(element, visitor);
    if (result !== undefined) results.push(result);
  }

  return results;
}

function visitElement<T>(element: SerializedStoryElement, visitor: AstVisitor<T>): T | undefined {
  switch (element.$type) {
    case 'CharacterDef':
      return visitor.visitCharacter?.(element);
    case 'WorldDef':
      return visitor.visitWorld?.(element);
    case 'ThemeDef':
      return visitor.visitTheme?.(element);
    case 'TimelineDef':
      return visitor.visitTimeline?.(element);
    case 'SceneDef':
      return visitor.visitScene?.(element);
    case 'PlotDef':
      return visitor.visitPlot?.(element);
    case 'InteractionDef':
      return visitor.visitInteraction?.(element);
    case 'GenerateBlock':
      return visitor.visitGenerateBlock?.(element);
    default:
      return undefined;
  }
}
