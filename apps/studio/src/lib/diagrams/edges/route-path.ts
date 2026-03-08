/**
 * Build an SVG path string from ELK-computed route points.
 * Uses rounded corners at bend points for a polished look.
 */
export function buildRoutePath(
  points: { x: number; y: number }[],
  radius = 6,
): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  const parts: string[] = [`M ${points[0].x} ${points[0].y}`];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Distance to prev and next points
    const dPrev = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    const dNext = Math.hypot(next.x - curr.x, next.y - curr.y);
    const r = Math.min(radius, dPrev / 2, dNext / 2);

    // Points just before and after the bend
    const beforeX = curr.x - (r * (curr.x - prev.x)) / dPrev;
    const beforeY = curr.y - (r * (curr.y - prev.y)) / dPrev;
    const afterX = curr.x + (r * (next.x - curr.x)) / dNext;
    const afterY = curr.y + (r * (next.y - curr.y)) / dNext;

    parts.push(`L ${beforeX} ${beforeY}`);
    parts.push(`Q ${curr.x} ${curr.y} ${afterX} ${afterY}`);
  }

  const last = points[points.length - 1];
  parts.push(`L ${last.x} ${last.y}`);

  return parts.join(' ');
}
