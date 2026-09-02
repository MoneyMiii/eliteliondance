# Rôle du projet

## Qu’est-ce que c’est

**Elite Lion Dance** est le site public de l’équipe de danse traditionnelle chinoise du lion, basée en Île-de-France.

Le visiteur doit comprendre rapidement :

- qui est l’équipe ;
- pour quels événements elle se produit (mariage, inauguration, Nouvel An, séminaire…) ;
- à quoi ressemble un spectacle (photos, vidéo) ;
- comment les joindre, **sans créer de compte**.

Le domaine visé est `eliteliondance.fr`. Les langues sont le **français** et le **chinois**, sur les **mêmes URLs** (pas de `/fr` ni de `/zh`).

## Ce que le site fait

- Présenter l’équipe, les prestations, l’agenda, la galerie et l’à-propos.
- Permettre de **contacter** l’équipe (spectacle ou recrutement) par un formulaire.
- Afficher les contenus gérés dans **PocketBase** (textes FR/ZH, cartes de prestations, photos, événements, membres).
- Servir un **contenu de secours** si le CMS n’est pas configuré ou indisponible.

## Ce que le site n’est pas

- Ce n’est **pas** un back-office. L’équipe n’administre rien ici : tout se fait dans PocketBase (`/_/`).
- Ce n’est **pas** un espace membre : pas d’inscription, pas de panier, pas de paiement.
- Le front **n’écrit jamais** dans PocketBase (aucun POST/PUT/DELETE vers le CMS).
- Les demandes de contact **ne sont pas stockées** dans PocketBase : elles partent par e-mail.

## Pages publiques

| URL | Rôle |
|---|---|
| `/` | Accueil : hero, intro, prestations, prochains événements, galerie, à-propos, équipe, Instagram |
| `/evenements` | Agenda complet (à venir / passés). `?filtre=avenir` ou `?filtre=passes` |
| `/galerie` | Toutes les photos |
| `/a-propos` | Histoire, origine, valeurs, entraînement, etc. |
| `/contact` | Formulaire |
| `/prestations` | Redirection vers l’accueil (`/#prestations`) |

## Qui utilise quoi

| Personne | Outil |
|---|---|
| Public | Ce site |
| L’équipe (textes, photos, dates) | Admin PocketBase |
| Développeur | Ce dépôt + variables d’environnement |
