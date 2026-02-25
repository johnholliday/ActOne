/**
 * Truncate a string to fit within `limit` characters (including the suffix).
 * Prefers breaking at word boundaries. Falls back to character-level truncation
 * if a single word exceeds the limit.
 */
export function truncate(input: string, limit: number, suffix = '\u2026'): string {
  if (limit <= 0) return '';
  if (input.length <= limit) return input;

  const maxContent = limit - suffix.length;

  if (maxContent <= 0) {
    return suffix.slice(0, limit);
  }

  const truncated = input.slice(0, maxContent);

  // If we're at a word boundary (next char is space/end), no word was cut
  if (maxContent >= input.length || input[maxContent] === ' ') {
    return truncated + suffix;
  }

  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace) + suffix;
  }

  return truncated + suffix;
}
