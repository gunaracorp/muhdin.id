#!/usr/bin/env python3
"""
panen-data-resmi.py — data PPIU/PIHK asli hasil panen sumber publik:
  A) sapuhi.id/members hal. 1 (40 anggota: izin PPIU & PIHK, alamat) — DPP SAPUHI
  B) "Daftar Resmi PIHK Kemenag 2025" (18 baris pertama: izin KMA, alamat, telp, email)
Keluaran: download/data-resmi/anggota-resmi.csv siap diimpor via /api/import (type=members).
Tidak ada data yang dikarang — kolom tak diketahui dibiarkan kosong; sumber dicantumkan.
"""
import csv
import pathlib

OUT = pathlib.Path("/home/z/my-project/download/data-resmi/anggota-resmi.csv")

# (nama, alamat, izin_ppiu, izin_pihk) — sapuhi.id/members hal. 1 (40 baris)
SAPUHI = [
    ("PT. NURUL MUFLIHUN AL BAROQAH", "Jalan. Hos Cokrominoto No. 62 Karang Timur, Karang Tengah, Tangerang, Banten", "No. U 123 Tahun 2020", ""),
    ("PT. AMANAH INDAH WISATA", "Rukan Grand Galaxy Blok RSA 5 No. 50, Bekasi Selatan, Kota Bekasi, Jawa Barat", "U. 159 TAHUN 2020 / No. 552 Tahun 2018", ""),
    ("PT. KAFILAH ZAIN WISATA", "Jl. Puncak Borobudur B9, Lowokwaru, Kota Malang, Jawa Timur", "22082200457550001", ""),
    ("PT. AZKA SEMESTA WISATA", "Jl. Sultan Adam No 7 Kel. Surgi Mufti Kec. Banjarmasin Utara, Kota Banjarmasin, Kalimantan Selatan", "U.241/2020", "91201101524250003"),
    ("PT. QUBA UMRAA INDONESIA", "Jl. KH. Abdullah Syafei No. 53C, Tebet, Kota Jakarta Selatan, DKI Jakarta", "01112302429680002", ""),
    ("PT. Patuna Mekar Jaya", "Jl. Panglima Polim Raya 43 A Kel. Melawai, Kebayoran Baru, Kota Jakarta Selatan, DKI Jakarta", "No.812 tahun 2019", "No. 842 tahun 2019"),
    ("PT. ALBIS NUSA WISATA", "Jalan A Yani KM 36 Simpang Empat Banjarbaru, Kota Banjarbaru, Kalimantan Selatan", "U578 TAHUN 2020", "603 TAHUN 2021"),
    ("PT. Al Aqsha Jisru Dakwah", "Graha Al Aqsha 3, Jl. Pal Batu Raya No. 37, Menteng Dalam, Tebet, Kota Jakarta Selatan, DKI Jakarta", "U92 TAHUN 2020", "386 TAHUN 2021"),
    ("PT. Edipeni Travel", "Jl. KH Abdullah Syafei No.53, Tebet, Kota Jakarta Selatan, DKI Jakarta", "U537 TAHUN 2020", "No. 207 tahun 2018"),
    ("PT. ALMABRUR NADIA INSANI", "Jalan H Agus Salim No 61B, Jelutung, Kota Jambi, Jambi", "U.57 TAHUN 2020", "407 TAHUN 2021"),
    ("PT. VENICE INDAH PRATAMA", "Jalan Jend. Gatot Subroto No. 54, Tanah Abang, Kota Jakarta Pusat, DKI Jakarta", "No. 120 Tahun 2018", ""),
    ("PT. FAHMI KALAM ILAHI", "Jl. Beringin Raya No.81, Karawaci, Kota Tangerang, Banten", "No. 784 Tahun 2019", "704 tahun 2020"),
    ("PT. AT TIQNU", "Jl. Parangtritis Km 5.7 Pandes, Sewon, Kabupaten Bantul, DI Yogyakarta", "SKMA NOMOR 118 TAHUN 2019", "SKMA Nomor 775 tahun 2019"),
    ("PT. TIMA AMANAH PRIMA WISATA", "Jl. Kh Abdullah Syafei No.68, Tebet, Kota Jakarta Selatan, DKI Jakarta", "U.55 TAHUN 2022", ""),
    ("PT. BAROKAH KABAH PALEMBANG", "Jalan Sukorejo No 87, Ilir Timur II, Kota Palembang, Sumatera Selatan", "15012200086460001", ""),
    ("PT. KINANA MANDIRI WISATA", "Ruko Sentra Eropa Blok A15 Kota Wisata, Gunung Putri, Kabupaten Bogor, Jawa Barat", "91200045724020002", "91200045724020001"),
    ("PT. ZHAFIRAH MITRA MADINA", "Ruko Kuning 8D, Jl Ringroad Utara Condong Catur, Depok, Kabupaten Sleman, DI Yogyakarta", "117/2019", "92/2020"),
    ("PT. DZAHABI FAIRUZ AL-HARIS", "Jl. Kolonel H. Barlian No.264, Alang-Alang Lebar, Kota Palembang, Sumatera Selatan", "NO 186 TAHUN 2020", "11112201720940001"),
    ("PT. FAJAR BORNEO RAYA", "Jl. Melati Indah No.05, Banjarmasin Timur, Kota Banjarmasin, Kalimantan Selatan", "No.65 Tahun 2018 (No. U.43 Tahun 2020)", ""),
    ("PT. ALYA ZAMZAMI AURA", "Jl. Teratai Putih Raya No.9J, Duren Sawit, Kota Jakarta Timur, DKI Jakarta", "PPIU No.334", ""),
    ("PT. BAGUS UMRATAMA", "Jl. Pramuka No.45, Banjarmasin Timur, Kota Banjarmasin, Kalimantan Selatan", "No.547 Tahun 2019", "No.877 Tahun 2020"),
    ("PT. HASWI SALAM MADANI", "Jalan Purwadi No. 47, Jambi Timur, Kota Jambi, Jambi", "No. 78 Tahun 2018", ""),
    ("PT. ALTUR WISATA MULIA", "Ruko Harvest R-01 Lt. 1, Ciputat, Kota Tangerang Selatan, Banten", "NOMOR U.521 TAHUN 2020", "NOMOR 239 TAHUN 2021"),
    ("PT. Albarik Tour", "Jalan Budaya No.1, Cililitan, Kramat Jati, Kota Jakarta Timur, DKI Jakarta", "No. 266 Tahun 2018", ""),
    ("PT. Ilfa Ihsan Hanifa", "Jalan TB. Simatupang No.47 Lt.2-205, Jagakarsa, Kota Jakarta Selatan, DKI Jakarta", "No. U19 th 2022", "12450006729150000"),
    ("PT. TRIDAYA PESONA WISATA", "Jalan S. Parman No.90 D, Padang Utara, Kota Padang, Sumatera Barat", "No. 139 Tahun 2018", "12390002303290004"),
    ("PT. CAHAYA TIGA PESONA", "Ruko Sing Asri Plaza 1, Jl. Wr. Supratman No. 2, Ciputat Timur, Kota Tangerang Selatan, Banten", "U. 31 Tahun 2023", ""),
    ("PT. TAUFIQ HAROMAIN TOBAH", "Jalan Pabuaran No. 50, Warudoyong, Kota Sukabumi, Jawa Barat", "No. U. 68 Tahun 2020", "91201042225270001"),
    ("PT. ZAHARA NAMORA WISATA", "Jalan SMA 14 No. 9A-D, Cawang, Kramat Jati, Kota Jakarta Timur, DKI Jakarta", "No. U. 7 Tahun 2020", ""),
    ("PT. AT-TIIN NABILA UTAMA", "Jln. Penganten Ali No 8, Ciracas, Kota Jakarta Timur, DKI Jakarta", "91202064727670001", "91202064727670004"),
    ("PT. AZZAM ALBAESUNI", "Jl. H. Dimun Raya, Cilodong, Kota Depok, Jawa Barat", "NOMOR U. 294 Tahun 2020", "Nomor 437 Tahun 2021"),
    ("PT. AUFA DUTA WISATA TOUR & TRAVEL", "Jl. KH. Noer Ali No 1, Bekasi Selatan, Kota Bekasi, Jawa Barat", "No. U. 120 Tahun 2020", ""),
    ("PT. GETWAY TOUR & TRAVEL", "Plaza Pondok Gede, Jatiwaringin, Pondok Gede, Kota Bekasi, Jawa Barat", "No. 821 tahun 2017", ""),
    ("PT. TAJAK RAMADHAN GROUP", "Jalan Raden Saleh, Rukan Bumi Permata Blok R1/8, Karang Tengah, Kota Tangerang, Banten", "No. 441 Tahun 2017", ""),
    ("PT. SYAFIYA HANA BAHANA", "Jl. Amir Machmud Gg. Udi No. 43, Cibabat, Cimahi Utara, Kota Cimahi, Jawa Barat", "NOMOR U.530 TAHUN 2020", "NOMOR 600 TAHUN 2021"),
    ("PT. HUMAIRA CINTA WISATA ABADI", "Jalan Raya Kalibata No.7, Kramat Jati, Kota Jakarta Timur, DKI Jakarta", "No. 470 Tahun 2020", ""),
    ("PT. ALMIRA BERKAH ABADI", "Wisma Haroen, Jl. Raya Pasar Minggu No.2E, Pancoran, Kota Jakarta Selatan, DKI Jakarta", "NO. U 42 TAHUN 2023", "NO. 143 TAHUN 2021"),
    ("PT. AMANAH WISATA INSANI", "Graha Seti Lt. 1, Jl. Abdullah Syafe'i Kav. A-19-20, Tebet, Kota Jakarta Selatan, DKI Jakarta", "No. 701 Tahun 2017", ""),
    ("PT. MDL 525 TRAVEL (MANDALA)", "Jl. Sudirman No 30, Ruko Mandala Residence, Garut Kota, Kabupaten Garut, Jawa Barat", "Nomor 1030 Tahun 2019", "Nomor 91203016521180003"),
    ("PT. INDONESIA INTERNATIONAL BUSINESS", "Jl. DR Hamka No 99, Larangan, Ciledug, Kota Tangerang, Banten", "U284 tahun 2020", "02201053910880005"),
]

# (nama, izin_km, alamat, telp, email) — "Daftar Resmi PIHK Kemenag 2025" (baris 1-18)
PIHK_RESMI = [
    ("PT. AFIZ NURUL QOLBI", "KMA Nomor 783 Tahun 2019", "Komplek Wijaya Grand Center B No. 5 Lt. I, Jl. Wijaya II, Kebayoran Baru, Jakarta Selatan", "(021) 72799455", "az_anubi@yahoo.com"),
    ("PT. AIDA TOUR INDO WISATA", "KMA Nomor 347 Tahun 2020", "Jl. Cempaka Putih No. 33 RT. 001/08, Cempaka Putih Timur, Jakarta Pusat", "(021) 4254686", "aidatourindo33@yahoo.co.id"),
    ("PT. AL AHRAM SARANA WISATA", "KMA Nomor 785 Tahun 2017", "Jl. Tebet Raya IX No. 58, Tebet Barat, Tebet, Jakarta Selatan", "(021) 83700876", "al_ahramjkt@yahoo.com"),
    ("PT. ALAMIN AHSAN TRAVEL", "KMA Nomor 680 Tahun 2017", "Graha Alisan, Jl. Asem Baris Raya No. 3/126, Kebon Baru, Tebet, Jakarta Selatan", "(021) 8301010", "alisan_trvl@yahoo.com"),
    ("PT. AL AMIN MULIA LESTARI", "KMA Nomor 799 Tahun 2019", "CBD Ciledug Blok A.5 No. 21, Karang Tengah, Kota Tangerang", "(021) 7651933", "daqutravel@gmail.com"),
    ("PT. AL AMIN UNIVERSAL", "KMA Nomor 712 Tahun 2020", "Jl. Pakubuwono VI No.109, Kebayoran Baru, Jakarta Selatan", "(021) 7392800", "alamin.universal@yahoo.com"),
    ("PT. AL AMSOR MUBAROKAH", "KMA Nomor 146 Tahun 2019", "Jl. Buncit Raya No. 34, Kalibata, Pancoran, Jakarta Selatan", "(021) 7944825", "alamsorwisata@yahoo.co.id"),
    ("PT. AL-ANDALUS NUSANTARA", "KMA Nomor 237 Tahun 2019", "Jl. Raya Menganti Wiyung No. 93, Wiyung, Kota Surabaya", "(031) 7525564", "andalus_sub@yahoo.com"),
    ("PT. AL HARAMAIN JAYA WISATA", "KMA Nomor 554 Tahun 2019", "Jl. Basuki Rahmat No. 21, Jatinegara, Jakarta Timur", "(021) 8510247", "alharamain_jw@yahoo.co.id"),
    ("PT. AL KHALID JAYA MEGAH", "KMA Nomor 35 Tahun 2019", "Jl. Panglima Polim Raya No. 21 C, Kebayoran Baru, Jakarta Selatan", "(021) 72789049", "umrah_hajj_jmt@yahoo.co.id"),
    ("PT. ALWAN ZAHIRA", "KMA Nomor 967 Tahun 2017", "Jl. AM. Sangiaji RT. 18, Sungai Pinang, Kota Samarinda", "(0541) 749678", "alwanzahira@yahoo.com"),
    ("PT. ALIA INDAH WISATA", "KMA Nomor 238 Tahun 2019", "Puri Sentra Niaga E/73, Cipinang Melayu, Makasar, Jakarta Timur", "(021) 86608950", "aliawisata@cbn.net.id"),
    ("PT. AMANAH MULIA WISATA", "KMA Nomor 299 Tahun 2018", "Jl. Taman Citarum No. 3, Bandung Wetan, Kota Bandung, Jawa Barat", "(022) 4222015", "amwatour@yahoo.com"),
    ("PT. AMSA NUR INDAH MANDIRI", "KMA Nomor 147 Tahun 2020", "Jl. Pramuka Raya No. A 390, Paseban, Senen, Jakarta Pusat", "(021) 3154202", "amsatour@yahoo.com"),
    ("PT. ANANDA NURUL HAROMAIN", "KMA Nomor 9 Tahun 2018", "Jl. Landak Baru No.63, Rappocini, Kota Makassar, Sulawesi Selatan", "(0411) 830125", "ananda.umrahhaj@yahoo.co.id"),
    ("PT. ANDROMEDA ATRIA WISATA", "KMA Nomor 395 Tahun 2018", "Jl. Raya Kupang Jaya No. 1 Kav. 6, Sukomanunggal, Kota Surabaya", "(031) 7310374", "atria_sby@yahoo.com"),
    ("PT. BIRO PERJALANAN WISATA ANMAR BINAWISATA", "KMA Nomor 679 Tahun 2017", "Jl. A. Pettarani No. 42 D, Panakkukang, Kota Makassar, Sulawesi Selatan", "(0411) 420097", "anmarbinawisata@yahoo.com"),
    ("PT. AN-NABA INTERNASIONAL", "KMA Nomor 396 Tahun 2018", "M.T. Haryono Square E.1/1, Jl. Otista No. 390, Jatinegara, Jakarta Timur", "(021) 29067285", "an_naba09@yahoo.com"),
]

KOTA_KE_PROVINSI = {
    "Tangerang": "Banten", "Tangerang Selatan": "Banten", "Surabaya": "Jawa Timur",
    "Samarinda": "Kalimantan Timur", "Bandung": "Jawa Barat", "Makassar": "Sulawesi Selatan",
    "Padang": "Sumatera Barat", "Jambi": "Jambi", "Palembang": "Sumatera Selatan",
    "Banjarmasin": "Kalimantan Selatan", "Banjarbaru": "Kalimantan Selatan",
    "Depok": "Jawa Barat", "Sukabumi": "Jawa Barat", "Cimahi": "Jawa Barat",
    "Bekasi": "Jawa Barat", "Malang": "Jawa Timur", "Garut": "Jawa Barat",
    "Bantul": "DI Yogyakarta", "Sleman": "DI Yogyakarta", "Bogor": "Jawa Barat",
}
PROV_JAKARTA = {"Jakarta Selatan", "Jakarta Pusat", "Jakarta Timur", "Jakarta Barat", "Jakarta Utara"}

def parse_wilayah(alamat: str) -> tuple[str, str]:
    parts = [p.strip() for p in alamat.split(",") if p.strip()]
    if not parts:
        return "", ""
    last = parts[-1]
    city = parts[-2] if len(parts) >= 2 else ""
    for pref in ("Kota Adm. ", "Kota Administrasi ", "Kota ", "Kab. ", "Kabupaten ", "Provinsi ", "Kec. ", "Kecamatan "):
        if city.startswith(pref):
            city = city[len(pref):]
    if last.startswith("Provinsi "):
        last = last[len("Provinsi "):]
    if last in PROV_JAKARTA:
        return last, "DKI Jakarta"
    city_clean = city if city and not city.startswith("Kel") else (parts[-3] if len(parts) >= 3 else "")
    return city_clean, last

def baris_dari_sapuhi(nama, alamat, izin_ppiu, izin_pihk) -> dict:
    city, prov = parse_wilayah(alamat)
    tipe = "PIHK" if izin_pihk else "PPIU"
    izin_utama = izin_ppiu or izin_pihk
    desk = [f"Alamat: {alamat}", f"Sumber data: Direktori DPP SAPUHI (sapuhi.id)"]
    if izin_ppiu and izin_pihk:
        desk.insert(1, f"Izin PIHK: {izin_pihk}")
    return {"name": nama, "type": tipe, "city": city, "province": prov, "licenseNo": izin_utama,
            "phone": "", "email": "", "website": "", "description": " · ".join(desk)}

def baris_dari_pihk(nama, izin, alamat, telp, email) -> dict:
    city, prov = parse_wilayah(alamat)
    if not prov and city in KOTA_KE_PROVINSI:
        prov = KOTA_KE_PROVINSI[city]
    desk = f"Izin PIHK resmi Kemenag RI ({izin}) · Alamat: {alamat} · Sumber data: Daftar PIHK resmi Kemenag"
    return {"name": nama, "type": "PIHK", "city": city, "province": prov, "licenseNo": izin,
            "phone": telp, "email": email, "website": "", "description": desk}

rows, seen = [], set()
for r in SAPUHI:
    b = baris_dari_sapuhi(*r)
    if b["name"].lower() not in seen:
        seen.add(b["name"].lower()); rows.append(b)
for r in PIHK_RESMI:
    b = baris_dari_pihk(*r)
    if b["name"].lower() not in seen:
        seen.add(b["name"].lower()); rows.append(b)

OUT.parent.mkdir(parents=True, exist_ok=True)
with OUT.open("w", newline="", encoding="utf-8-sig") as f:
    w = csv.DictWriter(f, fieldnames=["name","type","city","province","licenseNo","phone","email","website","description"])
    w.writeheader(); w.writerows(rows)

n_pihk = sum(1 for r in rows if r["type"] == "PIHK")
print(f"CSV  : {OUT}  ({len(rows)} perusahaan unik — {n_pihk} PIHK, {len(rows)-n_pihk} PPIU)")
tanpa_prov = [r['name'] for r in rows if not r['province']]
tanpa_kota = [r['name'] for r in rows if not r['city']]
print("Tanpa provinsi:", tanpa_prov or "tidak ada")
print("Tanpa kota    :", tanpa_kota or "tidak ada")
