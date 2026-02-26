/**
 * T131: Spread compositor.
 *
 * Assembles facing pages and synthetic spreads for landscape mode.
 */

export interface SpreadConfig {
  pageWidth: number;
  pageHeight: number;
  leftPageSvg: string;
  rightPageSvg: string;
  spineWidth: number;
}

/**
 * Composite two pages into a facing-page spread.
 */
export function compositeSpread(config: SpreadConfig): string {
  const totalWidth = config.pageWidth * 2 + config.spineWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${config.pageHeight}" viewBox="0 0 ${totalWidth} ${config.pageHeight}">
  <!-- Left page -->
  <g transform="translate(0, 0)">
    ${config.leftPageSvg}
  </g>

  <!-- Spine shadow -->
  <rect x="${config.pageWidth}" y="0" width="${config.spineWidth}" height="${config.pageHeight}" fill="#1a1a1a" opacity="0.3"/>

  <!-- Right page -->
  <g transform="translate(${config.pageWidth + config.spineWidth}, 0)">
    ${config.rightPageSvg}
  </g>
</svg>`;
}

/**
 * Create a synthetic landscape spread from a single wide panel.
 */
export function syntheticSpread(
  imageUrl: string,
  totalWidth: number,
  height: number,
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}">
  <image href="${imageUrl}" width="${totalWidth}" height="${height}" preserveAspectRatio="xMidYMid slice"/>
</svg>`;
}
