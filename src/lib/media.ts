import { fileCache } from './cms-cache';
import { getPocketBaseUrl } from './pocketbase';

type FileRecord = {
  id: string;
  collectionId?: string;
  collectionName?: string;
};

export function getPocketBaseOriginFileUrl(
  record: FileRecord,
  filename?: string,
  thumb?: string,
): string | undefined {
  if (!filename) return undefined;

  const base = getPocketBaseUrl();
  if (!base) return undefined;

  const collection = record.collectionName || record.collectionId;
  if (!collection) return undefined;

  const url = `${base}/api/files/${collection}/${record.id}/${encodeURIComponent(filename)}`;
  return thumb ? `${url}?thumb=${thumb}` : url;
}

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

export async function getPocketBaseFileIconUrl(
  record: FileRecord,
  filename?: string,
): Promise<string | undefined> {
  const publicUrl = getPocketBaseFileUrl(record, filename);
  const originUrl = getPocketBaseOriginFileUrl(record, filename);
  if (!publicUrl || !originUrl || !filename) return undefined;
  if (!filename.toLowerCase().endsWith('.svg')) return publicUrl;

  try {
    const svg = await fileCache.getOrLoad(`svg:${originUrl}`, async () => {
      const response = await fetch(originUrl, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(`svg ${response.status}`);
      const text = (await response.text()).trim();
      if (!text.includes('<svg')) throw new Error('not svg');
      return {
        body: new TextEncoder().encode(text),
        contentType: 'image/svg+xml',
      };
    });
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new TextDecoder().decode(svg.body))}`;
  } catch {
    return publicUrl;
  }
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
