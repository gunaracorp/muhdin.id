#!/usr/bin/env python3
"""
himpuh-parse.py — proses hasil panen API publik HIMPUH (himpuh.or.id/api/publik/anggota).
Gabung 5 halaman (476 anggota), filter PPIU/PIHK yang punya nomor izin resmi,
dedupe terhadap DB existing (by nama & izin dinormalisasi), lalu simpan daftar
kandidat baru (id HIMPUH) untuk panen detail (telepon/email).
Tidak ada data dikarang — hanya memakai field asli dari HIMPUH.
"""
import json
import pathlib
import re
import sqlite3

RAW = pathlib.Path("/tmp/himpuh")
DB = "/home/z/my-project/db/custom.db"

def baca_halaman(p: pathlib.Path):
    """File berisi output CLI: string JSON ber-escape (dikutip). Unwrap aman."""
    txt = p.read_text(encoding="utf-8").strip()
    obj = json.loads(txt)          # unwrap kutip CLI -> string JSON mentah
    if isinstance(obj, str):
        obj = json.loads(obj)      # parse body JSON API
    return obj

def norm_nama(s: str) -> str:
    s = (s or "").lower()
    s = s.replace("pt.", " ").replace("pt ", " ")
    s = re.sub(r"[^a-z0-9]+", "", s)
    return s

def norm_izin(s: str) -> str:
    s = (s or "").lower()
    s = re.sub(r"[^a-z0-9]+", "", s)
    # buang kata umum agar "kmanomor783tahun2019" vs "783tahun2019" bisa dicocokkan
    return s

# ---------- 1. gabung halaman ----------
semua = {}
total_api = None
for p in sorted(RAW.glob("hal-*.raw.json")):
    obj = baca_halaman(p)
    total_api = obj.get("total", total_api)
    for row in obj.get("data", []):
        semua[row["id"]] = row

print(f"Total API  : {total_api}")
print(f"Baris unik : {len(semua)} (by id)")

# statistik jenis
from collections import Counter
jenis_stat = Counter((r.get("jenis_anggota") or "-").lower() for r in semua.values())
print(f"Jenis      : {dict(jenis_stat)}")

punya_izin = [r for r in semua.values()
              if (r.get("no_sk_umrah") or "").strip() or (r.get("no_sk_haji") or "").strip()]
print(f"Punya izin : {len(punya_izin)}")

# ---------- 2. baca DB existing ----------
con = sqlite3.connect(DB)
cur = con.cursor()
db_rows = cur.execute("SELECT name, licenseNo FROM Member").fetchall()
db_nama = {norm_nama(n) for n, _ in db_rows}
db_izin = {norm_izin(i) for _, i in db_rows if i and i.strip()}
db_izin = {z for z in db_izin if len(z) >= 4}  # hindari izin pendek kosong-suka
print(f"DB existing: {len(db_rows)} anggota, {len(db_izin)} izin dinormalisasi")

# ---------- 3. seleksi kandidat baru ----------
kandidat, dup_nama, dup_izin, tanpa_izin = [], [], [], 0
seen_nama = set()
for r in semua.values():
    umrah = (r.get("no_sk_umrah") or "").strip()
    haji = (r.get("no_sk_haji") or "").strip()
    if not umrah and not haji:
        tanpa_izin += 1
        continue
    nn = norm_nama(r.get("nama_perusahaan", ""))
    if nn in db_nama:
        dup_nama.append(r["nama_perusahaan"]); continue
    if nn in seen_nama:
        dup_nama.append("(dalam HIMPUH 2x) " + r["nama_perusahaan"]); continue
    iz_list = [norm_izin(x) for x in (umrah, haji) if x]
    if any(z in db_izin for z in iz_list):
        dup_izin.append(f"{r['nama_perusahaan']} [{umrah or haji}]"); continue
    seen_nama.add(nn)
    kandidat.append(r)

print(f"\nKandidat BARU : {len(kandidat)}")
print(f"  - skip tanpa izin      : {tanpa_izin}")
print(f"  - skip dup nama vs DB  : {len(dup_nama)} -> {dup_nama[:8]}{'...' if len(dup_nama)>8 else ''}")
print(f"  - skip dup izin vs DB  : {len(dup_izin)} -> {dup_izin[:8]}{'...' if len(dup_izin)>8 else ''}")

# ---------- 4. simpan kandidat utk panen detail ----------
out = RAW / "kandidat.json"
out.write_text(json.dumps({
    "total_api": total_api,
    "jumlah_kandidat": len(kandidat),
    "ids": [r["id"] for r in kandidat],
    "ringkas": [{ "id": r["id"], "nama": r.get("nama_perusahaan"), "jenis": r.get("jenis_anggota"),
                  "sk_umrah": r.get("no_sk_umrah"), "sk_haji": r.get("no_sk_haji"),
                  "provinsi": r.get("provinsi_nama"), "kabupaten": r.get("kabupaten_nama")}
                for r in kandidat],
}, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"\nKandidat disimpan: {out}")
