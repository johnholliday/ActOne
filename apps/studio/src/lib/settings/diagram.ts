/**
 * Diagram canvas preferences: style theme, snap-to-grid, background pattern.
 * Follows the same parse/serialize pattern as appearance.ts and layout.ts.
 */

export type DiagramStyle = 'dark' | 'blueprint';
export type BackgroundPattern = 'dots' | 'lines' | 'cross';

export interface DiagramPrefs {
  style: DiagramStyle;
  snapToGrid: boolean;
  gridSize: number;
  backgroundVariant: BackgroundPattern;
}

export interface DiagramStyleConfig {
  canvasBgColor: string;
  patternColor: string;
  minimapBg: string;
  minimapMask: string;
}

const DEFAULTS: DiagramPrefs = {
  style: 'dark',
  snapToGrid: false,
  gridSize: 20,
  backgroundVariant: 'dots',
};

const VALID_STYLES = new Set<string>(['dark', 'blueprint']);
const VALID_VARIANTS = new Set<string>(['dots', 'lines', 'cross']);

export const DIAGRAM_STYLE_CONFIGS: Record<DiagramStyle, DiagramStyleConfig> = {
  dark: {
    canvasBgColor: '#0D0D0D',
    patternColor: '#252525',
    minimapBg: '#141414',
    minimapMask: 'rgba(13, 13, 13, 0.7)',
  },
  blueprint: {
    canvasBgColor: '#0a1628',
    patternColor: '#1e3a5f',
    minimapBg: '#0d1e36',
    minimapMask: 'rgba(10, 22, 40, 0.7)',
  },
};

export function parseDiagramPrefs(raw: string | null): DiagramPrefs {
  if (!raw) return { ...DEFAULTS };

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    const style =
      typeof parsed.style === 'string' && VALID_STYLES.has(parsed.style)
        ? (parsed.style as DiagramStyle)
        : DEFAULTS.style;

    const snapToGrid =
      typeof parsed.snapToGrid === 'boolean'
        ? parsed.snapToGrid
        : DEFAULTS.snapToGrid;

    const gridSize =
      typeof parsed.gridSize === 'number' &&
      parsed.gridSize >= 5 &&
      parsed.gridSize <= 100
        ? parsed.gridSize
        : DEFAULTS.gridSize;

    const backgroundVariant =
      typeof parsed.backgroundVariant === 'string' &&
      VALID_VARIANTS.has(parsed.backgroundVariant)
        ? (parsed.backgroundVariant as BackgroundPattern)
        : DEFAULTS.backgroundVariant;

    return { style, snapToGrid, gridSize, backgroundVariant };
  } catch {
    return { ...DEFAULTS };
  }
}

export function serializeDiagramPrefs(prefs: DiagramPrefs): string {
  return JSON.stringify(prefs);
}
