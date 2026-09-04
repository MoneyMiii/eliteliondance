import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from '../common/CloseIcon';
import { lockPageScroll } from '../../lib/page-scroll-lock';
import { useWindowKeydown } from '../../lib/use-window-keydown';
import { closeLabel, type Labels } from '../../lib/i18n';
import type { ServiceItem } from '../../lib/types';

interface Props {
  labels: Labels;
  services: ServiceItem[];
}

const OPEN_MS = 420;
const CLOSE_MS = 220;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function flipFrames(from: DOMRect, to: DOMRect) {
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  const scale = Math.min(1, from.width / to.width);
  return {
    collapsed: { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0 },
    expanded: { transform: 'none', opacity: 1 },
  };
}

function ServiceTile({ service }: { service: ServiceItem }) {
  const onPhoto = Boolean(service.photo);
  return (
    <>
      {onPhoto && (
        <>
          <img
            src={service.photo}
            alt=""
            loading="lazy"
            className="absolute inset-0 block size-full object-cover transition-transform duration-700 ease-cinematic computer:group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d120d] via-[#0d120d]/45 to-transparent" />
        </>
      )}
      {service.icon && (
        <img
          src={service.icon}
          alt=""
          loading="lazy"
          className={
            onPhoto
              ? 'relative m-3 h-10 w-10 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] sm:m-4 sm:h-12 sm:w-12'
              : 'h-10 w-10 object-contain sm:h-12 sm:w-12'
          }
        />
      )}
      <div className={onPhoto ? 'relative mt-auto p-3 sm:p-4' : 'mt-auto'}>
        <h3
          className={`line-clamp-2 break-words font-display text-[0.95rem] uppercase leading-tight sm:text-lg ${
            onPhoto ? 'text-white' : 'text-ink'
          }`}
        >
          {service.title}
        </h3>
        <p
          className={`mt-1.5 text-xs leading-relaxed sm:text-sm ${
            onPhoto ? 'line-clamp-2 text-white/70' : 'line-clamp-3 text-mist'
          }`}
        >
          {service.description}
        </p>
      </div>
    </>
  );
}

export default function ServicesGrid({ labels, services }: Props) {
  const [active, setActive] = useState<ServiceItem | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closingRef = useRef(false);

  const open = (service: ServiceItem, trigger: HTMLButtonElement) => {
    originRef.current = trigger.getBoundingClientRect();
    triggerRef.current = trigger;
    closingRef.current = false;
    setActive(service);
  };

  const close = useCallback(() => {
    if (closingRef.current) return;
    const panel = panelRef.current;
    const from = originRef.current;
    const finish = () => {
      setActive(null);
      triggerRef.current?.focus({ preventScroll: true });
    };
    if (!panel || !from || reducedMotion()) {
      finish();
      return;
    }
    closingRef.current = true;
    const { collapsed, expanded } = flipFrames(from, panel.getBoundingClientRect());
    const options = { duration: CLOSE_MS, easing: EASE, fill: 'forwards' as const };
    backdropRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], options);
    panel.animate([expanded, collapsed], options).addEventListener('finish', finish);
  }, []);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const from = originRef.current;
    if (!active || !panel || !from || reducedMotion()) return;
    const { collapsed, expanded } = flipFrames(from, panel.getBoundingClientRect());
    const options = { duration: OPEN_MS, easing: EASE };
    panel.animate([collapsed, expanded], options);
    backdropRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], options);
  }, [active]);

  useLayoutEffect(() => {
    if (!active) return;
    return lockPageScroll();
  }, [active]);

  useWindowKeydown((event) => {
    if (event.key === 'Escape') close();
  }, Boolean(active));

  if (!services.length) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {services.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={(event) => open(service, event.currentTarget)}
            className={`group relative flex aspect-[4/5] min-w-0 flex-col overflow-hidden rounded-2xl bg-forest text-left transition-transform duration-500 ease-cinematic computer:hover:-translate-y-1 sm:aspect-[3/4] ${
              service.photo ? '' : 'border border-brand/25'
            }`}
          >
            {service.photo ? (
              <ServiceTile service={service} />
            ) : (
              <div className="flex h-full flex-col p-3 sm:p-4">
                <ServiceTile service={service} />
              </div>
            )}
          </button>
        ))}
      </div>

      {active &&
        createPortal(
          <div
            ref={backdropRef}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/80 p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={active.title}
            onClick={close}
          >
            <div
              ref={panelRef}
              className="relative max-h-[86svh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-[1.5rem] bg-paper shadow-2xl"
            >
              {active.photo && (
                <img src={active.photo} alt="" className="block h-56 w-full object-cover sm:h-72" />
              )}
              <button
                type="button"
                className="icon-btn absolute right-4 top-4"
                aria-label={closeLabel(labels)}
                onClick={close}
              >
                <CloseIcon />
              </button>
              <div className="p-6 sm:p-8">
                {active.icon && (
                  <img src={active.icon} alt="" className="mb-5 h-12 w-12 object-contain" />
                )}
                <h3 className="font-display text-2xl uppercase leading-tight text-ink sm:text-3xl">
                  {active.title}
                </h3>
                <p className="mt-4 leading-relaxed text-mist">{active.description}</p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
