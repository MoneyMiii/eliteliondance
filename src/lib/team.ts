const TEAM_NAME_COLLATOR = new Intl.Collator('fr-FR', { sensitivity: 'base' });

function compareTeamNames(
  a: { firstName: string; lastName: string },
  b: { firstName: string; lastName: string },
): number {
  const byLast = TEAM_NAME_COLLATOR.compare(a.lastName.trim(), b.lastName.trim());
  if (byLast !== 0) return byLast;
  return TEAM_NAME_COLLATOR.compare(a.firstName.trim(), b.firstName.trim());
}

export function sortPriorityMembersFirst<T extends { isPriority: boolean; firstName: string; lastName: string }>(
  members: T[],
): T[] {
  const priority = members.filter((member) => member.isPriority).sort(compareTeamNames);
  const others = members.filter((member) => !member.isPriority).sort(compareTeamNames);
  return [...priority, ...others];
}
