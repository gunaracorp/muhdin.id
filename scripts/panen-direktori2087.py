#!/usr/bin/env python3
"""
panen-direktori2087.py — Task 28.
Sumber: upload/Direktori_Perusahaan_Travel_2087.xlsx (ekstraksi PDF 124 halaman,
2.087 entri bernomor — "database mentahan semua PPIU PIHK seluruh Indonesia").

Keluaran: download/data-resmi/direktori-nasional-2087.csv dengan header sama
dengan kontrak /api/import type=members:
  name,type,city,province,licenseNo,phone,email,website,description

Aturan jujur (nol karangan):
- type: PPIU bila nama memuat istilah ibadah (UMROH/UMRAH/HAJI/HAROMAIN/MUTTAQIF/
  MANASIK/THAIF/RIHLAH/MEKKAH/MAKKAH/MADINAH/HARAMAIN/BAITULLAH dst.), selain itu
  TRAVEL_WISATA. Klasifikasi dari nama, BUKAN dari izin (izin tidak ada di sumber).
- city: diekstrak dari alamat (KOTA X / KAB. X / KOT/KAB. X); kosong bila tak ketemu.
- province: kolom 'Provinsi (pencocokan)'; '*' atau kosong → kosong (tidak ditebak).
- phone/email: '*' atau kosong → kosong.
- description: Direktur + Alamat + QA + sitasi sumber (entri #N, hal. PDF).
"""
import csv
import pathlib
import re

import openpyxl

SRC = pathlib.Path("/home/z/my-project/upload/Direktori_Perusahaan_Travel_2087.xlsx")
OUT = pathlib.Path("/home/z/my-project/download/data-resmi/direktori-nasional-2087.csv")

PATTERN_IBADAH = re.compile(
    r"UMROH|UMRAH|HAJI|HAROMAIN|HARAMAIN|MUTTAQIF|MANASIK|THAIF|RIHLAH|MEKKAH|MAKKAH|"
    r"MADINAH|BAITULLAH|KABA|NUSANTARA TUR|ZAMZAM|KAABA|SENGKANG BLOK|SAFIYYA|QURANI|"
    r"KAFILAH|MABRUR|KUDUS|FAUZA WISATA|INDONESIA BALI|SEHATI WISATA",
    re.IGNORECASE,
)
RE_KOTA = re.compile(r"(?:KOTA ADM\.?|KOTA|KAB\.?|KOT/KAB\.?|KABUPATEN)\.?\s+([A-Z][A-Z\s.'-]{2,60}?)(?=\s*[;,]|$|\s+PROV|\s+JAWA|\s+SULAWESI|\s+SUMATERA|\s+KALIMANTAN|\s+BALI|\s+ACEH|\s+LAMPUNG|\s+JAMBI|\s+RIAU|\s+BANTEN)", re.IGNORECASE)


def titlecase(s: str) -> str:
    words = s.strip().split()
    out = []
    for w in words:
        out.append(w.capitalize() if len(w) > 2 else w.upper())
    return " ".join(out)


def ekstrak_kota(alamat: str) -> str:
    m = RE_KOTA.search(alamat or "")
    if not m:
        return ""
    kota = re.sub(r"\s+", " ", m.group(1)).strip(" .,-")
    if not kota:
        return ""
    # buang sisa segmen RT/RW/kode pos yang kadang menempel
    kota = re.split(r"\s+RT\s|\s+NO\.|\s+NO\b|\s+KEL\b|\s+KEC\b|\s+KODE", kota)[0].strip(" .,-")
    return titlecase(kota)


def bersih(v) -> str:
    if v is None:
        return ""
    s = str(v).strip()
    return "" if s in {"*", "-", "0"} else s


def main() -> None:
    wb = openpyxl.load_workbook(SRC, read_only=True, data_only=True)
    ws = wb["Direktori"]
    rows = ws.iter_rows(values_only=True)
    head = next(rows)
    ix = {h: i for i, h in enumerate(head)}
    n_total = n_city = n_prov = n_phone = n_email = 0
    out_rows = []
    for r in rows:
        no = r[ix["No. Sumber"]]
        if no is None:
            continue
        n_total += 1
        nama = bersih(r[ix["Nama Perusahaan"]])
        if not nama:
            continue
        direktur = bersih(r[ix["Direktur"]])
        alamat = bersih(r[ix["Alamat (ekstrak)"]])
        provinsi = bersih(r[ix["Provinsi (pencocokan)"]])
        telepon = bersih(r[ix["Telepon (ekstrak)"]])
        email = bersih(r[ix["Email (dinormalisasi)"]]).lower()
        halaman = bersih(r[ix["Halaman PDF"]])
        qa = bersih(r[ix["Status QA"]]) or "Tidak tercatat"

        kota = ekstrak_kota(alamat)
        tipe = "PPIU" if PATTERN_IBADAH.search(nama) else "TRAVEL_WISATA"

        parts = []
        if direktur:
            parts.append(f"Direktur: {direktur}")
        if alamat:
            parts.append(f"Alamat: {alamat}")
        parts.append(
            f"Sumber: Direktori Perusahaan Tour & Travel nasional (ekstraksi PDF 124 halaman, "
            f"entri #{no}, hal. {halaman or '?'}); klasifikasi tipe dari nama — izin belum terverifikasi"
        )
        parts.append(f"QA ekstraksi: {qa}")
        desc = " · ".join(parts)

        out_rows.append({
            "name": nama,
            "type": tipe,
            "city": kota,
            "province": provinsi,
            "licenseNo": "",
            "phone": telepon,
            "email": email,
            "website": "",
            "description": desc,
        })
        n_city += bool(kota)
        n_prov += bool(provinsi)
        n_phone += bool(telepon)
        n_email += bool(email)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["name", "type", "city", "province", "licenseNo", "phone", "email", "website", "description"])
        w.writeheader()
        w.writerows(out_rows)

    print(f"Baris dibaca     : {n_total}")
    print(f"Baris valid      : {len(out_rows)}")
    print(f"Kota teridentifikasi   : {n_city}")
    print(f"Provinsi eksplisit     : {n_prov}")
    print(f"Telepon terbaca        : {n_phone}")
    print(f"Email ternormalisasi   : {n_email}")
    print(f"Keluaran: {OUT}")


if __name__ == "__main__":
    main()
