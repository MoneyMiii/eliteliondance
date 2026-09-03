import { fileCache } from './cms-cache';
import { getPocketBaseUrl } from './pocketbase';

type FileRecord = {
  id: string;
  collectionId?: string;
  collectionName?: string;
};

export function getPocketBaseFileUrl(
  record: FileRecord,
  filename?: string,
  thumb?: string,
): string | undefined {
  if (!filename) return undefined;

  const collection = record.collectionName || record.collectionId;
  if (!collection || !getPocketBaseUrl()) return undefined;

  const url = `/media/files/${collection}/${record.id}/${encodeURIComponent(filename)}`;
  return thumb ? `${url}?thumb=${encodeURIComponent(thumb)}` : url;
}

export async function loadPocketBaseFile(
  collection: string,
  id: string,
  filename: string,
  thumb?: string | null,
): Promise<{ body: Uint8Array; contentType: string } | null> {
  const base = getPocketBaseUrl();
  if (!base) return null;

  const origin = `${base}/api/files/${collection}/${id}/${encodeURIComponent(filename)}`;
  const url = thumb ? `${origin}?thumb=${encodeURIComponent(thumb)}` : origin;
  const key = `file:${url}`;

  try {
    return await fileCache.getOrLoad(key, async () => {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`file ${response.status}`);
      return {
        body: new Uint8Array(await response.arrayBuffer()),
        contentType: response.headers.get('content-type') || 'application/octet-stream',
      };
    });
  } catch {
    return null;
  }
}
