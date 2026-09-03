import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Source of truth for the Elite Lion Dance PocketBase schema.
 * Run: node pocketbase/schema.mjs
 * Then import pocketbase/collections.json in PocketBase Admin → Settings → Import collections.
 */

const PUBLIC_RULES = {
  listRule: '',
  viewRule: '',
  createRule: '@request.auth.id != ""',
  updateRule: '@request.auth.id != ""',
  deleteRule: '@request.auth.id != ""',
};

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm'];

let fieldSeq = 1;
function fid(name) {
  return `f_${name}_${String(fieldSeq++).padStart(3, '0')}`.slice(0, 24);
}

function pk() {
  return {
    autogeneratePattern: '[a-z0-9]{15}',
    hidden: false,
    id: 'text3208210256',
    max: 15,
    min: 15,
    name: 'id',
    pattern: '^[a-z0-9]+$',
    presentable: false,
    primaryKey: true,
    required: true,
    system: true,
    type: 'text',
  };
}

function autonumber() {
  return { hidden: false, id: 'autodate_created', name: 'created', onCreate: true, onUpdate: false, presentable: false, system: false, type: 'autodate' };
}

function autoupdate() {
  return { hidden: false, id: 'autodate_updated', name: 'updated', onCreate: true, onUpdate: true, presentable: false, system: false, type: 'autodate' };
}

function text(name, { required = false, presentable = false, unique = false, max = 0 } = {}) {
  return {
    autogeneratePattern: '',
    hidden: false,
    id: fid(name),
    max,
    min: 0,
    name,
    pattern: '',
    presentable,
    primaryKey: false,
    required,
    system: false,
    type: 'text',
  };
}

function editor(name, { required = false } = {}) {
  return {
    convertUrls: false,
    hidden: false,
    id: fid(name),
    maxSize: 0,
    name,
    presentable: false,
    required,
    system: false,
    type: 'editor',
  };
}

function bool(name, { required = false } = {}) {
  return { hidden: false, id: fid(name), name, presentable: false, required, system: false, type: 'bool' };
}

function number(name, { required = false, min = null, max = null, onlyInt = true } = {}) {
  return { hidden: false, id: fid(name), max, min, name, onlyInt, presentable: false, required, system: false, type: 'number' };
}

function date(name, { required = false } = {}) {
  return { hidden: false, id: fid(name), max: '', min: '', name, presentable: true, required, system: false, type: 'date' };
}

function url(name, { required = false } = {}) {
  return { exceptDomains: null, hidden: false, id: fid(name), name, onlyDomains: null, presentable: false, required, system: false, type: 'url' };
}

function email(name, { required = false } = {}) {
  return { exceptDomains: null, hidden: false, id: fid(name), name, onlyDomains: null, presentable: false, required, system: false, type: 'email' };
}

function select(name, values, { required = false, maxSelect = 1, presentable = true } = {}) {
  return { hidden: false, id: fid(name), maxSelect, name, presentable, required, system: false, type: 'select', values };
}

function file(name, { required = false, mimeTypes = IMAGE_TYPES, thumbs = [], maxSize = 20 * 1024 * 1024 } = {}) {
  return {
    hidden: false,
    id: fid(name),
    maxSelect: 1,
    maxSize,
    mimeTypes,
    name,
    presentable: false,
    protected: false,
    required,
    system: false,
    thumbs,
    type: 'file',
  };
}

function localizedTitle() {
  return [text('title_fr', { required: true, presentable: true }), text('title_zh', { required: true, presentable: true })];
}

function localizedOptional(field) {
  return [text(`${field}_fr`), text(`${field}_zh`)];
}

function localizedEditor(field) {
  return [editor(`${field}_fr`), editor(`${field}_zh`)];
}

function collection(id, name, fields, indexes = []) {
  return {
    id,
    name,
    type: 'base',
    system: false,
    ...PUBLIC_RULES,
    indexes,
    fields: [pk(), ...fields, autonumber(), autoupdate()],
  };
}

function relation(name, collectionId, { required = false, maxSelect = 1, minSelect = 0, presentable = false } = {}) {
  return {
    cascadeDelete: false,
    collectionId,
    hidden: false,
    id: fid(name),
    maxSelect,
    minSelect,
    name,
    presentable,
    required,
    system: false,
    type: 'relation',
  };
}

const IDS = {
  settings: 'eld_settings001',
  uiLabels: 'eld_uilabels001',
  homeSections: 'eld_homesection',
  pages: 'eld_pages000001',
  aboutSections: 'eld_aboutsectio',
  events: 'eld_events00001',
  gallery: 'eld_gallery0001',
  services: 'eld_services001',
  teamMembers: 'eld_teammembers',
  teamRoles: 'eld_teamroles01',
  partners: 'eld_partners001',
  navLinks: 'eld_navlinks001',
};

const HOME_SLOTS = ['hero', 'intro', 'services', 'events', 'gallery', 'about', 'team', 'instagram'];
const ICON_TYPES = [...IMAGE_TYPES, 'image/svg+xml'];

function editorialFields({ withVideo = false, withCta = false } = {}) {
  const fields = [
    text('title_fr', { presentable: true }),
    text('title_zh', { presentable: true }),
    ...localizedOptional('subtitle'),
    ...localizedEditor('content'),
    file('image', { thumbs: ['800x600', '1200x800', '1600x900'] }),
  ];
  if (withVideo) {
    fields.push(file('video', { mimeTypes: VIDEO_TYPES, maxSize: 80 * 1024 * 1024 }));
  }
  if (withCta) {
    fields.push(...localizedOptional('ctaLabel'));
    fields.push(text('ctaUrl'));
    fields.push(...localizedOptional('ctaSecondaryLabel'));
    fields.push(text('ctaSecondaryUrl'));
  }
  return fields;
}

const collections = [
  collection(
    IDS.settings,
    'settings',
    [
      email('contactEmail'),
      url('instagramUrl'),
      number('upcomingEventsLimit', { min: 1, max: 12 }),
      file('logo'),
      file('logoMark'),
      url('siteUrl'),
      text('brandName', { presentable: true }),
      email('fromEmail'),
      text('themeColor'),
    ],
    [],
  ),
  collection(
    IDS.uiLabels,
    'ui_labels',
    [
      text('key', { required: true, presentable: true }),
      text('title_fr', { required: true, presentable: true }),
      text('title_zh', { required: true }),
      bool('isActive'),
    ],
    [
      'CREATE UNIQUE INDEX `idx_ui_labels_key` ON `ui_labels` (`key`)',
      'CREATE INDEX `idx_ui_labels_active` ON `ui_labels` (`isActive`)',
    ],
  ),
  collection(
    IDS.homeSections,
    'home_sections',
    [
      select('slot', HOME_SLOTS, { required: true }),
      number('displayOrder', { required: true, min: 1 }),
      bool('isActive'),
      text('anchor'),
      ...editorialFields({ withVideo: true, withCta: true }),
    ],
    [
      'CREATE UNIQUE INDEX `idx_home_sections_slot` ON `home_sections` (`slot`)',
      'CREATE INDEX `idx_home_sections_active_order` ON `home_sections` (`isActive`, `displayOrder`)',
    ],
  ),
  collection(
    IDS.pages,
    'pages',
    [
      select('slug', ['about', 'contact'], { required: true }),
      bool('isActive'),
      ...editorialFields({ withVideo: false }),
    ],
    ['CREATE UNIQUE INDEX `idx_pages_slug` ON `pages` (`slug`)'],
  ),
  collection(
    IDS.aboutSections,
    'about_sections',
    [
      ...localizedTitle(),
      ...localizedEditor('content'),
      file('image', { thumbs: ['1200x800'] }),
      number('displayOrder', { required: true, min: 0 }),
      bool('isActive'),
    ],
    [
      'CREATE INDEX `idx_about_sections_order` ON `about_sections` (`displayOrder`)',
      'CREATE INDEX `idx_about_sections_active_order` ON `about_sections` (`isActive`, `displayOrder`)',
    ],
  ),
  collection(
    IDS.events,
    'events',
    [
      text('title_fr', { required: true, presentable: true }),
      text('title_zh', { required: true, presentable: true }),
      date('dateTime', { required: true }),
      text('location_fr', { required: true, presentable: true }),
      text('location_zh', { required: true }),
      ...localizedEditor('description'),
      file('mainImage', { thumbs: ['1200x800'] }),
      bool('isActive'),
    ],
    [
      'CREATE INDEX `idx_events_datetime` ON `events` (`dateTime`)',
      'CREATE INDEX `idx_events_active_date` ON `events` (`isActive`, `dateTime`)',
    ],
  ),
  collection(
    IDS.gallery,
    'gallery',
    [
      file('media', { required: true, thumbs: ['800x600', '1600x0'] }),
      number('displayOrder', { required: true, min: 1 }),
    ],
    ['CREATE INDEX `idx_gallery_order` ON `gallery` (`displayOrder`)'],
  ),
  collection(
    IDS.services,
    'services',
    [
      ...localizedTitle(),
      ...localizedOptional('description'),
      file('icon', { mimeTypes: ICON_TYPES, maxSize: 2 * 1024 * 1024 }),
      file('photo', { thumbs: ['1200x800'] }),
      number('displayOrder', { required: true, min: 0 }),
      bool('isActive'),
    ],
    [
      'CREATE INDEX `idx_services_order` ON `services` (`displayOrder`)',
      'CREATE INDEX `idx_services_active_order` ON `services` (`isActive`, `displayOrder`)',
    ],
  ),
  collection(
    IDS.teamRoles,
    'team_roles',
    [
      text('key', { required: true, presentable: true, unique: true }),
      ...localizedTitle(),
      number('displayOrder', { required: true, min: 1 }),
      bool('isActive'),
    ],
    ['CREATE UNIQUE INDEX `idx_team_roles_key` ON `team_roles` (`key`)'],
  ),
  collection(
    IDS.teamMembers,
    'team_members',
    [
      text('firstName', { required: true, presentable: true }),
      text('lastName', { required: true, presentable: true }),
      file('photo', { required: true, thumbs: ['800x1000'] }),
      relation('roles', IDS.teamRoles, { required: true, maxSelect: 20, presentable: true }),
      bool('isActive'),
    ],
    [
      'CREATE INDEX `idx_team_name` ON `team_members` (`lastName`, `firstName`)',
      'CREATE INDEX `idx_team_active` ON `team_members` (`isActive`)',
    ],
  ),
  collection(
    IDS.partners,
    'partners',
    [
      text('name', { required: true, presentable: true }),
      number('displayOrder', { required: true, min: 0 }),
      bool('isActive'),
    ],
    [
      'CREATE INDEX `idx_partners_order` ON `partners` (`displayOrder`)',
      'CREATE INDEX `idx_partners_active_order` ON `partners` (`isActive`, `displayOrder`)',
    ],
  ),
  collection(
    IDS.navLinks,
    'nav_links',
    [
      text('title_fr', { required: true, presentable: true }),
      text('title_zh', { required: true, presentable: true }),
      text('href', { required: true, presentable: true }),
      number('displayOrder', { required: true, min: 1 }),
      bool('isActive'),
    ],
    [
      'CREATE INDEX `idx_nav_links_order` ON `nav_links` (`displayOrder`)',
      'CREATE INDEX `idx_nav_links_active_order` ON `nav_links` (`isActive`, `displayOrder`)',
    ],
  ),
];

function uniqueFieldIds(col) {
  const used = new Set();
  for (const field of col.fields) {
    if (used.has(field.id)) field.id = `${field.id}_${col.name}`.slice(0, 24);
    used.add(field.id);
  }
}

for (const col of collections) {
  // created/updated ids collide across collections — PocketBase allows same system ids? Safer to namespace.
  for (const field of col.fields) {
    if (field.name === 'created') field.id = `created_${col.name}`.slice(0, 24);
    if (field.name === 'updated') field.id = `updated_${col.name}`.slice(0, 24);
    if (field.name === 'id') field.id = `id_${col.name}`.slice(0, 24);
  }
  uniqueFieldIds(col);
}

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(dir, 'collections.json');
fs.writeFileSync(out, JSON.stringify(collections, null, 2));
console.log(`wrote ${collections.length} collections to ${path.basename(out)}`);
