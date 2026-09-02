import { useLayoutEffect, useState } from 'react';

/** Mouse / trackpad computer — not a phone, tablet, or hybrid touch screen. */
export const COMPUTER_MQ =
  '(hover: hover) and (pointer: fine) and (not (pointer: coarse))';

export function isComputer() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(COMPUTER_MQ).matches;
}

export function useIsComputer() {
  const [computer, setComputer] = useState(false);

  useLayoutEffect(() => {
    const media = window.matchMedia(COMPUTER_MQ);
    const sync = () => setComputer(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return computer;
}
