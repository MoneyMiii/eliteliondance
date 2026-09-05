import { t } from './i18n';
import type { Locale } from './locale';

interface SeoInput {
  locale: Locale;
  title?: string;
  description?: string;
  path: string;
  image?: string;
  siteUrl?: string;
  defaultTitle?: string;
  defaultDescription?: string;
  brandName?: string;
  titlePattern?: string;
}

interface OrganizationInput {
  name?: string;
  url?: string;
  areaServed?: string;
  instagramUrl?: string;
  logo?: string;
}

function absoluteUrl(path: string, siteUrl?: string): string {
  if (!siteUrl) return path;
  try {
    return new URL(path, siteUrl).toString();
  } catch {
    return path;
  }
}

export function buildSeo({
  locale,
  title,
  description,
  path,
  image,
  siteUrl,
  defaultTitle,
  defaultDescription,
  brandName,
  titlePattern,
}: SeoInput) {
  const brand = brandName || '';
  const resolvedTitle = defaultTitle || brand;
  const pageTitle = !title || title === brand || title === resolvedTitle
    ? resolvedTitle
    : t({ pattern: titlePattern || '' }, 'pattern', { title, brand });
  const pageDescription = description || defaultDescription || '';

  return {
    title: pageTitle,
    description: pageDescription,
    url: absoluteUrl(path, siteUrl),
    image: image || '',
    locale: locale === 'zh' ? 'zh_CN' : 'fr_FR',
  };
}

export function organizationJsonLd({
  name = '',
  url = '',
  areaServed = '',
  instagramUrl = '',
  logo = '',
}: OrganizationInput = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'PerformingGroup',
    name: name || undefined,
    url: url || undefined,
    logo: logo || undefined,
    areaServed: areaServed || undefined,
    inLanguage: ['fr', 'zh'],
    sameAs: instagramUrl ? [instagramUrl] : [],
  };
}
