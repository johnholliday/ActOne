// ── Project Types ────────────────────────────────────────────────────

export type LifecycleStage =
  | 'concept'
  | 'draft'
  | 'revision'
  | 'final'
  | 'published';

export type CompositionMode = 'merge' | 'overlay' | 'sequential';

export interface LifecycleTransition {
  from: LifecycleStage;
  to: LifecycleStage;
}

/** All valid lifecycle stage transitions */
export const VALID_TRANSITIONS: readonly LifecycleTransition[] = [
  { from: 'concept', to: 'draft' },
  { from: 'draft', to: 'revision' },
  { from: 'revision', to: 'draft' },
  { from: 'revision', to: 'final' },
  { from: 'final', to: 'revision' },
  { from: 'final', to: 'published' },
] as const;

/** Check whether a lifecycle transition is valid */
export function isValidTransition(
  from: LifecycleStage,
  to: LifecycleStage,
): boolean {
  return VALID_TRANSITIONS.some((t) => t.from === from && t.to === to);
}
