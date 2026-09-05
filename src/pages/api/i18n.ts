import type { APIRoute } from 'astro';
import { buildI18nPayload } from '../../lib/i18n-payload';
import { isLocale } from '../../lib/locale';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const locale = url.searchParams.get('locale') ?? '';
  const path = url.searchParams.get('path') ?? '/';
  if (!isLocale(locale)) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_locale' }), { status: 400 });
  }

  const payload = await buildI18nPayload(path, locale);
  if (!payload) {
    return new Response(JSON.stringify({ ok: false, error: 'unavailable' }), { status: 503 });
  }

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, max-age=60',
    },
  });
};
