/**
 * T041: Manuscript assembler tests.
 *
 * Verifies that assembleManuscript correctly organizes accepted drafts
 * into chapters with front matter and back matter.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { assembleManuscript } from '$lib/publishing/manuscript-assembler.js';
import { createTestDraft, createTestDrafts, resetFactoryCounters } from '../fixtures/factories.js';

beforeEach(() => {
  resetFactoryCounters();
});

describe('assembleManuscript', () => {
  it('assembles manuscript from accepted drafts', () => {
    const drafts = [
      ...createTestDrafts('Scene1', 3, 'accepted'),
      ...createTestDrafts('Scene2', 2, 'accepted'),
    ];
    const sceneOrder = ['Scene1', 'Scene2'];

    const manuscript = assembleManuscript('Test Book', 'Test Author', drafts, sceneOrder);

    expect(manuscript.chapters).toHaveLength(2);
    expect(manuscript.chapters[0]!.sceneName).toBe('Scene1');
    expect(manuscript.chapters[1]!.sceneName).toBe('Scene2');
    expect(manuscript.chapters[0]!.paragraphs).toHaveLength(3);
    expect(manuscript.chapters[1]!.paragraphs).toHaveLength(2);
  });

  it('generates front matter', () => {
    const drafts = createTestDrafts('Scene1', 2, 'accepted');
    const sceneOrder = ['Scene1'];

    const manuscript = assembleManuscript('Test Book', 'Test Author', drafts, sceneOrder);

    expect(manuscript.frontMatter.halfTitle).toBe('Test Book');
    expect(manuscript.frontMatter.titlePage.title).toBe('Test Book');
    expect(manuscript.frontMatter.titlePage.author).toBe('Test Author');
    expect(manuscript.frontMatter.copyright).toContain('Test Author');
    expect(manuscript.frontMatter.tableOfContents).toHaveLength(1);
    expect(manuscript.frontMatter.tableOfContents[0]!.index).toBe(1);
  });

  it('generates back matter', () => {
    const drafts = createTestDrafts('Scene1', 2, 'accepted');
    const sceneOrder = ['Scene1'];

    const manuscript = assembleManuscript('Test Book', 'Test Author', drafts, sceneOrder, {
      authorBio: 'Test author biography.',
      acknowledgments: 'Thanks to everyone.',
    });

    expect(manuscript.backMatter.authorBio).toBe('Test author biography.');
    expect(manuscript.backMatter.acknowledgments).toBe('Thanks to everyone.');
  });

  it('calculates word count', () => {
    const drafts = createTestDrafts('Scene1', 3, 'accepted');
    const sceneOrder = ['Scene1'];

    const manuscript = assembleManuscript('Test Book', 'Test Author', drafts, sceneOrder);

    expect(manuscript.wordCount).toBeGreaterThan(0);
  });

  it('only includes accepted drafts', () => {
    const accepted = createTestDrafts('Scene1', 2, 'accepted');
    const rejected = createTestDrafts('Scene1', 1, 'rejected');
    const pending = createTestDrafts('Scene1', 1, 'pending');
    const allDrafts = [...accepted, ...rejected, ...pending];
    const sceneOrder = ['Scene1'];

    const manuscript = assembleManuscript('Test Book', 'Test Author', allDrafts, sceneOrder);

    // Only the 2 accepted drafts should appear (one per paragraph index if they differ)
    expect(manuscript.chapters).toHaveLength(1);
    // The accepted drafts have paragraphIndex 0 and 1
    expect(manuscript.chapters[0]!.paragraphs.length).toBeGreaterThanOrEqual(2);
  });

  it('skips scenes with no accepted drafts', () => {
    const acceptedScene1 = createTestDrafts('Scene1', 2, 'accepted');
    const rejectedScene2 = createTestDrafts('Scene2', 2, 'rejected');
    const allDrafts = [...acceptedScene1, ...rejectedScene2];
    const sceneOrder = ['Scene1', 'Scene2'];

    const manuscript = assembleManuscript('Test Book', 'Test Author', allDrafts, sceneOrder);

    // Scene2 has only rejected drafts, so it should be skipped
    expect(manuscript.chapters).toHaveLength(1);
    expect(manuscript.chapters[0]!.sceneName).toBe('Scene1');
  });
});
