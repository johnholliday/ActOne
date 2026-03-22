// ── Project Types ────────────────────────────────────────────────────
// Lifecycle types re-exported from @docugenix/sanyam-projects.
// CompositionMode is ActOne-specific and stays here.

export type {
  LifecycleStage,
  LifecycleTransition,
} from '@docugenix/sanyam-projects/types';

export {
  VALID_TRANSITIONS,
} from '@docugenix/sanyam-projects/types';

export {
  isValidTransition,
} from '@docugenix/sanyam-projects/services';

export type CompositionMode = 'merge' | 'overlay' | 'sequential';
