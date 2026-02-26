/**
 * T119: KDP (Kindle Direct Publishing) configuration.
 *
 * Trim sizes, spine width formulas, bleed specifications.
 */

export interface KdpTrimSize {
  width: number;
  height: number;
  name: string;
  category: 'standard' | 'large';
}

export const KDP_TRIM_SIZES: KdpTrimSize[] = [
  { width: 5.0, height: 8.0, name: '5" x 8"', category: 'standard' },
  { width: 5.25, height: 8.0, name: '5.25" x 8"', category: 'standard' },
  { width: 5.5, height: 8.5, name: '5.5" x 8.5"', category: 'standard' },
  { width: 6.0, height: 9.0, name: '6" x 9"', category: 'standard' },
  { width: 6.14, height: 9.21, name: '6.14" x 9.21"', category: 'standard' },
  { width: 6.69, height: 9.61, name: '6.69" x 9.61"', category: 'standard' },
  { width: 7.0, height: 10.0, name: '7" x 10"', category: 'standard' },
  { width: 7.5, height: 9.25, name: '7.5" x 9.25"', category: 'standard' },
  { width: 8.0, height: 10.0, name: '8" x 10"', category: 'large' },
  { width: 8.5, height: 11.0, name: '8.5" x 11"', category: 'large' },
];

export interface KdpPaperType {
  id: 'white' | 'cream';
  name: string;
  pagesPerInch: number; // pages per inch of spine
}

export const KDP_PAPER_TYPES: KdpPaperType[] = [
  { id: 'white', name: 'White', pagesPerInch: 444 },
  { id: 'cream', name: 'Cream', pagesPerInch: 400 },
];

/**
 * Calculate spine width for KDP.
 */
export function calculateKdpSpineWidth(
  pageCount: number,
  paperType: 'white' | 'cream',
): number {
  const paper = KDP_PAPER_TYPES.find((p) => p.id === paperType) ?? KDP_PAPER_TYPES[1]!;
  return pageCount / paper.pagesPerInch;
}

/**
 * KDP bleed requirements.
 */
export const KDP_BLEED = {
  top: 0.125,
  bottom: 0.125,
  outside: 0.125,
  inside: 0, // no bleed on inside edge
} as const;

/**
 * KDP minimum margins (without bleed).
 */
export function getKdpMinMargins(pageCount: number): {
  inside: number;
  outside: number;
  top: number;
  bottom: number;
} {
  let inside: number;
  if (pageCount <= 150) inside = 0.375;
  else if (pageCount <= 400) inside = 0.5;
  else if (pageCount <= 600) inside = 0.625;
  else inside = 0.875;

  return {
    inside,
    outside: 0.25,
    top: 0.25,
    bottom: 0.25,
  };
}

/**
 * Calculate full cover dimensions for KDP.
 */
export function calculateCoverDimensions(
  trimWidth: number,
  trimHeight: number,
  spineWidth: number,
  bleed = 0.125,
): { width: number; height: number; spineLeft: number; spineRight: number } {
  const width = (2 * trimWidth) + spineWidth + (2 * bleed);
  const height = trimHeight + (2 * bleed);
  const spineLeft = trimWidth + bleed;
  const spineRight = spineLeft + spineWidth;

  return { width, height, spineLeft, spineRight };
}
