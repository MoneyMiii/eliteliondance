import type { APIRoute } from 'astro';
import { isStreamedFile, loadPocketBaseFile, streamPocketBaseFile } from '../../../../../lib/media';

export const prerender = false;

const CACHE_CONTROL = 'public, max-age=86400, stale-while-revalidate=604800';
const FORWARDED = ['content-type', 'content-length', 'content-range', 'accept-ranges'];

function isSafeSegment(value: string): boolean {
  return /^[\w.-]+$/.test(value) && !value.includes('..');
}

const handler: APIRoute = async ({ params, request, url }) => {
  const collection = params.collection ?? '';
  const id = params.id ?? '';
  const filename = params.filename ?? '';
  const thumb = url.searchParams.get('thumb');
  const range = request.headers.get('range');
  const head = request.method === 'HEAD';

  if (!isSafeSegment(collection) || !isSafeSegment(id) || !isSafeSegment(filename)) {
    return new Response(null, { status: 404 });
  }

  // Safari iOS exige les plages d'octets pour lire une balise <video>.
  if (range || head || isStreamedFile(filename)) {
    const upstream = await streamPocketBaseFile(collection, id, filename, thumb, range);
    if (!upstream) return new Response(null, { status: 404 });

    const headers = new Headers();
    for (const name of FORWARDED) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    headers.set('Cache-Control', CACHE_CONTROL);
    if (!headers.has('accept-ranges')) headers.set('Accept-Ranges', 'bytes');

    if (head) {
      await upstream.body?.cancel();
      return new Response(null, { status: upstream.status, headers });
    }
    return new Response(upstream.body, { status: upstream.status, headers });
  }

  const file = await loadPocketBaseFile(collection, id, filename, thumb);
  if (!file) return new Response(null, { status: 404 });

  return new Response(Buffer.from(file.body), {
    headers: {
      'Content-Type': file.contentType,
      'Content-Length': String(file.body.byteLength),
      'Cache-Control': CACHE_CONTROL,
    },
  });
};

export const GET = handler;
export const HEAD = handler;
