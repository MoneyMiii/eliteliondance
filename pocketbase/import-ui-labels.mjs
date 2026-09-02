import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import PocketBase from 'pocketbase';

const csvPath = join(dirname(fileURLToPath(import.meta.url)), 'ui-labels.csv');
const url = (process.env.PB_URL || process.argv[2] || '').replace(/\/+$/, '');
const email = process.env.PB_EMAIL || process.argv[3];
const password = process.env.PB_PASSWORD || process.argv[4];

if (!url || !email || !password) {
  console.error(`Usage:
  node pocketbase/import-ui-labels.mjs https://TON-INSTANCE.pocketbasecloud.com EMAIL MOT_DE_PASSE

Ou avec des variables d'environnement : PB_URL, PB_EMAIL, PB_PASSWORD.`);
  process.exit(1);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, '');

  for (let i = 0; i < src.length; i += 1) {
    const char = src[i];
    const next = src[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((entry) => entry.some((cell) => cell.length));
}

const [header, ...lines] = parseCsv(readFileSync(csvPath, 'utf8'));
const index = Object.fromEntries(header.map((name, i) => [name, i]));
const records = lines.map((line) => ({
  key: line[index.key]?.trim(),
  title_fr: line[index.title_fr] ?? '',
  title_zh: line[index.title_zh] ?? '',
  isActive: String(line[index.isActive]).trim().toLowerCase() !== 'false',
})).filter((record) => record.key);

const pb = new PocketBase(url);
pb.autoCancellation(false);

try {
  await pb.collection('_superusers').authWithPassword(email, password);
} catch {
  await pb.admins.authWithPassword(email, password);
}

let created = 0;
let updated = 0;

for (const record of records) {
  const existing = await pb.collection('ui_labels').getFirstListItem(
    `key="${record.key.replaceAll('"', '')}"`,
  ).catch(() => null);

  if (existing) {
    await pb.collection('ui_labels').update(existing.id, record);
    updated += 1;
  } else {
    await pb.collection('ui_labels').create(record);
    created += 1;
  }
}

console.log(`ui_labels : ${created} créés, ${updated} mis à jour (${records.length} au total).`);
