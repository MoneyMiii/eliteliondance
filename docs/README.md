# Documentation Elite Lion Dance

Ce dossier décrit le site public **eliteliondance.fr** tel qu’il est aujourd’hui : un front Astro, un CMS PocketBase, un envoi d’e-mails via Resend.

| Document | Contenu |
|---|---|
| [Rôle du projet](./role-du-projet.md) | Pourquoi ce site existe, ce qu’il montre, ce qu’il ne fait pas |
| [Architecture technique](./architecture.md) | Stack, dossiers, flux de données, langues |
| [Déploiement](./deploiement.md) | Un domaine, deux process, reverse proxy, variables d’environnement |
| [PocketBase](./pocketbase.md) | 10 collections, conventions, import du schéma |
| [Mailing](./mailing.md) | Formulaire de contact, Resend, adresses from / to / reply-to |

En local, sans PocketBase, le site affiche un **contenu de secours** (événements démo, équipe, textes). Dès que `PUBLIC_POCKETBASE_URL` est renseigné, PocketBase devient la source de vérité.
