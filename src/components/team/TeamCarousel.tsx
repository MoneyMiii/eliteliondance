import { useRef, useState, type ReactNode } from 'react';
import type { TeamMember } from '../../lib/types';
import { t, type Labels } from '../../lib/i18n';
import { stripHtml } from '../../lib/localize';
import { useIsComputer } from '../../lib/pointer';
import Carousel from '../common/Carousel';

interface Props {
  labels: Labels;
  members: TeamMember[];
  logoMark?: string;
}

export default function TeamCarousel({ labels, members, logoMark }: Props) {
  const isComputer = useIsComputer();
  const [expanded, setExpanded] = useState(false);
  const showFullText = isComputer || expanded;

  if (!members.length) return null;

  return (
    <Carousel
      labels={labels}
      visibleCount={5}
      mobileCount={3}
      paused={expanded && !isComputer}
      align="stretch"
      ariaLabel={t(labels, 'team.carousel')}
      prevLabel={t(labels, 'carousel.prev')}
      nextLabel={t(labels, 'carousel.next')}
    >
      {members.map((member) => (
        <TeamCard
          key={member.id}
          member={member}
          logoMark={logoMark}
          expanded={showFullText}
          interactive={!isComputer}
          onToggle={() => setExpanded((current) => !current)}
        />
      ))}
    </Carousel>
  );
}

function TeamCard({
  member,
  logoMark,
  expanded,
  interactive,
  onToggle,
}: {
  member: TeamMember;
  logoMark?: string;
  expanded: boolean;
  interactive: boolean;
  onToggle: () => void;
}) {
  const body = (
    <>
      <div className="aspect-[3/4] overflow-hidden rounded-t-[1.25rem] bg-paper">
        {member.photo ? (
          <img
            src={member.photo}
            alt=""
            draggable={false}
            data-cursor="drag"
            className="h-full w-full object-cover"
          />
        ) : logoMark ? (
          <img src={logoMark} alt="" draggable={false} data-cursor="drag" className="h-full w-full object-contain p-6" />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col p-3 sm:p-4">
        <h3 className="break-words font-display text-lg uppercase leading-tight text-ink sm:text-xl">
          {member.firstName} {member.lastName}
        </h3>
        {member.roles.length > 0 && (
          <p
            className={`mt-1 break-words text-sm leading-snug text-brand ${expanded ? '' : 'line-clamp-2'}`}
          >
            {member.roles.map((role, index) => (
              <span key={role}>
                {index > 0 && (
                  <span className="mx-1 text-mist" aria-hidden="true">
                    ·
                  </span>
                )}
                {role}
              </span>
            ))}
          </p>
        )}
        {member.description && (
          <p
            className={`mt-2 break-words text-sm leading-relaxed text-mist ${expanded ? '' : 'line-clamp-2'}`}
          >
            {stripHtml(member.description)}
          </p>
        )}
      </div>
    </>
  );

  return (
    <article className="h-full min-w-0 max-w-full">
      {interactive ? (
        <CardButton expanded={expanded} onToggle={onToggle}>
          {body}
        </CardButton>
      ) : (
        <div className="flex h-full min-w-0 w-full max-w-full flex-col rounded-[1.25rem] bg-forest">
          {body}
        </div>
      )}
    </article>
  );
}

function CardButton({
  expanded,
  onToggle,
  children,
}: {
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  return (
    <button
      type="button"
      className="flex h-full min-w-0 w-full max-w-full cursor-pointer flex-col rounded-[1.25rem] bg-forest text-left"
      aria-expanded={expanded}
      onPointerDown={(event) => {
        pointerStartRef.current = { x: event.clientX, y: event.clientY };
      }}
      onClick={(event) => {
        const start = pointerStartRef.current;
        pointerStartRef.current = null;
        if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 12) return;
        onToggle();
      }}
    >
      {children}
    </button>
  );
}
