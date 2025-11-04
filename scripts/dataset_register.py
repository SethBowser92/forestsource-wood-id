import os, json, hashlib, requests
from pathlib import Path

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
ROOT = Path(os.getenv("DATASET_SPLIT_ROOT", "/content/drive/MyDrive/wood_training_data/split"))
HEADERS = {"apikey": SERVICE_ROLE, "Authorization": f"Bearer {SERVICE_ROLE}", "Content-Type": "application/json"}

def sha256_file(p: Path):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1<<20), b""):
            h.update(chunk)
    return h.hexdigest()

rows = []
for split in ("train","val","test"):
    split_dir = ROOT / split
    if not split_dir.exists(): continue
    for species_dir in split_dir.iterdir():
        if not species_dir.is_dir(): continue
        sid = species_dir.name
        for img in species_dir.glob("*.*"):
            rows.append({
                "species_id": sid, "split": split, "source": "gdrive", "uri": f"gdrive://{img}", "sha256": sha256_file(img)
            })
print("Prepared", len(rows), "rows")
r = requests.post(f"{SUPABASE_URL}/rest/v1/dataset_images", headers={**HEADERS, "Prefer":"resolution=merge-duplicates"}, data=json.dumps(rows))
print(r.status_code, r.text[:200])
