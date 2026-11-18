> **بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ**
> *Dengan nama Allah Yang Maha Pengasih, Maha Penyayang*

![MUHDIN.ID — Portal Digital Ekosistem Umrah dan Haji Indonesia](docs/assets/banner.svg)

# 🕋 MUHDIN.ID — v13.2.0 «SATU PINTU ORGANISASI»

### **MU**asyarakat **U**mroh **H**aji **D**igital **I**ndonesia

*Portal Digital Ekosistem Umrah & Haji Indonesia — Dari Indonesia ke Tanah Suci*
*The Digital Home for Indonesia's Umrah & Hajj Ecosystem — From Indonesia to the Holy Land*
*المنصة الرقمية لمنظومة العمرة والحج الإندونيسية — من إندونيسيا إلى الأرض المقدسة*

*Terakhir diperbarui: 18 November 2026*

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript 5](https://img.shields.io/badge/TypeScript_5-tsc_0_error-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Prisma 6](https://img.shields.io/badge/Prisma_6-74_model-2D3748?logo=prisma)](https://prisma.io)
[![API](https://img.shields.io/badge/API-159_route_handler-black)](#-peta-api)
[![SQLite](https://img.shields.io/badge/DB-SQLite_↔_Postgres_ready-003B57?logo=sqlite)](#-strategi-database)
[![i18n](https://img.shields.io/badge/i18n-ID_·_EN_·_AR_RTL-16a34a)](#-internasionalisasi)
[![RBAC](https://img.shields.io/badge/RBAC-4_peran_·_32_modul_CMS-d97706)](#-keamanan-dan-rbac)
[![PWA](https://img.shields.io/badge/PWA-installable_+_offline-5A0FC8?logo=pwa)](#-tema-gelap-pwa-dan-animasi)
[![WA Gateway](https://img.shields.io/badge/WA-4_provider_+_AI_Bot-25D366?logo=whatsapp)](#-notifikasi-13-kejadian--2-kanal)
[![Audit](https://img.shields.io/badge/Audit_Go_Live-10/10_terimplementasi-b8860b)](#-v126-audit-2026--kesiapan-go-live)
[![CI](https://img.shields.io/badge/CI-verify_·_e2e_·_security-2088FF?logo=githubactions)](.github/workflows/ci.yml)
[![E2E](https://img.shields.io/badge/E2E-Playwright_jalur_kritis-2EAD33?logo=playwright)](tests/e2e)
[![Roles](https://img.shields.io/badge/Role_Matrix-tested_159_route-4B32C3)](scripts/test-role-matrix.mts)
[![Lint](https://img.shields.io/badge/ESLint-0_problem-4B32C3?logo=eslint)](#-jaminan-kualitas-qa-gates)

> 🕌 **MUHDIN tanpa biaya pendaftaran di fase awal** — struktur biaya & sumber pembiayaan
> disampaikan transparan di `#/biaya` (koreksi jujur hasil audit go-live: tidak ada lagi
> klaim absolut yang tidak bisa dipertanggungjawabkan).

**v12.6.0 «AUDIT 2026»** adalah puncak perjalanan versi 12: fondasi **v12.0 «GABUNG»** (union dua
garis pengembangan — **garis fitur v6**: Marketplace, Forum, Kartu Jamaah, Pusat Bisnis, Pindai
Izin 360°; dan **garis v11.1**: Akademi, KTA Digital, Booking Slot, Benefit, Paspor Haji QR, GPS
Tracking, Tur 360°, WA-AI Bot), disempurnakan **v12.1 «GOD MODE»** (Compliance Checker skor
0–100), **v12.2 «99 ROADMAP»** (peta jalan 99 upgrade × 6 pilar), **v12.3 «AMANAH»** (2FA TOTP,
lockout brute-force, backup ber-drill), **v12.4 «LUNAS»** (checkout, payment adapter webhook
HMAC, invoice PDF ber-QR), dan **v12.5 «SINERGI»** (15 item roadmap tuntas: SEO penuh, WebP lazy,
UU PDP operasional, observability, dll. — **45/99 item roadmap selesai**). Lalu **v12.6**
mengimplementasikan **seluruh 10 tuntutan Audit Kesiapan Go-Live** (kajian strategis MUHDIN ×
NUSUK, alur ARMINA 12 langkah, master kemitraan Banten 2026–2030): 4 halaman baru (`#/kemitraan`,
`#/pembayaran`, `#/keamanan`, `#/biaya`), 6 halaman ditingkatkan (KPI, ARMINA, Nusuk, kontak,
Permenhaji 2025, footer), 52 klaim biaya absolut dibersihkan jadi bahasa model biaya yang jujur —
ditambah **penguatan teknis**: 58 error TypeScript dibersihkan dan typecheck kini **ketat**
(`ignoreBuildErrors: false`), webhook pembayaran **fail-closed** di produksi, first-run bootstrap
satu perintah (`bun run setup`), serta refactor `SmartImage` bebas cascading render.

Lalu **v13.0 «GERBANG»** membangun gerbang mutu: **CI/CD GitHub Actions** (verify: tsc 0 error →
lint 0 error → build; e2e: Playwright jalur kritis di DB segar), **Dashboard Omzet** manajemen,
**Sesi & Device Management** (revoke paksa), dan **Landing Kampanye Musiman** SSR ber-JSON-LD.
Kemudian **v13.1 «PANEN & PANTAU»** membuka dua bidang sekaligus. *Panen*: direktori resmi direkonstruksi
penuh dari 7 sumber (SAPUHI, PIHK Kemenag, SATU HAJI Jateng, HIMPUH, AMPHURI + **Direktori Nasional
2.087 entri** ekstraksi PDF 124 halaman) dengan dedupe nama + pengayaan kontak — **2.507 anggota
terverifikasi di 37 wilayah**, tiap entri bersitasi sumber. *Pantau*: **Papan Status Layanan Publik**
(`#/status`, R-097), **Duty Officer 24/7** (`#/darurat`, R-096), **Survei NPS** di Dashboard Omzet
(R-092), **Role Matrix test 159 route** di CI (R-079), **audit dependensi otomatis** (R-083),
**Runbook Pemulihan Bencana** (R-084), ulasan terverifikasi ber-agregat (R-014) — **61/99 item
roadmap selesai**. Semua fitur hidup, satu database, satu CMS, tiga bahasa.

Lalu **v13.2 «SATU PINTU ORGANISASI»** menata ulang wajah kelembagaan sesuai keputusan super final
owner (Master Final DPP 2026–2031): halaman **Struktur Organisasi DPP** (`#/pengurus`) dibangun ulang
penuh — dua pilar kepemimpinan (Ketua Umum & Sekjen ber-7 titel profesional), **empat dewan**
(Penasihat · Kehormatan · Pakar · Pengawas) dengan badge status personalia yang jujur, **15 bidang
strategis + 3 bidang khusus** dengan subbidang lengkap, register **38 DPW**, standar kerja 5 unsur +
siklus + 11 KPI; plus halaman baru **Master WhatsApp Community Architecture** (`#/komunitas`) —
**18 kanal resmi (17 grup spesialis + 1 kanal pengumuman)** dalam 6 ekosistem, naskah deskripsi
siap-copas per grup, pemetaan 15 departemen DPP, aturan *Primary Membership + Functional Access*,
peta koordinator, dan rencana implementasi 3 tahap. *Empat item roadmap tuntas*: **Web Push
Pengumuman Keberangkatan** (R-011 — VAPID, service worker, subscribe + broadcast CMS), **Analitik
Funnel Pendaftaran** (R-093 — 5 stage + konversi + titik bocor), **Pencarian Fuzzy** (R-064 —
Levenshtein + subsekuens), **KTA Tier berjenjang** (R-028) — **65/99 item roadmap selesai**.
---

## 📑 Isi

1. [MUHDIN dalam 30 Detik](#-muhdin-dalam-30-detik)
2. [Angka Proyek — Diukur, Bukan Diklaim](#-angka-proyek--diukur-bukan-diklaim)
3. [Peta Fitur Lengkap](#-peta-fitur-lengkap)
4. [Peta Halaman Publik (60+ rute)](#-peta-halaman-publik-60-rute)
5. [Notifikasi: 13 Kejadian × 2 Kanal](#-notifikasi-13-kejadian--2-kanal)
6. [Tema Gelap, PWA dan Animasi](#-tema-gelap-pwa-dan-animasi)
7. [Jalankan Lokal](#-jalankan-lokal)
8. [Akun Demo CMS](#-akun-demo-cms)
9. [Variabel Environment](#-variabel-environment)
10. [Strategi Database](#-strategi-database)
11. [Arsitektur Sistem](#-arsitektur-sistem)
12. [Alur Data Utama](#-alur-data-utama)
13. [Peta API](#-peta-api)
14. [Internasionalisasi](#-internasionalisasi)
15. [Keamanan dan RBAC](#-keamanan-dan-rbac)
16. [Jaminan Kualitas (QA Gates)](#-jaminan-kualitas-qa-gates)
17. [Struktur Proyek](#-struktur-proyek)
18. [Skrip Referensi](#-skrip-referensi)
19. [Deployment](#-deployment)
20. [Checklist Go-Live Produksi](#-checklist-go-live-produksi)
21. [Troubleshooting](#-troubleshooting)
22. [FAQ Pengembang](#-faq-pengembang)
23. [Kontribusi & Konvensi](#-kontribusi--konvensi)
24. [Dokumentasi Terkait](#-dokumentasi-terkait)
25. [Garis Waktu Versi](#-garis-waktu-versi)

---

## 🕋 MUHDIN dalam 30 Detik

MUHDIN adalah **asosiasi digital pertama** yang mempertemukan seluruh rantai layanan perjalanan
ibadah — PPIU, PIHK, KBIHU, IPHI, travel wisata halal, hingga UMKM — dalam satu ekosistem
terpercaya: satu data, satu standar, satu pengalaman.

| Angka | Artinya |
| --- | --- |
| **69 model** Prisma | Skema terpadu: dua garis + compliance + roadmap + checkout + PDP + broadcast + itinerary/waitlist + duty officer + NPS + status check |
| **159 route handler** `/api/*` | Semua ter-guard RBAC/rate-limit + audit — diuji matriks peran otomatis (lihat [Peta API](#-peta-api)) |
| **60+ rute halaman publik** | Beranda → ekosistem → layanan digital → trust center → kemitraan (lihat [Peta Halaman](#-peta-halaman-publik-60-rute)) |
| **32 modul CMS** | Semua konten & transaksi dikelola tanpa sentuh kode |
| **13 kejadian notifikasi × 2 kanal** | Email sekretariat + WhatsApp admin, otomatis (termasuk ORDER, BROADCAST, WAITLIST) |
| **3 bahasa (ID/EN/AR)** | Arab sungguhan RTL, bukan tempelan — 52 file kamus locale |
| **2.507 anggota** terverifikasi | Direktori tumbuh 103 → 735 → 1.392 → **2.507** dari 7 sumber (SAPUHI, PIHK Kemenag, SATU HAJI Jateng, HIMPUH, AMPHURI, Direktori Nasional 2.087), dedupe nama + pengayaan kontak, semua bersitasi sumber |
| **10/10 tuntutan audit** go-live | Terimplementasi & terdokumentasi (15 Nov 2026) — bukan klaim, ada bukti |
| **Rp 0 di fase awal** | Tanpa biaya pendaftaran; model biaya & keberlanjutan transparan di `#/biaya` |

---

## 📊 Angka Proyek — Diukur, Bukan Diklaim

Semua angka di README ini bisa Anda hitung ulang sendiri di root repo:

```bash
grep -c '^model ' prisma/schema.prisma          # 74 model
find src/app/api -name route.ts | wc -l          # 159 route handler
ls src/components/views/*.tsx | wc -l            # 78 komponen view
ls src/components/admin/*.tsx | wc -l            # 37 modul CMS
ls src/lib/i18n/locales/*.ts | wc -l             # 56 file kamus locale
ls src/lib/*.ts | wc -l                          # 41 modul lib
```

Prinsip proyek: **angka yang tidak bisa dibuktikan tidak boleh ditulis**. Prinsip yang sama
diterapkan ke konten portal sendiri oleh Audit Go-Live 2026 — 52 klaim absolut («100% gratis»,
«Operator Nusuk Indonesia», dll.) diganti bahasa yang jujur dan bisa dipertanggungjawabkan, dan
setiap anggota direktori membawa sitasi sumber resmi di deskripsinya.

---

## 🌟 Peta Fitur Lengkap

### 🏛️ Portal & Infrastruktur Kepercayaan
- **13 Ekosistem terintegrasi** + alur perjalanan (journey) + roadmap 2026-2030
- **Trust Center 9 halaman**: Regulasi (+ Permenhaji No. 1 & 2/2025), Transparansi (+ 8 KPI
  target + roadmap operasional 4 fase), Etik Publik, Perlindungan Data Pribadi, Kalkulator DAM,
  Widget Verifikasi, Kesehatan Jamaah, **Posko Darurat** (nomor resmi Saudi + direktori SOS
  live: KJRI, KKI, RS — dari database), **Kemitraan** (master kemitraan Banten 2026–2030)
- **Direktori Anggota** terverifikasi + halaman detail per anggota + **Widget & QR verifikasi**
  publik — 2.507 anggota, setiap entri membawa sitasi sumber resmi
- **Statistik Nasional** transparansi + **Global Search ⌘K** (Ctrl/⌘+K, satu kotak cari semua entitas)
- **Berita, Tutorial bertingkat (Pemula/Menengah/Mahir), Agenda, Galeri, Unduhan, Pengaduan,
  Lacak Tiket** — semua ber-CMS

### 🛒 Garis v6 — Ekosistem Hulu-Hilir
- **Marketplace Paket** (`#/paket`) — katalog paket umrah/haji anggota + halaman detail + pipeline
  **booking paket** dengan verifikasi + **peta kursi & waitlist otomatis** + **itinerary harian**
- **Forum Jamaah** (`#/forum`) — diskusi per topik + balasan + **moderasi CMS** + **anti-spam
  ber-skor 0–100** (tautan, kapital, kata terlarang, duplikat, frekuensi)
- **Kartu Jamaah Digital QR** (`#/kartu`) — kartu identitas jamaah per rombongan, pemindaian
  verifikasi (`#/pindai` juga memindai izin)
- **Pusat Bisnis B2B** (`#/bisnis`) — **bursa kursi** (seat exchange antar penyelenggara),
  **direktori vendor** (+ skor kualitas 0–100 & grade A–D), **registry muthowif**, **kepatuhan &
  compliance docs**, **jamaah docs**
- **Brankas Jamaah** (`#/vault`) + **Trip Composer** — susun itinerary per segmen
- **Pindai Izin 360°** (`#/pindai`) — ⭐ *god mode*: masukkan **NIB/nomor izin** → mesin
  `license-engine` membuka dossier kelengkapan **BPW/PPIU/PIHK/IATA/akreditasi** + checklist
  prioritas **a–l**, tertaut mitra sertifikasi
- **Ulasan (reviews)** jamaah per penyelenggara

### 🎓 Garis v11 — Keanggotaan Power Pack
- **KTA Digital** (`#/kartu-anggota`) — kartu anggota otomatis untuk semua anggota terverifikasi,
  **poin & PointLedger** (lintas layanan: akademi, referal, **checkout +1 poin per Rp 10.000**),
  **kode referal** (approve pendaftaran = poin ke perujuk), verifikasi publik `#/verifikasi-kta/KTA-…`
- **Manasik Academy** (`#/academy`) — kursus trilingual berjenjang + **quiz** + **sertifikat
  digital ber-QR** (`#/verifikasi-sertifikat/SERT-…`)
- **Booking Slot Layanan** (`#/booking`) — kelas manasik, konsultasi syariah, klinik vaksin —
  kapasitas & jadwal terkelola
- **Benefit & Poin** (`#/benefit`) — katalog benefit mitra + penebusan poin KTA (BNF)
- **Paspor Haji Digital** (`#/paspor`) — identitas jamaah ber-QR + verifikasi lapangan
  `#/verifikasi-paspor/PH-…`
- **GPS Tracking Rombongan** (`#/tracking`) — peta **Leaflet** real-time + riwayat **GpsPing**
  per device
- **Tur Virtual 360°** (`#/tur-virtual`) — Photo Sphere Viewer panorama situs suci, multi-scene
  (**TourScene**)
- **WhatsApp AI Bot** (`#/whatsapp-ai`) — otak bot + **webhook `/api/whatsapp/webhook`**
  ber-`X-Webhook-Token`, balasan otomatis bisa dimatikan dari CMS (`botEnabled`)

### 🛡️ v12.1 — God-Mode Izin Compliance Checker
- **Compliance Center** (`#/compliance`) — ⭐ *god mode tier max*: papan kepatuhan **seluruh
  perusahaan registri** dihitung live oleh engine Pindai Izin 360° — **skor 0–100**, **grade
  A–E**, **level risiko** (RENDAH→KRITIS), **tren antar-audit**, dan **dossier drill-down** per
  perusahaan (checklist a–l berwarna status + rekomendasi berprioritas + tren skor) — publik & transparan
- **Audit god-mode dari CMS** (modul *Compliance Checker*) — satu klik menilai registri penuh,
  menyimpan snapshot **ComplianceScore** (riwayat tren) + **temuan berprioritas**
  (`ComplianceFinding`, tier 0 darurat … 4 nilai tambah) + agregat **ComplianceAudit**, lalu
  meneruskan ringkasan ke sekretariat via **Email & WhatsApp** (saklar `notifyCompliance`)
- **Deep-link** `#/compliance?q=<companyId>` membuka dossier langsung · menu **PERIZINAN →
  Compliance Center** · i18n 3 bahasa penuh

### 🗺️ v12.2 — 99 Roadmap Upgrade
- **99 item granular, 6 pilar** — *Pengalaman Jamaah (18) · Akademi & KTA (16) · Marketplace &
  Bisnis (17) · Platform & Teknologi (18) · Keamanan & Kepatuhan (15) · Ekosistem &
  Pertumbuhan (15)* — di bawah 4 fase makro 2026-2030
- **Status jujur per v12.5**: 45 *Sudah hidup* · sisanya *Dikerjakan/Direncanakan* — dengan
  **prioritas P0–P3**, **upaya S/M/L/XL**, dan **target versi v12.2→v20** per item
- **Seksi portal interaktif** (`#/tentang`) — statistik, **bar progres 45/99**, filter pilar &
  status, grid kartu ber-animasi Reveal, CTA *usulkan upgrade ke-100* via WA resmi
- **Modul CMS** (*Roadmap 99 Upgrade*) — CRUD penuh via CrudManager: kode unik `R-001…R-099`,
  pilar, prioritas, status, target, urutan
- Model **RoadmapItem** + API publik `GET /api/roadmap/items` + CRUD admin · i18n 3 bahasa penuh

### 🔐 v12.3 «AMANAH» — Sprint Keamanan (P0 Roadmap)
- **2FA TOTP per akun admin** (`R-074`) — implementasi RFC 6238 mandiri (`node:crypto`, tanpa
  dependensi baru): setup **QR authenticator** + kode manual di CMS (*Keamanan Akun*), kode 6
  digit/30 detik, **tantangan saat login** (tanpa sesi dibuat sebelum kode benar), verifikasi
  timing-safe ±1 langkah, audit `2FA_ENABLE/DISABLE`
- **Kebijakan sandi + lockout brute-force** (`R-075`) — sandi wajib huruf+angka (dari daftar
  sandi umum ditolak) di semua titik set-password; **5× gagal/15 menit per email → kunci 15
  menit** (kode 2FA salah ikut terhitung), rate-limit login **10×/menit per IP**, peristiwa
  penguncian masuk jejak audit
- **Backup terjadwal + drill pemulihan** (`R-063`) — `bun run backup`: snapshot SQLite →
  **integrity_check + hitung baris tabel kunci** (pemulihan terbukti) → retensi 14 snapshot
  terakhir; contoh crontab produksi terdokumentasi

### 💳 v12.4 «LUNAS» — Sprint Transaksi (P0 Roadmap)
- **Checkout lengkap paket** (`R-010`) — panel *Pesan & Bayar Sekarang* di halaman detail paket →
  **Order PENDING** bernomor `ORD-YYYYMMDD-XXXX` + intent pembayaran; validasi slot live,
  rate-limit, snapshot harga/paket (histori transaksi abadi tanpa FK)
- **Payment gateway pola adapter** (`R-038`) — satu kontrak `PaymentAdapter` di `src/lib/payment.ts`;
  **provider SANDBOX aktif** (uji tanpa uang riil), **webhook `/api/payments/callback`
  ber-signature HMAC-SHA256** (`x-muhdin-signature`, timing-safe), **idempoten** (replay callback
  aman, invoice tak digandakan), transisi atomik `updateMany` guard anti-race — sejak v12.6.1
  webhook **fail-closed di produksi tanpa `PAYMENT_WEBHOOK_SECRET`** (terverifikasi HTTP 401);
  Midtrans/Xendit riil = 1 file adapter + kredensial `.env`
- **Invoice PDF otomatis** (`R-039`) — terbit saat LUNAS bernomor seri `INV-…`: **pdfkit native**
  (header brand, rincian pesanan, tabel, total, **QR lacak** menuju `#/pesanan`) · diunduh jamaah
  via `/api/invoices/<INV>?phone=…` (verifikasi 8 digit WA) maupun admin CMS
- **Lacak pesanan publik** (`#/pesanan`[?no=…]) — status + pembayaran + unduh invoice + **tombol
  bayar sandbox** (hanya mode SANDBOX, verifikasi nomor WA pemesan) · i18n 3 bahasa
- **CMS Pesanan & Invoice** — 4 kartu statistik (total/lunas/menunggu/pendapatan), filter status,
  aksi *batalkan · buka · refund · unduh invoice* (RBAC SUPER_ADMIN/ADMIN/VERIFIKATOR)

### 🌐 v12.5 «SINERGI» — Sprint Tuntas 15 Item Roadmap
- **SEO teknis penuh** (`R-057`) — **sitemap.xml dinamis** (paket + artikel dari DB, fallback
  aman), robots dinamis (fix konflik file publik), **landing page SSR** `/paket/[slug]` (JSON-LD
  Product + Offer IDR) & `/artikel/[slug]` (JSON-LD Article) dengan metadata lengkap, **OG image
  dinamis** `next/og` (`/api/og?title=…&kind=…`), metadataBase + JSON-LD Organization/WebSite,
  slug & gambar paket otomatis
- **Media WebP + lazy load** (`R-058`) — komponen **SmartImage** (IntersectionObserver, skeleton
  shimmer, fade-in, **fallback WebP→asli**; sejak v12.6.1 sumber aktif dihitung saat render —
  bebas cascading render & tahan ganti-`src`), pipeline `sharp` 13 aset (**hemat 23%**), terpasang
  di galeri, berita & katalog paket
- **Konten edukasi SEO** (`R-091`) — meta judul/deskripsi/keywords per artikel di CMS, backfill
  otomatis, 3 artikel pilar (manasik, tips memilih paket, checklist keberangkatan)
- **Impor CSV massal** (`R-059`) — `POST /api/import` (upsert subscribers/artikel, append
  pendaftaran/pesan) parser tahan kutip+BOM+CRLF, laporan per baris, tombol **Impor CSV** di CMS
- **Help Center** (`R-095`) — `#/bantuan`: pencarian terpadu yang langsung menyaring FAQ, chip
  populer, 4 kategori belajar + 4 layanan cepat + CTA kontak (i18n 3 bahasa)
- **UU PDP operasional** (`R-078`) — **consent wajib** pendaftaran & checkout (tersimpan
  `pdpConsentAt`), **formulir Hak Subjek Data** di `#/privasi` → antrean `PrivacyRequest`
  (SLA 3×24 jam), CMS **Permintaan PDP** dengan catatan wajib (bukti kepatuhan)
- **Rate-limit adaptif** (`R-073`) — pelanggaran lintas bucket per IP: **≥3 penolakan/10 menit →
  blocklist backoff berlipat (5→60 menit)** yang menolak semua endpoint, log `security`, teruji
  lintas-bucket
- **Anti-spam forum** (`R-082`) — **skor spam 0–100** (tautan, kapital, kata terlarang, duplikat
  & frekuensi 10 menit): ≥60 ditolak 422, 30–59 antrean moderasi prioritas; skor+alasan tampil
  di CMS
- **Observability** (`R-062`) — logger JSON ring-buffer 250, `/api/metrics` (uptime, memori,
  latensi DB, antrean kerja, statistik adaptif), CMS **Kesehatan Sistem** auto-refresh 30 detik
- **Broadcast WA terjadwal** (`R-094`) — template `{{nama}}/{{tanggal}}`, 3 audiens opt-in,
  draf/jadwal/kirim via CMS **Broadcast & Vendor**, worker crontab idempoten (klaim atomik),
  hitungan terkirim-gagal
- **Skor kualitas vendor** (`R-047`) — 60% ulasan jamaah + 25% kesehatan keluhan + 15% aktivitas
  katalog → **skor 0–100 & grade A–D** tersimpan per anggota
- **Poin KTA lintas layanan** (`R-013`) — order LUNAS otomatis **+1 poin per Rp 10.000**
  (`reason BOOKING`, gagal-aman) menyusul akademi & referral; satu ledger, tier dihitung ulang
- **Itinerary harian interaktif** (`R-009`) — timeline hari-ke-hari (`ItineraryDay`) dengan lokasi
  berwarna, editor CMS replace-all atomik, 5 paket contoh terisi
- **Seat map & waitlist otomatis** (`R-040`) — peta kursi grid terisi/kosong di detail paket,
  **daftar tunggu berperingkat** + **auto-tawaran WA** saat slot dibebaskan (klaim atomik anti ganda)
- **PostgreSQL dual-ready** (`R-056`) — audit terotomatisasi `scripts/check-postgres-ready.ts`:
  **69 model tipe standar**, nol raw SQL khusus SQLite di aplikasi, panduan migrasi terdokumentasi

### 🏆 v12.6 «AUDIT 2026» — Kesiapan Go-Live

Empat kajian (Kajian Strategis MUHDIN × NUSUK, Alur ARMINA 12 langkah, Audit Kesiapan MUHDIN.ID,
Master Kemitraan Banten 2026–2030) diimplementasikan **seluruhnya** — detail lengkap di
`docs/AUDIT-2026-11-15.md`:

| # | Tuntutan Audit | Implementasi |
|---|---|---|
| 1 | Rekalkulasi biaya/harga ("100% gratis") | 52 klaim absolut diganti bahasa model biaya transparan di 12 file; halaman baru **`#/biaya`** (koreksi jujur, struktur biaya per fase, sumber pembiayaan, komitmen transparansi) |
| 2 | Data kontak resmi (placeholder) | Bagian **"Kanal Resmi & Terverifikasi"** di `#/kontak`: 4 kanal terverifikasi, cara verifikasi kanal, peringatan akun tidak resmi + tombol lapor |
| 3 | Integrasi payment gateway resmi | Halaman **`#/pembayaran`**: status kanal QRIS/VA/E-Wallet (sandbox aktif, produksi terjadwal fase 6–12 bulan) — sesuai adapter Midtrans/Xendit yang ada |
| 4 | Alur transaksi nyata (quote-to-cash) | 6 langkah alur baku di `#/pembayaran`: penawaran → kontrak digital → pembayaran via gateway → invoice → rekonsiliasi |
| 5 | Pemisahan dana jamaah | Bagian escrow di `#/pembayaran`: dana jamaah terpisah dari dana operasional, rekonsiliasi & audit trail |
| 6 | Keamanan data (enkripsi/backup) | Halaman **`#/keamanan`**: kontrol aktif (webhook fail-closed, rate limiter, kredensial aman, audit statis) + roadmap (TLS aktif, at-rest terjadwal, backup/DR RPO≤24h RTO≤4h, least privilege) |
| 7 | Uji penetrasi & audit sistem | Program pentest pra-go-live + kuartalan di `#/keamanan` (lingkup, OWASP Top 10/ASVS, eksekutor, tindak lanjut) + responsible disclosure (security@muhdin.web.id, respons ≤3 hari) |
| 8 | Perjanjian efektif nyata (MoU/SLA) | Tabel **Perjanjian & SLA** di `#/kemitraan` dengan status jujur (draf/target publik/terjadwal) — tidak ada klaim perjanjian yang belum nyata |
| 9 | Demo & test account (UAT) | Bagian UAT di `#/keamanan`: uji kasus (checkout sandbox, verifikasi, DSAR), akun demo hanya via Sekretariat, laporan UAT dipublikasikan |
| 10 | KPI & roadmap operasional | Dashboard **8 KPI** (≥100 anggota, ≥1.000 paket, ≥95%, ≤3 hari, refund tertulis, invoice 100%, uptime ≥99,5%, insiden data = 0) + roadmap 0–30/31–60/61–90 hari/skala penuh di `#/transparansi` |

**4 halaman baru**: `#/kemitraan` (4 pilar Kanwil/IPHI/KBIHU/MUHDIN.ID, FKK Banten 7 divisi,
ekosistem bisnis 10 lini, target 2030: 5.000 mitra · 500 KBIHU · 10.000 UMKM · Rp 10 T · 5+
provinsi, basis hukum, SLA, roadmap 2026–2030) · `#/pembayaran` · `#/keamanan` · `#/biaya`.

**6 halaman ditingkatkan**: `#/transparansi` (+8 KPI + roadmap operasional), `#/alur` (+Program
Umroh Plus ARMINA 12 langkah/3 tahap), `#/nusuk` (+integrasi resmi bukan penggantian: arsitektur
6 simpul, batas tegas), `#/kontak` (+kanal resmi terverifikasi), `#/regulasi` (+Permenhaji No. 1
& No. 2 Tahun 2025), **footer global** (badge biaya fase awal + disclaimer kepatuhan: visa/izin/
permit tetap melalui Kementerian Haji dan Umrah RI & Nusuk Saudi).

**Infrastruktur**: kamus i18n baru `audit13.ts` (~260 kunci × 3 bahasa), 4 menu KEPERCAYAAN baru
(grup kini 9 tautan), footer TRUST_LINKS +4, sitemap +8 entri, router +4 case.

### 🛠️ v12.6.1 — Hardening Teknis (Task 26 & 27)
- **Typecheck ketat** — 58 error TypeScript dibersihkan termasuk **2 bug runtime nyata**:
  pagination `parseIntOr` salah parse di 4 endpoint (muthowif & seat-exchange) dan
  `mode: "insensitive"` yang tidak didukung SQLite di quiz/poin sertifikat; `next.config.ts`
  kini `ignoreBuildErrors: false` — error tidak lagi lolos diam-diam ke produksi
- **Webhook pembayaran fail-closed** — tanpa `PAYMENT_WEBHOOK_SECRET`, semua callback ditolak
  HTTP 401 di produksi (sandbox/dev tetap jalan dengan kunci lokal otomatis)
- **First-run bootstrap** — `bun run setup`: db push + seed otomatis **kalau** DB belum ada
  (aman dijalankan berkali-kali); seed tidak lagi hardcoded ke path mesin lama; modul
  `scripts/_db.ts` dibuat ulang
- **Kredensial demo tidak bocor** — password default `muhdin2026` tidak lagi tampil plaintext
  di halaman login admin
- **ESLint 0 problem** (Task 27) — `SmartImage` di-refactor ke **derived state** (sumber aktif
  dihitung saat render, bukan `setState` sinkron di effect → bebas cascading render
  `react-hooks/set-state-in-effect` + perbaikan bug gambar lenyap saat `src` berganti setelah
  visible: observer kini dipasang ulang otomatis); 5 directive `eslint-disable` mati dihapus
- **Verifikasi penuh** — `tsc --noEmit` 0 error · `eslint .` 0 problem · `bun run build` sukses
  · smoke test GET `/`, `/api/members`, `/api/stats/public` semua 200 · 10 halaman audit di-
  screenshot & diperiksa visual

### 🤖 Kecerdasan Buatan
- **Sahabat MUHDIN** — AI concierge mengapung di semua halaman publik (trilingual, tahu batas:
  menyarankan WA resmi & halaman verifikasi, tidak mengarang regulasi)
- **AI Content Studio** di CMS — redaksi artikel berbantuan AI (topik → draf 350-500 kata)
- **Penerjemah Cerdas** — sinergi translate-engine untuk konten DB ×3 bahasa

---

## 🧭 Peta Halaman Publik (60+ rute)

SPA hash-router (`#/…`) — satu shell, semua halaman; daftar nyata diambil dari
`src/components/muhdin-app.tsx`:

| Grup | Rute |
| --- | --- |
| **Utama** | `#/beranda` · `#/ekosistem` · `#/layanan` · `#/tentang` · `#/dashboard` · `#/peta-situs` |
| **Kepercayaan (Trust Center)** | `#/transparansi` · `#/regulasi` · `#/etik` · `#/privasi` (UU PDP + hak subjek data) · `#/kalkulator` (DAM) · `#/widget` · `#/darurat` (posko SOS) · `#/sehat` · `#/kemitraan` 🆕 |
| **Anggota & Pendaftaran** | `#/anggota` · `#/daftar` · `#/gabung` (lookup izin otomatis) · `#/syarat` · `#/dpd` · `#/pengurus` (Struktur DPP 2026–2031) · `#/komunitas` (18 Kanal WhatsApp) 🆕 · `#/mitra` |
| **Layanan Digital** | `#/paket` · `#/pindai` (Izin 360°) · `#/lookup` · `#/forum` · `#/kartu` · `#/bisnis` · `#/vault` · `#/compliance` · `#/nusuk` · `#/ppiu-pihk` |
| **Keanggotaan v11** | `#/kartu-anggota` (KTA) · `#/academy` · `#/booking` · `#/benefit` · `#/paspor` · `#/tracking` · `#/tur-virtual` · `#/whatsapp-ai` |
| **Verifikasi Publik** | `#/verifikasi` · `#/verifikasi-kta/KTA-…` · `#/verifikasi-paspor/PH-…` · `#/verifikasi-sertifikat/SERT-…` |
| **Konten & Bantuan** | `#/berita` · `#/tutorial` · `#/agenda` · `#/galeri` · `#/unduhan` · `#/faq` · `#/bantuan` (Help Center) · `#/kontak` |
| **Transaksi & Pelaporan** | `#/pesanan` (lacak + bayar sandbox) · `#/lacak` (tiket) · `#/lapor` (pengaduan) |
| **Go-Live Audit 🆕** | `#/pembayaran` · `#/keamanan` · `#/biaya` · `#/alur` (ARMINA 12 langkah) |
| **SEO (SSR, di luar SPA)** | `/paket/[slug]` · `/artikel/[slug]` · `/sitemap.xml` · `/robots.txt` · `/api/og` |

Halaman admin berada di `#/admin` (32 modul, lihat [Keamanan dan RBAC](#-keamanan-dan-rbac)).

---

## 💬 Notifikasi: 13 Kejadian × 2 Kanal

| Kejadian | Email | WhatsApp |
| --- | --- | --- |
| Pesan kontak (`CONTACT`) | ✅ | ✅ |
| Pendaftaran anggota +nomor urut live (`APPLICATION`) | ✅ | ✅ |
| Pengaduan jamaah (`COMPLAINT`) | ✅ | ✅ |
| Langganan newsletter (`SUBSCRIBER`) | ✅ | ✅ |
| Testimoni baru (`TESTIMONIAL`) | ✅ | ✅ |
| Enroll Akademi (`ACADEMY`) | ✅ | ✅ |
| Lulus quiz / sertifikat (`CERTIFICATE`) | ✅ | ✅ |
| Booking slot layanan (`BOOKING`) | ✅ | ✅ |
| Tebus benefit (`BENEFIT`) | ✅ | ✅ |
| Audit kepatuhan izin (`COMPLIANCE`) | ✅ | ✅ |
| Checkout: pesanan baru & lunas (`ORDER`) | ✅ | ✅ |
| **Auto-tawaran waitlist** (`WAITLIST`) | — | ✅ |
| **Broadcast terjadwal** (`BROADCAST`) | — | ✅ |

Provider email SMTP (App Password Gmail) + provider WA **FONNTE / WABLAS / CALLMEBOT (gratis) /
CUSTOM** — semua disaklarkan per-kejadian dari CMS (Notifikasi & WhatsApp), lengkap dengan
**NotificationLog** audit + tombol uji kirim. Semua pengirim (email & WA) dan kredensialnya
dikelola **via CMS ke database**, bukan environment variable — ganti provider tanpa deploy ulang.

---

## 🎨 Tema Gelap, PWA dan Animasi

Identitas visual **forest-gold**: hijau hutan pekat + aksen emas, pola islamic-pattern, watermark raksasa.

- **Gold divider beranimasi** di puncak footer + glow ambient + reveal-on-scroll (IntersectionObserver) di semua section
- **FAB WhatsApp** mengapung dengan denyut "online" emas — satu nomor resmi **+62 812-2234-5856** di seluruh portal (FAB, footer, kontak, dashboard, AI prompts, CMS)
- **Slot counter live** — penghitung pendaftar real-time (`/api/promo/counter`)
- **Dark mode** kelas `dark` + switcher tema bertahan via localStorage; **RTL penuh** saat bahasa Arab (`dir="rtl"` + `icon-flip` otomatis)
- **PWA installable** — service worker scope `/`, manifest + ikon apple, shell tetap tampil saat offline
- Skeleton loading, toast, dialog & sheet — semuanya komponen shadcn/ui yang konsisten

---

## 🚀 Jalankan Lokal

Prasyarat: [Bun](https://bun.sh) ≥ 1.1 (atau Node ≥ 20 + npm/pnpm).

```bash
# 1. Dependensi (postinstall otomatis generate Prisma Client)
bun install

# 2. Basis data — salin contoh env
cp .env.example .env         # SQLite dev: DATABASE_URL=file:./db/custom.db

# 3. First-run bootstrap (WAJIB pertama kali — v12.6.1)
bun run setup                # db push + seed inti OTOMATIS hanya kalau DB belum ada;
                             # aman dijalankan berkali-kali (skip bila data sudah ada)

# 4. Seed tambahan (idempoten — urutan bebas, optional)
bun prisma/seed-nusuk.ts             # hub Nusuk
bun prisma/seed-fitur-v5.ts          # marketplace + forum + kartu jamaah
bun prisma/seed-fitur-v6.ts          # pusat bisnis, brankas, SOS, vendor…
bun prisma/seed-fitur-v7.ts          # pindai izin 360°
bun scripts/seed-membership.ts       # KTA + poin + akademi + slot + benefit
bun scripts/seed-compliance.ts       # riwayat audit & tren kepatuhan izin (v12.1)
bun scripts/seed-roadmap99.ts        # 99 item roadmap upgrade 6 pilar (v12.2)
bun scripts/seed-duty-officer.ts     # roster Duty Officer 24/7 (v13.1, idempoten)
bun scripts/seed-kontak-resmi.ts     # WA resmi + kantor Jakarta/Tasikmalaya
bun scripts/seed-resource-lengkap.mjs

# 5. Jalan
bun run dev                  # → http://localhost:3000
```

Skrip produksi: `bun run build` (generate + next build + post-build) · `bun run start` ·
`bun run lint` · `bun run backup` · `bunx tsc --noEmit` · `bunx eslint .`

> 💡 **Modal awal penting**: kredensial SMTP/WA dikonfigurasi dari **CMS** (bukan `.env`) —
> setelah dev server hidup, buka `#/admin` → *Notifikasi & WhatsApp*, isi provider, tekan
> *uji kirim*. Provider WA gratis yang paling cepat diuji: **CALLMEBOT**.

---

## 🔑 Akun Demo CMS

| Peran | Email | Catatan |
| --- | --- | --- |
| Super Admin | `admin@muhdin.web.id` | Akses penuh 32+ modul + Kelola Admin |

> ⚠️ Sandi demo ada di `prisma/seed.ts` (untuk sandbox/demo lokal) dan **tidak lagi tampil
> plaintext** di halaman login (v12.6.1). **Ganti segera** bila portal dipasang di server
> publik: CMS → Kelola Admin → Ubah sandi. Login: `#/admin`. Untuk kebutuhan UAT klien,
> akun demo dibuat terpisah via Sekretariat (lihat `#/keamanan` → bagian UAT).

---

## ⚙️ Variabel Environment

Prinsip: **sesedikit mungkin di env, sisanya via CMS**. Yang wajib:

| Variabel | Wajib? | Fungsi |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Koneksi DB. Dev: `file:./db/custom.db` · Produksi: `postgres://…` |
| `PAYMENT_WEBHOOK_SECRET` | ⚠️ **Produksi wajib** | Kunci HMAC-SHA256 webhook `/api/payments/callback`. **Fail-closed**: tanpa variabel ini di produksi, SEMUA callback ditolak HTTP 401 (terverifikasi). Sandbox/dev otomatis pakai kunci lokal |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | — (R-011) | Kunci Web Push (generate sekali: `web-push generate-vapid-keys`). Tanpa ini kartu notifikasi disembunyikan secara anggun & broadcast mengembalikan `sent:0` |
| `BUILD_STATIC` | — | `1` saat build untuk shared hosting (export statis, locale awal `id`) |
| `NODE_OPTIONS` | — | sudah dibungkus di skrip (`--max-old-space-size=1300`) |

Kredensial SMTP, provider WA, secret webhook WA-AI (`botWebhookSecret`), pengaturan notifikasi
per-kejadian — semuanya **di CMS → database** (enkripsi sesi httpOnly, audit log per perubahan).
Template `.env.example` menyertakan contoh nilai.

---

## 🗄️ Strategi Database

Satu skema **69 model** (union dua garis + compliance checker + roadmap item + checkout/payment/
invoice + privacy/broadcast/itinerary/waitlist), dua mode jalankan:

| Mode | Provider | Cara |
| --- | --- | --- |
| **Dev/sandbox** (default) | SQLite | `DATABASE_URL=file:./db/custom.db` → `bun run setup` (push + seed otomatis) |
| **Produksi** (siap pakai) | PostgreSQL | Ganti provider di `prisma/schema.prisma` → `postgresql`, isi `DATABASE_URL=postgres://…`, `bunx prisma generate && bunx prisma db push`. Referensi migrasi data: `scripts/migrate-sqlite-to-postgres.mjs` + `scripts/verify-v111.mjs` (arsip contoh: `db/arsip-v11-sqlite.db`), konfigurasi CLI modern via `prisma.config.ts`, driver adapter `@prisma/adapter-pg` sudah tersedia di dependensi |

File live (`db/`) **tidak pernah** di-commit — berisi data runtime. Audit dual-ready
PostgreSQL otomatis: `bun scripts/check-postgres-ready.ts` (67 model tipe standar, nol raw SQL
khusus SQLite di aplikasi).

Kelompok model: **Auth & RBAC** (User, Role…) · **Keanggotaan** (Member, MembershipApplication +
referralCode, MemberCard, PointLedger) · **Perjalanan ibadah** (TourPackage, PackageBooking,
PilgrimCard, HajjPassport, GpsPing, TrackingDevice, ItineraryDay, WaitlistEntry) · **Komunitas**
(ForumThread, ForumReply, Testimoni…) · **Akademi** (AcademyCourse, AcademyEnrollment,
Certificate) · **Layanan** (ServiceSlot, SlotBooking, Benefit, BenefitRedemption) · **B2B
hulu-hilir** (SeatListing, Vendor, Muthowif, RegistryCompany/Doc, ComplianceDoc, JamaahDoc) ·
**Transaksi** (Order, PaymentIntent, Invoice) · **Kepatuhan & privasi** (ComplianceScore,
ComplianceFinding, ComplianceAudit, PrivacyRequest) · **Nusuk** (NusukConnection, NusukPermit,
NusukSyncLog) · **Konten & kepercayaan** (Article, Tutorial, FAQ, Agenda, Gallery, Resource,
RegionalBranch, SosPoint…) · **Notifikasi & ops** (EmailSetting, WhatsAppSetting, NotificationLog,
AiChatLog, Broadcast).

---

## 🧱 Arsitektur Sistem

```
┌──────────────────────────────────────────────────────────────────┐
│  BROWSER — SPA hash-router (#/…) · PWA · dark/light · ID/EN/AR   │
│  Global Search ⌘K · AI Concierge · WA FAB · slot counter live    │
└──────────────────────────────┬───────────────────────────────────┘
                               │ /api/* (Next.js Route Handlers)
┌──────────────────────────────▼───────────────────────────────────┐
│  NEXT.JS 16 — src/app/api (159 route) · guardRole RBAC ·         │
│  rateLimit adaptif (blocklist backoff) · logAudit · logger JSON  │
│  ┌────────────┬─────────────┬──────────────┬─────────────────┐   │
│  │ Publik     │ Transaksi   │ Layanan      │ Trust & B2B     │   │
│  │ settings   │ checkout    │ academy      │ license-engine  │   │
│  │ members    │ payments    │ slots        │ sos-points      │   │
│  │ track      │ invoices    │ bookings     │ vendors/seat    │   │
│  │ verify     │ waitlist    │ benefits     │ compliance docs │   │
│  └────────────┴─────────────┴──────────────┴─────────────────┘   │
│  Notifier gagal-aman: email.ts + whatsapp.ts (13 kanal-kejadian) │
└──────┬───────────────────────┬─────────────────────┬─────────────┘
       │                       │                     │
┌──────▼──────┐        ┌───────▼───────┐     ┌───────▼────────┐
│ Prisma 6    │        │ SMTP / WA     │     │ z-ai-web-dev-  │
│ SQLite ↔ PG │        │ 4 provider    │     │ sdk (AI)       │
│ 67 model    │        │ + webhook bot │     │ concierge/bot  │
└─────────────┘        └───────────────┘     └────────────────┘
```

---

## 🔄 Alur Data Utama

**1. Pendaftaran anggota → KTA terbit ( referral poin otomatis )**

```
#/gabung ──► ketik nomor izin ──► lookup license-engine (NIB/KMA/U.xxx)
             nama+kota+provinsi terisi otomatis ◄── 1.392 anggota registri
    │
    ▼  POST /api/applications (+pdpConsentAt wajib)
Application PENDING ──► verifikasi CMS (VERIFIKATOR) ──► APPROVED
    │                       │ kode referal perujuk → +poin PointLedger
    ▼                       ▼
Member + MemberCard (KTA-…) ──► notifikasi EMAIL+WA ──► kartu QR tampil
```

**2. Checkout → invoice PDF (quote-to-cash, tuntutan audit #3–#5)**

```
#/paket/[slug] ──► panel Pesan & Bayar ──► POST /api/checkout (validasi slot
                  live + rate-limit + snapshot harga) ──► Order ORD-…-XXXX PENDING
    │
    ▼  adapter SANDBOX (Midtrans/Xendit = 1 file adapter)
Pembayaran ──► webhook /api/payments/callback (HMAC x-muhdin-signature,
               timing-safe, FAIL-CLOSED produksi, idempoten, updateMany atomik)
    │
    ├─► Order LUNAS ──► Invoice INV-… (pdfkit + QR lacak) ──► +poin KTA
    └─► Notifikasi EMAIL+WA ke sekretariat
```

**3. Audit kepatuhan god-mode (compliance loop)**

```
CMS Compliance Checker ──► 1 klik audit registri penuh
    ├─► ComplianceScore per perusahaan (skor 0-100, grade A-E, risiko)
    ├─► ComplianceFinding (tier 0 darurat … 4 nilai tambah) + rekomendasi
    ├─► ComplianceAudit agregat (tren antar-audit)
    └─► ringkasan ──► EMAIL + WA sekretariat
Papan publik #/compliance membaca snapshot terakhir — transparan real-time
```

---

## 🔌 Peta API

**159 route handler** — semua respons konsisten `ok()` / `fail()`, audit via `logAudit`,
dilindungi `guardRole` + `rateLimit` adaptif.

| Grup | Endpoint |
| --- | --- |
| Publik | `/api/settings` · `/api/members` (+verify) · `/api/track` · `/api/stats` (+public/insights) · `/api/rss` · `/api/search` · `/api/health` · `/api/promo/counter` · `/api/applications` (+live/track) |
| Transaksi v6 | `/api/packages` (+`[id]/itinerary` · `[id]/waitlist` +auto-offer) · `/api/package-bookings` · `/api/forum` (+replies/moderation, anti-spam) · `/api/pilgrim-cards` (+verify) · `/api/reviews` |
| Checkout v12.4 | `/api/checkout` (POST publik) · `/api/orders` (admin + agregat) · `/api/orders/[id]` (aksi admin) · `/api/orders/track` (publik) · `/api/payments/callback` (webhook HMAC fail-closed) · `/api/payments/simulate` (sandbox) · `/api/invoices/[number]` (PDF) |
| Sinergi v12.5 | `/api/import` (CSV massal admin) · `/api/privacy-requests` (+`[id]`, UU PDP) · `/api/metrics` (observability) · `/api/broadcasts` (+`[id]` send) · `/api/vendor-scores` (skor & recalc) · `/api/og` (OG image dinamis) · `/sitemap.xml` dinamis |
| B2B v6 | `/api/vendors` · `/api/seat-exchange` · `/api/muthowif` · `/api/license-registry` · `/api/license-scan` · `/api/compliance-docs` · `/api/jamaah-docs` · `/api/trip-composer` · `/api/sos-points` |
| Compliance v12.1 | `/api/compliance/scoreboard` (publik) · `/api/compliance/report?id=` (publik) · `/api/compliance/audit` (POST jalankan · GET riwayat — admin) |
| Layanan v11 | `/api/academy` (courses/enroll/quiz) · `/api/slots` (+book) · `/api/bookings` · `/api/benefits` (+redeem) · `/api/certificates/verify` · `/api/passport` (+verify/qr/public) · `/api/cards` (+verify) · `/api/tracking` (+history) · `/api/tour` (+view) |
| Nusuk | `/api/nusuk` (connection/permits/sync/rotate/logs/verify/webhook/public) · `/api/ppiu-pihk` (+sync) |
| Notifikasi | `/api/email-settings` · `/api/whatsapp` (+bot/webhook) · `/api/notifications` |
| CMS | `/api/articles` · `/api/tutorials` (+slug) · `/api/faqs` · `/api/testimonials` · `/api/messages` · `/api/complaints` · `/api/branches` · `/api/management` · `/api/ecosystems` · `/api/journey` · `/api/roadmap` · `/api/gallery` · `/api/agenda` · `/api/resources` · `/api/subscribers` · `/api/users` · `/api/audit` · `/api/backup` · `/api/export` · `/api/translations` · `/api/widget/verify` · `/api/ai/chat` · `/api/ai/ghostwrite` |

---

## 🌍 Internasionalisasi

- Tiga locale penuh: **Indonesia, English, العربية** — **52 file kamus** di
  `src/lib/i18n/locales/*.ts` (36+ modul + `audit13.ts` ~260 kunci hasil union dua garis + audit)
- Bahasa Arab = **RTL sungguhan**: `dir="rtl"` pada `<html>`, ikon membalik via `.icon-flip`,
  angka & telepon tetap `dir="ltr"`
- Locale bertahan lewat cookie `muhdin-locale` (1 tahun) — switcher di navbar + menu mobile;
  SSR membaca cookie agar `lang/dir` konsisten sejak render pertama (bebas hydration mismatch)
- Konten dari database (anggota, artikel, layanan) disimpan trilingual `{ id, en, ar }` +
  **Penerjemah Cerdas** di CMS untuk menerjemahkan sekali klik

---

## 🔐 Keamanan dan RBAC

- **4 peran** — SUPER_ADMIN · ADMIN · EDITOR · VERIFIKATOR — matriks `src/lib/roles.ts`
  mengatur 32+ seksi CMS
- Setiap API: `guardRole()` → 401/403 konsisten; **rate limit** per-IP untuk formulir publik +
  **blocklist backoff berlipat** lintas-bucket (5→60 menit); **logAudit** untuk semua aksi tulis
- Sandi hash (bcryptjs) + **kebijakan sandi** (huruf+angka, daftar sandi umum ditolak) +
  **lockout brute-force** 5× gagal/15 menit + **2FA TOTP** opsional per akun admin
- Sesi cookie httpOnly, manajemen admin (aktif/nonaktif, reset sandi) dari CMS
- Webhook pembayaran: **HMAC-SHA256 timing-safe + fail-closed produksi** (tanpa secret = tolak
  semua, HTTP 401)
- Webhook WA-AI diverifikasi header `X-Webhook-Token` (`botWebhookSecret`)
- Anti-spam forum ber-skor 0–100 + moderasi; consent PDP tersimpan per submission
- Nomor darurat & data PIC pihak ketiga dipisah dari kanal resmi (satu nomor WA resmi:
  **0812 2234 5856**) + halaman `#/keamanan` mempublikasikan program pentest & disclosure

---

## ✅ Jaminan Kualitas (QA Gates)

Keempat gerbang ini **wajib hijau** sebelum commit — semuanya teruji di v12.6:

| Gerbang | Perintah | Status v12.6 |
| --- | --- | --- |
| Typecheck ketat | `bunx tsc --noEmit` | **0 error** (58 error lama dibersihkan, `ignoreBuildErrors: false`) |
| Lint | `bunx eslint .` | **0 problem** (1 error hooks + 5 directive mati dibersihkan) |
| Build produksi | `bun run build` | **Sukses** (generate + next build + post-build standalone) |
| Smoke test | `bun run start` → GET `/`, `/api/members`, `/api/stats/public` | **semua 200** |
| Verifikasi visual | screenshot 10 halaman audit | **diperiksa** (kemitraan, pembayaran, keamanan, biaya, KPI, ARMINA, nusuk, kontak, regulasi, footer) |

QA tambahan yang pernah dijalankan dan terdokumentasi di `worklog.md`: E2E lookup izin (38
insert → lookup tetap normal), uji rate-limit lintas-bucket, uji webhook replay idempoten,
drill backup/restore (integrity_check + hitung baris), audit `check-postgres-ready.ts`.

---

## 📁 Struktur Proyek

```
src/
├── app/
│   ├── api/                # 159 route handler (lihat Peta API)
│   ├── page.tsx            # shell SPA (locale dari cookie, SSR konsisten)
│   ├── paket/[slug]/       # landing SSR + JSON-LD Product
│   └── artikel/[slug]/     # landing SSR + JSON-LD Article
├── components/
│   ├── muhdin-app.tsx      # router SPA utama (60+ rute)
│   ├── site/               # navbar, footer, FAB, global-search, tour-360,
│   │                       #   tracking-map, smart-image, slot-counter…
│   ├── views/              # 76 halaman portal (hash-router)
│   └── admin/              # 32 modul CMS
├── hooks/use-hash-route.ts # mesin hash-router + navigate()
├── lib/
│   ├── i18n/               # index + dictionaries + locales/ (52 file, 3 bahasa)
│   ├── license-engine.ts   # ⭐ mesin dossier izin (BPW/PPIU/PIHK, checklist a–l)
│   ├── payment.ts          # ⭐ adapter payment gateway (R-038) + webhook HMAC + applyPaid idempoten
│   ├── invoice-pdf.ts      # ⭐ generator invoice PDF (pdfkit + QR lacak)
│   ├── nusuk-engine.ts     # sinkronisasi & verifikasi Nusuk
│   ├── membership.ts       # KTA, poin, referal
│   ├── waitlist.ts         # auto-tawaran WA saat slot dibebaskan
│   ├── email.ts whatsapp.ts# notifier 13 kejadian × 2 kanal
│   └── api-helpers.ts audit.ts auth.ts ratelimit.ts roles.ts logger.ts…
└── generated/prisma/       # (opsional) client hasil generate
prisma/
├── schema.prisma           # 67 model — union dua garis + compliance + roadmap + checkout
├── seed.ts                 # seed inti + 1.392 anggota registri (sitasi sumber per baris)
└── seed-nusuk.ts seed-fitur-v5/v6/v7.ts
scripts/                    # setup-db, post-build, seed-*, optimize-images,
                            # broadcast-worker, check-postgres-ready, backup-db,
                            # migrate-sqlite-to-postgres, verify, cleanup-e2e…
shared-hosting/             # varian PHP murni (API tanpa Node) — lihat PANDUAN-SHARED-HOSTING.md
docs/                       # AUDIT-2026-11-15.md · PERBAIKAN-2026-11-15.md · aset banner
worklog.md                  # 27+ task tercatat lengkap (jejak pengembangan)
```

---

## 🧰 Skrip Referensi

| Skrip | Fungsi |
| --- | --- |
| `scripts/setup-db.mjs` | ⭐ First-run bootstrap (`bun run setup`): db push + seed inti hanya bila DB kosong — idempoten |
| `scripts/post-build.mjs` | Salin `.next/static` + `public` ke `.next/standalone` (otomatis di `bun run build`) |
| `scripts/dev-keep.sh` | Nyalakan/jaga dev server :3000 |
| `prisma/seed.ts` | Seed inti (idempoten, hapus-isi-ulang) + anggota registri bersitasi |
| `prisma/seed-fitur-v5/v6/v7.ts` | Seed marketplace/forum/kartu, bisnis/SOS, pindai izin |
| `scripts/seed-membership.ts` | KTA + poin + akademi + slot + benefit |
| `scripts/seed-compliance.ts` | Riwayat audit + tren kepatuhan izin (ComplianceAudit/Score/Finding) |
| `scripts/seed-roadmap99.ts` | 99 item upgrade 6 pilar (RoadmapItem — status jujur: 65 DONE per v13.2) |
| `scripts/panen-gabung-28.mts` | Import gabungan 7 sumber resmi → Member: dedupe nama + pengayaan kontak (2.507 anggota, idempoten) |
| `scripts/seed-duty-officer.ts` | Roster piket Duty Officer 24/7 (`bun run seed:duty`) |
| `scripts/test-role-matrix.mts` | R-079: uji matriks peran — pindai 159 route, guard valid, mutasi ter-guard (`bun run test:roles`) |
| `scripts/audit-deps.sh` | R-083: audit dependensi produksi — gagal bila ada critical (`bun run audit:deps`) |
| `scripts/backfill-seo.ts` / `seed-seo-content.ts` / `seed-itinerary.ts` | backfill meta SEO + 3 artikel pilar + itinerary 5 paket (semuanya idempoten) |
| `scripts/optimize-images.mjs` | konversi WebP `sharp` (13 aset, hemat 23%) |
| `scripts/broadcast-worker.ts` | eksekutor broadcast WA terjadwal (crontab, klaim atomik idempoten) |
| `scripts/check-postgres-ready.ts` | audit dual-ready PostgreSQL (69 model, nol raw SQL SQLite) |
| `scripts/backup-db.ts` | Snapshot + drill pemulihan + retensi 14 terakhir (`bun run backup`) |
| `scripts/seed-kontak-resmi.ts` | WA resmi 0812 2234 5856 + kantor resmi |
| `scripts/migrate-sqlite-to-postgres.mjs` | Migrasi 42+ tabel → Postgres (topologis, batch) |
| `scripts/verify-v111.mjs` | Verifikasi pasca-migrasi |
| `scripts/cleanup-e2e.ts` `test-license-engine.ts` | Utilitas QA |

---

## 📦 Deployment

### Opsi 1 — Vercel (+ PostgreSQL)
1. Push repo → [vercel.com/new](https://vercel.com/new) → Import.
2. Siapkan Postgres (Neon/Supabase/Prisma Postgres) → flip provider di `prisma/schema.prisma`
   → `postgresql`, set `DATABASE_URL` **dan `PAYMENT_WEBHOOK_SECRET`** di Environment Variables.
3. `bunx prisma db push` dari lokal (atau job build) → Deploy. Isi kredensial SMTP/WA dari CMS.

### Opsi 2 — VPS / Node self-host
`bun run setup && bun run build && bun run start` di belakang Nginx/Caddy (contoh `Caddyfile`
tersedia) + SQLite atau Postgres sesuai pilihan. Crontab yang disarankan:

```cron
# backup harian + drill pemulihan otomatis (retensi 14)
0 2 * * * cd /srv/muhdin && bun run backup >> backup.log 2>&1
# broadcast WA terjadwal (tiap 5 menit, idempoten)
*/5 * * * * cd /srv/muhdin && bun scripts/broadcast-worker.ts >> broadcast.log 2>&1
```

### Opsi 3 — Shared hosting PHP
Varian API PHP murni tanpa Node (`shared-hosting/`, `PANDUAN-SHARED-HOSTING.md`, `INSTALL.txt`)
untuk frontend statis + form gateway (build via `bun run hosting:build` + `hosting:pack`).

---

## 🚦 Checklist Go-Live Produksi

Ditetapkan Audit 2026 + hardening v12.6.1 — centang satu per satu:

1. [ ] **Infrastruktur**: deploy (3 opsi di atas), domain produksi + HTTPS aktif
2. [ ] **`PAYMENT_WEBHOOK_SECRET`** diset di environment (webhook fail-closed menolak semua
       callback tanpa ini — jangan sampai pembayaran lunas tidak terproses)
3. [ ] **Ganti sandi admin demo** (`prisma/seed.ts`) via CMS → Kelola Admin; aktifkan **2FA TOTP**
4. [ ] **PostgreSQL** dipilih untuk produksi (bukan SQLite) + backup terjadwal (`bun run backup`
       crontab) + drill restore pernah dijalankan sekali
5. [ ] **SMTP + provider WA** dikonfigurasi via CMS + tombol *uji kirim* hijau per kanal
6. [ ] **Broadcast worker** dipasang di crontab (jika fitur broadcast dipakai)
7. [ ] **Kanal resmi** terverifikasi di `#/kontak` sesuai kenyataan (WA, email, alamat kantor)
8. [ ] **Sitemap & SEO**: `/sitemap.xml` merespons dengan paket+artikel live; OG image muncul di
       preview share WhatsApp
9. [ ] **UAT** (bagian UAT di `#/keamanan`): checkout sandbox 1 transaksi end-to-end, verifikasi
       KTA/paspor/sertifikat, DSAR 1 permintaan privacy — laporan dipublikasikan
10. [ ] **MoU/SLA mitra** mulai ditandatangani (fase 0–30 hari roadmap operasional) — status
        tabel `#/kemitraan` diperbarui dari CMS sesuai progres
11. [ ] **Pentest pra-go-live** dijadwalkan (OWASP ASVS) — kanal disclosure `security@muhdin.web.id` aktif
12. [ ] **Monitoring**: `/api/metrics` + CMS Kesehatan Sistem dicek harian minggu pertama

---

## 🩺 Troubleshooting

| Gejala | Penyebab & Solusi |
| --- | --- |
| `bun run dev` error DB "table does not exist" | DB belum diboot: jalankan **`bun run setup`** (first-run wajib sejak v12.6.1) |
| Type error saat `bun run build` | Memang **disengaja** — typecheck kini ketat (`ignoreBuildErrors: false`). Perbaiki errornya (lihat pesan `tsc`), jangan matikan lagi gerbangnya |
| Webhook pembayaran selalu 401 | Produksi tanpa `PAYMENT_WEBHOOK_SECRET` = **by design ditolak** (fail-closed). Set secret di env, sinkronkan dengan konfigurasi gateway |
| Invoice PDF gagal diunduh publik | Verifikasi 8 digit terakhir nomor WA pemesan harus persis; admin CMS bisa unduh tanpa itu |
| Notifikasi tidak terkirim | Cek CMS → Notifikasi & WhatsApp → *NotificationLog* (alasan per kejadian), lalu tombol *uji kirim*; provider WA gratis (CALLMEBOT) punya kuota harian |
| Gambar WebP tidak muncul | SmartImage otomatis jatuh ke file asli via `onError` — berarti file `.webp` belum digenerate: jalankan `node scripts/optimize-images.mjs` |
| Login admin terkunci | Lockout 5× gagal/15 menit — tunggu 15 menit atau reset dari admin lain; kode 2FA salah ikut terhitung |
| Seed error path tidak ditemukan | Seed lama pernah hardcode path mesin lain — v12.6.1 sudah dinormalkan ke `scripts/_db.ts`; pastikan pull terbaru |
| Postgres `mode: "insensitive"` error | Sudah difix di v12.6.1 (quiz/poin sertifikat pakai filter aman lintas-provider) — pastikan memakai versi terbaru |

---

## ❓ FAQ Pengembang

**Q: Kenapa SPA hash-router, bukan App Router penuh untuk semua halaman?**
A: Warisan desain multi-target — hash-router membuat satu build bisa dijalankan di Next.js
maupun di-export statis untuk shared hosting PHP (`BUILD_STATIC=1`). Halaman yang butuh SEO
(paket, artikel) sudah diangkat ke App Router SSR dengan JSON-LD — pola hibrida terbaik dari
dua dunia.

**Q: Bagaimana menambah provider pembayaran riil (Midtrans/Xendit)?**
A: Tulis 1 file adapter yang mengimplementasikan kontrak `PaymentAdapter` di `src/lib/payment.ts`
(create intent + verifikasi webhook), daftarkan di factory, isi kredensial via env/CMS. Webhook
HMAC, idempotensi, dan transisi atomik Order sudah ditangani framework — detail di `.env.example`.

**Q: Bagaimana cara kerja lookup izin di `#/gabung`?**
A: `license-engine` menormalkan input (NIB 13/16 digit, KMA, U.xxx), mencocokkan ke 1.392 Member
registri, lalu menyusun dossier kelengkapan checklist a–l. Semua data registri punya kolom
`sumber` — bukan karangan; panen dilakukan dari HIMPUH, SATU HAJI Kemenag Jateng, dan AMPHURI
(terdokumentasi lengkap di `worklog.md` Task 23–26).

**Q: Apakah data 1.392 anggota itu asli?**
A: Ya — 3 sumber resmi publik (direktori HIMPUH, PDF resmi SATU HAJI Kanwil Jateng per 15
September 2025, direktori AMPHURI), dengan sitasi per baris di deskripsi anggota. Entri dengan
izin rusak/kosong **ditolak secara jujur** (44+ entri) sesuai prinsip anti-karang proyek.

**Q: Kenapa kredensial SMTP/WA di database, bukan `.env`?**
A: Sekretariat non-teknis yang mengganti provider/sandi — harus bisa tanpa deploy. Keamanan
dijaga RBAC + audit log; hanya SUPER_ADMIN/ADMIN yang bisa membaca mengubah.

**Q: Bagaimana menambah halaman baru?**
A: (1) buat view di `src/components/views/`, (2) daftarkan case di `muhdin-app.tsx`, (3) tambah
kunci i18n di `locales/*.ts` untuk ketiga bahasa, (4) masukkan STATIC_PAGES di sitemap bila
perlu. Contoh terbaru: `#/kemitraan` (commit audit 2026).

**Q: Bagaimana menambah item roadmap?**
A: CMS → *Roadmap 99 Upgrade* → tambah (kode `R-100`, pilar, prioritas, status jujur). Portal
`#/tentang` dan API publik otomatis ikut.

**Q: Kenapa tidak pakai ORM raw query untuk kecepatan?**
A: Prisma Client diangkat penuh + nol raw SQL khusus SQLite — itulah yang membuat dual-ready
PostgreSQL teraudit otomatis (`scripts/check-postgres-ready.ts`) dan migrasi provider hanya
ganti 1 baris.

---

## 🤝 Kontribusi & Konvensi

- **Branch**: `fitur/<topik>` atau `sempurnakan/<topik>` → Pull Request ke `main`
- **Commit**: bahasa Indonesia, prefiks jenis — `Task N: …` untuk sesi pengembangan,
  `Sempurnakan: …` untuk perbaikan, `Audit 2026: …` untuk implementasi kajian
- **Sebelum commit, 4 gerbang QA wajib hijau**: `tsc --noEmit` · `eslint .` · `bun run build` ·
  smoke test (lihat [Jaminan Kualitas](#-jaminan-kualitas-qa-gates))
- **Anti-lint-regression**: jangan menambah `eslint-disable` baru tanpa komentar alasan; yang
  mati (unused) dihapus otomatis oleh review
- **Worklog**: setiap sesi pengembangan dicatat di `worklog.md` — format `## Task ID N — Judul`,
  tanggal, kutipan permintaan, *Work Log* (temuan, bug & perbaikan, angka sebelum→sesudah),
  *Stage Summary*. Ini arsitektur ingatan proyek: baca Task 23–27 untuk melihat polanya
- **Anti-karang data**: tidak ada angka/anggota/klaim tanpa sumber; data tidak valid ditolak
  dan didokumentasikan, bukan diabaikan
- **Bahasa**: konten portal & commit dalam bahasa Indonesia; UI selalu trilingual sejak awal

---

## 📚 Dokumentasi Terkait

| Dokumen | Isi |
| --- | --- |
| `docs/AUDIT-2026-11-15.md` | Pemetaan lengkap 10 tuntutan audit go-live + 4 halaman baru + 6 ditingkatkan |
| `docs/PERBAIKAN-2026-11-15.md` | Detail 58 perbaikan TypeScript/keamanan/first-run (Task 26) |
| `docs/DATABASE.md` · `DATABASE.md` (root) | Strategi & skema database |
| `DEPLOYMENT.md` | Panduan deploy mendalam |
| `PANDUAN-SHARED-HOSTING.md` + `INSTALL.txt` | Deploy shared hosting PHP |
| `SECURITY.md` | Kebijakan keamanan & responsible disclosure |
| `CONTENT_GUIDE.md` | Pedoman konten portal ( nada, gaya, trilingual ) |
| `worklog.md` | 27+ task pengembangan tercatat lengkap |
| `.env.example` | Template environment produksi |

---

## 🧭 Garis Waktu Versi

| Versi | Sorotan |
| --- | --- |
| v3.1 | Portal + trust center + shared hosting PHP |
| v4.x | AI concierge, halaman detail, PWA, papan slot live |
| **v5.0** | **Marketplace Paket · Forum Jamaah · Kartu Jamaah QR** |
| **v6.0** | **Pusat Bisnis B2B · Brankas · Trip Composer · SOS · Vendor · Muthowif · Ulasan** |
| **v7.0** | **Pindai Izin 360° — mesin dossier NIB → checklist a–l** |
| v10 | Statistik nasional · global search ⌘K · tur 360° · tracking GPS |
| **v11.1** | **KTA + poin + referal · Akademi + sertifikat · Booking slot · Benefit · Paspor QR · WA-AI bot · notifikasi 9×2** |
| **v12.0 «GABUNG»** | **Union dua garis: 56 model, semua fitur hidup, satu CMS, tiga bahasa** |
| **v12.1 «GOD MODE»** | **God-Mode Izin Compliance Checker: scoreboard publik, grade A–E, risiko, tren antar-audit, audit CMS 1-klik, notifikasi 10×2** |
| **v12.2 «99 ROADMAP»** | **Peta jalan 99 upgrade granular × 6 pilar: portal interaktif + filter + progres, modul CMS CRUD, API publik, seed 99 item** |
| **v12.3 «AMANAH»** | **Sprint keamanan P0: 2FA TOTP admin, kebijakan sandi + lockout brute-force, backup terjadwal ber-drill — 27/99 roadmap selesai** |
| **v12.4 «LUNAS»** | **Sprint transaksi P0: checkout lengkap, payment gateway adapter (SANDBOX + webhook HMAC idempoten), invoice PDF ber-QR, CMS Pesanan & Invoice — 30/99 roadmap selesai** |
| **v12.5 «SINERGI»** | **Sprint tuntas 15 item: SEO penuh (sitemap+landing SSR+OG dinamis), WebP lazy, impor CSV, Help Center, UU PDP (consent+hak subjek), rate-limit adaptif, anti-spam forum, observability, broadcast WA, skor vendor, poin KTA lintas layanan, itinerary, seat map+waitlist, dual-ready Postgres — 45/99 roadmap selesai** |
| **v12.6 «AUDIT 2026»** | **Seluruh 10 tuntutan audit go-live terimplementasi: 4 halaman baru (kemitraan/pembayaran/keamanan/biaya), 6 halaman ditingkatkan, 52 klaim absolut dibersihkan, ARMINA 12 langkah, Nusuk 6 simpul, Permenhaji 2025, 8 KPI + roadmap operasional; hardening teknis: 58 error TS dibersihkan + typecheck ketat, webhook fail-closed, `bun run setup`, SmartImage bebas cascading render, ESLint 0 — QA gates lengkap hijau** |
| **v13.0 «GERBANG»** | **CI/CD GitHub Actions (verify·e2e) + suite E2E Playwright + Dashboard Omzet + Sesi & Device Management + Landing Kampanye Musiman SSR — 52/99 roadmap selesai** |
| **v13.1 «PANEN & PANTAU»** | **Direktori 2.507 anggota × 37 wilayah (7 sumber + Direktori Nasional 2.087, dedupe+pengayaan), Papan Status publik #/status, Duty Officer 24/7 #/darurat, NPS di Dashboard Omzet, role-matrix test 159 route di CI, audit dependensi otomatis, DR runbook — 61/99 roadmap selesai** |
| **v13.2 «SATU PINTU ORGANISASI»** | **Master Final DPP 2026–2031 di #/pengurus (4 dewan + 2 pilar + 15 bidang + 3 bidang khusus + 38 DPW + standar kerja), 18 Kanal WhatsApp resmi di #/komunitas (17+1, naskah siap-copas, pemetaan departemen, aturan Primary Membership), Web Push keberangkatan (R-011), Funnel analitik pendaftaran (R-093), pencarian fuzzy typo-tolerant (R-064), KTA tier berjenjang (R-028) — 65/99 roadmap selesai** |

---

> 🤲 *Dibangun dengan amanah untuk tamu Allah — Bersama Melayani Tamu Allah.*
> MUHDIN INDONESIA · muhdin.id · WA resmi +62 812-2234-5856 · Tanpa biaya pendaftaran di fase awal
