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

  const base = getPocketBaseUrl();
  if (!base) return undefined;

  const collection = record.collectionName || record.collectionId;
  if (!collection) return undefined;

  const url = `${base}/api/files/${collection}/${record.id}/${encodeURIComponent(filename)}`;
  return thumb ? `${url}?thumb=${thumb}` : url;
}

export async function getPocketBaseFileIconUrl(
  record: FileRecord,
  filename?: string,
): Promise<string | undefined> {
  const url = getPocketBaseFileUrl(record, filename);
  if (!url || !filename) return undefined;
  if (!filename.toLowerCase().endsWith('.svg')) return url;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) return url;
    const svg = (await response.text()).trim();
    if (!svg.includes('<svg')) return url;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch {
    return url;
  }
}
