# Mise en place du mailing

Les demandes du formulaire **Contact** sont envoyées par e-mail. Elles ne sont **pas** enregistrées dans PocketBase.

L’envoi est fait par **Astro** (`POST /api/contact`), via l’API **Resend**. PocketBase ne sert qu’à indiquer **à quelle adresse** livrer le message.

## Schéma

```
Visiteur                    Astro                         Resend
   │                          │                              │
   │  nom, email, tel, msg    │                              │
   ├─────────────────────────►│                              │
   │                          │  from: noreply@…             │
   │                          │  to:   boîte de l’équipe     │
   │                          │  reply_to: email du visiteur │
   │                          ├─────────────────────────────►│
   │                          │                              ├──► inbox équipe
   │  « demande envoyée »     │                              │
   ◄──────────────────────────┤                              │
```

On n’envoie **pas** « depuis l’adresse du visiteur » : les anti-spam refusent ça. On envoie depuis une adresse du **domaine de l’équipe**, vers la **boîte de l’équipe**, avec **Répondre à** = le visiteur.

| Champ mail | Valeur | Source |
|---|---|---|
| Expéditeur (`from`) | `onboarding@resend.dev` tant que le domaine n’est pas vérifié | `.env` → `CONTACT_FROM_EMAIL` |
| Destinataire (`to`) | `min.sun@efrei.net` | `.env` → `CONTACT_TO_EMAIL`, sinon PocketBase `settings.contactEmail` |
| Répondre à (`reply_to`) | e-mail saisi dans le formulaire | le visiteur |
| Sujet | `Contact : {nom}` | libellé `form.emailSubject` |
| Corps | nom, prénom, e-mail, téléphone, message | le formulaire |

Un clic sur **Répondre** dans la messagerie ouvre un brouillon vers le visiteur, pas vers `noreply`.

## 1. Compte Resend

1. Créer un compte sur [resend.com](https://resend.com).
2. Vérifier le domaine `eliteliondance.fr` (enregistrements DNS indiqués par Resend : SPF, DKIM, éventuellement DMARC).
3. Créer une clé API.
4. Dans le `.env` du **front** :

```env
RESEND_API_KEY=re_xxxxxxxx
CONTACT_FROM_EMAIL=Elite Lion Dance <onboarding@resend.dev>
CONTACT_TO_EMAIL=min.sun@efrei.net
```

Sur **Render**, les mêmes variables vont dans **Environment**. Sans `RESEND_API_KEY`, le formulaire en production échoue.

Sans domaine acheté, laisse `CONTACT_FROM_EMAIL` sur `onboarding@resend.dev`. Resend n’accepte alors que **l’e-mail du compte Resend** (`min.sun@efrei.net`). Une fois `eliteliondance.fr` vérifié, passe `CONTACT_FROM_EMAIL` à `noreply@eliteliondance.fr`.

## 2. Adresse de l’équipe dans PocketBase

Collection `settings`, **une** ligne :

| Champ | Valeur |
|---|---|
| `contactEmail` | **ta** boîte mail (celle du compte Resend, tant qu’il n’y a pas de domaine) |

Cette valeur n’apparaît nulle part sur le site. Seul le serveur Astro la lit.

## 3. Comportement selon l’environnement

| Situation | Résultat |
|---|---|
| Resend + destinataire OK | Mail envoyé vers `min.sun@efrei.net`, succès affiché |
| Local, pas de clé Resend | Demande journalisée, succès affiché (pour coder sans clé) |
| Production, pas de `RESEND_API_KEY` | Erreur `503` (`unconfigured`) |
| Resend refuse l’envoi | Erreur `502` (`email_failed`) |

## 4. Protections déjà dans le code

- **Honeypot** : champ caché `companyUrl`. S’il est rempli (bot), le serveur répond « succès » et n’envoie rien.
- **Limite de débit** : par IP, défaut 5 envois / 15 min (`CONTACT_RATE_LIMIT_MAX`, `CONTACT_RATE_LIMIT_WINDOW_MS`).
- **Validation** : nom, e-mail, téléphone et message obligatoires.

## 5. Checklist

```text
[ ] RESEND_API_KEY sur Render (et en local si tu testes l’envoi)
[ ] CONTACT_FROM_EMAIL = Elite Lion Dance <onboarding@resend.dev>
[ ] CONTACT_TO_EMAIL = min.sun@efrei.net
[ ] Test réel : formulaire → boîte Efrei (et spams) → Répondre = le visiteur
```

Le détail de l’implémentation est dans `src/pages/api/contact.ts`.
