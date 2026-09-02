import csv
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
text = (root / "src" / "lib" / "i18n.ts").read_text(encoding="utf-8")
start = text.index("export const UI_MESSAGES")
end = text.index("} as const;")
block = text[start:end]
pattern = re.compile(
    r"'([^']+)':\s*\{\s*fr:\s*'((?:\\'|[^'])*)',\s*zh:\s*'((?:\\'|[^'])*)'",
    re.S,
)
rows = pattern.findall(block)
out = root / "pocketbase" / "ui-labels.csv"
with out.open("w", encoding="utf-8", newline="") as handle:
    writer = csv.writer(handle)
    writer.writerow(["key", "title_fr", "title_zh", "isActive"])
    for key, fr, zh in rows:
        writer.writerow(
            [
                key,
                fr.replace("\\'", "'"),
                zh.replace("\\'", "'"),
                "true",
            ]
        )
print(f"wrote {len(rows)} rows to {out.name}")
