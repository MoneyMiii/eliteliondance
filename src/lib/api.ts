import { COLLECTIONS } from './collections';
import { fetchRecords } from './cms';
import { sortAgendaEvents } from './events';
import type { Labels } from './i18n';
import type { Locale } from './locale';
import { getLocalizedValue, stripHtml } from './localize';
import { getPocketBaseFileIconUrl, getPocketBaseFileUrl } from './media';
import { sortPriorityMembersFirst } from './team';
import {
  isHomepageSectionKey,
  type AboutSectionRecord,
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

export type CmsData<T> = { ok: true; data: T } | { ok: false };

async function loadList<T>(
  collection: string,
  options: { filter?: string; sort?: string; expand?: string } = {},
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

function toGallery(record: GalleryRecord): GalleryItem {
  return {
    id: record.id,
    image: getPocketBaseFileUrl(record, record.media, '1600x0') ?? '',
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
    description: getLocalizedValue(record, 'description', locale),
    photo: getPocketBaseFileUrl(record, record.photo, '800x1000'),
  };
}

async function toService(record: ServiceRecord, locale: Locale): Promise<ServiceItem> {
  return {
    id: record.id,
    title: stripHtml(getLocalizedValue(record, 'title', locale)),
    description: stripHtml(getLocalizedValue(record, 'description', locale)),
    icon: await getPocketBaseFileIconUrl(record, record.icon),
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
    fromEmail: record?.fromEmail?.trim() || undefined,
    themeColor: record?.themeColor?.trim() || undefined,
  };
}

export async function getSettings(): Promise<CmsData<SiteSettings>> {
  const records = await loadList<SettingsRecord>(COLLECTIONS.settings);
  if (!records) return { ok: false };
  return { ok: true, data: normalizeSettings(records[0]) };
}

export async function getEvents(locale: Locale): Promise<CmsData<EventItem[]>> {
  const records = await loadList<EventRecord>(COLLECTIONS.events, {
    filter: 'isActive=true',
    sort: 'dateTime',
  });
  if (!records) return { ok: false };
  return { ok: true, data: sortAgendaEvents(records.map((record) => toEvent(record, locale))) };
}

export async function getGallery(): Promise<CmsData<GalleryItem[]>> {
  const records = await loadList<GalleryRecord>(COLLECTIONS.gallery, {
    sort: 'displayOrder',
  });
  if (!records) return { ok: false };
  return { ok: true, data: records.map((record) => toGallery(record)).filter((item) => item.image) };
}

export async function getTeamMembers(locale: Locale): Promise<CmsData<TeamMember[]>> {
  const records = await loadList<TeamMemberRecord>(COLLECTIONS.teamMembers, {
    filter: 'isActive=true',
    sort: 'lastName,firstName',
    expand: 'roles',
  });
  if (!records) return { ok: false };
  return { ok: true, data: sortPriorityMembersFirst(records.map((record) => toTeamMember(record, locale))) };
}

export async function getPartners(): Promise<CmsData<Partner[]>> {
  const records = await loadList<PartnerRecord>(COLLECTIONS.partners, {
    filter: 'isActive=true',
    sort: 'displayOrder',
  });
  if (!records) return { ok: false };
  return { ok: true, data: records.map((record) => ({ id: record.id, name: record.name })) };
}

export async function getServices(locale: Locale): Promise<CmsData<ServiceItem[]>> {
  const records = await loadList<ServiceRecord>(COLLECTIONS.services, {
    filter: 'isActive=true',
    sort: 'displayOrder',
  });
  if (!records) return { ok: false };
  return { ok: true, data: await Promise.all(records.map((record) => toService(record, locale))) };
}

export async function getPage(slug: PageSlug, locale: Locale): Promise<CmsData<EditorialBlock | undefined>> {
  const records = await loadList<PageRecord>(COLLECTIONS.pages, {
    filter: `slug="${slug}" && isActive=true`,
  });
  if (!records) return { ok: false };
  const record = records[0];
  return { ok: true, data: record ? toEditorial(record, locale, `${slug}.hero`) : undefined };
}

export async function getHomeSections(locale: Locale): Promise<
  CmsData<{ sections: HomepageSection[]; content: Record<string, EditorialBlock> }>
> {
  const records = await loadList<HomeSectionRecord>(COLLECTIONS.homeSections, {
    sort: 'displayOrder',
  });
  if (!records) return { ok: false };

  const content: Record<string, EditorialBlock> = {};
  for (const record of records) {
    if (!isHomepageSectionKey(record.slot)) continue;
    content[`home.${record.slot}`] = toEditorial(record, locale, `home.${record.slot}`);
  }

  const sections = records
    .filter((record) => record.isActive !== false && isHomepageSectionKey(record.slot))
    .map((record) => ({
      key: record.slot as HomepageSection['key'],
      displayOrder: record.displayOrder ?? 0,
      title: getLocalizedValue(record, 'title', locale),
    }));

  return { ok: true, data: { sections, content } };
}

export async function getAboutBlocks(locale: Locale): Promise<CmsData<EditorialBlock[]>> {
  const records = await loadList<AboutSectionRecord>(COLLECTIONS.aboutSections, {
    filter: 'isActive=true',
    sort: 'displayOrder',
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

export async function getContactRecipientEmail(): Promise<string | undefined> {
  const settings = await getSettings();
  return settings.ok ? settings.data.contactEmail : undefined;
}

export async function getLayoutData(locale: Locale): Promise<CmsData<{ partners: Partner[]; settings: SiteSettings }>> {
  const [partners, settings] = await Promise.all([getPartners(), getSettings()]);
  if (!partners.ok || !settings.ok) return { ok: false };
  return { ok: true, data: { partners: partners.data, settings: settings.data } };
}

export async function getHomeData(locale: Locale): Promise<CmsData<HomeData>> {
  const [home, gallery, team, partners, events, services, settings] = await Promise.all([
    getHomeSections(locale),
    getGallery(),
    getTeamMembers(locale),
    getPartners(),
    getEvents(locale),
    getServices(locale),
    getSettings(),
  ]);

  if (
    !home.ok ||
    !gallery.ok ||
    !team.ok ||
    !partners.ok ||
    !events.ok ||
    !services.ok ||
    !settings.ok
  ) {
    return { ok: false };
  }

  const allUpcoming = events.data.filter((event) => event.isUpcoming);
  const upcomingEvents = allUpcoming.slice(0, settings.data.upcomingEventsLimit);

  return {
    ok: true,
    data: {
      sections: home.data.sections,
      upcomingEvents,
      hasMoreUpcoming: allUpcoming.length > upcomingEvents.length,
      gallery: gallery.data,
      team: team.data,
      partners: partners.data,
      services: services.data,
      content: home.data.content,
      instagramUrl: settings.data.instagramUrl,
      logoMark: settings.data.logoMark,
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
