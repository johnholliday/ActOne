/**
 * Gallery filtering and sorting logic extracted from gallery/+page.svelte.
 */

import type { GalleryAsset } from './asset-mapping.js';

export function filterAndSortAssets(
  assets: GalleryAsset[],
  filter: string,
  searchQuery: string,
  sortBy: 'newest' | 'oldest' | 'name',
): GalleryAsset[] {
  return assets
    .filter((a) => filter === 'all' || a.type === filter)
    .filter(
      (a) =>
        searchQuery === '' ||
        a.label.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt.localeCompare(a.createdAt);
      if (sortBy === 'oldest') return a.createdAt.localeCompare(b.createdAt);
      return a.label.localeCompare(b.label);
    });
}

export function toggleCompareSelection(
  selected: string[],
  id: string,
  max = 2,
): string[] {
  if (selected.includes(id)) {
    return selected.filter((s) => s !== id);
  }
  if (selected.length < max) {
    return [...selected, id];
  }
  return selected;
}
