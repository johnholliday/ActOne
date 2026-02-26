/**
 * T116: DOCX generator.
 *
 * Manuscript format: 12pt font, double-spaced, 1-inch margins,
 * 0.5-inch indent, right-aligned header, chapter page breaks.
 */

import type { Manuscript } from './manuscript-assembler.js';

export interface DocxSection {
  type: 'title' | 'chapter' | 'pageBreak';
  heading?: string;
  paragraphs?: string[];
  header?: string;
}

/**
 * Generate DOCX document sections from a manuscript.
 * Returns structured data for use with a DOCX library (e.g., `docx` package).
 */
export function generateDocxSections(manuscript: Manuscript): DocxSection[] {
  const sections: DocxSection[] = [];

  // Title page
  sections.push({
    type: 'title',
    heading: manuscript.frontMatter.titlePage.title,
    paragraphs: [
      manuscript.frontMatter.titlePage.author,
      '',
      `Word count: ~${manuscript.wordCount.toLocaleString()}`,
    ],
  });

  sections.push({ type: 'pageBreak' });

  // Chapters
  for (let i = 0; i < manuscript.chapters.length; i++) {
    const chapter = manuscript.chapters[i]!;

    sections.push({
      type: 'chapter',
      heading: `Chapter ${i + 1}: ${chapter.title}`,
      paragraphs: chapter.paragraphs,
      header: `${manuscript.frontMatter.titlePage.author} / ${manuscript.frontMatter.titlePage.title}`,
    });

    if (i < manuscript.chapters.length - 1) {
      sections.push({ type: 'pageBreak' });
    }
  }

  return sections;
}

/**
 * DOCX formatting constants for manuscript format.
 */
export const DOCX_FORMAT = {
  fontSize: 24, // 12pt in half-points
  fontFamily: 'Times New Roman',
  lineSpacing: 480, // Double spacing in twips
  marginTop: 1440, // 1 inch in twips
  marginBottom: 1440,
  marginLeft: 1440,
  marginRight: 1440,
  indent: 720, // 0.5 inch paragraph indent
  headerAlignment: 'right' as const,
  chapterBreak: 'page' as const,
} as const;
