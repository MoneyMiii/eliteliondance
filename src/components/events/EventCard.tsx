import { useMemo, useState } from 'react';
import type { Locale } from '../../lib/locale';
import type { EventItem } from '../../lib/types';
import { t, type Labels } from '../../lib/i18n';
import { formatEventDate } from '../../lib/format';

interface Props {
  locale: Locale;
  labels: Labels;
  event: EventItem;
  logoMark?: string;
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 fill-none stroke-current stroke-[1.75]" aria-hidden="true">
      <path d="M12 21s6.5-5.2 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.8 12 21 12 21Z" strokeLinejoin="round" />
      <circle cx="12" cy="10.5" r="2.2" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 fill-none stroke-current stroke-[2] transition-transform duration-500 ease-cinematic ${
        open ? 'rotate-180' : ''
      }`}
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function EventCard({ locale, labels, event, logoMark }: Props) {
  const [open, setOpen] = useState(false);
  const dateLabel = useMemo(() => formatEventDate(event.dateTime, locale), [event.dateTime, locale]);
  const onMedia = Boolean(event.image);
  const canExpand = Boolean(event.description);

  const body = (
    <div className="relative overflow-hidden">
      {onMedia ? (
        <>
          <img src={event.image} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/45 to-ink/20" />
        </>
      ) : logoMark ? (
        <img
          src={logoMark}
          alt=""
          className="pointer-events-none absolute -right-3 bottom-0 h-16 w-auto opacity-[0.14]"
        />
      ) : null}

      <div className="relative flex items-start justify-between gap-3 px-3.5 py-3">
        <div className="min-w-0">
          <p className={`text-[0.62rem] uppercase tracking-[0.24em] ${onMedia ? 'text-paper/75' : 'text-brand'}`}>
            {event.isUpcoming ? t(labels, 'events.filterUpcoming') : t(labels, 'events.filterPast')}
          </p>
          <h3 className={`mt-0.5 font-display text-lg uppercase leading-tight ${onMedia ? 'text-paper' : 'text-ink'}`}>
            {event.title}
          </h3>
          <p className={`mt-1 text-xs ${onMedia ? 'text-paper/70' : 'text-mist'}`}>{dateLabel}</p>
          {event.location ? (
            <p className={`mt-1 inline-flex items-center gap-1.5 text-xs ${onMedia ? 'text-paper/85' : 'text-brand'}`}>
              <LocationIcon />
              <span>{event.location}</span>
            </p>
          ) : null}
        </div>
        {canExpand && (
          <span
            className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
              onMedia ? 'border-paper/35 bg-ink/40 text-paper' : 'border-brand/25 bg-paper text-brand'
            }`}
          >
            <ChevronIcon open={open} />
          </span>
        )}
      </div>
    </div>
  );

  return (
    <article
      className={`overflow-hidden rounded-xl border shadow-[0_8px_24px_rgba(20,26,20,0.04)] transition-[border-color,box-shadow] duration-500 ease-cinematic ${
        onMedia ? 'bg-ink' : 'bg-forest'
      } ${open ? 'border-brand/50 shadow-[0_12px_28px_rgba(46,89,43,0.1)]' : 'border-brand/15'}`}
    >
      {canExpand ? (
        <button
          type="button"
          className="block w-full text-left"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={`event-desc-${event.id}`}
        >
          {body}
        </button>
      ) : (
        <div>{body}</div>
      )}

      {canExpand ? (
        <div
          id={`event-desc-${event.id}`}
          aria-hidden={!open}
          className={`grid bg-ink transition-[grid-template-rows] duration-500 ease-cinematic ${
            open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="px-3.5 py-3">
              <span className="mb-2.5 block h-px w-8 bg-paper/25" />
              <div
                className="prose-eld text-sm leading-relaxed text-paper/80 [&_*]:text-paper/80"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
