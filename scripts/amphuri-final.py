#!/usr/bin/env python3
"""Finalisasi kandidat AMPHURI:
- bersihkan apostrof/quote di izin
- keluarkan 12 izin notasi ilmiah (rusak di sumber)
- terapkan vonis review t3: hanya PT MAKASSAR TORAJA yang digabung ke DB; 14 lain tetap baru
Output: /tmp/panen26/kandidat-final.csv + enrich-final.json + izin-rusak.json"""
import csv, json, re

rows = list(csv.DictReader(open("/tmp/panen26/kandidat-v2.csv", encoding="utf-8-sig")))
review3 = json.load(open("/tmp/panen26/review-t3.json"))
enrich_t3 = json.load(open("/tmp/panen26/enrich-v2.json"))

# --- id DB utk PT MAKASSAR TORAJA (satu2nya vonis MERGE) ---
merge_db = None
for e in enrich_t3:
    if e["amphuri"]["name"] == "PT MAKASSAR TORAJA":
        merge_db = {"db_id": e["db_id"], "db_name": e["db_name"], "tahap": 3, "amphuri": e["amphuri"]}
print("merge t3 terverifikasi:", merge_db and merge_db["db_name"])

final, rusak = [], []
for r in rows:
    izin = r["licenseNo"].strip().strip("'\"").strip()
    if re.match(r"^\d\.\d+E\+\d+$", izin, re.I):
        rusak.append({"name": r["name"], "izin_asli": r["licenseNo"], "alasan": "notasi ilmiah (NIB terpotong di sumber)"})
        continue
    # bersihkan juga di description jika ada
    r["licenseNo"] = izin
    final.append(r)

# keluarkan PT MAKASSAR TORAJA dari final (jadi enrichment)
final = [r for r in final if r["name"] != "PT MAKASSAR TORAJA"]
print(f"final baru: {len(final)} (buang 12 izin rusak + 1 merge t3)")

with open("/tmp/panen26/kandidat-final.csv", "w", newline="", encoding="utf-8-sig") as f:
    w = csv.DictWriter(f, fieldnames=["name", "type", "city", "province", "licenseNo", "phone", "email", "website", "description"])
    w.writeheader()
    for r in final:
        w.writerow(r)

# enrich final = tahap1 (78) + merge t3 (1)
enrich_t1 = [e for e in enrich_t2 if e["tahap"] == 1] if False else None
enrich_v2 = json.load(open("/tmp/panen26/enrich-v2.json"))
enrich_final = [e for e in enrich_v2 if e["tahap"] == 1]
if merge_db:
    enrich_final.append(merge_db)
json.dump(enrich_final, open("/tmp/panen26/enrich-final.json", "w"), ensure_ascii=False, indent=1)
json.dump(rusak, open("/tmp/panen26/izin-rusak.json", "w"), ensure_ascii=False, indent=1)
print(f"enrich final: {len(enrich_final)} (78 tahap-1 + 1 terverifikasi)")
print("kandidat-final.csv, enrich-final.json, izin-rusak.json tersimpan")
