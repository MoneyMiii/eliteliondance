import { COLLECTIONS } from './collections';
import { fetchRecords, type CmsResult } from './cms';
import { sortAgendaEvents } from './events';
import type { Labels } from './i18n';
import type { Locale } from './locale';
import { getLocalizedValue, localizedPlain } from './localize';
import { getPocketBaseFileUrl } from './media';
import { sortPriorityMembersFirst } from './team';
import {
  isHomepageSectionKey,
  type EditorialBlock,
  type EditorialRecord,
  type EventItem,
  type EventRecord,
  type GalleryItem,
  type GalleryRecord,
  type HomeSectionRecord,
  type HomepageSection,
  type NavLink,
  type NavLinkRecord,
  type PageRecord,
  type PageSlug,
  type Partner,
  type PartnerRecord,
  type ServiceItem,
  type ServiceRecord,
  type SettingsRecord,
  type SiteSettings,
  type TeamMember,
  type TeamMemberRecord,
  type TeamRoleRecord,
  type UiLabelRecord,
} from './types';

const DEFAULT_UPCOMING_LIMIT = 3;
const HOME_GALLERY_LIMIT = 8;

const META = 'id,collectionId,collectionName';
const SETTINGS_FIELDS = `${META},contactEmail,instagramUrl,upcomingEventsLimit,logo,logoMark,siteUrl,brandName,themeColor`;
const UI_LABEL_FIELDS = `${META},key,title_fr,title_zh`;
const NAV_FIELDS = `${META},title_fr,title_zh,href,displayOrder`;
const PARTNER_FIELDS = `${META},name,displayOrder`;
const EVENT_FIELDS = `${META},title_fr,title_zh,dateTime,location_fr,location_zh,description_fr,description_zh,mainImage`;
const GALLERY_FIELDS = `${META},media,displayOrder`;
const SERVICE_FIELDS = `${META},title_fr,title_zh,description_fr,description_zh,icon,photo,displayOrder`;
const CONTACT_SERVICE_FIELDS = `${META},title_fr,title_zh,displayOrder`;
const TEAM_FIELDS = `${META},firstName,lastName,photo,expand.roles.*`;
const HOME_SECTION_FIELDS = `${META},slot,displayOrder,isActive,anchor,title_fr,title_zh,subtitle_fr,subtitle_zh,content_fr,content_zh,image,video,ctaLabel_fr,ctaLabel_zh,ctaUrl,ctaSecondaryLabel_fr,ctaSecondaryLabel_zh,ctaSecondaryUrl`;
const PAGE_FIELDS = `${META},slug,title_fr,title_zh,subtitle_fr,subtitle_zh,content_fr,content_zh,image,ctaLabel_fr,ctaLabel_zh,ctaUrl`;
const ABOUT_FIELDS = `${META},title_fr,title_zh,content_fr,content_zh,image,displayOrder`;

type CmsData<T> = CmsResult<T>;

async function loadList<T>(
  collection: string,
  options: Parameters<typeof fetchRecords>[1] = {},
): Promise<T[] | null> {
  const records = await fetchRecords<T>(collection, options);
  return records.ok ? records.data : null;
}

async function loadMapped<T, R>(
  collection: string,
  options: Parameters<typeof fetchRecords>[1],
  map: (records: T[]) => R,
): Promise<CmsData<R>> {
  const records = await loadList<T>(collection, options);
  if (!records) return { ok: false };
  return { ok: true, data: map(records) };
}

function toEditorial(record: EditorialRecord, locale: Locale, key: string): EditorialBlock {
  const thumb = key === 'home.about' || key === 'about.hero' ? '1600x900' : '1200x800';
  return {
    title: getLocalizedValue(record, 'title', locale),
    subtitle: getLocalizedValue(record, 'subtitle', locale),
    content: getLocalizedValue(record, 'content', locale),
    image: getPocketBaseFileUrl(record, record.image, thumb),
    video: getPocketBaseFileUrl(record, record.video),
    ctaLabel: getLocalizedValue(record, 'ctaLabel', locale),
    ctaUrl: record.ctaUrl?.trim() || undefined,
    ctaSecondaryLabel: getLocalizedValue(record, 'ctaSecondaryLabel', locale),
    ctaSecondaryUrl: record.ctaSecondaryUrl?.trim() || undefined,
    anchor: record.anchor?.trim() || undefined,
  };
}

function toEvent(record: EventRecord, locale: Locale, now = new Date()): EventItem {
  const date = new Date(record.dateTime);
  const isUpcoming = date.getTime() >= now.getTime();
  return {
    id: record.id,
    title: getLocalizedValue(record, 'title', locale),
    description: getLocalizedValue(record, 'description', locale),
    location: getLocalizedValue(record, 'location', locale),
    dateTime: record.dateTime,
    image: getPocketBaseFileUrl(record, record.mainImage, '1200x800'),
    isUpcoming,
  };
}

function toGallery(record: GalleryRecord, thumb = '1600x0'): GalleryItem {
  return {
    id: record.id,
    image: getPocketBaseFileUrl(record, record.media, thumb) ?? '',
  };
}

function expandedRoles(record: TeamMemberRecord): TeamRoleRecord[] {
  const value = record.expand?.roles;
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function toTeamMember(record: TeamMemberRecord, locale: Locale): TeamMember {
  const roleRecords = expandedRoles(record)
    .filter((role) => role.isActive !== false)
    .sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder));

  return {
    id: record.id,
    firstName: record.firstName,
    lastName: record.lastName,
    roles: roleRecords.map((role) => getLocalizedValue(role, 'title', locale) || role.key),
    isPriority: roleRecords.some((role) => Boolean(role.isPriority)),
    photo: getPocketBaseFileUrl(record, record.photo, '800x1000'),
  };
}

function toService(record: ServiceRecord, locale: Locale): ServiceItem {
  return {
    id: record.id,
    title: localizedPlain(record, 'title', locale),
    description: localizedPlain(record, 'description', locale),
    icon: getPocketBaseFileUrl(record, record.icon, '128x128f'),
    photo: getPocketBaseFileUrl(record, record.photo, '1200x800'),
  };
}

function normalizeSettings(record?: SettingsRecord): SiteSettings {
  const limit = Number(record?.upcomingEventsLimit);
  return {
    contactEmail: record?.contactEmail?.trim() || undefined,
    instagramUrl: record?.instagramUrl?.trim() || '',
    upcomingEventsLimit: Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_UPCOMING_LIMIT,
    logo: record ? getPocketBaseFileUrl(record, record.logo, '0x160') : undefined,
    // Aussi utilisé en og:image et en favicon, d'où une taille plus généreuse.
    logoMark: record ? getPocketBaseFileUrl(record, record.logoMark, '0x600') : undefined,
    siteUrl: record?.siteUrl?.trim() || '',
    brandName: record?.brandName?.trim() || '',
    themeColor: record?.themeColor?.trim() || undefined,
  };
}

export function getSettings(): Promise<CmsData<SiteSettings>> {
  return loadMapped<SettingsRecord, SiteSettings>(
    COLLECTIONS.settings,
    { fields: SETTINGS_FIELDS, page: 1, perPage: 1 },
    (records) => normalizeSettings(records[0]),
  );
}

export function getEvents(locale: Locale): Promise<CmsData<EventItem[]>> {
  return loadMapped<EventRecord, EventItem[]>(
    COLLECTIONS.events,
    { filter: 'isActive=true', sort: 'dateTime', fields: EVENT_FIELDS },
    (records) => sortAgendaEvents(records.map((record) => toEvent(record, locale))),
  );
}

function getUpcomingEvents(
  locale: Locale,
  limit: number,
): Promise<CmsData<{ items: EventItem[]; hasMore: boolean }>> {
  return loadMapped<EventRecord, { items: EventItem[]; hasMore: boolean }>(
    COLLECTIONS.events,
    {
      filter: 'isActive=true && dateTime>=@now',
      sort: 'dateTime',
      fields: EVENT_FIELDS,
      page: 1,
      perPage: Math.max(limit, 0) + 1,
    },
    (records) => {
      const items = records.map((record) => toEvent(record, locale));
      return { items: items.slice(0, limit), hasMore: items.length > limit };
    },
  );
}

export function getGallery(
  options: { limit?: number; thumb?: string } = {},
): Promise<CmsData<GalleryItem[]>> {
  const thumb = options.thumb ?? '1600x0';
  return loadMapped<GalleryRecord, GalleryItem[]>(
    COLLECTIONS.gallery,
    {
      sort: 'displayOrder',
      fields: GALLERY_FIELDS,
      ...(options.limit ? { page: 1, perPage: options.limit } : {}),
    },
    (records) => records.map((record) => toGallery(record, thumb)).filter((item) => item.image),
  );
}

function getTeamMembers(locale: Locale): Promise<CmsData<TeamMember[]>> {
  return loadMapped<TeamMemberRecord, TeamMember[]>(
    COLLECTIONS.teamMembers,
    {
      filter: 'isActive=true',
      sort: 'lastName,firstName',
      expand: 'roles',
      fields: TEAM_FIELDS,
    },
    (records) => sortPriorityMembersFirst(records.map((record) => toTeamMember(record, locale))),
  );
}

export function getPartners(): Promise<CmsData<Partner[]>> {
  return loadMapped<PartnerRecord, Partner[]>(
    COLLECTIONS.partners,
    { filter: 'isActive=true', sort: 'displayOrder', fields: PARTNER_FIELDS },
    (records) => records.map((record) => ({ id: record.id, name: record.name })),
  );
}

function getServices(locale: Locale): Promise<CmsData<ServiceItem[]>> {
  return loadMapped<ServiceRecord, ServiceItem[]>(
    COLLECTIONS.services,
    { filter: 'isActive=true', sort: 'displayOrder,title_fr', fields: SERVICE_FIELDS },
    (records) => records.map((record) => toService(record, locale)).filter((item) => item.title),
  );
}

export function getContactServices(locale: Locale): Promise<CmsData<{ id: string; title: string }[]>> {
  return loadMapped<ServiceRecord, { id: string; title: string }[]>(
    COLLECTIONS.services,
    { filter: 'isActive=true', sort: 'displayOrder,title_fr', fields: CONTACT_SERVICE_FIELDS },
    (records) =>
      records
        .map((record) => ({
          id: record.id,
          title: localizedPlain(record, 'title', locale),
        }))
        .filter((item) => item.title),
  );
}

export function getPage(slug: PageSlug, locale: Locale): Promise<CmsData<EditorialBlock | undefined>> {
  return loadMapped<PageRecord, EditorialBlock | undefined>(
    COLLECTIONS.pages,
    { filter: `slug="${slug}" && isActive=true`, fields: PAGE_FIELDS, page: 1, perPage: 1 },
    (records) => (records[0] ? toEditorial(records[0], locale, `${slug}.hero`) : undefined),
  );
}

async function getHomeSections(locale: Locale): Promise<
  CmsData<{ sections: HomepageSection[]; content: Record<string, EditorialBlock> }>
> {
  const records = await loadList<HomeSectionRecord>(COLLECTIONS.homeSections, {
    filter: 'isActive=true',
    sort: 'displayOrder',
    fields: HOME_SECTION_FIELDS,
  });
  if (!records) return { ok: false };

  const sections: HomepageSection[] = [];
  const content: Record<string, EditorialBlock> = {};
  for (const record of records) {
    if (!isHomepageSectionKey(record.slot)) continue;
    sections.push({ key: record.slot });
    content[`home.${record.slot}`] = toEditorial(record, locale, `home.${record.slot}`);
  }

  return { ok: true, data: { sections, content } };
}

export function getAboutBlocks(locale: Locale): Promise<CmsData<EditorialBlock[]>> {
  return loadMapped<EditorialRecord, EditorialBlock[]>(
    COLLECTIONS.aboutSections,
    { filter: 'isActive=true', sort: 'displayOrder', fields: ABOUT_FIELDS },
    (records) =>
      records.map((record, index) =>
        toEditorial(record, locale, record.id ? `about.${record.id}` : `about.section-${index}`),
      ),
  );
}

export function getUiLabels(locale: Locale): Promise<CmsData<Labels>> {
  return loadMapped<UiLabelRecord, Labels>(COLLECTIONS.uiLabels, { filter: 'isActive=true', fields: UI_LABEL_FIELDS }, (records) => {
    const labels: Labels = {};
    for (const record of records) {
      const key = record.key.replace(/^ui\./, '');
      const value = getLocalizedValue(record, 'title', locale);
      if (key && value) labels[key] = value;
    }
    return labels;
  });
}

export function getNavLinks(locale: Locale): Promise<CmsData<NavLink[]>> {
  return loadMapped<NavLinkRecord, NavLink[]>(
    COLLECTIONS.navLinks,
    { filter: 'isActive=true', sort: 'displayOrder', fields: NAV_FIELDS },
    (records) =>
      records.map((record) => ({
        id: record.id,
        href: record.href,
        label: getLocalizedValue(record, 'title', locale),
      })),
  );
}

export async function getHomeData(locale: Locale, settings: SiteSettings): Promise<CmsData<HomeData>> {
  const [home, gallery, team, events, services] = await Promise.all([
    getHomeSections(locale),
    getGallery({ limit: HOME_GALLERY_LIMIT, thumb: '800x600' }),
    getTeamMembers(locale),
    getUpcomingEvents(locale, settings.upcomingEventsLimit),
    getServices(locale),
  ]);

  if (!home.ok || !gallery.ok || !team.ok || !events.ok || !services.ok) {
    return { ok: false };
  }

  return {
    ok: true,
    data: {
      sections: home.data.sections,
      upcomingEvents: events.data.items,
      hasMoreUpcoming: events.data.hasMore,
      gallery: gallery.data,
      team: team.data,
      services: services.data,
      content: home.data.content,
    },
  };
}

export interface HomeData {
  sections: HomepageSection[];
  upcomingEvents: EventItem[];
  hasMoreUpcoming: boolean;
  gallery: GalleryItem[];
  team: TeamMember[];
  services: ServiceItem[];
  content: Record<string, EditorialBlock>;
}
