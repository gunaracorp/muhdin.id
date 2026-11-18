# patch_docx_footers.py — post-processing sesuai toc.md:
# 1) hapus <w:pgNumType/> kosong (docx-js emit yang membingungkan WPS)
# 2) patch instrText footer: seksi daftar isi → PAGE \* ROMAN, seksi isi → PAGE \* arabic
#    Pemetaan file footer dilakukan lewat urutan sectPr di document.xml + rels.
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
rels_path = os.path.join(tmp, "word", "_rels", "document.xml.rels")
with open(doc_path, encoding="utf-8") as f:
    doc_xml = f.read()
with open(rels_path, encoding="utf-8") as f:
    rels_xml = f.read()

# 1) hapus pgNumType kosong
doc_xml, n_removed = re.subn(r"<w:pgNumType/>", "", doc_xml)

# 2) urutan footerReference sesuai kemunculan sectPr di dokumen
ref_ids = re.findall(r'<w:footerReference[^>]*r:id="([^"]+)"', doc_xml)
id_to_target = dict(re.findall(r'<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"', rels_xml))

seen, ordered = set(), []
for rid in ref_ids:
    tgt = id_to_target.get(rid, "")
    if tgt and tgt not in seen:
        seen.add(tgt)
        ordered.append(tgt)

formats = ["ROMAN"] + ["arabic"] * len(ordered)  # footer pertama = seksi Daftar Isi
for tgt, fmt in zip(ordered, formats):
    fpath = os.path.join(tmp, "word", os.path.basename(tgt))
    if not os.path.exists(fpath):
        continue
    with open(fpath, encoding="utf-8") as f:
        fx = f.read()
    fx, n = re.subn(
        r"(<w:instrText[^>]*>)\s*PAGE\s*(</w:instrText>)",
        rf"\1 PAGE \\* {fmt} \\* MERGEFORMAT \2",
        fx,
    )
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(fx)
    print(f"footer {os.path.basename(tgt)}: {n} field di-patch ke \\* {fmt}")

with open(doc_path, "w", encoding="utf-8") as f:
    f.write(doc_xml)

out_tmp = DOC + ".tmp"
with zipfile.ZipFile(out_tmp, "w", zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(tmp):
        for name in files:
            full = os.path.join(root, name)
            z.write(full, os.path.relpath(full, tmp))
shutil.move(out_tmp, DOC)
shutil.rmtree(tmp)
print(f"OK: pgNumType kosong dihapus={n_removed}, footer di-patch={len(ordered)}")
