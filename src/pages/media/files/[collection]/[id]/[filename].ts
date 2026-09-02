import type { APIRoute } from 'astro';
import { loadPocketBaseFile } from '../../../lib/media';

export const prerender = false;

function isSafeSegment(value: string): boolean {
  return /^[\w.-]+$/.test(value) && !value.includes('..');
}

export const GET: APIRoute = async ({ params, url }) => {
  const collection = params.collection ?? '';
  const id = params.id ?? '';
  const filename = params.filename ?? '';
  const thumb = url.searchParams.get('thumb');

  if (!isSafeSegment(collection) || !isSafeSegment(id) || !isSafeSegment(filename)) {
    return new Response('Not found', { status: 404 });
  }

  const file = await loadPocketBaseFile(collection, id, filename, thumb);
  if (!file) return new Response('Not found', { status: 404 });

  return new Response(file.body, {
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
};
