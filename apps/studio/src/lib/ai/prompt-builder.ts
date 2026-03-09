/**
 * T087: Prompt builder.
 *
 * Two format levels:
 * - Rich: detailed character cards, full personality, structured sections
 * - Concise: abbreviated, top 3 traits, essential info only
 */

import type { GenerationContext } from './generation-context.js';

export type PromptFormat = 'rich' | 'concise';

/**
 * Build a generation prompt from assembled context.
 */
export function buildPrompt(
  context: GenerationContext,
  format: PromptFormat = 'rich',
): string {
  return format === 'rich'
    ? buildRichPrompt(context)
    : buildConcisePrompt(context);
}

function buildRichPrompt(ctx: GenerationContext): string {
  const sections: string[] = [];

  // Scene header
  sections.push(`# Scene: ${ctx.sceneName}`);
  sections.push(`**Type**: ${ctx.sceneType}`);
  if (ctx.location) sections.push(`**Setting**: ${ctx.location}`);
  if (ctx.objective) sections.push(`**Objective**: ${ctx.objective}`);
  sections.push(`**Pacing**: ${ctx.pacing}`);

  // Atmosphere
  if (ctx.atmosphere.length > 0) {
    const attrs = ctx.atmosphere
      .map((a) => `${a.name} (${Math.round(a.value * 100)}%)`)
      .join(', ');
    sections.push(`**Atmosphere**: ${attrs}`);
  }

  sections.push('');

  // Character cards
  if (ctx.participants.length > 0) {
    sections.push('## Characters');
    for (const p of ctx.participants) {
      sections.push(`### ${p.name} (${p.nature})`);
      if (p.bio) sections.push(p.bio);
      if (p.voice) sections.push(`**Voice**: ${p.voice}`);

      if (p.personality.length > 0) {
        sections.push('**Personality**:');
        for (const trait of p.personality) {
          const bar = '█'.repeat(Math.round(trait.value * 10));
          sections.push(`- ${trait.name}: ${bar} (${Math.round(trait.value * 100)}%)`);
        }
      }
      sections.push('');
    }
  }

  // World rules
  if (ctx.worldRules.length > 0) {
    sections.push('## World Rules');
    for (const rule of ctx.worldRules) {
      sections.push(`- ${rule}`);
    }
    sections.push('');
  }

  // Themes
  if (ctx.themeStatements.length > 0) {
    sections.push('## Thematic Context');
    for (const theme of ctx.themeStatements) {
      sections.push(`- ${theme}`);
    }
    sections.push('');
  }

  // Continuity
  if (ctx.precedingSceneSummary) {
    sections.push('## Continuity');
    sections.push(ctx.precedingSceneSummary);
    sections.push('');
  }

  // Interaction pattern
  if (ctx.interactionPattern) {
    sections.push('## Interaction Pattern');
    sections.push(ctx.interactionPattern);
    sections.push('');
  }

  // Instructions
  sections.push('---');
  sections.push('Write the scene prose. Maintain each character\'s distinct voice.');
  sections.push(`Pacing should be ${ctx.pacing}.`);

  return sections.join('\n');
}

function buildConcisePrompt(ctx: GenerationContext): string {
  const lines: string[] = [];

  lines.push(`Scene: "${ctx.sceneName}" [${ctx.sceneType}]`);
  if (ctx.location) lines.push(`Setting: ${ctx.location}`);
  if (ctx.objective) lines.push(`Goal: ${ctx.objective}`);
  lines.push(`Pacing: ${ctx.pacing}`);

  // Abbreviated characters
  if (ctx.participants.length > 0) {
    lines.push('');
    lines.push('Characters:');
    for (const p of ctx.participants) {
      const topTraits = p.personality
        .slice(0, 3)
        .map((t) => t.name)
        .join(', ');
      lines.push(`- ${p.name} (${p.nature}): ${topTraits || p.bio || 'no details'}`);
    }
  }

  // Essential world rules
  if (ctx.worldRules.length > 0) {
    lines.push('');
    lines.push(`Rules: ${ctx.worldRules.slice(0, 3).join('; ')}`);
  }

  // Continuity
  if (ctx.precedingSceneSummary) {
    lines.push('');
    lines.push(ctx.precedingSceneSummary);
  }

  lines.push('');
  lines.push('Write the scene prose.');

  return lines.join('\n');
}

/**
 * Estimate the token count of a prompt.
 * Rough heuristic: ~4 characters per token.
 */
export function estimatePromptTokens(prompt: string): number {
  return Math.ceil(prompt.length / 4);
}
