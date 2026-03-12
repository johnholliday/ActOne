/**
 * Layout persistence: save/restore/clear dockview layout to localStorage.
 *
 * Uses dockview's built-in toJSON()/fromJSON() serialization with
 * a version field for forward migration support.
 */
import type { DockviewApi, SerializedDockview } from 'dockview-core';
import { applyDefaultLayout } from './default-layout.js';

const STORAGE_KEY = 'actone:dockview-layout';
const OLD_STORAGE_KEY = 'actone:layout';
const LAYOUT_VERSION = 8;

interface VersionedLayout {
  version: number;
  data: SerializedDockview;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Save the current layout to localStorage (debounced 500ms).
 * Called from the onDidLayoutChange event handler.
 */
export function saveLayout(api: DockviewApi): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const serialized: VersionedLayout = {
        version: LAYOUT_VERSION,
        data: api.toJSON(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
    } catch (err) {
      console.warn('[ActOne] Failed to save layout:', err);
    }
  }, 500);
}

/**
 * Restore layout from localStorage.
 * Returns true if successfully restored, false if default layout should be applied.
 */
export function restoreLayout(api: DockviewApi): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const parsed: unknown = JSON.parse(raw);

    // Validate structure
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('version' in parsed) ||
      !('data' in parsed)
    ) {
      console.warn('[ActOne] Invalid layout data structure, using default layout.');
      return false;
    }

    const versioned = parsed as VersionedLayout;

    // Version check — discard if saved version doesn't match current
    if (typeof versioned.version !== 'number' || versioned.version !== LAYOUT_VERSION) {
      console.warn(
        `[ActOne] Layout version ${versioned.version} doesn't match current ${LAYOUT_VERSION}, using default layout.`,
      );
      return false;
    }

    // Validate data has expected shape
    if (
      typeof versioned.data !== 'object' ||
      versioned.data === null ||
      !('grid' in versioned.data) ||
      !('panels' in versioned.data)
    ) {
      console.warn('[ActOne] Invalid layout data payload, using default layout.');
      return false;
    }

    api.fromJSON(versioned.data);
    return true;
  } catch (err) {
    console.warn('[ActOne] Failed to restore layout:', err);
    return false;
  }
}

/**
 * Clear saved layout from localStorage.
 */
export function clearLayout(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Migrate from old layout storage key (one-time).
 * Removes the old key after reading it so it doesn't interfere.
 */
export function migrateOldLayout(): void {
  try {
    const old = localStorage.getItem(OLD_STORAGE_KEY);
    if (old) {
      // Remove old key — the sidebar prefs in the old format are handled
      // separately by the sidebar persistence code.
      localStorage.removeItem(OLD_STORAGE_KEY);
    }
  } catch {
    // Ignore migration errors
  }
}

/**
 * Ensure panels that provide their own tab UI have dockview's
 * group header hidden. Handles both fresh and restored layouts.
 */
function hideManagedGroupHeaders(api: DockviewApi): void {
  for (const panelId of ['editor']) {
    const panel = api.getPanel(panelId);
    if (panel) {
      panel.group.model.header.hidden = true;
    }
  }
}

/**
 * Full restore flow: try saved layout, fall back to default.
 */
export function restoreOrDefault(api: DockviewApi): void {
  migrateOldLayout();
  const restored = restoreLayout(api);
  if (!restored) {
    applyDefaultLayout(api);
  }
  // Always ensure managed group headers are hidden (handles pre-existing saved layouts)
  hideManagedGroupHeaders(api);
}
