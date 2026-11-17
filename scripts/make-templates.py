#!/usr/bin/env python3
"""
make-templates.py — membuat file template impor CSV + Excel untuk MUHDIN.id.
Output (di /home/z/my-project/download/):
  1. Template-Impor-Anggota-PPIU-PIHK.csv   → impor Direktori Anggota (tipe members)
  2. Template-Impor-Registri-Izin.csv       → impor Registri Izin/NIB (tipe registry, gaya kolom sheet Master)
  3. Template-Impor-Pendaftaran-Anggota.csv → impor antrian pendaftaran (tipe applications)
  4. Template-Master-PPIU-PIHK.xlsx         → versi Excel (READ ME + 3 sheet + dropdown validasi)
"""
import csv
import pathlib

OUT = pathlib.Path("/home/z/my-project/download")
OUT.mkdir(parents=True, exist_ok=True)

MEMBERS = [
    ["name", "type", "city", "province", "licenseNo", "phone", "email", "website", "description", "status", "memberSince", "rating"],
    ["PT Barokah Wisata Nusantara", "PPIU", "Jakarta Selatan", "DKI Jakarta", "PPIU 772/2026",
     "0812-3456-7890", "info@barokahwisata.id", "https://barokahwisata.id",
     "PPIU spesialis paket umrah keluarga dan grup korporat, berpengalaman sejak 2010.",
     "TERVERIFIKASI", "2024", "4.6"],
    ["CV Cahaya Madinah Travel", "PPIU", "Bandung", "Jawa Barat", "PPIU 815/2025",
     "0813-9988-1122", "cs@cahayamadinah.id", "https://cahayamadinah.id",
     "Biro umrah reguler 9-12 hari dengan pendamping muthowif bersertifikat.",
     "PENDING", "2025", "4.1"],
    ["PT Kaabah Tour Utama", "PIHK", "Surabaya", "Jawa Timur", "PIHK 045/2024",
     "0811-2233-4455", "office@kaabahtour.id", "https://kaabahtour.id",
     "PIHK penyelenggara haji khusus dengan rekening escrow bank dan mitra muassasah resmi.",
     "TERVERIFIKASI", "2023", "4.8"],
    ["Yayasan Baitullah Sejahtera", "PIHK", "Makassar", "Sulawesi Selatan", "PIHK 052/2025",
     "0821-5566-7788", "sekretariat@baitullahsejahtera.or.id", "https://baitullahsejahtera.or.id",
     "Lembaga haji khusus yang fokus melayani jamaah Indonesia bagian timur.",
     "TERVERIFIKASI", "2025", "4.4"],
]

REGISTRY = [
    ["NIB", "nama_resmi", "jenis_entitas", "nomor_badan_hukum", "NPWP", "nomor_izin_Kemenag",
     "masa_berlaku_izin", "status_izin", "alamat_pusat", "kota", "provinsi", "telepon_email_web", "catatan_risiko"],
    ["8120345678910", "PT Barokah Wisata Nusantara", "PPIU", "AHU-0034567.AH.01.01.TAHUN 2010",
     "01.234.567.8-901.000", "PPIU 772/2026", "2027-03-31", "Aktif",
     "Jl. Sultan Agung No. 45, Tebet", "Jakarta Selatan", "DKI Jakarta",
     "0812-3456-7890, info@barokahwisata.id, https://barokahwisata.id", "Tidak ada"],
    ["8120987654321", "CV Cahaya Madinah Travel", "PPIU", "AHU-0098211.AH.01.24.TAHUN 2018",
     "02.345.678.9-012.000", "PPIU 815/2025", "31/08/2026", "Aktif",
     "Jl. Asia Afrika No. 121, Sumur Bandung", "Bandung", "Jawa Barat",
     "0813-9988-1122, cs@cahayamadinah.id, https://cahayamadinah.id", "Dokumen akreditasi menunggu pembaruan"],
    ["8120555544443", "PT Kaabah Tour Utama", "PIHK", "AHU-0011223.AH.01.04.TAHUN 2015",
     "03.456.789.0-123.000", "PIHK 045/2024", "15-12-2026", "Aktif",
     "Jl. Raya Darmo Permai III No. 8, Sukomanunggal", "Surabaya", "Jawa Timur",
     "0811-2233-4455, office@kaabahtour.id, https://kaabahtour.id", "Tidak ada"],
]

APPLICATIONS = [
    ["orgName", "type", "contactName", "email", "phone", "city", "province", "licenseNo", "message"],
    ["PT Anugrah Tanah Suci", "PPIU", "H. Muhammad Ridwan", "ridwan@anugrahtanahsuci.id",
     "0812-7788-9900", "Semarang", "Jawa Tengah", "PPIU 833/2026",
     "Kami PPIU hasil spin-off, ingin bergabung menjadi anggota MUHDIN."],
    ["CV Salsabila Wisata Umrah", "PPIU", "Ibu Fatimah Zahra", "fatimah@salsabilawisata.id",
     "0857-1122-3344", "Padang", "Sumatera Barat", "PPIU 840/2026",
     "Biro umrah daerah, siap mengikuti proses verifikasi dan audit mutu."],
]

FILES = {
    "Template-Impor-Anggota-PPIU-PIHK.csv": MEMBERS,
    "Template-Impor-Registri-Izin.csv": REGISTRY,
    "Template-Impor-Pendaftaran-Anggota.csv": APPLICATIONS,
}

for fname, rows in FILES.items():
    path = OUT / fname
    with open(path, "w", newline="", encoding="utf-8-sig") as f:  # utf-8-sig = BOM agar Excel aman
        csv.writer(f).writerows(rows)
    print(f"OK  {path.name} ({len(rows) - 1} baris contoh)")

# ---------- versi Excel dengan dropdown validasi ----------
try:
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment
    from openpyxl.utils import get_column_letter
    from openpyxl.worksheet.datavalidation import DataValidation
except ImportError:
    print("openpyxl tidak tersedia — XLSX dilewati (CSV tetap jadi).")
    raise SystemExit(0)

HEAD_STYLE = Font(bold=True, color="FFFFFF", size=11)
HEAD_FILL = PatternFill("solid", fgColor="166E3B")  # hijau MUHDIN
WIDTHS = {
    "name": 34, "type": 10, "city": 18, "province": 18, "licenseNo": 16, "phone": 16,
    "email": 28, "website": 28, "description": 52, "status": 15, "memberSince": 13, "rating": 8,
    "NIB": 16, "nama_resmi": 34, "jenis_entitas": 13, "nomor_badan_hukum": 30, "NPWP": 20,
    "nomor_izin_Kemenag": 18, "masa_berlaku_izin": 17, "status_izin": 12, "alamat_pusat": 40,
    "kota": 18, "provinsi": 18, "telepon_email_web": 46, "catatan_risiko": 34,
    "orgName": 34, "contactName": 22,
    "message": 60,
}

wb = Workbook()

# --- Sheet READ ME ---
ws = wb.active
ws.title = "READ ME"
notes = [
    ["TEMPLATE MASTER — MUHDIN.id «SINERGI»", ""],
    ["", ""],
    ["Sheet 'Anggota'", "Data PPIU/PIHK untuk Direktori Anggota publik. Impor via CMS > Direktori Anggota > tombol 'Impor CSV'."],
    ["Sheet 'Registri Izin'", "Data NIB + izin Kemenag untuk modul kepatuhan. Impor via CMS > modul Compliance > tombol 'Impor CSV'."],
    ["Sheet 'Pendaftaran'", "Antrian pendaftaran anggota baru (perlu disetujui admin). Impor via CMS > Pendaftaran."],
    ["", ""],
    ["CARA PAKAI (ringkas)", "1) Isi baris data mulai baris ke-2.  2) Simpan sheet sebagai CSV: File > Save As > 'CSV UTF-8 (Comma delimited)'.  3) Impor file CSV itu di CMS."],
    ["PENTING", "Jangan mengubah baris header (baris ke-1). Kolom type hanya boleh: PPIU, PIHK, KBIHU, IPHI, TRAVEL_WISATA."],
    ["NAMA KOLOM", "Nama kolom Indonesia dari sheet Master juga dikenali sistem (nama_resmi, jenis_entitas, dst.) — tidak wajib sama persis."],
    ["UPDATE DATA", "Impor ulang dengan nomor izin / NIB yang sama akan MEMPERBARUI data, bukan menduplikasi."],
]
for r, (a, b) in enumerate(notes, 1):
    ws.cell(row=r, column=1, value=a).font = Font(bold=True, size=12 if r == 1 else 11)
    ws.cell(row=r, column=2, value=b).alignment = Alignment(wrap_text=True, vertical="top")
ws.column_dimensions["A"].width = 26
ws.column_dimensions["B"].width = 100


def make_sheet(title, header, rows, dropdowns=None):
    ws = wb.create_sheet(title)
    for c, h in enumerate(header, 1):
        cell = ws.cell(row=1, column=c, value=h)
        cell.font = HEAD_STYLE
        cell.fill = HEAD_FILL
        cell.alignment = Alignment(vertical="center", wrap_text=True)
    for r, row in enumerate(rows, 2):
        for c, v in enumerate(row, 1):
            ws.cell(row=r, column=c, value=v).alignment = Alignment(vertical="top", wrap_text=False)
    for c, h in enumerate(header, 1):
        ws.column_dimensions[get_column_letter(c)].width = WIDTHS.get(h, 18)
    ws.freeze_panes = "A2"
    ws.row_dimensions[1].height = 28
    if dropdowns:
        for col_letter, options in dropdowns.items():
            dv = DataValidation(type="list", formula1='"' + ",".join(options) + '"', allow_blank=True)
            dv.error = "Nilai harus salah satu dari daftar."
            dv.errorTitle = "Nilai tidak valid"
            ws.add_data_validation(dv)
            dv.add(f"{col_letter}2:{col_letter}500")
    return ws


make_sheet(
    "Anggota",
    MEMBERS[0], MEMBERS[1:],
    dropdowns={"B": ["PPIU", "PIHK", "KBIHU", "IPHI", "TRAVEL_WISATA"],
               "J": ["TERVERIFIKASI", "PENDING", "SUSPENDED"]},
)
make_sheet("Registri Izin", REGISTRY[0], REGISTRY[1:],
           dropdowns={"C": ["PPIU", "PIHK"], "H": ["Aktif", "Dalam Verifikasi", "Berakhir", "Dicabut"]})
make_sheet("Pendaftaran", APPLICATIONS[0], APPLICATIONS[1:],
           dropdowns={"B": ["PPIU", "PIHK", "KBIHU", "IPHI", "TRAVEL_WISATA"]})

xlsx = OUT / "Template-Master-PPIU-PIHK.xlsx"
wb.save(xlsx)
print(f"OK  {xlsx.name} (4 sheet: READ ME, Anggota, Registri Izin, Pendaftaran)")
