function isInsideScrollable(target: EventTarget | null) {
  let node = target instanceof Element ? target : null;
  while (node && node !== document.body && node !== document.documentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

export function lockPageScroll() {
  const html = document.documentElement;
  const body = document.body;
  const header = document.getElementById('site-header');
  const scrollY = window.scrollY;
  const widthBefore = html.clientWidth;

  html.style.overflow = 'hidden';
  body.style.overflow = 'hidden';
  body.style.position = 'fixed';
  body.style.top = `-${scrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.width = '100%';

  const gutter = `${Math.max(0, html.clientWidth - widthBefore)}px`;
  html.style.setProperty('--menu-gutter', gutter);
  body.style.paddingRight = gutter;
  if (header instanceof HTMLElement) header.style.paddingRight = gutter;

  const prevent = (event: Event) => {
    if (isInsideScrollable(event.target)) return;
    event.preventDefault();
  };
  document.addEventListener('wheel', prevent, { passive: false });
  document.addEventListener('touchmove', prevent, { passive: false });

  return () => {
    document.removeEventListener('wheel', prevent);
    document.removeEventListener('touchmove', prevent);
    html.style.overflow = '';
    html.style.removeProperty('--menu-gutter');
    body.style.overflow = '';
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    body.style.paddingRight = '';
    if (header instanceof HTMLElement) header.style.paddingRight = '';
    window.scrollTo(0, scrollY);
  };
}
