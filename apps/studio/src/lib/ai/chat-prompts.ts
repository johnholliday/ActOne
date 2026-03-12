/**
 * Chat prompt definitions and grammar context builder for AI chat.
 *
 * Exports predefined prompts in sanyam-ai-chat PredefinedPrompt format
 * and builds grammar context strings from the serialized AST.
 */

import type { PredefinedPrompt } from '@docugenix/sanyam-ai-chat';
import type { SerializedStory } from '@actone/shared';
import {
  findCharacters,
  findWorlds,
  findScenes,
  findPlots,
  findThemes,
  findTimelines,
  findInteractions,
} from '$lib/ast/ast-utils.js';

/* ── Predefined prompts ───────────────────────────────────────────── */

/** Prompt definitions as sanyam-ai-chat PredefinedPrompt[]. */
export const predefinedPrompts: PredefinedPrompt[] = [
  {
    id: 'develop-character',
    grammarId: 'actone',
    label: 'Develop a character',
    promptText: 'Help me develop a new character for my story. Ask me questions about their role, personality, and background.',
    sortOrder: 0,
    source: 'manual',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'brainstorm-plot',
    grammarId: 'actone',
    label: 'Brainstorm plot ideas',
    promptText: 'I need help brainstorming plot ideas. What are some interesting directions my story could take?',
    sortOrder: 1,
    source: 'manual',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'write-dialogue',
    grammarId: 'actone',
    label: 'Write dialogue',
    promptText: 'Help me write a dialogue scene. What scene should we work on?',
    sortOrder: 2,
    source: 'manual',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'improve-scene',
    grammarId: 'actone',
    label: 'Improve a scene',
    promptText: 'I have a scene that needs improvement. Can you help me make it more engaging and vivid?',
    sortOrder: 3,
    source: 'manual',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'worldbuilding',
    grammarId: 'actone',
    label: 'Worldbuilding',
    promptText: 'Help me flesh out the world of my story — setting, culture, rules, or history.',
    sortOrder: 4,
    source: 'manual',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'review-outline',
    grammarId: 'actone',
    label: 'Review my outline',
    promptText: 'Can you review my story outline and suggest improvements to the structure and pacing?',
    sortOrder: 5,
    source: 'manual',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
];

/* ── Grammar context builder ──────────────────────────────────────── */

const GRAMMAR_REFERENCE = `\
The story is written in the ActOne DSL. Key element types:
- Character: has name, nature, bio, role, voice, personality traits, quirks, goals, conflicts, strengths, flaws, relationships, arc, symbols, secret
- World: has name, period, sensory details, locations (with atmosphere, connections), rules
- Scene: has name, sceneType, location, atmosphere, objective, participants, beats
- Plot: has name, beats with act numbers and types, subplots
- Theme: has name, statement, motifs, tensions
- Timeline: has name, structure, span, layers
- Interaction: has name, participants, pattern, styleMix`;

/**
 * Build a full grammar context string from the serialized AST.
 * Includes the grammar reference, all story elements, and the story name.
 */
export function buildFullGrammarContext(story: SerializedStory): string {
  const sections: string[] = [GRAMMAR_REFERENCE, ''];

  sections.push(`## Current Story: "${story.name}"\n`);

  const scopeKeys = ['characters', 'worlds', 'scenes', 'plots', 'themes', 'timelines', 'interactions'] as const;
  for (const key of scopeKeys) {
    const section = buildScopeSection(story, key);
    if (section) sections.push(section);
  }

  return sections.join('\n');
}

type ScopeKey = 'characters' | 'worlds' | 'scenes' | 'plots' | 'themes' | 'timelines' | 'interactions';

function buildScopeSection(story: SerializedStory, key: ScopeKey): string | null {
  switch (key) {
    case 'characters': {
      const chars = findCharacters(story);
      if (chars.length === 0) return null;
      const lines = chars.map((c) => {
        const parts = [`- **${c.name}**`];
        if (c.nature) parts.push(`(${c.nature})`);
        if (c.role) parts.push(`— ${c.role}`);
        if (c.bio) parts.push(`— ${c.bio}`);
        if (c.voice) parts.push(`| Voice: ${c.voice}`);
        if (c.personality.length > 0) {
          parts.push(`| Traits: ${c.personality.map((p) => p.name).join(', ')}`);
        }
        if (c.relationships.length > 0) {
          parts.push(`| Relations: ${c.relationships.map((r) => `${r.label ?? ''} → ${r.to}`).join('; ')}`);
        }
        return parts.join(' ');
      });
      return `### Characters\n${lines.join('\n')}`;
    }

    case 'worlds': {
      const worlds = findWorlds(story);
      if (worlds.length === 0) return null;
      const lines = worlds.map((w) => {
        const parts = [`- **${w.name}**`];
        if (w.period) parts.push(`(${w.period})`);
        if (w.locations.length > 0) {
          parts.push(`| Locations: ${w.locations.map((l) => l.name).join(', ')}`);
        }
        if (w.rules.length > 0) {
          parts.push(`| Rules: ${w.rules.map((r) => r.rule).join('; ')}`);
        }
        return parts.join(' ');
      });
      return `### Worlds\n${lines.join('\n')}`;
    }

    case 'scenes': {
      const scenes = findScenes(story);
      if (scenes.length === 0) return null;
      const lines = scenes.map((s) => {
        const parts = [`- **${s.name}**`];
        if (s.sceneType) parts.push(`(${s.sceneType})`);
        if (s.location) parts.push(`at ${s.location}`);
        if (s.participants.length > 0) parts.push(`with ${s.participants.join(', ')}`);
        if (s.objective) parts.push(`— ${s.objective}`);
        return parts.join(' ');
      });
      return `### Scenes\n${lines.join('\n')}`;
    }

    case 'plots': {
      const plots = findPlots(story);
      if (plots.length === 0) return null;
      const lines = plots.map((p) => `- **${p.name}** (${p.beats.length} beats)`);
      return `### Plots\n${lines.join('\n')}`;
    }

    case 'themes': {
      const themes = findThemes(story);
      if (themes.length === 0) return null;
      const lines = themes.map((t) => {
        const parts = [`- **${t.name}**`];
        if (t.statement) parts.push(`— "${t.statement}"`);
        return parts.join(' ');
      });
      return `### Themes\n${lines.join('\n')}`;
    }

    case 'timelines': {
      const timelines = findTimelines(story);
      if (timelines.length === 0) return null;
      const lines = timelines.map((t) => `- **${t.name}** (${t.layers.length} layers)`);
      return `### Timelines\n${lines.join('\n')}`;
    }

    case 'interactions': {
      const interactions = findInteractions(story);
      if (interactions.length === 0) return null;
      const lines = interactions.map((i) => {
        const parts = [`- **${i.name}**`];
        if (i.pattern) parts.push(`(${i.pattern})`);
        parts.push(`between ${i.participants.join(', ')}`);
        return parts.join(' ');
      });
      return `### Interactions\n${lines.join('\n')}`;
    }

    default:
      return null;
  }
}
