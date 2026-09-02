import { useState } from 'react';
import type { GalleryItem } from '../../lib/types';
import { t, type Labels } from '../../lib/i18n';
import GalleryLightbox from './GalleryLightbox';

interface Props {
  labels: Labels;
  items: GalleryItem[];
}

export default function GalleryGrid({ labels, items }: Props) {
  const [active, setActive] = useState<number | null>(null);

  if (!items.length) return null;

  return (
    <>
      <ul className="container-page grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((entry, itemIndex) => (
          <li key={entry.id}>
            <button
              type="button"
              className="group relative block w-full overflow-hidden rounded-[1.5rem] border-0 bg-forest p-0 text-left"
              onClick={() => setActive(itemIndex)}
              aria-label={t(labels, 'gallery.open', { title: String(itemIndex + 1) })}
            >
              <img
                src={entry.image}
                alt=""
                className="h-auto w-full object-contain transition duration-500 group-hover:opacity-90"
                loading="lazy"
              />
            </button>
          </li>
        ))}
      </ul>

      {active != null && (
        <GalleryLightbox
          labels={labels}
          items={items}
          index={active}
          onClose={() => setActive(null)}
          onStep={(delta) => {
            setActive((current) => {
              if (current == null) return 0;
              return (current + delta + items.length) % items.length;
            });
          }}
        />
      )}
    </>
  );
}
