import { describe, it, expect } from 'vitest';
import {
  parseLayoutPrefs,
  serializeLayoutPrefs,
  type LayoutPrefs,
} from '$lib/settings/layout.js';

const DEFAULTS: LayoutPrefs = {
  sidebarWidth: 256,
  sidebarVisible: true,
  bottomPanelHeight: 192,
  bottomPanelVisible: true,
  outlineWidth: 224,
  outlineVisible: true,
  outlineDockPosition: 'right',
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
      bottomPanelHeight: 250,
      bottomPanelVisible: false,
      outlineWidth: 180,
      outlineVisible: false,
      outlineDockPosition: 'bottom',
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

  it('uses default for invalid bottomPanelHeight type', () => {
    const raw = JSON.stringify({ bottomPanelHeight: null });
    expect(parseLayoutPrefs(raw).bottomPanelHeight).toBe(192);
  });

  it('uses default for invalid bottomPanelVisible type', () => {
    const raw = JSON.stringify({ bottomPanelVisible: 'yes' });
    expect(parseLayoutPrefs(raw).bottomPanelVisible).toBe(true);
  });

  it('uses default for invalid outlineWidth type', () => {
    const raw = JSON.stringify({ outlineWidth: false });
    expect(parseLayoutPrefs(raw).outlineWidth).toBe(224);
  });

  it('uses default for invalid outlineVisible type', () => {
    const raw = JSON.stringify({ outlineVisible: 0 });
    expect(parseLayoutPrefs(raw).outlineVisible).toBe(true);
  });

  it('uses default for invalid outlineDockPosition', () => {
    const raw = JSON.stringify({ outlineDockPosition: 'left' });
    expect(parseLayoutPrefs(raw).outlineDockPosition).toBe('right');
  });

  it('accepts both valid dock positions', () => {
    for (const pos of ['right', 'bottom'] as const) {
      const raw = JSON.stringify({ outlineDockPosition: pos });
      expect(parseLayoutPrefs(raw).outlineDockPosition).toBe(pos);
    }
  });

  it('round-trip serialize then parse', () => {
    const prefs: LayoutPrefs = {
      sidebarWidth: 350,
      sidebarVisible: false,
      bottomPanelHeight: 300,
      bottomPanelVisible: true,
      outlineWidth: 200,
      outlineVisible: false,
      outlineDockPosition: 'bottom',
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
