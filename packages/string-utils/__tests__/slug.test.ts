import { describe, expect, it } from 'vitest';
import { slugify } from '../src/slug';

describe('slugify', () => {
  it('converts simple string to slug', () => {
    expect(slugify('Hello World! This is a Test')).toBe('hello-world-this-is-a-test');
  });

  it('transliterates accented characters and symbols', () => {
    expect(slugify('Héllo & Wörld')).toBe('hello-and-world');
  });

  it('collapses and trims hyphens', () => {
    expect(slugify('  --multiple---hyphens-- ')).toBe('multiple-hyphens');
  });

  it('returns empty for empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('returns empty for whitespace-only', () => {
    expect(slugify('   ')).toBe('');
  });

  it('transliterates ß to ss', () => {
    expect(slugify('Straße')).toBe('strasse');
  });

  it('transliterates æ to ae', () => {
    expect(slugify('Ærodynamic')).toBe('aerodynamic');
  });

  it('transliterates ø to o', () => {
    expect(slugify('Ørsted')).toBe('orsted');
  });

  it('strips emoji', () => {
    expect(slugify('hello 🌍 world')).toBe('hello-world');
  });

  it('handles consecutive special characters', () => {
    expect(slugify('foo!!!bar')).toBe('foo-bar');
  });

  it('handles leading/trailing special characters', () => {
    expect(slugify('---hello---')).toBe('hello');
  });
});
