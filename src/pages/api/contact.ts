import type { APIRoute } from 'astro';
import { getSettings, getUiLabels } from '../../lib/api';
import { getRequestLocale } from '../../lib/request-locale';
import { t } from '../../lib/i18n';

export const prerender = false;

const WINDOW_MS = Number(import.meta.env.CONTACT_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const MAX = Number(import.meta.env.CONTACT_RATE_LIMIT_MAX || 5);
const hits = new Map<string, number[]>();

function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('cf-connecting-ip')
    || 'local';
}

function allow(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((stamp) => now - stamp < WINDOW_MS);
  if (recent.length >= MAX) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

function clean(value: unknown, max = 2000): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, max);
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!allow(clientIp(request))) {
    return new Response(JSON.stringify({ ok: false, error: 'rate_limited' }), { status: 429 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_json' }), { status: 400 });
  }

  if (clean(payload.companyUrl)) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  const lastName = clean(payload.lastName, 120);
  const firstName = clean(payload.firstName, 120);
  const email = clean(payload.email, 180);
  const phone = clean(payload.phone, 40);
  const message = clean(payload.message, 5000);

  if (!lastName || !email || !phone || !message || !isEmail(email)) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid' }), { status: 400 });
  }

  const locale = getRequestLocale(cookies);
  const labelsResult = await getUiLabels(locale);
  if (!labelsResult.ok) {
    return new Response(JSON.stringify({ ok: false, error: 'cms_unavailable' }), { status: 503 });
  }
  const labels = labelsResult.data;
  const empty = t(labels, 'form.emptyValue');
  const settingsResult = await getSettings();
  if (!settingsResult.ok) {
    return new Response(JSON.stringify({ ok: false, error: 'cms_unavailable' }), { status: 503 });
  }
  const to = settingsResult.data.contactEmail;
  const from = settingsResult.data.fromEmail;
  const resendKey = import.meta.env.RESEND_API_KEY;

  const body = [
    `${t(labels, 'form.lastName')}: ${lastName}`,
    `${t(labels, 'form.firstName')}: ${firstName || empty}`,
    `${t(labels, 'form.email')}: ${email || empty}`,
    `${t(labels, 'form.phone')}: ${phone || empty}`,
    '',
    message,
  ].join('\n');

  if (resendKey && to && from) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject: t(labels, 'form.emailSubject', { name: lastName }),
        text: body,
        reply_to: email,
      }),
    });

    if (!response.ok) {
      console.error('[contact] resend failed', await response.text());
      return new Response(JSON.stringify({ ok: false, error: 'email_failed' }), { status: 502 });
    }
  } else {
    console.info('[contact] captured request', { to: to || 'unconfigured', from: from || 'unconfigured', lastName, email, phone });
    if (import.meta.env.PROD && (!to || !from)) {
      return new Response(JSON.stringify({ ok: false, error: 'unconfigured' }), { status: 503 });
    }
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
