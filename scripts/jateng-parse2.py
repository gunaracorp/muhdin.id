"""Parser v2 PDF resmi Kanwil Kemenag Jawa Tengah (SATU HAJI per 15 September 2025).

Pendekatan: semua kata semua halaman jadi satu aliran global (top_abs = hal*10000 + top).
Anchor entri = kata angka di kolom NO (x<45) yang berurutan 1,2,3...
Entri N mengambil kata dengan top_abs di [anchor_N - 22, anchor_{N+1} - 15)
(konten PDF selalu dimulai ±4..20pt DI ATAS angka NO-nya).
"""
import csv
import json
import re
import sqlite3
import unicodedata

import pdfplumber

DB_PATH = "/home/z/my-project/db/custom.db"
SUMBER = "Kanwil Kemenag Prov. Jawa Tengah, Daftar SATU HAJI per 15 September 2025 (PDF resmi jateng.kemenag.go.id)"

PIHK_COLS = {"no": (0, 45), "nama": (45, 235), "izin": (235, 337), "tgl": (337, 408), "alamat": (408, 9999)}
PPIU_COLS = {"no": (0, 45), "nama": (45, 230), "izin": (230, 355), "alamat": (355, 9999)}

# kata-kata header tabel yang muncul tiap halaman (top < 70) — dibuang agar tak tercampur
HEADER_WORDS = {"NO", "NAMA", "PIHK", "PPIU", "LOGO", "NOMOR", "SK", "TANGGAL", "ALAMAT", "KONTAK", "&", "IJIN"}
U_SK_RE = re.compile(r"U\.?\s*(\d{1,4})\s*TAHUN\s*(\d{4})", re.I)

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+")
KMA_RE = re.compile(r"KMA\s+(?:Nomor|NO\.?|No\.?)\s*:?\s*(\d+)\s*Tahun\s*(\d{4})", re.I)
NIB_RE = re.compile(r"NIB\s*:?\s*(\d{12,18})", re.I)
TEL_RE = re.compile(r"(\(0\d{1,3}\)[\d ,.;\-]+|\b0\d{9,13}\b)")


def ambil_kata(path, cols):
    """Kembalikan list kata: {hal, top, x0, text, col}."""
    kata = []
    with pdfplumber.open(path) as pdf:
        for hi, page in enumerate(pdf.pages):
            for w in page.extract_words(x_tolerance=1.5, y_tolerance=3, keep_blank_chars=False):
                if w["top"] < 70 and w["text"] in HEADER_WORDS:
                    continue  # header tabel tiap halaman
                col = None
                for k, (x0, x1) in cols.items():
                    if x0 <= w["x0"] < x1:
                        col = k
                        break
                kata.append({"hal": hi, "top": w["top"], "x0": w["x0"], "text": w["text"], "col": col})
    return kata


def anchors_dan_entri(kata, jumlah_diharapkan):
    """Kembalikan dict no -> {col: [kata]}."""
    anchors = [k for k in kata if k["col"] == "no" and re.fullmatch(r"\d{1,3}", k["text"])]
    anchors.sort(key=lambda k: (k["hal"], k["top"]))
    # validasi urutan 1..N
    valid, next_no = [], 1
    for a in anchors:
        v = int(a["text"])
        if v == next_no:
            valid.append(a)
            next_no += 1
    if len(valid) != jumlah_diharapkan:
        print(f"  !! anchor valid: {len(valid)}, diharapkan {jumlah_diharapkan}")
    top_abs = lambda k: k["hal"] * 10000 + k["top"]
    entries = {}
    for i, a in enumerate(valid):
        n = int(a["text"])
        ymin = top_abs(a) - 22
        ymax = top_abs(valid[i + 1]) - 15 if i + 1 < len(valid) else 99999999
        e = {}
        for k in ("nama", "izin", "tgl", "alamat"):
            e[k] = []
        for k in kata:
            if k["col"] in ("nama", "izin", "tgl", "alamat"):
                t = top_abs(k)
                if ymin <= t < ymax:
                    e[k["col"]].append(k["text"])
        # urutkan per kolom mengikuti (top, x0) — perlu simpan urutan asli
        entries[n] = e
    return entries


def entri_terurut(path, cols, jumlah_diharapkan):
    """Versi yang menjaga urutan kata per kolom (pakai urutan asli)."""
    kata = ambil_kata(path, cols)
    anchors = [k for k in kata if k["col"] == "no" and re.fullmatch(r"\d{1,3}", k["text"])]
    anchors.sort(key=lambda k: (k["hal"], k["top"]))
    valid, next_no = [], 1
    for a in anchors:
        v = int(a["text"])
        if v == next_no:
            valid.append(a)
            next_no += 1
    top_abs = lambda k: k["hal"] * 10000 + k["top"]
    hasil = []
    for i, a in enumerate(valid):
        n = int(a["text"])
        ymin = top_abs(a) - 22
        ymax = top_abs(valid[i + 1]) - 15 if i + 1 < len(valid) else 10**9
        e = {k: [] for k in ("nama", "izin", "tgl", "alamat")}
        for k in kata:
            if k["col"] in ("nama", "izin", "tgl", "alamat"):
                t = top_abs(k)
                if ymin <= t < ymax:
                    e[k["col"]].append(k["text"])
        hasil.append({"no": n, **e})
    return hasil


def bersih(s):
    s = unicodedata.normalize("NFKC", s or "")
    s = s.replace("\u2019", "'").replace("\u2018", "'")
    s = re.sub(r"\s+", " ", s).strip()
    return s


def perbaiki_email_wrap(email, alamat_raw):
    """PDF kadang memotong email di tepi kanan lalu lanjut di baris berikut ('GMAIL.CO M')."""
    if not email:
        return email
    tail = email.rsplit(".", 1)[-1]
    if len(tail) == 3:
        return email
    m = re.search(re.escape(email) + r"\s+([A-Za-z0-9]{1,3})\b", alamat_raw, re.I)
    if m:
        gabung = email + m.group(1)
        return gabung
    return email


def norm_telepon(t):
    d = re.sub(r"\D", "", t)
    if not d:
        return ""
    if d.startswith("0"):
        return "+62" + d[1:]
    if d.startswith("62"):
        return "+" + d
    return d


def parse_entri(e, jenis):
    nama = bersih(" ".join(e["nama"]))
    alamat_raw = bersih(" ".join(e["alamat"]))
    izin_txt = bersih(" ".join(e["izin"]) + " " + " ".join(e["tgl"]))

    m = KMA_RE.search(izin_txt)
    m_nib = NIB_RE.search(izin_txt)
    m_u = U_SK_RE.search(izin_txt)
    if jenis == "PIHK":
        if m:
            license_no = f"KMA Nomor {m.group(1)} Tahun {m.group(2)}"
            jenis_izin = "KMA"
        elif m_nib:
            license_no = f"NIB {m_nib.group(1)}"
            jenis_izin = "NIB"
        else:
            license_no = ""
            jenis_izin = ""
    else:  # PPIU: NIB lebih baru, SK-U klasik sebagai cadangan
        if m_nib:
            license_no = f"NIB {m_nib.group(1)}"
            jenis_izin = "NIB"
        elif m_u:
            license_no = f"U.{m_u.group(1)} Tahun {m_u.group(2)}"
            jenis_izin = "SK-U"
        else:
            license_no = ""
            jenis_izin = ""
    u_tambahan = f"U.{m_u.group(1)} Tahun {m_u.group(2)}" if m_u else ""

    m_tgl = re.search(r"TGL\s*SK\s*:\s*([\d\-]{8,10})", izin_txt, re.I)
    if m_tgl:
        tgl = m_tgl.group(1)
    else:
        tgl_m = re.search(r"\b(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4}", izin_txt, re.I)
        tgl = bersih(tgl_m.group(0)).lstrip("'") if tgl_m else ""

    m_dir = re.search(r"DIREKTUR\s*:\s*(.+?)(?=\s*NIB\s|\s*TGL\s|$)", izin_txt, re.I)
    direktur = bersih(m_dir.group(1)) if m_dir else ""

    tels = [re.sub(r"\s+", " ", t.strip(" ,.;")) for t in TEL_RE.findall(alamat_raw)]
    tel_clean = []
    for t in tels:
        d = re.sub(r"\D", "", t)
        if len(d) >= 9 and t not in tel_clean:
            tel_clean.append(t)
    phone = norm_telepon(tel_clean[0]) if tel_clean else ""

    emails = [x.lower().strip(".,").rstrip(".") for x in EMAIL_RE.findall(alamat_raw)]
    emails = list(dict.fromkeys(emails))
    if emails:
        emails[0] = perbaiki_email_wrap(emails[0], alamat_raw)
    email = emails[0] if emails else ""

    alamat = alamat_raw
    alamat = re.sub(r"(TELEPON|TELP|Telp|Telepon)\s*[:;.]\s*[\d ,.;()\-\+]+", " ", alamat, flags=re.I)
    alamat = re.sub(r"(EMAIL|Email)\s*[:;.]\s*\S*", " ", alamat, flags=re.I)
    for t in tels:
        alamat = alamat.replace(t, " ")
    alamat = re.sub(r"\s+", " ", alamat).strip(" ,.;-")

    kota = ""
    m_k = re.search(r"Kab(?:upaten)?\.?\s+([A-Za-z][A-Za-z .]+?)(?=,|$|\s+Provinsi|\s+JAWA|\s+Jawa)", alamat, re.I)
    if m_k:
        kota = "Kab. " + bersih(m_k.group(1)).strip(" ,.").title()
    else:
        m_k = re.search(r"Kota\s+([A-Za-z][A-Za-z .]+?)(?=,|$|\s+Provinsi|\s+JAWA|\s+Jawa)", alamat, re.I)
        if m_k:
            kota = "Kota " + bersih(m_k.group(1)).strip(" ,.").title()

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
        "u_tambahan": u_tambahan,
        "izin_lain": [],
        "no_urut": e["no"],
    }


KOTA_JATENG_FALLBACK = {
    "SEMARANG": "Kota Semarang", "SURAKARTA": "Kota Surakarta", "SOLO": "Kota Surakarta",
    "SALATIGA": "Kota Salatiga", "PEKALONGAN": "Kota Pekalongan", "TEGAL": "Kota Tegal",
}
KAB_JATENG_FALLBACK = ["SUKOHARJO", "KLATEN", "BOYOLALI", "SRAGEN", "KARANGANYAR", "WONOGIRI",
    "BANYUMAS", "CILACAP", "KEBUMEN", "PURWOREJO", "WONOSOBO", "TEMANGGUNG", "KENDAL",
    "JEPARA", "DEMAK", "GROBOGAN", "BLORA", "REMBANG", "PATI", "KUDUS", "BANJARNEGARA",
    "PURBALINGGA", "BREBES", "BATANG"]


def isi_kota(h):
    """Isi ulang kota dari alamat FINAL (setelah gabungan entri PIHK+PPIU)."""
    if (h.get("city") or "").strip():
        return
    al = (h.get("alamat") or "").upper()
    m = re.search(r"\bKOTA\s+([A-Z][A-Z .]+?)(?=,|$|\s+PROV|\s+JAWA)", al)
    if m:
        h["city"] = "Kota " + m.group(1).strip(" .").title()
        return
    m = re.search(r"\bKAB(?:UPATEN)?\.?\s+([A-Z][A-Z .]+?)(?=,|$|\s+PROV|\s+JAWA)", al)
    if m:
        h["city"] = "Kab. " + m.group(1).strip(" .").title()
        return
    for k in KAB_JATENG_FALLBACK:
        if re.search(rf"\b{k}\b", al):
            h["city"] = "Kab. " + k.title()
            return
    for k, v in KOTA_JATENG_FALLBACK.items():
        if re.search(rf"\b{k}\b", al):
            h["city"] = v
            return


def norm_nama(s):
    s = (s or "").lower()
    s = re.sub(r"^pt\.?\s*", "", s)
    s = re.sub(r"[^a-z0-9]", "", s)
    return s


def norm_izin(s):
    return re.sub(r"\D", "", s or "")


def main():
    pihk = entri_terurut("/tmp/panen25/jateng-pihk.pdf", PIHK_COLS, 53)
    ppiu = entri_terurut("/tmp/panen25/jateng-ppiu.pdf", PPIU_COLS, 104)
    print(f"PIHK entri: {len(pihk)} (no {pihk[0]['no']}..{pihk[-1]['no']})")
    print(f"PPIU entri: {len(ppiu)} (no {ppiu[0]['no']}..{ppiu[-1]['no']})")

    hasil = [parse_entri(e, "PIHK") for e in pihk] + [parse_entri(e, "PPIU") for e in ppiu]
    tanpa_izin = [h for h in hasil if not h["licenseNo"]]
    print(f"total: {len(hasil)}; tanpa izin: {len(tanpa_izin)}")
    for h in tanpa_izin:
        print(f"  [tanpa izin] no.{h['no_urut']} {h['name']}")

    # gabungkan entri ganda (perusahaan sama tercatat di tabel PIHK & PPIU)
    from collections import OrderedDict
    grup = OrderedDict()
    for h in hasil:
        grup.setdefault(norm_nama(h["name"]), []).append(h)
    gabung = []
    for nn, lst in grup.items():
        if len(lst) == 1:
            gabung.append(lst[0])
            continue
        def skor(h):
            t = 0
            if h["type"] == "PIHK":
                t += 2
            if h["jenis_izin"] in ("KMA", "NIB"):
                t += 1
            return t
        lst2 = sorted(lst, key=lambda h: -skor(h))
        p = lst2[0]
        for o in lst2[1:]:
            if o["licenseNo"] and o["licenseNo"] != p["licenseNo"]:
                tgl_o = f" (Tgl {o['tgl']})" if o["tgl"] else ""
                p["izin_lain"].append(f"juga terdaftar sbg {o['type']}: {o['licenseNo']}{tgl_o}")
            if o["direktur"] and not p["direktur"]:
                p["direktur"] = o["direktur"]
            if o["phone"] and not p["phone"]:
                p["phone"] = o["phone"]
            if o["email"] and not p["email"]:
                p["email"] = o["email"]
            if o["alamat"] and len(o["alamat"]) > len(p["alamat"]):
                p["alamat"] = o["alamat"]
        gabung.append(p)
        print(f"  [gabung] {p['name']} -> {p['type']}/{p['licenseNo']} + {len(p['izin_lain'])} izin lain")
    hasil = gabung
    for h in hasil:
        isi_kota(h)
    tanpa_izin = [h for h in hasil if not h["licenseNo"]]
    print(f"setelah gabung: {len(hasil)}; tanpa izin: {len(tanpa_izin)}")

    seen_nama, seen_izin, unik = set(), set(), []
    for h in hasil:
        nn, nz = norm_nama(h["name"]), norm_izin(h["licenseNo"])
        if nn in seen_nama:
            print(f"  [dup nama internal] {h['name']} no.{h['no_urut']}")
            if "SEKOLAH" in h["name"]:
                print("     >> TRACE SEKOLAH: dup nama!")
            continue
        if nz and len(nz) >= 8 and nz in seen_izin:
            print(f"  [dup izin internal] {h['name']} ({h['licenseNo']})")
            if "SEKOLAH" in h["name"]:
                print("     >> TRACE SEKOLAH: dup izin!")
            continue
        seen_nama.add(nn)
        if nz:
            seen_izin.add(nz)
        unik.append(h)

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
        if "SEKOLAH" in h["name"]:
            print(f"  >> TRACE SEKOLAH di unik: type={h['type']} lic={h['licenseNo']} hit={bool(hit)}")
        if hit:
            cocok.append({**h, "db_name": hit[0], "db_license": hit[1], "db_phone": hit[2] or "", "db_email": hit[3] or "", "db_city": hit[4] or "", "db_desc": hit[7] or ""})
        else:
            baru.append(h)

    print(f"\n=== HASIL === unik: {len(unik)} | BARU: {len(baru)} | cocok dgn DB: {len(cocok)}")

    csv_path = "/tmp/panen25/jateng-baru.csv"
    with open(csv_path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["name", "type", "city", "province", "licenseNo", "phone", "email", "website", "description"])
        for h in baru:
            if not (h["licenseNo"] or "").strip():
                continue  # tanpa nomor izin = jangan diimpor (aturan anti-karang)
            desc = []
            if h["tgl"]:
                desc.append(f"Tgl SK/NIB: {h['tgl']}")
            if h["direktur"]:
                desc.append(f"Direktur: {h['direktur']}")
            if h["u_tambahan"] and h["licenseNo"] != h["u_tambahan"]:
                desc.append(f"Izin SK PPIU tercatat: {h['u_tambahan']}")
            if h["izin_lain"]:
                desc.append(" | ".join(h["izin_lain"]))
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

    print(f"\nBARU ({len(baru)}) — 20 contoh:")
    for h in baru[:20]:
        print(f"  [{h['type']}] {h['name']} | {h['licenseNo'] or '-'} | {h['city']} | {h['phone'] or '-'} | {h['email'] or '-'}")
    print(f"\nCOCOK ({len(cocok)}):")
    for h in cocok:
        print(f"  DB: {h['db_name']} ({h['db_license']}) <-> PDF: {h['name']} ({h['licenseNo']}) telp:{h['phone'] or '-'} email:{h['email'] or '-'}")


if __name__ == "__main__":
    main()
