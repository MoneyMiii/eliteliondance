# PocketBase : modèle de données

Le CMS reflète **uniquement ce que le site affiche**. Une collection = un type d’élément visible. Pas de champs « pour plus tard ».

Le site public ne fait **que du GET**. Sans `PUBLIC_POCKETBASE_URL`, le fallback du dépôt s’affiche.

## Import

1. PocketBase → **Settings → Import collections** → `pocketbase/collections.json`
2. Collection `ui_labels` → Import → `pocketbase/ui-labels.csv`

Régénérer le JSON : `node pocketbase/schema.mjs`

## Carte mentale

```
settings          1 ligne : email, Instagram, nb d’événements accueil
ui_labels         textes d’interface (menu, boutons…)

home_sections     8 blocs d’accueil (slot = hero, intro, …)
pages             2 lignes : about, contact
about_sections    chapitres de /a-propos

events            cartes agenda
gallery           photos
services          cartes Prestations
team_members      membres
partners          noms affichés dans le footer
```

## Conventions

| Sujet | Règle |
|---|---|
| Traduction | `*_fr` / `*_zh` |
| Publier | `isActive` coché |
| Ordre | `displayOrder` |
| Fichier | un fichier par champ |

Droits : List/View publics ; écriture réservée aux comptes admin (`@request.auth.id != ""`).

## Collections (champs réellement affichés)

### `settings` — une ligne

`contactEmail` · `instagramUrl` · `upcomingEventsLimit` (ex. 3)

### `ui_labels`

`key` (ex. `nav.home`, sans préfixe `ui.`) · `title_fr` · `title_zh` · `isActive`

### `home_sections` — une ligne par bloc

`slot` (select unique) · `displayOrder` · `isActive` · `title_*` · `subtitle_*` · `content_*` · `image` · `video` (hero) · `ctaLabel_*` (hero, prestations, à-propos)

Les URLs internes restent dans le code (`/contact`, `/a-propos`). Instagram : `settings.instagramUrl`.

| slot | Ce qui sert |
|---|---|
| `hero` | title, subtitle, video, image (poster), ctaLabel |
| `intro` | title, subtitle, content |
| `services` | title, subtitle, ctaLabel |
| `events` / `gallery` / `team` | title, subtitle |
| `about` | title, content, image, ctaLabel |
| `instagram` | title, subtitle |

### `pages`

`slug` : `about` ou `contact` · `isActive` · `title_*` · `subtitle_*` · `content_*` · `image` (about)

### `about_sections`

`title_*` · `content_*` · `image` · `displayOrder` · `isActive`

### `events`

`title_*` · `dateTime` · `location_*` · `description_*` · `mainImage` · `isActive`

À venir / passé = calculé à partir de `dateTime`.

### `gallery`

`media` · `alt_*` · `title_*` (légende) · `displayOrder` · `isActive`

### `services`

`title_*` · `description_*` · `icon` · `photo` (fond de carte) · `displayOrder` · `isActive`

### `team_members`

`firstName` · `lastName` · `photo` · `roles` (`responsable`, `musique`, `danse`, `communication`) · `description_*` · `isActive`

Le site trie : `responsable` d’abord, puis nom.

### `partners`

`name` · `displayOrder` · `isActive`

Le footer n’affiche que le **nom**.

## Checklist

```text
[ ] Import collections.json
[ ] Import ui-labels.csv
[ ] 1 ligne settings
[ ] 8 home_sections
[ ] pages about + contact
[ ] au moins une carte services, un partenaire, etc.
[ ] test FR / 中文
```
