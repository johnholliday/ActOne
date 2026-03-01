/**
 * Layout preferences logic for sidebar size and visibility.
 * Panel layout (editor, diagnostics, outline, etc.) is now managed
 * by dockview's built-in serialization/persistence.
 */

export interface LayoutPrefs {
  sidebarWidth: number;
  sidebarVisible: boolean;
}

const DEFAULTS: LayoutPrefs = {
  sidebarWidth: 256,
  sidebarVisible: true,
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

    return {
      sidebarWidth,
      sidebarVisible,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function serializeLayoutPrefs(prefs: LayoutPrefs): string {
  return JSON.stringify(prefs);
}
