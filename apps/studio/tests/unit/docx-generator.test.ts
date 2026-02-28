/**
 * T043: DOCX generator tests.
 *
 * Verifies that generateDocxSections produces structured sections
 * and DOCX_FORMAT contains expected typography values.
 */

import { describe, it, expect } from 'vitest';

import { generateDocxSections, DOCX_FORMAT } from '$lib/publishing/docx-generator.js';
import { createTestManuscript } from '../fixtures/factories.js';

describe('generateDocxSections', () => {
  it('generates title section', () => {
    const manuscript = createTestManuscript();
    const sections = generateDocxSections(manuscript);

    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0]!.type).toBe('title');
    expect(sections[0]!.heading).toBe(manuscript.frontMatter.titlePage.title);
  });

  it('generates chapter sections', () => {
    const manuscript = createTestManuscript();
    const sections = generateDocxSections(manuscript);

    const chapterSections = sections.filter((s) => s.type === 'chapter');
    expect(chapterSections).toHaveLength(manuscript.chapters.length);

    for (const chapter of chapterSections) {
      expect(chapter.heading).toBeDefined();
      expect(chapter.heading!.length).toBeGreaterThan(0);
      expect(chapter.paragraphs).toBeDefined();
      expect(chapter.paragraphs!.length).toBeGreaterThan(0);
    }
  });

  it('includes page breaks between chapters', () => {
    const manuscript = createTestManuscript();
    const sections = generateDocxSections(manuscript);

    const pageBreaks = sections.filter((s) => s.type === 'pageBreak');
    // One page break after title + one between each pair of chapters
    expect(pageBreaks.length).toBeGreaterThan(0);
  });

  it('includes header with author and title', () => {
    const manuscript = createTestManuscript();
    const sections = generateDocxSections(manuscript);

    const chapterSections = sections.filter((s) => s.type === 'chapter');
    for (const chapter of chapterSections) {
      expect(chapter.header).toBeDefined();
      expect(chapter.header).toContain(manuscript.frontMatter.titlePage.author);
      expect(chapter.header).toContain(manuscript.frontMatter.titlePage.title);
    }
  });
});

describe('DOCX_FORMAT', () => {
  it('has expected typography values', () => {
    expect(DOCX_FORMAT.fontSize).toBe(24); // 12pt in half-points
    expect(DOCX_FORMAT.fontFamily).toBe('Times New Roman');
    expect(DOCX_FORMAT.lineSpacing).toBe(480); // double spacing in twips
  });

  it('has margin values', () => {
    expect(DOCX_FORMAT.marginTop).toBe(1440); // 1 inch in twips
    expect(DOCX_FORMAT.marginBottom).toBe(1440);
    expect(DOCX_FORMAT.marginLeft).toBe(1440);
    expect(DOCX_FORMAT.marginRight).toBe(1440);
  });

  it('has paragraph indent', () => {
    expect(DOCX_FORMAT.indent).toBe(720); // 0.5 inch
  });
});
