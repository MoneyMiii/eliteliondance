import type { AstroCookies } from 'astro';
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from './locale';

export function getRequestLocale(cookies: AstroCookies): Locale {
  const value = cookies.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
