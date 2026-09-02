# Schéma PocketBase

Fichiers de ce dossier :

| Fichier | Rôle |
|---|---|
| `schema.mjs` | Définition lisible des collections (source de vérité) |
| `collections.json` | Export à importer dans l’admin PocketBase |
| `ui-labels.csv` | Libellés d’interface à importer dans `ui_labels` |
| `import-ui-labels.mjs` | Import CSV → collection `ui_labels` |
| `import-from-local.mjs` | Copie tout le PocketBase local (127.0.0.1:8090) vers l’instance distante |

```bash
node pocketbase/schema.mjs
python scripts/export-ui-labels.py

# Depuis le PocketBase local déjà rempli :
node pocketbase/import-from-local.mjs https://TON-INSTANCE.pocketbasecloud.com EMAIL MOT_DE_PASSE
```

Guide humain : [docs/pocketbase.md](../docs/pocketbase.md).
