# verify_workbook.py — verifikasi semantik akhir workbook (nilai cache hasil recalc)
import sys
from openpyxl import load_workbook

F = "/home/z/my-project/download/Master_Penyelenggara_Haji_Umrah.xlsx"
wbd = load_workbook(F, data_only=True)
wbf = load_workbook(F)

fails = []

def check(name, actual, expected):
    ok = actual == expected
    if not ok:
        fails.append(f"{name}: actual={actual!r} expected={expected!r}")
    print(f"{'OK ' if ok else 'GAGAL'} {name}: {actual!r}")

# 1) Dashboard
d = wbd["Dashboard"]
expected_dash = {
    5: 13, 6: 2, 7: 1, 8: 1,          # total, PPIU, PIHK, Saudi provider
    9: 11, 10: 1, 11: 1, 12: 0, 13: 2, # izin aktif/kadaluarsa/dicabut/dibekukan/segera-habis
    14: 2, 15: 1, 16: 1, 17: 9,        # EKSTREM/TINGGI/SEDANG/RENDAH
    18: 27.8, 19: 72.2,                # rata-rata risk & kelayakan
    20: 5, 21: 5, 22: 1, 23: 2,        # whitelist
    27: 3, 28: 2, 29: 15,              # insiden belum selesai, relasi aktif, sumber
}
for r, exp in expected_dash.items():
    check(f"Dashboard C{r} ({d.cell(row=r, column=2).value})", d.cell(row=r, column=3).value, exp)
for r in (24, 25, 26):
    check(f"Dashboard C{r} ({d.cell(row=r, column=2).value})", d.cell(row=r, column=3).value, "0 / 30")

# 2) Review — semua PASS
rv = wbd["Review"]
for r in range(2, 10):
    check(f"Review D{r} ({rv.cell(row=r, column=1).value})", rv.cell(row=r, column=4).value, "PASS")

# 3) Master — skor risiko per baris (hitungan manual vs formula)
m = wbd["Master"]
exp_ax = [0, 18, 0, 5, 13, 35, 5, 0, 15, 15, 55, 100, 100]
exp_ay = ["RENDAH", "RENDAH", "RENDAH", "RENDAH", "RENDAH", "SEDANG", "RENDAH",
          "RENDAH", "RENDAH", "RENDAH", "TINGGI", "EKSTREM", "EKSTREM"]
exp_ao = ["OK", "SEGERA HABIS", "SEGERA HABIS", "OK", "OK", "KADALUARSA", "OK",
          "OK", "OK", "OK", "KADALUARSA", "KADALUARSA", "KADALUARSA"]
for i in range(13):
    r = 2 + i
    check(f"Master AX{r} risk_score ({m.cell(row=r, column=1).value})", m.cell(row=r, column=50).value, exp_ax[i])
    check(f"Master AY{r} risk_label", m.cell(row=r, column=51).value, exp_ay[i])
    check(f"Master AO{r} flag_izin", m.cell(row=r, column=41).value, exp_ao[i])
check("Master A15 kosong", m["A15"].value, None)
check("Master AY15 kosong (guard)", m["AY15"].value, None)

# 4) Fitur survive round-trip LibreOffice?
mf = wbf["Master"]
dv_master = len(mf.data_validations.dataValidation)
cf_master = len(mf.conditional_formatting)
print(f"INFO Master: {dv_master} data validation, {cf_master} conditional formatting range")
if dv_master < 5:
    fails.append(f"Data validation Master hilang: {dv_master} < 5")
if cf_master < 1:
    fails.append("Conditional formatting Master hilang")
# dropdown sheet lain
for sname, minimum in [("Checklist_PPIU_Umrah", 3), ("Checklist_PIHK_Haji_Khusus", 3),
                       ("Checklist_Provider_Saudi", 3), ("Mitra_RantaiPasok", 1),
                       ("Insiden_Keluhan", 4), ("Audit_Trail", 1)]:
    n = len(wbf[sname].data_validations.dataValidation)
    print(f"INFO {sname}: {n} data validation")
    if n < minimum:
        fails.append(f"DV {sname}: {n} < {minimum}")

# 5) Referensi: jumlah kolom list
rf = wbf["Referensi"]
n_ref = sum(1 for c in rf[1] if c.value)
check("Referensi jumlah daftar dropdown", n_ref, 20)

# 6) Format tanggal & teks
check("Format K2 (tanggal)", mf["K2"].number_format.lower().startswith("yy"), True)
check("Format G2 (teks NIB)", mf["G2"].number_format == "@", True)

print()
if fails:
    print(f"TOTAL GAGAL: {len(fails)}")
    for f_ in fails:
        print(" -", f_)
    sys.exit(1)
print("SEMUA VERIFIKASI SEMANTIK LULUS ✓")
