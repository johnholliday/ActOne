/**
 * T089: Draft manager.
 *
 * Stores/loads drafts from DB, manages per-paragraph versioning,
 * and handles accept/reject/regenerate state transitions.
 */

import { z } from 'zod';

export type DraftStatus = 'pending' | 'accepted' | 'rejected' | 'editing';

export interface DraftVersion {
  id: string;
  sceneName: string;
  paragraphIndex: number;
  content: string;
  status: DraftStatus;
  backend: string | null;
  model: string | null;
  temperature: number | null;
  tokenCount: number | null;
  costUsd: number | null;
  createdAt: string;
}

/** Zod schema for validating draft API responses. */
const DraftVersionSchema = z.object({
  id: z.string().uuid(),
  sceneName: z.string(),
  paragraphIndex: z.number().int().nonnegative(),
  content: z.string(),
  status: z.enum(['pending', 'accepted', 'rejected', 'editing']),
  backend: z.string().nullable(),
  model: z.string().nullable(),
  temperature: z.number().nullable(),
  tokenCount: z.number().int().nullable(),
  costUsd: z.number().nullable(),
  createdAt: z.string(),
});

const DraftListSchema = z.array(DraftVersionSchema);

/**
 * Load all draft versions for a project/scene.
 */
export async function loadDrafts(
  projectId: string,
  sceneName?: string,
  fetchFn: typeof fetch = fetch,
): Promise<DraftVersion[]> {
  const params = new URLSearchParams({ projectId });
  if (sceneName) params.set('sceneName', sceneName);

  const response = await fetchFn(`/api/draft/list?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to load drafts: ${response.status}`);
  }

  const raw = await response.json();
  return DraftListSchema.parse(raw);
}

/**
 * Update the status of a draft version.
 */
export async function updateDraftStatus(
  draftId: string,
  status: DraftStatus,
  fetchFn: typeof fetch = fetch,
): Promise<{ id: string; status: DraftStatus }> {
  const response = await fetchFn('/api/draft/update', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ draftId, status }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update draft: ${response.status}`);
  }

  const raw = await response.json();
  return z.object({
    id: z.string().uuid(),
    status: z.enum(['pending', 'accepted', 'rejected', 'editing']),
  }).parse(raw);
}

/**
 * Split generated text into paragraphs for per-paragraph versioning.
 */
export function splitIntoParagraphs(fullText: string): string[] {
  return fullText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Get the latest version for each paragraph index.
 */
export function getLatestVersions(drafts: DraftVersion[]): Map<number, DraftVersion> {
  const latest = new Map<number, DraftVersion>();

  for (const draft of drafts) {
    const existing = latest.get(draft.paragraphIndex);
    if (!existing || draft.createdAt > existing.createdAt) {
      latest.set(draft.paragraphIndex, draft);
    }
  }

  return latest;
}

/**
 * Get all versions for a specific paragraph.
 */
export function getParagraphHistory(
  drafts: DraftVersion[],
  paragraphIndex: number,
): DraftVersion[] {
  return drafts
    .filter((d) => d.paragraphIndex === paragraphIndex)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Calculate total accepted word count.
 */
export function getAcceptedWordCount(drafts: DraftVersion[]): number {
  const latest = getLatestVersions(drafts);
  let total = 0;
  for (const draft of latest.values()) {
    if (draft.status === 'accepted') {
      total += draft.content.split(/\s+/).length;
    }
  }
  return total;
}

/**
 * Calculate total cost across all draft versions.
 */
export function getTotalCost(drafts: DraftVersion[]): number {
  return drafts.reduce((sum, d) => sum + (d.costUsd ?? 0), 0);
}
