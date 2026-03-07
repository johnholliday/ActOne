import type { AstNode, MaybePromise } from 'langium';
import { AstNodeHoverProvider } from 'langium/lsp';
import {
  isCharacterDef,
  isSceneDef,
  isThemeDef,
  isWorldDef,
  isTimelineDef,
  isPlotDef,
  isInteractionDef,
  isGenerateBlock,
  type CharacterDef,
  type SceneDef,
  type ThemeDef,
  type WorldDef,
  type TimelineDef,
  type PlotDef,
  type InteractionDef,
} from '../generated/ast.js';

/**
 * Rich hover tooltips for ActOne DSL elements.
 */
export class ActOneHoverProvider extends AstNodeHoverProvider {
  protected override getAstNodeHoverContent(
    node: AstNode,
  ): MaybePromise<string | undefined> {
    if (isCharacterDef(node)) return this.hoverCharacter(node);
    if (isSceneDef(node)) return this.hoverScene(node);
    if (isThemeDef(node)) return this.hoverTheme(node);
    if (isWorldDef(node)) return this.hoverWorld(node);
    if (isTimelineDef(node)) return this.hoverTimeline(node);
    if (isPlotDef(node)) return this.hoverPlot(node);
    if (isInteractionDef(node)) return this.hoverInteraction(node);
    if (isGenerateBlock(node)) return '**generate** — AI generation settings';
    return undefined;
  }

  private hoverCharacter(char: CharacterDef): string {
    const parts: string[] = [`**character** \`${char.name}\``];

    for (const prop of char.properties) {
      switch (prop.$type) {
        case 'NatureProp':
          parts.push(`Nature: ${prop.value}`);
          break;
        case 'BioProp':
          parts.push(`Bio: ${prop.value}`);
          break;
        case 'RoleProp':
          parts.push(`Role: ${prop.value}`);
          break;
        case 'PersonalityProp': {
          const top3 = prop.traits
            .slice()
            .sort((a, b) => b.value - a.value)
            .slice(0, 3)
            .map((t) => `${t.name}: ${t.value}`)
            .join(', ');
          if (top3) parts.push(`Top traits: ${top3}`);
          break;
        }
        case 'ArcProp': {
          const desc = prop.properties.find(
            (p) => p.$type === 'ArcDescriptionProp',
          );
          if (desc) parts.push(`Arc: ${desc.value}`);
          break;
        }
        case 'RelationshipsProp':
          parts.push(`Relationships: ${prop.relationships.length}`);
          break;
      }
    }

    return parts.join('\n\n');
  }

  private hoverScene(scene: SceneDef): string {
    const parts: string[] = [`**scene** \`${scene.name}\``];

    for (const prop of scene.properties) {
      switch (prop.$type) {
        case 'SceneTypeProp':
          parts.push(`Type: ${prop.value}`);
          break;
        case 'SceneParticipantsProp':
          parts.push(
            `Participants: ${prop.participants.map((p) => p.$refText).join(', ')}`,
          );
          break;
        case 'SceneLocationProp':
          parts.push(
            `Location: ${prop.location?.location?.$refText ?? 'unknown'}`,
          );
          break;
        case 'SceneObjectiveProp':
          parts.push(`Objective: ${prop.value}`);
          break;
      }
    }

    return parts.join('\n\n');
  }

  private hoverTheme(theme: ThemeDef): string {
    const parts: string[] = [`**theme** \`${theme.name}\``];

    for (const prop of theme.properties) {
      switch (prop.$type) {
        case 'ThemeStatementProp':
          parts.push(`Statement: ${prop.value}`);
          break;
        case 'ThemeTensionProp':
          parts.push(`Tension: ${prop.value}`);
          break;
        case 'ThemeMotifsProp':
          parts.push(`Motifs: ${prop.motifs.join(', ')}`);
          break;
        case 'ThemeCounterProp':
          parts.push(`Counter: ${prop.value}`);
          break;
      }
    }

    return parts.join('\n\n');
  }

  private hoverWorld(world: WorldDef): string {
    const parts: string[] = [`**world** \`${world.name}\``];

    let locationCount = 0;
    let ruleCount = 0;

    for (const prop of world.properties) {
      switch (prop.$type) {
        case 'WorldPeriodProp':
          parts.push(`Period: ${prop.value}`);
          break;
        case 'LocationBlock':
          locationCount = prop.locations.length;
          break;
        case 'RuleBlock':
          ruleCount = prop.rules.length;
          break;
      }
    }

    if (locationCount) parts.push(`Locations: ${locationCount}`);
    if (ruleCount) parts.push(`Rules: ${ruleCount}`);

    return parts.join('\n\n');
  }

  private hoverTimeline(timeline: TimelineDef): string {
    const parts: string[] = [`**timeline** \`${timeline.name}\``];

    for (const prop of timeline.properties) {
      switch (prop.$type) {
        case 'TimelineStructureProp':
          parts.push(`Structure: ${prop.value}`);
          break;
        case 'TimelineSpanProp':
          parts.push(`Span: ${prop.value}`);
          break;
        case 'TimelineLayersProp':
          parts.push(`Layers: ${prop.layers.length}`);
          break;
      }
    }

    return parts.join('\n\n');
  }

  private hoverPlot(plot: PlotDef): string {
    const parts: string[] = [`**plot** \`${plot.name}\``];

    for (const prop of plot.properties) {
      switch (prop.$type) {
        case 'PlotConflictTypeProp':
          parts.push(`Conflict: ${prop.value}`);
          break;
        case 'PlotResolutionProp':
          parts.push(`Resolution: ${prop.value}`);
          break;
        case 'PlotBeatsProp':
          parts.push(`Beats: ${prop.beats.length}`);
          break;
      }
    }

    return parts.join('\n\n');
  }

  private hoverInteraction(interaction: InteractionDef): string {
    const parts: string[] = [`**interaction** \`${interaction.name}\``];

    for (const prop of interaction.properties) {
      switch (prop.$type) {
        case 'InteractionParticipantsProp':
          parts.push(
            `Participants: ${prop.participants.map((p) => p.$refText).join(', ')}`,
          );
          break;
        case 'InteractionPatternProp':
          parts.push(`Pattern: ${prop.value}`);
          break;
        case 'InteractionSubtextProp':
          parts.push(`Subtext: ${prop.value}`);
          break;
      }
    }

    return parts.join('\n\n');
  }
}
