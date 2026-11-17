# Runbook Pemulihan Bencana (Disaster Recovery) — MUHDIN.ID

> v13.1 — R-084 «Disaster Recovery Runbook». Playbook bertahap dengan kontak
> eskalasi dan target RTO/RPO yang jelas. Latihan restore backup wajib 1× per kuartal
> (bukti latihan dicatat di worklog.md).

## 1. Lingkup & Mitra

| Sistem | Media | Lokasi | Cadangan |
| --- | --- | --- | --- |
| Portal MUHDIN (Next.js) | Kode + build | GitHub `gunaracorp/muhdin` + hosting | Git commit riwayat penuh |
| Database utama | SQLite `db/custom.db` | Disk server hosting | `db/backups/` via `bun run backup` (retensi teratur) |
| Database uji | `db/e2e.db` | Lokal/CI | dibuat fresh tiap CI |
| Kredensial ops | `.env` | Server (tidak di-commit) | Simpan salinan terenkripsi di manajer rahasia sekretariat |

## 2. Target Pemulihan

| Metrik | Target | Catatan |
| --- | --- | --- |
| **RPO** (kehilangan data maksimal) | ≤ 24 jam | backup harian; bila beban tinggi, backup per transaksi penting |
| **RTO** (lama pemulihan) | ≤ 2 jam | restore DB + redeploy + smoke test |

## 3. Kontak Eskalasi (berjenjang — lihat juga `#/darurat` Duty Officer)

1. **Petugas TI Jaga** (sortOrder 1–3) — respons ≤ 15–30 menit (model `DutyOfficer`, diperbarui via CMS API).
2. **Koordinator Sistem Sekretariat** — WA resmi **0812 2234 5856** (`BRAND` di `src/lib/constants.ts`).
3. **Pengurus Harian** — keputusan komunikasi publik (halaman status `#/status` & pengumuman).

## 4. Prosedur P1 — Gangguan Ringan (halaman/API lambat atau 5xx sebagian)

1. Cek `#/status` dan `GET /api/health` (200 = hidup; 503 = DB gagal).
2. Cek log aplikasi (`dev.log` / log hosting) + `/api/metrics` di CMS (antrean, rate-limit).
3. Gangguan kueri lambat → jalankan ulang proses aplikasi (restart runtime).
4. Verifikasi ulang `/api/status` — catat waktu pemulihan di worklog.

## 5. Prosedur P2 — Database Rusak / Kehilangan Data

1. **Stop** proses aplikasi (hindari penulisan ke DB rusak).
2. Identifikasi backup terakhir sehat: `ls db/backups/` (nama berisi tanggal).
3. Restore: ganti `db/custom.db` dengan salinan backup (uji dulu di salinan:
   `sqlite3 /tmp/test.db "PRAGMA integrity_check;"`).
4. `bun run db:generate && bun run start` (atau restart runtime hosting).
5. Smoke test: `#/status`, `GET /api/health`, satu transaksi uji (pesanan demo).
6. Anggap backup hilang `≤ RPO` — catat rentang data yang perlu re-entry.

## 6. Prosedur P3 — Server/Hosting Hilang Total

1. Clone repo: `git clone https://github.com/gunaracorp/muhdin.git && cd muhdin`.
2. `bun install` (postinstall menjalankan `prisma generate`).
3. Pulihkan `.env` (dari manajer rahasia) + DB dari backup terakhir → `db/custom.db`.
4. `bun run build && bun run start` (pola shared-hosting: `bun run hosting:pack`).
5. Arahkan DNS bila pindah server; verifikasi `#/status` + `/api/health`.
6. Jalankan `bunx tsx scripts/seed-roadmap99.ts` & `seed-duty-officer.ts` bila DB butuh seed ulang.

## 7. Prosedur P4 — Kompromi Keamanan (dugaan kebocoran/akses liar)

1. **Isolasi**: matikan sesi aktif dari CMS (Keamanan Akun → Sesi & Perangkat → revoke).
2. Rotasi kredensial: sandi semua admin (kebijakan sandi ketat), token WA/email di `.env`.
3. Audit jejak: tabel audit log (`logAudit`) — identifikasi aksi aneh.
4. Bila data pribadi terpengaruh → jalankan prosedur insiden UU PDP (`#/pdp`): notifikasi
   subjek data ≤ 3×24 jam sejak diketahui (Pasal 46 UU 27/2022).
5. Post-mortem tanpa menyalahkan: akar masalah + tindakan pencegahan → worklog.

## 8. Latihan & Pemeliharaan

| Aktivitas | Frekuensi | Bukti |
| --- | --- | --- |
| Drill restore backup ke salinan | 1×/kuartal | baris worklog (tanggal + hasil) |
| Review kontak eskalasi & roster Duty Officer | 1×/bulan | CMS/API `DutyOfficer` |
| Review runbook ini | tiap rilis mayor | commit runbook |
