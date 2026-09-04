import PocketBase from 'pocketbase';
import { readEnv } from './env';

const REQUEST_TIMEOUT_MS = Number(readEnv('CMS_TIMEOUT_MS') || 15000);

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
