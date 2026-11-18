#!/usr/bin/env python3
"""Parser AMPHURI v2: perbaiki badge inisial, izin via clean-text, matcher 3 tahap.
Tahap 1: norm_nama persis. Tahap 2: norm_izin. Tahap 3: token containment + provinsi.
Output: /tmp/panen26/kandidat-v2.csv, enrich-v2.json, review-t3.json, tanpa-izin.json"""
import re, json, csv, html as htmllib

def bersih(s):
    return htmllib.unescape(re.sub(r"\s+", " ", (s or "").replace("\\n", " ").replace("\n", " "))).strip()

def strip_tags(h):
    return re.sub(r"<[^>]+>", " ", h)

def norm_nama(s):
    s = (s or "").lower().replace("pt.", " ").replace("pt ", " ").replace("cv.", " ").replace("cv ", " ")
    return re.sub(r"[^a-z0-9]", "", s)

def norm_izin(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())

def izin_rapi(s):
    s = re.sub(r"\bTH\b\.?", "Tahun", s, flags=re.I)
    s = re.sub(r"\s+", " ", s).strip(" ,;")
    return s

def izin_valid(s):
    n = (s or "").strip()
    return bool(re.search(r"\d", n)) and len(n) >= 3 and n != "-"

STOP = {"pt", "cv", "tbk", "tour", "travel", "wisata", "haji", "umrah", "umroh", "and", "dan"}
def token_nama(s):
    return {t for t in re.split(r"[^a-z0-9]+", (s or "").lower()) if t and t not in STOP}

# ---------- tabel utama ----------
main = open("/tmp/amphuri-member.html").read()
rows_html = re.findall(r"<tr[^>]*>.*?</tr>", main, re.S)
tabel = []
for row in rows_html:
    cells = re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", row, re.S)
    if len(cells) < 9:
        continue
    no = bersih(re.sub(r"<[^>]+>", "", cells[0]))
    if not no.isdigit():
        continue
    durl = re.search(r'data-url="(/daftar-member/\d+/detail\?signature=[a-f0-9]+)"', row)
    tabel.append({
        "name": bersih(re.sub(r"<[^>]+>", "", cells[1])),
        "member_no": bersih(re.sub(r"<[^>]+>", "", cells[2])),
        "leader": bersih(re.sub(r"<[^>]+>", "", cells[3])),
        "city": bersih(re.sub(r"<[^>]+>", "", cells[5])),
        "province": bersih(re.sub(r"<[^>]+>", "", cells[6])),
        "dpd": bersih(re.sub(r"<[^>]+>", "", cells[7])),
        "detail_url": durl.group(1) if durl else "",
    })

urls = [l.strip() for l in open("/tmp/amphuri-detail-urls.txt") if l.strip()]
url2idx = {u: i for i, u in enumerate(urls)}

def parse_detail(idx):
    raw = open(f"/tmp/panen26/detail-{idx:04d}.json").read()
    try:
        d = json.loads(raw)
    except Exception:
        d = json.loads(json.loads('"' + raw + '"'))
    text = bersih(strip_tags(d.get("html", "")))
    segs = [s for s in text.split(" ") ]  # tidak dipakai; pakai split berikut
    # nama = teks sebelum alamat: ambil segmen via pemisah pola
    # gunakan pola: teks awal sampai "Jl."/"Jl "/"KP"/"Perum"/"Komplek"/Ds./Ds /Gg./Gg /Gang/Kec.
    mnama = re.match(r"^(.*?)(?=\s+(?:Jl\.?|Jalan|KP\.?|Perum|Komplek|Ds\.?|Gg\.?|Gang|Kec\.?|Kel\.?|Kota|Kab\.?|Kabupaten|Jl)\b|$)", text)
    nama_det = bersih(mnama.group(1)) if mnama else ""
    ppiu = re.search(r"PPIU License Number:\s*(.*?)(?=\s*PIHK License Number:|\s*Member Number:|$)", text)
    pihk = re.search(r"PIHK License Number:\s*(.*?)(?=\s*PPIU License Number:|\s*Member Number:|$)", text)
    mno = re.search(r"Member Number:\s*(.*?)(?=\s*PIHK License Number:|\s*PPIU License Number:|$)", text)
    # alamat = teks antara nama dan PPIU License
    malm = re.search(r"^(?:.*?)(?=\s*PPIU License Number:)", text)
    alamat = bersih(malm.group(0)) if malm else ""
    alamat = alamat[len(nama_det):].strip() if nama_det and alamat.startswith(nama_det) else alamat
    return {"nama_det": nama_det, "alamat": alamat,
            "izin_ppiu": izin_rapi(ppiu.group(1)) if ppiu else "",
            "izin_pihk": izin_rapi(pihk.group(1)) if pihk else "",
            "member_no": (mno.group(1).strip() if mno else "").replace("\\/", "/")}

data = []
for t in tabel:
    idx = url2idx.get(t["detail_url"], -1)
    d = parse_detail(idx) if idx >= 0 else {}
    rec = dict(t)
    rec.update({k: d.get(k, "") for k in ("nama_det", "alamat", "izin_ppiu", "izin_pihk", "member_no")})
    data.append(rec)

# ---------- validasi & pemisahan ----------
tanpa_izin = [r for r in data if not izin_valid(r["izin_ppiu"]) and not izin_valid(r["izin_pihk"])]
with_izin = [r for r in data if r not in tanpa_izin]
print(f"total {len(data)} | dengan izin valid {len(with_izin)} | tanpa izin {len(tanpa_izin)} (tidak diimpor)")

# ---------- dedupe internal ----------
seen, uni = set(), []
for r in with_izin:
    nn = norm_nama(r["name"] or r["nama_det"])
    if nn and nn in seen:
        continue
    if nn:
        seen.add(nn)
    uni.append(r)
print(f"setelah dedupe internal: {len(uni)}")

# ---------- matcher 3 tahap vs DB ----------
db = json.load(open("/tmp/panen26/db-members.json"))
db_nama, db_izin = {}, {}
db_token = {}
for m in db:
    nn = norm_nama(m["name"])
    if nn:
        db_nama[nn] = m
    ni = norm_izin(m["licenseNo"])
    if len(ni) >= 8:
        db_izin[ni] = m
    for tk in token_nama(m["name"]):
        db_token.setdefault(tk, set()).add(m["id"])
db_by_id = {m["id"]: m for m in db}

def cocok_prov(a, b):
    return (not a or not b or a.strip().lower() == b.strip().lower())

hasil = []  # (rec, db_member, tahap)
for r in uni:
    m = None; tahap = 0
    nn = norm_nama(r["name"] or r["nama_det"])
    if nn and nn in db_nama:
        m, tahap = db_nama[nn], 1
    if not m:
        for iz in (r["izin_pihk"], r["izin_ppiu"]):
            ni = norm_izin(iz)
            if len(ni) >= 8 and ni in db_izin:
                m, tahap = db_izin[ni], 2
                break
    if not m:
        toks = token_nama(r["name"] or r["nama_det"])
        kandidat_id = {}
        for tk in toks:
            for mid in db_token.get(tk, ()):
                kandidat_id[mid] = kandidat_id.get(mid, 0) + 1
        terbaik, skor_b = None, 0
        for mid, _ in kandidat_id.items():
            mm = db_by_id[mid]
            inter = toks & token_nama(mm["name"])
            if not inter:
                continue
            cont = len(inter) / min(len(toks), len(token_nama(mm["name"])))
            if cont >= 0.75 and cocok_prov(r["province"], mm["province"]) and cont > skor_b:
                terbaik, skor_b = mm, cont
        if terbaik:
            m, tahap = terbaik, 3
    hasil.append((r, m, tahap))

n1 = sum(1 for _, m, t in hasil if m and t == 1)
n2 = sum(1 for _, m, t in hasil if m and t == 2)
n3 = sum(1 for _, m, t in hasil if m and t == 3)
baru = [r for r, m, t in hasil if not m]
print(f"tahap1 persis: {n1} | tahap2 izin: {n2} | tahap3 token: {n3} | BARU: {len(baru)}")

# simpan review tahap 3 utk pemeriksaan manual
review3 = [{"amphuri": r["name"], "amphuri_izin": r["izin_pihk"] or r["izin_ppiu"],
            "provinsi": r["province"], "db": m["name"], "db_izin": m["licenseNo"],
            "db_type": m["type"]}
           for r, m, t in hasil if m and t == 3]
json.dump(review3, open("/tmp/panen26/review-t3.json", "w"), ensure_ascii=False, indent=1)
json.dump([{"amphuri": r["name"], "member_no": r["member_no"], "izin_ppiu": r["izin_ppiu"], "izin_pihk": r["izin_pihk"]}
           for r in tanpa_izin], open("/tmp/panen26/tanpa-izin.json", "w"), ensure_ascii=False, indent=1)

# ---------- CSV baru ----------
SUMBER = "Sumber data: Direktori anggota resmi AMPHURI (amphuri.org/daftar-member, diakses 2026-11-09)"
with open("/tmp/panen26/kandidat-v2.csv", "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(["name", "type", "city", "province", "licenseNo", "phone", "email", "website", "description"])
    for r in baru:
        pihk = izin_valid(r["izin_pihk"])
        tipe = "PIHK" if pihk else "PPIU"
        izin = r["izin_pihk"] if pihk else r["izin_ppiu"]
        lain = ""
        if pihk and izin_valid(r["izin_ppiu"]):
            lain = f" · juga terdaftar sbg PPIU: {r['izin_ppiu']}"
        elif not pihk and izin_valid(r["izin_pihk"]):
            lain = f" · juga terdaftar sbg PIHK: {r['izin_pihk']}"
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

json.dump([{"db_id": m["id"], "db_name": m["name"], "tahap": t, "amphuri": r}
           for r, m, t in hasil if m], open("/tmp/panen26/enrich-v2.json", "w"), ensure_ascii=False, indent=1)
print("kandidat-v2.csv, enrich-v2.json, review-t3.json, tanpa-izin.json tersimpan")
