import type { Locale } from './locale';

const COPY = {
  fr: {
    title: 'Contenu indisponible',
    body: 'Le site ne peut pas charger ses contenus pour le moment. Merci de réessayer dans un instant.',
    retry: 'Réessayer',
  },
  zh: {
    title: '内容无法加载',
    body: '网站暂时无法获取内容，请稍后重试。',
    retry: '重试',
  },
} as const;

export function cmsErrorCopy(locale: Locale) {
  return COPY[locale] ?? COPY.fr;
}
