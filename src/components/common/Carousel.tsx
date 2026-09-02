import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  type TransitionEvent,
} from 'react';
import { t, type Labels } from '../../lib/i18n';

const GAP_PX = 20;
const AUTOPLAY_MS = 3000;
const SWIPE_PX = 48;
const WHEEL_PX = 36;
const WHEEL_IDLE_MS = 280;

interface Props {
  labels: Labels;
  visibleCount: number;
  mobileCount?: number;
  ariaLabel: string;
  prevLabel: string;
  nextLabel: string;
  goToLabel?: string;
  showCounter?: boolean;
  paused?: boolean;
  align?: 'stretch' | 'start';
  children: ReactNode;
}

const DESKTOP_MQ = '(min-width: 1024px)';

function visibleForViewport(desktopCount: number, mobileCount = 1) {
  const desktop = Math.max(1, desktopCount);
  const mobile = Math.max(1, mobileCount);
  if (typeof window === 'undefined') return mobile;
  return window.matchMedia(DESKTOP_MQ).matches ? desktop : mobile;
}

function toSlides(children: ReactNode): ReactElement[] {
  return Children.toArray(children).filter(isValidElement) as ReactElement[];
}

export default function Carousel({
  labels,
  visibleCount,
  mobileCount = 1,
  ariaLabel,
  prevLabel,
  nextLabel,
  goToLabel,
  showCounter = false,
  paused = false,
  align = 'stretch',
  children,
}: Props) {
  const slides = useMemo(() => toSlides(children), [children]);
  const count = slides.length;
  const labelId = useId();
  const viewportRef = useRef<HTMLDivElement>(null);
  const animatingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const pointerStartXRef = useRef(0);
  const wheelAccRef = useRef(0);
  const wheelIdleRef = useRef(0);

  const [visible, setVisible] = useState(() => visibleForViewport(visibleCount, mobileCount));
  const [offset, setOffset] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [hovered, setHovered] = useState(false);

  const looping = count > 1;
  const centerOffset = Math.floor(visible / 2);
  const cloneCount = looping ? visible : 0;
  const baseOffset = looping ? cloneCount - centerOffset : 0;
  const edgePad = visible > 1 ? GAP_PX / 2 : 0;
  const centerTrack = offset + centerOffset;
  const realIndex = looping ? (((centerTrack - cloneCount) % count) + count) % count : 0;
  const trackLength = looping ? count + cloneCount * 2 : Math.max(count, 1);
  const controls = looping;

  useLayoutEffect(() => {
    const syncVisible = () => {
      const nextVisible = visibleForViewport(visibleCount, mobileCount);
      setVisible((current) => (current === nextVisible ? current : nextVisible));
    };

    syncVisible();
    const desktop = window.matchMedia(DESKTOP_MQ);
    desktop.addEventListener('change', syncVisible);
    return () => desktop.removeEventListener('change', syncVisible);
  }, [mobileCount, visibleCount]);

  useLayoutEffect(() => {
    animatingRef.current = false;
    setAnimate(false);
    setOffset(looping ? cloneCount - Math.floor(visible / 2) : 0);
  }, [cloneCount, looping, visible]);

  useEffect(() => {
    if (animate) return;
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, [animate, offset]);

  const goTo = useCallback(
    (next: number) => {
      if (!looping || animatingRef.current) return;
      animatingRef.current = true;
      setAnimate(true);
      setOffset(next);
    },
    [looping],
  );

  const goPrev = useCallback(() => goTo(offset - 1), [goTo, offset]);
  const goNext = useCallback(() => goTo(offset + 1), [goTo, offset]);
  const goToSlide = useCallback(
    (index: number) => {
      if (!looping) return;
      const target = ((index % count) + count) % count;
      if (target === realIndex) return;
      animatingRef.current = false;
      setAnimate(false);
      setOffset(baseOffset + target);
    },
    [baseOffset, count, looping, realIndex],
  );
  const goPrevRef = useRef(goPrev);
  const goNextRef = useRef(goNext);
  goPrevRef.current = goPrev;
  goNextRef.current = goNext;

  useEffect(() => {
    if (!looping || hovered || paused) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const id = window.setInterval(() => {
      if (animatingRef.current) return;
      goNextRef.current();
    }, AUTOPLAY_MS);

    return () => window.clearInterval(id);
  }, [hovered, looping, paused]);

  useEffect(() => {
    const root = viewportRef.current;
    if (!root || !looping) return;

    const onWheel = (event: WheelEvent) => {
      const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerWidth : 1;
      const dx = event.deltaX * scale;
      const dy = event.deltaY * scale;
      if (Math.abs(dx) < 4 || Math.abs(dx) < Math.abs(dy)) {
        wheelAccRef.current = 0;
        return;
      }

      event.preventDefault();
      if (animatingRef.current) return;

      wheelAccRef.current += dx;
      window.clearTimeout(wheelIdleRef.current);
      wheelIdleRef.current = window.setTimeout(() => {
        wheelAccRef.current = 0;
      }, WHEEL_IDLE_MS);

      if (Math.abs(wheelAccRef.current) < WHEEL_PX) return;
      const goForward = wheelAccRef.current > 0;
      wheelAccRef.current = 0;
      if (goForward) goNextRef.current();
      else goPrevRef.current();
    };

    root.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      root.removeEventListener('wheel', onWheel);
      window.clearTimeout(wheelIdleRef.current);
    };
  }, [looping]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!looping || event.button !== 0) return;
    pointerIdRef.current = event.pointerId;
    pointerStartXRef.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
    setHovered(true);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    pointerIdRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const dx = event.clientX - pointerStartXRef.current;
    if (Math.abs(dx) < SWIPE_PX) return;
    if (dx < 0) goNext();
    else goPrev();
  };

  const onTrackTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    animatingRef.current = false;
    if (!looping) return;
    if (offset >= baseOffset + count) {
      setAnimate(false);
      setOffset(offset - count);
    } else if (offset < baseOffset) {
      setAnimate(false);
      setOffset(offset + count);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goPrev();
    }
  };

  if (!count) return null;

  return (
    <div
      className="relative w-full min-w-0 max-w-full overflow-hidden isolate"
      aria-labelledby={labelId}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p id={labelId} className="sr-only">
        {ariaLabel}
      </p>

      <div
        ref={viewportRef}
        className="w-full min-w-0 touch-pan-y overflow-hidden outline-none"
        data-cursor="drag"
        tabIndex={controls ? 0 : undefined}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className={`flex w-full min-w-0 ${align === 'start' ? 'items-start' : 'items-stretch'}`}
          style={{
            transform: `translate3d(calc(${offset} * -100% / ${visible}), 0, 0)`,
            transition: animate ? 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
          }}
          onTransitionEnd={onTrackTransitionEnd}
        >
          {Array.from({ length: trackLength }, (_, index) => {
            const slideIndex = looping ? (((index - cloneCount) % count) + count) % count : index;
            const slide = slides[slideIndex];
            const isCenter = index === offset + centerOffset;
            const offscreen = index < offset || index >= offset + visible;
            return (
              <div
                key={`${index}-${slideIndex}`}
                className={`box-border min-w-0 shrink-0 grow-0 overflow-hidden transition-opacity duration-500 ${
                  visible > 1 && !isCenter ? 'opacity-55' : 'opacity-100'
                }`}
                style={{
                  flex: `0 0 calc(100% / ${visible})`,
                  width: `calc(100% / ${visible})`,
                  maxWidth: `calc(100% / ${visible})`,
                  paddingLeft: edgePad,
                  paddingRight: edgePad,
                }}
                aria-hidden={offscreen || undefined}
                data-active={isCenter || undefined}
              >
                {cloneElement(slide, { key: `${index}-${slideIndex}` })}
              </div>
            );
          })}
        </div>
      </div>

      {controls && (
        <>
          <button
            type="button"
            className="icon-btn absolute left-2 top-1/2 z-10 -translate-y-1/2 sm:left-3"
            aria-label={prevLabel}
            onClick={goPrev}
          >
            <ArrowIcon className="rotate-180" />
          </button>
          <button
            type="button"
            className="icon-btn absolute right-2 top-1/2 z-10 -translate-y-1/2 sm:right-3"
            aria-label={nextLabel}
            onClick={goNext}
          >
            <ArrowIcon />
          </button>
        </>
      )}

      {count > 1 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5" role="tablist" aria-label={t(labels, 'carousel.dots')}>
          {slides.map((slide, index) => {
            const selected = realIndex === index;
            return (
              <button
                key={slide.key ?? index}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={t(labels, goToLabel || 'carousel.goTo', { index: index + 1 })}
                className="group inline-flex h-8 w-8 items-center justify-center"
                onClick={() => goToSlide(index)}
              >
                <span
                  className={`block h-1.5 rounded-full transition-[width,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    selected ? 'w-7 bg-brand' : 'w-1.5 bg-brand/25 group-hover:bg-brand/50'
                  }`}
                />
              </button>
            );
          })}
        </div>
      )}

      {showCounter && count > 1 && (
        <p className="mt-4 text-sm tracking-wide text-mist" aria-live="polite">
          {t(labels, 'gallery.counter', { current: realIndex + 1, total: count })}
        </p>
      )}
    </div>
  );
}

function ArrowIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 fill-none stroke-current stroke-[2.4] ${className}`} aria-hidden="true">
      <path d="M9 5.5 15.5 12 9 18.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
