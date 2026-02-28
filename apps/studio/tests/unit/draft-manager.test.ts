/**
 * T040: Draft manager tests.
 *
 * Tests pure functions for paragraph splitting, versioning,
 * accepted word count, and cost tallying. No fetch needed.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  splitIntoParagraphs,
  getLatestVersions,
  getParagraphHistory,
  getAcceptedWordCount,
  getTotalCost,
} from '$lib/ai/draft-manager.js';
import { createTestDraft, resetFactoryCounters } from '../fixtures/factories.js';

beforeEach(() => {
  resetFactoryCounters();
});

describe('splitIntoParagraphs', () => {
  it('splits on double newlines', () => {
    const text = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
    const result = splitIntoParagraphs(text);

    expect(result).toHaveLength(3);
    expect(result[0]).toBe('First paragraph.');
    expect(result[1]).toBe('Second paragraph.');
    expect(result[2]).toBe('Third paragraph.');
  });

  it('trims whitespace from each paragraph', () => {
    const text = '  First paragraph.  \n\n  Second paragraph.  ';
    const result = splitIntoParagraphs(text);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe('First paragraph.');
    expect(result[1]).toBe('Second paragraph.');
  });

  it('filters out empty paragraphs', () => {
    const text = 'First.\n\n\n\n\n\nSecond.';
    const result = splitIntoParagraphs(text);

    expect(result).toHaveLength(2);
  });

  it('returns empty array for empty string', () => {
    expect(splitIntoParagraphs('')).toHaveLength(0);
  });

  it('returns empty array for whitespace-only string', () => {
    expect(splitIntoParagraphs('   \n\n   ')).toHaveLength(0);
  });
});

describe('getLatestVersions', () => {
  it('keeps only the latest version per paragraph index', () => {
    const older = createTestDraft({
      paragraphIndex: 0,
      content: 'Old version.',
      createdAt: '2025-01-01T00:00:00Z',
    });
    const newer = createTestDraft({
      paragraphIndex: 0,
      content: 'New version.',
      createdAt: '2025-01-02T00:00:00Z',
    });
    const otherParagraph = createTestDraft({
      paragraphIndex: 1,
      content: 'Only version.',
      createdAt: '2025-01-01T00:00:00Z',
    });

    const result = getLatestVersions([older, newer, otherParagraph]);

    expect(result.size).toBe(2);
    expect(result.get(0)!.content).toBe('New version.');
    expect(result.get(1)!.content).toBe('Only version.');
  });

  it('returns empty map for empty input', () => {
    const result = getLatestVersions([]);
    expect(result.size).toBe(0);
  });

  it('handles single draft correctly', () => {
    const draft = createTestDraft({ paragraphIndex: 0 });
    const result = getLatestVersions([draft]);

    expect(result.size).toBe(1);
    expect(result.get(0)).toBe(draft);
  });
});

describe('getParagraphHistory', () => {
  it('returns all versions for a given paragraphIndex sorted desc by createdAt', () => {
    const v1 = createTestDraft({
      paragraphIndex: 0,
      createdAt: '2025-01-01T00:00:00Z',
      content: 'Version 1.',
    });
    const v2 = createTestDraft({
      paragraphIndex: 0,
      createdAt: '2025-01-02T00:00:00Z',
      content: 'Version 2.',
    });
    const v3 = createTestDraft({
      paragraphIndex: 0,
      createdAt: '2025-01-03T00:00:00Z',
      content: 'Version 3.',
    });
    const otherParagraph = createTestDraft({
      paragraphIndex: 1,
      createdAt: '2025-01-01T00:00:00Z',
    });

    const history = getParagraphHistory([v1, v3, otherParagraph, v2], 0);

    expect(history).toHaveLength(3);
    // Sorted descending by createdAt
    expect(history[0]!.content).toBe('Version 3.');
    expect(history[1]!.content).toBe('Version 2.');
    expect(history[2]!.content).toBe('Version 1.');
  });

  it('returns empty array when no versions match', () => {
    const draft = createTestDraft({ paragraphIndex: 0 });
    const history = getParagraphHistory([draft], 5);

    expect(history).toHaveLength(0);
  });
});

describe('getAcceptedWordCount', () => {
  it('counts words only from accepted latest versions', () => {
    const accepted = createTestDraft({
      paragraphIndex: 0,
      content: 'The morning light filtered through windows.',
      status: 'accepted',
      createdAt: '2025-01-02T00:00:00Z',
    });
    const pending = createTestDraft({
      paragraphIndex: 1,
      content: 'This is a pending paragraph with some words.',
      status: 'pending',
      createdAt: '2025-01-02T00:00:00Z',
    });
    const rejected = createTestDraft({
      paragraphIndex: 2,
      content: 'Rejected draft text.',
      status: 'rejected',
      createdAt: '2025-01-02T00:00:00Z',
    });

    const wordCount = getAcceptedWordCount([accepted, pending, rejected]);

    // Only the accepted paragraph counts: "The morning light filtered through windows." = 6 words
    expect(wordCount).toBe(6);
  });

  it('returns 0 when no drafts are accepted', () => {
    const pending = createTestDraft({ status: 'pending', paragraphIndex: 0 });
    expect(getAcceptedWordCount([pending])).toBe(0);
  });

  it('uses latest version when multiple exist for same paragraph', () => {
    const olderAccepted = createTestDraft({
      paragraphIndex: 0,
      content: 'Short.',
      status: 'accepted',
      createdAt: '2025-01-01T00:00:00Z',
    });
    const newerRejected = createTestDraft({
      paragraphIndex: 0,
      content: 'This newer version was rejected.',
      status: 'rejected',
      createdAt: '2025-01-02T00:00:00Z',
    });

    // The latest version is rejected, so its words don't count
    const wordCount = getAcceptedWordCount([olderAccepted, newerRejected]);
    expect(wordCount).toBe(0);
  });
});

describe('getTotalCost', () => {
  it('sums costUsd across all drafts', () => {
    const d1 = createTestDraft({ costUsd: 0.003 });
    const d2 = createTestDraft({ costUsd: 0.005 });
    const d3 = createTestDraft({ costUsd: 0.002 });

    const total = getTotalCost([d1, d2, d3]);

    expect(total).toBeCloseTo(0.01, 6);
  });

  it('treats null costUsd as 0', () => {
    const d1 = createTestDraft({ costUsd: 0.005 });
    const d2 = createTestDraft({ costUsd: null });

    const total = getTotalCost([d1, d2]);

    expect(total).toBeCloseTo(0.005, 6);
  });

  it('returns 0 for empty array', () => {
    expect(getTotalCost([])).toBe(0);
  });
});
