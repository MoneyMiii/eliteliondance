# Schéma PocketBase

Fichiers de ce dossier :

| Fichier | Rôle |
|---|---|
| `schema.mjs` | Définition lisible des collections (source de vérité) |
| `collections.json` | Export à importer dans l’admin PocketBase |
| `ui-labels.csv` | Libellés d’interface à importer dans `ui_labels` |

```bash
node pocketbase/schema.mjs
python scripts/export-ui-labels.py
```

Guide humain : [docs/pocketbase.md](../docs/pocketbase.md).
