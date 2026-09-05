import {
  getAboutBlocks,
  getContactServices,
  getEvents,
  getHomeData,
  getNavLinks,
  getPage,
  getSettings,
  getUiLabels,
} from './api';
import { distinctText } from './format';
import { t, type Labels } from './i18n';
import type { LiveI18n } from './live-i18n';
import { htmlLang, type Locale } from './locale';
import { sanitizeHtml, stripHtml } from './localize';
import { buildSeo } from './seo';
import type { EditorialBlock } from './types';

function pagePath(path: string): string {
  const clean = path.split('?')[0]?.replace(/\/+$/, '') || '/';
  return clean.startsWith('/') ? clean : `/${clean}`;
}

function setText(texts: Record<string, string>, key: string, value?: string | null) {
  texts[key] = value?.replace(/\s+/g, ' ').trim() || '';
}

function setHtml(htmls: Record<string, string>, key: string, value?: string | null) {
  htmls[key] = value ? sanitizeHtml(value) : '';
}

function putHeading(texts: Record<string, string>, kicker?: string, title?: string, lede?: string) {
  const shownTitle = title || '';
  const shownKicker = distinctText(kicker, shownTitle) || '';
  const shownLede = distinctText(lede, shownTitle, shownKicker) || '';
  setText(texts, 'page.kicker', shownKicker);
  setText(texts, 'page.title', shownTitle);
  setText(texts, 'page.lede', shownLede);
}

function putEditorial(
  texts: Record<string, string>,
  htmls: Record<string, string>,
  prefix: string,
  block?: EditorialBlock,
) {
  if (!block) return;
  const title = block.title || '';
  setText(texts, `${prefix}.title`, title);
  setText(texts, `${prefix}.eyebrow`, distinctText(block.subtitle, title));
  setText(texts, `${prefix}.cta`, block.ctaLabel);
  setText(texts, `${prefix}.ctaSecondary`, block.ctaSecondaryLabel);
  setHtml(htmls, `${prefix}.content`, block.content);
}

function chromeTexts(labels: Labels, navLinks: LiveI18n['navLinks']) {
  const texts: Record<string, string> = {};
  const year = new Date().getFullYear();
  const brandName = t(labels, 'brand.name');
  setText(texts, 'brand.name', brandName);
  setText(texts, 'brand.logoAlt', t(labels, 'brand.logoAlt'));
  setText(texts, 'footer.copyright', t(labels, 'footer.copyright', { year, name: brandName, rights: t(labels, 'footer.rights') }));
  for (const link of navLinks) {
    setText(texts, `navLink.${link.id}`, link.label);
  }
  return { texts, brandName };
}

export async function buildI18nPayload(rawPath: string, locale: Locale): Promise<LiveI18n | null> {
  const path = pagePath(rawPath);
  const [labelsResult, navResult, settingsResult] = await Promise.all([
    getUiLabels(locale),
    getNavLinks(locale),
    getSettings(),
  ]);
  if (!labelsResult.ok || !navResult.ok || !settingsResult.ok) return null;

  const labels = labelsResult.data;
  const navLinks = navResult.data;
  const settings = settingsResult.data;
  const { texts, brandName } = chromeTexts(labels, navLinks);
  const htmls: Record<string, string> = {};

  let pageTitle: string | undefined;
  let pageDescription: string | undefined;
  const payload: LiveI18n = {
    locale,
    htmlLang: htmlLang(locale),
    documentTitle: '',
    description: '',
    ogLocale: locale === 'zh' ? 'zh_CN' : 'fr_FR',
    labels,
    navLinks,
    texts,
    htmls,
  };

  if (path === '/') {
    const home = await getHomeData(locale, settings);
    if (!home.ok) return null;
    const hero = home.data.content['home.hero'];
    pageTitle = hero?.title;
    pageDescription = stripHtml(hero?.subtitle || hero?.content || '');
    putEditorial(texts, htmls, 'home.hero', hero);
    putEditorial(texts, htmls, 'home.intro', home.data.content['home.intro']);
    putEditorial(texts, htmls, 'home.services', home.data.content['home.services']);
    putEditorial(texts, htmls, 'home.events', home.data.content['home.events']);
    putEditorial(texts, htmls, 'home.gallery', home.data.content['home.gallery']);
    putEditorial(texts, htmls, 'home.about', home.data.content['home.about']);
    putEditorial(texts, htmls, 'home.team', home.data.content['home.team']);
    putEditorial(texts, htmls, 'home.instagram', home.data.content['home.instagram']);
    const instagram = home.data.content['home.instagram'];
    setText(texts, 'home.instagram.lede', distinctText(instagram?.subtitle, instagram?.title || ''));
    payload.events = home.data.upcomingEvents;
    payload.team = home.data.team;
    payload.services = home.data.services;
  } else if (path === '/evenements') {
    const events = await getEvents(locale);
    if (!events.ok) return null;
    pageTitle = t(labels, 'nav.events');
    pageDescription = t(labels, 'events.allTitle');
    putHeading(texts, t(labels, 'events.kicker'), t(labels, 'events.allTitle'));
    payload.events = events.data;
  } else if (path === '/galerie') {
    pageTitle = t(labels, 'nav.gallery');
    pageDescription = t(labels, 'gallery.title');
    putHeading(texts, t(labels, 'gallery.kicker'), t(labels, 'gallery.title'));
  } else if (path === '/a-propos') {
    const [heroResult, blocksResult] = await Promise.all([getPage('about', locale), getAboutBlocks(locale)]);
    if (!heroResult.ok || !blocksResult.ok) return null;
    const hero = heroResult.data;
    pageTitle = hero?.title;
    pageDescription = stripHtml(hero?.content || hero?.subtitle || '');
    putHeading(texts, hero?.subtitle, hero?.title);
    setHtml(htmls, 'about.hero.content', hero?.content);
    blocksResult.data.forEach((block, index) => {
      setText(texts, `about.${index}.title`, block.title);
      setHtml(htmls, `about.${index}.content`, block.content);
    });
  } else if (path === '/contact') {
    const [heroResult, servicesResult] = await Promise.all([
      getPage('contact', locale),
      getContactServices(locale),
    ]);
    if (!heroResult.ok || !servicesResult.ok) return null;
    const hero = heroResult.data;
    pageTitle = hero?.title || t(labels, 'nav.contact');
    pageDescription = hero?.subtitle || t(labels, 'contact.intro');
    putHeading(
      texts,
      hero?.title ? t(labels, 'contact.kicker') : undefined,
      hero?.title || t(labels, 'contact.title'),
      hero?.subtitle || t(labels, 'contact.intro'),
    );
    payload.contactServices = servicesResult.data;
  } else if (path === '/404') {
    pageTitle = t(labels, 'notFound.code');
    putHeading(texts, t(labels, 'notFound.code'), t(labels, 'notFound.title'));
  }

  const seo = buildSeo({
    locale,
    title: pageTitle,
    description: pageDescription,
    path,
    siteUrl: settings.siteUrl,
    defaultTitle: t(labels, 'seo.defaultTitle'),
    defaultDescription: t(labels, 'seo.defaultDescription'),
    brandName,
    titlePattern: t(labels, 'seo.titlePattern'),
  });
  payload.documentTitle = seo.title;
  payload.description = seo.description;
  payload.ogLocale = seo.locale;
  return payload;
}
