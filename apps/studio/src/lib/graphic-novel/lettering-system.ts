/**
 * T129: Lettering system.
 *
 * Speech bubbles, caption boxes, and sound effect overlays
 * with dynamic text wrapping and bubble sizing.
 */

export type BubbleStyle = 'standard' | 'shout' | 'whisper' | 'thought';

export interface SpeechBubble {
  text: string;
  style: BubbleStyle;
  characterName: string;
  position: { x: number; y: number }; // normalized 0-1
  tailDirection: 'left' | 'right' | 'down' | 'up';
}

export interface CaptionBox {
  text: string;
  position: { x: number; y: number };
  width: number; // normalized
}

export interface SoundEffect {
  text: string;
  position: { x: number; y: number };
  fontSize: number; // relative scale
  rotation: number; // degrees
  color: string;
}

/**
 * Estimate bubble dimensions based on text content.
 */
export function estimateBubbleSize(
  text: string,
  style: BubbleStyle,
): { width: number; height: number } {
  const charWidth = style === 'shout' ? 12 : style === 'whisper' ? 8 : 10;
  const lineHeight = style === 'shout' ? 20 : style === 'whisper' ? 14 : 16;
  const maxCharsPerLine = 25;

  const lines = Math.ceil(text.length / maxCharsPerLine);
  const longestLine = Math.min(text.length, maxCharsPerLine);

  const padding = style === 'thought' ? 24 : 16;

  return {
    width: longestLine * charWidth + padding * 2,
    height: lines * lineHeight + padding * 2,
  };
}

/**
 * Generate SVG for a speech bubble.
 */
export function renderBubbleSvg(bubble: SpeechBubble): string {
  const size = estimateBubbleSize(bubble.text, bubble.style);
  const cx = size.width / 2;
  const cy = size.height / 2;

  let outline: string;
  let fill: string;
  let textStyle: string;

  switch (bubble.style) {
    case 'shout':
      outline = generateStarburstPath(cx, cy, size.width, size.height);
      fill = '#ffffff';
      textStyle = 'font-weight: bold; font-size: 14px; text-transform: uppercase;';
      break;
    case 'whisper':
      outline = generateDashedEllipse(cx, cy, size.width, size.height);
      fill = '#f8f8f8';
      textStyle = 'font-style: italic; font-size: 11px;';
      break;
    case 'thought':
      outline = generateCloudPath(cx, cy, size.width, size.height);
      fill = '#ffffff';
      textStyle = 'font-style: italic; font-size: 12px;';
      break;
    default:
      outline = `<ellipse cx="${cx}" cy="${cy}" rx="${size.width / 2}" ry="${size.height / 2}" fill="${fill = '#ffffff'}" stroke="#000" stroke-width="2"/>`;
      textStyle = 'font-size: 12px;';
  }

  return `<svg width="${size.width}" height="${size.height}" xmlns="http://www.w3.org/2000/svg">
  ${outline}
  <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" style="${textStyle}">
    ${escapeXml(bubble.text)}
  </text>
</svg>`;
}

/**
 * Generate SVG for a caption box.
 */
export function renderCaptionSvg(caption: CaptionBox): string {
  const width = 200;
  const height = 40;

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#fffdd0" stroke="#8b7355" stroke-width="1" rx="2"/>
  <text x="${width / 2}" y="${height / 2}" text-anchor="middle" dominant-baseline="middle" font-size="11" font-style="italic">
    ${escapeXml(caption.text)}
  </text>
</svg>`;
}

/**
 * Generate SVG for a sound effect.
 */
export function renderSoundEffectSvg(sfx: SoundEffect): string {
  return `<text x="0" y="0" font-size="${sfx.fontSize}" fill="${sfx.color}" font-weight="900" font-family="Impact, sans-serif" transform="rotate(${sfx.rotation})">
  ${escapeXml(sfx.text)}
</text>`;
}

function generateStarburstPath(cx: number, cy: number, w: number, h: number): string {
  const points = 12;
  const outerRx = w / 2;
  const outerRy = h / 2;
  const innerRx = outerRx * 0.75;
  const innerRy = outerRy * 0.75;
  const angleStep = (2 * Math.PI) / points;

  let d = '';
  for (let i = 0; i < points; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const isOuter = i % 2 === 0;
    const rx = isOuter ? outerRx : innerRx;
    const ry = isOuter ? outerRy : innerRy;
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  d += ' Z';

  return `<path d="${d}" fill="#ffffff" stroke="#000" stroke-width="2"/>`;
}

function generateDashedEllipse(cx: number, cy: number, w: number, h: number): string {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${w / 2}" ry="${h / 2}" fill="#f8f8f8" stroke="#000" stroke-width="1" stroke-dasharray="4 4"/>`;
}

function generateCloudPath(cx: number, cy: number, w: number, h: number): string {
  // Simplified cloud shape using overlapping circles
  return `<ellipse cx="${cx}" cy="${cy}" rx="${w / 2}" ry="${h / 2}" fill="#ffffff" stroke="#000" stroke-width="2"/>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
