const SELECTOR = '[data-reveal]';

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function easeOut(value: number): number {
  return 1 - (1 - value) ** 2;
}

function viewportHeight(): number {
  return window.visualViewport?.height ?? window.innerHeight;
}

/**
 * Aligne le bloc sur la diagonale de la coupe qui le surplombe : il arrive
 * décalé le long de la pente et incliné du même angle, puis se redresse.
 */
function measureSlope(el: HTMLElement) {
  const band = el.parentElement;
  if (!band || el.dataset.reveal !== 'wipe') return;

  const width = band.getBoundingClientRect().width;
  const rise = parseFloat(getComputedStyle(band).paddingTop) || 0;
  if (!width || !rise) return;

  const length = Math.hypot(width, rise);
  const travel = Math.min(length * 0.5, Math.max(64, viewportHeight() * 0.2));
  const sign = band.classList.contains('reveal-from-b') ? -1 : 1;
  const angle = (Math.atan2(rise, width) * 180) / Math.PI;

  el.style.setProperty('--reveal-dx', `${sign * (width / length) * travel}px`);
  el.style.setProperty('--reveal-dy', `${-(rise / length) * travel}px`);
  el.style.setProperty('--reveal-rot', `${-sign * angle}deg`);
}

export function initRevealOnScroll() {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));
  if (!nodes.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (const el of nodes) el.style.setProperty('--reveal-progress', '1');
    return;
  }

  let ticking = false;

  const measure = () => {
    for (const el of nodes) measureSlope(el);
  };

  const update = () => {
    ticking = false;
    const height = viewportHeight();
    const start = height * 0.84;
    const end = height * 0.4;

    for (const el of nodes) {
      const top = el.getBoundingClientRect().top;
      const raw = top >= start ? 0 : top <= end ? 1 : (start - top) / (start - end);
      el.style.setProperty('--reveal-progress', String(easeOut(clamp(raw))));
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  const onResize = () => {
    measure();
    onScroll();
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize);
  window.visualViewport?.addEventListener('resize', onResize);
  window.visualViewport?.addEventListener('scroll', onScroll);
  window.addEventListener('load', onResize, { once: true });

  measure();
  update();
}
