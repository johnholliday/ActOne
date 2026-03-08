// ── Publishing Types ─────────────────────────────────────────────────

/** Supported export format identifiers */
export type ExportFormat = 'epub' | 'docx' | 'pdf' | 'kindle';

/** Configuration for a publishing/export job */
export interface ExportConfig {
  formats: ExportFormat[];
  trimSize?: string; // e.g., '6x9'
  paperType?: string; // e.g., 'offset', 'coated'
}

/** Result of a completed export operation */
export interface ExportResult {
  format: ExportFormat;
  fileSize: number;
  storagePath: string;
  downloadUrl: string;
}
