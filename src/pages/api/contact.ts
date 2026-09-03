import type { APIRoute } from 'astro';
import { getServices, getSettings, getUiLabels } from '../../lib/api';
import { contactFieldErrors } from '../../lib/contact-validation';
import { getRequestLocale } from '../../lib/request-locale';
import { t } from '../../lib/i18n';

export const prerender = false;

const WINDOW_MS = Number(import.meta.env.CONTACT_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const MAX = Number(import.meta.env.CONTACT_RATE_LIMIT_MAX || 5);
const hits = new Map<string, number[]>();

/** Destinataire tant que le domaine n’est pas vérifié : l’e-mail du compte Resend. */
const DEFAULT_TO = 'min.sun@efrei.net';
const DEFAULT_FROM = 'Elite Lion Dance <onboarding@resend.dev>';

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

function firstValue(...values: (string | undefined)[]): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

function readSecret(name: string): string {
  const fromProcess = typeof process !== 'undefined' ? process.env[name] : undefined;
  const fromImport = (import.meta.env as Record<string, string | undefined>)[name];
  return (fromProcess || fromImport || '').trim().replace(/^["']|["']$/g, '');
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
  const serviceId = clean(payload.service, 40);
  const message = clean(payload.message, 5000);

  const locale = getRequestLocale(cookies);
  const [labelsResult, settingsResult, servicesResult] = await Promise.all([
    getUiLabels(locale),
    getSettings(),
    getServices(locale),
  ]);
  const labels = labelsResult.ok ? labelsResult.data : {};
  const settings = settingsResult.ok ? settingsResult.data : undefined;
  const services = servicesResult.ok ? servicesResult.data : [];
  const selectedService = services.find((service) => service.id === serviceId);

  const fields = contactFieldErrors({
    lastName,
    email,
    phone,
    message,
    service: selectedService ? selectedService.id : '',
    serviceRequired: services.length > 0,
  });
  if (Object.keys(fields).length) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid', fields }), { status: 400 });
  }

  const to = firstValue(readSecret('CONTACT_TO_EMAIL'), settings?.contactEmail) ?? DEFAULT_TO;
  const from = firstValue(readSecret('CONTACT_FROM_EMAIL')) ?? DEFAULT_FROM;
  const resendKey = readSecret('RESEND_API_KEY');

  const empty = t(labels, 'form.emptyValue') || '-';
  const subject = t(labels, 'form.emailSubject', { name: lastName }) || `Contact : ${lastName}`;
  const body = [
    `${t(labels, 'form.lastName') || 'Nom'}: ${lastName}`,
    `${t(labels, 'form.firstName') || 'Prénom'}: ${firstName || empty}`,
    `${t(labels, 'form.email') || 'E-mail'}: ${email}`,
    `${t(labels, 'form.phone') || 'Téléphone'}: ${phone}`,
    `${t(labels, 'form.service') || 'Prestation'}: ${selectedService?.title || empty}`,
    '',
    message,
  ].join('\n');

  if (!resendKey) {
    console.info('[contact] captured request (no RESEND_API_KEY)', { to, from, lastName, email, phone, service: selectedService?.title });
    if (import.meta.env.PROD) {
      return new Response(JSON.stringify({ ok: false, error: 'unconfigured' }), { status: 503 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text: body,
      reply_to: email,
    }),
  });

  if (!response.ok) {
    console.error('[contact] resend failed', await response.text());
    return new Response(JSON.stringify({ ok: false, error: 'email_failed' }), { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
