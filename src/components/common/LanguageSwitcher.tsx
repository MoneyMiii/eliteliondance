import { useEffect, useState } from 'react';
import { LOCALES, type Locale } from '../../lib/locale';
import { t, type Labels } from '../../lib/i18n';
import { applyLiveI18n, fetchI18n, getLiveI18n, persistLocale, prefetchOtherLocales } from '../../lib/live-i18n';
import { useLiveLabels, useLiveLocale } from '../../lib/use-live-i18n';

interface Props {
  locale: Locale;
  labels: Labels;
}

const LABEL_KEY: Record<Locale, string> = {
  fr: 'lang.fr',
  zh: 'lang.zh',
};

export default function LanguageSwitcher({ locale, labels }: Props) {
  const liveLocale = useLiveLocale(locale);
  const liveLabels = useLiveLabels(labels);
  const [pending, setPending] = useState<Locale | null>(null);
  const active = pending ?? getLiveI18n()?.locale ?? liveLocale;

  useEffect(() => {
    prefetchOtherLocales(liveLocale);
  }, [liveLocale]);

  async function setLocale(next: Locale) {
    const currentLocale = getLiveI18n()?.locale ?? liveLocale;
    if (next === currentLocale || pending) return;
    setPending(next);
    persistLocale(next);
    try {
      applyLiveI18n(await fetchI18n(next));
    } catch {
      persistLocale(currentLocale);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex h-8 items-center gap-1 rounded-full border-2 border-brand/45 bg-paper p-0.5 text-xs font-semibold tracking-widest" role="group" aria-label={t(liveLabels, 'lang.switch')} aria-busy={Boolean(pending)}>
      {LOCALES.map((id) => (
        <button
          key={id}
          type="button"
          className={`rounded-full px-2.5 py-1 transition-colors ${active === id ? 'bg-brand text-paper' : 'text-mist hover:text-brand'}`}
          aria-pressed={active === id}
          onClick={() => setLocale(id)}
        >
          {t(liveLabels, LABEL_KEY[id])}
        </button>
      ))}
    </div>
  );
}
