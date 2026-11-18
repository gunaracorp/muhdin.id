# Perbaikan & Penyempurnaan — 15 November 2026

Ringkasan pekerjaan penyempurnaan website muhdin.id. Semua perubahan sudah
diverifikasi: `tsc --noEmit` **0 error**, `next build` **sukses** dengan
typecheck ketat, dan smoke test runtime (homepage, API stats, API search,
webhook) **hijau**.

## 1. TypeScript: 58 error dibersihkan, typecheck ketat diaktifkan

`next.config.ts` sebelumnya `ignoreBuildErrors: true` — error TypeScript
tersembunyi dan ikut ter-ship ke produksi. Semua error kini diperbaiki dengan
benar (bukan `any` buta) dan flag dinonaktifkan:

- **`parseIntOr` tidak di-import** (5×) → `api/muthowif`, `api/muthowif/[id]`,
  `api/seat-exchange`, `api/seat-exchange/[id]` — query pagination `?page`
  sebelumnya **gagal runtime** bila dipanggil.
- **`mode: "insensitive"` di SQLite** → `api/academy/quiz` — Prisma+SQLite tidak
  mendukung filter ini; query poin sertifikat akan **throw saat runtime**.
  Diganti pencocokan email eksak + fallback lowercase eksplisit.
- **State salah tipe** → `admin/admin-bisnis.tsx` —
  `useState<(typeof emptyRegDoc)[]>` mendeklarasikan array of **function**;
  diganti `ReturnType<typeof emptyRegDoc>[]` (12 error sekaligus).
- **Typing role chat** → `site/ai-concierge.tsx`, `api/whatsapp/webhook`
  (`role: "user" as const`).
- **Prop/field tak ada** → `pindai-view` (`sub`→`subtitle`, buang `icon`),
  `site/global-search` (+`number?: number` pada tipe hasil ekosistem),
  `paspor-view` (`export type VerifyData`, +`lastVerifiedAt` — dipakai UI
  `passport-verify-view` dan memang dikembalikan API),
  `views/sitemap-view` (type-predicate filter `MENU_NODES`),
  `views/mitra-dashboard` (hapus blok `loading` yang unreachable),
  `api/stats/public` (tipe `byProvince` disesuaikan data riil),
  `api/import` (`nib` masuk payload — sebelumnya create gagal validasi),
  `api/passport/[no]/qr` (`Uint8Array<ArrayBuffer>` untuk BodyInit TS 5.9).
- **Tooling** → `examples/websocket`, `mini-services/registration-gateway`
  (cast `process.on` untuk sinyal Node di bawah bun-types),
  `scripts/check-postgres-ready` (regex flag `s` di atas target ES2017),
  `scripts/gen-banner-bg` (cast ukuran kustom ke tipe SDK),
  `scripts/seed-membership` (tipe tuple 2-elemen sesuai pemakaian),
  `scripts/seed-v5/*` + `scripts/_db.ts` (modul `_db` yang hilang dibuat ulang).

## 2. Keamanan

- **Payment webhook fail-closed** (`src/lib/payment.ts`): sebelumnya secret
  fallback `muhdin-sandbox-<env>` dipakai juga di produksi → siapa pun yang baca
  source bisa memalsukan callback pembayaran. Kini produksi **tanpa**
  `PAYMENT_WEBHOOK_SECRET` menolak semua callback (HTTP 401, terverifikasi).
  Sandbox lokal tetap bisa uji. `.env.example` diperbarui.
- **Password default keluar dari UI**: halaman login admin tidak lagi menampilkan
  `muhdin2026`/`verifikator2026` plaintext (publik terlihat!); kartu keamanan
  dashboard juga dirapikan. Sumber kredensial tetap di `prisma/seed.ts`.
  *Rekomendasi lanjutan (butuh keputusan pemilik): rotasi password admin saat
  go-live dan hapus kredensial demo dari build shared-hosting.*
- Catatan: `NEXT_PUBLIC_*` lain, `admin@muhdin.web.id`, tetap sebagai identifier.

## 3. Bootstrap database first-run

- **`bun run setup`** (baru, `scripts/setup-db.mjs`): kalau `db/custom.db`
  belum ada → `prisma db push` + seed demo; kalau sudah ada → tidak menyentuh
  data (seed bersifat destruktif). Mengatasi P1012 saat clone baru tanpa `.env`
  (prisma.config.ts melewati auto-load env).
- **`prisma/seed.ts`**: fallback `DATABASE_URL` tidak lagi hardcoded ke
  `/home/z/my-project/...` (path mesin developer lama) — kini relatif cwd.
- **`scripts/_db.ts` + `scripts/seed-v5/_db.ts`**: modul Prisma untuk skrip
  seed-v5 yang sebelumnya hilang (import rusak).

## Verifikasi yang sudah dijalankan

1. `bun install` — 938 paket.
2. `npx tsc --noEmit` — 0 error (sebelumnya 56 tampil + 2 tertutup).
3. `bun run setup` — DB dibuat + seed sukses.
4. `bun run build` — sukses dengan `ignoreBuildErrors: false`.
5. Smoke test `bun .next/standalone/server.js` (produksi):
   - `GET /` → 200, 325 KB;
   - `GET /api/stats/public` → data seed utuh;
   - `GET /api/search?q=umrah` → hasil artikel;
   - `POST /api/payments/callback` tanpa signature di produksi → **401**.

## Belum diubah (saran langkah berikutnya)

- Rotasi kredensial demo saat go-live (butuh keputusan pemilik).
- `reactStrictMode: false` masih default proyek — bisa diaktifkan nanti bila
  siap menangani efek ganda di dev.
- Test suite formal belum ada; `tests/` berisi skrip integrasi build.
