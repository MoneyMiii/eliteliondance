import type { Locale } from './locale';

export function getLocalizedValue(
  record: object,
  field: string,
  locale: Locale,
): string {
  const data = record as Record<string, unknown>;
  const localized = data[`${field}_${locale}`];
  return typeof localized === 'string' ? localized : '';
}

export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function localizedPlain(record: object, field: string, locale: Locale): string {
  return stripHtml(getLocalizedValue(record, field, locale));
}

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}
