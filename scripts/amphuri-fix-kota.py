#!/usr/bin/env python3
"""Isi kota 29 baris kosong dari alamat sumber (bukan karangan) + koreksi provinsi
yang kontradiktif dgn alamat; keluarkan 1 izin-junk; impor ulang."""
import csv, json, re

rows = list(csv.DictReader(open("/tmp/panen26/kandidat-final.csv", encoding="utf-8-sig")))

# peta: nama -> (kota, provinsi_koreksi_atau_None) — semua diturunkan dari ALAMAT sumber
PETA = {
    "PT ALBILAD UNIVERSAL": ("Kota Jakarta Timur", None),
    "PT INHIL ARJUNA WISATA": ("Kab. Lombok Tengah", "Nusa Tenggara Barat (NTB)"),
    "PT ADZAN INSAN KARIMAH": ("Kota Tangerang", "Banten"),
    "PT ARYATI WISATA MANDIRI": ("Kota Jakarta Utara", "DKI Jakarta"),
    "PT MUDAHAN TILAH": ("Kota Mataram", None),
    "PT ARWINDA MITRA MANDIRI": ("Kab. Sidoarjo", None),
    "PT CAHAYA MIHRAB TUR": ("Kota Jakarta Utara", None),
    "PT AMANAH TRAVEL INDONESIA": ("Kota Medan", None),
    "PT SURYA CITRA MADANI": ("Kota Yogyakarta", None),
    "PT FAWWAZ RAMADHAN WISATA": ("Kab. Pangkep", None),
    "PT KARIMA MANDIRI SUKSES": ("Kota Jakarta Timur", None),
    "PT AMININ TRAVEL INDONESIA": ("Kota Jakarta Pusat", None),
    "PT SIR MADINAH TOURS": ("Kab. Sumenep", None),
    "PT ALMULTAZAM AMANAH INSANI": ("Kab. Mojokerto", None),
    "PT BERKAH INSAN MULIA TOUR & TRAVEL": ("Kab. Tuban", None),
    "PT LATIFAH DINI WISATA SEJAHTERA": ("Kab. Bantul", None),
    "PT ANWAR ALHIMAM WISATA": ("Kota Tangerang Selatan", None),
    "PT TRANS GAMALAMA PERSADA": ("Kota Jakarta Selatan", None),
    "PT RIHLAH PRIMA MANDIRI": ("Kota Kendari", None),
    "PT MOESLEM HARAMEIN TOURS & TRAVEL": ("Kota Bandar Lampung", None),
    "PT BAITUSSALAM MANDIRI": ("Kota Jakarta Timur", None),
    "PT SAW TOUR TRAVEL": ("Kota Jakarta Barat", None),
    "PT TRAVELATAYA MANDIRI UTAMA": ("Kota Batam", "Kepulauan Riau"),
    "PT AVICENNA TAIBAH WISATA": ("Kota Banjarbaru", None),
    "PT MUHAMMAD TOUR AND TRAVEL": ("Kab. Sidoarjo", None),
    "PT MAKALI UMROH INDONESIA": ("Kab. Sidoarjo", None),
    "PT ALFATH UMROH HAJI": ("Kota Metro", None),
    "PT BAITULLAH CAHAYA WISATA": ("Kab. Pringsewu", None),
}

fix, skip = [], []
for r in rows:
    if r["city"].strip():
        continue
    if r["name"] == "PT BUNGOMAS MEGA WISATA":
        skip.append({"name": r["name"], "alasan": "nomor izin di sumber berisi angka akuntansi (1.290.000.710.217,00) — bukan izin"})
        continue
    kota, prov_baru = PETA.get(r["name"], ("", None))
    if not kota:
        skip.append({"name": r["name"], "alasan": "kota tak terpetakan dari alamat"})
        continue
    r["city"] = kota
    if prov_baru:
        r["province"] = prov_baru
        r["description"] = r["description"].replace(
            "Sumber data:", f"Catatan: provinsi di tabel AMPHURI ({r['province'] if not prov_baru else prov_baru} dikoreksi dari alamat) · Sumber data:") if False else r["description"]
    fix.append(r)

print(f"diperbaiki kota: {len(fix)}, dikeluarkan: {len(skip)}")
json.dump(skip, open("/tmp/panen26/skip.json", "w"), ensure_ascii=False, indent=1)

with open("/tmp/panen26/kandidat-fix.csv", "w", newline="", encoding="utf-8-sig") as f:
    w = csv.DictWriter(f, fieldnames=["name", "type", "city", "province", "licenseNo", "phone", "email", "website", "description"])
    w.writeheader()
    for r in fix:
        w.writerow(r)

csv_text = open("/tmp/panen26/kandidat-fix.csv", encoding="utf-8-sig").read()
json.dump({"type": "members", "csv": csv_text}, open("/tmp/payload-amphuri-fix.json", "w"), ensure_ascii=False)
print("payload fix siap:", len(fix), "baris")
