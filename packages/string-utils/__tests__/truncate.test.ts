import { describe, expect, it } from 'vitest';
import { truncate } from '../src/truncate';

describe('truncate', () => {
  it('truncates at word boundary with default suffix', () => {
    expect(truncate('The quick brown fox jumps over the lazy dog', 20)).toBe(
      'The quick brown fox\u2026',
    );
  });

  it('returns original when shorter than limit', () => {
    expect(truncate('short', 20)).toBe('short');
  });

  it('uses custom suffix', () => {
    expect(truncate('hello world', 8, '...')).toBe('hello...');
  });

  it('falls back to character-level when single word exceeds limit', () => {
    expect(truncate('hello', 2)).toBe('h\u2026');
  });

  it('returns suffix when limit equals suffix length', () => {
    expect(truncate('hello', 1)).toBe('\u2026');
  });

  it('returns empty for empty input', () => {
    expect(truncate('', 10)).toBe('');
  });

  it('returns original when exactly at limit', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('handles limit of 0', () => {
    expect(truncate('hello', 0)).toBe('');
  });

  it('truncates single long word at character level', () => {
    expect(truncate('abcdefghij', 6)).toBe('abcde\u2026');
  });
});
