// ── ActOne Project Metadata Types ───────────────────────────────────
// TypeScript types for the actone_project_ext extension table columns.

export interface ActOneProjectMetadata {
  authorName?: string | null;
  genre?: string | null;
  compositionMode: 'merge' | 'overlay' | 'sequential';
  publishingMode: 'text' | 'graphic-novel';
}

export const defaultActOneMetadata: ActOneProjectMetadata = {
  compositionMode: 'merge',
  publishingMode: 'text',
};
