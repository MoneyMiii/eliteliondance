import { COLLECTIONS } from './collections';
import { fetchRecords } from './cms';
import { sortAgendaEvents } from './events';
import type { Labels } from './i18n';
import type { Locale } from './locale';
import { getLocalizedValue, stripHtml } from './localize';
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

type CmsData<T> = { ok: true; data: T } | { ok: false };

async function loadList<T>(
  collection: string,
  options: Parameters<typeof fetchRecords>[1] = {},
): Promise<T[] | null> {
  const records = await fetchRecords<T>(collection, options);
  return records.ok ? records.data : null;
}

function toEditorial(record: EditorialRecord, locale: Locale, key: string): EditorialBlock {
  const thumb = key === 'home.about' || key === 'about.hero' ? '1600x900' : '1200x800';
  return {
    key,
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
    title: stripHtml(getLocalizedValue(record, 'title', locale)),
    description: stripHtml(getLocalizedValue(record, 'description', locale)),
    icon: getPocketBaseFileUrl(record, record.icon),
    photo: getPocketBaseFileUrl(record, record.photo, '1200x800'),
  };
}

function normalizeSettings(record?: SettingsRecord): SiteSettings {
  const limit = Number(record?.upcomingEventsLimit);
  return {
    contactEmail: record?.contactEmail?.trim() || undefined,
    instagramUrl: record?.instagramUrl?.trim() || '',
    upcomingEventsLimit: Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_UPCOMING_LIMIT,
    logo: record ? getPocketBaseFileUrl(record, record.logo) : undefined,
    logoMark: record ? getPocketBaseFileUrl(record, record.logoMark) : undefined,
    siteUrl: record?.siteUrl?.trim() || '',
    brandName: record?.brandName?.trim() || '',
    themeColor: record?.themeColor?.trim() || undefined,
  };
}

export async function getSettings(): Promise<CmsData<SiteSettings>> {
  const records = await loadList<SettingsRecord>(COLLECTIONS.settings, {
    fields: SETTINGS_FIELDS,
    page: 1,
    perPage: 1,
  });
  if (!records) return { ok: false };
  return { ok: true, data: normalizeSettings(records[0]) };
}

export async function getEvents(locale: Locale): Promise<CmsData<EventItem[]>> {
  const records = await loadList<EventRecord>(COLLECTIONS.events, {
    filter: 'isActive=true',
    sort: 'dateTime',
    fields: EVENT_FIELDS,
  });
  if (!records) return { ok: false };
  return { ok: true, data: sortAgendaEvents(records.map((record) => toEvent(record, locale))) };
}

async function getUpcomingEvents(
  locale: Locale,
  limit: number,
): Promise<CmsData<{ items: EventItem[]; hasMore: boolean }>> {
  const records = await loadList<EventRecord>(COLLECTIONS.events, {
    filter: 'isActive=true && dateTime>=@now',
    sort: 'dateTime',
    fields: EVENT_FIELDS,
    page: 1,
    perPage: Math.max(limit, 0) + 1,
  });
  if (!records) return { ok: false };
  const items = records.map((record) => toEvent(record, locale));
  return {
    ok: true,
    data: {
      items: items.slice(0, limit),
      hasMore: items.length > limit,
    },
  };
}

export async function getGallery(
  options: { limit?: number; thumb?: string } = {},
): Promise<CmsData<GalleryItem[]>> {
  const records = await loadList<GalleryRecord>(COLLECTIONS.gallery, {
    sort: 'displayOrder',
    fields: GALLERY_FIELDS,
    ...(options.limit ? { page: 1, perPage: options.limit } : {}),
  });
  if (!records) return { ok: false };
  const thumb = options.thumb ?? '1600x0';
  return { ok: true, data: records.map((record) => toGallery(record, thumb)).filter((item) => item.image) };
}

async function getTeamMembers(locale: Locale): Promise<CmsData<TeamMember[]>> {
  const records = await loadList<TeamMemberRecord>(COLLECTIONS.teamMembers, {
    filter: 'isActive=true',
    sort: 'lastName,firstName',
    expand: 'roles',
    fields: TEAM_FIELDS,
  });
  if (!records) return { ok: false };
  return { ok: true, data: sortPriorityMembersFirst(records.map((record) => toTeamMember(record, locale))) };
}

export async function getPartners(): Promise<CmsData<Partner[]>> {
  const records = await loadList<PartnerRecord>(COLLECTIONS.partners, {
    filter: 'isActive=true',
    sort: 'displayOrder',
    fields: PARTNER_FIELDS,
  });
  if (!records) return { ok: false };
  return { ok: true, data: records.map((record) => ({ id: record.id, name: record.name })) };
}

async function getServices(locale: Locale): Promise<CmsData<ServiceItem[]>> {
  const records = await loadList<ServiceRecord>(COLLECTIONS.services, {
    filter: 'isActive=true',
    sort: 'displayOrder,title_fr',
    fields: SERVICE_FIELDS,
  });
  if (!records) return { ok: false };
  return { ok: true, data: records.map((record) => toService(record, locale)).filter((item) => item.title) };
}

export async function getContactServices(locale: Locale): Promise<CmsData<{ id: string; title: string }[]>> {
  const records = await loadList<ServiceRecord>(COLLECTIONS.services, {
    sort: 'displayOrder,title_fr',
    fields: CONTACT_SERVICE_FIELDS,
  });
  if (!records) return { ok: false };
  return {
    ok: true,
    data: records
      .map((record) => ({
        id: record.id,
        title: stripHtml(getLocalizedValue(record, 'title', locale)),
      }))
      .filter((item) => item.title),
  };
}

export async function getPage(slug: PageSlug, locale: Locale): Promise<CmsData<EditorialBlock | undefined>> {
  const records = await loadList<PageRecord>(COLLECTIONS.pages, {
    filter: `slug="${slug}" && isActive=true`,
    fields: PAGE_FIELDS,
    page: 1,
    perPage: 1,
  });
  if (!records) return { ok: false };
  const record = records[0];
  return { ok: true, data: record ? toEditorial(record, locale, `${slug}.hero`) : undefined };
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

  const content: Record<string, EditorialBlock> = {};
  for (const record of records) {
    if (!isHomepageSectionKey(record.slot)) continue;
    content[`home.${record.slot}`] = toEditorial(record, locale, `home.${record.slot}`);
  }

  const sections = records
    .filter((record) => isHomepageSectionKey(record.slot))
    .map((record) => ({
      key: record.slot as HomepageSection['key'],
    }));

  return { ok: true, data: { sections, content } };
}

export async function getAboutBlocks(locale: Locale): Promise<CmsData<EditorialBlock[]>> {
  const records = await loadList<EditorialRecord>(COLLECTIONS.aboutSections, {
    filter: 'isActive=true',
    sort: 'displayOrder',
    fields: ABOUT_FIELDS,
  });
  if (!records) return { ok: false };
  return {
    ok: true,
    data: records.map((record, index) =>
      toEditorial(record, locale, record.id ? `about.${record.id}` : `about.section-${index}`),
    ),
  };
}

export async function getUiLabels(locale: Locale): Promise<CmsData<Labels>> {
  const records = await loadList<UiLabelRecord>(COLLECTIONS.uiLabels, {
    filter: 'isActive=true',
    fields: UI_LABEL_FIELDS,
  });
  if (!records) return { ok: false };

  const labels: Labels = {};
  for (const record of records) {
    const key = record.key.replace(/^ui\./, '');
    const value = getLocalizedValue(record, 'title', locale);
    if (key && value) labels[key] = value;
  }
  return { ok: true, data: labels };
}

export async function getNavLinks(locale: Locale): Promise<CmsData<NavLink[]>> {
  const records = await loadList<NavLinkRecord>(COLLECTIONS.navLinks, {
    filter: 'isActive=true',
    sort: 'displayOrder',
    fields: NAV_FIELDS,
  });
  if (!records) return { ok: false };
  return {
    ok: true,
    data: records.map((record) => ({
      id: record.id,
      href: record.href,
      label: getLocalizedValue(record, 'title', locale),
    })),
  };
}

export async function getHomeData(locale: Locale, settings: SiteSettings): Promise<CmsData<HomeData>> {
  const [home, gallery, team, partners, events, services] = await Promise.all([
    getHomeSections(locale),
    getGallery({ limit: HOME_GALLERY_LIMIT, thumb: '800x600' }),
    getTeamMembers(locale),
    getPartners(),
    getUpcomingEvents(locale, settings.upcomingEventsLimit),
    getServices(locale),
  ]);

  if (!home.ok || !gallery.ok || !team.ok || !partners.ok || !events.ok || !services.ok) {
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
      partners: partners.data,
      services: services.data,
      content: home.data.content,
      instagramUrl: settings.instagramUrl,
      logoMark: settings.logoMark,
    },
  };
}

export interface HomeData {
  sections: HomepageSection[];
  upcomingEvents: EventItem[];
  hasMoreUpcoming: boolean;
  gallery: GalleryItem[];
  team: TeamMember[];
  partners: Partner[];
  services: ServiceItem[];
  content: Record<string, EditorialBlock>;
  instagramUrl: string;
  logoMark?: string;
}
