import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GalleryItem } from '../../lib/types';
import { t, type Labels } from '../../lib/i18n';

interface Props {
  labels: Labels;
  items: GalleryItem[];
}

export default function GalleryGrid({ labels, items }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const titleId = useId();
  const item = active == null ? null : items[active];

  useEffect(() => {
    if (active == null) return;

    const header = document.getElementById('site-header');
    const widthBeforeLock = document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    const gutter = Math.max(0, document.documentElement.clientWidth - widthBeforeLock);
    document.body.style.paddingRight = `${gutter}px`;
    if (header instanceof HTMLElement) header.style.paddingRight = `${gutter}px`;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null);
      if (event.key === 'ArrowRight') setActive((current) => (current == null ? 0 : (current + 1) % items.length));
      if (event.key === 'ArrowLeft') {
        setActive((current) => (current == null ? 0 : (current - 1 + items.length) % items.length));
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      if (header instanceof HTMLElement) header.style.paddingRight = '';
    };
  }, [active, items.length]);

  if (!items.length) return null;

  return (
    <>
      <ul className="container-page grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((entry, itemIndex) => (
          <li key={entry.id}>
            <button
              type="button"
              className="group relative block w-full overflow-hidden rounded-[1.5rem] border-0 bg-forest p-0 text-left"
              onClick={() => setActive(itemIndex)}
              aria-label={t(labels, 'gallery.open', { title: String(itemIndex + 1) })}
            >
              <img
                src={entry.image}
                alt=""
                className="h-auto w-full object-contain transition duration-500 group-hover:opacity-90"
                loading="lazy"
              />
            </button>
          </li>
        ))}
      </ul>

      {item &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/88 p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={() => setActive(null)}
          >
            <p id={titleId} className="sr-only">
              {t(labels, 'gallery.counter', { current: (active ?? 0) + 1, total: items.length })}
            </p>
            <button
              type="button"
              className="icon-btn absolute right-4 top-4 sm:right-8 sm:top-8"
              aria-label={t(labels, 'gallery.close')}
              onClick={(event) => {
                event.stopPropagation();
                setActive(null);
              }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2.4]" aria-hidden="true">
                <path d="M6.5 6.5 17.5 17.5" strokeLinecap="round" />
                <path d="M17.5 6.5 6.5 17.5" strokeLinecap="round" />
              </svg>
            </button>

            {items.length > 1 && (
              <>
                <button
                  type="button"
                  className="icon-btn absolute left-3 top-1/2 -translate-y-1/2 sm:left-8"
                  aria-label={t(labels, 'gallery.prev')}
                  onClick={(event) => {
                    event.stopPropagation();
                    setActive((current) => (current == null ? 0 : (current - 1 + items.length) % items.length));
                  }}
                >
                  <ArrowIcon className="rotate-180" />
                </button>
                <button
                  type="button"
                  className="icon-btn absolute right-3 top-1/2 -translate-y-1/2 sm:right-8"
                  aria-label={t(labels, 'gallery.next')}
                  onClick={(event) => {
                    event.stopPropagation();
                    setActive((current) => (current == null ? 0 : (current + 1) % items.length));
                  }}
                >
                  <ArrowIcon />
                </button>
              </>
            )}

            <figure className="max-h-[86svh] max-w-[min(92vw,72rem)]" onClick={(event) => event.stopPropagation()}>
              <img
                src={item.image}
                alt=""
                className="max-h-[86svh] w-auto max-w-full object-contain"
              />
              {items.length > 1 && (
                <figcaption className="mt-4 text-center text-sm text-paper/50">
                  {t(labels, 'gallery.counter', { current: (active ?? 0) + 1, total: items.length })}
                </figcaption>
              )}
            </figure>
          </div>,
          document.body,
        )}
    </>
  );
}

function ArrowIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 fill-none stroke-current stroke-[2.4] ${className}`} aria-hidden="true">
      <path d="M9 5.5 15.5 12 9 18.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
