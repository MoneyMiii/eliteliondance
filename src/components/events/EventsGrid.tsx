import type { Locale } from '../../lib/locale';
import type { EventItem } from '../../lib/types';
import type { Labels } from '../../lib/i18n';
import EventCard from './EventCard';

interface Props {
  locale: Locale;
  labels: Labels;
  events: EventItem[];
  logoMark?: string;
  moreHref?: string;
  moreLabel?: string;
}

export default function EventsGrid({ locale, labels, events, logoMark, moreHref, moreLabel }: Props) {
  return (
    <div className="grid items-start gap-4 pt-1 md:grid-cols-2">
      {events.map((event) => (
        <EventCard key={event.id} locale={locale} labels={labels} event={event} logoMark={logoMark} />
      ))}
      {moreHref && moreLabel ? (
        <div className="flex items-center justify-center self-center py-2 md:py-0">
          <a
            href={moreHref}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand text-2xl font-semibold leading-none text-paper transition-colors hover:bg-ink"
            aria-label={moreLabel}
          >
            +
          </a>
        </div>
      ) : null}
    </div>
  );
}
