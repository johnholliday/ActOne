/**
 * T031: Lifecycle transition logic tests.
 *
 * Tests canTransition(), getValidTargets(), getStageLabel(),
 * and getTransition() for the full lifecycle state graph.
 */

import { describe, it, expect } from 'vitest';
import {
  canTransition,
  getValidTargets,
  getStageLabel,
  getTransition,
} from '$lib/project/lifecycle.js';
import type { LifecycleStage } from '@actone/shared';

describe('canTransition', () => {
  it('allows concept → draft', () => {
    expect(canTransition('concept', 'draft')).toBe(true);
  });

  it('allows draft → revision', () => {
    expect(canTransition('draft', 'revision')).toBe(true);
  });

  it('allows revision → draft (back to draft)', () => {
    expect(canTransition('revision', 'draft')).toBe(true);
  });

  it('allows revision → final', () => {
    expect(canTransition('revision', 'final')).toBe(true);
  });

  it('allows final → revision (back to revision)', () => {
    expect(canTransition('final', 'revision')).toBe(true);
  });

  it('allows final → published', () => {
    expect(canTransition('final', 'published')).toBe(true);
  });

  it('rejects concept → published (skip stages)', () => {
    expect(canTransition('concept', 'published')).toBe(false);
  });

  it('rejects concept → revision', () => {
    expect(canTransition('concept', 'revision')).toBe(false);
  });

  it('rejects concept → final', () => {
    expect(canTransition('concept', 'final')).toBe(false);
  });

  it('allows draft → final', () => {
    expect(canTransition('draft', 'final')).toBe(true);
  });

  it('rejects draft → published', () => {
    expect(canTransition('draft', 'published')).toBe(false);
  });

  it('rejects published → any (terminal state)', () => {
    const stages: LifecycleStage[] = ['concept', 'draft', 'revision', 'final', 'published'];
    for (const target of stages) {
      expect(canTransition('published', target)).toBe(false);
    }
  });

  it('rejects self-transitions', () => {
    const stages: LifecycleStage[] = ['concept', 'draft', 'revision', 'final', 'published'];
    for (const stage of stages) {
      expect(canTransition(stage, stage)).toBe(false);
    }
  });
});

describe('getValidTargets', () => {
  it('concept can only go to draft', () => {
    expect(getValidTargets('concept')).toEqual(['draft']);
  });

  it('draft can go to revision or final', () => {
    const targets = getValidTargets('draft');
    expect(targets).toContain('revision');
    expect(targets).toContain('final');
    expect(targets).toHaveLength(2);
  });

  it('revision can go to draft or final', () => {
    const targets = getValidTargets('revision');
    expect(targets).toContain('draft');
    expect(targets).toContain('final');
    expect(targets).toHaveLength(2);
  });

  it('final can go to revision or published', () => {
    const targets = getValidTargets('final');
    expect(targets).toContain('revision');
    expect(targets).toContain('published');
    expect(targets).toHaveLength(2);
  });

  it('published has no valid targets (terminal state)', () => {
    expect(getValidTargets('published')).toEqual([]);
  });
});

describe('getStageLabel', () => {
  it('returns "Concept" for concept', () => {
    expect(getStageLabel('concept')).toBe('Concept');
  });

  it('returns "Draft" for draft', () => {
    expect(getStageLabel('draft')).toBe('Draft');
  });

  it('returns "Revision" for revision', () => {
    expect(getStageLabel('revision')).toBe('Revision');
  });

  it('returns "Final" for final', () => {
    expect(getStageLabel('final')).toBe('Final');
  });

  it('returns "Published" for published', () => {
    expect(getStageLabel('published')).toBe('Published');
  });
});

describe('getTransition', () => {
  it('returns transition metadata for valid transitions', () => {
    const transition = getTransition('concept', 'draft');
    expect(transition).not.toBeNull();
    expect(transition?.from).toBe('concept');
    expect(transition?.to).toBe('draft');
  });

  it('returns null for invalid transitions', () => {
    expect(getTransition('concept', 'published')).toBeNull();
  });

  it('returns null for self-transitions', () => {
    expect(getTransition('concept', 'concept')).toBeNull();
  });
});
