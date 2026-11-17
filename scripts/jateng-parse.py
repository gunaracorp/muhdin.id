"""Parser PDF resmi Kanwil Kemenag Jawa Tengah:
- DATA-PIHK-Pusat-Jateng-per-15-September-2025.pdf (53 PIHK)
- DATA-PPIU-Pusat-Jateng-per-15-September-2025.pdf (104 PPIU)
Sumber: SATU HAJI per 15 September 2025 (PDF publik di jateng.kemenag.go.id)

Output:
- /tmp/panen25/jateng-baru.csv        (entri BARU utk /api/import)
- /tmp/panen25/jateng-enrich.json     (entri yang cocok dgn DB, utk enrichment)
- statistik ke stdout
"""
import json
import re
import sqlite3
import unicodedata

import pdfplumber

DB_PATH = "/home/z/my-project/db/custom.db"
SUMBER = "Kanwil Kemenag Prov. Jawa Tengah, Daftar SATU HAJI per 15 September 2025 (PDF resmi jateng.kemenag.go.id)"

# batas kolom (x0 kata)
PIHK_COLS = {"no": (0, 45), "nama": (45, 235), "izin": (235, 340), "tgl": (340, 408), "alamat": (408, 9999)}
PPIU_COLS = {"no": (0, 45), "nama": (45, 230), "izin": (230, 355), "alamat": (355, 9999)}


def halaman_rows(page, cols):
    """Kembalikan list baris; tiap baris = dict kolom->teks, berurut top."""
    words = page.extract_words(x_tolerance=1.5, y_tolerance=3, keep_blank_chars=False)
    words.sort(key=lambda w: (w["top"], w["x0"]))
    rows = []  # list of {top, cols: {k: [words]}}
    for w in words:
        placed = False
        for r in reversed(rows):
            if abs(r["top"] - w["top"]) <= 3.5:
                for k, (x0, x1) in cols.items():
                    if x0 <= w["x0"] < x1:
                        r["cols"][k].append(w["text"])
                        r["cols"][k].sort(key=lambda t: 0)  # urutan append sudah x-sort
                placed = True
                break
        if not placed:
            r = {"top": w["top"], "cols": {k: [] for k in cols}}
            for k, (x0, x1) in cols.items():
                if x0 <= w["x0"] < x1:
                    r["cols"][k].append(w["text"])
            rows.append(r)
    for r in rows:
        for k in r["cols"]:
            r["cols"][k] = " ".join(r["cols"][k])
    return rows


def ekstrak_entri(path, cols, label):
    """Kumpulkan entri: anchor = kata angka di kolom 'no'. Baris di atas anchor pertama
    halaman = lanjutan entri terakhir."""
    entries = []
    carry = None  # dict kolom->list teks utk lanjutan entri terakhir
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            rows = halaman_rows(page, cols)
            anchors = [r for r in rows if re.fullmatch(r"\d{1,3}", (r["cols"]["no"] or "").strip())]
            if not anchors:
                if rows and entries:
                    first_top = rows[0]["top"]
                    for r in rows:
                        for k in ("nama", "izin", "tgl", "alamat"):
                            if r["cols"].get(k) and r["top"] < first_top + 20:
                                pass
                continue
            idx_anchors = {id(r): i for i, r in enumerate(anchors)}
            # baris sebelum anchor pertama = lanjutan entri terakhir
            top_first = anchors[0]["top"]
            if carry is not None and entries:
                for k in carry:
                    carry[k].append(rows[0]["cols"].get(k, "") if rows else "")
                carry = None  # sederhanakan: baris pertama di atas anchor dianggap lanjutan
            cur = None
            pend = {k: [] for k in ("nama", "izin", "tgl", "alamat")}  # baris pra-anchor pertama
            for r in rows:
                if id(r) in idx_anchors:
                    if cur is not None:
                        entries.append(cur)
                    cur = {
                        "no": int(r["cols"]["no"].strip()),
                        "nama": r["cols"].get("nama", ""),
                        "izin": r["cols"].get("izin", "") + " " + r["cols"].get("tgl", ""),
                        "alamat": r["cols"].get("alamat", ""),
                    }
                else:
                    if cur is None:
                        # baris di atas anchor pertama halaman -> lanjutan entri terakhir
                        for k in ("nama", "izin", "tgl", "alamat"):
                            v = r["cols"].get(k, "")
                            if v and entries:
                                entries[-1][k if k != "izin" else "izin"] += " " + v
                    else:
                        for k in ("nama", "izin", "tgl", "alamat"):
                            v = r["cols"].get(k, "")
                            if k == "tgl":
                                k = "izin"
                            if v:
                                cur[k] += " " + v
            if cur is not None:
                entries.append(cur)
    print(f"[{label}] entri mentah: {len(entries)}; nomor urut: {entries[0]['no']}..{entries[-1]['no']}")
    return entries


def bersih(s):
    s = unicodedata.normalize("NFKC", s or "")
    s = s.replace("\u2019", "'").replace("\u2018", "'")
    s = re.sub(r"\s+", " ", s).strip()
    return s


EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
KMA_RE = re.compile(r"KMA\s+(?:Nomor|NO\.?|No\.?)\s*:?\s*(\d+)\s*Tahun\s*(\d{4})", re.I)
NIB_RE = re.compile(r"NIB\s*:?\s*(\d{12,18})", re.I)
TEL_RE = re.compile(r"(\(0\d{1,3}\)[\d ,.;\-]+|0\d{9,13})")


def parse_entri(e, jenis):
    nama = bersih(e["nama"])
    alamat_raw = bersih(e["alamat"])
    izin_txt = bersih(e["izin"])

    m = KMA_RE.search(izin_txt)
    if m:
        license_no = f"KMA Nomor {m.group(1)} Tahun {m.group(2)}"
        jenis_izin = "KMA"
    else:
        m = NIB_RE.search(izin_txt)
        license_no = f"NIB {m.group(1)}" if m else ""
        jenis_izin = "NIB" if m else ""

    m_tgl = re.search(r"TGL\s*SK\s*:\s*([\d\-]{8,10})", izin_txt, re.I)
    if m_tgl:
        tgl = m_tgl.group(1)
    else:
        tgl_m = re.search(r"(\d{1,2}\s+\w+\s+\d{4})", izin_txt)
        tgl = bersih(tgl_m.group(1)).lstrip("'") if tgl_m else ""

    m_dir = re.search(r"DIREKTUR\s*:\s*(.+?)(?=NIB|TGL|$)", izin_txt, re.I)
    direktur = bersih(m_dir.group(1)) if m_dir else ""

    # telepon & email dari alamat
    tels = [t.strip(" ,.;") for t in TEL_RE.findall(alamat_raw)]
    tel_clean = []
    for t in tels:
        t2 = re.sub(r"[ ,.;\-]+$", "", t).strip()
        if t2 and t2 not in tel_clean and len(re.sub(r"\D", "", t2)) >= 9:
            tel_clean.append(t2)
    phone = ""
    if tel_clean:
        p = tel_clean[0]
        p = re.sub(r"^0", "+62", p)
        phone = re.sub(r"[ ]+", " ", p).strip()

    emails = EMAIL_RE.findall(alamat_raw)
    emails = [x.strip(".,").lower() for x in emails]
    emails = list(dict.fromkeys(emails))
    email = emails[0] if emails else ""

    # bersihkan alamat dari bagian telepon/email
    alamat = alamat_raw
    alamat = re.sub(r"(TELEPON|TELP|Telp|Telepon)\s*[:;.]\s*[\d ,.;()\-\+]+", " ", alamat, flags=re.I)
    alamat = re.sub(r"(EMAIL|Email)\s*[:;.]\s*\S*", " ", alamat, flags=re.I)
    for t in tels:
        alamat = alamat.replace(t, " ")
    alamat = re.sub(r"\s+", " ", alamat).strip(" ,.;-")

    # kota
    kota = ""
    m_k = re.search(r"Kab(?:upaten)?\.?\s+([A-Z][A-Za-z .]+?)(?=,|$|\s+Provinsi|\s+JAWA|\s+Jawa)", alamat, re.I)
    if m_k:
        kota = "Kab. " + bersih(m_k.group(1)).strip(" ,.")
    else:
        m_k = re.search(r"Kota\s+([A-Z][A-Za-z .]+?)(?=,|$|\s+Provinsi|\s+JAWA|\s+Jawa)", alamat, re.I)
        if m_k:
            kota = "Kota " + bersih(m_k.group(1)).strip(" ,.")
        elif re.search(r"Kabupaten", alamat, re.I) is None and re.search(r"Kota\b", alamat, re.I):
            kota = ""

    return {
        "name": nama,
        "type": jenis,
        "city": kota,
        "province": "Jawa Tengah",
        "licenseNo": license_no,
        "phone": phone,
        "email": email,
        "website": "",
        "alamat": alamat,
        "tgl": tgl,
        "direktur": direktur,
        "email_lain": emails[1:],
        "telp_lain": tel_clean[1:],
        "jenis_izin": jenis_izin,
        "no_urut": e["no"],
    }


def norm_nama(s):
    s = (s or "").lower()
    s = re.sub(r"^pt\.?\s*", "", s)
    s = re.sub(r"[^a-z0-9]", "", s)
    return s


def norm_izin(s):
    return re.sub(r"\D", "", s or "")


def main():
    pihk = ekstrak_entri("/tmp/panen25/jateng-pihk.pdf", PIHK_COLS, "PIHK")
    ppiu = ekstrak_entri("/tmp/panen25/jateng-ppiu.pdf", PPIU_COLS, "PPIU")

    hasil = [parse_entri(e, "PIHK") for e in pihk] + [parse_entri(e, "PPIU") for e in ppiu]

    # validasi nama kosong / izin kosong
    tanpa_nama = [h for h in hasil if not h["name"]]
    tanpa_izin = [h for h in hasil if not h["licenseNo"]]
    print(f"total: {len(hasil)}; tanpa nama: {len(tanpa_nama)}; tanpa izin: {len(tanpa_izin)}")

    # dedupe internal
    seen_nama, seen_izin = set(), set()
    unik = []
    for h in hasil:
        nn, nz = norm_nama(h["name"]), norm_izin(h["licenseNo"])
        if nn in seen_nama:
            print(f"  [dup nama internal] {h['name']} no.{h['no_urut']}")
            continue
        if nz and len(nz) >= 8 and nz in seen_izin:
            print(f"  [dup izin internal] {h['name']} ({h['licenseNo']})")
            continue
        seen_nama.add(nn)
        if nz:
            seen_izin.add(nz)
        unik.append(h)

    # dedupe vs DB
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    db_members = cur.execute("SELECT name, licenseNo, phone, email, city, province, type, description FROM Member").fetchall()
    con.close()
    db_nama = {norm_nama(r[0]): r for r in db_members if r[0]}
    db_izin = {norm_izin(r[1]): r for r in db_members if r[1]}

    baru, cocok = [], []
    for h in unik:
        nn, nz = norm_nama(h["name"]), norm_izin(h["licenseNo"])
        hit = db_nama.get(nn)
        if not hit and nz and len(nz) >= 8:
            hit = db_izin.get(nz)
        if hit:
            cocok.append({**h, "db_name": hit[0], "db_license": hit[1], "db_phone": hit[2] or "", "db_email": hit[3] or "", "db_city": hit[4] or "", "db_desc": hit[7] or ""})
        else:
            baru.append(h)

    print(f"\n=== HASIL ===")
    print(f"unik: {len(unik)} | BARU: {len(baru)} | cocok dgn DB: {len(cocok)}")

    # CSV baru
    import csv

    csv_path = "/tmp/panen25/jateng-baru.csv"
    with open(csv_path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["name", "type", "city", "province", "licenseNo", "phone", "email", "website", "description"])
        for h in baru:
            desc = []
            if h["tgl"]:
                desc.append(f"Tgl SK/NIB: {h['tgl']}")
            if h["direktur"]:
                desc.append(f"Direktur: {h['direktur']}")
            if h["telp_lain"]:
                desc.append("Telp lain: " + ", ".join(h["telp_lain"]))
            if h["email_lain"]:
                desc.append("Email lain: " + ", ".join(h["email_lain"]))
            desc.append(f"Sumber data: {SUMBER}")
            w.writerow([
                h["name"], h["type"], h["city"], h["province"], h["licenseNo"],
                h["phone"], h["email"], h["website"],
                (h["alamat"] + (" · " if h["alamat"] else "") + " · ".join(desc)).strip(" ·"),
            ])

    with open("/tmp/panen25/jateng-enrich.json", "w", encoding="utf-8") as f:
        json.dump(cocok, f, ensure_ascii=False, indent=1)

    # ringkasan
    print(f"\nBARU ({len(baru)}):")
    for h in baru:
        print(f"  [{h['type']}] {h['name']} | izin: {h['licenseNo'] or '-'} | {h['city']} | telp: {h['phone'] or '-'} | email: {h['email'] or '-'}")
    print(f"\nCOCOK ({len(cocok)}):")
    for h in cocok:
        print(f"  DB: {h['db_name']} ({h['db_license']}) <-> PDF: {h['name']} ({h['licenseNo']}) telp:{h['phone'] or '-'} email:{h['email'] or '-'}")


if __name__ == "__main__":
    main()
