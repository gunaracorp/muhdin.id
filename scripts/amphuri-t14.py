#!/usr/bin/env python3
"""Pulihkan 14 cocokan t3 yang tertinggal (vonis review: impor sebagai baru):
   semua enrich-v2 tahap-3 KECUALI PT MAKASSAR TORAJA (yang sudah jadi enrichment)."""
import re, json, csv

def bersih(s):
    return re.sub(r"\s+", " ", (s or "").replace("\\n", " ").replace("\n", " ")).strip()

def izin_valid(s):
    n = (s or "").strip().strip("'\"")
    return bool(re.search(r"\d", n)) and len(n) >= 3 and n != "-" and not re.match(r"^\d\.\d+E\+\d+$", n, re.I)

enrich = json.load(open("/tmp/panen26/enrich-v2.json"))
t3 = [e for e in enrich if e["tahap"] == 3 and e["amphuri"]["name"] != "PT MAKASSAR TORAJA"]
print("t3 yang dipulihkan:", len(t3))

SUMBER = "Sumber data: Direktori anggota resmi AMPHURI (amphuri.org/daftar-member, diakses 2026-11-09)"
with open("/tmp/panen26/kandidat-t14.csv", "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(["name", "type", "city", "province", "licenseNo", "phone", "email", "website", "description"])
    for e in t3:
        r = e["amphuri"]
        pihk = izin_valid(r["izin_pihk"])
        tipe = "PIHK" if pihk else "PPIU"
        izin = (r["izin_pihk"] if pihk else r["izin_ppiu"]).strip().strip("'\"")
        lain = ""
        if pihk and izin_valid(r["izin_ppiu"]):
            lain = f" · juga terdaftar sbg PPIU: {r['izin_ppiu'].strip().strip(chr(39))}"
        elif not pihk and izin_valid(r["izin_pihk"]):
            lain = f" · juga terdaftar sbg PIHK: {r['izin_pihk'].strip().strip(chr(39))}"
        parts = [f"Izin {tipe} resmi Kemenag RI ({izin})"]
        if r["alamat"]:
            parts.append(f"Alamat: {r['alamat']}")
        if r["leader"]:
            parts.append(f"Pimpinan: {r['leader']}")
        if r["member_no"]:
            dpd = f", DPD {r['dpd']}" if r["dpd"] else ""
            parts.append(f"Anggota AMPHURI No. {r['member_no']}{dpd}")
        w.writerow([r["name"] or r["nama_det"], tipe, r["city"], r["province"], izin, "", "", "",
                    " · ".join(parts) + lain + " · " + SUMBER])

csv_text = open("/tmp/panen26/kandidat-t14.csv", encoding="utf-8-sig").read()
json.dump({"type": "members", "csv": csv_text}, open("/tmp/payload-t14.json", "w"), ensure_ascii=False)
print("payload t14 siap")
import subprocess
print(subprocess.run(["cat", "/tmp/panen26/kandidat-t14.csv"], capture_output=True, text=True).stdout[:1200])
