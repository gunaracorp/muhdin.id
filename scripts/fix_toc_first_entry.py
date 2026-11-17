# fix_toc_first_entry.py — hapus entri TOC duplikat di paragraf field (tanpa nomor halaman).
# Struktur field tetap valid: [begin][instrText TOC][separate] lalu 31 paragraf placeholder, [end].
import re
import shutil
import sys
import zipfile
import tempfile
import os

DOC = sys.argv[1] if len(sys.argv) > 1 else "/home/z/my-project/download/TUTORIAL-LENGKAP-Impor-CSV-MUHDIN.docx"

tmp = tempfile.mkdtemp()
with zipfile.ZipFile(DOC) as z:
    z.extractall(tmp)

doc_path = os.path.join(tmp, "word", "document.xml")
with open(doc_path, encoding="utf-8") as f:
    xml = f.read()

# Temukan paragraf TOC1 pertama yang memuat begin+instrText TOC+separate
m = re.search(
    r'(<w:p>(?:(?!</w:p>).)*?<w:instrText[^>]*>TOC[^<]*</w:instrText>(?:(?!</w:p>).)*?'
    r'<w:fldChar w:fldCharType="separate"/>(?:(?!</w:p>).)*?)</w:p>',
    xml, re.S,
)
if not m:
    print("Paragraf field TOC tidak ditemukan — tidak ada yang diubah.")
    sys.exit(0)

para = m.group(1)
para_clean, n = re.subn(r"<w:hyperlink.*?</w:hyperlink>", "", para, flags=re.S)
if n:
    xml = xml[: m.start(1)] + para_clean + xml[m.end(1):]
    print(f"Entri duplikat pertama dihapus ({n} blok hyperlink).")
else:
    print("Tidak ada hyperlink di paragraf field — struktur sudah bersih.")

with open(doc_path, "w", encoding="utf-8") as f:
    f.write(xml)

out_tmp = DOC + ".tmp"
with zipfile.ZipFile(out_tmp, "w", zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(tmp):
        for name in files:
            full = os.path.join(root, name)
            z.write(full, os.path.relpath(full, tmp))
shutil.move(out_tmp, DOC)
shutil.rmtree(tmp)
print("OK disimpan:", DOC)
