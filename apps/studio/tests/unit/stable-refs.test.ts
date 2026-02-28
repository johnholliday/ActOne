/**
 * T034: Stable content-addressable ID generation tests.
 *
 * Tests stableId(), parseStableId(), stableEdgeId(), stableGroupId()
 * for determinism, collision-freedom, and format correctness.
 */

import { describe, it, expect } from 'vitest';
import {
  stableId,
  parseStableId,
  stableEdgeId,
  stableGroupId,
} from '$lib/diagrams/operations/stable-refs.js';
import type { ElementType } from '$lib/diagrams/operations/stable-refs.js';

describe('stableId', () => {
  it('generates ID in format "type:name"', () => {
    expect(stableId('character', 'Elena')).toBe('character:Elena');
  });

  it('is deterministic (same input → same ID)', () => {
    const id1 = stableId('scene', 'Opening');
    const id2 = stableId('scene', 'Opening');
    expect(id1).toBe(id2);
  });

  it('is collision-free (different inputs → different IDs)', () => {
    const id1 = stableId('character', 'Elena');
    const id2 = stableId('character', 'Marco');
    const id3 = stableId('scene', 'Elena');
    expect(id1).not.toBe(id2);
    expect(id1).not.toBe(id3); // same name, different type
  });

  it('handles all element types', () => {
    const types: ElementType[] = [
      'character', 'scene', 'world', 'location', 'theme',
      'timeline', 'layer', 'plot', 'subplot', 'interaction',
      'beat', 'chapter',
    ];
    for (const type of types) {
      const id = stableId(type, 'TestName');
      expect(id).toBe(`${type}:TestName`);
    }
  });

  it('handles names with spaces and special characters', () => {
    const id = stableId('character', 'Dr. Strange');
    expect(id).toBe('character:Dr. Strange');
  });
});

describe('parseStableId', () => {
  it('parses a valid stable ID', () => {
    const result = parseStableId('character:Elena');
    expect(result).toEqual({ type: 'character', name: 'Elena' });
  });

  it('parses ID with complex name', () => {
    const result = parseStableId('scene:The Opening');
    expect(result).toEqual({ type: 'scene', name: 'The Opening' });
  });

  it('returns null for invalid ID (no colon)', () => {
    expect(parseStableId('invalid')).toBeNull();
  });

  it('round-trips with stableId', () => {
    const original = stableId('world', 'QuantumLab');
    const parsed = parseStableId(original);
    expect(parsed).toEqual({ type: 'world', name: 'QuantumLab' });
  });

  it('handles name containing colons', () => {
    const result = parseStableId('character:name:with:colons');
    expect(result).toEqual({ type: 'character', name: 'name:with:colons' });
  });
});

describe('stableEdgeId', () => {
  it('generates edge ID without label', () => {
    const id = stableEdgeId('character', 'Elena', 'character', 'Marco');
    expect(id).toBe('character:Elena->character:Marco');
  });

  it('generates edge ID with label', () => {
    const id = stableEdgeId('character', 'Elena', 'character', 'Marco', 'friend');
    expect(id).toBe('character:Elena->character:Marco[friend]');
  });

  it('is deterministic', () => {
    const id1 = stableEdgeId('scene', 'A', 'scene', 'B', 'follows');
    const id2 = stableEdgeId('scene', 'A', 'scene', 'B', 'follows');
    expect(id1).toBe(id2);
  });

  it('differentiates by direction', () => {
    const id1 = stableEdgeId('character', 'A', 'character', 'B');
    const id2 = stableEdgeId('character', 'B', 'character', 'A');
    expect(id1).not.toBe(id2);
  });
});

describe('stableGroupId', () => {
  it('generates group ID with "group:" prefix', () => {
    const id = stableGroupId('chapter', 'Act1');
    expect(id).toBe('group:chapter:Act1');
  });

  it('is deterministic', () => {
    const id1 = stableGroupId('world', 'QuantumLab');
    const id2 = stableGroupId('world', 'QuantumLab');
    expect(id1).toBe(id2);
  });
});
