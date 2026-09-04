import { fileCache } from './cms-cache';
import { getPocketBaseUrl } from './pocketbase';

const FILE_TIMEOUT_MS = 20000;

/** Formats servis en flux : les charger en mémoire coûterait trop cher. */
const STREAMED = /\.(mp4|webm|mov|m4v|ogv)$/i;

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

function fileEndpoint(
  collection: string,
  id: string,
  filename: string,
  thumb?: string | null,
): string | null {
  const base = getPocketBaseUrl();
  if (!base) return null;

  const url = `${base}/api/files/${collection}/${id}/${encodeURIComponent(filename)}`;
  return thumb ? `${url}?thumb=${encodeURIComponent(thumb)}` : url;
}

export function isStreamedFile(filename: string): boolean {
  return STREAMED.test(filename);
}

/** Passe-plat non bufferisé, qui relaie les requêtes par plage d'octets. */
export async function streamPocketBaseFile(
  collection: string,
  id: string,
  filename: string,
  thumb?: string | null,
  range?: string | null,
): Promise<Response | null> {
  const url = fileEndpoint(collection, id, filename, thumb);
  if (!url) return null;

  try {
    const response = await fetch(url, {
      headers: range ? { Range: range } : undefined,
      signal: AbortSignal.timeout(FILE_TIMEOUT_MS),
    });
    return response.ok || response.status === 416 ? response : null;
  } catch {
    return null;
  }
}

/** Lecture mise en cache, réservée aux fichiers légers (images et vignettes). */
export async function loadPocketBaseFile(
  collection: string,
  id: string,
  filename: string,
  thumb?: string | null,
): Promise<{ body: Uint8Array; contentType: string } | null> {
  const url = fileEndpoint(collection, id, filename, thumb);
  if (!url) return null;

  try {
    return await fileCache.getOrLoad(`file:${url}`, async () => {
      const response = await fetch(url, { signal: AbortSignal.timeout(FILE_TIMEOUT_MS) });
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
