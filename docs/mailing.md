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
| Expéditeur (`from`) | ex. `noreply@eliteliondance.fr` | `.env` → `CONTACT_FROM_EMAIL` |
| Destinataire (`to`) | boîte réelle de l’équipe | PocketBase → `settings.contactEmail` |
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
CONTACT_FROM_EMAIL=noreply@eliteliondance.fr
```

`CONTACT_FROM_EMAIL` doit être une adresse **du domaine vérifié**. `noreply@…` convient. Ce n’est pas forcément la boîte que l’équipe consulte au quotidien.

## 2. Adresse de l’équipe dans PocketBase

Collection `settings`, **une** ligne :

| Champ | Valeur |
|---|---|
| `contactEmail` | l’adresse qui doit **recevoir** les demandes |

Cette valeur n’apparaît nulle part sur le site. Seul le serveur Astro la lit.

## 3. Comportement selon l’environnement

| Situation | Résultat |
|---|---|
| Resend + destinataire OK | Mail envoyé, le visiteur voit le message de succès |
| Local, pas de clé Resend | La demande est **journalisée** dans les logs du serveur, succès affiché quand même (pour développer sans compte mail) |
| Production, pas de destinataire PocketBase | Erreur `503` (`unconfigured`) |
| Resend refuse l’envoi | Erreur `502` (`email_failed`) |

Sans DNS Resend valides, même une clé API produira un échec d’envoi.

## 4. Protections déjà dans le code

- **Honeypot** : champ caché `companyUrl`. S’il est rempli (bot), le serveur répond « succès » et n’envoie rien.
- **Limite de débit** : par IP, défaut 5 envois / 15 min (`CONTACT_RATE_LIMIT_MAX`, `CONTACT_RATE_LIMIT_WINDOW_MS`).
- **Validation** : nom, e-mail, téléphone et message obligatoires.

## 5. Checklist

```text
[ ] Domaine vérifié chez Resend
[ ] RESEND_API_KEY dans le .env du serveur Astro
[ ] CONTACT_FROM_EMAIL = une adresse @eliteliondance.fr
[ ] settings.contactEmail renseigné
[ ] Test réel : envoyer le formulaire, ouvrir la boîte équipe, cliquer Répondre
```

Le détail de l’implémentation est dans `src/pages/api/contact.ts`.
