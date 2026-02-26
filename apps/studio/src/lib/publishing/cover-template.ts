/**
 * T120: Cover template utilities.
 *
 * Cover image processing and template configuration.
 */

export interface CoverTemplate {
  name: string;
  layout: 'centered' | 'top-bottom' | 'full-bleed';
  titlePosition: { x: number; y: number };
  authorPosition: { x: number; y: number };
  backgroundColor: string;
  textColor: string;
}

export const COVER_TEMPLATES: CoverTemplate[] = [
  {
    name: 'Classic',
    layout: 'centered',
    titlePosition: { x: 0.5, y: 0.35 },
    authorPosition: { x: 0.5, y: 0.75 },
    backgroundColor: '#1a1a2e',
    textColor: '#e6e6fa',
  },
  {
    name: 'Modern',
    layout: 'top-bottom',
    titlePosition: { x: 0.5, y: 0.2 },
    authorPosition: { x: 0.5, y: 0.9 },
    backgroundColor: '#0d1117',
    textColor: '#f0f6fc',
  },
  {
    name: 'Dramatic',
    layout: 'full-bleed',
    titlePosition: { x: 0.5, y: 0.45 },
    authorPosition: { x: 0.5, y: 0.85 },
    backgroundColor: '#000000',
    textColor: '#ffffff',
  },
];

/**
 * Generate cover SVG template.
 */
export function generateCoverSvg(
  title: string,
  author: string,
  width: number,
  height: number,
  template: CoverTemplate = COVER_TEMPLATES[0]!,
  backgroundImageUrl?: string,
): string {
  const titleX = width * template.titlePosition.x;
  const titleY = height * template.titlePosition.y;
  const authorX = width * template.authorPosition.x;
  const authorY = height * template.authorPosition.y;

  const backgroundImage = backgroundImageUrl
    ? `<image href="${backgroundImageUrl}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${template.backgroundColor}"/>
  ${backgroundImage}
  <text x="${titleX}" y="${titleY}" text-anchor="middle" font-family="Georgia, serif" font-size="${Math.round(width * 0.06)}" fill="${template.textColor}" font-weight="bold">
    ${escapeXml(title)}
  </text>
  <text x="${authorX}" y="${authorY}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(width * 0.03)}" fill="${template.textColor}">
    ${escapeXml(author)}
  </text>
</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
