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
    <article className="flex h-full min-h-0 min-w-0 w-full max-w-full flex-col rounded-[1.25rem] bg-forest [container-type:inline-size]">
      <div className="aspect-[3/4] w-full shrink-0 overflow-hidden rounded-t-[1.25rem] bg-paper">
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
      <div className="flex min-h-0 min-w-0 flex-1 flex-col p-[clamp(0.5rem,4cqi,1rem)]">
        <h3 className="font-display text-[clamp(0.8rem,11cqi,1.25rem)] uppercase leading-snug text-ink hyphens-none">
          {member.firstName} {member.lastName}
        </h3>
        {member.roles.length > 0 && (
          <p className="mt-1 text-[clamp(0.65rem,8cqi,0.875rem)] leading-snug text-brand hyphens-none">
            {member.roles.map((role, index) => (
              <span key={role} className="inline-block max-w-full">
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
