// ── Validation Ranges ────────────────────────────────────────────────
// Numeric ranges for DSL value validation.

export const VALIDATION = {
  /** Personality trait value range */
  trait: { min: 0, max: 100 },

  /** Relationship weight range */
  relationshipWeight: { min: -100, max: 100 },

  /** Mood/atmosphere value range */
  mood: { min: 0, max: 100 },

  /** Generation temperature range */
  temperature: { min: 0.0, max: 2.0 },

  /** Continuity loss range */
  continuityLoss: { min: 0.0, max: 1.0 },

  /** Style bleed range */
  styleBleed: { min: 0.0, max: 1.0 },

  /** Style mix value range (per character) */
  styleMix: { min: 0, max: 100 },

  /** Max tokens range */
  maxTokens: { min: 1, max: 100_000 },

  /** Arc phase band ratio range */
  arcPhaseRatio: { min: 0.0, max: 1.0 },

  /** Project limits */
  project: {
    maxCharacters: 50,
    maxScenes: 100,
    maxSourceFiles: 10,
    maxTitleLength: 500,
    maxAuthorNameLength: 200,
    maxGenreLength: 100,
    maxSnapshotTagLength: 200,
    maxFilePathLength: 500,
  },
} as const;
