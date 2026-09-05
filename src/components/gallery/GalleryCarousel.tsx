import type { GalleryItem } from '../../lib/types';
import { t, type Labels } from '../../lib/i18n';
import { useLiveLabels } from '../../lib/use-live-i18n';
import Carousel from '../common/Carousel';

interface Props {
  labels: Labels;
  items: GalleryItem[];
}

export default function GalleryCarousel({ labels, items }: Props) {
  const liveLabels = useLiveLabels(labels);
  if (!items.length) return null;

  return (
    <div className="container-page">
      <Carousel
        labels={liveLabels}
        visibleCount={1}
        ariaLabel={t(liveLabels, 'gallery.carousel')}
        prevLabel={t(liveLabels, 'gallery.prev')}
        nextLabel={t(liveLabels, 'gallery.next')}
        goToLabel="gallery.goTo"
      >
        {items.map((item) => (
          <figure key={item.id} className="flex h-64 min-w-0 w-full items-center justify-center overflow-hidden sm:h-80 lg:h-96">
            <img
              src={item.image}
              alt=""
              draggable={false}
              className="mx-auto max-h-full w-auto max-w-full rounded-[1.5rem] object-contain"
            />
          </figure>
        ))}
      </Carousel>
    </div>
  );
}
