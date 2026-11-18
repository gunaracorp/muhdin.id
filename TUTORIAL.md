# 📖 TUTORIAL LENGKAP PENGEMBANGAN MUHDIN.ID — Dari Hulu ke Hilir

> Panduan end-to-end untuk mengembangkan, menjaga kualitas, dan merilis portal
> MUHDIN.ID. Disusun Task 38 (18 November 2026) — v15.1.0 «LOGO RESMI».
>
> **Hulu** = menyiapkan lingkungan & memahami arsitektur · **Alur** = bekerja
> mengubah kode dengan aman · **Hilir** = QA, build, deploy, dan pemeliharaan.

---

## Daftar Isi

1. [Gambaran Umum & Teknologi](#1-gambaran-umum--teknologi)
2. [HULU — Menyiapkan Lingkungan](#2-hulu--menyiapkan-lingkungan)
3. [Arsitektur & Peta Kode](#3-arsitektur--peta-kode)
4. [ALUR — Workflow Pengembangan Harian](#4-alur--workflow-pengembangan-harian)
5. [Resep Sering Dipakai (How-To)](#5-resep-sering-dipakai-how-to)
6. [HILIR — QA Gates & Build Produksi](#6-hilir--qa-gates--build-produksi)
7. [Deploy](#7-deploy)
8. [Pemeliharaan & Operasional](#8-pemeliharaan--operasional)
9. [Troubleshooting](#9-troubleshooting)
10. [Konvensi Penting (Jangan Dilanggar)](#10-konvensi-penting-jangan-dilanggar)

---

## 1. Gambaran Umum & Teknologi

MUHDIN.ID adalah portal ekosistem umrah-haji digital: profil organisasi,
direktori & verifikasi penyelenggara (PPIU/PIHK), marketplace paket ibadah,
akademi, kartu jamaah digital (KTA), forum, compliance checker, hingga CMS
admin berbasis peran (RBAC).

| Komponen | Teknologi | Catatan |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19 | Output `standalone`, siap shared-hosting |
| Bahasa | TypeScript 5 (ketat, `tsc` wajib 0 error) | `bun run typecheck` |
| Styling | Tailwind CSS 4 + tema hijau-emas resmi | Token warna di `globals.css` |
| Database | Prisma 6 + SQLite (dev) ↔ Postgres (produksi) | `DATABASE_URL` di `.env` |
| i18n | 3 locale: ID (utama), EN, AR (RTL) | `src/lib/i18n/` — ada guard anti raw-key |
| Auth | Session cookie + RBAC 4 peran | SUPER_ADMIN, ADMIN, VERIFIER, USER |
| Notifikasi | Email SMTP + WhatsApp (4 provider + AI bot) | `src/lib/email.ts`, `src/lib/whatsapp.ts` |
| PWA | Manifest + service worker push | `public/manifest.webmanifest`, `public/sw.js` |
| CI/QA | GitHub Actions + skrip QA lokal | `.github/workflows/ci.yml` |

**Dua hal yang membuat proyek ini khas:**

- **Hash routing SPA di dalam App Router.** Konten portal memakai satu URL
  kanonik (`/#/paket`, `/#/berita`, dst.) yang ditangani view-switcher di
  `src/components/muhdin-app.tsx`. Landing page SEO nyata (`/paket/[slug]`,
  `/artikel/[slug]`) dirender SSR dan tercantum di `sitemap.ts`.
- **Branding terpusat.** Logo resmi yang sudah disahkan hidup sebagai aset
  turunan di `public/brand/` + `public/icons/` — digenerate dari karya master
  oleh `scripts/make-brand-assets.py`. Jangan menggambar ulang logo; jalankan
  skripnya.

---

## 2. HULU — Menyiapkan Lingkungan

### 2.1 Prasyarat

- **Node.js ≥ 20** (rekomendasi 24) — `node -v`
- **Bun** sebagai package manager & runner skrip — https://bun.sh
- Git, dan untuk deploy: akses hosting (lihat §7)

### 2.2 Clone & bootstrap (lima perintah pertama)

```bash
git clone https://github.com/gunaracorp/muhdin.id.git
cd muhdin.id

# 1. Dependensi
bun install

# 2. Environment lokal (SQLite)
echo 'DATABASE_URL=file:/absolut/ke/repo/db/custom.db' > .env

# 3. Skema + data demo sekali jalan (db push + seed)
bun run setup          # db/custom.db belum ada → prisma db push + seed

# 4. Dev server
bun run dev            # http://localhost:3000
```

Catatan penting:

- `bun run setup` **idempotent**: kalau `db/custom.db` sudah ada, ia tidak
  melakukan apa pun (seed bersifat destruktif — hanya untuk bootstrap awal).
  Pesan `[setup-db] Skema berubah? Jalankan: bun run db:push` adalah hint,
  bukan error — jalankan `bun run db:push` bila memang mengubah `schema.prisma`.
- Akun demo & kredensial lokal tercantum di `prisma/seed.ts` (cari
  `SUPER_ADMIN` untuk login CMS `#/admin`).
- **Jangan commit `.env`** — berisi jalur lokal; di produksi nanti berisi
  kredensial SMTP/gateway.

### 2.3 Perintah harian (cheat sheet)

```bash
bun run dev          # dev server (hot reload)
bun run typecheck    # tsc ketat — WAJIB 0 error
bun run lint         # eslint — WAJIB 0 problem
bun run build        # build produksi + salin statik ke .next/standalone
bun run db:push      # sinkronkan schema.prisma → database (tanpa seed)
bun run setup        # bootstrap DB pertama kali
bunx tsx scripts/test-i18n-merge.ts   # uji kamus i18n + guard kunci bertitik
```

---

## 3. Arsitektur & Peta Kode

### 3.1 Pohon direktori inti

```
muhdin.id/
├── prisma/
│   ├── schema.prisma        # ~100+ model — satu sumber struktur data
│   └── seed.ts              # data demo + akun CMS (bootstrap awal saja)
├── src/
│   ├── app/                 # App Router
│   │   ├── layout.tsx       # metadata global (OG, icons, manifest)
│   │   ├── sitemap.ts       # sitemap.xml dinamis (hash-SPA + landing SSR)
│   │   ├── api/             # ~90 grup route handler (REST-ish)
│   │   ├── paket/[slug]/    # landing SEO per paket (SSR)
│   │   └── artikel/[slug]/  # landing SEO per artikel (SSR)
│   ├── components/
│   │   ├── muhdin-app.tsx   # ⭐ view-switcher hash routing (route → view)
│   │   ├── views/           # semua "halaman" portal (61 view)
│   │   ├── site/            # chrome: navbar, footer, logo, search, PWA card
│   │   ├── admin/           # CMS panel (dilindungi RBAC)
│   │   └── ui/              # primitif shadcn/ui
│   └── lib/
│       ├── i18n/            # locale switcher + dictionaries (id/en/ar)
│       ├── db.ts            # Prisma client singleton
│       ├── api-helpers.ts   # ok()/fail()/guardRole() — pola wajib API
│       ├── email.ts         # SMTP + semua template email + audit log
│       ├── whatsapp.ts      # 4 gateway WA + template + AI bot helper
│       └── menu-data.ts     # peta menu navigasi (route → label)
├── public/
│   ├── brand/               # ⭐ aset logo resmi (logo-full, logo-emblem, og)
│   ├── icons/               # ikon PWA (192/512/maskable/apple-touch)
│   ├── manifest.webmanifest # manifest PWA (icon + background resmi)
│   ├── sw.js                # service worker push (cache: muhdin-push-sw-v2)
│   └── muhdin-badge.js      # widget badge verifikasi untuk situs mitra
├── scripts/                 # ratusan skrip QA/seed/audit (lihat §6)
└── worklog.md               # ⭐ jurnal Task 1..N — baca sebelum mulai
```

### 3.2 Alur satu request portal

1. Browser membuka `/#/paket` → App Router menyajikan shell (`page.tsx`
   statis) → `muhdin-app.tsx` membaca hash → memilih komponen view dari
   `views/`.
2. View memanggil API `src/app/api/...` via helper `apiGet/apiSend`
   (`src/lib/api-client`-gaya) → route handler menjalankan
   `guardRole()` (bila terlindungi) → Prisma query → `ok(data)`.
3. Teks di-render lewat `t("kunci.terjemahan")` dari `I18nProvider`
   — ID/EN/AR. Fallback ke ID lalu ke kunci mentah; di dev muncul
   `console.warn` bila kunci tidak ditemukan (guard Task 36).

### 3.3 Pola API wajib

```ts
// seluruh route handler mengikuti pola ini
import { ok, fail, guardRole } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "nama-aksi", 10, 60_000))
    return fail("Terlalu sering. Coba lagi nanti.", 429);
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;              // 401/403 terstruktur
  try {
    /* ... Prisma ... */
    return ok({ hasil });
  } catch (e) {
    return fail("Pesan ramah pengguna.", 500);
  }
}
```

**Aturan:** selalu `ok()`/`fail()` (bukan `NextResponse.json` mentah), selalu
`rateLimit` untuk mutasi publik, selalu `guardRole` untuk area admin, pesan
error dalam Bahasa Indonesia yang ramah.

### 3.4 i18n tiga bahasa

- Kamus per topik: `src/lib/i18n/locales/*.ts` — objek **bersarang**, bukan
  kunci bertitik (`layanan.items.bakornas.title`, bukan `"layanan.items.bakornas.title": "..."`).
- Kunci bertitik = bug: `lookup()` menelusuri objek bersarang, kunci bertitik
  tak terjangkau dan tampil mentah ke pengguna. Uji statis
  `scripts/test-i18n-merge.ts` akan **gagal** bila ada kunci bertitik kembali.
- Tiga bahasa harus paritas: tambahkan di `id`, lengkapi `en` & `ar` di commit
  yang sama. AR otomatis RTL (`dir="rtl"` oleh provider).

### 3.5 Branding & aset resmi

- Karya master: bintang geometri 8 sudut + monogram M emas + Kaaba + buku +
  wordmark (disahkan; backup di luar repo).
- Turunan digenerate `python3 scripts/make-brand-assets.py` (PIL):
  `public/brand/logo-full.png`, `logo-emblem.png` (512²), `og-emblem.png`,
  `public/icons/icon-{192,512,maskable-192,maskable-512}.png`,
  `apple-touch-icon.png`, `src/app/favicon.ico`, `public/logo.svg`.
- Komponen tunggal: `src/components/site/logo.tsx` (`MuhdinLogo`,
  `MuhdinBrand`) — navbar, footer, kartu KTA, admin semua memakai komponen ini.
- Warna resmi: tepi gradien `#000e06` (manifest background), tema situs
  `#0b5c3f`, emas `#d4af37`.

---

## 4. ALUR — Workflow Pengembangan Harian

### 4.1 Siklus satu "Task" (konvensi repo)

1. **Baca `worklog.md`** dari belakang (Task terbaru) — jangan mengulang
   pekerjaan, jangan menabrak keputusan sebelumnya.
2. Kerjakan perubahan kecil-kecilan tapi lengkap (kode + i18n 3 bahasa +
   README bila relevan).
3. **QA gates** (§6) sampai semuanya hijau.
4. Tulis entri `worklog.md` baru: judul versi/Task, tanggal, ringkasan
   pekerjaan, hasil QA gates, stage summary.
5. Satu commit per Task, pesan commit mengikuti format:
   `Task N: vX.Y.Z «NAMA» — ringkasan satu baris`.
6. Push ke `origin/main`.

### 4.2 Menambah/ubah fitur konten (view baru)

1. Buat komponen view di `src/components/views/<nama>-view.tsx`.
2. Daftarkan `case "<nama>":` di view-switcher `muhdin-app.tsx`.
3. Tambahkan route + label di `src/lib/menu-data.ts` (muncul di navbar).
4. Semua teks lewat `t()` — tambahkan kunci di tiga locale.
5. Kalau view butuh data: tambahkan model Prisma (bila perlu) → `db:push` →
   route API dengan pola §3.3.

### 4.3 Mengubah skema data

```bash
# 1. edit prisma/schema.prisma (tambah model/field)
bun run db:push        # sinkron ke SQLite lokal
# 2. regenerasi client terjadi otomatis oleh db:push
# 3. seed data tambahan → buat skrip scripts/seed-*.ts terpisah (idempotent)
```

Prinsip: **jangan** mengubah `prisma/seed.ts` untuk data yang sudah ada di DB
pengguna — seed lama destruktif. Data penuh baru = skrip seed terpisah.

### 4.4 Mengubah API

- Cek dulu **122 panggilan frontend** tetap terlayani — audit cepat:

```bash
# semua "/api/..." yang dipanggil frontend harus punya route.ts
grep -rhoE '"/api/[a-z0-9/-]+"' src/components src/lib \
  | tr -d '"' | sort -u \
  | while read -r p; do
      sub="${p#/api/}"
      [ -e "src/app/api/$sub/route.ts" ] || echo "MISSING: $p"
    done
```

Output kosong = aman. (Task 38: audit ini menemukan & menutup 2 endpoint
hilang — jadikan kebiasaan sebelum commit.)

### 4.5 Mengubah teks i18n

1. Cari kunci: `grep -rn "kunci.anda" src/lib/i18n/locales/`.
2. Ubah di **ketiga** locale sekaligus.
3. `bunx tsx scripts/test-i18n-merge.ts` — harus `kunci bertitik: 0` dan
   semua lookup ✓.

### 4.6 Komponen admin (CMS)

Panel `#/admin` dijaga `guardRole` + matriks peran
(`scripts/test-role-matrix.mts` — 194 route teruji). Setiap modul admin baru
wajib: route API ber-guard, halaman di `src/components/admin/`, entri menu
per-peran, dan jalankan `bun run test:roles` bila menyentuh RBAC.

---

## 5. Resep Sering Dipakai (How-To)

### 5.1 Mengganti logo (sudah resmi — jangan ubah karya master)

```bash
# taruh karya master di upload/, lalu:
python3 scripts/make-brand-assets.py     # generate 10+ turunan
bun run build                            # favicon.ico ikut diproses Next
# jika ikon berubah → naikkan cache SW: public/sw.js → muhdin-push-sw-vN+1
```

### 5.2 Menambah endpoint email/WhatsApp notifikasi

- Email: gunakan `sendSecretariatEmail()` / template `email*Template()`
  di `src/lib/email.ts` — jangan import nodemailer langsung di route.
- WhatsApp: `sendWhatsAppMessage()` (admin) atau `sendWhatsAppToNumber()`
  (broadcast opt-in) — hasil `{sent, detail}` dicatat ke
  `lastTestAt/lastTestStatus` + `logNotification()`. Contoh:
  `src/app/api/whatsapp/test/route.ts`.

### 5.3 Kartu share (OG) per halaman

OG dinamis: `/api/og?title=…&sub=…&kind=paket` (`src/app/api/og/route.tsx`)
— emblem resmi disematkan sebagai data-URI. Landing SSR (`paket/[slug]`)
menit-tautkan OG ini via `generateMetadata`.

### 5.4 Menambah data demo/seed tanpa merusak

Buat `scripts/seed-<topik>.ts`, idempotent (upsert, bukan create), jalankan
manual `bunx tsx scripts/seed-<topik>.ts`. Contoh pola: `scripts/seed-v5/`.

### 5.5 Widget badge verifikasi untuk mitra

Sudah jadi: `public/muhdin-badge.js` — satu baris `<script>` di situs mitra,
menarik `/api/widget/verify`. Jangan menambah dependensi; badge harus tetap
self-contained.

---

## 6. HILIR — QA Gates & Build Produksi

### 6.1 Gerbang wajib sebelum commit (semuanya harus hijau)

```bash
bun run typecheck                          # 0 error
bun run lint                               # 0 problem
bun run build                              # sukses, standalone siap
bunx tsx scripts/test-i18n-merge.ts        # kunci bertitik: 0
bun run test:roles                         # bila menyentuh RBAC/API
```

### 6.2 Audit visual semua route (anti-regresi)

Skrip `crawl-audit.sh` (di workspace agent; port sesuaikan) membuka 61 route
dan memeriksa per halaman: teks kunci mentah, gambar rusak, request ≥400,
konten kosong. Prinsip yang sama mudah dijalankan manual:

```bash
bun run build && (bunx next start -p 3100 &)
# buka tiap route dari menu-data.ts; periksa:
#  - body tanpa pola /^[a-z]+(\.[a-zA-Z0-9_-]+)+$/ (raw key)
#  - img.naturalWidth === 0 → gambar rusak
#  - performance resource responseStatus ≥ 400
#  - locale EN & AR: switch cookie muhdin-locale → tetap bersih
```

### 6.3 Build produksi

```bash
bun run build
```

Hasil: `.next/standalone/` (server.min.js + static + public tersalin oleh
post-build). Mode ini yang dipakai deploy shared-hosting/Node. Skrip
`scripts/build-shared-hosting.mjs` menyiapkan paket khusus shared hosting
(folder `src/app/api` dibuang di mode export — kartu share memakai gambar
statis tema).

---

## 7. Deploy

### 7.1 Node hosting / VPS / container (disarankan)

```bash
bun run build
# jalankan standalone:
node .next/standalone/server.js        # PORT=3000 default
# env produksi minimal:
#   DATABASE_URL=postgres://…   (Postgres, lihat §7.3)
#   NEXT_PUBLIC_SITE_URL=https://muhdin.web.id
#   SMTP_* / WA token (lihat CMS → Pengaturan, tersimpan di DB)
```

Jangan lupa reverse proxy HTTPS (Nginx/Caddy) + sertifikat. `favicon.ico`,
`/icons/*`, `/brand/*` sudah di dalam standalone.

### 7.2 Shared hosting (Node app cPanel)

1. `bash scripts/build-shared-hosting.mjs` → paket export tanpa API dinamis.
2. Upload paket, arahkan subdomain ke folder keluaran.
3. Fitur yang butuh API dinamis (CMS mutasi) tidak aktif di mode ini —
   gunakan §7.1 untuk pengalaman penuh.

### 7.3 Migrasi SQLite → Postgres

1. `DATABASE_URL` → URL Postgres di `.env` hosting.
2. `npx prisma db push` (schema sama, driver berubah otomatis).
3. Migrasi data: `scripts/backup-db.ts` untuk dump SQLite; import sesuai
   kebutuhan. `scripts/check-postgres-ready.ts` memverifikasi kesiapan.

### 7.4 Pasca-deploy checklist

- [ ] `/api/status` → `ok:true`, `version` benar, `db.ok:true`
- [ ] `/#/beranda` tampil + logo resmi di header & favicon di tab
- [ ] `/#/admin` login demo → ganti password SUPER_ADMIN
- [ ] CMS → Pengaturan Email: tombol **Email Uji** terkirim
- [ ] CMS → WhatsApp: tombol **Pesan Uji** terkirim
- [ ] `/api/og` dan `/sitemap.xml` merespons 200
- [ ] PWA: install di HP → ikon resmi muncul

---

## 8. Pemeliharaan & Operasional

- **Uptime monitor eksternal** cukup memantau `GET /api/status` (endpoint
  mencatat riwayat 60 sampel sendiri).
- **Backup**: `scripts/backup-db.ts` + drill restore (v12.3 «AMANAH»).
- **Keamanan berkala**: `bun run pentest` (31 butir), `bun run audit:deps`,
  matriks peran `bun run test:roles`. Jalankan rutin tiap rilis besar.
- **Rotasi kredensial**: token GitHub/SMTP/gateway WA diperbarui via CMS
  (tersimpan di DB, token WA selalu dimasking di UI).
- **Update konten harian** (paket, artikel, agenda): lewat CMS `#/admin`,
  bukan lewat kode — kode hanya untuk perubahan perilaku.

---

## 9. Troubleshooting

| Gejala | Sebab umum | Solusi |
|---|---|---|
| `P1012` prisma saat dev | `.env` tidak ada / jalur salah | buat `.env`, `DATABASE_URL=file:/absolut/db/custom.db` |
| Halaman data kosong | DB belum di-seed | `bun run setup` (jika baru) / cek `bun run db:push` |
| `db:push` error uniqueness | skema berubah di DB lama | periksa diff schema; backup dulu via `backup-db.ts` |
| Teks tampil `a.b.c.title` | kunci i18n tidak ada / bertitik | tambah kunci di 3 locale; jalankan `test-i18n-merge` |
| Ikon PWA lama di HP | cache service worker | naikkan `CACHE` di `public/sw.js` (v2 → v3) |
| Tombol admin "Gagal menguji" | SMTP/gateway belum disetel | CMS → Pengaturan; endpoint uji mengembalikan `detail` penyebab |
| Build gagal di favicon | frame ICO bukan RGBA | regenerasi via `make-brand-assets.py` (sudah RGBA) |
| `next dev` mati mendadak (OOM) | memori sandbox kecil | pakai `bun run build` + `next start` untuk audit berat |
| 404 saat frontend memanggil API | route belum dibuat | audit §4.4; buat route mengikuti pola §3.3 |

---

## 10. Konvensi Penting (Jangan Dilanggar)

1. **Logo resmi tidak digambar ulang** — hanya digenerate dari karya master
   (`make-brand-assets.py`); komponen tunggal `MuhdinLogo`.
2. **Tiga bahasa selalu paritas** — tidak ada kunci bertitik; uji statis
   menjaga.
3. **QA gates lima langkah** sebelum setiap commit — tanpa kecuali.
4. **Satu Task, satu commit, satu entri worklog** — riwayat adalah dokumen.
5. **Seed destructif hanya untuk bootstrap** — data lanjutan lewat skrip
   idempotent terpisah.
6. **Pola API §3.3** — ok/fail, rateLimit, guardRole, pesan Indonesia.
7. **`.env` tidak pernah masuk git** — kredensial via CMS/env hosting.
8. **Hash routing adalah identitas navigasi** — view baru wajib terdaftar di
   view-switcher + menu-data; landing SSR baru wajib masuk `sitemap.ts`.

---

*Disusun ulang setiap kali arsitektur berubah. Koreksi/penambahan = satu Task
baru + entri worklog, sesuai konvensi §4.1.*
