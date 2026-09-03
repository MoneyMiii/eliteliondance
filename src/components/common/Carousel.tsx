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
  type ReactElement,
  type ReactNode,
  type TransitionEvent,
} from 'react';
import { carouselTrack } from '../../lib/carousel-track';
import { useIsComputer } from '../../lib/pointer';
import { useHorizontalPager } from '../../lib/use-horizontal-pager';
import ArrowIcon from './ArrowIcon';
import CarouselDots from './CarouselDots';
import type { Labels } from '../../lib/i18n';

const GAP_PX = 20;
const AUTOPLAY_MS = 3000;
const TRANSITION_MS = 650;
const DESKTOP_MQ = '(min-width: 1024px)';

interface Props {
  labels: Labels;
  visibleCount: number;
  mobileCount?: number;
  ariaLabel: string;
  prevLabel: string;
  nextLabel: string;
  goToLabel?: string;
  paused?: boolean;
  align?: 'stretch' | 'start';
  children: ReactNode;
}

function visibleForViewport(desktopCount: number, mobileCount = 1) {
  if (typeof window === 'undefined') return Math.max(1, mobileCount);
  return window.matchMedia(DESKTOP_MQ).matches ? Math.max(1, desktopCount) : Math.max(1, mobileCount);
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
  goToLabel = 'carousel.goTo',
  paused = false,
  align = 'stretch',
  children,
}: Props) {
  const slides = useMemo(() => toSlides(children), [children]);
  const count = slides.length;
  const labelId = useId();
  const viewportRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const animatingRef = useRef(false);
  const hoveredRef = useRef(false);
  const wrapTimerRef = useRef(0);

  const isComputer = useIsComputer();
  const [visible, setVisible] = useState(() => visibleForViewport(visibleCount, mobileCount));
  const [offset, setOffset] = useState(0);
  const [animate, setAnimate] = useState(false);

  const track = useMemo(() => carouselTrack(count, visible), [count, visible]);
  const { looping, cloneCount, centerOffset, baseOffset, trackLength, maxOffset, slideAt, realIndex, wrapOffset, shortestDelta } =
    track;
  const index = realIndex(offset);
  const edgePad = visible > 1 ? GAP_PX / 2 : 0;
  offsetRef.current = offset;
  const wrapOffsetRef = useRef(wrapOffset);
  wrapOffsetRef.current = wrapOffset;

  useLayoutEffect(() => {
    const sync = () => {
      const next = visibleForViewport(visibleCount, mobileCount);
      setVisible((current) => (current === next ? current : next));
    };
    sync();
    const desktop = window.matchMedia(DESKTOP_MQ);
    desktop.addEventListener('change', sync);
    return () => desktop.removeEventListener('change', sync);
  }, [mobileCount, visibleCount]);

  useLayoutEffect(() => {
    animatingRef.current = false;
    setAnimate(false);
    const start = looping ? cloneCount - Math.floor(visible / 2) : 0;
    offsetRef.current = start;
    setOffset(start);
  }, [cloneCount, looping, visible]);

  const snapTo = (next: number) => {
    window.clearTimeout(wrapTimerRef.current);
    animatingRef.current = false;
    setAnimate(false);
    offsetRef.current = next;
    setOffset(next);
  };

  const wrapIfNeeded = () => {
    const wrapped = wrapOffsetRef.current(offsetRef.current);
    if (wrapped === offsetRef.current) {
      animatingRef.current = false;
      return;
    }
    snapTo(wrapped);
  };

  const animateTo = (next: number) => {
    animatingRef.current = true;
    setAnimate(true);
    offsetRef.current = next;
    setOffset(next);
    window.clearTimeout(wrapTimerRef.current);
    wrapTimerRef.current = window.setTimeout(wrapIfNeeded, TRANSITION_MS);
  };

  const afterSnap = (run: () => void) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });
  };

  const step = useCallback(
    (delta: number) => {
      if (!looping || !delta) return;
      const current = offsetRef.current;
      const from = wrapOffset(current);
      const go = () => animateTo(from + delta);
      if (from !== current) {
        snapTo(from);
        afterSnap(go);
        return;
      }
      go();
    },
    [looping, wrapOffset],
  );

  const goToIndex = useCallback(
    (slideIndex: number) => {
      if (!looping) return;
      const target = ((slideIndex % count) + count) % count;
      const current = offsetRef.current;
      const from = wrapOffset(current);
      const delta = shortestDelta(realIndex(from), target);
      if (!delta) {
        if (from !== current) snapTo(from);
        return;
      }
      const dest = from + delta;
      const go = () => {
        if (dest < 0 || dest > maxOffset) {
          snapTo(baseOffset + target);
          return;
        }
        animateTo(dest);
      };
      if (from !== current) {
        snapTo(from);
        afterSnap(go);
        return;
      }
      go();
    },
    [baseOffset, count, looping, maxOffset, realIndex, shortestDelta, wrapOffset],
  );

  useHorizontalPager(viewportRef, step, { enabled: looping });

  useEffect(() => () => window.clearTimeout(wrapTimerRef.current), []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const enter = () => {
      hoveredRef.current = true;
    };
    const leave = () => {
      hoveredRef.current = false;
    };

    hoveredRef.current = root.matches(':hover');
    root.addEventListener('pointerenter', enter);
    root.addEventListener('pointerleave', leave);
    return () => {
      root.removeEventListener('pointerenter', enter);
      root.removeEventListener('pointerleave', leave);
    };
  }, []);

  useEffect(() => {
    if (!looping || paused || !isComputer) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      if (hoveredRef.current || animatingRef.current) return;
      step(1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [isComputer, looping, paused, step]);

  const onTrackTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    window.clearTimeout(wrapTimerRef.current);
    wrapIfNeeded();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(-1);
    }
  };

  if (!count) return null;

  return (
    <div
      ref={rootRef}
      className="relative isolate w-full min-w-0 max-w-full select-none overflow-hidden"
      aria-labelledby={labelId}
    >
      <p id={labelId} className="sr-only">
        {ariaLabel}
      </p>

      <div
        ref={viewportRef}
        className={`w-full min-w-0 touch-pan-y overflow-hidden outline-none ${
          visible > 1 ? 'py-8 sm:py-10' : ''
        }`}
        data-carousel=""
        tabIndex={looping ? 0 : undefined}
        onKeyDown={onKeyDown}
        onDragStart={(event) => event.preventDefault()}
      >
        <div
          className={`flex w-full min-w-0 ${
            visible > 1 ? 'items-stretch' : align === 'start' ? 'items-start' : 'items-stretch'
          }`}
          style={{
            transform: `translate3d(calc(${offset} * -100% / ${visible}), 0, 0)`,
            transition: animate ? 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
          }}
          onTransitionEnd={onTrackTransitionEnd}
        >
          {Array.from({ length: trackLength }, (_, trackIndex) => {
            const slideIndex = slideAt(trackIndex);
            const slide = slides[slideIndex];
            const centerTrack = offset + centerOffset;
            const isCenter =
              trackIndex === centerTrack ||
              trackIndex === centerTrack - count ||
              trackIndex === centerTrack + count;
            const offscreen = trackIndex < offset || trackIndex >= offset + visible;
            const featured = visible > 1;
            return (
              <div
                key={`${trackIndex}-${slideIndex}`}
                className={`relative box-border min-w-0 shrink-0 grow-0 [&>*]:h-full ${
                  featured && isCenter ? 'z-[2] opacity-100' : ''
                } ${featured && !isCenter ? 'z-[1] opacity-55' : ''} ${!featured ? 'opacity-100' : ''}`}
                style={{
                  flex: `0 0 calc(100% / ${visible})`,
                  width: `calc(100% / ${visible})`,
                  maxWidth: `calc(100% / ${visible})`,
                  paddingLeft: edgePad,
                  paddingRight: edgePad,
                  transform: featured ? `scale(${isCenter ? 1.12 : 0.9})` : undefined,
                  transformOrigin: 'center center',
                  transition: animate
                    ? 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1)'
                    : 'none',
                }}
                aria-hidden={offscreen || undefined}
                data-active={isCenter || undefined}
                data-carousel-slide=""
                data-cursor={visible > 1 && !offscreen ? 'drag' : undefined}
              >
                {cloneElement(slide, { key: `${trackIndex}-${slideIndex}` })}
              </div>
            );
          })}
        </div>
      </div>

      {looping && (
        <>
          <button type="button" className="icon-btn absolute left-2 top-1/2 z-10 -translate-y-1/2 sm:left-3" aria-label={prevLabel} onClick={() => step(-1)}>
            <ArrowIcon className="rotate-180" />
          </button>
          <button type="button" className="icon-btn absolute right-2 top-1/2 z-10 -translate-y-1/2 sm:right-3" aria-label={nextLabel} onClick={() => step(1)}>
            <ArrowIcon />
          </button>
        </>
      )}

      <CarouselDots labels={labels} count={count} selected={index} goToLabel={goToLabel} onSelect={goToIndex} />
    </div>
  );
}
