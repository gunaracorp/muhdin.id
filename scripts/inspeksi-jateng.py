"""Inspeksi posisi kolom PDF jateng (PIHK & PPIU) untuk menentukan batas kolom x."""
import pdfplumber

for path, label in [
    ("/tmp/panen25/jateng-pihk.pdf", "PIHK"),
    ("/tmp/panen25/jateng-ppiu.pdf", "PPIU"),
]:
    print(f"\n########## {label} ##########")
    with pdfplumber.open(path) as pdf:
        page = pdf.pages[0]
        words = page.extract_words(x_tolerance=1.5, y_tolerance=3)
        # kelompokkan per baris y
        rows = {}
        for w in words:
            key = round(w["top"] / 4)
            rows.setdefault(key, []).append(w)
        for key in sorted(rows)[:45]:
            ws = sorted(rows[key], key=lambda w: w["x0"])
            line = " | ".join(f"[{w['x0']:.0f}]{w['text']}" for w in ws)
            print(f"y~{key*4}: {line[:200]}")
