// ── Project Types ────────────────────────────────────────────────────
// Lifecycle types re-exported from @docugenix/sanyam-project.
// CompositionMode is ActOne-specific and stays here.

export type {
  LifecycleStage,
  LifecycleTransition,
} from '@docugenix/sanyam-project/types';

export {
  VALID_TRANSITIONS,
} from '@docugenix/sanyam-project/types';

export {
  isValidTransition,
} from '@docugenix/sanyam-project/services';

export type CompositionMode = 'merge' | 'overlay' | 'sequential';
