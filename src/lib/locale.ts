export type Locale = 'fr' | 'zh';

export const LOCALES: Locale[] = ['fr', 'zh'];
export const DEFAULT_LOCALE: Locale = 'fr';
export const LOCALE_COOKIE = 'eld_locale';

export function isLocale(value: string | undefined | null): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function htmlLang(locale: Locale): string {
  return locale === 'zh' ? 'zh-Hans' : 'fr';
}
