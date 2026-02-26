// ── Scene Type Colors ────────────────────────────────────────────────

export const SCENE_TYPE_COLORS: Record<string, string> = {
  Action: '#ef4444',
  Dialogue: '#3b82f6',
  Reflection: '#a855f7',
  Montage: '#f59e0b',
  Revelation: '#10b981',
  Confrontation: '#f97316',
  Transition: '#6b7280',
  Climax: '#dc2626',
} as const;

// ── Beat Type Colors ─────────────────────────────────────────────────

export const BEAT_TYPE_COLORS: Record<string, string> = {
  Setup: '#94a3b8',
  Inciting: '#22d3ee',
  Rising: '#3b82f6',
  Midpoint: '#a855f7',
  Complication: '#f59e0b',
  Crisis: '#f97316',
  Climax: '#ef4444',
  Falling: '#8b5cf6',
  Resolution: '#10b981',
  Denouement: '#6b7280',
} as const;

// ── Edge Styling ─────────────────────────────────────────────────────

export const EDGE_STYLES = {
  relationship: {
    positive: '#10b981',
    negative: '#ef4444',
    neutral: '#6b7280',
  },
  locationLink: '#94a3b8',
  beatSequence: '#64748b',
  exchangeArrow: '#8b5cf6',
} as const;

// ── Character Nature Colors ──────────────────────────────────────────

export const CHARACTER_NATURE_COLORS: Record<string, string> = {
  Human: '#3b82f6',
  Force: '#ef4444',
  Concept: '#a855f7',
  Animal: '#f59e0b',
  Spirit: '#22d3ee',
  Collective: '#10b981',
  Environment: '#84cc16',
} as const;
