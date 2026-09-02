import { useMemo, useState } from 'react';
import type { Locale } from '../../lib/locale';
import type { EventItem } from '../../lib/types';
import { t, type Labels } from '../../lib/i18n';
import { formatEventDate } from '../../lib/format';
import { useIsComputer } from '../../lib/pointer';

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

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.7]" aria-hidden="true">
      <path d="M2.5 12s3.6-7 9.5-7 9.5 7 9.5 7-3.6 7-9.5 7-9.5-7-9.5-7Z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.7]" aria-hidden="true">
      <path d="M3 3l18 18" strokeLinecap="round" />
      <path d="M10.6 10.6A2.75 2.75 0 0 0 12 14.75" strokeLinecap="round" />
      <path d="M6.1 6.4C3.7 8.2 2.5 12 2.5 12s3.6 7 9.5 7c1.8 0 3.4-.5 4.8-1.3M17.6 15.3C20 13.6 21.5 12 21.5 12s-3.6-7-9.5-7c-.7 0-1.4.1-2 .3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function EventCard({ locale, labels, event, logoMark }: Props) {
  const [open, setOpen] = useState(false);
  const computer = useIsComputer();
  const dateLabel = useMemo(() => formatEventDate(event.dateTime, locale), [event.dateTime, locale]);
  const onMedia = Boolean(event.image);

  return (
    <article className="group h-full transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] computer:hover:-translate-y-1.5 computer:focus-within:-translate-y-1.5">
      <div className="relative flex h-full min-h-[22rem] flex-col overflow-hidden rounded-[1.75rem] border border-brand/15 bg-forest p-6 shadow-[0_8px_24px_rgba(20,26,20,0.04)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] computer:group-hover:border-brand/50 computer:group-hover:shadow-[0_12px_28px_rgba(46,89,43,0.1)] computer:group-focus-within:border-brand/50 computer:group-focus-within:shadow-[0_12px_28px_rgba(46,89,43,0.1)]">
        {onMedia ? (
          <img
            src={event.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] computer:group-hover:scale-[1.04] computer:group-focus-within:scale-[1.04]"
          />
        ) : logoMark ? (
          <img
            src={logoMark}
            alt=""
            className="pointer-events-none absolute -right-[16%] bottom-[8%] h-[72%] w-auto opacity-[0.16] transition-opacity duration-500 computer:group-hover:opacity-[0.08] computer:group-focus-within:opacity-[0.08]"
          />
        ) : null}
        {onMedia && <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/30 to-transparent" />}

        <div className="relative">
          <p className={`text-[0.68rem] uppercase tracking-[0.28em] ${onMedia ? 'text-paper/75' : 'text-brand'}`}>
            {event.isUpcoming ? t(labels, 'events.filterUpcoming') : t(labels, 'events.filterPast')}
          </p>
          <h3 className={`mt-2 font-display text-3xl uppercase leading-none ${onMedia ? 'text-paper' : 'text-ink'}`}>
            {event.title}
          </h3>
          <p className={`mt-3 text-sm ${onMedia ? 'text-paper/70' : 'text-mist'}`}>{dateLabel}</p>
          {event.location ? (
            <p className={`mt-2 inline-flex items-center gap-1.5 text-sm ${onMedia ? 'text-paper/85' : 'text-brand'}`}>
              <LocationIcon />
              <span>{event.location}</span>
            </p>
          ) : null}
        </div>

        <div className="relative min-h-0 flex-1" />

        {event.description ? (
          <div
            className={`relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              computer
                ? 'translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100'
                : open
                  ? 'mt-5 max-h-52 opacity-100'
                  : 'mt-0 max-h-0 opacity-0'
            }`}
          >
            <span className={`mb-3 block h-px w-8 ${onMedia ? 'bg-paper/40' : 'bg-brand/35'}`} />
            <div
              className={`prose-eld line-clamp-4 max-w-[34ch] text-[0.9rem] leading-relaxed ${
                onMedia ? 'text-paper/80 [&_*]:text-paper/80' : 'text-mist'
              }`}
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          </div>
        ) : null}

        {!computer && event.description ? (
          <button
            type="button"
            className={`relative z-10 mt-5 inline-flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
              open
                ? 'border-brand bg-brand text-paper'
                : onMedia
                  ? 'border-paper/30 bg-ink/50 text-paper'
                  : 'border-brand/25 bg-paper text-brand'
            }`}
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? t(labels, 'events.unflip') : t(labels, 'events.flip')}
          >
            {open ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        ) : null}
      </div>
    </article>
  );
}
