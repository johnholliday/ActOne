/**
 * T100: Analytics data extraction.
 *
 * Computes word count, scene count, character count, scene type distribution,
 * character screen time, and pacing rhythm from the serialized AST.
 */

import type {
  SerializedStory,
  SerializedCharacterDef,
  SerializedWorldDef,
  SerializedSceneDef,
  SerializedPlotDef,
  SerializedInteractionDef,
  SerializedThemeDef,
  SerializedTimelineDef,
} from '@actone/shared';
import {
  findCharacters,
  findScenes,
  findPlots,
  findWorlds,
  findThemes,
  findInteractions,
  findTimelines,
} from '$lib/ast/ast-utils.js';

export interface StoryAnalytics {
  wordCount: number;
  sceneCount: number;
  characterCount: number;
  worldCount: number;
  themeCount: number;
  plotCount: number;
  interactionCount: number;
  timelineCount: number;
  sceneTypeDistribution: Record<string, number>;
  characterScreenTime: Array<{ name: string; sceneCount: number; percentage: number }>;
  pacingRhythm: Array<{ sceneName: string; sceneType: string; color: string }>;
  relationshipMatrix: Array<{
    from: string;
    to: string;
    weight: number;
    label: string;
    dynamic: boolean;
  }>;
}

const SCENE_TYPE_COLORS: Record<string, string> = {
  Action: '#ef4444',
  Dialogue: '#3b82f6',
  Reflection: '#a855f7',
  Montage: '#f59e0b',
  Revelation: '#10b981',
  Confrontation: '#f97316',
  Transition: '#6b7280',
  Climax: '#dc2626',
};

/**
 * Count words in a string, ignoring empty segments.
 */
function countWordsInString(s: string | undefined | null): number {
  if (!s) return 0;
  return s.split(/\s+/).filter((w) => w.length > 0).length;
}

/**
 * Estimate the total word count across all textual content in the AST.
 * This counts words in bios, descriptions, objectives, rules, beat text,
 * and other narrative string properties across all elements.
 */
function estimateWordCount(
  characters: SerializedCharacterDef[],
  worlds: SerializedWorldDef[],
  scenes: SerializedSceneDef[],
  plots: SerializedPlotDef[],
  themes: SerializedThemeDef[],
  interactions: SerializedInteractionDef[],
  timelines: SerializedTimelineDef[],
): number {
  let total = 0;

  for (const c of characters) {
    total += countWordsInString(c.bio);
    total += countWordsInString(c.voice);
    total += countWordsInString(c.secret);
    for (const note of c.notes) total += countWordsInString(note);
    for (const goal of c.goals) {
      total += countWordsInString(goal.goal);
      total += countWordsInString(goal.stakes);
    }
    for (const conflict of c.conflicts) total += countWordsInString(conflict);
    for (const strength of c.strengths) total += countWordsInString(strength);
    for (const flaw of c.flaws) total += countWordsInString(flaw);
    for (const rel of c.relationships) {
      total += countWordsInString(rel.label);
      total += countWordsInString(rel.history);
    }
    if (c.arc) {
      total += countWordsInString(c.arc.description);
      total += countWordsInString(c.arc.start);
      total += countWordsInString(c.arc.end);
      total += countWordsInString(c.arc.catalyst);
      total += countWordsInString(c.arc.midpoint);
      total += countWordsInString(c.arc.turningPoint);
    }
    for (const sym of c.symbols) total += countWordsInString(sym);
    for (const quirk of c.quirks) total += countWordsInString(quirk);
  }

  for (const w of worlds) {
    total += countWordsInString(w.period);
    for (const s of w.sensory) total += countWordsInString(s);
    for (const loc of w.locations) {
      total += countWordsInString(loc.description);
    }
    for (const rule of w.rules) total += countWordsInString(rule.rule);
  }

  for (const s of scenes) {
    total += countWordsInString(s.objective);
    total += countWordsInString(s.trigger);
  }

  for (const p of plots) {
    for (const beat of p.beats) total += countWordsInString(beat.beat);
    for (const sub of p.subplots) {
      total += countWordsInString(sub.description);
      for (const b of sub.beats) total += countWordsInString(b);
    }
  }

  for (const t of themes) {
    total += countWordsInString(t.statement);
    total += countWordsInString(t.counter);
    total += countWordsInString(t.tension);
    for (const m of t.motifs) total += countWordsInString(m);
  }

  for (const i of interactions) {
    total += countWordsInString(i.subtext);
    total += countWordsInString(i.powerDynamic);
    total += countWordsInString(i.emotionalArc);
  }

  for (const tl of timelines) {
    total += countWordsInString(tl.span);
    for (const layer of tl.layers) {
      total += countWordsInString(layer.description);
    }
  }

  return total;
}

/**
 * Extract the complete relationship matrix from all character definitions.
 */
function extractRelationshipMatrix(
  characters: SerializedCharacterDef[],
): StoryAnalytics['relationshipMatrix'] {
  const matrix: StoryAnalytics['relationshipMatrix'] = [];

  for (const character of characters) {
    for (const rel of character.relationships) {
      matrix.push({
        from: character.name,
        to: rel.to,
        weight: rel.weight ?? 0,
        label: rel.label ?? '',
        dynamic: rel.dynamic ?? false,
      });
    }
  }

  return matrix;
}

/**
 * Extract comprehensive analytics from a story AST.
 */
export function extractAnalytics(story: SerializedStory): StoryAnalytics {
  const characters = findCharacters(story);
  const scenes = findScenes(story);
  const plots = findPlots(story);
  const worlds = findWorlds(story);
  const themes = findThemes(story);
  const interactions = findInteractions(story);
  const timelines = findTimelines(story);

  // Scene type distribution
  const sceneTypeDistribution: Record<string, number> = {};
  for (const scene of scenes) {
    const type = scene.sceneType ?? 'Untyped';
    sceneTypeDistribution[type] = (sceneTypeDistribution[type] ?? 0) + 1;
  }

  // Character screen time
  const charSceneCounts = new Map<string, number>();
  for (const scene of scenes) {
    for (const participant of scene.participants) {
      charSceneCounts.set(participant, (charSceneCounts.get(participant) ?? 0) + 1);
    }
  }

  const totalScenes = scenes.length || 1;
  const characterScreenTime = Array.from(charSceneCounts.entries())
    .map(([name, sceneCount]) => ({
      name,
      sceneCount,
      percentage: (sceneCount / totalScenes) * 100,
    }))
    .sort((a, b) => b.sceneCount - a.sceneCount);

  // Pacing rhythm
  const pacingRhythm = scenes.map((scene) => ({
    sceneName: scene.name,
    sceneType: scene.sceneType ?? 'Untyped',
    color: SCENE_TYPE_COLORS[scene.sceneType ?? ''] ?? '#6b7280',
  }));

  // Word count estimated from all AST textual content
  const wordCount = estimateWordCount(
    characters,
    worlds,
    scenes,
    plots,
    themes,
    interactions,
    timelines,
  );

  // Relationship matrix
  const relationshipMatrix = extractRelationshipMatrix(characters);

  return {
    wordCount,
    sceneCount: scenes.length,
    characterCount: characters.length,
    worldCount: worlds.length,
    themeCount: themes.length,
    plotCount: plots.length,
    interactionCount: interactions.length,
    timelineCount: timelines.length,
    sceneTypeDistribution,
    characterScreenTime,
    pacingRhythm,
    relationshipMatrix,
  };
}
