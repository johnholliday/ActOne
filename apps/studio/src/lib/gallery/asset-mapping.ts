/**
 * Gallery asset mapping logic extracted from gallery/+page.server.ts.
 */

export interface GalleryAsset {
  id: string;
  type: string;
  label: string;
  storageUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  prompt: string;
  backend: string;
}

export function mapAssetRow(row: Record<string, unknown>): GalleryAsset {
  return {
    id: row.id as string,
    type: row.type as string,
    label: row.name as string,
    storageUrl:
      ((row.metadata as Record<string, unknown> | null)?.imageUrl as string) ?? '',
    status: row.status as 'pending' | 'approved' | 'rejected',
    createdAt: row.created_at as string,
    prompt: (row.prompt as string) ?? '',
    backend: (row.backend as string) ?? '',
  };
}
