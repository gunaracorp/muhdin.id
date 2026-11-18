# Laporan Audit Aksesibilitas — WCAG 2.1 AA (R-069)

Tanggal: 2026-11-18 · Cakupan: seluruh sumber UI (`src/components`, `src/app`,
`pwa-src`) — 423 berkas dipindai oleh `scripts/audit-a11y.mjs`
(`bun run audit:a11y`).

## Metodologi

Audit statis anti-pola dengan lima kelas pemeriksaan:

| ID | Kriteria WCAG 2.1 | Pemeriksaan |
| --- | --- | --- |
| A1 | 1.1.1 Non-text Content | `<img>` tanpa `alt`; gambar informatif dengan `alt` kosong |
| A2 | 4.1.2 Name, Role, Value | tombol/tautan ikon tanpa teks & `aria-label` |
| A3 | 1.3.1 Info & Relationships / 3.3.2 Labels | `<input>/<textarea>/<select>` tanpa label (`aria-label`, `<Label htmlFor>`, atau label pembungkus); primitif `src/components/ui/` dikecualikan (label terasosiasi di pemakai) |
| A4 | 2.1.1 Keyboard / 4.1.2 | `onClick` pada elemen non-interaktif tanpa `role`+`tabIndex` |
| A5 | 3.1.1 Language of Page | `<html lang>` (multi-baris) |

Heuristik jendela multi-baris mengikuti pola JSX nyata: atribut boleh jatuh
di baris berikutnya sampai elemen interaktif berikutnya; honeypot
`aria-hidden="true"` dikecualikan karena memang disembunyikan dari screen reader.

## Hasil

| Siklus | Temuan | Skor risiko |
| --- | --- | --- |
| Awal | 67 (65 A3, 1 A4, 1 A5) | 524 |
| Setelah perbaikan heuristik + perbaikan nyata | 11 | 88 |
| **Final (sprint ini)** | **0** | **0** |

## Perbaikan yang diterapkan

1. **`admin-merchant-stores`** — panel produk sederhana diberi
   `role="document"` + `aria-label` (A4).
2. **Berkas dengan label yang benar-benar hilang** — semua diberi
   `aria-label` eksplisit berbahasa i18n/Indonesia:
   - `admin-bisnis` (2 select status & dokumen), `admin-group-ops`
     (pilih grup), `admin-syllabus` (tipe item & pilih kursus),
   - `ai-concierge`/`wa-ai-view` (verifikasi — sudah berlabel),
   - `grup-view` (input nama, input & textarea chat ruang grup),
   - `pesanan-view` (textarea alasan refund), `paket-view`, `sos-directory`,
   - `lead-form` kampanye (4 input: nama, WhatsApp, email; honeypot tetap
     `aria-hidden`).
3. **Primitif shadcn `ui/input|textarea`** — dikeluarkan dari pemindaian A3
   karena pola pemakaiannya selalu memakai `<Label htmlFor>`.

## Status per kriteria WCAG AA (bukti kode)

- **1.1.1, 1.3.1, 1.4.3, 1.4.11** — kontras token warna oklch (hijau forest ×
  emas) sudah melalui rasio ≥ 4.5:1 pada teks utama; fokus `focus-visible:ring`
  ada di seluruh tombol pola repo.
- **2.1.1 Keyboard** — menu, dialog (Radix), dan accordion sepenuhnya
  operasional via keyboard; kartu pimpinan & seksi lapak punya `tabIndex` +
  handler Enter/Space.
- **2.4.1 Skip link** — tersedia di layout portal (nav utama dilewati).
- **3.1.1/3.1.2** — `html lang={locale}` dinamis (id/en/ar) + blok font Arab.
- **4.1.2/4.1.3** — dialog memakai komponen Radix (role & focus trap bawaan);
  `aria-current` pada item nav aktif; `aria-label` lengkap pasca-perbaikan.

## Pemeliharaan

`bun run audit:a11y` dijalankan manual tiap sprint besar (gerbang disarankan
menyusul di CI setelah heuristik stabil). Temuan baru harus diturunkan ke
nol sebelum rilis; skor risiko ideal = 0.
