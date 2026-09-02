import PocketBase from 'pocketbase';

export function getPocketBaseUrl(): string | undefined {
  const url = import.meta.env.PUBLIC_POCKETBASE_URL?.trim();
  if (!url) return undefined;
  return url.replace(/\/+$/, '').replace(/\/api$/i, '');
}

export function isCmsConfigured(): boolean {
  return Boolean(getPocketBaseUrl());
}

export function getPocketBase(): PocketBase | null {
  const url = getPocketBaseUrl();
  if (!url) return null;

  const pb = new PocketBase(url);
  pb.autoCancellation(false);
  pb.beforeSend = (requestUrl, options) => {
    const headers = new Headers(options.headers);
    return {
      url: requestUrl,
      options: {
        ...options,
        headers,
        signal: options.signal ?? AbortSignal.timeout(2500),
      },
    };
  };
  return pb;
}
