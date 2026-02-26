/**
 * T045: Panel generator tests.
 *
 * Verifies camera angle suggestion, layout suggestion,
 * layout retrieval, and PANEL_LAYOUTS constants.
 */

import { describe, it, expect } from 'vitest';

import {
  suggestCameraAngle,
  suggestLayout,
  getLayout,
  PANEL_LAYOUTS,
} from '$lib/graphic-novel/panel-generator.js';

describe('suggestCameraAngle', () => {
  it('returns close-up or extreme-close-up for high intensity', () => {
    const angle = suggestCameraAngle(0.95);

    expect(['close-up', 'extreme-close-up']).toContain(angle);
  });

  it('returns wide or bird-eye for low intensity', () => {
    const angle = suggestCameraAngle(0.1);

    expect(['wide', 'bird-eye']).toContain(angle);
  });

  it('returns medium for moderate intensity', () => {
    const angle = suggestCameraAngle(0.6);

    expect(angle).toBe('medium');
  });

  it('returns extreme-close-up at intensity 0.9', () => {
    const angle = suggestCameraAngle(0.9);

    expect(angle).toBe('extreme-close-up');
  });

  it('returns wide at intensity 0.3', () => {
    const angle = suggestCameraAngle(0.3);

    expect(angle).toBe('wide');
  });
});

describe('suggestLayout', () => {
  it('returns a valid layout ID', () => {
    const layoutId = suggestLayout('Action');
    const validIds = PANEL_LAYOUTS.map((l) => l.id);

    expect(validIds).toContain(layoutId);
  });

  it('returns different layouts for different scene types', () => {
    const actionLayout = suggestLayout('Action');
    const reflectionLayout = suggestLayout('Reflection');

    expect(actionLayout).not.toBe(reflectionLayout);
  });

  it('returns full-bleed for Climax', () => {
    expect(suggestLayout('Climax')).toBe('full-bleed');
  });

  it('returns a default layout for unknown scene types', () => {
    const layoutId = suggestLayout('UnknownType');
    const validIds = PANEL_LAYOUTS.map((l) => l.id);

    expect(validIds).toContain(layoutId);
  });
});

describe('getLayout', () => {
  it('returns layout with panels array', () => {
    const layout = getLayout('4-grid');

    expect(layout).toBeDefined();
    expect(layout!.panels).toBeDefined();
    expect(Array.isArray(layout!.panels)).toBe(true);
    expect(layout!.panels.length).toBeGreaterThan(0);
  });

  it('returns undefined for unknown layout ID', () => {
    const layout = getLayout('nonexistent-layout');

    expect(layout).toBeUndefined();
  });

  it('panel rects have normalized coordinates', () => {
    const layout = getLayout('4-grid');

    for (const panel of layout!.panels) {
      expect(panel.x).toBeGreaterThanOrEqual(0);
      expect(panel.x).toBeLessThanOrEqual(1);
      expect(panel.y).toBeGreaterThanOrEqual(0);
      expect(panel.y).toBeLessThanOrEqual(1);
      expect(panel.width).toBeGreaterThan(0);
      expect(panel.height).toBeGreaterThan(0);
    }
  });
});

describe('PANEL_LAYOUTS', () => {
  it('has at least one layout', () => {
    expect(PANEL_LAYOUTS.length).toBeGreaterThan(0);
  });

  it('every layout has id, name, and panels', () => {
    for (const layout of PANEL_LAYOUTS) {
      expect(layout.id).toBeDefined();
      expect(layout.id.length).toBeGreaterThan(0);
      expect(layout.name).toBeDefined();
      expect(layout.name.length).toBeGreaterThan(0);
      expect(layout.panels).toBeDefined();
      expect(layout.panels.length).toBeGreaterThan(0);
    }
  });
});
