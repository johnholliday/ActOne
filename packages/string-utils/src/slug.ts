const TRANSLITERATION_MAP: Record<string, string> = {
  '&': 'and',
  ß: 'ss',
  æ: 'ae',
  Æ: 'ae',
  ø: 'o',
  Ø: 'o',
  đ: 'd',
  Đ: 'd',
  ł: 'l',
  Ł: 'l',
  œ: 'oe',
  Œ: 'oe',
  þ: 'th',
  Þ: 'th',
};

/**
 * Generate a URL-safe slug: lowercase, hyphen-separated, ASCII-only.
 *
 * Processing:
 * 1. Apply static transliteration map for special characters
 * 2. Apply NFKD normalization and strip combining marks
 * 3. Convert to lowercase
 * 4. Replace non-alphanumeric characters with hyphens
 * 5. Collapse consecutive hyphens
 * 6. Trim leading/trailing hyphens
 */
export function slugify(input: string): string {
  if (!input.trim()) return '';

  let result = input;

  // Apply static transliteration map
  for (const [char, replacement] of Object.entries(TRANSLITERATION_MAP)) {
    result = result.split(char).join(replacement);
  }

  result = result
    // NFKD normalization + strip combining marks
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    // Lowercase
    .toLowerCase()
    // Replace non-alphanumeric with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Trim leading/trailing hyphens
    .replace(/^-+|-+$/g, '');

  return result;
}
