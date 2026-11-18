# Design System v2 — MUHDIN.ID

> R-066 (v14.0 «KAMPANYE & KAWAL»). Dokumen ini adalah rujukan resmi identitas visual
> portal MUHDIN. **Semua angka di sini diukur langsung dari kode** (tailwind.config.ts,
> src/app/globals.css, src/components/) — bukan klaim. Bila kode berubah, perbarui
> dokumen ini pada commit yang sama.

## 1. Lingkup & Sumber Kebenaran

| Lapisan | File |
| --- | --- |
| Token warna & radius | `src/app/globals.css` (CSS variables, oklch) + `tailwind.config.ts` (pemetaan utility) |
| Tipografi | `src/app/layout.tsx` (Google Fonts via next/font) + `globals.css` |
| Komponen primitif | `src/components/ui/` — **48 file** shadcn/ui |
| Komponen situs | `src/components/site/` — `icon.tsx`, `reveal.tsx`, `navbar.tsx`, `footer.tsx`, `smart-image.tsx`, dll. |
| Pola halaman | `src/components/views/` — **81 view** |
| Animasi | framer-motion (`reveal.tsx` — easing premium) |

## 2. Tipografi

| Peran | Font | Catatan |
| --- | --- | --- |
| UI utama | **Plus Jakarta Sans** (`--font-jakarta`) | seluruh UI, `--font-sans` |
| Fallback UI | Geist / Geist Mono | kode & angka teknis |
| Kaligrafi & Arab | **Amiri** (`.font-arabic`, `--font-arabic`) | teks Arab, kutipan syariah |
| Swap locale `lang="ar"` | **Noto Kufi Arabic** | seluruh UI otomatis saat bahasa Arab |

Aturan:
- Hierarki judul pakai `font-extrabold` + `tracking-tight`; label mata pakai
  `text-[10–12px] font-bold uppercase tracking-[0.18–0.2em] text-muted-foreground` (atau `text-gold` di atas hero gelap).
- Angka jumlah (statistik) diformat `formatNumberL10n` agar sesuai locale.

## 3. Token Warna (oklch — terukur dari globals.css)

### Mode Terang

| Token | Nilai oklch | Pemakaian |
| --- | --- | --- |
| `--background` | `0.995 0.002 120` | latar halaman (hampir putih hangat) |
| `--primary` | `0.51 0.125 158` | hijau utama (CTA, tautan aktif) |
| `--forest` | `0.34 0.088 163` | hijau hutan (blok konten, badge) |
| `--forest-deep` | `0.255 0.078 166` | hero gelap (tajuk setiap halaman portal) |
| `--gold` | `0.72 0.135 85` | emas aksen (highlight, ikon aksen) |
| `--gold-soft` | `0.9 0.07 90` | latar emas lembut |
| `--gold-deep` | `0.49 0.115 78` | teks emas di atas latar terang |

### Mode Gelap (`html.dark`)

| Token | Nilai oklch | Perbedaan |
| --- | --- | --- |
| `--background` | `0.17 0.02 165` | gelap kehijauan |
| `--primary` | `0.55 0.13 158` | sedikit lebih terang dari mode terang |
| `--gold` | `0.78 0.14 88` | lebih terang agar tetap terbaca |
| `--gold-deep` | `0.68 0.13 82` | naik drastis (di mode terang `0.49`) |
| `--forest` / `--forest-deep` | `0.31/0.215 …` | sedikit lebih gelap |

Aturan pemakaian:
- **Hijau = identitas & aksi utama; emas = penguji mata (aksen); tidak pernah emas sebagai warna tombol utama teks putih di latar terang** — gunakan `from-gold to-gold-deep` hanya pada CTA besar dengan teks putih.
- Status: `destructive` (merah, risiko/kesalahan), `muted` (netral), hijau emerald utility (`bg-emerald-500/10`) untuk keberhasilan/online.
- **Audit kontras Spectrum 8**: pasangan warna wajib lolos ≥ 4.5:1 (teks) / ≥ 3:1 (teks besar). Terdokumentasi inline di `globals.css` (catatan "--forest gelap INVISIBEL 1.36:1" → token diperbaiki).

## 4. Bentuk, Spasi, Layer

- Radius: `rounded-2xl` untuk kartu & panel (utama), `rounded-xl` kotak dalam, `rounded-full` chip/badge, `rounded-lg` input/navbar item.
- Bayangan: `shadow-sm` kartu statis → `shadow-md/lg` saat hover/CTA utama; hero tanpa bayangan.
- Spasi seksi: `py-12`–`py-16`, container `mx-auto max-w-7xl px-4 sm:px-6`.
- Latar hero portal: `bg-forest-deep text-white` + overlay `bg-islamic-pattern(-gold) opacity-40` (pola geometris islami, terukur di `globals.css` 189–199).
- Kartu: `rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-md` — satu pola untuk semua grid (kalender, komunitas, tutorial, FAQ).

## 5. Animasi (framer-motion — terukur dari reveal.tsx)

| Parameter | Nilai |
| --- | --- |
| Easing premium | `[0.21, 0.47, 0.32, 0.98]` (`EASE_PREMIUM`) |
| Durasi Reveal | `0.55 s` (SectionHeading item `0.6 s`) |
| Stagger antar anak | `0.08 s` (default `RevealGroup`) |
| Batas delay bertingkat | `Math.min(i * 0.03–0.05, 0.3–0.4)` di view grid |
| Progress/sparkline | animasi rAF sendiri (`duration` 1.8 s) |

Aturan: **tidak ada animasi > 0.6 s, tidak ada animasi pada data tabel CMS**, elemen yang
muncul berulang memakai `Reveal`/`RevealGroup`, bukan keyframe ad-hoc. `prefers-reduced-motion`
dihormati oleh framer-motion default.

## 6. Ikonografi

- Sumber: lucide-react lewat **registry tunggal `src/components/site/icon.tsx`** —
  **163 entri** terukur. Selalu `<Icon name="…" className="h-4 w-4" aria-hidden />`,
  jangan import ikon langsung dari lucide di view.
- Tambah ikon baru: import di atas + entri di map nama kebab-case; ikon tanpa pemakai
  = lint error (directive mati dicabut secara disiplin).
- Ikon aksi teks selalu di sisi depan teks; di mode RTL otomatis memakai `icon-flip`
  (chevron panah) — lihat pola navbar.

## 7. Pola Halaman Portal

1. **Hero forest-deep**: eyebrow gold uppercase → h1 `text-4xl font-extrabold` → subtitle
   `text-emerald-50/80 max-w-2xl` → strip statistik `rounded-2xl border-white/15 bg-white/5`.
2. **Grid konten**: kartu satu pola (bagian 4) dalam `grid gap-4 md:grid-cols-2 lg:grid-cols-3`.
3. **Badge status**: `Badge` shadcn + teks `[10px] font-bold`; warna mengikuti makna (AKTIF primary, NONAKTIF secondary, gagal destructive).
4. **CTA final**: pita `bg-gradient-to-r from-forest to-forest-deep` + tombol `from-gold to-gold-deep text-white`.
5. **Uji aksesibilitas fokus**: `focus-visible:ring-2 focus-visible:ring-gold` pada elemen interaktif kustom (LinkChip, dsb.).

## 8. Konvensi Kode yang Wajib Ditaati UI Baru

| Konvensi | Bukti |
| --- | --- |
| i18n dot-key tiga bahasa (`id/en/ar`), satu file locale per namespace | `src/lib/i18n/locales/*.ts` (59 file) |
| `data-testid` pada elemen uji E2E penting | `checkout-total`, `coupon-stats`, `kalender-month-1`, dll. |
| Angka rupiah via helper `rupiah()` / `formatNumberL10n` | checkout-panel, admin-coupons |
| Role & gating modul CMS hanya lewat `SECTION_ROLES` + `guardRole/guardAdmin` | `src/lib/roles.ts`, `src/lib/api-helpers.ts` |
| Rate limit semua endpoint publik yang menulis | `src/lib/ratelimit.ts` (adaptif) |
| Mutasi admin selalu `logAudit` | `src/lib/audit.ts` |

## 9. Do & Don't

**Lakukan**
- Pakai token (`bg-card`, `text-gold-deep`, `border-primary/25`) — bukan warna hex mentah.
- Kalimat UI dari kamus i18n, bukan hardcode (kecuali proper noun organisasi).
- Kartu baru mengikuti pola bagian 4; status baru harus punya badge + label di ketiga bahasa.

**Hindari**
- Animasi menggantikan feedback (selalu ada toast/teks keberhasilan).
- Warna emas pada teks kecil di atas latar terang tanpa `gold-deep`.
- Menambah file komponen ui/ langsung dari CLI tanpa menyesuaikan token.
- `eslint-disable` untuk menyembunyikan pelanggaran (disiplin repo: 0 problem).

## 10. Checklist Komponen/Halaman Baru

1. Token warna hanya dari globals.css (tidak ada hex baru).
2. i18n tiga bahasa lengkap (id/en/ar) + tidak ada key yang jatuh ke literal.
3. `data-testid` pada elemen kunci.
4. Reveal/stagger ≤ 0.6 s; tidak ada animasi di tabel CMS.
5. Mutasi terkait ter-guard + rate-limit + audit.
6. `tsc 0 · eslint 0 · build sukses · test:roles lolos` sebelum commit.
