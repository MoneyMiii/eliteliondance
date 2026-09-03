import { useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { t, type Labels } from '../../lib/i18n';
import { lockPageScroll } from '../../lib/page-scroll-lock';
import type { NavLink } from '../../lib/types';

const MENU_CLOSE_MS = 520;
const NAV_SCROLL_MS = 1500;
const ANCHOR_GAP_PX = 12;

function samePageHash(href: string): string | null {
  try {
    const url = new URL(href, window.location.href);
    if (url.pathname !== window.location.pathname) return null;
    const id = decodeURIComponent(url.hash.replace(/^#/, ''));
    return id || null;
  } catch {
    return href.startsWith('#') ? decodeURIComponent(href.slice(1)) || null : null;
  }
}

function scrollToAnchor(id: string) {
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

interface Props {
  labels: Labels;
  navLinks: NavLink[];
  currentPath: string;
  instagramUrl: string;
  logoMark?: string;
}

export default function SiteMenu({ labels, navLinks, currentPath, instagramUrl, logoMark }: Props) {
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [shown, setShown] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const pendingHashRef = useRef<string | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }

    setRendered(true);
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setShown(true));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (open || !rendered) return;
    const timeout = window.setTimeout(() => setRendered(false), MENU_CLOSE_MS);
    return () => window.clearTimeout(timeout);
  }, [open, rendered]);

  useEffect(() => {
    if (!open) return;

    const previous = document.activeElement as HTMLElement | null;
    openerRef.current?.focus();
    document.documentElement.classList.add('menu-open');
    const unlock = lockPageScroll();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.documentElement.classList.remove('menu-open');
      document.removeEventListener('keydown', onKeyDown);
      unlock();
      (previous || openerRef.current)?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (open) return;
    const id = pendingHashRef.current;
    if (!id) return;
    pendingHashRef.current = null;

    const html = document.documentElement;
    html.setAttribute('data-nav-scrolling', '');

    let done = false;
    const clear = () => {
      if (done) return;
      done = true;
      html.removeAttribute('data-nav-scrolling');
      window.removeEventListener('scrollend', clear);
    };

    const frame = window.requestAnimationFrame(() => {
      scrollToAnchor(id);
      window.addEventListener('scrollend', clear, { once: true });
    });
    const timeout = window.setTimeout(clear, NAV_SCROLL_MS);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      clear();
    };
  }, [open]);

  function onNavClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    const id = samePageHash(href);
    if (id && document.getElementById(id)) {
      event.preventDefault();
      pendingHashRef.current = id;
    }
    setOpen(false);
  }

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        className="icon-btn"
        aria-expanded={open}
        aria-controls="site-nav"
        aria-label={open ? t(labels, 'nav.closeMenu') : t(labels, 'nav.openMenu')}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="relative block h-3.5 w-4" aria-hidden="true">
          <span
            className={`absolute left-0 top-0 block h-[2px] w-4 origin-center bg-current transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              open ? 'translate-y-[6px] rotate-45' : ''
            }`}
          />
          <span
            className={`absolute left-0 top-[6px] block h-[2px] w-4 bg-current transition-opacity duration-200 ${
              open ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`absolute left-0 top-[12px] block h-[2px] origin-center bg-current transition-[transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              open ? 'w-4 -translate-y-[6px] -rotate-45' : 'w-2.5'
            }`}
          />
        </span>
      </button>

      {rendered &&
        createPortal(
          <div
            ref={panelRef}
            id="site-nav"
            className={`site-menu-panel${shown ? ' is-open' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-hidden={!open}
            inert={!open ? true : undefined}
          >
            <p id={titleId} className="sr-only">
              {t(labels, 'nav.main')}
            </p>
            {logoMark && (
              <img
                src={logoMark}
                alt=""
                aria-hidden="true"
                className="menu-mark pointer-events-none absolute -right-8 top-1/2 h-44 w-44 max-w-none select-none sm:-right-10 sm:h-72 sm:w-72"
              />
            )}
            <nav
              className="container-page relative z-10 flex h-full min-h-0 flex-col"
              aria-label={t(labels, 'nav.main')}
            >
              <div className="menu-links flex min-h-0 flex-1 flex-col font-display uppercase">
                {navLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.href}
                    className={`menu-link ${currentPath === link.href ? 'text-brand' : 'text-ink hover:text-brand'}`}
                    aria-current={currentPath === link.href ? 'page' : undefined}
                    onClick={(event) => onNavClick(event, link.href)}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  className="menu-social inline-flex w-fit shrink-0 text-ink hover:text-brand"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t(labels, 'cta.instagram')}
                >
                  <InstagramIcon />
                </a>
              )}
            </nav>
          </div>,
          document.body,
        )}
    </>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9 fill-current" aria-hidden="true">
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3Z" />
    </svg>
  );
}
