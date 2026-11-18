#!/usr/bin/env python3
"""
buat-paket-download.py — membungkus seluruh deliverable terbaru MUHDIN.id
menjadi SATU file ZIP terorganisir + manifest BACA-DULU.txt (bahasa Indonesia).
Jalankan: python3 scripts/buat-paket-download.py
"""
import pathlib
import zipfile

DL = pathlib.Path("/home/z/my-project/download")
OUT = DL / "MUHDIN-Paket-Lengkap-2026-11-08.zip"

# (folder_dalam_zip, [nama file di download/])
STRUKTUR = [
    ("1-TEMPLATE-IMPOR", [
        "Template-Master-PPIU-PIHK.xlsx",
        "Template-Impor-Anggota-PPIU-PIHK.csv",
        "Template-Impor-Registri-Izin.csv",
        "Template-Impor-Pendaftaran-Anggota.csv",
    ]),
    ("1-TEMPLATE-IMPOR/hasil-konverter-master", [
        "hasil-master/anggota-dari-master.csv",
        "hasil-master/registri-dari-master.csv",
    ]),
    ("2-TUTORIAL", [
        "TUTORIAL-LENGKAP-Impor-CSV-MUHDIN.pdf",
        "TUTORIAL-LENGKAP-Impor-CSV-MUHDIN.docx",
    ]),
    ("3-MATERI-MASTER", [
        "Master_Penyelenggara_Haji_Umrah.xlsx",
    ]),
    ("4-DOKUMEN-LAIN", [
        "Naskah-Demo-5-Menit-Presiden-MUHDIN.docx",
    ]),
    ("5-BUKTI-PENGEMBANGAN", sorted(
        p.name for p in DL.glob("*.png")
    )),
]

BACA = """\
============================================================
  PAKET LENGKAP MUHDIN.id — 8 November 2026
  Portal Digital Ekosistem Umrah & Haji Indonesia
============================================================

ISI PAKET & CARA PAKAI:

1-TEMPLATE-IMPOR/
   • Template-Master-PPIU-PIHK.xlsx
     <- MULAI DARI SINI. Buka di Excel/Google Sheets, ada 4 sheet:
        READ ME (petunjuk), Anggota, Registri Izin, Pendaftaran.
        Isi data PPIU/PIHK kamu di sheet yang sesuai.
   • Template-Impor-Anggota-PPIU-PIHK.csv   -> impor Direktori Anggota
   • Template-Impor-Registri-Izin.csv       -> impor Registri Izin (Compliance)
   • Template-Impor-Pendaftaran-Anggota.csv -> impor antrian Pendaftaran
   • hasil-konverter-master/  = contoh hasil konverter otomatis
     (dibuat dengan: python3 scripts/master-ke-csv.py)

2-TUTORIAL/
   • TUTORIAL-LENGKAP-Impor-CSV-MUHDIN.pdf  <- BACA INI (versi cetak)
   • TUTORIAL-LENGKAP-Impor-CSV-MUHDIN.docx (versi Word, bisa diedit)
     Isi 14 bab: persiapan sheet Master, mengisi CSV, menyimpan CSV
     dengan benar, langkah impor di CMS, membaca hasil, troubleshooting,
     sumber data resmi PPIU/PIHK, sampai peta kolom.

3-MATERI-MASTER/
   • Master_Penyelenggara_Haji_Umrah.xlsx
     Workbook referensi besar (regulasi, checklist, mitra, audit).

4-DOKUMEN-LAIN/
   • Naskah-Demo-5-Menit-Presiden-MUHDIN.docx

5-BUKTI-PENGEMBANGAN/
   • Tangkapan layar hasil pengembangan (verifikasi fitur v5-v7,
     checkout, compliance, roadmap 99, pindai Arofah, dll).

LANGKAH CEPAT IMPOR DATA (RINGKASAN):
   1) Isi sheet "Anggota" di Template-Master-PPIU-PIHK.xlsx
   2) File -> Download/Save As -> CSV UTF-8
   3) Buka website -> #/admin (admin@muhdin.web.id / muhdin2026)
   4) Modul Anggota -> tombol "Impor CSV" -> pilih file -> Impor Sekarang
   5) Lihat ringkasan: X baru, Y diperbarui, Z dilewati (+ alasannya)
   6) Cek hasil di portal #/anggota
   Impor file yang sama dua kali TIDAK membuat duplikat (otomatis update).

CATATAN KEAMANAN:
   Token GitHub yang pernah dikirim sebaiknya dicabut (revoke) di
   GitHub -> Settings -> Developer settings -> Personal access tokens.
============================================================
"""

def main() -> None:
    manifest = DL / "BACA-DULU-PAKET.txt"
    manifest.write_text(BACA, encoding="utf-8")

    if OUT.exists():
        OUT.unlink()

    total = 0
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        z.write(manifest, "BACA-DULU-PAKET.txt")
        for folder, files in STRUKTUR:
            for f in files:
                src = DL / f
                if not src.exists():
                    print(f"  ! lewati (tidak ada): {f}")
                    continue
                z.write(src, f"{folder}/{src.name}")
                total += 1
    manifest.unlink()

    size_mb = OUT.stat().st_size / 1_048_576
    print(f"ZIP  : {OUT.name}  ({size_mb:.1f} MB, {total} file + manifest)")
    # verifikasi integritas
    with zipfile.ZipFile(OUT) as z:
        bad = z.testzip()
        assert bad is None, f"korup: {bad}"
        print(f"Uji integritas: OK — {len(z.namelist())} entri di dalam ZIP")
        for n in z.namelist()[:8]:
            print("   ", n)
        print("    ... dst")

if __name__ == "__main__":
    main()
