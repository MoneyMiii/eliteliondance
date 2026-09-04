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
const AUTOPLAY_RESUME_MS = 10_000;
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
  children: ReactNode;
}

function visibleForViewport(desktopCount: number, mobileCount = 1) {
  if (typeof window === 'undefined') return Math.max(1, mobileCount);
  return window.matchMedia(DESKTOP_MQ).matches ? Math.max(1, desktopCount) : Math.max(1, mobileCount);
}

function uniqueVisible(requested: number, count: number) {
  const cap = Math.max(1, Math.min(requested, count));
  return cap > 1 && cap % 2 === 0 ? cap - 1 : cap;
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
  const focusedRef = useRef(false);
  const wrapTimerRef = useRef(0);
  const autoplayTimerRef = useRef(0);
  const resumeTimerRef = useRef(0);
  const startAutoplayRef = useRef(() => {});
  const stopAutoplayRef = useRef(() => {});

  const isComputer = useIsComputer();
  const [visible, setVisible] = useState(() =>
    uniqueVisible(visibleForViewport(visibleCount, mobileCount), count),
  );
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
      const next = uniqueVisible(visibleForViewport(visibleCount, mobileCount), count);
      setVisible((current) => (current === next ? current : next));
    };
    sync();
    const desktop = window.matchMedia(DESKTOP_MQ);
    desktop.addEventListener('change', sync);
    return () => desktop.removeEventListener('change', sync);
  }, [count, mobileCount, visibleCount]);

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

  const isComputerRef = useRef(isComputer);
  isComputerRef.current = isComputer;

  /**
   * Sur ordinateur, le survol et le focus clavier suffisent à mettre en pause.
   * La temporisation est réservée au tactile, où rien n'indique que
   * l'utilisateur regarde encore le carrousel.
   */
  const markUserAction = useCallback(() => {
    if (isComputerRef.current) return;
    stopAutoplayRef.current();
    window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => {
      startAutoplayRef.current();
    }, AUTOPLAY_RESUME_MS);
  }, []);

  const stepRef = useRef(step);
  stepRef.current = step;

  useHorizontalPager(viewportRef, step, { enabled: looping, onInteract: markUserAction });

  useEffect(() => () => {
    window.clearTimeout(wrapTimerRef.current);
    window.clearTimeout(resumeTimerRef.current);
    window.clearInterval(autoplayTimerRef.current);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !isComputer) {
      hoveredRef.current = false;
      focusedRef.current = false;
      return;
    }

    const enter = () => {
      hoveredRef.current = true;
    };
    const leave = () => {
      hoveredRef.current = false;
    };
    /**
     * `:focus-visible` distingue le focus clavier de celui qu'une flèche reçoit
     * au clic : ce dernier ne doit pas figer le carrousel une fois la souris
     * partie. `focusout` précède toujours `focusin`, donc un déplacement du
     * focus à l'intérieur du carrousel est réévalué juste après.
     */
    const focusIn = (event: FocusEvent) => {
      focusedRef.current = (event.target as Element).matches(':focus-visible');
    };
    const focusOut = () => {
      focusedRef.current = false;
    };

    hoveredRef.current = root.matches(':hover');
    focusedRef.current = Boolean(root.querySelector(':focus-visible'));
    root.addEventListener('pointerenter', enter);
    root.addEventListener('pointerleave', leave);
    root.addEventListener('focusin', focusIn);
    root.addEventListener('focusout', focusOut);
    return () => {
      root.removeEventListener('pointerenter', enter);
      root.removeEventListener('pointerleave', leave);
      root.removeEventListener('focusin', focusIn);
      root.removeEventListener('focusout', focusOut);
    };
  }, [isComputer]);

  useEffect(() => {
    const stop = () => {
      window.clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = 0;
    };
    const start = () => {
      stop();
      if (!looping) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      autoplayTimerRef.current = window.setInterval(() => {
        if (animatingRef.current) return;
        if (hoveredRef.current || focusedRef.current) return;
        stepRef.current(1);
      }, AUTOPLAY_MS);
    };

    startAutoplayRef.current = start;
    stopAutoplayRef.current = stop;
    start();
    return stop;
  }, [looping]);

  const onTrackTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    window.clearTimeout(wrapTimerRef.current);
    wrapIfNeeded();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      markUserAction();
      step(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      markUserAction();
      step(-1);
    }
  };

  if (!count) return null;

  return (
    <div
      ref={rootRef}
      className="relative isolate w-full min-w-0 max-w-full select-none overflow-hidden"
      aria-labelledby={labelId}
      onPointerDownCapture={(event) => {
        if (!event.isPrimary) return;
        markUserAction();
      }}
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
          className="flex w-full min-w-0 items-stretch"
          style={{
            transform: `translate3d(calc(${offset} * -100% / ${visible}), 0, 0)`,
            transition: animate ? 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
          }}
          onTransitionEnd={onTrackTransitionEnd}
        >
          {Array.from({ length: trackLength }, (_, trackIndex) => {
            const slideIndex = slideAt(trackIndex);
            const slide = slides[slideIndex];
            const isCenter = trackIndex === offset + centerOffset;
            const offscreen = trackIndex < offset || trackIndex >= offset + visible;
            const featured = visible > 1;
            return (
              <div
                key={`${trackIndex}-${slideIndex}`}
                className={`relative box-border flex min-w-0 shrink-0 grow-0 items-center justify-center [&>*]:h-full ${
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
                data-cursor={offscreen ? undefined : 'drag'}
              >
                {cloneElement(slide, { key: `${trackIndex}-${slideIndex}` })}
              </div>
            );
          })}
        </div>
      </div>

      {looping && (
        <>
          <button type="button" className="icon-btn absolute left-2 top-1/2 z-10 -translate-y-1/2 sm:left-3" aria-label={prevLabel} onClick={() => { markUserAction(); step(-1); }}>
            <ArrowIcon className="rotate-180" />
          </button>
          <button type="button" className="icon-btn absolute right-2 top-1/2 z-10 -translate-y-1/2 sm:right-3" aria-label={nextLabel} onClick={() => { markUserAction(); step(1); }}>
            <ArrowIcon />
          </button>
        </>
      )}

      <CarouselDots labels={labels} count={count} selected={index} goToLabel={goToLabel} onSelect={(slideIndex) => { markUserAction(); goToIndex(slideIndex); }} />
    </div>
  );
}
