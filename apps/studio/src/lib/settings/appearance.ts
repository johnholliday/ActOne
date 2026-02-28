/**
 * Appearance preferences logic extracted from settings/appearance page.
 */

export interface AppearancePrefs {
  theme: 'dark' | 'light' | 'system';
  fontSize: number;
  fontFamily: string;
  wordWrap: boolean;
}

const DEFAULTS: AppearancePrefs = {
  theme: 'dark',
  fontSize: 14,
  fontFamily: 'JetBrains Mono',
  wordWrap: false,
};

const VALID_THEMES = new Set<string>(['dark', 'light', 'system']);

export function parseAppearancePrefs(raw: string | null): AppearancePrefs {
  if (!raw) return { ...DEFAULTS };

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    const theme =
      typeof parsed.theme === 'string' && VALID_THEMES.has(parsed.theme)
        ? (parsed.theme as AppearancePrefs['theme'])
        : DEFAULTS.theme;

    const fontSize =
      typeof parsed.fontSize === 'number'
        ? parsed.fontSize
        : DEFAULTS.fontSize;

    const fontFamily =
      typeof parsed.fontFamily === 'string'
        ? parsed.fontFamily
        : DEFAULTS.fontFamily;

    const wordWrap =
      typeof parsed.wordWrap === 'boolean'
        ? parsed.wordWrap
        : DEFAULTS.wordWrap;

    return { theme, fontSize, fontFamily, wordWrap };
  } catch {
    return { ...DEFAULTS };
  }
}

export function serializeAppearancePrefs(prefs: AppearancePrefs): string {
  return JSON.stringify(prefs);
}
