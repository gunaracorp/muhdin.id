# check_formulas.py — jalankan build lalu sanity-check SEMUA formula di file hasil:
# keseimbangan tanda kurung, keseimbangan tanda kutip, dan tidak ada koma ganda.
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import build_haji_umrah_workbook  # noqa: F401 — import = build + save
from build_haji_umrah_workbook import OUTPUT_FILE

from openpyxl import load_workbook

wb = load_workbook(OUTPUT_FILE)
bad = []
n_formulas = 0
for ws in wb.worksheets:
    for row in ws.iter_rows():
        for c in row:
            v = c.value
            if isinstance(v, str) and v.startswith("="):
                n_formulas += 1
                body = v[1:]
                if body.count("(") != body.count(")"):
                    bad.append((ws.title, c.coordinate, "paren", v[:90]))
                if body.count('"') % 2 != 0:
                    bad.append((ws.title, c.coordinate, "quote", v[:90]))
                if ",," in body:
                    bad.append((ws.title, c.coordinate, "double-comma", v[:90]))

print(f"Total formula dicek: {n_formulas}")
if bad:
    print(f"MASALAH: {len(bad)} formula bermasalah:")
    for item in bad[:20]:
        print("  ", item)
    sys.exit(1)
print("SEMUA FORMULA SEIMBANG ✓")
