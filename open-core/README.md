# MUHDIN Open Core (R-099)

Modul inti MUHDIN yang diekstraksi sebagai **pustaka sumber-terbuka** untuk
ekosistem digital umrah-haji Indonesia. Tujuan: penyelenggara lain, asosiasi
daerah, dan developer komunitas dapat mengadopsi pola tata kelola yang sama
(RBAC, kartu QR terverifikasi, engine compliance) tanpa menyerahkan data
mereka kepada pihak ketiga.

## Isi paket

| Modul | Sumber di repo | Fungsi |
| --- | --- | --- |
| `rbac.ts` | `lib/auth.ts` + matriks peran | Peta peran → modul CMS (SUPER_ADMIN/ADMIN/EDITOR/VERIFIKATOR) + helper `canAccess` |
| `qr-payload.ts` | generator kartu jamaah | Encode/parse payload QR `MHD-…` tervalidasi (deterministik, tanpa PII sensitif) |
| `compliance-rules.ts` | engine compliance checker | Aturan kelengkapan & kedaluwarsa dokumen izin → skor kepatuhan 0–100 |
| `ledger.ts` | `lib/refund.ts`, kas grup (R-049) | Prinsip pencatatan ganda sederhana: INCOME/EXPENSE + saldo, gagal-aman |

Semua modul **murni** (tanpa import DB/framework) sehingga bisa dipakai di
server maupun browser, dan bisa diuji tanpa infrastruktur.

## Pemakaian

```ts
import { canAccess, encodeQrPayload, parseQrPayload, scoreCompliance } from "./open-core";

canAccess("EDITOR", "faqs");                    // true — editor boleh kelola FAQ
const qr = encodeQrPayload({ kind: "CARD", code: "MHD-2026-0123", ts: 1763443200 });
parseQrPayload(qr);                             // { ok: true, data: {...} }
scoreCompliance([{ kind: "NIB", expiresAt: "2027-01-01" }]); // { score: 100, ... }
```

## Prinsip open core

1. **Inti terbuka, data tetap milik organisasi** — tidak ada telemetri, tidak
   ada koneksi keluar; modul hanya logika.
2. **Sumber kebenaran tunggal** — modul di `open-core/` adalah referensi;
   implementasi live di `src/lib` tetap sumber perilaku aplikasi. Perubahan
   perilaku inti menyeberangkan kedua sisi.
3. **Lisensi** — MIT (lihat `open-core/LICENSE`) agar asosiasi daerah bebas
   mengadopsi dengan atribusi.

## Roadmap paket

- [ ] Ekstraksi engine refund berjenjang (5 tier) ke `refund.ts`
- [ ] Uji otomatis `bun test open-core/` saat repo menambah runner test
- [ ] Publikasi sebagai paket npm `@muhdin/open-core` setelah v15 stabil
