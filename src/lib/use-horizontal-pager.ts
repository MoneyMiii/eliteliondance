import { useEffect, useRef, type RefObject } from 'react';
import { createOneStepGesture, DRAG_PX, horizontalWheelDx, isPagerPhotoTarget, WHEEL_PX } from './pager-gesture';

interface Options {
  enabled: boolean;
  onDrag?: () => void;
  onInteract?: () => void;
}

export function useHorizontalPager(
  rootRef: RefObject<HTMLElement | null>,
  onStep: (delta: 1 | -1) => void,
  { enabled, onDrag, onInteract }: Options,
) {
  const onStepRef = useRef(onStep);
  const onDragRef = useRef(onDrag);
  const onInteractRef = useRef(onInteract);
  const gestureRef = useRef(createOneStepGesture());
  const pointerIdRef = useRef<number | null>(null);
  const pointerXRef = useRef(0);
  onStepRef.current = onStep;
  onDragRef.current = onDrag;
  onInteractRef.current = onInteract;

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return;
    const gesture = gestureRef.current;

    const onWheel = (event: WheelEvent) => {
      if (!isPagerPhotoTarget(event.target)) return;
      const dx = horizontalWheelDx(event, WHEEL_PX);
      if (!dx) return;
      event.preventDefault();
      if (pointerIdRef.current != null) return;
      onInteractRef.current?.();
      gesture.tryRun(() => onStepRef.current(dx > 0 ? 1 : -1));
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !isPagerPhotoTarget(event.target)) return;
      pointerIdRef.current = event.pointerId;
      pointerXRef.current = event.clientX;
      onInteractRef.current?.();
      root.setPointerCapture(event.pointerId);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (pointerIdRef.current !== event.pointerId) return;
      pointerIdRef.current = null;
      if (root.hasPointerCapture(event.pointerId)) root.releasePointerCapture(event.pointerId);
      const dx = event.clientX - pointerXRef.current;
      if (Math.abs(dx) < DRAG_PX) return;
      onDragRef.current?.();
      gesture.tryRun(() => onStepRef.current(dx < 0 ? 1 : -1));
    };

    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('pointerup', onPointerUp);
    root.addEventListener('pointercancel', onPointerUp);
    return () => {
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('pointerup', onPointerUp);
      root.removeEventListener('pointercancel', onPointerUp);
    };
  }, [enabled, rootRef]);

  useEffect(() => () => gestureRef.current.dispose(), []);
}
