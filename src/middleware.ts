import { defineMiddleware } from 'astro:middleware';
import { getNavLinks, getSettings, getUiLabels } from './lib/api';
import { getRequestLocale } from './lib/request-locale';

export const onRequest = defineMiddleware(async (context, next) => {
  const locale = getRequestLocale(context.cookies);
  context.locals.locale = locale;

  try {
    const [labels, navLinks, settings] = await Promise.all([
      getUiLabels(locale),
      getNavLinks(locale),
      getSettings(),
    ]);
    if (!labels.ok || !navLinks.ok || !settings.ok) {
      context.locals.cmsAvailable = false;
      context.locals.labels = {};
      context.locals.navLinks = [];
      context.locals.settings = undefined;
      return next();
    }

    context.locals.cmsAvailable = true;
    context.locals.labels = labels.data;
    context.locals.navLinks = navLinks.data;
    context.locals.settings = settings.data;
  } catch (error) {
    console.error('[cms] bootstrap failed', error);
    context.locals.cmsAvailable = false;
    context.locals.labels = {};
    context.locals.navLinks = [];
    context.locals.settings = undefined;
  }

  return next();
});
