/**
 * T117: PDF generator.
 *
 * Configurable trim size, paper type, spine width, gutter, bleed, safe area.
 */

import type { Manuscript } from './manuscript-assembler.js';

export interface PdfConfig {
  trimSize: TrimSize;
  paperType: 'white' | 'cream';
  bleed: number; // inches
  gutter: number; // inches
  margins: { top: number; bottom: number; inside: number; outside: number }; // inches
}

export interface TrimSize {
  width: number; // inches
  height: number; // inches
  name: string;
}

export const TRIM_SIZES: TrimSize[] = [
  { width: 5.0, height: 8.0, name: '5" x 8"' },
  { width: 5.5, height: 8.5, name: '5.5" x 8.5"' },
  { width: 6.0, height: 9.0, name: '6" x 9"' },
  { width: 6.14, height: 9.21, name: '6.14" x 9.21" (A5)' },
  { width: 8.5, height: 11.0, name: '8.5" x 11" (Letter)' },
];

const DEFAULT_CONFIG: PdfConfig = {
  trimSize: TRIM_SIZES[2]!, // 6x9
  paperType: 'cream',
  bleed: 0.125,
  gutter: 0,
  margins: { top: 0.75, bottom: 0.75, inside: 0.875, outside: 0.625 },
};

/**
 * Calculate spine width based on page count and paper type.
 */
export function calculateSpineWidth(
  pageCount: number,
  paperType: 'white' | 'cream',
): number {
  const ppi = paperType === 'white' ? 0.002252 : 0.0025;
  return pageCount * ppi;
}

/**
 * Estimate page count from word count.
 * ~250 words per page for standard fiction formatting.
 */
export function estimatePageCount(wordCount: number): number {
  return Math.ceil(wordCount / 250);
}

/**
 * Generate PDF document structure from a manuscript.
 * Returns configuration and content for use with a PDF library (e.g., pdfkit).
 */
export function generatePdfStructure(
  manuscript: Manuscript,
  config: PdfConfig = DEFAULT_CONFIG,
) {
  const pageCount = estimatePageCount(manuscript.wordCount);
  const spineWidth = calculateSpineWidth(pageCount, config.paperType);

  const pageWidth = config.trimSize.width + (2 * config.bleed);
  const pageHeight = config.trimSize.height + (2 * config.bleed);

  const safeArea = {
    left: config.bleed + config.margins.inside,
    right: pageWidth - config.bleed - config.margins.outside,
    top: config.bleed + config.margins.top,
    bottom: pageHeight - config.bleed - config.margins.bottom,
  };

  return {
    config,
    pageWidth,
    pageHeight,
    pageCount,
    spineWidth,
    safeArea,
    manuscript,
  };
}
