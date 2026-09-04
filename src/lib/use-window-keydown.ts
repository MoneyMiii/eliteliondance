import { useEffect, useRef } from 'react';

export function useWindowKeydown(onKeyDown: (event: KeyboardEvent) => void, enabled = true) {
  const handlerRef = useRef(onKeyDown);
  handlerRef.current = onKeyDown;

  useEffect(() => {
    if (!enabled) return;
    const listener = (event: KeyboardEvent) => handlerRef.current(event);
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [enabled]);
}
