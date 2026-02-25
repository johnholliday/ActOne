/**
 * Trim leading/trailing whitespace and collapse all internal whitespace
 * sequences (spaces, tabs, newlines) to a single space.
 */
export function collapseWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

/**
 * Remove all occurrences of the specified characters from the string.
 * Characters in `chars` are treated as literal characters, not a regex.
 */
export function stripChars(input: string, chars: string): string {
  if (!chars) return input;
  const escaped = chars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return input.replace(new RegExp(`[${escaped}]`, 'g'), '');
}
