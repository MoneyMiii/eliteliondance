import { useEffect, useState } from 'react';
import type { Labels } from './i18n';
import { getLiveI18n, subscribeLiveI18n, type LiveI18n } from './live-i18n';
import type { Locale } from './locale';

export function useLiveLabels(initial: Labels): Labels {
  const [labels, setLabels] = useState(() => getLiveI18n()?.labels ?? initial);
  useEffect(() => subscribeLiveI18n((payload) => setLabels(payload.labels)), []);
  return labels;
}

export function useLiveLocale(initial: Locale): Locale {
  const [locale, setLocale] = useState(() => getLiveI18n()?.locale ?? initial);
  useEffect(() => subscribeLiveI18n((payload) => setLocale(payload.locale)), []);
  return locale;
}

export function useLiveSlice<K extends 'navLinks' | 'events' | 'team' | 'services' | 'contactServices'>(
  key: K,
  initial: NonNullable<LiveI18n[K]>,
): NonNullable<LiveI18n[K]> {
  const [value, setValue] = useState(
    () => (getLiveI18n()?.[key] as NonNullable<LiveI18n[K]> | undefined) ?? initial,
  );

  useEffect(
    () =>
      subscribeLiveI18n((payload) => {
        const next = payload[key];
        if (next !== undefined) setValue(next as NonNullable<LiveI18n[K]>);
      }),
    [key],
  );

  return value;
}
