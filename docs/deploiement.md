# Mise en place du déploiement

Objectif : **un nom de domaine**, **deux programmes** sur le serveur, **pas de CORS**.

Le visiteur ne voit que `eliteliondance.fr`. Un reverse proxy (Caddy ou Nginx) répartit les requêtes vers Astro ou PocketBase.

## Ce qu’il faut

- Un VPS (Linux) avec un domaine pointé dessus (`eliteliondance.fr` + `www` si besoin)
- Node.js (version 22 LTS recommandée) et npm
- Le binaire [PocketBase](https://pocketbase.io/docs/)
- Caddy (plus simple pour HTTPS) ou Nginx + Certbot

Tu ne mets **pas** le projet dans `pb_public`. PocketBase ne sait servir que des fichiers statiques ; ce site est une app Node.

## Les deux process

| Process | Rôle | Écoute en local |
|---|---|---|
| PocketBase | CMS, fichiers, admin | `127.0.0.1:8090` |
| Astro (Node) | Pages + `/api/contact` | `127.0.0.1:4321` (ou `PORT`) |

Seul Caddy/Nginx écoute 80/443 vers l’extérieur.

## Aiguillage (important)

Astro et PocketBase utilisent tous les deux des chemins `/api/…`. Il faut les séparer :

| Chemin | Destination |
|---|---|
| `/api/contact` | Astro |
| `/api/*` (collections, files, etc.) | PocketBase |
| `/_/` (admin PocketBase) | PocketBase |
| Tout le reste | Astro |

## Exemple Caddy

```caddy
eliteliondance.fr {
	encode gzip

	handle /api/contact* {
		reverse_proxy 127.0.0.1:4321
	}

	handle /api/* {
		reverse_proxy 127.0.0.1:8090
	}

	handle /_/* {
		reverse_proxy 127.0.0.1:8090
	}

	handle {
		reverse_proxy 127.0.0.1:4321
	}
}
```

Caddy gère Let’s Encrypt tout seul.

## Build et lancement du front

Sur le serveur, dans le dépôt :

```bash
npm ci
npm run build
PORT=4321 HOST=127.0.0.1 node dist/server/entry.mjs
```

Fichier `.env` **du front** (pas dans PocketBase) :

```env
PUBLIC_POCKETBASE_URL=https://eliteliondance.fr
PUBLIC_SITE_URL=https://eliteliondance.fr
RESEND_API_KEY=re_xxxxxxxx
CONTACT_FROM_EMAIL=noreply@eliteliondance.fr
CONTACT_RATE_LIMIT_WINDOW_MS=900000
CONTACT_RATE_LIMIT_MAX=5
```

`PUBLIC_POCKETBASE_URL` doit être l’URL **publique**. En `http://127.0.0.1:8090`, les visiteurs ne verraient pas les photos (leurs navigateurs n’ont pas accès à localhost du serveur).

Le serveur Astro, lui, appelle PocketBase via le reverse proxy (même URL) ou, si tu préfères, via une URL interne. Le plus simple : la même URL publique, Caddy boucle vers `8090` pour `/api/collections` et `/api/files`.

## PocketBase en service

Exemple d’unité systemd (`/etc/systemd/system/pocketbase.service`) :

```ini
[Unit]
Description=PocketBase Elite Lion Dance
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/pocketbase
ExecStart=/opt/pocketbase/pocketbase serve --http=127.0.0.1:8090
Restart=always

[Install]
WantedBy=multi-user.target
```

Même principe pour Astro (`WorkingDirectory` = le dépôt, `ExecStart` = la commande `node dist/server/entry.mjs`, avec `EnvironmentFile=.env`).

## Admin PocketBase

Une fois le proxy en place : `https://eliteliondance.fr/_/`

Protège cet URL (mot de passe admin fort). Ne l’annonce pas sur le site public.

## Pourquoi pas de CORS

Le navigateur ne parle qu’à `eliteliondance.fr`. Astro va chercher les collections **côté serveur**. Les images passent par le même domaine (`/api/files/…`). Aucune requête cross-origin à configurer.

## Local vs production

| | Local | Production |
|---|---|---|
| Front | `npm run dev` → `http://127.0.0.1:4321` | `node dist/server/entry.mjs` derrière Caddy |
| CMS | `./pocketbase serve` → `:8090` | même binaire, `:8090` en localhost |
| `PUBLIC_POCKETBASE_URL` | `http://127.0.0.1:8090` | `https://eliteliondance.fr` |
| CORS | souvent à autoriser dans PocketBase si tu testes le SDK dans le navigateur | inutile avec ce schéma |

## Checklist

```text
[ ] DNS A/AAAA vers le VPS
[ ] PocketBase tourne en 127.0.0.1:8090
[ ] Collections créées (voir docs/pocketbase.md)
[ ] npm run build OK
[ ] Astro écoute 127.0.0.1:4321
[ ] Caddy / Nginx en place, HTTPS vert
[ ] PUBLIC_POCKETBASE_URL = https://eliteliondance.fr
[ ] Photos visibles, admin /_/ accessible
[ ] Formulaire : voir docs/mailing.md
```
