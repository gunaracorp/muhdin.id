#!/usr/bin/env python3
"""Parser panen AMPHURI: tabel utama + 779 detail -> kandidat baru + enrichment.
Output: /tmp/panen26/kandidat.csv (baru), /tmp/panen26/enrich.json, statistik."""
import re, json, csv, html as htmllib

def norm_nama(s):
    s = (s or "").lower().replace("pt.", " ").replace("pt ", " ").replace("cv.", " ").replace("cv ", " ")
    return re.sub(r"[^a-z0-9]", "", s)

def norm_izin(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())

def bersih(s):
    return htmllib.unescape(re.sub(r"\s+", " ", (s or "").replace("\n", " "))).strip()

def izin_rapi(s):
    s = bersih(s)
    s = re.sub(r"\bTH\b\.?", "Tahun", s, flags=re.I)
    s = re.sub(r"\bTH\b\.?", "Tahun", s)  # case-sensitive kedua utk "th"
    s = re.sub(r"\bTAHUN\b", "Tahun", s, flags=re.I)
    s = re.sub(r"\s+", " ", s)
    return s

# ---------- 1. parse tabel utama ----------
main = open("/tmp/amphuri-member.html").read()
rows_html = re.findall(r"<tr[^>]*>.*?</tr>", main, re.S)
tabel = []
for row in rows_html:
    cells = re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", row, re.S)
    if len(cells) < 9:
        continue
    no = bersih(re.sub(r"<[^>]+>", "", cells[0]))
    if not no.isdigit():
        continue  # header
    durl = re.search(r'data-url="(/daftar-member/\d+/detail\?signature=[a-f0-9]+)"', row)
    tabel.append({
        "no": int(no),
        "name": bersih(re.sub(r"<[^>]+>", "", cells[1])),
        "member_no": bersih(re.sub(r"<[^>]+>", "", cells[2])),
        "leader": bersih(re.sub(r"<[^>]+>", "", cells[3])),
        "license_col": bersih(re.sub(r"<[^>]+>", "", cells[4])),
        "city": bersih(re.sub(r"<[^>]+>", "", cells[5])),
        "province": bersih(re.sub(r"<[^>]+>", "", cells[6])),
        "dpd": bersih(re.sub(r"<[^>]+>", "", cells[7])),
        "detail_url": durl.group(1) if durl else "",
    })
print(f"tabel utama: {len(tabel)} baris")

# petakan detail url -> index file (urutan sama dgn urls file)
urls = [l.strip() for l in open("/tmp/amphuri-detail-urls.txt") if l.strip()]
url2idx = {u: i for i, u in enumerate(urls)}

# ---------- 2. parse detail ----------
def parse_detail(idx):
    raw = open(f"/tmp/panen26/detail-{idx:04d}.json").read()
    try:
        d = json.loads(raw)
    except Exception:
        d = json.loads(json.loads('"' + raw + '"'))
    h = d.get("html", "")
    text = re.sub(r"<[^>]+>", "|", h)
    segs = [bersih(s) for s in text.split("|") if bersih(s)]
    # nama = segmen pertama
    name = segs[0] if segs else ""
    # alamat = segmen setelah nama yang bukan "License"/"Member Number"
    alamat = ""
    for s in segs[1:]:
        if re.match(r"(PPIU|PIHK) License", s) or s.startswith("Member Number"):
            break
        alamat = s
        break
    ppiu = re.search(r"PPIU License Number:\s*(.+?)(?:<|$|\\n)", h)
    pihk = re.search(r"PIHK License Number:\s*(.+?)(?:<|$|\\n)", h)
    mno = re.search(r"Member Number:\s*(.+?)(?:<|$|\\n)", h)
    # jika regex di atas kena tag, bersihkan
    def cl(m):
        return bersih(re.sub(r"<[^>]+>", "", m.group(1))) if m else ""
    return {"name": name, "alamat": alamat,
            "izin_ppiu": izin_rapi(cl(ppiu)), "izin_pihk": izin_rapi(cl(pihk)),
            "member_no": bersih(cl(mno)).replace("\\/", "/")}

data = []
for t in tabel:
    idx = url2idx.get(t["detail_url"], -1)
    d = parse_detail(idx) if idx >= 0 else {}
    rec = {**t, **{k: d.get(k, "") for k in ("alamat", "izin_ppiu", "izin_pihk", "member_no")}}
    data.append(rec)

print(f"digabung: {len(data)}; detail nyambung: {sum(1 for r in data if r['izin_ppiu'] or r['izin_pihk'])}")

# ---------- 3. validasi & tipe ----------
def izin_valid(s):
    n = (s or "").strip()
    return bool(re.search(r"\d", n)) and len(n) >= 3

stat = {"tanpa_izin": 0, "tanpa_alamat": 0}
for r in data:
    r["izin_ppiu_v"] = izin_valid(r["izin_ppiu"])
    r["izin_pihk_v"] = izin_valid(r["izin_pihk"])
    if not r["izin_ppiu_v"] and not r["izin_pihk_v"]:
        stat["tanpa_izin"] += 1
    if not r["alamat"]:
        stat["tanpa_alamat"] += 1
print("stat validasi:", stat)

# ---------- 4. dedupe internal ----------
seen_nama, bersih_data, dup_internal = {}, [], 0
for r in data:
    nn = norm_nama(r["name"])
    if nn and nn in seen_nama:
        dup_internal += 1
        continue
    if nn:
        seen_nama[nn] = r
    bersih_data.append(r)
print(f"dup internal (nama): {dup_internal} -> sisa {len(bersih_data)}")

# ---------- 5. dedupe vs DB ----------
db = json.load(open("/tmp/panen26/db-members.json"))
db_nama = {}
db_izin = {}
for m in db:
    nn = norm_nama(m["name"])
    if nn:
        db_nama[nn] = m
    ni = norm_izin(m["licenseNo"])
    if len(ni) >= 8:
        db_izin[ni] = m

baru, enrich = [], []
for r in bersih_data:
    nn = norm_nama(r["name"])
    m = db_nama.get(nn)
    if not m:
        # coba cocok izin
        for iz in (r["izin_pihk"], r["izin_ppiu"]):
            ni = norm_izin(iz)
            if len(ni) >= 8 and ni in db_izin:
                m = db_izin[ni]
                break
    if m:
        enrich.append({"db_id": m["id"], "db_name": m["name"], "amphuri": r})
    else:
        baru.append(r)

print(f"vs DB 735: BARU={len(baru)}, SUDAH ADA (enrich)={len(enrich)}")

# ---------- 6. bangun CSV ----------
SUMBER = "Sumber data: Direktori anggota resmi AMPHURI (amphuri.org/daftar-member, diakses 2026-11-09)"
with open("/tmp/panen26/kandidat.csv", "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(["name", "type", "city", "province", "licenseNo", "phone", "email", "website", "description"])
    for r in baru:
        pihk = r["izin_pihk_v"]
        tipe = "PIHK" if pihk else "PPIU"
        izin = r["izin_pihk"] if pihk else r["izin_ppiu"]
        lain = (f" · juga terdaftar sbg PPIU: {r['izin_ppiu']}" if pihk and r["izin_ppiu_v"]
                else (f" · juga terdaftar sbg PIHK: {r['izin_pihk']}" if not pihk and r["izin_pihk_v"] else ""))
        desc_parts = []
        if r["izin_ppiu_v"] or r["izin_pihk_v"]:
            desc_parts.append(f"Izin {tipe} resmi Kemenag RI ({izin})")
        if r["alamat"]:
            desc_parts.append(f"Alamat: {r['alamat']}")
        if r["leader"]:
            desc_parts.append(f"Pimpinan: {r['leader']}")
        if r["member_no"]:
            dpd = f", DPD {r['dpd']}" if r["dpd"] else ""
            desc_parts.append(f"Anggota AMPHURI No. {r['member_no']}{dpd}")
        desc = " · ".join(desc_parts) + lain + " · " + SUMBER
        w.writerow([r["name"], tipe, r["city"], r["province"], izin, "", "", "", desc])

json.dump(enrich, open("/tmp/panen26/enrich.json", "w"), ensure_ascii=False, indent=1)
print("kandidat.csv & enrich.json tersimpan")

# preview
print("\n--- CONTOH 5 BARIS BARU ---")
for r in baru[:5]:
    tipe = "PIHK" if r["izin_pihk_v"] else "PPIU"
    izin = r["izin_pihk"] if tipe == "PIHK" else r["izin_ppiu"]
    print(f"{r['name']} | {tipe} | {izin} | {r['city']}, {r['province']}")
