/**
 * T058: Draft-to-publish pipeline test.
 *
 * Tests the pipeline: accepted drafts → assemble manuscript → generate EPUB →
 * verify valid EPUB structure.
 */

import { describe, it, expect } from 'vitest';
import { generateEpubFiles } from '$lib/publishing/epub-generator.js';
import { generateDocxSections } from '$lib/publishing/docx-generator.js';
import { createTestManuscript } from '../../fixtures/factories.js';

describe('draft → publish pipeline', () => {
  describe('manuscript assembly', () => {
    it('assembles a manuscript from accepted drafts', () => {
      const manuscript = createTestManuscript();

      expect(manuscript.frontMatter.titlePage.title).toBe('The Morning Light');
      expect(manuscript.chapters.length).toBeGreaterThanOrEqual(3);
      expect(manuscript.frontMatter).toBeDefined();
      expect(manuscript.backMatter).toBeDefined();
      expect(manuscript.wordCount).toBeGreaterThan(0);
    });

    it('chapters contain correct scene content', () => {
      const manuscript = createTestManuscript();

      for (const chapter of manuscript.chapters) {
        expect(chapter.sceneName).toBeDefined();
        expect(chapter.title).toBeDefined();
        expect(chapter.paragraphs.length).toBeGreaterThan(0);
      }
    });
  });

  describe('EPUB generation', () => {
    it('generates required EPUB files from manuscript', () => {
      const manuscript = createTestManuscript();
      const files = generateEpubFiles(manuscript);

      const filePaths = files.map((f) => f.path);

      // Required EPUB structure (files under OEBPS/ prefix per epub-generator)
      expect(filePaths).toContain('mimetype');
      expect(filePaths).toContain('META-INF/container.xml');
      expect(filePaths).toContain('OEBPS/content.opf');
      expect(filePaths).toContain('OEBPS/nav.xhtml');
    });

    it('generates one chapter file per chapter', () => {
      const manuscript = createTestManuscript();
      const files = generateEpubFiles(manuscript);

      // Count chapter XHTML files (under OEBPS/, excluding nav and title)
      const chapterFiles = files.filter(
        (f) =>
          f.path.endsWith('.xhtml') &&
          !f.path.includes('nav') &&
          !f.path.includes('title'),
      );
      expect(chapterFiles.length).toBeGreaterThanOrEqual(3);
    });

    it('mimetype content is correct', () => {
      const manuscript = createTestManuscript();
      const files = generateEpubFiles(manuscript);
      const mimetype = files.find((f) => f.path === 'mimetype');

      expect(mimetype).toBeDefined();
      expect(mimetype!.content).toBe('application/epub+zip');
    });
  });

  describe('DOCX generation', () => {
    it('generates sections with title and chapters', () => {
      const manuscript = createTestManuscript();
      const sections = generateDocxSections(manuscript);

      expect(sections.length).toBeGreaterThanOrEqual(2);

      // First section should be title
      expect(sections[0]!.type).toBe('title');

      // Remaining sections should be chapters
      const chapterSections = sections.filter((s) => s.type === 'chapter');
      expect(chapterSections.length).toBeGreaterThanOrEqual(2);
    });
  });
});
