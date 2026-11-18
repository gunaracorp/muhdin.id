#!/usr/bin/env python3
"""
fix-toc-footers.py — pasca-proses docx:
  1. Footer seksi DAFTAR ISI  → field PAGE dengan switch \\* ROMAN
  2. Footer seksi ISI         → field PAGE dengan switch \\* arabic
  3. Hapus <w:pgNumType/> kosong (membingungkan WPS)
Seksi dihitung: 0=cover, 1=daftar isi, 2=isi.
Jalankan: python3 scripts/fix-toc-footers.py <file.docx>
"""
import re
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

path = Path(sys.argv[1])
tmp = Path(tempfile.mkdtemp())
with zipfile.ZipFile(path) as z:
    z.extractall(tmp)

doc_xml = (tmp / "word" / "document.xml").read_text(encoding="utf-8")
rels_xml = (tmp / "word" / "_rels" / "document.xml.rels").read_text(encoding="utf-8")

# rels: rId → target footer
rel_map = dict(re.findall(r'<Relationship[^>]*Id="([^"]+)"[^>]*Target="(footer\d+\.xml)"', rels_xml))
rel_map.update({m[0]: m[1] for m in re.findall(r'<Relationship[^>]*Target="(footer\d+\.xml)"[^>]*Id="([^"]+)"', rels_xml) and []})

# Ambil semua sectPr (paragraf tengah + body terakhir) sesuai urutan
sects = re.findall(r"<w:sectPr[ >].*?</w:sectPr>", doc_xml, re.S)
print(f"Seksi ditemukan: {len(sects)}")

def footer_ids(sect):
    return re.findall(r'<w:footerReference[^>]*r:id="([^"]+)"', sect)

# Seksi 1 (daftar isi) → ROMAN; seksi 2 (isi) → arabic
plan = {}
if len(sects) >= 3:
    for rid in footer_ids(sects[1]):
        plan.setdefault(rel_map.get(rid), "ROMAN")
    for rid in footer_ids(sects[2]):
        plan.setdefault(rel_map.get(rid), "arabic")
print("Rencana footer:", plan)

for fname, fmt in plan.items():
    if not fname:
        continue
    fpath = tmp / "word" / fname
    if not fpath.exists():
        continue
    xml = fpath.read_text(encoding="utf-8")
    xml2, n = re.subn(
        r"(<w:instrText[^>]*>)\s*PAGE\s*(</w:instrText>)",
        rf"\1 PAGE \\* {fmt} \\* MERGEFORMAT \2",
        xml,
    )
    if n:
        fpath.write_text(xml2, encoding="utf-8")
        print(f"  {fname}: {n} field PAGE → \\* {fmt}")

# Hapus pgNumType kosong
doc2, n2 = re.subn(r"<w:pgNumType/>", "", doc_xml)
if n2:
    (tmp / "word" / "document.xml").write_text(doc2, encoding="utf-8")
    print(f"pgNumType kosong dihapus: {n2}")

# Repack
out = path.with_suffix(".tmp.docx")
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for f in tmp.rglob("*"):
        if f.is_file():
            z.write(f, f.relative_to(tmp).as_posix())
shutil.move(out, path)
shutil.rmtree(tmp)
print("Selesai:", path)
