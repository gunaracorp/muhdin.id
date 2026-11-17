#!/usr/bin/env python3
"""
test-import.py — Uji end-to-end API impor CSV MUHDIN (login → impor → verifikasi).
Menggunakan IP header X-Forwarded-For unik per panggilan agar tidak kena rate-limit lokal.
"""
import http.cookiejar
import json
import pathlib
import urllib.error
import urllib.request

BASE = "http://localhost:3000"
DL = pathlib.Path("/home/z/my-project/download")

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
_counter = {"n": 0}


def post(path, data):
    _counter["n"] += 1
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(data).encode(),
        headers={"Content-Type": "application/json", "X-Forwarded-For": f"10.7.0.{_counter['n']}"},
        method="POST",
    )
    try:
        with opener.open(req, timeout=60) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode() or "{}")
        except Exception:
            return e.code, {}


def imp(label, tipe, csv_text, expect=None):
    s, r = imp_raw(tipe, csv_text)
    tag = ""
    if expect and s == 200:
        got = (r.get("inserted"), r.get("updated"), r.get("skipped"))
        tag = " ✓ SESUAI" if got == expect else f" ✗ TIDAK SESUAI (harusnya {expect})"
    print(f"[{s}] {label}: {json.dumps(r, ensure_ascii=False)[:400]}{tag}")
    return s, r


def imp_raw(tipe, csv_text):
    return post("/api/import", {"type": tipe, "csv": csv_text})


def read(p):
    return pathlib.Path(p).read_text(encoding="utf-8-sig")


print("== 1) LOGIN ADMIN ==")
s, r = post("/api/auth/login", {"email": "admin@muhdin.web.id", "password": "muhdin2026"})
print(f"[{s}] login:", json.dumps(r, ensure_ascii=False)[:150])
assert s == 200, "Login gagal — tes dihentikan"

print()
print("== 2) IMPOR DIREKTORI ANGGOTA (template resmi, 4 baris) ==")
imp("Template Anggota (pertama)", "members", read(DL / "Template-Impor-Anggota-PPIU-PIHK.csv"), expect=(4, 0, 0))

print()
print("== 3) IMPOR DIREKTORI ANGGOTA (hasil konverter sheet Master, 3 baris) ==")
imp("Anggota dari Master", "members", read(DL / "hasil-master/anggota-dari-master.csv"), expect=(3, 0, 0))

print()
print("== 4) IMPOR ULANG YANG SAMA (harus UPDATE, bukan duplikat) ==")
imp("Template Anggota (ulang)", "members", read(DL / "Template-Impor-Anggota-PPIU-PIHK.csv"), expect=(0, 4, 0))

print()
print("== 5) IMPOR REGISTRI IZIN (template + sheet Master) ==")
imp("Template Registri", "registry", read(DL / "Template-Impor-Registri-Izin.csv"), expect=(3, 0, 0))
# Baris tanpa NIB (placeholder "-") kini ditolak importer & disaring konverter → 7 perusahaan valid.
imp("Registri dari Master", "registry", read(DL / "hasil-master/registri-dari-master.csv"), expect=(7, 0, 0))

print()
print("== 6) IMPOR PENDAFTARAN ANGGOTA (antrian verifikasi) ==")
imp("Template Pendaftaran", "applications", read(DL / "Template-Impor-Pendaftaran-Anggota.csv"), expect=(2, 0, 0))

print()
print("== 7) TES BARIS BERMASALAH (jenis tak dikenal + kota kosong) ==")
bad_csv = (
    "nama_resmi,jenis_entitas,nomor_izin_Kemenag,kota\n"
    "PT Baik Contoh Benar,PPIU,U-555/2026,Jakarta\n"
    "PT Contoh Maskapai Salah,Maskapai,AIR-1,Jakarta\n"
    "PT Contoh Tanpa Kota,PPIU,U-556/2026,\n"
)
imp("CSV jelek (1 lolos, 2 ditolak)", "members", bad_csv, expect=(1, 0, 2))

print()
print("== 8) VERIFIKASI API PUBLIK ==")
with urllib.request.urlopen(BASE + "/api/members?type=PIHK", timeout=30) as r:
    data = json.loads(r.read().decode())
names = [m["name"] for m in data if "Kaabah" in m["name"] or "Baitullah" in m["name"] or "Amanah" in m["name"]]
print(f"GET /api/members?type=PIHK → total {len(data)} PIHK; contoh baru: {names}")
with urllib.request.urlopen(BASE + "/api/members?type=PPIU", timeout=30) as r:
    data = json.loads(r.read().decode())
names = [m["name"] for m in data if "Barokah" in m["name"] or "Bakti" in m["name"]]
print(f"GET /api/members?type=PPIU → total {len(data)} PPIU; contoh baru: {names}")

print()
print("SELESAI — cek output di atas, lalu jalankan cleanup-test-import.py")
