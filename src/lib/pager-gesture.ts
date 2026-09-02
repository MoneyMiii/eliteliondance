export const DRAG_PX = 40;
export const WHEEL_PX = 24;
const GESTURE_MS = 280;

export function createOneStepGesture(ms = GESTURE_MS) {
  let locked = false;
  let timer = 0;

  const hold = () => {
    locked = true;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      locked = false;
    }, ms);
  };

  return {
    tryRun(run: () => void) {
      if (locked) {
        hold();
        return;
      }
      hold();
      run();
    },
    dispose() {
      window.clearTimeout(timer);
      locked = false;
    },
  };
}

export function horizontalWheelDx(event: WheelEvent, minPx: number) {
  const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerWidth : 1;
  const dx = event.deltaX * scale;
  const dy = event.deltaY * scale;
  if (Math.abs(dx) < minPx || Math.abs(dx) < Math.abs(dy)) return 0;
  return dx;
}

export function isPagerPhotoTarget(target: EventTarget | null) {
  const hit = (target as HTMLElement | null)?.closest('[data-cursor="drag"]');
  if (!hit) return false;
  const slide = hit.closest('[data-carousel-slide]');
  if (slide?.getAttribute('aria-hidden') === 'true') return false;
  return true;
}
