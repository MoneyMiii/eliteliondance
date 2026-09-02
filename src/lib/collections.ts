export const COLLECTIONS = {
  settings: 'settings',
  uiLabels: 'ui_labels',
  homeSections: 'home_sections',
  pages: 'pages',
  aboutSections: 'about_sections',
  events: 'events',
  gallery: 'gallery',
  services: 'services',
  teamMembers: 'team_members',
  teamRoles: 'team_roles',
  partners: 'partners',
  navLinks: 'nav_links',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
