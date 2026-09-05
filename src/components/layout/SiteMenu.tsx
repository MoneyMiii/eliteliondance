import { useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import InstagramIcon from '../common/InstagramIcon';
import { samePageHash, scrollToAnchor } from '../../lib/anchor-scroll';
import { t, type Labels } from '../../lib/i18n';
import { lockPageScroll } from '../../lib/page-scroll-lock';
import { useLiveLabels, useLiveSlice } from '../../lib/use-live-i18n';
import { useWindowKeydown } from '../../lib/use-window-keydown';
import type { NavLink } from '../../lib/types';

const MENU_CLOSE_MS = 520;
const NAV_SCROLL_MS = 1500;

interface Props {
  labels: Labels;
  navLinks: NavLink[];
  currentPath: string;
  instagramUrl: string;
  logoMark?: string;
}

export default function SiteMenu({ labels, navLinks, currentPath, instagramUrl, logoMark }: Props) {
  const liveLabels = useLiveLabels(labels);
  const liveLinks = useLiveSlice('navLinks', navLinks);
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [shown, setShown] = useState(false);
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

    return () => {
      document.documentElement.classList.remove('menu-open');
      unlock();
      (previous || openerRef.current)?.focus();
    };
  }, [open]);

  useWindowKeydown((event) => {
    if (event.key === 'Escape') setOpen(false);
  }, open);

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
        aria-label={open ? t(liveLabels, 'nav.closeMenu') : t(liveLabels, 'nav.openMenu')}
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
            id="site-nav"
            className={`site-menu-panel${shown ? ' is-open' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-hidden={!open}
            inert={!open ? true : undefined}
          >
            <p id={titleId} className="sr-only">
              {t(liveLabels, 'nav.main')}
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
              aria-label={t(liveLabels, 'nav.main')}
            >
              <div className="menu-links flex min-h-0 flex-1 flex-col font-display uppercase">
                {liveLinks.map((link) => (
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
                  aria-label={t(liveLabels, 'cta.instagram')}
                >
                  <InstagramIcon className="h-9 w-9" />
                </a>
              )}
            </nav>
          </div>,
          document.body,
        )}
    </>
  );
}
