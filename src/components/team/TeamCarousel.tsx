import type { TeamMember } from '../../lib/types';
import { t, type Labels } from '../../lib/i18n';
import Carousel from '../common/Carousel';

interface Props {
  labels: Labels;
  members: TeamMember[];
  logoMark?: string;
}

export default function TeamCarousel({ labels, members, logoMark }: Props) {
  if (!members.length) return null;

  return (
    <Carousel
      labels={labels}
      visibleCount={5}
      mobileCount={3}
      align="stretch"
      ariaLabel={t(labels, 'team.carousel')}
      prevLabel={t(labels, 'carousel.prev')}
      nextLabel={t(labels, 'carousel.next')}
    >
      {members.map((member) => (
        <TeamCard key={member.id} member={member} logoMark={logoMark} />
      ))}
    </Carousel>
  );
}

function TeamCard({
  member,
  logoMark,
}: {
  member: TeamMember;
  logoMark?: string;
}) {
  return (
    <article className="flex h-full min-w-0 w-full max-w-full flex-col rounded-[1.25rem] bg-forest">
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
          <p className="mt-1 break-words text-sm leading-snug text-brand">
            {member.roles.map((role, index) => (
              <span key={role}>
                {index > 0 && (
                  <span className="mx-1 text-mist" aria-hidden="true">·</span>
                )}
                {role}
              </span>
            ))}
          </p>
        )}
      </div>
    </article>
  );
}
