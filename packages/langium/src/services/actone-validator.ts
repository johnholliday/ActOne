import type { AstNode, ValidationAcceptor, ValidationChecks } from 'langium';
import type { ActOneAstType } from '../generated/ast.js';
import {
  isCharacterDef,
  isGenerateBlock,
  isPersonalityTrait,
  isMoodEntry,
  isRelationshipEntry,
  isTemperatureSetting,
  isContinuityLossSetting,
  isStyleMixEntry,
  isMaxTokensSetting,
  type Story,
  type PersonalityTrait,
  type MoodEntry,
  type RelationshipEntry,
  type TemperatureSetting,
  type ContinuityLossSetting,
  type StyleMixEntry,
  type MaxTokensSetting,
  type GenerateBlock,
  type SceneDef,
  type CharacterDef,
} from '../generated/ast.js';
import type { ActOneServices } from './actone-module.js';

export function registerActOneValidationChecks(
  services: ActOneServices,
): void {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.ActOneValidator;

  const checks: ValidationChecks<ActOneAstType> = {
    Story: validator.checkStory,
    PersonalityTrait: validator.checkTraitRange,
    MoodEntry: validator.checkMoodRange,
    RelationshipEntry: validator.checkRelationshipEntry,
    TemperatureSetting: validator.checkTemperature,
    ContinuityLossSetting: validator.checkContinuityLoss,
    StyleMixEntry: validator.checkStyleMix,
    MaxTokensSetting: validator.checkMaxTokens,
    SceneDef: validator.checkSceneParticipants,
  };
  registry.register(checks, validator);
}

export class ActOneValidator {
  /** Only one GenerateBlock per story */
  checkStory(story: Story, accept: ValidationAcceptor): void {
    const generateBlocks = story.elements.filter(isGenerateBlock);
    if (generateBlocks.length > 1) {
      for (let i = 1; i < generateBlocks.length; i++) {
        accept(
          'error',
          'A story may contain at most one generate block.',
          { node: generateBlocks[i]!, keyword: 'generate' },
        );
      }
    }

    // Check for self-relationships
    const characters = story.elements.filter(isCharacterDef);
    for (const char of characters) {
      for (const prop of char.properties) {
        if (prop.$type === 'RelationshipsProp') {
          for (const rel of prop.relationships) {
            if (rel.target?.ref === char) {
              accept(
                'error',
                `Character '${char.name}' cannot have a relationship with itself.`,
                { node: rel, property: 'target' },
              );
            }
          }
        }
      }
    }
  }

  /** Personality trait values must be 0–100 */
  checkTraitRange(trait: PersonalityTrait, accept: ValidationAcceptor): void {
    if (trait.value < 0 || trait.value > 100) {
      accept(
        'error',
        `Personality trait value must be between 0 and 100, got ${trait.value}.`,
        { node: trait, property: 'value' },
      );
    }
  }

  /** Mood values must be 0–100 */
  checkMoodRange(mood: MoodEntry, accept: ValidationAcceptor): void {
    if (mood.value < 0 || mood.value > 100) {
      accept(
        'error',
        `Mood value must be between 0 and 100, got ${mood.value}.`,
        { node: mood, property: 'value' },
      );
    }
  }

  /** Relationship weight must be −100 to +100 */
  checkRelationshipEntry(
    rel: RelationshipEntry,
    accept: ValidationAcceptor,
  ): void {
    for (const prop of rel.properties) {
      if (prop.$type === 'RelWeightProp') {
        if (prop.value < -100 || prop.value > 100) {
          accept(
            'error',
            `Relationship weight must be between -100 and +100, got ${prop.value}.`,
            { node: prop, property: 'value' },
          );
        }
      }
    }
  }

  /** Temperature must be 0.0–2.0 */
  checkTemperature(
    setting: TemperatureSetting,
    accept: ValidationAcceptor,
  ): void {
    if (setting.value < 0.0 || setting.value > 2.0) {
      accept(
        'error',
        `Temperature must be between 0.0 and 2.0, got ${setting.value}.`,
        { node: setting, property: 'value' },
      );
    }
  }

  /** Continuity loss must be 0.0–1.0 */
  checkContinuityLoss(
    setting: ContinuityLossSetting,
    accept: ValidationAcceptor,
  ): void {
    if (setting.value < 0.0 || setting.value > 1.0) {
      accept(
        'error',
        `Continuity loss must be between 0.0 and 1.0, got ${setting.value}.`,
        { node: setting, property: 'value' },
      );
    }
  }

  /** Style mix values must be 0–100 */
  checkStyleMix(entry: StyleMixEntry, accept: ValidationAcceptor): void {
    if (entry.value < 0 || entry.value > 100) {
      accept(
        'error',
        `Style mix value must be between 0 and 100, got ${entry.value}.`,
        { node: entry, property: 'value' },
      );
    }
  }

  /** Max tokens must be positive */
  checkMaxTokens(
    setting: MaxTokensSetting,
    accept: ValidationAcceptor,
  ): void {
    if (setting.value < 1 || setting.value > 100_000) {
      accept(
        'error',
        `Max tokens must be between 1 and 100,000, got ${setting.value}.`,
        { node: setting, property: 'value' },
      );
    }
  }

  /** Scene participants must reference defined characters */
  checkSceneParticipants(
    scene: SceneDef,
    accept: ValidationAcceptor,
  ): void {
    for (const prop of scene.properties) {
      if (prop.$type === 'SceneParticipantsProp') {
        for (const participant of prop.participants) {
          if (!participant.ref) {
            accept(
              'error',
              'Scene participant must reference a defined character.',
              { node: prop, property: 'participants' },
            );
          }
        }
      }
    }
  }
}
