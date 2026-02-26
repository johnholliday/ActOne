/**
 * T128: Panel generator.
 *
 * Layout templates and camera direction logic
 * based on emotional intensity.
 */

export interface PanelLayout {
  id: string;
  name: string;
  panels: PanelRect[];
}

export interface PanelRect {
  x: number; // 0-1 normalized
  y: number;
  width: number;
  height: number;
}

export const PANEL_LAYOUTS: PanelLayout[] = [
  {
    id: 'full-bleed',
    name: 'Full Bleed',
    panels: [{ x: 0, y: 0, width: 1, height: 1 }],
  },
  {
    id: '2-panel',
    name: '2-Panel',
    panels: [
      { x: 0, y: 0, width: 0.5, height: 1 },
      { x: 0.5, y: 0, width: 0.5, height: 1 },
    ],
  },
  {
    id: '3-strip',
    name: '3-Strip',
    panels: [
      { x: 0, y: 0, width: 1, height: 0.333 },
      { x: 0, y: 0.333, width: 1, height: 0.333 },
      { x: 0, y: 0.666, width: 1, height: 0.334 },
    ],
  },
  {
    id: '4-grid',
    name: '4-Grid',
    panels: [
      { x: 0, y: 0, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0, width: 0.5, height: 0.5 },
      { x: 0, y: 0.5, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
    ],
  },
  {
    id: '6-grid',
    name: '6-Grid',
    panels: [
      { x: 0, y: 0, width: 0.333, height: 0.5 },
      { x: 0.333, y: 0, width: 0.333, height: 0.5 },
      { x: 0.666, y: 0, width: 0.334, height: 0.5 },
      { x: 0, y: 0.5, width: 0.333, height: 0.5 },
      { x: 0.333, y: 0.5, width: 0.333, height: 0.5 },
      { x: 0.666, y: 0.5, width: 0.334, height: 0.5 },
    ],
  },
  {
    id: '9-grid',
    name: '9-Grid',
    panels: Array.from({ length: 9 }, (_, i) => ({
      x: (i % 3) * 0.333,
      y: Math.floor(i / 3) * 0.333,
      width: i % 3 === 2 ? 0.334 : 0.333,
      height: Math.floor(i / 3) === 2 ? 0.334 : 0.333,
    })),
  },
  {
    id: 'irregular',
    name: 'Irregular',
    panels: [
      { x: 0, y: 0, width: 0.6, height: 0.5 },
      { x: 0.6, y: 0, width: 0.4, height: 0.3 },
      { x: 0.6, y: 0.3, width: 0.4, height: 0.2 },
      { x: 0, y: 0.5, width: 0.4, height: 0.5 },
      { x: 0.4, y: 0.5, width: 0.6, height: 0.5 },
    ],
  },
];

export type CameraAngle =
  | 'wide'       // establishing shots, low intensity
  | 'medium'     // dialogue, moderate intensity
  | 'close-up'   // emotion, high intensity
  | 'extreme-close-up' // peak intensity
  | 'bird-eye'   // overview scenes
  | 'low-angle'  // power, dominance
  | 'high-angle' // vulnerability
  | 'dutch'      // tension, unease

/**
 * Suggest camera angle based on emotional intensity.
 */
export function suggestCameraAngle(intensity: number): CameraAngle {
  if (intensity >= 0.9) return 'extreme-close-up';
  if (intensity >= 0.7) return 'close-up';
  if (intensity >= 0.5) return 'medium';
  if (intensity >= 0.3) return 'wide';
  return 'bird-eye';
}

/**
 * Suggest panel layout based on scene type.
 */
export function suggestLayout(sceneType: string): string {
  switch (sceneType) {
    case 'Action': return '6-grid';
    case 'Dialogue': return '4-grid';
    case 'Reflection': return '2-panel';
    case 'Climax': return 'full-bleed';
    case 'Confrontation': return 'irregular';
    case 'Montage': return '9-grid';
    default: return '4-grid';
  }
}

/**
 * Get a layout by ID.
 */
export function getLayout(id: string): PanelLayout | undefined {
  return PANEL_LAYOUTS.find((l) => l.id === id);
}
