import { getPocketBase } from './pocketbase';

export type CmsList<T> = { ok: true; data: T[] } | { ok: false };

function logCmsError(context: string, error: unknown) {
  console.error(`[cms] ${context}`, error);
}

export async function fetchRecords<T>(
  collection: string,
  options: { filter?: string; sort?: string; expand?: string } = {},
): Promise<CmsList<T>> {
  const pb = getPocketBase();
  if (!pb) return { ok: false };

  try {
    const data = await pb.collection(collection).getFullList<T>({
      filter: options.filter,
      sort: options.sort,
      expand: options.expand,
    });
    return { ok: true, data };
  } catch (error) {
    logCmsError(collection, error);
    return { ok: false };
  }
}
