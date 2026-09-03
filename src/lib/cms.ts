import { recordsCache } from './cms-cache';
import { getPocketBase } from './pocketbase';

export type CmsList<T> = { ok: true; data: T[] } | { ok: false };

function isRateLimited(error: unknown): boolean {
  const status = (error as { status?: number })?.status
    ?? (error as { response?: { status?: number } })?.response?.status;
  const message = error instanceof Error ? error.message : String(error);
  return status === 429 || /429|hourly API limit/i.test(message);
}

function logCmsError(context: string, error: unknown) {
  console.error(`[cms] ${context}`, error);
}

export async function fetchRecords<T>(
  collection: string,
  options: { filter?: string; sort?: string; expand?: string; skipCache?: boolean } = {},
): Promise<CmsList<T>> {
  const pb = getPocketBase();
  if (!pb) return { ok: false };

  const load = () =>
    pb.collection(collection).getFullList<T>({
      filter: options.filter,
      sort: options.sort,
      expand: options.expand,
    });

  try {
    if (options.skipCache) {
      return { ok: true, data: await load() };
    }

    const key = `${collection}|${options.filter ?? ''}|${options.sort ?? ''}|${options.expand ?? ''}`;
    const data = await recordsCache.getOrLoad(key, load);
    return { ok: true, data: data as T[] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isRateLimited(error)) {
      logCmsError(`${collection} quota horaire PocketBase (429). Réessayer après l’heure pile.`, error);
    } else {
      logCmsError(`${collection} (${pb.baseUrl}) ${message}`, error);
    }
    return { ok: false };
  }
}
