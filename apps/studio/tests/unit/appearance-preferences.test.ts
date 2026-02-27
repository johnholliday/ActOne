import { describe, it, expect } from 'vitest';
import {
  parseAppearancePrefs,
  serializeAppearancePrefs,
  type AppearancePrefs,
} from '$lib/settings/appearance.js';

const DEFAULTS: AppearancePrefs = {
  theme: 'dark',
  fontSize: 14,
  fontFamily: 'JetBrains Mono',
};

describe('parseAppearancePrefs', () => {
  it('returns defaults for null input', () => {
    expect(parseAppearancePrefs(null)).toEqual(DEFAULTS);
  });

  it('returns defaults for empty string', () => {
    expect(parseAppearancePrefs('')).toEqual(DEFAULTS);
  });

  it('returns defaults for invalid JSON', () => {
    expect(parseAppearancePrefs('not json {')).toEqual(DEFAULTS);
  });

  it('parses valid complete prefs', () => {
    const raw = JSON.stringify({ theme: 'light', fontSize: 18, fontFamily: 'Fira Code' });
    expect(parseAppearancePrefs(raw)).toEqual({
      theme: 'light',
      fontSize: 18,
      fontFamily: 'Fira Code',
    });
  });

  it('uses defaults for invalid theme type', () => {
    const raw = JSON.stringify({ theme: 'neon', fontSize: 16, fontFamily: 'Menlo' });
    expect(parseAppearancePrefs(raw)).toEqual({
      theme: 'dark',
      fontSize: 16,
      fontFamily: 'Menlo',
    });
  });

  it('uses defaults for invalid fontSize type', () => {
    const raw = JSON.stringify({ theme: 'dark', fontSize: 'big', fontFamily: 'Menlo' });
    expect(parseAppearancePrefs(raw)).toEqual({
      theme: 'dark',
      fontSize: 14,
      fontFamily: 'Menlo',
    });
  });

  it('uses defaults for invalid fontFamily type', () => {
    const raw = JSON.stringify({ theme: 'dark', fontSize: 16, fontFamily: 42 });
    expect(parseAppearancePrefs(raw)).toEqual({
      theme: 'dark',
      fontSize: 16,
      fontFamily: 'JetBrains Mono',
    });
  });

  it('accepts all 3 theme values', () => {
    for (const theme of ['dark', 'light', 'system'] as const) {
      const raw = JSON.stringify({ theme });
      expect(parseAppearancePrefs(raw).theme).toBe(theme);
    }
  });

  it('fills defaults for partial valid prefs', () => {
    const raw = JSON.stringify({ theme: 'system' });
    expect(parseAppearancePrefs(raw)).toEqual({
      theme: 'system',
      fontSize: 14,
      fontFamily: 'JetBrains Mono',
    });
  });

  it('round-trip serialize then parse', () => {
    const prefs: AppearancePrefs = {
      theme: 'light',
      fontSize: 20,
      fontFamily: 'Cascadia Code',
    };
    const serialized = serializeAppearancePrefs(prefs);
    expect(parseAppearancePrefs(serialized)).toEqual(prefs);
  });
});

describe('serializeAppearancePrefs', () => {
  it('produces valid JSON', () => {
    const result = serializeAppearancePrefs(DEFAULTS);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('includes all fields', () => {
    const result = JSON.parse(serializeAppearancePrefs(DEFAULTS));
    expect(result).toEqual({ theme: 'dark', fontSize: 14, fontFamily: 'JetBrains Mono' });
  });
});
