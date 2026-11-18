#!/usr/bin/env python3
"""
pihk-kemenag-masuk.py — dedupe & masukkan baris 19-87 PIHK Kemenag ke DB.
• Nama BARU (tidak ada di DB)  → CSV terpisah → siap impor via /api/import
• Nama SUDAH ADA (cocok dinormalisasi) → perluaya baris existing: isi kolom
  kosong (phone/email/website) + tambah info KMA di description. licenseNo,
  nama, type TIDAK diubah (aman untuk fitur auto-isi).
"""
import csv
import json
import re
import sqlite3
import subprocess

DB = "/home/z/my-project/db/custom.db"
SRC = "/home/z/my-project/download/data-resmi/pihk-kemenag-19-87.csv"
BARU = "/home/z/my-project/download/data-resmi/pihk-kemenag-19-87-baru.csv"

def norm_nama(s: str) -> str:
    s = (s or "").lower().replace("pt.", " ").replace("pt ", " ")
    return re.sub(r"[^a-z0-9]+", "", s)

rows = list(csv.DictReader(open(SRC, encoding="utf-8-sig")))
con = sqlite3.connect(DB)
cur = con.cursor()
db = {norm_nama(n): dict(id=i, name=n, phone=p or "", email=e or "", website=w or "", description=d or "")
      for i, n, p, e, w, d in cur.execute("SELECT id, name, phone, email, website, description FROM Member")}

baru, cocok = [], []
for r in rows:
    nn = norm_nama(r["name"])
    if nn in db:
        cocok.append((r, db[nn]))
    else:
        baru.append(r)

print(f"Baris sumber : {len(rows)}")
print(f"  → BARU     : {len(baru)}")
print(f"  → COCOK/PERKAYA : {len(cocok)}")
for r, d in cocok:
    isi = [k for k in ("phone", "email", "website") if not d[k] and r[k]]
    print(f"    - {r['name']} ⇔ {d['name']} | isi kosong: {isi or '-'}")

# tulis CSV kandidat baru
with open(BARU, "w", newline="", encoding="utf-8-sig") as f:
    w = csv.DictWriter(f, fieldnames=["name","type","city","province","licenseNo","phone","email","website","description"])
    w.writeheader(); w.writerows(baru)
print(f"\nCSV baru: {BARU}")

# perkaya baris existing (isi kolom kosong saja)
n_enrich = 0
for r, d in cocok:
    up, add = [], []
    for k in ("phone", "email", "website"):
        if not d[k] and r[k]:
            up.append(f"{k} = ?"); add.append(r[k])
    tambah = f"Izin PIHK Kemenag RI: {r['licenseNo']} · Sumber: Daftar PIHK resmi Kemenag RI (Ditjen PHU, salinan publik Scribd 693210692)"
    if tambah.lower() not in (d["description"] or "").lower():
        up.append("description = ?")
        add.append((d["description"] + " · " + tambah) if d["description"] else tambah)
    if up:
        cur.execute(f"UPDATE Member SET {', '.join(up)} WHERE id = ?", (*add, d["id"]))
        n_enrich += 1
con.commit()
con.close()
print(f"Baris existing diperkaya: {n_enrich}")
