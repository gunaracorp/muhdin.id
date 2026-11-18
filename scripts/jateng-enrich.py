"""Enrichment 17 anggota DB yang cocok dengan PDF Jateng (SATU HAJI per 15-09-2025).

Aturan aman (mengikuti pola Task 24):
- HANYA mengisi kolom KOSONG (phone, email, city)
- HANYA menambah (append) ke description
- TIDAK mengubah name, licenseNo, type yang sudah ada
"""
import json
import re
import sqlite3

DB = "/home/z/my-project/db/custom.db"
SUMBER = "Sumber: Kanwil Kemenag Prov. Jawa Tengah, Daftar SATU HAJI per 15 September 2025"

cocok = json.load(open("/tmp/panen25/jateng-enrich.json", encoding="utf-8"))

con = sqlite3.connect(DB)
cur = con.cursor()
n_tel = n_em = n_city = n_desc = 0
for h in cocok:
    db_name = h["db_name"]
    row = cur.execute("SELECT id, phone, email, city, description FROM Member WHERE name = ?", (db_name,)).fetchone()
    if not row:
        print(f"  [skip] tidak ketemu: {db_name}")
        continue
    mid, phone, email, city, desc = row
    phone = phone or ""
    email = email or ""
    city = city or ""
    desc = desc or ""
    changes = []
    if not phone.strip() and h.get("phone"):
        phone = h["phone"]
        n_tel += 1
        changes.append("phone")
    if not email.strip() and h.get("email"):
        email = h["email"]
        n_em += 1
        changes.append("email")
    if not city.strip() and h.get("city"):
        city = h["city"]
        n_city += 1
        changes.append("city")
    if "SATU HAJI per 15 September 2025" not in desc:
        tambahan = []
        izin_baru = h.get("licenseNo") or ""
        if izin_baru and re.sub(r"\D", "", izin_baru) not in re.findall(r"\d+", (h.get("db_license") or "")):
            tambahan.append(f"Izin SATU HAJI per 15-09-2025: {izin_baru}")
        for il in h.get("izin_lain", []):
            tambahan.append(il.replace("juga terdaftar sbg", "Terdaftar juga sbg"))
        tambahan.append(SUMBER)
        desc = (desc + " · " if desc.strip() else "") + " · ".join(tambahan)
        n_desc += 1
        changes.append("description")
    if changes:
        cur.execute(
            "UPDATE Member SET phone=?, email=?, city=?, description=? WHERE id=?",
            (phone, email, city, desc, mid),
        )
        print(f"  [ok] {db_name}: +{','.join(changes)}")
con.commit()
con.close()
print(f"\nSelesai: {n_tel} phone, {n_em} email, {n_city} city, {n_desc} description diperkaya")
