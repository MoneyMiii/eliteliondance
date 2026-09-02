# Architecture technique

## Vue d’ensemble

Deux programmes, un site :

```
Visiteur
   │
   │  https://eliteliondance.fr
   ▼
Astro (Node)  ──────── GET ────────►  PocketBase
   │                                    │
   │  POST /api/contact                 │  admin /_/
   ▼                                    ▼
Resend  ──►  boîte mail de l’équipe    contenus + fichiers
```

- **Astro** génère les pages, lit PocketBase en GET, envoie les mails.
- **PocketBase** stocke textes, événements, équipe, photos. Il n’envoie pas les mails.

Sans `PUBLIC_POCKETBASE_URL`, Astro n’appelle pas PocketBase et utilise `src/data/fallback/`.

## Stack

| Couche | Choix |
|---|---|
| Framework | Astro 5, rendu **serveur** (`output: 'server'`, adaptateur Node) |
| UI interactive | React (îlots : menu, carrousels, formulaire, cartes événements) |
| Styles | Tailwind CSS v4 |
| CMS | PocketBase (SDK JS, lecture seule) |
| Mail | Resend (API HTTP depuis `/api/contact`) |
| Langues | Cookie `eld_locale` (`fr` ou `zh`), lu côté serveur |

Le site **ne peut pas** être copié dans le dossier `pb_public` de PocketBase : ce n’est pas un export HTML statique.

## Dossiers utiles

```
src/
  pages/          Routes (accueil, événements, galerie, contact, API)
  components/     Blocs d’interface
  layouts/        En-tête, pied, SEO, favicon
  lib/            Accès CMS, i18n, tri, SEO, locale
  data/fallback/  Contenus de secours
  styles/         CSS global
docs/             Cette documentation
pocketbase/       Schéma CMS (collections.json, ui-labels.csv)
scripts/export-ui-labels.py  Régénère pocketbase/ui-labels.csv depuis src/lib/i18n.ts
```

## Comment les données arrivent à l’écran

1. Une requête arrive sur Astro.
2. Le middleware lit le cookie de langue et charge les libellés (`ui_labels` ou fallback).
3. La page lit la collection concernée (`events`, `gallery`, `services`, `home_sections`, etc.).
4. Si PocketBase répond, ces enregistrements sont affichés. Sinon, fallback.
5. Les URLs d’images sont construites ainsi :  
   `{PUBLIC_POCKETBASE_URL}/api/files/{collection}/{id}/{fichier}`

En production, `PUBLIC_POCKETBASE_URL` doit être **l’URL publique du site** (ou le sous-chemin proxy), pas `http://127.0.0.1:8090`. Sinon les photos dans le HTML pointeraient vers localhost.

## Règles métier côté front

- **Événements** : pas de champ « à venir / passé ». Le site compare `dateTime` à maintenant. Accueil : les 3 plus proches. Agenda à venir : du plus proche au plus lointain. Passés : du plus récent au plus ancien.
- **Équipe** : responsables (`roles` contient `responsable`) d’abord, puis nom, prénom.
- **Prestations d’accueil** : collection `services` (une ligne = une carte). Sans CMS, 4 cartes de secours.
- **À propos** : `pages` (`slug=about`) pour l’en-tête, `about_sections` pour les chapitres (ordre `displayOrder`). Un nouveau chapitre = une nouvelle ligne.
- **Libellés** : collection `ui_labels`. Réglages site : collection `settings` (une ligne `code=site`).
- **Accueil** : collection `home_sections` (un `slot` par bloc : contenu, ordre, visibilité).
- **Onglet navigateur** : logo rond + titre `Elite Lion Dance` uniquement.

## Ce que le navigateur appelle

Le visiteur charge `eliteliondance.fr`. Les lectures CMS se font **sur le serveur Astro**, pas depuis le JavaScript du navigateur (sauf images, via des URLs du même domaine une fois le reverse proxy en place).

Le seul POST public est `/api/contact` (vers Astro, puis Resend).

## Variables d’environnement

Voir `.env.example`.

| Variable | Rôle |
|---|---|
| `PUBLIC_POCKETBASE_URL` | Base CMS + URLs des fichiers |
| `PUBLIC_SITE_URL` | Canonical / Open Graph |
| `RESEND_API_KEY` | Envoi des mails |
| `CONTACT_FROM_EMAIL` | Expéditeur technique |
| `CONTACT_RATE_LIMIT_*` | Anti-abus du formulaire |
