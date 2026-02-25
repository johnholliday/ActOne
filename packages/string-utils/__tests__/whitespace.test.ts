import { describe, expect, it } from 'vitest';
import { collapseWhitespace, stripChars } from '../src/whitespace';

describe('collapseWhitespace', () => {
  it('trims and collapses internal spaces', () => {
    expect(collapseWhitespace('  hello    world  ')).toBe('hello world');
  });

  it('collapses tabs and newlines', () => {
    expect(collapseWhitespace('hello\t\n  world')).toBe('hello world');
  });

  it('returns empty for whitespace-only', () => {
    expect(collapseWhitespace('  ')).toBe('');
  });

  it('returns empty for empty string', () => {
    expect(collapseWhitespace('')).toBe('');
  });

  it('handles mixed whitespace characters', () => {
    expect(collapseWhitespace('\t  hello \n\n  world  \t')).toBe('hello world');
  });

  it('preserves single-spaced content', () => {
    expect(collapseWhitespace('hello world')).toBe('hello world');
  });
});

describe('stripChars', () => {
  it('removes exclamation marks', () => {
    expect(stripChars('hello world!', '!')).toBe('hello world');
  });

  it('removes dots', () => {
    expect(stripChars('a.b.c', '.')).toBe('abc');
  });

  it('returns original when chars is empty', () => {
    expect(stripChars('hello', '')).toBe('hello');
  });

  it('removes multiple different characters', () => {
    expect(stripChars('a.b,c!d', '.,!')).toBe('abcd');
  });

  it('handles regex-special characters', () => {
    expect(stripChars('foo[bar]baz', '[]')).toBe('foobarbaz');
  });

  it('returns empty for empty input', () => {
    expect(stripChars('', '!')).toBe('');
  });
});
