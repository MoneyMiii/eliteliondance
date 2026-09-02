type CacheEntry<T> = { expires: number; value: T };

export function createTtlCache<T>(ttlMs: number) {
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
      store.set(key, { expires: Date.now() + ttlMs, value });
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

function readTtl(name: string, fallback: number): number {
  const raw = import.meta.env[name] || (typeof process !== 'undefined' ? process.env[name] : undefined);
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const recordsCache = createTtlCache<unknown[]>(readTtl('CMS_CACHE_TTL_MS', 5 * 60 * 1000));
export const fileCache = createTtlCache<{ body: Uint8Array; contentType: string }>(
  readTtl('CMS_FILE_CACHE_TTL_MS', 60 * 60 * 1000),
);
