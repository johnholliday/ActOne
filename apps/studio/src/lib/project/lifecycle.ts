/**
 * T050: Lifecycle transition logic.
 *
 * Enforces valid lifecycle transitions using VALID_TRANSITIONS from @repo/shared.
 */

import {
  isValidTransition,
  type LifecycleStage,
  type LifecycleTransition,
  VALID_TRANSITIONS,
} from '@repo/shared';

export interface TransitionResult {
  success: boolean;
  previousStage: LifecycleStage;
  currentStage: LifecycleStage;
  snapshotId?: string;
  error?: string;
}

/**
 * Check if a lifecycle transition is valid.
 */
export function canTransition(
  from: LifecycleStage,
  to: LifecycleStage,
): boolean {
  return isValidTransition(from, to);
}

/**
 * Get all valid target stages from a given stage.
 */
export function getValidTargets(from: LifecycleStage): LifecycleStage[] {
  return VALID_TRANSITIONS
    .filter((t: LifecycleTransition) => t.from === from)
    .map((t: LifecycleTransition) => t.to);
}

/**
 * Get the transition metadata for a given stage change.
 */
export function getTransition(
  from: LifecycleStage,
  to: LifecycleStage,
): LifecycleTransition | null {
  return VALID_TRANSITIONS.find(
    (t: LifecycleTransition) => t.from === from && t.to === to,
  ) ?? null;
}

/**
 * Get the display label for a lifecycle stage.
 */
export function getStageLabel(stage: LifecycleStage): string {
  const labels: Record<LifecycleStage, string> = {
    concept: 'Concept',
    draft: 'Draft',
    revision: 'Revision',
    final: 'Final',
    published: 'Published',
  };
  return labels[stage];
}

/**
 * Request a lifecycle transition via the server API.
 */
export async function requestTransition(
  projectId: string,
  targetStage: LifecycleStage,
  notes?: string,
  fetchFn: typeof fetch = fetch,
): Promise<TransitionResult> {
  const response = await fetchFn('/api/project/lifecycle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, targetStage, notes }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      previousStage: 'concept',
      currentStage: 'concept',
      error: errorText,
    };
  }

  const data = (await response.json()) as {
    previousStage: LifecycleStage;
    currentStage: LifecycleStage;
    snapshotId: string;
  };
  return {
    success: true,
    previousStage: data.previousStage,
    currentStage: data.currentStage,
    snapshotId: data.snapshotId,
  };
}
