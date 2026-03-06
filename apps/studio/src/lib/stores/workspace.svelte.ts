/**
 * WorkspaceStore: tracks which projects are open and which is active.
 *
 * Persists state to localStorage keyed by user ID so each device
 * maintains its own workspace independently.
 */

import type { WorkspaceState } from '@repo/shared';

const STORAGE_KEY_PREFIX = 'actone:workspace:';

function storageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

class WorkspaceStore {
  /** IDs of currently open projects (ordered by open time) */
  openProjectIds = $state<string[]>([]);

  /** ID of the currently active project */
  activeProjectId = $state<string | null>(null);

  /** User ID for localStorage persistence */
  private userId: string | null = null;

  /** Whether the workspace has any open projects */
  hasOpenProjects = $derived(this.openProjectIds.length > 0);

  /** Number of open projects */
  openProjectCount = $derived(this.openProjectIds.length);

  /** Check if a project is open in the workspace */
  isOpen(projectId: string): boolean {
    return this.openProjectIds.includes(projectId);
  }

  /** Add a project to the workspace (no-op if already open) */
  openProject(projectId: string): void {
    if (this.openProjectIds.includes(projectId)) return;
    this.openProjectIds = [...this.openProjectIds, projectId];
    // If this is the only project, make it active
    if (this.openProjectIds.length === 1) {
      this.activeProjectId = projectId;
    }
    this.save();
  }

  /** Set the active project (must already be open) */
  setActiveProject(projectId: string): void {
    if (!this.openProjectIds.includes(projectId)) return;
    if (this.activeProjectId === projectId) return;
    this.activeProjectId = projectId;
    this.save();
  }

  /** Remove a project from the workspace */
  closeProject(projectId: string): void {
    if (!this.openProjectIds.includes(projectId)) return;
    this.openProjectIds = this.openProjectIds.filter((id) => id !== projectId);

    // If the closed project was active, switch to the last remaining project
    if (this.activeProjectId === projectId) {
      this.activeProjectId =
        this.openProjectIds[this.openProjectIds.length - 1] ?? null;
    }
    this.save();
  }

  /** Remove a deleted project (same as close but semantically different) */
  removeDeleted(projectId: string): void {
    this.closeProject(projectId);
  }

  /** Persist workspace state to localStorage */
  save(): void {
    if (!this.userId) return;
    const state: WorkspaceState = {
      openProjectIds: this.openProjectIds,
      activeProjectId: this.activeProjectId,
    };
    try {
      localStorage.setItem(storageKey(this.userId), JSON.stringify(state));
    } catch {
      // Quota exceeded or localStorage unavailable — silently ignore
    }
  }

  /** Restore workspace state from localStorage */
  restore(userId: string): void {
    this.userId = userId;
    try {
      const raw = localStorage.getItem(storageKey(userId));
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!isWorkspaceState(parsed)) return;
      this.openProjectIds = parsed.openProjectIds;
      this.activeProjectId = parsed.activeProjectId;
    } catch {
      // Corrupted data — start with empty workspace
    }
  }

  /** Clear all workspace state */
  clear(): void {
    this.openProjectIds = [];
    this.activeProjectId = null;
    if (this.userId) {
      try {
        localStorage.removeItem(storageKey(this.userId));
      } catch {
        // Ignore
      }
    }
  }
}

/** Validate that parsed JSON matches WorkspaceState shape */
function isWorkspaceState(value: unknown): value is WorkspaceState {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (!Array.isArray(obj.openProjectIds)) return false;
  if (!obj.openProjectIds.every((id: unknown) => typeof id === 'string'))
    return false;
  if (
    obj.activeProjectId !== null &&
    typeof obj.activeProjectId !== 'string'
  )
    return false;
  return true;
}

export const workspaceStore = new WorkspaceStore();
