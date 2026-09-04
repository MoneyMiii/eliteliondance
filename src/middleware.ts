import { defineMiddleware } from 'astro:middleware';
import { getNavLinks, getPartners, getSettings, getUiLabels } from './lib/api';
import { getRequestLocale } from './lib/request-locale';

function markCmsUnavailable(locals: App.Locals) {
  locals.cmsAvailable = false;
  locals.labels = {};
  locals.navLinks = [];
  locals.settings = undefined;
  locals.partners = [];
}

export const onRequest = defineMiddleware(async (context, next) => {
  const locale = getRequestLocale(context.cookies);
  context.locals.locale = locale;
  context.locals.partners = [];

  const path = context.url.pathname;
  if (path.startsWith('/media/') || path.startsWith('/api/') || path.startsWith('/_astro/')) {
    return next();
  }

  try {
    const [labels, navLinks, settings, partners] = await Promise.all([
      getUiLabels(locale),
      getNavLinks(locale),
      getSettings(),
      getPartners(),
    ]);
    if (!labels.ok || !navLinks.ok || !settings.ok || !partners.ok) {
      markCmsUnavailable(context.locals);
      return next();
    }

    context.locals.cmsAvailable = true;
    context.locals.labels = labels.data;
    context.locals.navLinks = navLinks.data;
    context.locals.settings = settings.data;
    context.locals.partners = partners.data;
  } catch (error) {
    console.error('[cms] bootstrap failed', error);
    markCmsUnavailable(context.locals);
  }

  return next();
});
