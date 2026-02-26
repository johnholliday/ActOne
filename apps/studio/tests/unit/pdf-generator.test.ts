/**
 * T044: PDF generator tests.
 *
 * Verifies PDF structure generation, page count estimation,
 * spine width calculation, and TRIM_SIZES constants.
 */

import { describe, it, expect } from 'vitest';

import {
  generatePdfStructure,
  estimatePageCount,
  calculateSpineWidth,
  TRIM_SIZES,
} from '$lib/publishing/pdf-generator.js';
import { createTestManuscript } from '../fixtures/factories.js';

describe('generatePdfStructure', () => {
  it('generates PDF structure with correct config', () => {
    const manuscript = createTestManuscript();
    const result = generatePdfStructure(manuscript);

    expect(result.config).toBeDefined();
    expect(result.pageWidth).toBeGreaterThan(0);
    expect(result.pageHeight).toBeGreaterThan(0);
    expect(result.pageCount).toBeGreaterThan(0);
    expect(result.spineWidth).toBeGreaterThan(0);
    expect(result.safeArea).toBeDefined();
    expect(result.manuscript).toBe(manuscript);
  });

  it('calculates safe area within page bounds', () => {
    const manuscript = createTestManuscript();
    const result = generatePdfStructure(manuscript);

    expect(result.safeArea.left).toBeGreaterThan(0);
    expect(result.safeArea.right).toBeLessThan(result.pageWidth);
    expect(result.safeArea.top).toBeGreaterThan(0);
    expect(result.safeArea.bottom).toBeLessThan(result.pageHeight);
  });
});

describe('estimatePageCount', () => {
  it('returns positive number for non-zero words', () => {
    const pageCount = estimatePageCount(50000);

    expect(pageCount).toBeGreaterThan(0);
    expect(Number.isInteger(pageCount)).toBe(true);
  });

  it('returns 0 for 0 words', () => {
    expect(estimatePageCount(0)).toBe(0);
  });

  it('scales linearly with word count', () => {
    const pages100k = estimatePageCount(100000);
    const pages50k = estimatePageCount(50000);

    expect(pages100k).toBe(pages50k * 2);
  });
});

describe('calculateSpineWidth', () => {
  it('increases with page count', () => {
    const spine100 = calculateSpineWidth(100, 'cream');
    const spine300 = calculateSpineWidth(300, 'cream');

    expect(spine300).toBeGreaterThan(spine100);
  });

  it('differs between white and cream paper', () => {
    const white = calculateSpineWidth(200, 'white');
    const cream = calculateSpineWidth(200, 'cream');

    expect(white).not.toBe(cream);
    // Cream paper is thicker
    expect(cream).toBeGreaterThan(white);
  });

  it('returns 0 for 0 pages', () => {
    expect(calculateSpineWidth(0, 'cream')).toBe(0);
  });
});

describe('TRIM_SIZES', () => {
  it('includes standard 6x9 size', () => {
    const size6x9 = TRIM_SIZES.find((s) => s.width === 6.0 && s.height === 9.0);
    expect(size6x9).toBeDefined();
    expect(size6x9!.name).toContain('6');
    expect(size6x9!.name).toContain('9');
  });

  it('has at least 3 standard sizes', () => {
    expect(TRIM_SIZES.length).toBeGreaterThanOrEqual(3);
  });

  it('all sizes have positive dimensions', () => {
    for (const size of TRIM_SIZES) {
      expect(size.width).toBeGreaterThan(0);
      expect(size.height).toBeGreaterThan(0);
      expect(size.name.length).toBeGreaterThan(0);
    }
  });
});
