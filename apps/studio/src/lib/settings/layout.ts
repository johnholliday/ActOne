/**
 * Layout preferences logic for sidebar size and visibility.
 * Panel layout (editor, diagnostics, outline, etc.) is now managed
 * by dockview's built-in serialization/persistence.
 */

export interface LayoutPrefs {
  sidebarWidth: number;
  sidebarVisible: boolean;
  outlineVisible: boolean;
  outlineWidth: number;
  statusBarVisible: boolean;
}

const DEFAULTS: LayoutPrefs = {
  sidebarWidth: 256,
  sidebarVisible: true,
  outlineVisible: true,
  outlineWidth: 240,
  statusBarVisible: true,
};

export function parseLayoutPrefs(raw: string | null): LayoutPrefs {
  if (!raw) return { ...DEFAULTS };

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    const sidebarWidth =
      typeof parsed.sidebarWidth === 'number'
        ? parsed.sidebarWidth
        : DEFAULTS.sidebarWidth;

    const sidebarVisible =
      typeof parsed.sidebarVisible === 'boolean'
        ? parsed.sidebarVisible
        : DEFAULTS.sidebarVisible;

    const outlineVisible =
      typeof parsed.outlineVisible === 'boolean'
        ? parsed.outlineVisible
        : DEFAULTS.outlineVisible;

    const outlineWidth =
      typeof parsed.outlineWidth === 'number'
        ? parsed.outlineWidth
        : DEFAULTS.outlineWidth;

    const statusBarVisible =
      typeof parsed.statusBarVisible === 'boolean'
        ? parsed.statusBarVisible
        : DEFAULTS.statusBarVisible;

    return {
      sidebarWidth,
      sidebarVisible,
      outlineVisible,
      outlineWidth,
      statusBarVisible,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function serializeLayoutPrefs(prefs: LayoutPrefs): string {
  return JSON.stringify(prefs);
}
