import { LOCALE_COOKIE, type Locale } from '../../lib/locale';
import { t, type Labels } from '../../lib/i18n';

interface Props {
  locale: Locale;
  labels: Labels;
}

export default function LanguageSwitcher({ locale, labels }: Props) {
  function setLocale(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    window.location.reload();
  }

  return (
    <div className="flex h-8 items-center gap-1 rounded-full border-2 border-brand/45 bg-paper p-0.5 text-xs font-semibold tracking-widest" role="group" aria-label={t(labels, 'lang.switch')}>
      <button
        type="button"
        className={`rounded-full px-2.5 py-1 transition-colors ${locale === 'fr' ? 'bg-brand text-paper' : 'text-mist hover:text-brand'}`}
        aria-pressed={locale === 'fr'}
        onClick={() => setLocale('fr')}
      >
        {t(labels, 'lang.fr')}
      </button>
      <button
        type="button"
        className={`rounded-full px-2.5 py-1 transition-colors ${locale === 'zh' ? 'bg-brand text-paper' : 'text-mist hover:text-brand'}`}
        aria-pressed={locale === 'zh'}
        onClick={() => setLocale('zh')}
      >
        {t(labels, 'lang.zh')}
      </button>
    </div>
  );
}
