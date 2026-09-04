import { readEnv } from './env';

type CacheEntry<T> = { expires: number; value: T };

/**
 * Les entrées périmées sont conservées jusqu'à ce que la limite les chasse :
 * elles servent de repli quand PocketBase répond en erreur ou sature son quota.
 */
function createTtlCache<T>(ttlMs: number, maxEntries: number) {
  const store = new Map<string, CacheEntry<T>>();
  const inflight = new Map<string, Promise<T>>();

  return {
    get(key: string): T | undefined {
      const entry = store.get(key);
      if (entry && entry.expires > Date.now()) return entry.value;
      return undefined;
    },
    peek(key: string): T | undefined {
      return store.get(key)?.value;
    },
    set(key: string, value: T) {
      store.delete(key);
      store.set(key, { expires: Date.now() + ttlMs, value });
      for (const oldest of store.keys()) {
        if (store.size <= maxEntries) break;
        store.delete(oldest);
      }
    },
    async getOrLoad(key: string, load: () => Promise<T>): Promise<T> {
      const fresh = this.get(key);
      if (fresh !== undefined) return fresh;

      const pending = inflight.get(key);
      if (pending) return pending;

      const promise = load()
        .then((value) => {
          this.set(key, value);
          return value;
        })
        .finally(() => {
          inflight.delete(key);
        });

      inflight.set(key, promise);
      try {
        return await promise;
      } catch (error) {
        const stale = this.peek(key);
        if (stale !== undefined) return stale;
        throw error;
      }
    },
  };
}

function readTtl(name: 'CMS_CACHE_TTL_MS' | 'CMS_FILE_CACHE_TTL_MS', fallback: number): number {
  const value = Number(readEnv(name));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const recordsCache = createTtlCache<unknown[]>(readTtl('CMS_CACHE_TTL_MS', 5 * 60 * 1000), 100);
export const fileCache = createTtlCache<{ body: Uint8Array; contentType: string }>(
  readTtl('CMS_FILE_CACHE_TTL_MS', 60 * 60 * 1000),
  80,
);
