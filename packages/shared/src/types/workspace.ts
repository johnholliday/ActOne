// ── Workspace Types ──────────────────────────────────────────────────

/** Persisted workspace state (localStorage) */
export interface WorkspaceState {
  /** IDs of projects currently open in the workspace */
  openProjectIds: string[];
  /** ID of the currently active project (owns focused editor tab) */
  activeProjectId: string | null;
}
