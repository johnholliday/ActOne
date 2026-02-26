/**
 * T130: Page renderer.
 *
 * Composites panel artwork, lettering, and layout into complete page images.
 */

import type { PanelLayout, PanelRect } from './panel-generator.js';
import type { SpeechBubble, CaptionBox, SoundEffect } from './lettering-system.js';

export interface PanelContent {
  panelIndex: number;
  imageUrl: string;
  bubbles: SpeechBubble[];
  captions: CaptionBox[];
  soundEffects: SoundEffect[];
}

export interface PageConfig {
  width: number; // px
  height: number; // px
  gutterWidth: number; // px between panels
  layout: PanelLayout;
  panels: PanelContent[];
  backgroundColor: string;
}

/**
 * Generate SVG composite of a complete comic page.
 */
export function renderPageSvg(config: PageConfig): string {
  const { width, height, gutterWidth, layout, panels, backgroundColor } = config;
  const panelElements: string[] = [];

  for (let i = 0; i < layout.panels.length; i++) {
    const rect = layout.panels[i]!;
    const content = panels.find((p) => p.panelIndex === i);

    const px = rect.x * width + gutterWidth / 2;
    const py = rect.y * height + gutterWidth / 2;
    const pw = rect.width * width - gutterWidth;
    const ph = rect.height * height - gutterWidth;

    // Panel frame
    panelElements.push(`<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="#000" rx="2"/>`);

    // Panel image
    if (content?.imageUrl) {
      panelElements.push(
        `<image href="${content.imageUrl}" x="${px + 1}" y="${py + 1}" width="${pw - 2}" height="${ph - 2}" preserveAspectRatio="xMidYMid slice" clip-path="inset(0)"/>`
      );
    } else {
      panelElements.push(
        `<rect x="${px + 1}" y="${py + 1}" width="${pw - 2}" height="${ph - 2}" fill="#2a2a2a"/>`
      );
    }

    // Lettering overlays
    if (content) {
      for (const bubble of content.bubbles) {
        const bx = px + bubble.position.x * pw;
        const by = py + bubble.position.y * ph;
        panelElements.push(
          `<ellipse cx="${bx}" cy="${by}" rx="40" ry="20" fill="white" stroke="black" stroke-width="1.5"/>`
        );
        panelElements.push(
          `<text x="${bx}" y="${by}" text-anchor="middle" dominant-baseline="middle" font-size="10">${escapeXml(bubble.text)}</text>`
        );
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
  ${panelElements.join('\n  ')}
</svg>`;
}

/**
 * Calculate reading order for panels (left-to-right, top-to-bottom).
 */
export function getReadingOrder(panels: PanelRect[]): number[] {
  return panels
    .map((p, i) => ({ index: i, y: p.y, x: p.x }))
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((p) => p.index);
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
