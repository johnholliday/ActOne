/**
 * Split a string into lowercase word segments by detecting:
 * - Explicit delimiters: hyphens, underscores, spaces, dots
 * - Lowercase-to-uppercase transitions: "aB" → ["a", "b"]
 * - Acronym boundaries: "HTTPResponse" → ["http", "response"]
 */
export function splitWords(input: string): string[] {
  if (!input.trim()) return [];

  // Replace explicit delimiters with a space, then handle case transitions
  const normalized = input
    // Insert space before uppercase letter preceded by lowercase: "aB" → "a B"
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Insert space between acronym and next word: "HTTPResponse" → "HTTP Response"
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    // Replace delimiters with spaces
    .replace(/[-_.\s]+/g, ' ')
    .trim();

  if (!normalized) return [];

  return normalized.split(' ').map((w) => w.toLowerCase());
}
