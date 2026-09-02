import type { Locale } from './locale';

export function formatEventDate(dateTime: string, locale: Locale): string {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return dateTime;

  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
}

export function distinctText(value?: string | null, ...others: Array<string | null | undefined>): string | undefined {
  const text = value?.replace(/\s+/g, ' ').trim();
  if (!text) return undefined;

  const normalized = text.toLocaleLowerCase();
  for (const other of others) {
    const compared = other?.replace(/\s+/g, ' ').trim().toLocaleLowerCase();
    if (compared && compared === normalized) return undefined;
  }

  return text;
}
