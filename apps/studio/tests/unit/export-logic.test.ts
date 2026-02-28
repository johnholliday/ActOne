import { describe, it, expect, vi } from 'vitest';
import { requestExport } from '$lib/export/export-handler.js';

function createMockFetch(options: {
  ok?: boolean;
  status?: number;
  json?: unknown;
  text?: string;
} = {}) {
  const { ok = true, status = 200, json, text = '' } = options;

  return vi.fn<typeof fetch>().mockResolvedValue({
    ok,
    status,
    json: async () => json,
    text: async () => text,
  } as Response);
}

describe('requestExport', () => {
  it('sends POST with correct body and headers', async () => {
    const mockFetch = createMockFetch({
      json: { downloads: [{ format: 'docx', url: '/dl/out.docx' }] },
    });

    await requestExport(mockFetch, 'proj-1', 'docx');

    expect(mockFetch).toHaveBeenCalledWith('/api/publishing/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj-1', format: 'docx' }),
    });
  });

  it('returns downloads on success', async () => {
    const downloads = [
      { format: 'docx', url: '/dl/manuscript.docx' },
      { format: 'pdf', url: '/dl/manuscript.pdf' },
    ];
    const mockFetch = createMockFetch({ json: { downloads } });

    const result = await requestExport(mockFetch, 'proj-1', 'docx');
    expect(result).toEqual({ success: true, downloads });
  });

  it('returns error text on non-ok response', async () => {
    const mockFetch = createMockFetch({
      ok: false,
      status: 500,
      text: 'Internal Server Error',
    });

    const result = await requestExport(mockFetch, 'proj-1', 'docx');
    expect(result).toEqual({ success: false, error: 'Internal Server Error' });
  });

  it('returns status code when response text is empty', async () => {
    const mockFetch = createMockFetch({
      ok: false,
      status: 503,
      text: '',
    });

    const result = await requestExport(mockFetch, 'proj-1', 'docx');
    expect(result).toEqual({ success: false, error: 'Export failed (503)' });
  });

  it('propagates fetch exception as error message', async () => {
    const mockFetch = vi.fn<typeof fetch>().mockRejectedValue(
      new Error('Network failure'),
    );

    const result = await requestExport(mockFetch, 'proj-1', 'docx');
    expect(result).toEqual({ success: false, error: 'Network failure' });
  });

  it('handles non-Error exception', async () => {
    const mockFetch = vi.fn<typeof fetch>().mockRejectedValue('string error');

    const result = await requestExport(mockFetch, 'proj-1', 'pdf');
    expect(result).toEqual({ success: false, error: 'Export failed' });
  });
});
