/**
 * T050: Lifecycle transition logic.
 *
 * Core lifecycle functions re-exported from @docugenix/sanyam-project.
 * ActOne-specific helpers (requestTransition, getTransition) remain here.
 */

import type {
  LifecycleStage,
  LifecycleTransition,
} from '@docugenix/sanyam-project/types';
import { VALID_TRANSITIONS } from '@docugenix/sanyam-project/types';
import {
  isValidTransition,
  getValidTargets,
  getStageLabel,
  canTransition,
} from '@docugenix/sanyam-project/services';

// Re-export for consumers
export {
  isValidTransition,
  getValidTargets,
  getStageLabel,
  canTransition,
  VALID_TRANSITIONS,
};
export type { LifecycleStage, LifecycleTransition };

export interface TransitionResult {
  success: boolean;
  previousStage: LifecycleStage;
  currentStage: LifecycleStage;
  snapshotId?: string;
  error?: string;
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
