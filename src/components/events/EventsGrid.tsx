import type { Locale } from '../../lib/locale';
import type { EventItem } from '../../lib/types';
import { t, type Labels } from '../../lib/i18n';
import { useLiveLabels, useLiveLocale, useLiveSlice } from '../../lib/use-live-i18n';
import EventCard from './EventCard';

interface Props {
  locale: Locale;
  labels: Labels;
  events: EventItem[];
  logoMark?: string;
  moreHref?: string;
  live?: boolean;
}

export default function EventsGrid({ locale, labels, events, logoMark, moreHref, live = false }: Props) {
  const liveLocale = useLiveLocale(locale);
  const liveLabels = useLiveLabels(labels);
  const syncedEvents = useLiveSlice('events', events);
  const items = live ? syncedEvents : events;
  const label = t(liveLabels, 'events.moreUpcoming');

  return (
    <div className="grid items-start gap-4 pt-1 md:grid-cols-2">
      {items.map((event) => (
        <EventCard key={event.id} locale={liveLocale} labels={liveLabels} event={event} logoMark={logoMark} />
      ))}
      {moreHref && label ? (
        <div className="flex items-center justify-center self-center py-2 md:py-0">
          <a
            href={moreHref}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand text-2xl font-semibold leading-none text-paper transition-colors hover:bg-ink"
            aria-label={label}
          >
            +
          </a>
        </div>
      ) : null}
    </div>
  );
}
