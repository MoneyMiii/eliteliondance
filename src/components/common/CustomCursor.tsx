import { useEffect, useState } from 'react';
import { t, type Labels } from '../../lib/i18n';
import { COMPUTER_MQ } from '../../lib/pointer';

interface Props {
  labels: Labels;
}

const NATIVE_CURSOR = 'input, textarea, select, [contenteditable="true"], iframe, audio, video';

function modeFromElement(target: Element | null): 'default' | 'hover' | 'drag' | 'native' {
  const node = target as HTMLElement | null;
  if (!node) return 'default';
  if (node.closest(NATIVE_CURSOR)) return 'native';
  if (node.closest('[data-cursor="drag"]')) return 'drag';
  if (node.closest('a, button, [role="button"], label, summary')) return 'hover';
  return 'default';
}

export default function CustomCursor({ labels }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<'default' | 'hover' | 'drag' | 'native'>('default');

  useEffect(() => {
    const computer = window.matchMedia(COMPUTER_MQ).matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!computer || reduced) return;

    setEnabled(true);

    const point = { x: 0, y: 0, ready: false };

    const apply = (x: number, y: number) => {
      const next = modeFromElement(document.elementFromPoint(x, y));
      const native = next === 'native';
      document.documentElement.classList.toggle('has-native-cursor', native);
      document.documentElement.classList.toggle('has-custom-cursor', !native);
      setMode(next);
    };

    const onMove = (event: PointerEvent) => {
      point.x = event.clientX;
      point.y = event.clientY;
      point.ready = true;
      setPosition({ x: point.x, y: point.y });
      setVisible(true);
      apply(point.x, point.y);
    };

    const onStay = () => {
      if (!point.ready) return;
      apply(point.x, point.y);
    };

    const onLeave = () => {
      setVisible(false);
      document.documentElement.classList.remove('has-custom-cursor', 'has-native-cursor');
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onStay, { passive: true, capture: true });
    window.addEventListener('wheel', onStay, { passive: true, capture: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => {
      document.documentElement.classList.remove('has-custom-cursor', 'has-native-cursor');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onStay, true);
      window.removeEventListener('wheel', onStay, true);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  if (!enabled || !visible || mode === 'native') return null;

  return (
    <div
      className="pointer-events-none fixed top-0 left-0 z-[9999]"
      style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
      aria-hidden="true"
    >
      <div
        className={`-translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-[0_0_16px_rgba(46,89,43,0.28)] transition-[width,height,background-color] duration-200 ${
          mode === 'drag'
            ? 'flex h-16 w-16 items-center justify-center border-brand bg-brand text-[0.65rem] font-bold uppercase tracking-[0.2em] text-paper'
            : mode === 'hover'
              ? 'h-11 w-11 border-brand bg-brand/10'
              : 'h-3.5 w-3.5 border-brand bg-brand'
        }`}
      >
        {mode === 'drag' ? t(labels, 'cursor.drag') : null}
      </div>
    </div>
  );
}
