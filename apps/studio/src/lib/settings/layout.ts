/**
 * Layout preferences logic for panel sizes, visibility, and dock positions.
 */

export type DockPosition = 'right' | 'bottom';

export interface LayoutPrefs {
  sidebarWidth: number;
  sidebarVisible: boolean;
  bottomPanelHeight: number;
  bottomPanelVisible: boolean;
  outlineWidth: number;
  outlineVisible: boolean;
  outlineDockPosition: DockPosition;
}

const DEFAULTS: LayoutPrefs = {
  sidebarWidth: 256,
  sidebarVisible: true,
  bottomPanelHeight: 192,
  bottomPanelVisible: true,
  outlineWidth: 224,
  outlineVisible: true,
  outlineDockPosition: 'right',
};

const VALID_DOCK_POSITIONS = new Set<string>(['right', 'bottom']);

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

    const bottomPanelHeight =
      typeof parsed.bottomPanelHeight === 'number'
        ? parsed.bottomPanelHeight
        : DEFAULTS.bottomPanelHeight;

    const bottomPanelVisible =
      typeof parsed.bottomPanelVisible === 'boolean'
        ? parsed.bottomPanelVisible
        : DEFAULTS.bottomPanelVisible;

    const outlineWidth =
      typeof parsed.outlineWidth === 'number'
        ? parsed.outlineWidth
        : DEFAULTS.outlineWidth;

    const outlineVisible =
      typeof parsed.outlineVisible === 'boolean'
        ? parsed.outlineVisible
        : DEFAULTS.outlineVisible;

    const outlineDockPosition =
      typeof parsed.outlineDockPosition === 'string' && VALID_DOCK_POSITIONS.has(parsed.outlineDockPosition)
        ? (parsed.outlineDockPosition as DockPosition)
        : DEFAULTS.outlineDockPosition;

    return {
      sidebarWidth,
      sidebarVisible,
      bottomPanelHeight,
      bottomPanelVisible,
      outlineWidth,
      outlineVisible,
      outlineDockPosition,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function serializeLayoutPrefs(prefs: LayoutPrefs): string {
  return JSON.stringify(prefs);
}
