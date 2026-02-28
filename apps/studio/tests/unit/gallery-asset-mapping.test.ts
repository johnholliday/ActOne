import { describe, it, expect } from 'vitest';
import { mapAssetRow } from '$lib/gallery/asset-mapping.js';
import { createAssetRow } from '../fixtures/factories.js';

describe('mapAssetRow', () => {
  it('maps a complete row with all fields', () => {
    const row = createAssetRow();
    const result = mapAssetRow(row);

    expect(result).toEqual({
      id: 'asset-001',
      type: 'portrait',
      label: 'Elena Portrait',
      storageUrl: 'https://storage.example.com/elena.png',
      status: 'pending',
      createdAt: '2026-01-15T14:00:00Z',
      prompt: 'A young painter in morning light',
      backend: 'dall-e-3',
    });
  });

  it('extracts imageUrl from metadata object', () => {
    const row = createAssetRow({
      metadata: { imageUrl: 'https://cdn.example.com/image.webp', width: 512, height: 512 },
    });
    expect(mapAssetRow(row).storageUrl).toBe('https://cdn.example.com/image.webp');
  });

  it('returns empty string when metadata is null', () => {
    const row = createAssetRow({ metadata: null });
    expect(mapAssetRow(row).storageUrl).toBe('');
  });

  it('returns empty string when metadata has no imageUrl', () => {
    const row = createAssetRow({ metadata: { width: 512 } });
    expect(mapAssetRow(row).storageUrl).toBe('');
  });

  it('returns empty string for null prompt', () => {
    const row = createAssetRow({ prompt: null });
    expect(mapAssetRow(row).prompt).toBe('');
  });

  it('returns empty string for null backend', () => {
    const row = createAssetRow({ backend: null });
    expect(mapAssetRow(row).backend).toBe('');
  });

  it('preserves pending status', () => {
    const row = createAssetRow({ status: 'pending' });
    expect(mapAssetRow(row).status).toBe('pending');
  });

  it('preserves approved status', () => {
    const row = createAssetRow({ status: 'approved' });
    expect(mapAssetRow(row).status).toBe('approved');
  });

  it('preserves rejected status', () => {
    const row = createAssetRow({ status: 'rejected' });
    expect(mapAssetRow(row).status).toBe('rejected');
  });

  it('maps name column to label field', () => {
    const row = createAssetRow({ name: 'Custom Name' });
    expect(mapAssetRow(row).label).toBe('Custom Name');
  });

  it('maps created_at column to createdAt field', () => {
    const row = createAssetRow({ created_at: '2026-02-20T08:30:00Z' });
    expect(mapAssetRow(row).createdAt).toBe('2026-02-20T08:30:00Z');
  });
});
