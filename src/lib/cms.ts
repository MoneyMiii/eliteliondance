import { recordsCache } from './cms-cache';
import { getPocketBase } from './pocketbase';

type CmsList<T> = { ok: true; data: T[] } | { ok: false };

export type FetchOptions = {
  filter?: string;
  sort?: string;
  expand?: string;
  fields?: string;
  page?: number;
  perPage?: number;
};

function cacheKey(collection: string, options: FetchOptions): string {
  return [
    collection,
    options.filter ?? '',
    options.sort ?? '',
    options.expand ?? '',
    options.fields ?? '',
    options.page ?? '',
    options.perPage ?? '',
  ].join('|');
}

export async function fetchRecords<T>(
  collection: string,
  options: FetchOptions = {},
): Promise<CmsList<T>> {
  const pb = getPocketBase();
  if (!pb) return { ok: false };

  const query = {
    filter: options.filter,
    sort: options.sort,
    expand: options.expand,
    fields: options.fields,
  };

  const load = async () => {
    if (options.perPage) {
      const result = await pb.collection(collection).getList<T>(options.page ?? 1, options.perPage, {
        ...query,
        skipTotal: true,
      });
      return result.items;
    }

    return pb.collection(collection).getFullList<T>(query);
  };

  try {
    const data = await recordsCache.getOrLoad(cacheKey(collection, options), load);
    return { ok: true, data: data as T[] };
  } catch (error) {
    const status = (error as { status?: number })?.status
      ?? (error as { response?: { status?: number } })?.response?.status;
    const message = error instanceof Error ? error.message : String(error);
    const quota = status === 429 || /429|hourly API limit/i.test(message);
    console.error(
      quota
        ? `[cms] ${collection} quota horaire PocketBase (429)`
        : `[cms] ${collection} (${pb.baseUrl}) ${message}`,
      error,
    );
    return { ok: false };
  }
}
