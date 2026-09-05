import { useMemo, useState } from 'react';
import { sortAgendaEvents, sortPastEvents, sortUpcomingEvents, type EventFilter } from '../../lib/events';
import type { Locale } from '../../lib/locale';
import type { EventItem } from '../../lib/types';
import { t, type Labels } from '../../lib/i18n';
import { useLiveLabels, useLiveLocale, useLiveSlice } from '../../lib/use-live-i18n';
import EmptyState from '../common/EmptyState';
import EventsGrid from './EventsGrid';

interface Props {
  locale: Locale;
  labels: Labels;
  events: EventItem[];
  initialFilter?: EventFilter;
  logoMark?: string;
}

export default function EventsList({ locale, labels, events, initialFilter = 'all', logoMark }: Props) {
  const liveLocale = useLiveLocale(locale);
  const liveLabels = useLiveLabels(labels);
  const liveEvents = useLiveSlice('events', events);
  const [filter, setFilter] = useState<EventFilter>(initialFilter);

  const visible = useMemo(() => {
    if (filter === 'upcoming') return sortUpcomingEvents(liveEvents.filter((event) => event.isUpcoming));
    if (filter === 'past') return sortPastEvents(liveEvents.filter((event) => !event.isUpcoming));
    return sortAgendaEvents(liveEvents);
  }, [liveEvents, filter]);

  const filters: { id: EventFilter; key: 'events.filterAll' | 'events.filterUpcoming' | 'events.filterPast' }[] = [
    { id: 'all', key: 'events.filterAll' },
    { id: 'upcoming', key: 'events.filterUpcoming' },
    { id: 'past', key: 'events.filterPast' },
  ];

  return (
    <div>
      <div className="block-gap flex flex-wrap gap-2" role="tablist" aria-label={t(liveLabels, 'events.allTitle')}>
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`rounded-full px-4 py-2 text-sm ${filter === item.id ? 'bg-brand text-paper' : 'border border-brand/20 text-mist hover:text-brand'}`}
            onClick={() => setFilter(item.id)}
            aria-pressed={filter === item.id}
          >
            {t(liveLabels, item.key)}
          </button>
        ))}
      </div>
      {visible.length ? (
        <EventsGrid locale={liveLocale} labels={liveLabels} events={visible} logoMark={logoMark} />
      ) : (
        <EmptyState message={t(liveLabels, 'events.empty')} />
      )}
    </div>
  );
}
