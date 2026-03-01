/**
 * AST Serializer — converts the Langium AST into the SerializedStory format
 * consumed by the main thread (diagram transformers, stores, etc.).
 *
 * Key transformations:
 * - Strips Langium internals ($container, $cstNode, $document)
 * - Resolves cross-references (langium.Reference<T>) to plain name strings
 * - Flattens property arrays into flat serialized objects
 */

import type { AstNode, Reference } from 'langium';
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
} from '@repo/shared';
import type {
  Story,
  StoryElement,
  CharacterDef,
  WorldDef,
  ThemeDef,
  TimelineDef,
  SceneDef,
  PlotDef,
  InteractionDef,
  GenerateBlock,
  GoalEntry,
  RelationshipEntry,
  LocationEntry,
  RuleEntry,
  PlotBeat,
  PlotSubplotProp,
  TimelineLayer,
  StyleMixEntry,
  ArcProp,
} from '../generated/ast.js';
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

/* ── Helpers ─────────────────────────────────────────────────────────── */

/** Resolve a Langium cross-reference to a name string. */
function resolveRef<T extends AstNode & { name?: string }>(
  ref: Reference<T> | undefined,
): string {
  if (!ref) return '';
  return ref.$refText ?? (ref.ref as T | undefined)?.name ?? '';
}

/** Find the first property of a given $type in an array. */
function findProp<T extends { readonly $type: string }>(
  props: ReadonlyArray<{ readonly $type: string }>,
  type: T['$type'],
): T | undefined {
  return props.find((p) => p.$type === type) as T | undefined;
}

/** Find all properties of a given $type in an array. */
function findAllProps<T extends { readonly $type: string }>(
  props: ReadonlyArray<{ readonly $type: string }>,
  type: T['$type'],
): T[] {
  return props.filter((p) => p.$type === type) as T[];
}

/** Strip surrounding quotes from a DefinitionName. */
function cleanName(name: string): string {
  if ((name.startsWith('"') && name.endsWith('"')) ||
      (name.startsWith("'") && name.endsWith("'"))) {
    return name.slice(1, -1);
  }
  return name;
}

/* ── Top-Level Serializer ────────────────────────────────────────────── */

export function serializeStory(story: Story): SerializedStory {
  return {
    name: cleanName(story.name),
    elements: story.elements.map(serializeElement),
  };
}

function serializeElement(el: StoryElement): SerializedStoryElement {
  if (isCharacterDef(el)) return serializeCharacter(el);
  if (isWorldDef(el)) return serializeWorld(el);
  if (isThemeDef(el)) return serializeTheme(el);
  if (isTimelineDef(el)) return serializeTimeline(el);
  if (isSceneDef(el)) return serializeScene(el);
  if (isPlotDef(el)) return serializePlot(el);
  if (isInteractionDef(el)) return serializeInteraction(el);
  if (isGenerateBlock(el)) return serializeGenerate(el);
  // Unreachable for valid ASTs, but TypeScript needs it
  throw new Error(`Unknown element type: ${(el as AstNode).$type}`);
}

/* ── Character ───────────────────────────────────────────────────────── */

import type {
  BioProp,
  NatureProp,
  RoleProp,
  VoiceProp,
  PersonalityProp,
  QuirksProp,
  GoalsProp,
  ConflictsProp,
  StrengthsProp,
  FlawsProp,
  RelationshipsProp,
  SymbolsProp,
  SecretProp,
  NotesProp,
  GoalDescProp,
  GoalPriorityProp,
  GoalStakesProp,
  RelWeightProp,
  RelLabelProp,
  RelHistoryProp,
  RelDynamicProp,
  ArcDescriptionProp,
  ArcStartProp,
  ArcEndProp,
  ArcCatalystProp,
  ArcMidpointProp,
  ArcTurningPointProp,
} from '../generated/ast.js';

function serializeCharacter(ch: CharacterDef): SerializedCharacterDef {
  const props = ch.properties;

  const natureProp = findProp<NatureProp>(props, 'NatureProp');
  const bioProp = findProp<BioProp>(props, 'BioProp');
  const roleProp = findProp<RoleProp>(props, 'RoleProp');
  const voiceProp = findProp<VoiceProp>(props, 'VoiceProp');
  const personalityProp = findProp<PersonalityProp>(props, 'PersonalityProp');
  const quirksProp = findProp<QuirksProp>(props, 'QuirksProp');
  const goalsProp = findProp<GoalsProp>(props, 'GoalsProp');
  const conflictsProp = findProp<ConflictsProp>(props, 'ConflictsProp');
  const strengthsProp = findProp<StrengthsProp>(props, 'StrengthsProp');
  const flawsProp = findProp<FlawsProp>(props, 'FlawsProp');
  const relsProp = findProp<RelationshipsProp>(props, 'RelationshipsProp');
  const arcProp = findProp<ArcProp>(props, 'ArcProp');
  const symbolsProp = findProp<SymbolsProp>(props, 'SymbolsProp');
  const secretProp = findProp<SecretProp>(props, 'SecretProp');
  const notesProp = findProp<NotesProp>(props, 'NotesProp');

  return {
    $type: 'CharacterDef',
    name: cleanName(ch.name),
    nature: natureProp?.value,
    bio: bioProp?.value,
    role: roleProp?.value,
    voice: voiceProp?.value,
    personality: personalityProp?.traits.map((t) => ({ name: t.name, value: t.value })) ?? [],
    quirks: quirksProp?.quirks ?? [],
    goals: goalsProp?.goals.map(serializeGoal) ?? [],
    conflicts: conflictsProp?.conflicts ?? [],
    strengths: strengthsProp?.strengths ?? [],
    flaws: flawsProp?.flaws ?? [],
    relationships: relsProp?.relationships.map(serializeRelationship) ?? [],
    arc: arcProp ? serializeArc(arcProp) : undefined,
    symbols: symbolsProp?.symbols ?? [],
    secret: secretProp?.value,
    notes: notesProp?.notes ?? [],
  };
}

function serializeGoal(goal: GoalEntry): SerializedCharacterDef['goals'][number] {
  const desc = findProp<GoalDescProp>(goal.properties, 'GoalDescProp');
  const priority = findProp<GoalPriorityProp>(goal.properties, 'GoalPriorityProp');
  const stakes = findProp<GoalStakesProp>(goal.properties, 'GoalStakesProp');
  return {
    goal: desc?.value ?? '',
    priority: priority?.value,
    stakes: stakes?.value,
  };
}

function serializeRelationship(rel: RelationshipEntry): SerializedCharacterDef['relationships'][number] {
  const weight = findProp<RelWeightProp>(rel.properties, 'RelWeightProp');
  const label = findProp<RelLabelProp>(rel.properties, 'RelLabelProp');
  const history = findProp<RelHistoryProp>(rel.properties, 'RelHistoryProp');
  const dynamic = findProp<RelDynamicProp>(rel.properties, 'RelDynamicProp');
  return {
    to: resolveRef(rel.target),
    weight: weight?.value,
    label: label?.value,
    history: history?.value,
    dynamic: dynamic ? dynamic.value === 'true' : undefined,
  };
}

function serializeArc(arc: ArcProp): SerializedCharacterDef['arc'] {
  const desc = findProp<ArcDescriptionProp>(arc.properties, 'ArcDescriptionProp');
  const start = findProp<ArcStartProp>(arc.properties, 'ArcStartProp');
  const end = findProp<ArcEndProp>(arc.properties, 'ArcEndProp');
  const catalyst = findProp<ArcCatalystProp>(arc.properties, 'ArcCatalystProp');
  const midpoint = findProp<ArcMidpointProp>(arc.properties, 'ArcMidpointProp');
  const turningPoint = findProp<ArcTurningPointProp>(arc.properties, 'ArcTurningPointProp');
  return {
    description: desc?.value,
    start: start?.value,
    end: end?.value,
    catalyst: catalyst?.value,
    midpoint: midpoint?.value,
    turningPoint: turningPoint?.value,
  };
}

/* ── World ───────────────────────────────────────────────────────────── */

import type {
  WorldPeriodProp,
  WorldSensoryProp,
  LocationBlock,
  RuleBlock,
  LocDescriptionProp,
  LocAtmosphereProp,
  LocConnectsProp,
  RuleTextProp,
  RuleCategoryProp,
} from '../generated/ast.js';

function serializeWorld(world: WorldDef): SerializedWorldDef {
  const props = world.properties;
  const periodProp = findProp<WorldPeriodProp>(props, 'WorldPeriodProp');
  const sensoryProp = findProp<WorldSensoryProp>(props, 'WorldSensoryProp');
  const locationBlocks = findAllProps<LocationBlock>(props, 'LocationBlock');
  const ruleBlocks = findAllProps<RuleBlock>(props, 'RuleBlock');

  const locations = locationBlocks.flatMap((b) => b.locations.map(serializeLocation));
  const rules = ruleBlocks.flatMap((b) => b.rules.map(serializeRule));

  return {
    $type: 'WorldDef',
    name: cleanName(world.name),
    period: periodProp?.value,
    sensory: sensoryProp?.senses ?? [],
    locations,
    rules,
  };
}

function serializeLocation(loc: LocationEntry): SerializedWorldDef['locations'][number] {
  const desc = findProp<LocDescriptionProp>(loc.properties, 'LocDescriptionProp');
  const atmos = findProp<LocAtmosphereProp>(loc.properties, 'LocAtmosphereProp');
  const connects = findProp<LocConnectsProp>(loc.properties, 'LocConnectsProp');
  return {
    name: cleanName(loc.name),
    description: desc?.value,
    atmosphere: atmos?.moods.map((m) => ({ name: m.name, value: m.value })) ?? [],
    connectsTo: connects?.connections.map((c) => resolveRef(c.location)) ?? [],
  };
}

function serializeRule(rule: RuleEntry): SerializedWorldDef['rules'][number] {
  const text = findProp<RuleTextProp>(rule.properties, 'RuleTextProp');
  const category = findProp<RuleCategoryProp>(rule.properties, 'RuleCategoryProp');
  return {
    rule: text?.value ?? '',
    category: category?.value,
  };
}

/* ── Theme ───────────────────────────────────────────────────────────── */

import type {
  ThemeStatementProp,
  ThemeMotifsProp,
  ThemeCounterProp,
  ThemeTensionProp,
} from '../generated/ast.js';

function serializeTheme(theme: ThemeDef): SerializedThemeDef {
  const props = theme.properties;
  const statement = findProp<ThemeStatementProp>(props, 'ThemeStatementProp');
  const motifs = findProp<ThemeMotifsProp>(props, 'ThemeMotifsProp');
  const counter = findProp<ThemeCounterProp>(props, 'ThemeCounterProp');
  const tension = findProp<ThemeTensionProp>(props, 'ThemeTensionProp');
  return {
    $type: 'ThemeDef',
    name: cleanName(theme.name),
    statement: statement?.value,
    motifs: motifs?.motifs ?? [],
    counter: counter?.value,
    tension: tension?.value,
  };
}

/* ── Timeline ────────────────────────────────────────────────────────── */

import type {
  TimelineStructureProp,
  TimelineSpanProp,
  TimelineLayersProp,
  LayerDescProp,
  LayerPeriodProp,
} from '../generated/ast.js';

function serializeTimeline(tl: TimelineDef): SerializedTimelineDef {
  const props = tl.properties;
  const structure = findProp<TimelineStructureProp>(props, 'TimelineStructureProp');
  const span = findProp<TimelineSpanProp>(props, 'TimelineSpanProp');
  const layersProp = findProp<TimelineLayersProp>(props, 'TimelineLayersProp');
  return {
    $type: 'TimelineDef',
    name: cleanName(tl.name),
    structure: structure?.value,
    span: span?.value,
    layers: layersProp?.layers.map(serializeTimelineLayer) ?? [],
  };
}

function serializeTimelineLayer(layer: TimelineLayer): SerializedTimelineDef['layers'][number] {
  const desc = findProp<LayerDescProp>(layer.properties, 'LayerDescProp');
  const period = findProp<LayerPeriodProp>(layer.properties, 'LayerPeriodProp');
  return {
    name: cleanName(layer.name),
    description: desc?.value,
    period: period?.value,
  };
}

/* ── Scene ────────────────────────────────────────────────────────────── */

import type {
  SceneTypeProp,
  SceneLocationProp,
  ScenePovProp,
  SceneLayerProp,
  SceneParticipantsProp,
  SceneAtmosphereProp,
  SceneObjectiveProp,
  SceneTriggerProp,
  SceneTransitionProp,
} from '../generated/ast.js';

function serializeScene(scene: SceneDef): SerializedSceneDef {
  const props = scene.properties;
  const typeProp = findProp<SceneTypeProp>(props, 'SceneTypeProp');
  const locationProp = findProp<SceneLocationProp>(props, 'SceneLocationProp');
  const povProp = findProp<ScenePovProp>(props, 'ScenePovProp');
  const layerProp = findProp<SceneLayerProp>(props, 'SceneLayerProp');
  const participantsProp = findProp<SceneParticipantsProp>(props, 'SceneParticipantsProp');
  const atmosProp = findProp<SceneAtmosphereProp>(props, 'SceneAtmosphereProp');
  const objectiveProp = findProp<SceneObjectiveProp>(props, 'SceneObjectiveProp');
  const triggerProp = findProp<SceneTriggerProp>(props, 'SceneTriggerProp');
  const transitionProp = findProp<SceneTransitionProp>(props, 'SceneTransitionProp');

  // Resolve POV — either a character reference or the "Omniscient" keyword
  let pov: string | undefined;
  if (povProp) {
    if (povProp.omniscient) {
      pov = 'Omniscient';
    } else if (povProp.character) {
      pov = resolveRef(povProp.character);
    }
  }

  return {
    $type: 'SceneDef',
    name: cleanName(scene.name),
    sceneType: typeProp?.value,
    location: locationProp ? resolveRef(locationProp.location.location) : undefined,
    pov,
    layer: layerProp ? resolveRef(layerProp.layer) : undefined,
    participants: participantsProp?.participants.map((p) => resolveRef(p)) ?? [],
    atmosphere: atmosProp?.moods.map((m) => ({ name: m.name, value: m.value })) ?? [],
    objective: objectiveProp?.value,
    trigger: triggerProp?.value,
    transition: transitionProp?.value,
  };
}

/* ── Plot ─────────────────────────────────────────────────────────────── */

import type {
  PlotConflictTypeProp,
  PlotResolutionProp,
  PlotBeatsProp,
  BeatDescProp,
  BeatActProp,
  BeatTypeProp,
  SubplotDescProp,
  SubplotBeatsProp,
  SubplotConvergesProp,
} from '../generated/ast.js';

function serializePlot(plot: PlotDef): SerializedPlotDef {
  const props = plot.properties;
  const conflictType = findProp<PlotConflictTypeProp>(props, 'PlotConflictTypeProp');
  const resolution = findProp<PlotResolutionProp>(props, 'PlotResolutionProp');
  const beatsProp = findProp<PlotBeatsProp>(props, 'PlotBeatsProp');
  const subplots = findAllProps<PlotSubplotProp>(props, 'PlotSubplotProp');

  return {
    $type: 'PlotDef',
    name: cleanName(plot.name),
    conflictType: conflictType?.value,
    resolutionPattern: resolution?.value,
    beats: beatsProp?.beats.map(serializeBeat) ?? [],
    subplots: subplots.map(serializeSubplot),
  };
}

function serializeBeat(beat: PlotBeat): SerializedPlotDef['beats'][number] {
  const desc = findProp<BeatDescProp>(beat.properties, 'BeatDescProp');
  const act = findProp<BeatActProp>(beat.properties, 'BeatActProp');
  const type = findProp<BeatTypeProp>(beat.properties, 'BeatTypeProp');
  return {
    beat: desc?.value ?? '',
    act: act?.value,
    type: type?.value,
  };
}

function serializeSubplot(subplot: PlotSubplotProp): SerializedPlotDef['subplots'][number] {
  const desc = findProp<SubplotDescProp>(subplot.properties, 'SubplotDescProp');
  const beats = findProp<SubplotBeatsProp>(subplot.properties, 'SubplotBeatsProp');
  const converges = findProp<SubplotConvergesProp>(subplot.properties, 'SubplotConvergesProp');
  return {
    name: cleanName(subplot.name),
    description: desc?.value,
    beats: beats?.beats ?? [],
    convergesAt: converges ? resolveRef(converges.scene) : undefined,
  };
}

/* ── Interaction ─────────────────────────────────────────────────────── */

import type {
  InteractionParticipantsProp,
  InteractionPatternProp,
  InteractionStyleMixProp,
  InteractionSubtextProp,
  InteractionPowerProp,
  InteractionEmotionalArcProp,
} from '../generated/ast.js';

function serializeInteraction(inter: InteractionDef): SerializedInteractionDef {
  const props = inter.properties;
  const participants = findProp<InteractionParticipantsProp>(props, 'InteractionParticipantsProp');
  const pattern = findProp<InteractionPatternProp>(props, 'InteractionPatternProp');
  const styleMix = findProp<InteractionStyleMixProp>(props, 'InteractionStyleMixProp');
  const subtext = findProp<InteractionSubtextProp>(props, 'InteractionSubtextProp');
  const power = findProp<InteractionPowerProp>(props, 'InteractionPowerProp');
  const emotionalArc = findProp<InteractionEmotionalArcProp>(props, 'InteractionEmotionalArcProp');

  const styleMixMap: Record<string, number> = {};
  if (styleMix) {
    for (const entry of styleMix.entries) {
      const charName = resolveRef(entry.character);
      if (charName) {
        styleMixMap[charName] = entry.value;
      }
    }
  }

  return {
    $type: 'InteractionDef',
    name: cleanName(inter.name),
    participants: participants?.participants.map((p) => resolveRef(p)) ?? [],
    pattern: pattern?.value,
    styleMix: styleMixMap,
    subtext: subtext?.value,
    powerDynamic: power?.value,
    emotionalArc: emotionalArc?.value,
  };
}

/* ── Generate Block ──────────────────────────────────────────────────── */

import type {
  TemperatureSetting,
  MaxTokensSetting,
  ContinuityLossSetting,
  StyleBleedSetting,
  GenreSetting,
  ToneSetting,
  TenseSetting,
  DefaultPovSetting,
  PacingSetting,
  ChapterBreaksSetting,
} from '../generated/ast.js';

function serializeGenerate(gen: GenerateBlock): SerializedGenerateBlock {
  const settings = gen.settings;
  const temp = findProp<TemperatureSetting>(settings, 'TemperatureSetting');
  const maxTokens = findProp<MaxTokensSetting>(settings, 'MaxTokensSetting');
  const continuityLoss = findProp<ContinuityLossSetting>(settings, 'ContinuityLossSetting');
  const styleBleed = findProp<StyleBleedSetting>(settings, 'StyleBleedSetting');
  const genre = findProp<GenreSetting>(settings, 'GenreSetting');
  const tone = findProp<ToneSetting>(settings, 'ToneSetting');
  const tense = findProp<TenseSetting>(settings, 'TenseSetting');
  const defaultPov = findProp<DefaultPovSetting>(settings, 'DefaultPovSetting');
  const pacing = findProp<PacingSetting>(settings, 'PacingSetting');
  const chapterBreaks = findProp<ChapterBreaksSetting>(settings, 'ChapterBreaksSetting');

  return {
    $type: 'GenerateBlock',
    temperature: temp?.value,
    maxTokens: maxTokens?.value,
    continuityLoss: continuityLoss?.value,
    styleBleed: styleBleed ? styleBleed.value === 'true' : undefined,
    genre: genre?.value,
    tone: tone?.values ?? [],
    tense: tense?.value,
    defaultPov: defaultPov?.value,
    pacing: pacing?.value,
    chapterBreaks: chapterBreaks ? chapterBreaks.value === 'true' : undefined,
  };
}
