import { useMemo, useState } from 'react';
import { sortAgendaEvents, sortPastEvents, sortUpcomingEvents, type EventFilter } from '../../lib/events';
import type { Locale } from '../../lib/locale';
import type { EventItem } from '../../lib/types';
import { t, type Labels } from '../../lib/i18n';
import EventCard from './EventCard';

interface Props {
  locale: Locale;
  labels: Labels;
  events: EventItem[];
  initialFilter?: EventFilter;
  logoMark?: string;
}

export default function EventsList({ locale, labels, events, initialFilter = 'all', logoMark }: Props) {
  const [filter, setFilter] = useState<EventFilter>(initialFilter);

  const visible = useMemo(() => {
    if (filter === 'upcoming') return sortUpcomingEvents(events.filter((event) => event.isUpcoming));
    if (filter === 'past') return sortPastEvents(events.filter((event) => !event.isUpcoming));
    return sortAgendaEvents(events);
  }, [events, filter]);

  const filters: { id: EventFilter; key: 'events.filterAll' | 'events.filterUpcoming' | 'events.filterPast' }[] = [
    { id: 'all', key: 'events.filterAll' },
    { id: 'upcoming', key: 'events.filterUpcoming' },
    { id: 'past', key: 'events.filterPast' },
  ];

  return (
    <div>
      <div className="block-gap flex flex-wrap gap-2" role="tablist" aria-label={t(labels, 'events.allTitle')}>
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`rounded-full px-4 py-2 text-sm ${filter === item.id ? 'bg-brand text-paper' : 'border border-brand/20 text-mist hover:text-brand'}`}
            onClick={() => setFilter(item.id)}
            aria-pressed={filter === item.id}
          >
            {t(labels, item.key)}
          </button>
        ))}
      </div>
      {visible.length ? (
        <div className="grid items-stretch gap-5 pt-1 md:grid-cols-2">
          {visible.map((event) => (
            <EventCard key={event.id} locale={locale} labels={labels} event={event} logoMark={logoMark} />
          ))}
        </div>
      ) : (
        <p className="rounded-3xl border border-brand/15 px-6 py-12 text-center text-mist">{t(labels, 'events.empty')}</p>
      )}
    </div>
  );
}
