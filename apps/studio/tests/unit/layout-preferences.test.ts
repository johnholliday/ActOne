import { describe, it, expect } from 'vitest';
import {
  parseLayoutPrefs,
  serializeLayoutPrefs,
  type LayoutPrefs,
} from '$lib/settings/layout.js';

const DEFAULTS: LayoutPrefs = {
  sidebarWidth: 256,
  sidebarVisible: true,
  outlineVisible: true,
  outlineWidth: 240,
  statusBarVisible: true,
};

describe('parseLayoutPrefs', () => {
  it('returns defaults for null input', () => {
    expect(parseLayoutPrefs(null)).toEqual(DEFAULTS);
  });

  it('returns defaults for empty string', () => {
    expect(parseLayoutPrefs('')).toEqual(DEFAULTS);
  });

  it('returns defaults for invalid JSON', () => {
    expect(parseLayoutPrefs('not json {')).toEqual(DEFAULTS);
  });

  it('parses valid complete prefs', () => {
    const prefs: LayoutPrefs = {
      sidebarWidth: 300,
      sidebarVisible: false,
      outlineVisible: true,
      outlineWidth: 280,
      statusBarVisible: true,
    };
    const raw = JSON.stringify(prefs);
    expect(parseLayoutPrefs(raw)).toEqual(prefs);
  });

  it('fills defaults for partial valid prefs', () => {
    const raw = JSON.stringify({ sidebarWidth: 320 });
    expect(parseLayoutPrefs(raw)).toEqual({
      ...DEFAULTS,
      sidebarWidth: 320,
    });
  });

  it('uses default for invalid sidebarWidth type', () => {
    const raw = JSON.stringify({ sidebarWidth: 'wide' });
    expect(parseLayoutPrefs(raw).sidebarWidth).toBe(256);
  });

  it('uses default for invalid sidebarVisible type', () => {
    const raw = JSON.stringify({ sidebarVisible: 1 });
    expect(parseLayoutPrefs(raw).sidebarVisible).toBe(true);
  });

  it('ignores unknown fields', () => {
    const raw = JSON.stringify({ sidebarWidth: 280, extra: 'ignored' });
    expect(parseLayoutPrefs(raw)).toEqual({
      ...DEFAULTS,
      sidebarWidth: 280,
    });
  });

  it('round-trip serialize then parse', () => {
    const prefs: LayoutPrefs = {
      sidebarWidth: 350,
      sidebarVisible: false,
      outlineVisible: false,
      outlineWidth: 200,
      statusBarVisible: true,
    };
    const serialized = serializeLayoutPrefs(prefs);
    expect(parseLayoutPrefs(serialized)).toEqual(prefs);
  });
});

describe('serializeLayoutPrefs', () => {
  it('produces valid JSON', () => {
    const result = serializeLayoutPrefs(DEFAULTS);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('includes all fields', () => {
    const result = JSON.parse(serializeLayoutPrefs(DEFAULTS));
    expect(result).toEqual(DEFAULTS);
  });
});
