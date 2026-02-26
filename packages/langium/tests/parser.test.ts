import { describe, it, expect, beforeAll } from 'vitest';
import { parseHelper } from 'langium/test';
import type { LangiumDocument } from 'langium';
import { createActOneServices } from '../src/services/actone-module.js';
import type { Story } from '../src/generated/ast.js';
import {
  isCharacterDef,
  isWorldDef,
  isThemeDef,
  isTimelineDef,
  isSceneDef,
  isPlotDef,
  isInteractionDef,
  isGenerateBlock,
} from '../src/generated/ast.js';
import fs from 'node:fs';
import path from 'node:path';

const services = createActOneServices();
const parse = parseHelper<Story>(services.ActOne);

const fixturesDir = new URL('./fixtures/', import.meta.url);
const minimalText = fs.readFileSync(
  new URL('minimal.actone', fixturesDir),
  'utf-8',
);
const fullStoryText = fs.readFileSync(
  new URL('full-story.actone', fixturesDir),
  'utf-8',
);

describe('parser acceptance', () => {
  let minimalDoc: LangiumDocument<Story>;
  let fullDoc: LangiumDocument<Story>;

  beforeAll(async () => {
    minimalDoc = await parse(minimalText);
    fullDoc = await parse(fullStoryText);
  });

  it('parses minimal.actone with zero errors', () => {
    expect(minimalDoc.parseResult.parserErrors).toHaveLength(0);
  });

  it('parses full-story.actone with zero errors', () => {
    expect(fullDoc.parseResult.parserErrors).toHaveLength(0);
  });

  it('extracts story name correctly', () => {
    expect(minimalDoc.parseResult.value.name).toBe('The Morning Light');
    expect(fullDoc.parseResult.value.name).toBe('The Convergence');
  });

  it('parses all 8 element types from full-story', () => {
    const elements = fullDoc.parseResult.value.elements;
    expect(elements.some(isCharacterDef)).toBe(true);
    expect(elements.some(isWorldDef)).toBe(true);
    expect(elements.some(isThemeDef)).toBe(true);
    expect(elements.some(isTimelineDef)).toBe(true);
    expect(elements.some(isSceneDef)).toBe(true);
    expect(elements.some(isPlotDef)).toBe(true);
    expect(elements.some(isInteractionDef)).toBe(true);
    expect(elements.some(isGenerateBlock)).toBe(true);
  });

  it('parses character properties correctly', () => {
    const story = fullDoc.parseResult.value;
    const chars = story.elements.filter(isCharacterDef);
    const mira = chars.find((c) => c.name === 'Mira')!;
    expect(mira).toBeDefined();

    // nature
    const natureProp = mira.properties.find((p) => p.$type === 'NatureProp');
    expect(natureProp).toBeDefined();

    // bio
    const bioProp = mira.properties.find((p) => p.$type === 'BioProp');
    expect(bioProp).toBeDefined();
    expect((bioProp as { value: string }).value).toContain(
      'quantum physicist',
    );

    // role
    const roleProp = mira.properties.find((p) => p.$type === 'RoleProp');
    expect(roleProp).toBeDefined();

    // voice
    const voiceProp = mira.properties.find((p) => p.$type === 'VoiceProp');
    expect(voiceProp).toBeDefined();

    // personality
    const personalityProp = mira.properties.find(
      (p) => p.$type === 'PersonalityProp',
    );
    expect(personalityProp).toBeDefined();
    expect(
      (personalityProp as { traits: unknown[] }).traits.length,
    ).toBeGreaterThanOrEqual(1);

    // quirks
    const quirksProp = mira.properties.find((p) => p.$type === 'QuirksProp');
    expect(quirksProp).toBeDefined();
    expect(
      (quirksProp as { quirks: string[] }).quirks.length,
    ).toBeGreaterThanOrEqual(1);

    // goals
    const goalsProp = mira.properties.find((p) => p.$type === 'GoalsProp');
    expect(goalsProp).toBeDefined();
    expect(
      (goalsProp as { goals: unknown[] }).goals.length,
    ).toBeGreaterThanOrEqual(1);

    // conflicts
    const conflictsProp = mira.properties.find(
      (p) => p.$type === 'ConflictsProp',
    );
    expect(conflictsProp).toBeDefined();
    expect(
      (conflictsProp as { conflicts: string[] }).conflicts.length,
    ).toBeGreaterThanOrEqual(1);

    // strengths
    const strengthsProp = mira.properties.find(
      (p) => p.$type === 'StrengthsProp',
    );
    expect(strengthsProp).toBeDefined();
    expect(
      (strengthsProp as { strengths: string[] }).strengths.length,
    ).toBeGreaterThanOrEqual(1);

    // flaws
    const flawsProp = mira.properties.find((p) => p.$type === 'FlawsProp');
    expect(flawsProp).toBeDefined();
    expect(
      (flawsProp as { flaws: string[] }).flaws.length,
    ).toBeGreaterThanOrEqual(1);

    // relationships
    const relProp = mira.properties.find(
      (p) => p.$type === 'RelationshipsProp',
    );
    expect(relProp).toBeDefined();
    expect(
      (relProp as { relationships: unknown[] }).relationships.length,
    ).toBeGreaterThanOrEqual(1);

    // arc
    const arcProp = mira.properties.find((p) => p.$type === 'ArcProp');
    expect(arcProp).toBeDefined();
    expect(
      (arcProp as { properties: unknown[] }).properties.length,
    ).toBeGreaterThanOrEqual(1);

    // symbols
    const symbolsProp = mira.properties.find(
      (p) => p.$type === 'SymbolsProp',
    );
    expect(symbolsProp).toBeDefined();
    expect(
      (symbolsProp as { symbols: string[] }).symbols.length,
    ).toBeGreaterThanOrEqual(1);

    // secret
    const secretProp = mira.properties.find((p) => p.$type === 'SecretProp');
    expect(secretProp).toBeDefined();
    expect((secretProp as { value: string }).value).toContain('timeline');

    // notes
    const notesProp = mira.properties.find((p) => p.$type === 'NotesProp');
    expect(notesProp).toBeDefined();
    expect(
      (notesProp as { notes: string[] }).notes.length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('parses world with locations and rules', () => {
    const story = fullDoc.parseResult.value;
    const worlds = story.elements.filter(isWorldDef);
    const quantumLab = worlds.find((w) => w.name === 'QuantumLab')!;
    expect(quantumLab).toBeDefined();

    // period
    const periodProp = quantumLab.properties.find(
      (p) => p.$type === 'WorldPeriodProp',
    );
    expect(periodProp).toBeDefined();
    expect((periodProp as { value: string }).value).toContain('2087');

    // sensory
    const sensoryProp = quantumLab.properties.find(
      (p) => p.$type === 'WorldSensoryProp',
    );
    expect(sensoryProp).toBeDefined();
    expect(
      (sensoryProp as { senses: string[] }).senses.length,
    ).toBeGreaterThanOrEqual(1);

    // locations
    const locationBlock = quantumLab.properties.find(
      (p) => p.$type === 'LocationBlock',
    );
    expect(locationBlock).toBeDefined();
    const locations = (locationBlock as { locations: unknown[] }).locations;
    expect(locations.length).toBeGreaterThanOrEqual(2);

    // Check Observatory has atmosphere and connects_to
    const observatory = (
      locations as Array<{ name: string; properties: Array<{ $type: string }> }>
    ).find((loc) => loc.name === 'Observatory')!;
    expect(observatory).toBeDefined();
    const atmosphereProp = observatory.properties.find(
      (p) => p.$type === 'LocAtmosphereProp',
    );
    expect(atmosphereProp).toBeDefined();
    const connectsProp = observatory.properties.find(
      (p) => p.$type === 'LocConnectsProp',
    );
    expect(connectsProp).toBeDefined();

    // rules
    const ruleBlock = quantumLab.properties.find(
      (p) => p.$type === 'RuleBlock',
    );
    expect(ruleBlock).toBeDefined();
    const rules = (ruleBlock as { rules: unknown[] }).rules;
    expect(rules.length).toBeGreaterThanOrEqual(2);

    // Verify rules have categories
    const firstRule = (
      rules as Array<{ properties: Array<{ $type: string }> }>
    )[0]!;
    const categoryProp = firstRule.properties.find(
      (p) => p.$type === 'RuleCategoryProp',
    );
    expect(categoryProp).toBeDefined();
  });

  it('parses timeline with layers', () => {
    const story = fullDoc.parseResult.value;
    const timelines = story.elements.filter(isTimelineDef);
    const timeline = timelines[0]!;
    expect(timeline).toBeDefined();

    // structure
    const structureProp = timeline.properties.find(
      (p) => p.$type === 'TimelineStructureProp',
    );
    expect(structureProp).toBeDefined();

    // span
    const spanProp = timeline.properties.find(
      (p) => p.$type === 'TimelineSpanProp',
    );
    expect(spanProp).toBeDefined();

    // layers
    const layersProp = timeline.properties.find(
      (p) => p.$type === 'TimelineLayersProp',
    );
    expect(layersProp).toBeDefined();
    const layers = (layersProp as { layers: unknown[] }).layers;
    expect(layers.length).toBeGreaterThanOrEqual(3);
  });

  it('parses plot with beats and subplots', () => {
    const story = fullDoc.parseResult.value;
    const plots = story.elements.filter(isPlotDef);
    const mainArc = plots.find((p) => p.name === 'MainArc')!;
    expect(mainArc).toBeDefined();

    // beats
    const beatsProp = mainArc.properties.find(
      (p) => p.$type === 'PlotBeatsProp',
    );
    expect(beatsProp).toBeDefined();
    const beats = (beatsProp as { beats: Array<{ properties: Array<{ $type: string }> }> }).beats;
    expect(beats.length).toBeGreaterThanOrEqual(1);

    // Verify beats have act and type properties
    const firstBeat = beats[0]!;
    const actProp = firstBeat.properties.find(
      (p) => p.$type === 'BeatActProp',
    );
    expect(actProp).toBeDefined();
    const typeProp = firstBeat.properties.find(
      (p) => p.$type === 'BeatTypeProp',
    );
    expect(typeProp).toBeDefined();

    // subplot
    const subplotProp = mainArc.properties.find(
      (p) => p.$type === 'PlotSubplotProp',
    );
    expect(subplotProp).toBeDefined();

    // subplot has converges_at
    const subplot = subplotProp as {
      name: string;
      properties: Array<{ $type: string }>;
    };
    const convergesProp = subplot.properties.find(
      (p) => p.$type === 'SubplotConvergesProp',
    );
    expect(convergesProp).toBeDefined();
  });

  it('parses interaction with style_mix and subtext', () => {
    const story = fullDoc.parseResult.value;
    const interactions = story.elements.filter(isInteractionDef);
    const reunion = interactions.find(
      (i) => i.name === 'MiraKaelReunion',
    )!;
    expect(reunion).toBeDefined();

    // style_mix
    const styleMixProp = reunion.properties.find(
      (p) => p.$type === 'InteractionStyleMixProp',
    );
    expect(styleMixProp).toBeDefined();
    const entries = (styleMixProp as { entries: unknown[] }).entries;
    expect(entries.length).toBeGreaterThanOrEqual(2);

    // subtext
    const subtextProp = reunion.properties.find(
      (p) => p.$type === 'InteractionSubtextProp',
    );
    expect(subtextProp).toBeDefined();
    expect((subtextProp as { value: string }).value).toContain('testing');

    // power_dynamic
    const powerProp = reunion.properties.find(
      (p) => p.$type === 'InteractionPowerProp',
    );
    expect(powerProp).toBeDefined();

    // emotional_arc
    const emotionalArcProp = reunion.properties.find(
      (p) => p.$type === 'InteractionEmotionalArcProp',
    );
    expect(emotionalArcProp).toBeDefined();
  });

  it('parses generate block with all settings', () => {
    const story = fullDoc.parseResult.value;
    const generateBlocks = story.elements.filter(isGenerateBlock);
    const gen = generateBlocks[0]!;
    expect(gen).toBeDefined();

    // temperature
    const tempSetting = gen.settings.find(
      (s) => s.$type === 'TemperatureSetting',
    );
    expect(tempSetting).toBeDefined();
    expect((tempSetting as { value: number }).value).toBe(0.8);

    // max_tokens
    const maxTokensSetting = gen.settings.find(
      (s) => s.$type === 'MaxTokensSetting',
    );
    expect(maxTokensSetting).toBeDefined();
    expect((maxTokensSetting as { value: number }).value).toBe(4000);

    // continuity_loss
    const contLossSetting = gen.settings.find(
      (s) => s.$type === 'ContinuityLossSetting',
    );
    expect(contLossSetting).toBeDefined();
    expect((contLossSetting as { value: number }).value).toBe(0.1);

    // genre
    const genreSetting = gen.settings.find((s) => s.$type === 'GenreSetting');
    expect(genreSetting).toBeDefined();
    expect((genreSetting as { value: string }).value).toContain(
      'literary science fiction',
    );

    // tone
    const toneSetting = gen.settings.find((s) => s.$type === 'ToneSetting');
    expect(toneSetting).toBeDefined();
    expect(
      (toneSetting as { values: string[] }).values.length,
    ).toBeGreaterThanOrEqual(3);

    // tense
    const tenseSetting = gen.settings.find((s) => s.$type === 'TenseSetting');
    expect(tenseSetting).toBeDefined();

    // default_pov
    const povSetting = gen.settings.find(
      (s) => s.$type === 'DefaultPovSetting',
    );
    expect(povSetting).toBeDefined();

    // pacing
    const pacingSetting = gen.settings.find(
      (s) => s.$type === 'PacingSetting',
    );
    expect(pacingSetting).toBeDefined();

    // chapter_breaks
    const chapterSetting = gen.settings.find(
      (s) => s.$type === 'ChapterBreaksSetting',
    );
    expect(chapterSetting).toBeDefined();
  });
});

describe('parser rejection', () => {
  it('produces errors on syntactically invalid input', async () => {
    const doc = await parse('story {');
    expect(doc.parseResult.parserErrors.length).toBeGreaterThan(0);
  });

  it('produces errors on missing closing brace', async () => {
    const doc = await parse('story "Test" { character Foo {');
    expect(doc.parseResult.parserErrors.length).toBeGreaterThan(0);
  });

  it('error positions are meaningful', async () => {
    const doc = await parse('story {');
    const errors = doc.parseResult.parserErrors;
    expect(errors.length).toBeGreaterThan(0);
    const firstError = errors[0]!;
    // Chevrotain parser errors include offset, line, and column in the token
    expect(
      firstError.token.startLine !== undefined ||
        firstError.token.startOffset !== undefined,
    ).toBe(true);
  });
});
