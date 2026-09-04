const ANCHOR_GAP_PX = 12;

export function samePageHash(href: string): string | null {
  try {
    const url = new URL(href, window.location.href);
    if (url.pathname !== window.location.pathname) return null;
    const id = decodeURIComponent(url.hash.replace(/^#/, ''));
    return id || null;
  } catch {
    return href.startsWith('#') ? decodeURIComponent(href.slice(1)) || null : null;
  }
}

export function scrollToAnchor(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  const header = document.getElementById('site-header');
  const headerH = header instanceof HTMLElement && !header.hasAttribute('data-hidden')
    ? header.getBoundingClientRect().height
    : 0;
  const top = Math.max(0, window.scrollY + el.getBoundingClientRect().top - headerH - ANCHOR_GAP_PX);
  window.scrollTo({ top, behavior: 'smooth' });
  history.replaceState(null, '', `#${id}`);
}
