import type { Labels } from './i18n';
import { LOCALES, LOCALE_COOKIE, type Locale } from './locale';
import type { EventItem, NavLink, ServiceItem, TeamMember } from './types';

export interface ContactServiceOption {
  id: string;
  title: string;
}

export interface LiveI18n {
  locale: Locale;
  htmlLang: string;
  documentTitle: string;
  description: string;
  ogLocale: string;
  labels: Labels;
  navLinks: NavLink[];
  texts: Record<string, string>;
  htmls: Record<string, string>;
  events?: EventItem[];
  team?: TeamMember[];
  services?: ServiceItem[];
  contactServices?: ContactServiceOption[];
}

const EVENT = 'eld:i18n';
const inflight = new Map<string, Promise<LiveI18n>>();
let current: LiveI18n | null = null;

export function getLiveI18n(): LiveI18n | null {
  return current;
}

export function persistLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function i18nPath(): string {
  return document.documentElement.dataset.i18nPath || location.pathname.replace(/\/+$/, '') || '/';
}

function lookup(payload: LiveI18n, key: string): string {
  return payload.texts[key] ?? payload.labels[key] ?? '';
}

function setHidden(element: HTMLElement, hide: boolean) {
  element.hidden = hide;
}

function insideIsland(element: Element): boolean {
  return Boolean(element.closest('astro-island'));
}

function applyTexts(payload: LiveI18n) {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
    if (insideIsland(element)) return;
    const key = element.dataset.i18n;
    if (!key) return;
    const value = lookup(payload, key);
    if (element.textContent !== value) element.textContent = value;
    if (element.dataset.i18nEmpty === 'hide') setHidden(element, !value);
  });

  document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((element) => {
    if (insideIsland(element)) return;
    const key = element.dataset.i18nHtml;
    if (!key) return;
    const value = payload.htmls[key] ?? '';
    if (element.innerHTML !== value) element.innerHTML = value;
    if (element.dataset.i18nEmpty === 'hide') setHidden(element, !value);
  });

  document.querySelectorAll<HTMLElement>('[data-i18n-attr]').forEach((element) => {
    if (insideIsland(element)) return;
    const spec = element.dataset.i18nAttr;
    if (!spec) return;
    for (const part of spec.trim().split(/\s+/)) {
      const split = part.indexOf(':');
      if (split < 1) continue;
      const attr = part.slice(0, split);
      const key = part.slice(split + 1);
      const value = lookup(payload, key);
      if (value) element.setAttribute(attr, value);
      else element.removeAttribute(attr);
    }
  });

  document.querySelectorAll<HTMLElement>('[data-i18n-show]').forEach((element) => {
    if (insideIsland(element)) return;
    const spec = element.dataset.i18nShow;
    if (!spec) return;
    const visible = spec.split(',').some((key) => lookup(payload, key.trim()));
    setHidden(element, !visible);
  });
}

function applyHead(payload: LiveI18n) {
  document.documentElement.lang = payload.htmlLang;
  document.title = payload.documentTitle;

  const pairs: Array<[string, string]> = [
    ['meta[name="description"]', payload.description],
    ['meta[property="og:title"]', payload.documentTitle],
    ['meta[property="og:description"]', payload.description],
    ['meta[property="og:locale"]', payload.ogLocale],
    ['meta[name="twitter:title"]', payload.documentTitle],
    ['meta[name="twitter:description"]', payload.description],
  ];

  for (const [selector, value] of pairs) {
    const element = document.querySelector(selector);
    if (element && value) element.setAttribute('content', value);
  }
}

export function applyLiveI18n(payload: LiveI18n) {
  current = payload;
  applyHead(payload);
  applyTexts(payload);
  window.dispatchEvent(new CustomEvent<LiveI18n>(EVENT, { detail: payload }));
}

export function subscribeLiveI18n(listener: (payload: LiveI18n) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<LiveI18n>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

export function fetchI18n(locale: Locale): Promise<LiveI18n> {
  const key = `${locale}:${i18nPath()}`;
  const pending = inflight.get(key);
  if (pending) return pending;

  const request = fetch(`/api/i18n?locale=${encodeURIComponent(locale)}&path=${encodeURIComponent(i18nPath())}`)
    .then(async (response) => {
      if (!response.ok) throw new Error('i18n_failed');
      return (await response.json()) as LiveI18n;
    })
    .catch((error) => {
      inflight.delete(key);
      throw error;
    });

  inflight.set(key, request);
  return request;
}

export function prefetchOtherLocales(currentLocale: Locale) {
  for (const locale of LOCALES) {
    if (locale !== currentLocale) void fetchI18n(locale).catch(() => undefined);
  }
}
