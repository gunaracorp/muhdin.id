# Kesiapan ISO 27001:2022 — MUHDIN ISMS Readiness Pack (R-098)

Tanggal: 2026-11-18 · Pemilik: Sekretariat + Design Quality & Governance Lead
Register kendali hidup: CMS **Kendali ISMS** → API `/api/isms-controls` →
publik di **Compliance Hub** (`#/compliance`, seksi R-098).

## Ruang lingkup ISMS

Portal & layanan digital MUHDIN (portal publik, CMS admin, API publik v1,
kanal WhatsApp, notifikasi push/email) beserta data pribadi jamaah dan mitra
yang diproses di dalamnya. Kendali mengikuti struktur **Annex A
ISO/IEC 27001:2022** dalam empat tema.

## Peta kendali (State of Applicability ringkas)

| Tema | Kendali kunci | Implementasi saat ini | Bukti |
| --- | --- | --- | --- |
| Organisasi (A.5) | Kebijakan keamanan info (A.5.1), peran & pemisahan tugas (A.5.3), kemitraan pemasok (A.5.20) | Kebijakan di SECURITY.md; RBAC 4 peran (SUPER_ADMIN/ADMIN/EDITOR/VERIFIKATOR); pentest berkala R-080 | SECURITY.md, `scripts/test-role-matrix.mts`, `scripts/pentest-berkala.mts` |
| Manusia (A.6) | Kesadaran keamanan (A.6.3), proses disiplin (A.6.4) | Login CMS ber-2FA TOTP (R-056), lockout percobaan gagal | `lib/password-lockout.ts`, `admin-security` |
| Fisik (A.7) | Keamanan fasilitas (A.7.1) | Hosting cloud bersertifikat (Prisma Postgres pooled + TLS); tidak ada server fisik milik MUHDIN | DATABASE.md |
| Teknologi (A.8) | Kendali akses (A.8.2–8.5), kriptografi (A.8.24), logging (A.8.15), pencadangan (A.8.13), keamanan sistem (A.8.8) | Scrypt+session httpOnly; AES-256-GCM brankas dokumen (R-076); AuditLog menyeluruh (R-064); backup `bun run backup`; rate-limit + Zod (R-081); header keamanan; webhook fail-closed HMAC | Kode + worklog Task terkait |

## Status kesiapan (per 2026-11-18)

- **Kendali terimplementasi**: 18 dari 21 kendali kunci (86%) — tampil live
  di seksi ISMS Compliance Hub.
- **Gap utama menuju audit**: (1) penugasan internal audit mandiri belum
  dijadwalkan; (2) management review berkala (A.9.3) belum terdokumentasi
  sebagai rapat; (3) sertifikat kepatuhan penyedia cloud per dikumpulkan
  (SOC 2/ISO dari vendor).
- **Rencana 12 bulan**: perbaiki 3 gap → audit internal (bulan ke-4) →
  management review (bulan ke-6) → audit tahap 1 lembaga akreditasi
  (bulan ke-9) → audit tahap 2 (bulan ke-12).

## Cara memperbarui register

1. CMS → **Kendali ISMS (ISO 27001)** → ubah status kendali
   (PLANNED → IMPLEMENTED → VERIFIED) + tautan bukti.
2. Setiap perubahan tercatat di AuditLog; register publik ter-update otomatis
   (cache hot-cache dibuang saat mutasi).

## Integritas klaim

Sampai sertifikasi diterbitkan lembaga akreditasi, MUHDIN **tidak mengklaim
"tersertifikasi ISO 27001"** — status yang ditampilkan adalah *kesiapan*
(readiness) dengan register kendali yang dapat diaudit, sesuai prinsip
kejujuran organisasi yang sama dengan status personalia pengurus.
