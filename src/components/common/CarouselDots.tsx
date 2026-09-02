import { t, type Labels } from '../../lib/i18n';

interface Props {
  labels: Labels;
  count: number;
  selected: number;
  goToLabel: string;
  onSelect: (index: number) => void;
}

export default function CarouselDots({ labels, count, selected, goToLabel, onSelect }: Props) {
  if (count < 2) return null;

  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5" role="tablist" aria-label={t(labels, 'carousel.dots')}>
      {Array.from({ length: count }, (_, index) => {
        const active = selected === index;
        return (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={t(labels, goToLabel, { index: index + 1 })}
            className="group inline-flex h-8 w-8 items-center justify-center"
            onClick={() => onSelect(index)}
          >
            <span
              className={`block h-1.5 rounded-full transition-[width,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                active ? 'w-7 bg-brand' : 'w-1.5 bg-brand/25 group-hover:bg-brand/50'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
