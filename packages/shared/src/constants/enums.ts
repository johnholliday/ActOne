// ── DSL Enum Values ──────────────────────────────────────────────────
// These mirror the Langium grammar enum definitions for use outside the parser.

export const CHARACTER_NATURES = [
  'Human',
  'Force',
  'Concept',
  'Animal',
  'Spirit',
  'Collective',
  'Environment',
] as const;
export type CharacterNature = (typeof CHARACTER_NATURES)[number];

export const SCENE_TYPES = [
  'Action',
  'Dialogue',
  'Reflection',
  'Montage',
  'Revelation',
  'Confrontation',
  'Transition',
  'Climax',
] as const;
export type SceneType = (typeof SCENE_TYPES)[number];

export const TIMELINE_STRUCTURES = [
  'Linear',
  'Nonlinear',
  'Parallel',
  'Collapsed',
  'Cyclical',
  'Reverse',
] as const;
export type TimelineStructure = (typeof TIMELINE_STRUCTURES)[number];

export const TRANSITION_TYPES = [
  'Cut',
  'Dissolve',
  'Flashback',
  'FlashForward',
  'Parallel',
  'Smash',
  'Fade',
  'Montage',
] as const;
export type TransitionType = (typeof TRANSITION_TYPES)[number];

export const CONFLICT_TYPES = [
  'Interpersonal',
  'Internal',
  'Intrapsychic',
  'Societal',
  'Environmental',
  'Cosmic',
  'Existential',
  'Technological',
] as const;
export type ConflictType = (typeof CONFLICT_TYPES)[number];

export const RESOLUTION_PATTERNS = [
  'Transformative',
  'Tragic',
  'Redemptive',
  'Ambiguous',
  'Cyclical',
  'Pyrrhic',
  'Transcendent',
] as const;
export type ResolutionPattern = (typeof RESOLUTION_PATTERNS)[number];

export const BEAT_TYPES = [
  'Setup',
  'Inciting',
  'Rising',
  'Midpoint',
  'Complication',
  'Crisis',
  'Climax',
  'Falling',
  'Resolution',
  'Denouement',
] as const;
export type BeatType = (typeof BEAT_TYPES)[number];

export const TENSES = ['Past', 'Present', 'Future'] as const;
export type Tense = (typeof TENSES)[number];

export const POVS = [
  'FirstPerson',
  'SecondPerson',
  'ThirdLimited',
  'ThirdOmniscient',
] as const;
export type POV = (typeof POVS)[number];

export const PACINGS = [
  'Slow',
  'Measured',
  'Moderate',
  'Brisk',
  'Accelerating',
] as const;
export type Pacing = (typeof PACINGS)[number];

export const GOAL_PRIORITIES = ['Primary', 'Secondary', 'Hidden'] as const;
export type GoalPriority = (typeof GOAL_PRIORITIES)[number];

export const RULE_CATEGORIES = [
  'Physical',
  'Social',
  'Metaphysical',
  'Narrative',
  'Psychological',
] as const;
export type RuleCategory = (typeof RULE_CATEGORIES)[number];
