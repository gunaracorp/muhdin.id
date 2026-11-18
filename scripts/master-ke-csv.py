#!/usr/bin/env python3
"""
master-ke-csv.py — Konverter "Sheet Master" Excel → CSV siap impor MUHDIN.id.

Sumber : download/Master_Penyelenggara_Haji_Umrah.xlsx (sheet "Master")
Output : download/hasil-master/anggota-dari-master.csv   (untuk impor Direktori Anggota)
         download/hasil-master/registri-dari-master.csv  (untuk impor Registri Izin/compliance)

Kecerdasan bawaan:
  • Baris jenis PPIU/PIHK/KBIHU/IPHI/Travel Wisata → anggota-dari-master.csv
    (baris Maskapai/Hotel/Transport/dst. otomatis dilewati — bukan anggota direktori)
  • Semua baris → registri-dari-master.csv (kolom mengikuti sheet Master apa adanya)
  • Kolom gabungan telepon_email_web dipecah otomatis menjadi telepon / email / website
  • status_izin diterjemahkan: Aktif→TERVERIFIKASI, Dalam Verifikasi→PENDING,
    Dicabut/Nonaktif→SUSPENDED
  • Kota diambil otomatis dari bagian akhir alamat_pusat (format "Jl. X, Kota")
  • rating diturunkan dari kelayakan_score (skor/20, skala 1-5)
  • Tanggal apa pun formatnya (2027-03-31, 31/08/2026, sel Excel) otomatis dirapikan

Jalankan:
  python3 scripts/master-ke-csv.py                                # pakai file bawaan
  python3 scripts/master-ke-csv.py --xlsx "/path/ke/file.xlsx"    # file lain
"""
import argparse
import csv
import datetime
import pathlib
import re
import sys

try:
    from openpyxl import load_workbook
except ImportError:
    sys.exit("openpyxl belum terpasang. Jalankan: pip install openpyxl")

RE_EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
RE_WEB = re.compile(r"(?:https?://)?(?:www\.)?[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,24}(?:/[^\s,;]*)?", re.I)
RE_PHONE = re.compile(r"(?:\+?62|0)\d[\d\s\-().]{6,}")

PLACEHOLDER = re.compile(r"^(?:-+|--|–|—|n/?a|na|null|nil|kosong|tidak ada)$", re.I)

ANGGOTA_JENIS = {"PPIU": "PPIU", "PIHK": "PIHK", "KBIHU": "KBIHU", "IPHI": "IPHI",
                 "TRAVEL WISATA": "TRAVEL_WISATA", "TRAVEL_WISATA": "TRAVEL_WISATA"}


def norm(s):
    return re.sub(r"[^a-z0-9]", "", str(s or "").lower())


def split_contact(v):
    """Pecah '021-5550101;info@x.id;www.x.id' → (phone, email, website)."""
    rest = str(v or "")
    email = web = phone = ""
    m = RE_EMAIL.search(rest)
    if m:
        email = m.group(0)
        rest = rest.replace(email, " ")
    m = RE_WEB.search(rest)
    if m:
        web = m.group(0)
        rest = rest.replace(web, " ")
    m = RE_PHONE.search(rest)
    if m:
        phone = m.group(0).strip()
    return phone, email, web


def norm_status(v):
    s = str(v or "").lower().strip()
    if re.search(r"suspensi|suspend|tangguh|non\s*aktif|nonaktif|dicabut|beku|bermasalah|dihentikan", s):
        return "SUSPENDED"
    if re.search(r"terverifikasi|verified|aktif|active|disetujui|approved", s):
        return "TERVERIFIKASI"
    if re.search(r"pending|verifikasi|menunggu|proses|tinjau|review", s):
        return "PENDING"
    return "TERVERIFIKASI"


def fmt_date(v):
    """Tanggal apa pun → 'YYYY-MM-DD' (string kosong bila tidak dikenali)."""
    if isinstance(v, datetime.datetime):
        return v.strftime("%Y-%m-%d")
    if isinstance(v, datetime.date):
        return v.strftime("%Y-%m-%d")
    s = str(v or "").strip()
    if not s:
        return ""
    if re.fullmatch(r"\d{5}", s):  # nomor seri tanggal Excel
        base = datetime.date(1899, 12, 30)
        return (base + datetime.timedelta(days=int(s))).isoformat()
    m = re.match(r"^(\d{4})[-/](\d{1,2})[-/](\d{1,2})", s)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    m = re.match(r"^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})", s)
    if m:
        y = int(m.group(3))
        y = y + 2000 if y < 100 else y
        return f"{y}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"
    return s


def city_from_alamat(v):
    """Ambil bagian setelah koma terakhir dari alamat → kandidat kota."""
    s = str(v or "").strip().rstrip(".,;")
    if "," in s:
        tail = s.rsplit(",", 1)[1].strip()
        if 2 <= len(tail) <= 40 and not re.search(r"\d", tail):
            return tail
    return ""


def rating_from_score(v):
    try:
        score = float(str(v).replace(",", "."))
    except (TypeError, ValueError):
        return "4.5"
    if score <= 0:
        return "4.5"
    return f"{max(1.0, min(5.0, score / 20.0)):.1f}"


def main():
    ap = argparse.ArgumentParser(description="Konverter Sheet Master → CSV impor MUHDIN")
    ap.add_argument("--xlsx", default="/home/z/my-project/download/Master_Penyelenggara_Haji_Umrah.xlsx")
    ap.add_argument("--sheet", default="Master")
    ap.add_argument("--out-dir", default="/home/z/my-project/download/hasil-master")
    args = ap.parse_args()

    src = pathlib.Path(args.xlsx)
    if not src.exists():
        sys.exit(f"File tidak ditemukan: {src}")

    wb = load_workbook(src, read_only=False, data_only=True)
    sheet = args.sheet if args.sheet in wb.sheetnames else next(
        (s for s in wb.sheetnames if "master" in s.lower()), None)
    if not sheet:
        sys.exit(f"Sheet 'Master' tidak ditemukan. Sheet tersedia: {wb.sheetnames}")
    ws = wb[sheet]

    headers = [str(c.value or "").strip() for c in ws[1]]
    col = {norm(h): i for i, h in enumerate(headers) if h}

    def val(row, key, default=""):
        i = col.get(norm(key))
        if i is None or i >= len(row):
            return default
        v = row[i]
        s = "" if v is None else str(v).strip()
        return "" if PLACEHOLDER.fullmatch(s) else s

    anggota, registri, lewati, butuh_kota, tanpa_nib = [], [], [], [], []
    total = 0

    for row in ws.iter_rows(min_row=2, values_only=True):
        nama = val(row, "nama_resmi")
        if not nama:
            continue
        total += 1
        jenis_raw = val(row, "jenis_entitas")
        jenis = ANGGOTA_JENIS.get(jenis_raw.upper().replace("-", " ").strip())

        phone, email, web = split_contact(val(row, "telepon_email_web"))
        nib = val(row, "NIB")

        # ---- CSV registri (hanya baris bernomor NIB — kunci unik pembaruan) ----
        if nib:
            registri.append([
                nib, nama, jenis_raw, val(row, "nomor_badan_hukum"), val(row, "NPWP"),
                val(row, "nomor_izin_Kemenag"), fmt_date(val(row, "masa_berlaku_izin")),
                val(row, "status_izin"), val(row, "alamat_pusat"), "", "",
                val(row, "telepon_email_web"), val(row, "catatan_risiko"),
            ])
        else:
            tanpa_nib.append(f"{nama} (jenis '{jenis_raw}')")

        # ---- CSV anggota (hanya PPIU/PIHK/KBIHU/IPHI/Travel Wisata) ----
        if not jenis:
            lewati.append(f"{nama} (jenis '{jenis_raw}' bukan anggota direktori)")
            continue
        alamat = val(row, "alamat_pusat")
        kota = city_from_alamat(alamat)
        if not kota:
            butuh_kota.append(nama)
        deskripsi = " | ".join(x for x in [
            f"Alamat: {alamat}" if alamat else "",
            f"Wilayah layanan: {val(row, 'wilayah_layanan')}" if val(row, "wilayah_layanan") else "",
            f"Kontak PIC: {val(row, 'kontak_pic')}" if val(row, "kontak_pic") else "",
        ] if x)
        izin = val(row, "nomor_izin_Kemenag") or nib
        if not izin:
            lewati.append(f"{nama} (tidak punya nomor izin Kemenag maupun NIB)")
            continue
        thn = fmt_date(val(row, "tanggal_izin"))[:4]
        anggota.append([
            nama, jenis, kota, "", izin, phone, email, web, deskripsi,
            norm_status(val(row, "status_izin")),
            thn if thn.isdigit() else str(datetime.date.today().year),
            rating_from_score(val(row, "kelayakan_score")),
        ])

    out = pathlib.Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)

    p1 = out / "anggota-dari-master.csv"
    with open(p1, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["name", "type", "city", "province", "licenseNo", "phone", "email",
                    "website", "description", "status", "memberSince", "rating"])
        w.writerows(anggota)

    p2 = out / "registri-dari-master.csv"
    with open(p2, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["NIB", "nama_resmi", "jenis_entitas", "nomor_badan_hukum", "NPWP",
                    "nomor_izin_Kemenag", "masa_berlaku_izin", "status_izin", "alamat_pusat",
                    "kota", "provinsi", "telepon_email_web", "catatan_risiko"])
        w.writerows(registri)

    print(f"Sumber        : {src.name} — sheet '{sheet}'")
    print(f"Baris dibaca  : {total}")
    print(f"✅ {p1.name} : {len(anggota)} anggota (PPIU/PIHK/dll.)")
    print(f"✅ {p2.name} : {len(registri)} perusahaan registri izin")
    if lewati:
        print(f"⏭️  Dilewati dari anggota ({len(lewati)}):")
        for x in lewati:
            print(f"    - {x}")
    if tanpa_nib:
        print(f"⏭️  Tidak masuk CSV registri — NIB kosong/placeholder ({len(tanpa_nib)}):")
        for x in tanpa_nib:
            print(f"    - {x}")
    if butuh_kota:
        print(f"⚠️  Kota tidak terbaca dari alamat — isi manual kolom 'city' sebelum impor:")
        for x in butuh_kota:
            print(f"    - {x}")
    print()
    print("LANGKAH BERIKUTNYA:")
    print("  1) Buka CSV-nya, cek/isi kolom kota & provinsi bila masih kosong.")
    print("  2) CMS → Direktori Anggota → Impor CSV → pilih anggota-dari-master.csv")
    print("  3) CMS → modul Compliance → Impor CSV → pilih registri-dari-master.csv")


if __name__ == "__main__":
    main()
