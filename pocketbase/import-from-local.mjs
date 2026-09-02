/**
 * Copie toutes les collections du PocketBase local (127.0.0.1:8090)
 * vers une instance distante (PocketBase Cloud, etc.), fichiers compris.
 *
 * Usage :
 *   node pocketbase/import-from-local.mjs https://TON-INSTANCE.pocketbasecloud.com EMAIL MOT_DE_PASSE
 *
 * Options :
 *   --skip-video     n'envoie pas la vidéo hero (utile si le quota disque est petit)
 *   --local URL      PocketBase source (défaut : http://127.0.0.1:8090)
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import PocketBase from 'pocketbase';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const positional = [];
let skipVideo = false;
let localUrl = (process.env.PB_LOCAL_URL || 'http://127.0.0.1:8090').replace(/\/+$/, '');

for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--skip-video') {
    skipVideo = true;
  } else if (args[i] === '--local') {
    localUrl = (args[i + 1] || localUrl).replace(/\/+$/, '');
    i += 1;
  } else {
    positional.push(args[i]);
  }
}

const remoteUrl = (process.env.PB_URL || positional[0] || '').replace(/\/+$/, '');
const email = process.env.PB_EMAIL || positional[1];
const password = process.env.PB_PASSWORD || positional[2];

if (!remoteUrl || !email || !password) {
  console.error(`Usage:
  node pocketbase/import-from-local.mjs https://TON-INSTANCE.pocketbasecloud.com EMAIL MOT_DE_PASSE [--skip-video]`);
  process.exit(1);
}

const COLLECTIONS = [
  'settings',
  'ui_labels',
  'nav_links',
  'partners',
  'team_roles',
  'services',
  'home_sections',
  'pages',
  'about_sections',
  'events',
  'gallery',
  'team_members',
];

const SKIP_FIELDS = new Set(['id', 'collectionId', 'collectionName', 'created', 'updated', 'expand']);

const schema = Object.fromEntries(
  JSON.parse(readFileSync(join(here, 'collections.json'), 'utf8')).map((collection) => [
    collection.name,
    collection.fields,
  ]),
);

function esc(value) {
  return String(value ?? '').replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

function matchFilter(collection, record) {
  switch (collection) {
    case 'settings':
      return null;
    case 'ui_labels':
    case 'team_roles':
      return `key="${esc(record.key)}"`;
    case 'home_sections':
      return `slot="${esc(record.slot)}"`;
    case 'pages':
      return `slug="${esc(record.slug)}"`;
    case 'about_sections':
      return `displayOrder=${Number(record.displayOrder)} && title_fr="${esc(record.title_fr)}"`;
    case 'events':
      return `title_fr="${esc(record.title_fr)}" && dateTime="${esc(record.dateTime)}"`;
    case 'gallery':
      return `displayOrder=${Number(record.displayOrder)}`;
    case 'services':
      return `title_fr="${esc(record.title_fr)}"`;
    case 'team_members':
      return `firstName="${esc(record.firstName)}" && lastName="${esc(record.lastName)}"`;
    case 'partners':
      return `name="${esc(record.name)}"`;
    case 'nav_links':
      return `href="${esc(record.href)}"`;
    default:
      return `id="${esc(record.id)}"`;
  }
}

function fieldTypes(collection) {
  const files = [];
  const relations = [];
  for (const field of schema[collection] ?? []) {
    if (field.type === 'file') files.push(field.name);
    if (field.type === 'relation') relations.push(field.name);
  }
  return { files, relations };
}

async function auth(pb) {
  try {
    await pb.collection('_superusers').authWithPassword(email, password);
  } catch {
    await pb.admins.authWithPassword(email, password);
  }
}

async function downloadFile(record, filename) {
  const url = `${localUrl}/api/files/${record.collectionId}/${record.id}/${encodeURIComponent(filename)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${url}`);
  }
  const type = response.headers.get('content-type') || 'application/octet-stream';
  const bytes = Buffer.from(await response.arrayBuffer());
  return { file: new File([bytes], filename, { type }), bytes: bytes.length };
}

function scalarPayload(collection, record, roleIdMap) {
  const { files, relations } = fieldTypes(collection);
  const payload = {};
  for (const [key, value] of Object.entries(record)) {
    if (SKIP_FIELDS.has(key) || files.includes(key) || relations.includes(key)) continue;
    payload[key] = value;
  }
  if (collection === 'team_members') {
    const localIds = Array.isArray(record.roles) ? record.roles : record.roles ? [record.roles] : [];
    payload.roles = localIds.map((id) => roleIdMap.get(id)).filter(Boolean);
  }
  return payload;
}

async function findExisting(remote, collection, record) {
  const filter = matchFilter(collection, record);
  if (!filter) {
    const list = await remote.collection(collection).getFullList({ perPage: 1 });
    return list[0] ?? null;
  }
  return remote.collection(collection).getFirstListItem(filter).catch(() => null);
}

async function upsert(remote, collection, record, roleIdMap) {
  const { files } = fieldTypes(collection);
  const payload = scalarPayload(collection, record, roleIdMap);
  const existing = await findExisting(remote, collection, record);
  const uploads = [];

  for (const field of files) {
    if (skipVideo && field === 'video') continue;
    const filename = record[field];
    if (!filename) continue;
    if (existing?.[field] === filename) continue;
    const downloaded = await downloadFile(record, filename);
    uploads.push({ field, ...downloaded });
  }

  if (uploads.length === 0) {
    if (existing) {
      await remote.collection(collection).update(existing.id, payload);
      return { action: 'updated', bytes: 0 };
    }
    const created = await remote.collection(collection).create(payload);
    return { action: 'created', bytes: 0, id: created.id };
  }

  const form = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (Array.isArray(value)) {
      for (const item of value) form.append(key, String(item));
    } else if (value != null && value !== '') {
      form.append(key, typeof value === 'boolean' || typeof value === 'number' ? String(value) : value);
    }
  }
  let bytes = 0;
  for (const upload of uploads) {
    form.append(upload.field, upload.file, upload.file.name);
    bytes += upload.bytes;
  }

  if (existing) {
    await remote.collection(collection).update(existing.id, form);
    return { action: 'updated', bytes };
  }
  const created = await remote.collection(collection).create(form);
  return { action: 'created', bytes, id: created.id };
}

const local = new PocketBase(localUrl);
local.autoCancellation(false);
const remote = new PocketBase(remoteUrl);
remote.autoCancellation(false);
await auth(remote);

const roleIdMap = new Map();
let totalBytes = 0;

for (const collection of COLLECTIONS) {
  const expand = collection === 'team_members' ? 'roles' : undefined;
  const records = await local.collection(collection).getFullList({ expand });
  let created = 0;
  let updated = 0;

  if (collection === 'team_roles') {
    for (const record of records) {
      const result = await upsert(remote, collection, record, roleIdMap);
      const remoteRecord = await findExisting(remote, collection, record);
      if (remoteRecord) roleIdMap.set(record.id, remoteRecord.id);
      if (result.action === 'created') created += 1;
      else updated += 1;
      totalBytes += result.bytes;
    }
  } else if (collection === 'team_members') {
    const roles = await local.collection('team_roles').getFullList();
    for (const role of roles) {
      if (!roleIdMap.has(role.id)) {
        const remoteRole = await remote.collection('team_roles').getFirstListItem(`key="${esc(role.key)}"`);
        roleIdMap.set(role.id, remoteRole.id);
      }
    }
    for (const record of records) {
      const result = await upsert(remote, collection, record, roleIdMap);
      if (result.action === 'created') created += 1;
      else updated += 1;
      totalBytes += result.bytes;
    }
  } else {
    for (const record of records) {
      try {
        const result = await upsert(remote, collection, record, roleIdMap);
        if (result.action === 'created') created += 1;
        else updated += 1;
        totalBytes += result.bytes;
      } catch (error) {
        console.error(`  ✗ ${collection} ${record.id}:`, error?.response ?? error.message ?? error);
        throw error;
      }
    }
  }

  const mega = (totalBytes / (1024 * 1024)).toFixed(1);
  console.log(`${collection}: ${created} créés, ${updated} mis à jour (${records.length}) — ${mega} Mo envoyés`);
}

console.log('Terminé.');
if (skipVideo) console.log('Vidéo hero ignorée (--skip-video).');
