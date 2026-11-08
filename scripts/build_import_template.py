# build_import_template.py — Template Impor CSV Anggota MUHDIN.id
#
# Output: /home/z/my-project/download/Template-Import-CSV-MUHDIN.xlsx
# Sheets:
#   1. MULAI DI SINI  (petunjuk singkat + alur 5 langkah)
#   2. Master         (template isi CSV-clean — header WAJIB di A1:K1 agar Save As CSV bersih)
#   3. REFERENSI      (nilai valid type & status)
#   4. PETA-KOLOM     (pemetaan workbook Master besar 52 kolom → 11 kolom CSV)
#
# Catatan desain: sheet Master sengaja MELANGGAR aturan "origin B2" karena fungsinya
# di-save sebagai CSV — baris 1 harus berisi header persis, tanpa judul/margin.
# Sheet lain mengikuti design system penuh (origin B2, borderless-first).

import sys, os, csv

SKILL_DIR = "/home/z/my-project/skills/xlsx"
for sub in [SKILL_DIR, os.path.join(SKILL_DIR, "templates")]:
    if sub not in sys.path:
        sys.path.insert(0, sub)

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.comments import Comment
from openpyxl.worksheet.datavalidation import DataValidation
from base import (  # design tokens & helpers dari skill xlsx
    FONT_NAME, HEADER_BOLD, PRIMARY, SECONDARY,
    ACCENT_POSITIVE, ACCENT_NEGATIVE, ACCENT_WARNING,
    NEUTRAL_900, NEUTRAL_600, NEUTRAL_100, NEUTRAL_0,
    font_title, font_header, font_subheader, font_body, font_caption,
    fill_header, fill_data_row, border_header,
    align_header, align_text, setup_sheet, style_header_row, style_data_row,
)

OUT_XLSX = "/home/z/my-project/download/Template-Import-CSV-MUHDIN.xlsx"
OUT_CSV = "/home/z/my-project/download/Template-Import-Anggota.csv"

CSV_HEADERS = ["name", "type", "city", "province", "licenseNo",
               "phone", "email", "website", "description", "status", "memberSince"]

CONTOH = [
    ["PT Contoh Wisata Barokah", "PPIU", "Jakarta Barat", "DKI Jakarta", "UU-123/2025",
     "021-5550101", "info@contohwisata.id", "https://contohwisata.id",
     "Contoh PPIU — ganti dengan data asli Anda.", "TERVERIFIKASI", 2025],
    ["PT Contoh Haji Khusus", "PIHK", "Surabaya", "Jawa Timur", "SK-456/Kemenag/2024",
     "031-5550202", "cs@contohhaji.id", "",
     "Contoh PIHK — ganti dengan data asli Anda.", "TERVERIFIKASI", 2024],
    ["Travel Contoh Nusantara", "TRAVEL_WISATA", "Yogyakarta", "DI Yogyakarta", "",
     "0274-5550303", "halo@contohnusantara.id", "",
     "Contoh tanpa nomor izin — importer otomatis mengisi tanda —.", "PENDING", 2026],
]

HEADER_COMMENTS = {
    "name": "WAJIB. Nama resmi perusahaan/organisasi.\nHarus unik — nama yang sudah ada di database akan DIPERBARUI (bukan diduplikasi).",
    "type": "WAJIB. Pilih dari dropdown:\nPPIU · PIHK · KBIHU · IPHI · TRAVEL_WISATA\nLihat sheet REFERENSI untuk artinya.",
    "city": "Kota domisili perusahaan.\nKosongkan → otomatis diisi 'Nasional'.",
    "province": "Provinsi.\nKosongkan → otomatis diisi 'Indonesia'.",
    "licenseNo": "Nomor izin Kemenag, contoh:\nUU-562/2025 atau SK-456/Kemenag/2024\nKosong → otomatis tanda '—'.",
    "phone": "Telepon/WA, contoh:\n021-5550101 atau 0812-3456-7890.",
    "email": "Email aktif, contoh:\ninfo@perusahaan.id",
    "website": "Alamat web lengkap, contoh:\nhttps://perusahaan.id",
    "description": "Deskripsi singkat 1-2 kalimat.\nBoleh berisi koma — akan dikutip otomatis saat disimpan sebagai CSV.",
    "status": "Pilih dari dropdown:\nTERVERIFIKASI (aktif, direkomendasikan)\nPENDING (menunggu verifikasi)\nSUSPENDED (dibekukan/diblokir)\nKosong → TERVERIFIKASI.",
    "memberSince": "Tahun anggota bergabung (4 digit), contoh: 2025.\nBoleh juga diisi tanggal — importernya mengambil tahunnya.\nKosong → 2026.",
}

wb = Workbook()

# ============================================================
# SHEET 1 — MULAI DI SINI
# ============================================================
ws0 = wb.active
ws0.title = "MULAI DI SINI"
ws0.sheet_properties.tabColor = PRIMARY
setup_sheet(ws0, title="Template Impor CSV — Database Anggota MUHDIN.id", last_col=6)
c = ws0.cell(row=3, column=2, value="Pendamping wajib: TUTORIAL-LENGKAP-Impor-CSV-MUHDIN.docx  ·  8 November 2026")
c.font = font_caption()
ws0.row_dimensions[3].height = 14

row = 5


def section(ws, r, text):
    cell = ws.cell(row=r, column=2, value=text)
    cell.font = Font(name=FONT_NAME, size=12, bold=HEADER_BOLD, color=PRIMARY)
    ws.row_dimensions[r].height = 24
    return r + 1


def table(ws, r, headers, rows, widths_hint=None):
    last_col = len(headers) + 1
    for j, h in enumerate(headers, start=2):
        ws.cell(row=r, column=j, value=h)
    style_header_row(ws, r, 2, last_col)
    r += 1
    for i, data in enumerate(rows):
        for j, v in enumerate(data, start=2):
            ws.cell(row=r, column=j, value=v)
        style_data_row(ws, r, 2, last_col, i)
        for j in range(2, last_col + 1):
            ws.cell(row=r, column=j).alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
        r += 1
    return r


row = section(ws0, row, "ALUR 5 LANGKAH (pemula → berhasil)")
row = table(ws0, row,
    ["Langkah", "Di mana", "Yang dilakukan"],
    [
        ["1. Isi data", "Sheet 'Master' file ini", "Hapus dulu 3 baris CONTOH (abu-abu miring), lalu isi data perusahaan Anda mulai baris 2. Ikuti komentar kecil (segitiga merah) di tiap judul kolom."],
        ["2. Simpan jadi CSV", "Excel → File → Save As", "Pilih lokasi folder proyek (mis. C:\\muhdin\\db), File type: 'CSV UTF-8 (Comma delimited)', nama bebas, mis. data-kamu.csv → Save → Yes/Keep."],
        ["3. Uji coba", "Terminal di folder proyek", "bun scripts/import-members.ts db/data-kamu.csv --dry-run   ← tanpa mengubah database; pastikan 'Dilewati: 0'."],
        ["4. Impor sungguhan", "Terminal yang sama", "bun scripts/import-members.ts db/data-kamu.csv   ← data masuk; aman dijalankan ulang (nama lama diperbarui, bukan diduplikasi)."],
        ["5. Cek hasil", "Portal & CMS", "Buka menu Anggota (#/anggota) untuk publik, atau #/admin → Direktori Anggota untuk kelola. Selesai!"],
    ])
row += 1

row = section(ws0, row, "PERINGATAN PENTING (baca dulu, sayang)")
warnings = [
    "JANGAN mengubah isi baris 1 sheet Master — itu header yang dibaca importer (name, type, …).",
    "HAPUS 3 baris CONTOH (abu-abu miring) sebelum menyimpan CSV, kecuali memang ingin data contoh ikut masuk.",
    "Kolom type hanya menerima 5 nilai (lihat sheet REFERENSI). Nilai lain dilewati importer dengan catatan.",
    "Kalau CSV dibuka di Excel dan semuanya menempel di 1 kolom — itu bukan rusak; lihat Bab 4 tutorial (jebakan pemisah ; vs ,).",
]
for i, wtext in enumerate(warnings):
    ws0.merge_cells(start_row=row, start_column=2, end_row=row, end_column=6)
    cell = ws0.cell(row=row, column=2, value="•  " + wtext)
    cell.font = Font(name=FONT_NAME, size=10, color=ACCENT_NEGATIVE if i == 1 else NEUTRAL_900)
    cell.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
    ws0.row_dimensions[row].height = 30
    row += 1
row += 1

row = section(ws0, row, "FILE TERKAIT")
row = table(ws0, row,
    ["File", "Fungsi"],
    [
        ["Template-Import-CSV-MUHDIN.xlsx", "File ini — tempat menulis data sebelum jadi CSV."],
        ["Template-Import-Anggota.csv", "Contoh CSV jadi — bisa dibuka pakai Notepad juga."],
        ["scripts/import-members.ts", "Program importer: CSV → database (perintah bun di Langkah 3-4)."],
        ["Master_Penyelenggara_Haji_Umrah.xlsx", "Workbook audit 52 kolom — sheet 'Master'-nya bisa langsung diimpor juga (lihat sheet PETA-KOLOM)."],
        ["TUTORIAL-LENGKAP-Impor-CSV-MUHDIN.docx", "Tutorial lengkap untuk pemula: tiap klik dijelaskan + tabel troubleshooting."],
    ])
row += 1

row = section(ws0, row, "ALTERNATIF: INPUT MANUAL LEWAT CMS")
cms_lines = [
    "Buka #/admin → login admin@muhdin.web.id / muhdin2026 (ganti sandi setelah produksi!).",
    "Sidebar → Direktori Anggota → tombol tambah/edit/hapus per baris — cocok untuk 1-10 data.",
    "Tombol 'Ekspor CSV' di halaman itu mengunduh seluruh anggota yang sudah ada — bisa diedit di Excel lalu diimpor ulang.",
]
for line in cms_lines:
    ws0.merge_cells(start_row=row, start_column=2, end_row=row, end_column=6)
    cell = ws0.cell(row=row, column=2, value="•  " + line)
    cell.font = font_body()
    cell.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
    ws0.row_dimensions[row].height = 22
    row += 1
row += 1
cap = ws0.cell(row=row, column=2, value="Dibuat otomatis untuk portal MUHDIN.id v12.5.0 «SINERGI» — database: db/custom.db")
cap.font = font_caption()

for col, w in {"B": 22, "C": 26, "D": 34, "E": 34, "F": 30}.items():
    ws0.column_dimensions[col].width = w

# ============================================================
# SHEET 2 — Master (CSV-clean; header WAJIB A1:K1)
# ============================================================
ws = wb.create_sheet("Master")
ws.sheet_properties.tabColor = ACCENT_POSITIVE
ws.sheet_view.showGridLines = True  # pengecualian fungsional: form isian lebih mudah dibaca

for j, h in enumerate(CSV_HEADERS, start=1):
    cell = ws.cell(row=1, column=j, value=h)
    cell.fill = fill_header()
    cell.font = font_header()
    cell.alignment = align_header()
    cell.border = border_header()
    cell.comment = Comment(HEADER_COMMENTS[h], "MUHDIN", height=150, width=320)
ws.row_dimensions[1].height = 30

CONTOH_FILL = PatternFill("solid", fgColor=NEUTRAL_100)
for i, data in enumerate(CONTOH):
    r = 2 + i
    for j, v in enumerate(data, start=1):
        cell = ws.cell(row=r, column=j, value=v)
        cell.font = Font(name=FONT_NAME, size=10, italic=True, color=NEUTRAL_600)
        cell.fill = CONTOH_FILL
        cell.alignment = Alignment(horizontal="left", vertical="center")
    ws.row_dimensions[r].height = 22

# Dropdown validasi (kolom B = type, kolom J = status), baris 2-300
dv_type = DataValidation(type="list", formula1='"PPIU,PIHK,KBIHU,IPHI,TRAVEL_WISATA"',
                         allow_blank=True, showErrorMessage=True)
dv_type.errorTitle = "Nilai type tidak valid"
dv_type.error = "Pilih salah satu: PPIU, PIHK, KBIHU, IPHI, atau TRAVEL_WISATA (lihat sheet REFERENSI)."
ws.add_data_validation(dv_type)
dv_type.add("B2:B300")

dv_status = DataValidation(type="list", formula1='"TERVERIFIKASI,PENDING,SUSPENDED"',
                           allow_blank=True, showErrorMessage=True)
dv_status.errorTitle = "Nilai status tidak valid"
dv_status.error = "Pilih salah satu: TERVERIFIKASI, PENDING, atau SUSPENDED."
ws.add_data_validation(dv_status)
dv_status.add("J2:J300")

widths = {"A": 28, "B": 16, "C": 16, "D": 16, "E": 20, "F": 16, "G": 24, "H": 24, "I": 42, "J": 17, "K": 13}
for col, w in widths.items():
    ws.column_dimensions[col].width = w
ws.freeze_panes = "A2"

# ============================================================
# SHEET 3 — REFERENSI
# ============================================================
wsr = wb.create_sheet("REFERENSI")
wsr.sheet_properties.tabColor = NEUTRAL_600
setup_sheet(wsr, title="REFERENSI — Nilai yang Valid", last_col=4)
r = 5
r = section(wsr, r, "JENIS MITRA — kolom type (WAJIB)")
r = table(wsr, r,
    ["Nilai", "Arti", "Contoh siapa"],
    [
        ["PPIU", "Penyelenggara Perjalanan Ibadah Umrah — punya izin umrah dari Kemenag RI", "PT X Wisata Umrah"],
        ["PIHK", "Penyelenggara Ibadah Haji Khusus — punya kuota haji khusus (SK Menag)", "PT Y Haji Khusus"],
        ["KBIHU", "Kelompok Binaan Ibadah Umrah — binaan PPIU, izin dari PPIU pembina", "KBIHU Z Jakarta"],
        ["IPHI", "Anggota Ikatan Penyelenggara Haji Indonesia", "IPHI cabang Semarang"],
        ["TRAVEL_WISATA", "Travel umum/wisata yang ikut ekosistem (belum wajib izin ibadah)", "Travel Nusantara"],
    ])
r += 1
r = section(wsr, r, "STATUS — kolom status")
r = table(wsr, r,
    ["Nilai", "Arti", "Efek di portal"],
    [
        ["TERVERIFIKASI", "Data terverifikasi, izin berlaku", "Tampil normal sebagai anggota aktif"],
        ["PENDING", "Menunggu verifikasi / verifikasi ulang", "Tampil dengan badge 'Menunggu'"],
        ["SUSPENDED", "Dibekukan / dicabut / diblokir regulator", "Tidak direkomendasikan; jangan bertransaksi"],
    ])
r += 1
r = section(wsr, r, "ATURAN FORMAT SINGKAT")
r = table(wsr, r,
    ["Kolom", "Format", "Contoh benar"],
    [
        ["name", "Nama resmi, unik (tidak boleh kembar persis)", "PT Amanah Bersama Tour dan Travel"],
        ["type", "Salah satu dari 5 nilai di atas (huruf apa saja, otomatis dibetulkan)", "travel wisata → TRAVEL_WISATA"],
        ["licenseNo", "Nomor izin sebagaimana tertulis di SK/pengumuman", "UU-562/2025 · SK-789/Kemenag/2024"],
        ["memberSince", "Tahun 4 digit (atau tanggal — tahunnya yang diambil)", "2025 · 'SK PPIU Mei 2025' → 2025"],
        ["email", "Format email standar", "info@perusahaan.id"],
        ["website", "Alamat lengkap dengan https://", "https://perusahaan.id"],
    ])
r += 1
cap = wsr.cell(row=r, column=2, value="Nilai type di luar daftar → baris dilewati importer (dicatat di layar). Status tak dikenal → TERVERIFIKASI + peringatan.")
cap.font = font_caption()
for col, w in {"B": 20, "C": 52, "D": 40}.items():
    wsr.column_dimensions[col].width = w

# ============================================================
# SHEET 4 — PETA-KOLOM
# ============================================================
wsp = wb.create_sheet("PETA-KOLOM")
wsp.sheet_properties.tabColor = ACCENT_WARNING
setup_sheet(wsp, title="PETA-KOLOM — dari Workbook Master Besar (52 kolom) ke CSV Impor (11 kolom)", last_col=6)
r = 5
r = table(wsp, r,
    ["Kolom di Master_Penyelenggara_Haji_Umrah.xlsx", "→ Kolom CSV", "Wajib?", "Aturan & normalisasi otomatis oleh importer", "Catatan"],
    [
        ["nama_resmi", "name", "WAJIB", "Ditulis apa adanya", "Nama yang sudah ada di database akan DIPERBARUI, bukan diduplikasi (idempoten)."],
        ["jenis_entitas", "type", "WAJIB", "Otomatis kapital; spasi jadi garis bawah", "Hanya PPIU / PIHK / KBIHU / IPHI / TRAVEL_WISATA yang diimpor; nilai lain (Maskapai, Hotel/Akomodasi, Asuransi, dll.) dilewati dengan catatan."],
        ["(tidak ada)", "city", "Ya (skema)", "Kosong → otomatis 'Nasional'", "Ambil dari alamat_pusat bila perlu."],
        ["(tidak ada)", "province", "Opsional", "Kosong → otomatis 'Indonesia'", "Boleh diisi dari wilayah_layanan."],
        ["nomor_izin_Kemenag", "licenseNo", "Opsional", "Ditulis apa adanya", "Kosong → otomatis tanda '—'."],
        ["telepon_email_web", "phone + email + website", "Opsional", "Dipilah otomatis: tautan → website, pola email → email, angka → telepon", "Bisa juga dipecah manual ke 3 kolom CSV."],
        ["status_izin / status_whitelist", "status", "Opsional", "Aktif & REKOMENDASI → TERVERIFIKASI · Dalam Verifikasi, VERIFIKASI, HATI-HATI → PENDING · Dibekukan, Dicabut, Kadaluarsa, STOP → SUSPENDED", "Kosong → TERVERIFIKASI; nilai asing → TERVERIFIKASI + peringatan di layar."],
        ["tanggal_izin (atau kolom 'tahun')", "memberSince", "Opsional", "Diambil angka tahun 4-digit pertamanya", "Contoh: 'SK PPIU Mei 2025' → 2025. Kosong → 2026."],
        ["alamat_pusat, cabang, kontak_pic, NIB, NPWP, mitra_Saudi, maskapai/hotel/transport/catering/asuransi/bank_partner, platform_tech, jumlah_petugas, kapasitas_tahunan, paket_layanan, range_harga, rekor_sanksi, keluhan_publik, audit_terakhir, sertifikasi_mutu, sumber_verifikasi, PIC_monitoring, catatan_risiko, dokumen_bukti, kolom risk_* …", "— (tidak diimpor)", "—", "Tetap tersimpan di workbook Master untuk audit internal", "Database portal hanya menampung 11 kolom CSV; poin penting bisa diringkas ke kolom description."],
    ])
r += 1
cap = wsp.cell(row=r, column=2, value="Header berbahasa Indonesia ini dikenali importer otomatis — sheet 'Master' workbook besar bisa langsung File → Save As CSV lalu diimpor tanpa mengganti nama kolom.")
cap.font = font_caption()
wsp.column_dimensions["B"].width = 44
wsp.column_dimensions["C"].width = 20
wsp.column_dimensions["D"].width = 12
wsp.column_dimensions["E"].width = 46
wsp.column_dimensions["F"].width = 40
for rr in range(6, 6 + 9):
    wsp.row_dimensions[rr].height = 44

wb.properties.creator = "Z.ai"
wb.save(OUT_XLSX)
print("OK →", OUT_XLSX)

# ============================================================
# CSV template (contoh 3 baris)
# ============================================================
with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(CSV_HEADERS)
    w.writerows(CONTOH)
print("OK →", OUT_CSV)
