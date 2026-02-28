/**
 * Export request logic extracted from export/+page.svelte.
 *
 * Handles the fetch call and response parsing only;
 * DOM download trigger remains in the component.
 */

export interface ExportDownload {
  format: string;
  url: string;
}

export type ExportResult =
  | { success: true; downloads: ExportDownload[] }
  | { success: false; error: string };

export async function requestExport(
  fetchFn: typeof fetch,
  projectId: string,
  format: string,
): Promise<ExportResult> {
  try {
    const res = await fetchFn('/api/publishing/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, format }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: text || `Export failed (${res.status})` };
    }

    const data = (await res.json()) as { downloads: ExportDownload[] };
    return { success: true, downloads: data.downloads };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Export failed',
    };
  }
}
