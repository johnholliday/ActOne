import type { AstNode, ValidationAcceptor, ValidationChecks, LangiumDocuments } from 'langium';
import type { ActOneAstType } from '../generated/ast.js';
import {
  isCharacterDef,
  isGenerateBlock,
  isDocument,
  isPersonalityTrait,
  isMoodEntry,
  isRelationshipEntry,
  isTemperatureSetting,
  isContinuityLossSetting,
  isStyleMixEntry,
  isMaxTokensSetting,
  type Document,
  type Story,
  type StoryElement,
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
    Document: validator.checkDocument,
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
  private readonly documents: LangiumDocuments;

  constructor(services: ActOneServices) {
    this.documents = services.shared.workspace.LangiumDocuments;
  }

  /** Cross-document validation for the Document root node */
  checkDocument(doc: Document, accept: ValidationAcceptor): void {
    // Collect all Document roots across the workspace
    const allDocs: Document[] = [];
    for (const langiumDoc of this.documents.all) {
      const root = langiumDoc.parseResult.value;
      if (isDocument(root)) {
        allDocs.push(root);
      }
    }

    // Only run cross-document checks on the first document to avoid duplicate errors
    const thisUri = doc.$document?.uri?.toString() ?? '';
    const firstUri = allDocs[0]?.$document?.uri?.toString() ?? '';
    if (thisUri !== firstUri) return;

    // (1) At most one `story` block across all documents
    const storyDocs: Array<{ doc: Document; uri: string }> = [];
    for (const d of allDocs) {
      if (d.story) {
        storyDocs.push({ doc: d, uri: d.$document?.uri?.toString() ?? 'unknown' });
      }
    }
    if (storyDocs.length > 1) {
      const locations = storyDocs.map((s) => s.uri).join(', ');
      for (const s of storyDocs) {
        if (s.doc.story) {
          accept(
            'error',
            `Only one story block is allowed across all files. Found ${storyDocs.length} story blocks in: ${locations}`,
            { node: s.doc.story, keyword: 'story' },
          );
        }
      }
    }

    // (2) At most one GenerateBlock across all documents
    const generateLocations: Array<{ element: StoryElement; uri: string }> = [];
    for (const d of allDocs) {
      const uri = d.$document?.uri?.toString() ?? 'unknown';
      const allElements = [...(d.story?.elements ?? []), ...d.elements];
      for (const el of allElements) {
        if (isGenerateBlock(el)) {
          generateLocations.push({ element: el, uri });
        }
      }
    }
    if (generateLocations.length > 1) {
      const locations = generateLocations.map((g) => g.uri).join(', ');
      for (const g of generateLocations) {
        accept(
          'error',
          `Only one generate block is allowed across all files. Found ${generateLocations.length} generate blocks in: ${locations}`,
          { node: g.element, keyword: 'generate' },
        );
      }
    }

    // (3) No duplicate named definitions of the same type across files
    const namedDefs = new Map<string, Array<{ name: string; uri: string; node: StoryElement }>>();
    for (const d of allDocs) {
      const uri = d.$document?.uri?.toString() ?? 'unknown';
      const allElements = [...(d.story?.elements ?? []), ...d.elements];
      for (const el of allElements) {
        if ('name' in el && typeof el.name === 'string' && el.name) {
          const key = `${el.$type}:${el.name}`;
          if (!namedDefs.has(key)) namedDefs.set(key, []);
          namedDefs.get(key)!.push({ name: el.name, uri, node: el });
        }
      }
    }
    for (const [, defs] of namedDefs) {
      if (defs.length > 1) {
        const locations = defs.map((d) => d.uri).join(', ');
        for (const d of defs) {
          accept(
            'error',
            `Duplicate definition '${d.name}' (${d.node.$type}). Also defined in: ${locations}`,
            { node: d.node, property: 'name' },
          );
        }
      }
    }
  }

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
