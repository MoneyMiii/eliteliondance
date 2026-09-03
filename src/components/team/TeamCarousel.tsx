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
    <article className="flex h-full min-h-0 min-w-0 w-full max-w-full flex-col overflow-hidden rounded-[1.25rem] bg-forest [container-type:inline-size]">
      <div className="aspect-[3/4] w-full shrink-0 overflow-hidden">
        {member.photo ? (
          <img
            src={member.photo}
            alt=""
            draggable={false}
            data-cursor="drag"
            className="block h-full w-full object-cover"
          />
        ) : logoMark ? (
          <img src={logoMark} alt="" draggable={false} data-cursor="drag" className="h-full w-full object-contain p-6" />
        ) : null}
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-hidden px-[clamp(0.45rem,3.5cqi,0.9rem)] pt-[clamp(0.45rem,3.5cqi,0.9rem)] pb-[clamp(0.95rem,7.5cqi,1.6rem)] text-center">
        <h3 className="min-w-0 font-display text-[clamp(0.7rem,9.5cqi,1.15rem)] uppercase leading-snug text-ink [overflow-wrap:anywhere]">
          {member.firstName} {member.lastName}
        </h3>
        {member.roles.length > 0 && (
          <p className="mt-1 min-w-0 text-[clamp(0.6rem,7.5cqi,0.8rem)] leading-snug text-brand [overflow-wrap:anywhere]">
            {member.roles.map((role) => (
              <span key={role} className="block">
                {role}
              </span>
            ))}
          </p>
        )}
      </div>
    </article>
  );
}
