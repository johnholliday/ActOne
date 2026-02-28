/**
 * T047: Project creation logic.
 *
 * Provides utility functions for generating the initial project creation
 * payload, including the skeleton story file content.
 */

import type { CompositionMode } from '@repo/shared';

export interface CreateProjectInput {
  title: string;
  authorName?: string;
  genre?: string;
  compositionMode?: CompositionMode;
  publishingMode?: 'text' | 'graphic-novel';
}

export interface CreateProjectResult {
  id: string;
  title: string;
  entryFilePath: string;
}

/**
 * Generate the default entry file content for a new project.
 * Creates a minimal but valid .actone story skeleton.
 *
 * IMPORTANT: The content must conform to the ActOne grammar (actone.langium):
 *   - Definition names accept both ID (Protagonist) and STRING ("Elena Vasquez")
 *   - Properties require colons (e.g., `bio: "..."`)
 *   - Enum values are PascalCase (e.g., `Human`, `Past`, `Moderate`)
 *   - Arrays use bracket syntax (e.g., `participants: [Protagonist]`)
 *   - Locations use `locations: [{ name: Name, ... }]` block syntax
 */
export function generateEntrySkeleton(title: string, authorName?: string): string {
  const sanitizedTitle = title.replace(/"/g, '\\"');
  const lines: string[] = [];

  lines.push(`story "${sanitizedTitle}" {`);
  lines.push('');

  // Add a sample character
  lines.push('  character Protagonist {');
  lines.push('    nature: Human,');
  lines.push('    bio: "The main character of the story.",');
  lines.push('  }');
  lines.push('');

  // Add a sample world with a location
  lines.push('  world StoryWorld {');
  lines.push('    locations: [');
  lines.push('      {');
  lines.push('        name: StartingPoint,');
  lines.push('        description: "Where the story begins.",');
  lines.push('      }');
  lines.push('    ],');
  lines.push('  }');
  lines.push('');

  // Add a sample scene
  lines.push('  scene Opening {');
  lines.push('    type: Dialogue,');
  lines.push('    location: StartingPoint,');
  lines.push('    participants: [Protagonist],');
  lines.push('    objective: "Introduce the world and main character.",');
  lines.push('  }');
  lines.push('');

  // Add generate block with author info
  lines.push('  generate {');
  lines.push('    genre: "Fiction",');
  if (authorName) {
    lines.push(`    // Author: ${authorName}`);
  }
  lines.push('    tone: ["atmospheric"],');
  lines.push('    tense: Past,');
  lines.push('    pacing: Moderate,');
  lines.push('  }');

  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate the entry file path for a project.
 */
export function generateEntryFilePath(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return `${slug || 'story'}.actone`;
}

/**
 * Create a project via the server API.
 */
export async function createProject(
  input: CreateProjectInput,
  fetchFn: typeof fetch = fetch,
): Promise<CreateProjectResult> {
  const response = await fetchFn('/api/project/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create project: ${error}`);
  }

  return response.json() as Promise<CreateProjectResult>;
}
