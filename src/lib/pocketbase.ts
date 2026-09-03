import PocketBase from 'pocketbase';

const REQUEST_TIMEOUT_MS = Number(import.meta.env.CMS_TIMEOUT_MS || process.env.CMS_TIMEOUT_MS || 15000);

function readEnv(name: string): string {
  const fromImport = (import.meta.env as Record<string, string | undefined>)[name];
  const fromProcess = typeof process !== 'undefined' ? process.env[name] : undefined;
  return (fromImport || fromProcess || '').trim();
}

export function getPocketBaseUrl(): string | undefined {
  const url = readEnv('PUBLIC_POCKETBASE_URL');
  if (!url) return undefined;
  return url
    .replace(/\/+$/, '')
    .replace(/\/_$/i, '')
    .replace(/\/api$/i, '');
}

let client: PocketBase | null | undefined;

export function getPocketBase(): PocketBase | null {
  if (client !== undefined) return client;

  const url = getPocketBaseUrl();
  if (!url) {
    client = null;
    return null;
  }

  const pb = new PocketBase(url);
  pb.autoCancellation(false);
  pb.beforeSend = (requestUrl, options) => ({
    url: requestUrl,
    options: {
      ...options,
      signal: options.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  });
  client = pb;
  return pb;
}
