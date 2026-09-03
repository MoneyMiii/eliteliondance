import { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import ArrowIcon from '../common/ArrowIcon';
import { lockPageScroll } from '../../lib/page-scroll-lock';
import { useHorizontalPager } from '../../lib/use-horizontal-pager';
import { t, type Labels } from '../../lib/i18n';
import type { GalleryItem } from '../../lib/types';

interface Props {
  labels: Labels;
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onStep: (delta: 1 | -1) => void;
}

export default function GalleryLightbox({ labels, items, index, onClose, onStep }: Props) {
  const titleId = useId();
  const overlayRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);
  const item = items[index];
  const canCycle = items.length > 1;

  const go = useCallback(
    (delta: 1 | -1) => {
      if (!canCycle) return;
      onStep(delta);
    },
    [canCycle, onStep],
  );

  useHorizontalPager(overlayRef, go, {
    enabled: canCycle,
    onDrag: () => {
      draggedRef.current = true;
    },
  });

  useEffect(() => {
    const unlock = lockPageScroll();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') go(1);
      if (event.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      unlock();
    };
  }, [go, onClose]);

  if (!item) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex select-none items-center justify-center overscroll-x-none bg-ink/88 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={() => {
        if (draggedRef.current) {
          draggedRef.current = false;
          return;
        }
        onClose();
      }}
    >
      <p id={titleId} className="sr-only">
        {t(labels, 'gallery.counter', { current: index + 1, total: items.length })}
      </p>
      <button
        type="button"
        className="icon-btn absolute right-4 top-4 sm:right-8 sm:top-8"
        aria-label={t(labels, 'gallery.close')}
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2.4]" aria-hidden="true">
          <path d="M6.5 6.5 17.5 17.5" strokeLinecap="round" />
          <path d="M17.5 6.5 6.5 17.5" strokeLinecap="round" />
        </svg>
      </button>

      {canCycle && (
        <>
          <button
            type="button"
            className="icon-btn absolute left-3 top-1/2 -translate-y-1/2 sm:left-8"
            aria-label={t(labels, 'gallery.prev')}
            onClick={(event) => {
              event.stopPropagation();
              go(-1);
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
              go(1);
            }}
          >
            <ArrowIcon />
          </button>
        </>
      )}

      <figure className="max-h-[86svh] max-w-[min(92vw,72rem)]" onClick={(event) => event.stopPropagation()} onDragStart={(event) => event.preventDefault()}>
        <img
          src={item.image}
          alt=""
          draggable={false}
          data-cursor={canCycle ? 'drag' : undefined}
          className="max-h-[86svh] w-auto max-w-full object-contain"
        />
        {canCycle && (
          <figcaption className="mt-4 text-center text-sm text-paper/50">
            {t(labels, 'gallery.counter', { current: index + 1, total: items.length })}
          </figcaption>
        )}
      </figure>
    </div>,
    document.body,
  );
}
