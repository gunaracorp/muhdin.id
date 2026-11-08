# 📋 Panduan Impor Database PPIU & PIHK — MUHDIN.ID

> Dibuat otomatis saat sesi penyempurnaan portal · 8 November 2026

---

## 1. Hasil Riset Sumber Data

| Pertanyaan | Jawaban Riset |
| --- | --- |
| Apakah aplikasi **Haji Pintar** (Play Store) berisi database PPIU/PIHK? | **Tidak.** Haji Pintar adalah aplikasi resmi Kemenag untuk cek porsi haji, manasik, dan info jamaah. Play Store hanya menyimpan metadata aplikasi (nama, developer, rating) — bukan daftar perusahaan. |
| Di mana database resmi PPIU/PIHK? | **SISKOPATUH** (siskopatuh.haji.go.id) — sistem pengawasan Kementerian Haji dan Umrah RI. Pencarian publik per perusahaan ada di **SIMPU** (simpu.kemenag.go.id) dan portal haji.kemenag.go.id (menu PPIU). |
| Berapa jumlahnya? | **3.631 PPIU** terdaftar di SISKOPATUH (per September 2026), ±50% tidak aktif. PIHK diterbitkan lewat SK Menteri per tahun (±1.200 perusahaan). |
| Bisakah diambil otomatis seluruhnya? | **Belum.** Situs Kemenag/Kemenhaj memblokir akses otomatis (JS-heavy, anti-crawler) dan belum menyediakan unduhan massal terbuka. Daftar lengkap resmi hanya lewat **pengumuman per provinsi** di situs kanwil `{provinsi}.haji.go.id` atau **permintaan resmi ke PPID Kementerian Haji dan Umrah** (hak akses informasi publik). |

## 2. Yang Sudah Diimpor ke Database (Hari Ini)

- **31 PPIU resmi** penerima SK izin Ditjen PHU Kemenag RI, Mei 2025 — daftar dari artikel resmi kemenag.go.id.
- **2 PPIU diblokir** (akses SISKOPATUH dibekukan Kemenhag, Agustus 2026, untuk perlindungan jamaah) — status `SUSPENDED`, tidak tampil sebagai anggota aktif.
- Total anggota database kini **45** (12 data demo + 33 riil).
- Catatan jujur: kolom `Izin` memakai label batch "SK PPIU Mei 2025" (nomor SK individu tidak dipublikasikan per perusahaan), dan kota/provinsi berisi "Nasional, Indonesia" sampai dilengkapi.

## 3. Tiga Cara Input Data (Pilih Sesuai Kebutuhan)

### A. Input Manual via CMS (paling mudah untuk sedikit data)
1. Buka portal → menu **Portal Mitra** atau `#/admin`
2. Login: `admin@muhdin.web.id` / `muhdin2026` *(ganti sandi setelah produksi!)*
3. Sidebar → **Direktori Anggota** → tombol **Tambah Anggota**
4. Isi: Nama, Jenis (PPIU/PIHK/KBIHU/IPHI/Travel Wisata), Kota, Provinsi, No. Izin, kontak → Simpan

### B. Impor Massal via CSV (untuk ratusan–ribuan baris) ⭐
Format file CSV (`db/ppiu-pihk-starter.csv` adalah contoh lengkapnya):

```csv
name,type,city,province,licenseNo,phone,email,website,description,status,memberSince
PT Contoh Wisata,PPIU,Jakarta Barat,DKI Jakarta,UU-562/2025,021-1234567,info@contoh.id,https://contoh.id,"Deskripsi singkat",TERVERIFIKASI,2025
PT Contoh Haji,PIHK,Surabaya,Jawa Timur,SK-789/Kemenag/2024,031-7654321,cs@contoh.id,,"PIHK terakreditasi",TERVERIFIKASI,2024
```

Aturan kolom:
- `name` & `type` **wajib** · type: PPIU / PIHK / KBIHU / IPHI / TRAVEL_WISATA
- `status`: TERVERIFIKASI / PENDING / SUSPENDED (kosong = TERVERIFIKASI)
- Nilai berisi koma wajib dibungkus tanda kutip ganda `"..."`
- **Idempoten**: nama yang sudah ada akan diperbarui, bukan diduplikasi — aman dijalankan berulang

Jalankan:
```bash
bun scripts/import-members.ts db/ppiu-pihk-starter.csv
bun scripts/import-members.ts file-kamu.csv   # file apa pun
```

### C. Kirim Datanya ke Aku (AI)
Kalau kamu punya file **PDF/Excel/foto pengumuman resmi** daftar PPIU/PIHK (misalnya dari kanwil atau PPID), unggah saja di chat ini — aku yang ekstrak, rapikan jadi CSV, dan impor semuanya.

## 4. Cara Mendapat Daftar Resmi Lengkap (100%)

1. **Pengumuman per provinsi** — situs kanwil: `jakarta.haji.go.id`, `jatim.haji.go.id`, `sumsel.haji.go.id`, `bali.haji.go.id`, dst. → menu **LK & PIH** / **Pengumuman** → unduh PDF daftar PPIU & PIHK 1447H/2026M per provinsi.
2. **Permintaan resmi PPID** — Pejabat Pengelola Informasi dan Dokumentasi Kementerian Haji dan Umrah (via haji.go.id → PPID) — minta "rekap daftar PPIU dan PIHK terdaftar SISKOPATUH terbaru" (format Excel biasanya dikabulkan karena wajib diumumkan sesuai UU Keterbukaan Informasi Publik).
3. **Cek per perusahaan** — SIMPU (simpu.kemenag.go.id) untuk validasi satu per satu.

## 5. Skrip & File Terkait

| File | Fungsi |
| --- | --- |
| `scripts/import-members.ts` | Importer CSV → tabel Member (idempoten, validasi) |
| `db/ppiu-pihk-starter.csv` | Data starter 33 PPIU riil + template kolom |
| `db/custom.db` | Database SQLite live |
| API publik | `GET /api/members?type=PPIU` · `GET /api/stats/public` |
