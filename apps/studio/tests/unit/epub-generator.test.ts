/**
 * T042: EPUB generator tests.
 *
 * Verifies that generateEpubFiles produces the required EPUB 3
 * file structure from a Manuscript.
 */

import { describe, it, expect } from 'vitest';

import { generateEpubFiles } from '$lib/publishing/epub-generator.js';
import { createTestManuscript } from '../fixtures/factories.js';

describe('generateEpubFiles', () => {
  it('generates required EPUB files', () => {
    const manuscript = createTestManuscript();
    const files = generateEpubFiles(manuscript);
    const paths = files.map((f) => f.path);

    expect(paths).toContain('mimetype');
    expect(paths).toContain('META-INF/container.xml');
    expect(paths.some((p) => p.includes('content.opf'))).toBe(true);
    expect(paths.some((p) => p.includes('nav.xhtml'))).toBe(true);
  });

  it('generates chapter XHTML files', () => {
    const manuscript = createTestManuscript();
    const files = generateEpubFiles(manuscript);

    // The manuscript has 3 chapters, so there should be 3 chapter XHTML files
    const chapterFiles = files.filter(
      (f) => f.path.includes('chapter') && f.path.endsWith('.xhtml'),
    );
    expect(chapterFiles).toHaveLength(manuscript.chapters.length);
  });

  it('mimetype file has correct content', () => {
    const manuscript = createTestManuscript();
    const files = generateEpubFiles(manuscript);

    const mimetypeFile = files.find((f) => f.path === 'mimetype');
    expect(mimetypeFile).toBeDefined();
    expect(mimetypeFile!.content).toBe('application/epub+zip');
  });

  it('generates title page', () => {
    const manuscript = createTestManuscript();
    const files = generateEpubFiles(manuscript);

    const titleFile = files.find((f) => f.path.includes('title.xhtml'));
    expect(titleFile).toBeDefined();
    expect(titleFile!.content).toContain(manuscript.frontMatter.titlePage.title);
    expect(titleFile!.content).toContain(manuscript.frontMatter.titlePage.author);
  });

  it('chapter XHTML contains paragraph content', () => {
    const manuscript = createTestManuscript();
    const files = generateEpubFiles(manuscript);

    const chapter1 = files.find((f) => f.path.includes('chapter1.xhtml'));
    expect(chapter1).toBeDefined();
    // The first chapter's first paragraph should appear in the content
    expect(chapter1!.content).toContain('morning light');
  });
});
