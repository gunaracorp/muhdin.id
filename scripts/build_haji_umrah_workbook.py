# build_haji_umrah_workbook.py
#
# Generate workbook master ekosistem Penyelenggara Haji & Umrah.
# Lanjutan (dan penyelesaian) dari spesifikasi yang terpotong di
# set_date_format() sheet Master.
#
# Dependency: pip install openpyxl
# Run: python3 build_haji_umrah_workbook.py
#
# Output: /home/z/my-project/download/Master_Penyelenggara_Haji_Umrah.xlsx
# Sheets:
#   1. Master                      (40 kolom utama + 12 kolom risk otomatis)
#   2. Referensi                   (sumber semua dropdown)
#   3. Checklist_PPIU_Umrah        (30 item)
#   4. Checklist_PIHK_Haji_Khusus  (30 item)
#   5. Checklist_Provider_Saudi    (30 item)
#   6. Mitra_RantaiPasok
#   7. Insiden_Keluhan
#   8. Audit_Trail
#   9. Sumber_Resmi
#  10. Dashboard                   (metrik otomatis)
#  11. Review                      (self-check silang, tab amber)

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule
from openpyxl.utils import get_column_letter

from haji_wb_data import (
    MAX_ROW,
    OUTPUT_FILE,
    HEADER_FILL_HEX,
    ALL_MASTER_HEADERS,
    CHECKLIST_HEADERS,
    MITRA_HEADERS,
    INSIDEN_HEADERS,
    AUDIT_HEADERS,
    SUMBER_HEADERS,
    REFERENCE,
    CHECKLIST_PPIU_UMRAH_RAW,
    CHECKLIST_PIHK_HAJI_KHUSUS_RAW,
    CHECKLIST_PROVIDER_SAUDI_RAW,
    SUMBER_RESMI_ROWS,
    MASTER_SAMPLE,
    MITRA_SAMPLE,
    INSIDEN_SAMPLE,
    AUDIT_SAMPLE,
)

# ----------------------------------------------------------------------
# STYLE
# ----------------------------------------------------------------------
HEADER_FILL = PatternFill(start_color=HEADER_FILL_HEX, end_color=HEADER_FILL_HEX, fill_type="solid")
HEADER_FONT = Font(bold=True, color="FFFFFF")
HEADER_ALIGN = Alignment(horizontal="center", vertical="center", wrap_text=True)

RED_FILL = PatternFill(start_color="FFC7CE", end_color="FFC7CE", fill_type="solid")
ORANGE_FILL = PatternFill(start_color="FFEB9C", end_color="FFEB9C", fill_type="solid")
YELLOW_FILL = PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid")
GREEN_FILL = PatternFill(start_color="C6EFCE", end_color="C6EFCE", fill_type="solid")
GRAY_FILL = PatternFill(start_color="D9D9D9", end_color="D9D9D9", fill_type="solid")

# ----------------------------------------------------------------------
# HELPER FUNCTIONS
# ----------------------------------------------------------------------
def style_header(ws):
    for cell in ws[1]:
        cell.font = HEADER_FONT
        cell.fill = HEADER_FILL
        cell.alignment = HEADER_ALIGN
    ws.row_dimensions[1].height = 32
    ws.freeze_panes = "A2"


def set_column_widths(ws, headers, min_width=14, max_width=38):
    for idx, header in enumerate(headers, start=1):
        letter = get_column_letter(idx)
        width = max(min_width, min(max_width, len(header) + 4))
        ws.column_dimensions[letter].width = width


def set_text_format(ws, col_letter, first_row=2, last_row=MAX_ROW):
    for row in range(first_row, last_row + 1):
        ws[f"{col_letter}{row}"].number_format = "@"


def set_date_format(ws, col_letter, first_row=2, last_row=MAX_ROW):
    for row in range(first_row, last_row + 1):
        ws[f"{col_letter}{row}"].number_format = "yyyy-mm-dd"


def expand_checklist_rows(raw_rows):
    """
    raw_rows: (id, kategori, item, bukti, tingkat)
    return full checklist row with empty operational columns.
    """
    expanded = []
    for rid, kategori, item, bukti, tingkat in raw_rows:
        expanded.append((rid, kategori, item, bukti, tingkat, "Belum Dicek", "", "", "", ""))
    return expanded


# ----------------------------------------------------------------------
# FORMULA BUILDERS
# Formula disimpan dengan pemisah koma (format internal XLSX).
# Excel Indonesia akan menampilkannya dengan titik koma otomatis.
# Semua formula dibungkus guard IF($A{r}="","",...) supaya baris kosong
# tidak menghasilkan skor palsu dan tidak merusak COUNTIF Dashboard.
# ----------------------------------------------------------------------
def f_flag_izin(r):
    return (
        f'=IF($A{r}="","",'
        f'IF(AND(ISNUMBER(K{r}),K{r}<TODAY()),"KADALUARSA",'
        f'IF(AND(ISNUMBER(K{r}),K{r}<=TODAY()+90),"SEGERA HABIS","OK")))'
    )


def f_flag_dokumen(r):
    return f'=IF($A{r}="","",IF(OR(AN{r}="",AN{r}="-"),"KURANG","CEK"))'


def f_risk_izin(r):
    return (
        f'=IF($A{r}="","",'
        f'IF(L{r}="Dicabut",100,'
        f'MIN(25,'
        f'IF(L{r}="Aktif",0,'
        f'IF(L{r}="Dalam Verifikasi",10,'
        f'IF(L{r}="Kadaluarsa",20,'
        f'IF(L{r}="Dibekukan",25,15))))'
        f'+IF(AND(ISNUMBER(K{r}),K{r}<TODAY()),10,0))))'
    )


def f_risk_dokumen(r):
    return (
        f'=IF($A{r}="","",'
        f'IF(OR(AN{r}="",AN{r}="-"),15,'
        f'IF((LEN(AN{r})-LEN(SUBSTITUTE(AN{r},";",""))+1)>=3,0,'
        f'IF((LEN(AN{r})-LEN(SUBSTITUTE(AN{r},";",""))+1)=2,5,10))))'
    )


def f_risk_sanksi(r):
    return (
        f'=IF($A{r}="","",'
        f'IF(AE{r}="Tidak ada",0,'
        f'IF(AE{r}="-",10,'
        f'IF(ISNUMBER(SEARCH("pencabutan",AE{r})),25,'
        f'IF(ISNUMBER(SEARCH("beku",AE{r})),20,'
        f'IF(ISNUMBER(SEARCH("teguran",AE{r})),10,15))))))'
    )


def f_risk_keluhan(r):
    return (
        f'=IF($A{r}="","",'
        f'IF(AF{r}="Rendah",0,'
        f'IF(AF{r}="Sedang",8,'
        f'IF(AF{r}="Tinggi",15,'
        f'IF(AF{r}="Kritis",20,'
        f'IF(AF{r}="Tidak Diketahui",10,12))))))'
    )


def f_risk_mitra_saudi(r):
    return (
        f'=IF($A{r}="","",'
        f'IF(OR(D{r}="PPIU",D{r}="PIHK"),'
        f'IF(OR(R{r}="",R{r}="-"),12,0)+IF(OR(S{r}="",S{r}="-"),8,0),'
        f'IF(OR(D{r}="Penyedia Layanan Saudi",E{r}="Arab Saudi"),'
        f'IF(OR(S{r}="",S{r}="-"),15,0),0)))'
    )


def f_risk_asuransi(r):
    return f'=IF($A{r}="","",IF(OR(X{r}="",X{r}="-"),10,0))'


def f_risk_audit(r):
    return (
        f'=IF($A{r}="","",'
        f'IF(OR(AG{r}="",AG{r}="-"),15,'
        f'IF(ISNUMBER(AG{r}),'
        f'IF(AG{r}<TODAY()-730,15,'
        f'IF(AG{r}<TODAY()-365,10,0)),15)))'
    )


def f_risk_total(r):
    return f'=IF($A{r}="","",IF(AM{r}="STOP",100,MIN(100,SUM(AQ{r}:AW{r}))))'


def f_risk_label(r):
    return (
        f'=IF($A{r}="","",'
        f'IF(AX{r}>=60,"EKSTREM",'
        f'IF(AX{r}>=40,"TINGGI",'
        f'IF(AX{r}>=20,"SEDANG","RENDAH"))))'
    )


def f_kelayakan(r):
    return f'=IF($A{r}="","",100-AX{r})'


# ----------------------------------------------------------------------
# CREATE WORKBOOK
# ----------------------------------------------------------------------
wb = Workbook()
wb.remove(wb.active)

# ----------------------------------------------------------------------
# SHEET 1: MASTER (dibuat lebih dulu, dropdown mengikuti setelah Referensi)
# ----------------------------------------------------------------------
ws_master = wb.create_sheet("Master")
ws_master.append(ALL_MASTER_HEADERS)
style_header(ws_master)
set_column_widths(ws_master, ALL_MASTER_HEADERS)

# Data contoh (illustrative) — 13 entitas, semua level risiko terwakili.
# PENTING: data ditulis SEBELUM loop format (set_text_format/set_date_format
# menyentuh baris 2..MAX_ROW dan memajukan posisi append() di openpyxl).
for row in MASTER_SAMPLE:
    ws_master.append(row)

# Format teks untuk nomor legalitas (F,G,H,I) dan lisensi Saudi (S)
for col in ["F", "G", "H", "I", "S"]:
    set_text_format(ws_master, col, 2, MAX_ROW)

# Format tanggal: J tanggal_izin, K masa_berlaku_izin, AG audit_terakhir, AJ tanggal_update
for col in ["J", "K", "AG", "AJ"]:
    set_date_format(ws_master, col, 2, MAX_ROW)

# ----------------------------------------------------------------------
# SHEET 2: REFERENSI
# ----------------------------------------------------------------------
ws_ref = wb.create_sheet("Referensi")
ref_headers = list(REFERENCE.keys())
ws_ref.append(ref_headers)
style_header(ws_ref)
set_column_widths(ws_ref, ref_headers)

REF_COL = {}
REF_LAST = {}

for col_idx, (name, values) in enumerate(REFERENCE.items(), start=1):
    letter = get_column_letter(col_idx)
    REF_COL[name] = letter
    for row_idx, value in enumerate(values, start=2):
        ws_ref.cell(row=row_idx, column=col_idx, value=value)
    REF_LAST[name] = len(values) + 1


def add_dropdown(ws, col_letter, ref_name, last_row=MAX_ROW):
    ref_letter = REF_COL[ref_name]
    ref_last = REF_LAST[ref_name]
    dv = DataValidation(
        type="list",
        formula1=f"Referensi!${ref_letter}$2:${ref_letter}${ref_last}",
        allow_blank=True,
        showDropDown=False,
    )
    dv.error = "Pilih nilai dari daftar Referensi."
    dv.errorTitle = "Input tidak valid"
    ws.add_data_validation(dv)
    dv.add(f"{col_letter}2:{col_letter}{last_row}")


# Dropdown Master (setelah Referensi terisi)
add_dropdown(ws_master, "D", "jenis_entitas")
add_dropdown(ws_master, "E", "negara_yurisdiksi")
add_dropdown(ws_master, "L", "status_izin")
add_dropdown(ws_master, "AF", "level_keluhan")
add_dropdown(ws_master, "AM", "status_whitelist")

# ----------------------------------------------------------------------
# KOLUMN BANTU RISK SCORE (AO..AZ) — baris 2 sampai MAX_ROW
# ----------------------------------------------------------------------
for r in range(2, MAX_ROW + 1):
    ws_master[f"AO{r}"] = f_flag_izin(r)
    ws_master[f"AP{r}"] = f_flag_dokumen(r)
    ws_master[f"AQ{r}"] = f_risk_izin(r)
    ws_master[f"AR{r}"] = f_risk_dokumen(r)
    ws_master[f"AS{r}"] = f_risk_sanksi(r)
    ws_master[f"AT{r}"] = f_risk_keluhan(r)
    ws_master[f"AU{r}"] = f_risk_mitra_saudi(r)
    ws_master[f"AV{r}"] = f_risk_asuransi(r)
    ws_master[f"AW{r}"] = f_risk_audit(r)
    ws_master[f"AX{r}"] = f_risk_total(r)
    ws_master[f"AY{r}"] = f_risk_label(r)
    ws_master[f"AZ{r}"] = f_kelayakan(r)

# ----------------------------------------------------------------------
# CONDITIONAL FORMATTING RISIKO (kolom AY)
# ----------------------------------------------------------------------
rng_ay = f"AY2:AY{MAX_ROW}"
ws_master.conditional_formatting.add(
    rng_ay, FormulaRule(formula=['$AY2="EKSTREM"'], fill=RED_FILL, stopIfTrue=True)
)
ws_master.conditional_formatting.add(
    rng_ay, FormulaRule(formula=['$AY2="TINGGI"'], fill=ORANGE_FILL, stopIfTrue=True)
)
ws_master.conditional_formatting.add(
    rng_ay, FormulaRule(formula=['$AY2="SEDANG"'], fill=YELLOW_FILL, stopIfTrue=True)
)
ws_master.conditional_formatting.add(
    rng_ay, FormulaRule(formula=['$AY2="RENDAH"'], fill=GREEN_FILL, stopIfTrue=True)
)

# ----------------------------------------------------------------------
# SHEET 3-5: CHECKLIST KHUSUS
# ----------------------------------------------------------------------
CHECKLIST_SHEETS = [
    ("Checklist_PPIU_Umrah", CHECKLIST_PPIU_UMRAH_RAW),
    ("Checklist_PIHK_Haji_Khusus", CHECKLIST_PIHK_HAJI_KHUSUS_RAW),
    ("Checklist_Provider_Saudi", CHECKLIST_PROVIDER_SAUDI_RAW),
]

for sheet_name, raw_rows in CHECKLIST_SHEETS:
    ws = wb.create_sheet(sheet_name)
    ws.append(CHECKLIST_HEADERS)
    style_header(ws)
    set_column_widths(ws, CHECKLIST_HEADERS)
    for row in expand_checklist_rows(raw_rows):
        ws.append(row)
    set_date_format(ws, "H", 2, 40)  # tanggal_check
    add_dropdown(ws, "E", "tingkat", 40)
    add_dropdown(ws, "F", "status_check", 40)
    add_dropdown(ws, "J", "keputusan_check", 40)

# ----------------------------------------------------------------------
# SHEET 6: MITRA_RANTAI PASOK
# ----------------------------------------------------------------------
ws_mitra = wb.create_sheet("Mitra_RantaiPasok")
ws_mitra.append(MITRA_HEADERS)
style_header(ws_mitra)
set_column_widths(ws_mitra, MITRA_HEADERS)
for row in MITRA_SAMPLE:
    ws_mitra.append(row)
for col in ["P", "Q", "Y"]:  # tanggal_kontrak, berlaku_sampai, tanggal_update
    set_date_format(ws_mitra, col, 2, MAX_ROW)
for row in range(2, MAX_ROW + 1):
    ws_mitra[f"T{row}"].number_format = "#,##0"  # nilai_kontrak
add_dropdown(ws_mitra, "R", "status_relasi")

# ----------------------------------------------------------------------
# SHEET 7: INSIDEN_KELUHAN
# ----------------------------------------------------------------------
ws_insiden = wb.create_sheet("Insiden_Keluhan")
ws_insiden.append(INSIDEN_HEADERS)
style_header(ws_insiden)
set_column_widths(ws_insiden, INSIDEN_HEADERS)
for row in INSIDEN_SAMPLE:
    ws_insiden.append(row)
for col in ["B", "N", "O"]:  # tanggal_kejadian, tanggal_open, tanggal_close
    set_date_format(ws_insiden, col, 2, MAX_ROW)
add_dropdown(ws_insiden, "E", "jenis_insiden")
add_dropdown(ws_insiden, "F", "kategori_insiden")
add_dropdown(ws_insiden, "K", "prioritas_insiden")
add_dropdown(ws_insiden, "L", "status_resolusi")

# ----------------------------------------------------------------------
# SHEET 8: AUDIT_TRAIL
# ----------------------------------------------------------------------
ws_audit = wb.create_sheet("Audit_Trail")
ws_audit.append(AUDIT_HEADERS)
style_header(ws_audit)
set_column_widths(ws_audit, AUDIT_HEADERS)
for row in AUDIT_SAMPLE:
    ws_audit.append(row)
add_dropdown(ws_audit, "L", "status_audit")

# ----------------------------------------------------------------------
# SHEET 9: SUMBER_RESMI
# ----------------------------------------------------------------------
ws_sumber = wb.create_sheet("Sumber_Resmi")
ws_sumber.append(SUMBER_HEADERS)
style_header(ws_sumber)
set_column_widths(ws_sumber, SUMBER_HEADERS)
for row in SUMBER_RESMI_ROWS:
    ws_sumber.append(row)

# ----------------------------------------------------------------------
# SHEET 10: DASHBOARD
# ----------------------------------------------------------------------
ws_dash = wb.create_sheet("Dashboard")
ws_dash.sheet_view.showGridLines = False
ws_dash.column_dimensions["A"].width = 3
ws_dash.column_dimensions["B"].width = 44
ws_dash.column_dimensions["C"].width = 22
ws_dash.column_dimensions["D"].width = 48

ws_dash["B2"] = "DASHBOARD EKOSISTEM PENYELENGGARA HAJI & UMRAH"
ws_dash["B2"].font = Font(size=16, bold=True, color=HEADER_FILL_HEX)
ws_dash["B3"] = "Semua angka dihitung otomatis dari sheet Master, Checklist, Mitra_RantaiPasok, Insiden_Keluhan, dan Sumber_Resmi."
ws_dash["B3"].font = Font(size=9, italic=True, color="8C8A84")

for col_idx, header in enumerate(["Metrik", "Nilai", "Sumber Data"], start=2):
    cell = ws_dash.cell(row=4, column=col_idx, value=header)
    cell.font = HEADER_FONT
    cell.fill = HEADER_FILL
    cell.alignment = HEADER_ALIGN
ws_dash.row_dimensions[4].height = 28
ws_dash.freeze_panes = "B5"

AVERAGEIF_RISK = (
    f'=IFERROR(ROUND(AVERAGEIF(Master!$A$2:$A${MAX_ROW},"<>",'
    f'Master!$AX$2:$AX${MAX_ROW}),1),"-")'
)
AVERAGEIF_KELAYAKAN = (
    f'=IFERROR(ROUND(AVERAGEIF(Master!$A$2:$A${MAX_ROW},"<>",'
    f'Master!$AZ$2:$AZ${MAX_ROW}),1),"-")'
)

METRICS = [
    ("Total Entitas Tercatat", f"=COUNTA(Master!$A$2:$A${MAX_ROW})", "Master kolom id_entitas"),
    ("Jumlah PPIU", f'=COUNTIF(Master!$D$2:$D${MAX_ROW},"PPIU")', "Master kolom jenis_entitas"),
    ("Jumlah PIHK", f'=COUNTIF(Master!$D$2:$D${MAX_ROW},"PIHK")', "Master kolom jenis_entitas"),
    ("Penyedia Layanan Saudi", f'=COUNTIF(Master!$D$2:$D${MAX_ROW},"Penyedia Layanan Saudi")', "Master kolom jenis_entitas"),
    ("Izin Aktif", f'=COUNTIF(Master!$L$2:$L${MAX_ROW},"Aktif")', "Master kolom status_izin"),
    ("Izin Kadaluarsa", f'=COUNTIF(Master!$L$2:$L${MAX_ROW},"Kadaluarsa")', "Master kolom status_izin"),
    ("Izin Dicabut", f'=COUNTIF(Master!$L$2:$L${MAX_ROW},"Dicabut")', "Master kolom status_izin"),
    ("Izin Dibekukan", f'=COUNTIF(Master!$L$2:$L${MAX_ROW},"Dibekukan")', "Master kolom status_izin"),
    ("Izin Segera Habis (<= 90 hari)", f'=COUNTIF(Master!$AO$2:$AO${MAX_ROW},"SEGERA HABIS")', "Master kolom flag_izin"),
    ("Risk EKSTREM (60-100)", f'=COUNTIF(Master!$AY$2:$AY${MAX_ROW},"EKSTREM")', "Master kolom risk_label"),
    ("Risk TINGGI (40-59)", f'=COUNTIF(Master!$AY$2:$AY${MAX_ROW},"TINGGI")', "Master kolom risk_label"),
    ("Risk SEDANG (20-39)", f'=COUNTIF(Master!$AY$2:$AY${MAX_ROW},"SEDANG")', "Master kolom risk_label"),
    ("Risk RENDAH (0-19)", f'=COUNTIF(Master!$AY$2:$AY${MAX_ROW},"RENDAH")', "Master kolom risk_label"),
    ("Rata-rata Risk Score", AVERAGEIF_RISK, "Master kolom risk_score_total"),
    ("Rata-rata Kelayakan Score", AVERAGEIF_KELAYAKAN, "Master kolom kelayakan_score"),
    ("Whitelist REKOMENDASI", f'=COUNTIF(Master!$AM$2:$AM${MAX_ROW},"REKOMENDASI")', "Master kolom status_whitelist"),
    ("Whitelist VERIFIKASI", f'=COUNTIF(Master!$AM$2:$AM${MAX_ROW},"VERIFIKASI")', "Master kolom status_whitelist"),
    ("Whitelist HATI-HATI", f'=COUNTIF(Master!$AM$2:$AM${MAX_ROW},"HATI-HATI")', "Master kolom status_whitelist"),
    ("Whitelist STOP", f'=COUNTIF(Master!$AM$2:$AM${MAX_ROW},"STOP")', "Master kolom status_whitelist"),
    ("Checklist PPIU Umrah Lengkap", f'=COUNTIF(Checklist_PPIU_Umrah!$F$2:$F$31,"Lengkap")&" / 30"', "Sheet Checklist_PPIU_Umrah"),
    ("Checklist PIHK Haji Khusus Lengkap", f'=COUNTIF(Checklist_PIHK_Haji_Khusus!$F$2:$F$31,"Lengkap")&" / 30"', "Sheet Checklist_PIHK_Haji_Khusus"),
    ("Checklist Provider Saudi Lengkap", f'=COUNTIF(Checklist_Provider_Saudi!$F$2:$F$31,"Lengkap")&" / 30"', "Sheet Checklist_Provider_Saudi"),
    ("Insiden Belum Selesai", (
        f'=COUNTIF(Insiden_Keluhan!$L$2:$L${MAX_ROW},"Open")'
        f'+COUNTIF(Insiden_Keluhan!$L$2:$L${MAX_ROW},"In Progress")'
        f'+COUNTIF(Insiden_Keluhan!$L$2:$L${MAX_ROW},"Escalated")'
    ), "Sheet Insiden_Keluhan kolom status_resolusi"),
    ("Relasi Mitra Aktif", f'=COUNTIF(Mitra_RantaiPasok!$R$2:$R${MAX_ROW},"Aktif")', "Sheet Mitra_RantaiPasok kolom status_relasi"),
    ("Sumber Resmi Tercatat", "=COUNTA(Sumber_Resmi!$A$2:$A$100)", "Sheet Sumber_Resmi kolom kode_sumber"),
]

for i, (name, formula, source) in enumerate(METRICS):
    r = 5 + i
    ws_dash.cell(row=r, column=2, value=name)
    ws_dash.cell(row=r, column=3, value=formula).font = Font(bold=True)
    ws_dash.cell(row=r, column=4, value=source).font = Font(size=9, color="8C8A84")
    ws_dash.row_dimensions[r].height = 20

DASH_ROW = {name: 5 + i for i, (name, _, _) in enumerate(METRICS)}

# ----------------------------------------------------------------------
# SHEET 11: REVIEW (self-check silang — pipeline QA)
# ----------------------------------------------------------------------
ws_rev = wb.create_sheet("Review")
ws_rev.sheet_properties.tabColor = "FFC000"
ws_rev.sheet_view.showGridLines = False

REV_HEADERS = ["Check", "Expected", "Actual", "Status"]
for col_idx, header in enumerate(REV_HEADERS, start=1):
    cell = ws_rev.cell(row=1, column=col_idx, value=header)
    cell.font = HEADER_FONT
    cell.fill = HEADER_FILL
    cell.alignment = HEADER_ALIGN
ws_rev.row_dimensions[1].height = 28
ws_rev.freeze_panes = "A2"

total_formula = f"=COUNTA(Master!$A$2:$A${MAX_ROW})"
REV_CHECKS = [
    ("Total Entitas (Master vs Dashboard)", total_formula, f"=Dashboard!C{DASH_ROW['Total Entitas Tercatat']}"),
    ("Jumlah label risk = jumlah entitas", total_formula,
     f"=SUM(Dashboard!C{DASH_ROW['Risk EKSTREM (60-100)']}:C{DASH_ROW['Risk RENDAH (0-19)']})"),
    ("Jumlah status izin = jumlah entitas", total_formula,
     f"=SUM(Dashboard!C{DASH_ROW['Izin Aktif']}:C{DASH_ROW['Izin Dibekukan']})"),
    ("Jumlah whitelist = jumlah entitas", total_formula,
     f"=SUM(Dashboard!C{DASH_ROW['Whitelist REKOMENDASI']}:C{DASH_ROW['Whitelist STOP']})"),
    ("Item Checklist PPIU Umrah", 30, "=COUNTA(Checklist_PPIU_Umrah!$A$2:$A$31)"),
    ("Item Checklist PIHK Haji Khusus", 30, "=COUNTA(Checklist_PIHK_Haji_Khusus!$A$2:$A$31)"),
    ("Item Checklist Provider Saudi", 30, "=COUNTA(Checklist_Provider_Saudi!$A$2:$A$31)"),
    ("Sumber Resmi Tercatat", len(SUMBER_RESMI_ROWS), f"=Dashboard!C{DASH_ROW['Sumber Resmi Tercatat']}"),
]

for i, (name, expected, actual) in enumerate(REV_CHECKS):
    r = 2 + i
    ws_rev.cell(row=r, column=1, value=name)
    ws_rev.cell(row=r, column=2, value=expected)
    ws_rev.cell(row=r, column=3, value=actual)
    ws_rev.cell(row=r, column=4, value=f'=IF(B{r}=C{r},"PASS","FAIL")').font = Font(bold=True)
    ws_rev.row_dimensions[r].height = 20

for col_letter, width in [("A", 38), ("B", 16), ("C", 16), ("D", 10)]:
    ws_rev.column_dimensions[col_letter].width = width

# ----------------------------------------------------------------------
# FINALIZE
# ----------------------------------------------------------------------
wb.properties.creator = "Z.ai"
wb.calculation.fullCalcOnLoad = True  # Excel/LibreOffice menghitung ulang saat file dibuka

os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
wb.save(OUTPUT_FILE)

# ----------------------------------------------------------------------
# BUILD SUMMARY
# ----------------------------------------------------------------------
print(f"Saved: {OUTPUT_FILE}")
print(f"Sheets ({len(wb.sheetnames)}): {wb.sheetnames}")
master_formulas = sum(
    1 for row in ws_master.iter_rows(min_row=2, max_row=MAX_ROW, min_col=41, max_col=52)
    for c in row if isinstance(c.value, str) and c.value.startswith("=")
)
print(f"Master helper formulas (AO..AZ): {master_formulas}")
print(f"Dashboard metrics: {len(METRICS)}")
print(f"Review checks: {len(REV_CHECKS)}")
