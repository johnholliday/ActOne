import { describe, it, expect } from 'vitest';
import {
  filterAndSortAssets,
  toggleCompareSelection,
} from '$lib/gallery/gallery-filters.js';
import type { GalleryAsset } from '$lib/gallery/asset-mapping.js';

function makeAsset(overrides: Partial<GalleryAsset> = {}): GalleryAsset {
  return {
    id: 'a1',
    type: 'portrait',
    label: 'Asset One',
    storageUrl: '',
    status: 'pending',
    createdAt: '2026-01-10T00:00:00Z',
    prompt: '',
    backend: '',
    ...overrides,
  };
}

const assets: GalleryAsset[] = [
  makeAsset({ id: '1', type: 'portrait', label: 'Alpha', createdAt: '2026-01-01T00:00:00Z' }),
  makeAsset({ id: '2', type: 'scene', label: 'Beta', createdAt: '2026-01-03T00:00:00Z' }),
  makeAsset({ id: '3', type: 'portrait', label: 'Charlie', createdAt: '2026-01-02T00:00:00Z' }),
  makeAsset({ id: '4', type: 'cover', label: 'delta', createdAt: '2026-01-04T00:00:00Z' }),
];

describe('filterAndSortAssets', () => {
  it('returns all assets with filter=all and no search', () => {
    const result = filterAndSortAssets(assets, 'all', '', 'newest');
    expect(result).toHaveLength(4);
  });

  it('filters by type', () => {
    const result = filterAndSortAssets(assets, 'portrait', '', 'newest');
    expect(result).toHaveLength(2);
    expect(result.every((a) => a.type === 'portrait')).toBe(true);
  });

  it('filters by search query (case-insensitive)', () => {
    const result = filterAndSortAssets(assets, 'all', 'ALPHA', 'newest');
    expect(result).toHaveLength(1);
    expect(result[0]!.label).toBe('Alpha');
  });

  it('combines type filter and search', () => {
    const result = filterAndSortAssets(assets, 'portrait', 'charlie', 'newest');
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('3');
  });

  it('sorts newest first', () => {
    const result = filterAndSortAssets(assets, 'all', '', 'newest');
    expect(result.map((a) => a.id)).toEqual(['4', '2', '3', '1']);
  });

  it('sorts oldest first', () => {
    const result = filterAndSortAssets(assets, 'all', '', 'oldest');
    expect(result.map((a) => a.id)).toEqual(['1', '3', '2', '4']);
  });

  it('sorts by name', () => {
    const result = filterAndSortAssets(assets, 'all', '', 'name');
    expect(result.map((a) => a.label)).toEqual(['Alpha', 'Beta', 'Charlie', 'delta']);
  });

  it('returns empty array for no match', () => {
    const result = filterAndSortAssets(assets, 'all', 'zzzzz', 'newest');
    expect(result).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    const result = filterAndSortAssets([], 'all', '', 'newest');
    expect(result).toEqual([]);
  });
});

describe('toggleCompareSelection', () => {
  it('adds an id to empty selection', () => {
    expect(toggleCompareSelection([], 'a1')).toEqual(['a1']);
  });

  it('adds a second id when under max', () => {
    expect(toggleCompareSelection(['a1'], 'a2')).toEqual(['a1', 'a2']);
  });

  it('removes an already-selected id', () => {
    expect(toggleCompareSelection(['a1', 'a2'], 'a1')).toEqual(['a2']);
  });

  it('does not add beyond max (default 2)', () => {
    const result = toggleCompareSelection(['a1', 'a2'], 'a3');
    expect(result).toEqual(['a1', 'a2']);
  });

  it('respects custom max', () => {
    const result = toggleCompareSelection(['a1', 'a2', 'a3'], 'a4', 3);
    expect(result).toEqual(['a1', 'a2', 'a3']);
  });

  it('can deselect when at max', () => {
    const result = toggleCompareSelection(['a1', 'a2'], 'a2');
    expect(result).toEqual(['a1']);
  });
});
