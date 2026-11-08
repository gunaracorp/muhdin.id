#!/usr/bin/env python3
"""
himpuh-bangun-csv.py — bangun CSV anggota dari data detail HIMPUH (450 kandidat).
Aturan (konsisten dengan Task 22, tidak mengarang data):
  • type  = PIHK bila ada No SK Haji; else PPIU (dari No SK Umrah)
  • licenseNo = No SK Haji (utk PIHK) / No SK Umrah (utk PPIU) — STRING ASLI
  • izin kedua, nomor registrasi, alamat, dsb. disimpan di kolom description
  • telepon non-fax pertama diformat +62…; email pertama
  • dedupe by nomor izin dinormalisasi (API impor upsert by licenseNo)
Keluaran: download/data-resmi/anggota-himpuh.csv (kolom alias sheet Master)
"""
import csv
import json
import pathlib
import re

RAW = pathlib.Path("/tmp/himpuh")
OUT = pathlib.Path("/home/z/my-project/download/data-resmi/anggota-himpuh.csv")

# ---------- 1. muat detail ----------
detil = {}
gagal = []
for p in sorted(RAW.glob("detail-b*.json")):
    arr = json.loads(json.loads(p.read_text(encoding="utf-8").strip()))
    for item in arr:
        if not item.get("ok"):
            gagal.append(item.get("id")); continue
        d = json.loads(item["data"])
        detil[d["id"]] = d
print(f"Detail OK: {len(detil)}, gagal: {gagal or '-'}")

kandidat = json.loads((RAW / "kandidat.json").read_text(encoding="utf-8"))
ids = kandidat["ids"]
print(f"Kandidat : {len(ids)}")

def norm_izin(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", (s or "").lower())

def izin_valid(s: str) -> bool:
    """Izin harus memuat digit & bukan label kosong seperti 'SK Umrah' / '-'."""
    n = (s or "").strip()
    return bool(re.search(r"\d", n)) and len(n) >= 3

def bentuk_telepon(t_list):
    """[{kode_nomor_telepon, nomor_telepon, jenis}] -> '+622184310066' (non-fax pertama)."""
    if not t_list:
        return ""
    pilih = [t for t in t_list if (t.get("jenis") or "").lower() != "fax"] or t_list
    t = pilih[0]
    kode = (t.get("kode_nomor_telepon") or "").strip()
    nomor = (t.get("nomor_telepon") or "").strip()
    if not nomor:
        return ""
    if kode == "62" and nomor.startswith("0"):
        return "+62" + nomor[1:]
    if kode.startswith("62"):
        return "+62" + nomor if not nomor.startswith("0") else "+62" + nomor[1:]
    if kode and not nomor.startswith("0"):
        return f"+{kode}{nomor}" if not kode.startswith("0") else f"{kode}{nomor}"
    return nomor

rows, seen_izin_persis, seen_izin_norm = [], {}, set()
skip_dup = skip_kota = skip_sampah = 0
for i in ids:
    d = detil.get(i)
    if not d:
        continue
    sk_umrah = (d.get("no_sk_umrah") or "").strip()
    sk_haji = (d.get("no_sk_haji") or "").strip()
    jenis = (d.get("jenis_anggota") or "").lower()
    # jenis & izin konsisten: SK Haji -> PIHK; selain itu PPIU;
    # izin sampah (tanpa digit) ditolak, coba izin seri satunya
    if sk_haji and izin_valid(sk_haji):
        tipe, license_no = "PIHK", sk_haji
    elif sk_umrah and izin_valid(sk_umrah):
        tipe, license_no = "PPIU", sk_umrah
    else:
        skip_sampah += 1; continue
    z = norm_izin(license_no)
    if license_no in seen_izin_persis:      # konflik persis: tak bisa disimpan dua (upsert by licenseNo)
        skip_dup += 1; continue
    if z in seen_izin_norm and len(z) >= 8: # serupa & cukup panjang: anggap entri ganda
        skip_dup += 1; continue
    seen_izin_persis[license_no] = d["nama_perusahaan"]
    seen_izin_norm.add(z)
    kota = (d.get("kabupaten_nama") or "").strip() or (d.get("kecamatan_nama") or "").strip()
    prov = (d.get("provinsi_nama") or "").strip()
    if not kota:
        kota = prov  # masih data asli
    if not kota:
        skip_kota += 1; continue
    alamat_parts = [p.strip() for p in [
        d.get("alamat") or "", d.get("kecamatan_nama") or "",
        d.get("kabupaten_nama") or "", d.get("provinsi_nama") or "",
        (" kode pos " + d["kode_pos"]) if (d.get("kode_pos") or "").strip() else "",
    ] if p.strip()]
    desk = [f"Alamat: {', '.join(alamat_parts)}"]
    if sk_umrah and license_no != sk_umrah:
        desk.append(f"Izin Umrah: {sk_umrah}")
    if sk_haji and license_no != sk_haji:
        desk.append(f"Izin Haji: {sk_haji}")
    if d.get("nomor_registrasi"):
        desk.append(f"Reg. HIMPUH {d['nomor_registrasi']}")
    if d.get("waktu_bergabung"):
        desk.append(f"Anggota HIMPUH sejak {d['waktu_bergabung']}")
    desk.append("Sumber data: Direktori HIMPUH (himpuh.or.id)")
    emails = [e for e in (d.get("emails") or []) if e and e.strip()]
    rows.append({
        "name": (d.get("nama_perusahaan") or "").strip(),
        "type": tipe,
        "city": kota,
        "province": prov,
        "licenseNo": license_no,
        "phone": bentuk_telepon(d.get("telepon")),
        "email": emails[0] if emails else "",
        "website": (d.get("website") or "").strip(),
        "description": " · ".join(desk),
    })

# validasi minimal
rusak = [r for r in rows if not (r["name"] and r["type"] and r["city"] and r["licenseNo"])]
print(f"\nBaris jadi : {len(rows)}  (skip dup izin: {skip_dup}, skip izin sampah/tanpa digit: {skip_sampah}, skip tanpa kota: {skip_kota}, rusak: {len(rusak)})")
if rusak:
    print("  contoh rusak:", rusak[:3])

n_pihk = sum(1 for r in rows if r["type"] == "PIHK")
print(f"  PIHK: {n_pihk}  PPIU: {len(rows)-n_pihk}")
print(f"  ada telp : {sum(1 for r in rows if r['phone'])}")
print(f"  ada email: {sum(1 for r in rows if r['email'])}")
print(f"  ada web  : {sum(1 for r in rows if r['website'])}")
tanpa_prov = [r["name"] for r in rows if not r["province"]]
print(f"  tanpa provinsi: {len(tanpa_prov)} {tanpa_prov[:5]}")

OUT.parent.mkdir(parents=True, exist_ok=True)
with OUT.open("w", newline="", encoding="utf-8-sig") as f:
    w = csv.DictWriter(f, fieldnames=["name","type","city","province","licenseNo","phone","email","website","description"])
    w.writeheader(); w.writerows(rows)
print(f"\nCSV tersimpan: {OUT}")
