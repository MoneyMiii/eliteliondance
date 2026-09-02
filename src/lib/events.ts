export type EventFilter = 'all' | 'upcoming' | 'past';

function eventTimestamp(dateTime: string): number {
  const value = new Date(dateTime).getTime();
  return Number.isNaN(value) ? 0 : value;
}

/** Soonest upcoming first (next event, then the one after, …). */
export function sortUpcomingEvents<T extends { dateTime: string }>(events: T[]): T[] {
  return [...events].sort((a, b) => eventTimestamp(a.dateTime) - eventTimestamp(b.dateTime));
}

/** Most recently held first, then older past events. */
export function sortPastEvents<T extends { dateTime: string }>(events: T[]): T[] {
  return [...events].sort((a, b) => eventTimestamp(b.dateTime) - eventTimestamp(a.dateTime));
}

/** Upcoming (soonest first), then past (most recent first). */
export function sortAgendaEvents<T extends { dateTime: string; isUpcoming: boolean }>(events: T[]): T[] {
  return [
    ...sortUpcomingEvents(events.filter((event) => event.isUpcoming)),
    ...sortPastEvents(events.filter((event) => !event.isUpcoming)),
  ];
}

export function parseEventFilter(value: string | null): EventFilter {
  if (value === 'avenir' || value === 'future' || value === 'upcoming') return 'upcoming';
  if (value === 'passes' || value === 'past') return 'past';
  return 'all';
}
