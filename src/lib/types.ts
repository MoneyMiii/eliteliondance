export interface PocketBaseRecord {
  id: string;
  collectionId?: string;
  collectionName?: string;
}

export interface LocalizedFields {
  title_fr?: string;
  title_zh?: string;
  subtitle_fr?: string;
  subtitle_zh?: string;
  content_fr?: string;
  content_zh?: string;
  ctaLabel_fr?: string;
  ctaLabel_zh?: string;
  ctaSecondaryLabel_fr?: string;
  ctaSecondaryLabel_zh?: string;
}

export interface EventRecord extends PocketBaseRecord {
  title_fr: string;
  title_zh: string;
  dateTime: string;
  location_fr: string;
  location_zh: string;
  description_fr?: string;
  description_zh?: string;
  mainImage?: string;
  isActive: boolean;
}

export interface GalleryRecord extends PocketBaseRecord {
  media: string;
  displayOrder: number;
}

export interface TeamRoleRecord extends PocketBaseRecord {
  key: string;
  title_fr: string;
  title_zh: string;
  isPriority?: boolean;
  displayOrder: number;
  isActive?: boolean;
}

export interface TeamMemberRecord extends PocketBaseRecord {
  firstName: string;
  lastName: string;
  photo: string;
  roles?: string[] | string;
  description_fr?: string;
  description_zh?: string;
  isActive: boolean;
  expand?: {
    roles?: TeamRoleRecord | TeamRoleRecord[];
  };
}

export interface ServiceRecord extends PocketBaseRecord {
  title_fr: string;
  title_zh: string;
  description_fr?: string;
  description_zh?: string;
  icon?: string;
  photo?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface PartnerRecord extends PocketBaseRecord {
  name: string;
  displayOrder: number;
  isActive: boolean;
}

export interface SettingsRecord extends PocketBaseRecord {
  contactEmail?: string;
  instagramUrl?: string;
  upcomingEventsLimit?: number;
  logo?: string;
  logoMark?: string;
  siteUrl?: string;
  brandName?: string;
  themeColor?: string;
}

export interface UiLabelRecord extends PocketBaseRecord {
  key: string;
  title_fr?: string;
  title_zh?: string;
  isActive: boolean;
}

export interface NavLinkRecord extends PocketBaseRecord {
  title_fr: string;
  title_zh: string;
  href: string;
  displayOrder: number;
  isActive: boolean;
}

export interface EditorialRecord extends PocketBaseRecord, LocalizedFields {
  image?: string;
  video?: string;
  displayOrder?: number;
  isActive?: boolean;
  ctaUrl?: string;
  ctaSecondaryUrl?: string;
  anchor?: string;
}

export interface HomeSectionRecord extends EditorialRecord {
  slot: HomepageSectionKey | string;
}

export interface PageRecord extends EditorialRecord {
  slug: PageSlug | string;
}

export const HOMEPAGE_SECTION_KEYS = [
  'hero',
  'intro',
  'services',
  'events',
  'gallery',
  'about',
  'team',
  'instagram',
] as const;

export type HomepageSectionKey = (typeof HOMEPAGE_SECTION_KEYS)[number];

export const PAGE_SLUGS = ['about', 'contact'] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

export function isHomepageSectionKey(value: string): value is HomepageSectionKey {
  return (HOMEPAGE_SECTION_KEYS as readonly string[]).includes(value);
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  location: string;
  dateTime: string;
  image?: string;
  isUpcoming: boolean;
}

export interface GalleryItem {
  id: string;
  image: string;
}

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isPriority: boolean;
  photo?: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  photo?: string;
}

export interface Partner {
  id: string;
  name: string;
}

export interface NavLink {
  id: string;
  href: string;
  label: string;
}

export interface EditorialBlock {
  key: string;
  title: string;
  subtitle: string;
  content: string;
  image?: string;
  video?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryUrl?: string;
  anchor?: string;
}

export interface HomepageSection {
  key: HomepageSectionKey;
  title?: string;
  displayOrder: number;
}

export interface SiteSettings {
  contactEmail?: string;
  instagramUrl: string;
  upcomingEventsLimit: number;
  logo?: string;
  logoMark?: string;
  siteUrl: string;
  brandName: string;
  themeColor?: string;
}
