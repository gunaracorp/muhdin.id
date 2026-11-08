/**
 * seed-roadmap99.ts — v12.2 «99 ROADMAP UPGRADE».
 *
 * Mengisi 99 item upgrade granular MUHDIN.ID di bawah 4 fase makro Roadmap:
 *   • 6 pilar: JAMAAH (18) · AKADEMI (16) · BISNIS (17) · PLATFORM (18) · KEAMANAN (15) · EKOSISTEM (15)
 *   • Status jujur per v12.1.0: 24 DONE (fitur yang sudah hidup), 15 IN_PROGRESS, 60 PLANNED
 *   • priority P0–P3, effort S/M/L/XL, target versi v12.2–v20
 *
 * Idempoten (refresh): hapus lalu isi ulang seluruh RoadmapItem.
 * Jalankan: npx tsx scripts/seed-roadmap99.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type Row = {
  code: string;
  pillar: string;
  title: string;
  description: string;
  priority: string;
  effort: string;
  status: string;
  target: string;
};

const ROWS: Row[] = [
  // ================= PILAR 1 — PENGALAMAN JAMAAH (18) =================
  { code: "R-001", pillar: "JAMAAH", title: "Marketplace Paket Umrah & Haji", description: "Katalog paket terverifikasi dengan filter harga/keberangkatan, halaman detail, dan ulasan jamaah — inti layanan MUHDIN sejak v5.", priority: "P0", effort: "XL", status: "DONE", target: "v5.0" },
  { code: "R-002", pillar: "JAMAAH", title: "Forum Jamaah", description: "Ruang diskusi tanya-jawab sesama jamaah dengan moderasi, balasan bertingkat, dan i18n tiga bahasa.", priority: "P1", effort: "L", status: "DONE", target: "v5.0" },
  { code: "R-003", pillar: "JAMAAH", title: "Kartu Jamaah QR Digital", description: "Identitas jamaah digital dengan QR yang dapat dipindai marshal di lapangan — tanpa kartu fisik.", priority: "P1", effort: "M", status: "DONE", target: "v5.0" },
  { code: "R-004", pillar: "JAMAAH", title: "Brankas Dokumen Jamaah", description: "Paspor, visa, dan kartu vaksin tersimpan rapi satu tempat dengan pengingat masa berlaku.", priority: "P0", effort: "L", status: "DONE", target: "v6.0" },
  { code: "R-005", pillar: "JAMAAH", title: "Titik Kumpul & Tombol SOS", description: "Peta titik kumpul per lokasi suci plus kanal darurat satu-ketuk ke koordinator.", priority: "P0", effort: "M", status: "DONE", target: "v6.0" },
  { code: "R-006", pillar: "JAMAAH", title: "GPS Tracking Rombongan Real-time", description: "Posisi rombongan dipantau live oleh marshal dan keluarga di tanah air — keamanan jamaah nomor satu.", priority: "P0", effort: "L", status: "DONE", target: "v11.0" },
  { code: "R-007", pillar: "JAMAAH", title: "Paspor Haji Digital QR", description: "Paspor haji digital dengan QR anti-palsu untuk verifikasi cepat di titik layanan.", priority: "P1", effort: "L", status: "DONE", target: "v11.0" },
  { code: "R-008", pillar: "JAMAAH", title: "Tur Virtual 360° Tanah Suci", description: "Jelajah panorama Makkah & Madinah sebelum berangkat — menumbuhkan rasa percaya dan siap mental.", priority: "P3", effort: "M", status: "DONE", target: "v11.0" },
  { code: "R-009", pillar: "JAMAAH", title: "Itinerary Harian Interaktif", description: "Timeline hari-ke-hari per paket (ItineraryDay 67 model) dengan lokasi & rincian, editor CMS replace-all atomik, 5 paket contoh terisi — tampil di detail paket (selesai v12.5).", priority: "P1", effort: "L", status: "DONE", target: "v12.5" },
  { code: "R-010", pillar: "JAMAAH", title: "Checkout Lengkap Paket", description: "Checkout end-to-end dari katalog hingga pesanan LUNAS: order, intent pembayaran, lacak status publik, dan konfirmasi kursi; e-tiket menyusul di v13.", priority: "P0", effort: "XL", status: "DONE", target: "v12.4" },
  { code: "R-011", pillar: "JAMAAH", title: "Web Push Pengumuman Keberangkatan", description: "Notifikasi push PWA untuk perubahan jadwal, gate, dan pengumuman muter — tanpa buka aplikasi.", priority: "P1", effort: "M", status: "PLANNED", target: "v13" },
  { code: "R-012", pillar: "JAMAAH", title: "Grup Perjalanan Digital", description: "Ruang khusus per rombongan: daftar anggota, chat singkat, jadwal kumpul, dan kontak marshal.", priority: "P2", effort: "L", status: "PLANNED", target: "v13" },
  { code: "R-013", pillar: "JAMAAH", title: "Ekspansi Poin KTA Lintas Layanan", description: "Order LUNAS marketplace otomatis +1 poin/Rp10.000 (reason BOOKING, gagal-aman) menyusul akademi & referral; redeem lintas katalog benefit tetap berjalan — satu ledger, tier dihitung ulang (selesai v12.5).", priority: "P2", effort: "M", status: "DONE", target: "v12.5" },
  { code: "R-014", pillar: "JAMAAH", title: "Ulasan & Rating Paket Pasca-Perjalanan", description: "Rating terverifikasi hanya dari jamaah yang benar-benar berangkat — menaikkan kejujuran katalog.", priority: "P2", effort: "M", status: "PLANNED", target: "v14" },
  { code: "R-015", pillar: "JAMAAH", title: "WA-AI Bot di Portal & Voice", description: "Perluasan WA-AI Bot v11 ke widget portal web dan interaksi suara tiga bahasa.", priority: "P2", effort: "L", status: "PLANNED", target: "v14" },
  { code: "R-016", pillar: "JAMAAH", title: "Panduan Doa & Dzikru Audio", description: "Kumpulan doa perangkat ibadah dengan audio, teks Arab, latin, dan terjemahan tiga bahasa.", priority: "P2", effort: "M", status: "PLANNED", target: "v14" },
  { code: "R-017", pillar: "JAMAAH", title: "Kalender Musim Umrah & Haji", description: "Peta musim, kuota, dan indikasi harga per periode agar jamaah memilih waktu terbaik.", priority: "P3", effort: "M", status: "PLANNED", target: "v14" },
  { code: "R-018", pillar: "JAMAAH", title: "Akun Pengampu Keluarga", description: "Satu pengampu mengelola data & status anggota keluarga (anak, lansia) dalam satu layar.", priority: "P1", effort: "L", status: "PLANNED", target: "v15" },

  // ================= PILAR 2 — AKADEMI & KTA (16) =================
  { code: "R-019", pillar: "AKADEMI", title: "Akademi MUHDIN", description: "Kelas, materi, dan sertifikat pelatihan manasik & pelayanan jamaah — modul Akademi lengkap di portal dan CMS.", priority: "P0", effort: "XL", status: "DONE", target: "v11.0" },
  { code: "R-020", pillar: "AKADEMI", title: "Booking Slot Pelatihan (Live Queue)", description: "Papan slot pendaftaran real-time dengan antrean hidup — tak ada lagi tabrakan kuota kelas.", priority: "P1", effort: "L", status: "DONE", target: "v11.0" },
  { code: "R-021", pillar: "AKADEMI", title: "Jalur Sertifikasi Muthawwif Berjenjang", description: "Level dasar → lanjutan → mentor dengan syarat jam pelayanan dan ujian per jenjang.", priority: "P1", effort: "L", status: "PLANNED", target: "v13" },
  { code: "R-022", pillar: "AKADEMI", title: "Verifikasi Sertifikat Publik via QR", description: "Deep-link QR #/verifikasi-sertifikat/<kode> + API publik rate-limited: nama pemegang, kursus, skor, counter verifikasi server-side — dituntaskan jalur kritisnya oleh E2E Playwright (selesai v13.0).", priority: "P1", effort: "S", status: "DONE", target: "v13.0" },
  { code: "R-023", pillar: "AKADEMI", title: "Bank Soal Manasik Berjenjang", description: "Ribuan butir soal terkurasi per level dengan pengacakan agar latihan tak jenuh.", priority: "P2", effort: "M", status: "PLANNED", target: "v13" },
  { code: "R-024", pillar: "AKADEMI", title: "Kelas Live & Webinar Terjadwal", description: "Agenda kelas daring dengan pendaftaran, pengingat dua kanal, dan rekaman tersimpan.", priority: "P2", effort: "L", status: "PLANNED", target: "v14" },
  { code: "R-025", pillar: "AKADEMI", title: "Forum Diskusi Per-Kelas", description: "Diskusi terkurasi per kelas Akademi — terpisah dari Forum Jamaah umum, dimoderasi mentor.", priority: "P2", effort: "M", status: "PLANNED", target: "v14" },
  { code: "R-026", pillar: "AKADEMI", title: "Dashboard Mentor", description: "Pantau progres murid, koreksi tugas, dan beri umpan balik dari satu papan.", priority: "P2", effort: "M", status: "PLANNED", target: "v14" },
  { code: "R-027", pillar: "AKADEMI", title: "Kurikulum Builder Drag-and-Drop", description: "Susun silabus modul, kuis, dan sertifikasi lewat antarmuka geser-taruh di CMS.", priority: "P3", effort: "L", status: "PLANNED", target: "v14" },
  { code: "R-028", pillar: "AKADEMI", title: "KTA Tier Silver/Gold/Platinum", description: "Keanggotaan berjenjang dengan benefit yang makin kaya per tier — fondasi KTA Digital v11.", priority: "P1", effort: "L", status: "PLANNED", target: "v13" },
  { code: "R-029", pillar: "AKADEMI", title: "Merchant Partner Benefit KTA", description: "Diskon & fasilitas dari merchant mitra yang dapat ditukar langsung dengan kartu KTA.", priority: "P2", effort: "M", status: "PLANNED", target: "v14" },
  { code: "R-030", pillar: "AKADEMI", title: "Referral KTA Berkode Undangan", description: "Setiap anggota punya kode undangan; ajak saudara, dapatkan poin — pelacakan otomatis.", priority: "P2", effort: "S", status: "PLANNED", target: "v14" },
  { code: "R-031", pillar: "AKADEMI", title: "Verifikasi KTA Publik Anti-Palsu", description: "Halaman verifikasi publik kartu anggota via QR/ID — melindungi nama baik MUHDIN.", priority: "P2", effort: "S", status: "PLANNED", target: "v15" },
  { code: "R-032", pillar: "AKADEMI", title: "Gamifikasi Lencana Capaian", description: "Lencana digital untuk kelulusan, kehadiran, dan kontribusi — belajar jadi menarik.", priority: "P3", effort: "S", status: "PLANNED", target: "v15" },
  { code: "R-033", pillar: "AKADEMI", title: "Jaringan Alumni Akademi", description: "Direktori alumni terverifikasi untuk rekomendasi kerja dan mentoring silang.", priority: "P3", effort: "M", status: "PLANNED", target: "v15" },
  { code: "R-034", pillar: "AKADEMI", title: "Evaluasi Instruktur Berkala", description: "Umpan balik tertutup murid ke instruktur tiap akhir kelas — mutu pengajar terjaga.", priority: "P3", effort: "S", status: "PLANNED", target: "v16" },

  // ================= PILAR 3 — MARKETPLACE & BISNIS (17) =================
  { code: "R-035", pillar: "BISNIS", title: "Pindai Izin 360° Mitra", description: "Pemindaian kelengkapan izin a–l seluruh mitra ekosistem — transparansi publik penuh.", priority: "P0", effort: "XL", status: "DONE", target: "v7.0" },
  { code: "R-036", pillar: "BISNIS", title: "God-Mode Izin Compliance Checker", description: "Papan kepatuhan berperingkat: skor 0–100, grade A–E, level risiko, tren antar-audit, dan notifikasi otomatis.", priority: "P0", effort: "XL", status: "DONE", target: "v12.1" },
  { code: "R-037", pillar: "BISNIS", title: "Pusat Bisnis Hulu-Hilir", description: "Fasilitasi kerja sama B2B antar mitra: vendoring, komisi, dan katalog jasa ekosistem.", priority: "P1", effort: "L", status: "DONE", target: "v6.0" },
  { code: "R-038", pillar: "BISNIS", title: "Integrasi Payment Gateway", description: "Gateway pola adapter dengan webhook ber-signature HMAC & idempoten — provider SANDBOX aktif; QRIS/VA/e-wallet riil tinggal pasang kredensial Midtrans/Xendit.", priority: "P0", effort: "XL", status: "DONE", target: "v12.4" },
  { code: "R-039", pillar: "BISNIS", title: "Invoice PDF Otomatis", description: "Invoice PDF bernomor seri terbit otomatis saat LUNAS (QR lacak + ringkasan pesanan) dan dapat diunduh jamaah maupun admin.", priority: "P0", effort: "M", status: "DONE", target: "v12.4" },
  { code: "R-040", pillar: "BISNIS", title: "Seat Map & Waitlist Otomatis", description: "Peta kursi visual terisi/kosong di detail paket + daftar tunggu (WaitlistEntry): gabung saat penuh berperingkat, auto-tawaran WA ke antrean teratas saat slot dibebaskan (klaim atomik anti ganda) — teruji penuh (selesai v12.5).", priority: "P1", effort: "L", status: "DONE", target: "v12.5" },
  { code: "R-041", pillar: "BISNIS", title: "Waitlist Otomatis Paket Penuh", description: "Antrean cerdas saat kursi habis; buka kursi baru langsung menawar ke antrean teratas — terwujud utuh lewat WaitlistEntry + offerWaitlistSlot atomik yang ter-hook pembatalan booking (selesai v12.5, lintasan R-040).", priority: "P1", effort: "M", status: "DONE", target: "v13.0" },
  { code: "R-042", pillar: "BISNIS", title: "Voucher & Kupon Kampanye", description: "Kode diskon berbatas waktu, kuota, dan segmen — amunisi kampanye musim ramadan.", priority: "P1", effort: "M", status: "PLANNED", target: "v14" },
  { code: "R-043", pillar: "BISNIS", title: "Harga Musiman & Early Bird", description: "Harga dinamis per periode keberangkatan dengan insentif pemesan awal.", priority: "P2", effort: "M", status: "PLANNED", target: "v14" },
  { code: "R-044", pillar: "BISNIS", title: "Refund & Pembatalan Berjenjang", description: "Kebijakan pembatalan bertahap dengan SLA jelas dan jejak audit tiap keputusan.", priority: "P2", effort: "L", status: "PLANNED", target: "v14" },
  { code: "R-045", pillar: "BISNIS", title: "Pendaftaran Rombongan B2B", description: "Portal khusus koordinator rombongan besar: unggah anggota massal, satu tagihan.", priority: "P2", effort: "L", status: "PLANNED", target: "v14" },
  { code: "R-046", pillar: "BISNIS", title: "Onboarding Merchant Marketplace", description: "Toko mitra dapat buka lapak: verifikasi izin, unggah produk, kelola pesanan sendiri.", priority: "P2", effort: "XL", status: "PLANNED", target: "v15" },
  { code: "R-047", pillar: "BISNIS", title: "Skor Kualitas Vendor", description: "60% ulasan jamaah + 25% kesehatan keluhan + 15% aktivitas katalog → skor 0-100 & grade A-D tersimpan per anggota; CMS Broadcast & Vendor dengan hitung ulang satu klik (selesai v12.5).", priority: "P2", effort: "M", status: "DONE", target: "v12.5" },
  { code: "R-048", pillar: "BISNIS", title: "Asuransi Perjalanan Add-on", description: "Tambahan perlindungan perjalanan saat checkout dengan klaim dibantu MUHDIN.", priority: "P2", effort: "L", status: "PLANNED", target: "v15" },
  { code: "R-049", pillar: "BISNIS", title: "Kas Rombongan & Laporan Grup", description: "Pencatatan iuran & pengeluaran grup dengan laporan transparan ke seluruh anggota.", priority: "P3", effort: "M", status: "PLANNED", target: "v15" },
  { code: "R-050", pillar: "BISNIS", title: "Escrow Pembayaran Aman", description: "Dana jamaah ditahan aman hingga layanan terverifikasi — melindungi kedua pihak.", priority: "P3", effort: "XL", status: "PLANNED", target: "v16" },
  { code: "R-051", pillar: "BISNIS", title: "Dashboard Omzet Manajemen", description: "Menu CMS Dashboard Omzet: kartu ringkasan (omzet lunas, konversi, menunggu bayar, rata-rata order), grafik batang SVG 12 bulan, 5 paket penyumbang omzet terbesar, dan 8 pesanan terbaru — dari /api/management/omzet (SUPER_ADMIN/ADMIN; selesai v13.0).", priority: "P1", effort: "L", status: "DONE", target: "v13.0" },

  // ================= PILAR 4 — PLATFORM & TEKNOLOGI (18) =================
  { code: "R-052", pillar: "PLATFORM", title: "PWA Installable + Offline", description: "Portal terpasang di layar utama HP dan tetap menampilkan konten inti saat sinyal hilang.", priority: "P0", effort: "L", status: "DONE", target: "v3.0" },
  { code: "R-053", pillar: "PLATFORM", title: "Global Search Lintas Entitas", description: "Satu kotak cari untuk paket, artikel, mitra, forum, dan tutorial — indeks menyeluruh.", priority: "P1", effort: "L", status: "DONE", target: "v11.0" },
  { code: "R-054", pillar: "PLATFORM", title: "Statistik Nasional & Transparansi", description: "Papan data publik ekosistem umrah-haji dengan sumber terbuka dan grafik hidup.", priority: "P2", effort: "L", status: "DONE", target: "v11.0" },
  { code: "R-055", pillar: "PLATFORM", title: "Notifikasi 10 Kejadian × 2 Kanal", description: "Email + WhatsApp otomatis untuk 10 kejadian kunci, lengkap saklar per kanal di CMS.", priority: "P1", effort: "XL", status: "DONE", target: "v12.1" },
  { code: "R-056", pillar: "PLATFORM", title: "Migrasi PostgreSQL Produksi", description: "Audit dual-ready terotomatisasi scripts/check-postgres-ready.ts: 67 model tipe standar, nol raw SQL khusus SQLite di aplikasi (backup tool dikecualikan by-design), langkah migrasi terdokumentasi — eksekusi menunggu server Postgres produksi (selesai v12.5).", priority: "P0", effort: "XL", status: "DONE", target: "v12.5" },
  { code: "R-057", pillar: "PLATFORM", title: "SEO Teknis Penuh", description: "Sitemap dinamis (paket+artikel dari DB), robots.txt, landing page SSR /paket/[slug] & /artikel/[slug] ber-metadata + JSON-LD, OG image dinamis next/og — mesin pencari menyayangi portal (selesai v12.5).", priority: "P1", effort: "M", status: "DONE", target: "v12.5" },
  { code: "R-058", pillar: "PLATFORM", title: "Optimasi Media WebP + Lazy Load", description: "SmartImage lazy-load IntersectionObserver dengan skeleton & fade-in, pipeline WebP sharp (13 aset, hemat 23%) dengan fallback otomatis — hemat kuota jamaah di lapangan (selesai v12.5).", priority: "P1", effort: "M", status: "DONE", target: "v12.5" },
  { code: "R-059", pillar: "PLATFORM", title: "Impor/Ekspor CSV Massal", description: "POST /api/import (upsert subscribers & articles, append applications & messages) dengan parser CSV tahan kutip, pratinjau, laporan per baris, rate-limit & audit; tombol Impor CSV di CMS (selesai v12.5).", priority: "P2", effort: "M", status: "DONE", target: "v12.5" },
  { code: "R-060", pillar: "PLATFORM", title: "CI/CD Pipeline Otomatis", description: "GitHub Actions dua job: verify (bun install → tsc 0 error → ESLint 0 error → build produksi) + e2e (DB segar + seed → Playwright jalur kritis, laporan artifact) — berjalan tiap push/PR main dengan concurrency & retry (selesai v13.0).", priority: "P0", effort: "L", status: "DONE", target: "v13.0" },
  { code: "R-061", pillar: "PLATFORM", title: "Test Suite E2E Jalur Kritis", description: "Playwright 12+ asersi Chromium: portal (beranda/katalog/roadmap), auth CMS (tolak salah sandi, login sukses, sesi bertahan reload), checkout end-to-end (katalog→order ORD→lacak), verifikasi sertifikat, landing kampanye + lead; kredensial selalu env/secret, tak pernah di-commit (selesai v13.0).", priority: "P0", effort: "L", status: "DONE", target: "v13.0" },
  { code: "R-062", pillar: "PLATFORM", title: "Observability & Health Dashboard", description: "Logger JSON ring-buffer 250, /api/metrics (uptime, memori, latensi DB, antrean kerja, rate-limit adaptif, log terakhir), CMS Kesehatan Sistem auto-refresh 30 detik (selesai v12.5).", priority: "P1", effort: "L", status: "DONE", target: "v12.5" },
  { code: "R-063", pillar: "PLATFORM", title: "Backup Terjadwal + Drill Pemulihan", description: "Snapshot SQLite terverifikasi (integrity_check + hitung baris tabel kunci) dengan retensi 14 terakhir — teruji di v12.3; jadwal crontab terdokumentasi.", priority: "P0", effort: "M", status: "DONE", target: "v12.3" },
  { code: "R-064", pillar: "PLATFORM", title: "Pencarian Fuzzy & Typo-Tolerant", description: "Salah ketik tetap ketemu: pencarian toleran salah eja untuk seluruh Global Search.", priority: "P2", effort: "M", status: "PLANNED", target: "v14" },
  { code: "R-065", pillar: "PLATFORM", title: "API Publik v1 untuk Mitra", description: "API key, kuota, dan webhook agar mitra integrasi mandiri dengan MUHDIN.", priority: "P2", effort: "XL", status: "PLANNED", target: "v14" },
  { code: "R-066", pillar: "PLATFORM", title: "Design System v2 Terdokumentasi", description: "Katalog komponen, token warna forest/gold, dan aturan animasi jadi satu rujukan resmi.", priority: "P2", effort: "L", status: "PLANNED", target: "v14" },
  { code: "R-067", pillar: "PLATFORM", title: "Mobile App Wrapper (Capacitor)", description: "Bungkus PWA jadi aplikasi toko aplikasi tanpa menulis ulang — satu kodebase dua saluran.", priority: "P3", effort: "M", status: "PLANNED", target: "v15" },
  { code: "R-068", pillar: "PLATFORM", title: "Cache Layer & CDN Aset", description: "Aset statis dan respons panas disimpan di edge — portal cepat di seluruh Indonesia.", priority: "P3", effort: "L", status: "PLANNED", target: "v15" },
  { code: "R-069", pillar: "PLATFORM", title: "Audit Aksesibilitas WCAG AA", description: "Kontras, fokus keyboard, dan screen reader diaudit penuh — semua jamaah bisa memakai portal.", priority: "P3", effort: "M", status: "PLANNED", target: "v15" },

  // ================= PILAR 5 — KEAMANAN & KEPATUHAN (15) =================
  { code: "R-070", pillar: "KEAMANAN", title: "RBAC 4 Peran × 36+ Modul CMS", description: "Peran SUPER_ADMIN/ADMIN/EDITOR/VERIFIKATOR dengan guardRole di seluruh rute — fondasi sejak hari pertama.", priority: "P0", effort: "XL", status: "DONE", target: "v1.0" },
  { code: "R-071", pillar: "KEAMANAN", title: "Audit Log Setiap Aksi Admin", description: "logAudit merekam siapa, apa, kapan — jejak penuh yang bisa dipertanggungjawabkan.", priority: "P0", effort: "L", status: "DONE", target: "v6.0" },
  { code: "R-072", pillar: "KEAMANAN", title: "Backup Database & Ekspor Aman", description: "Endpoint backup admin untuk snapshot berkala; db/ & .env tetap di luar repo publik.", priority: "P1", effort: "S", status: "DONE", target: "v4.0" },
  { code: "R-073", pillar: "KEAMANAN", title: "Rate-Limit Adaptif Menyeluruh", description: "Pelanggaran lintas bucket dihitung per IP: ≥3 penolakan/10 menit → blocklist dengan backoff berlipat (5→60 menit) yang menolak SEMUA endpoint; log security + statistik di dashboard (selesai v12.5).", priority: "P1", effort: "M", status: "DONE", target: "v12.5" },
  { code: "R-074", pillar: "KEAMANAN", title: "2FA Admin (TOTP)", description: "Autentikasi dua faktor RFC 6238 per akun admin: setup QR authenticator, kode 6 digit tiap 30 detik, tantangan saat login, saklar CMS — selesai di v12.3.", priority: "P0", effort: "M", status: "DONE", target: "v12.3" },
  { code: "R-075", pillar: "KEAMANAN", title: "Kebijakan Password & Lockout", description: "Sandi wajib huruf+angka (sandi umum ditolak) di semua titik set-password, lockout 5 gagal/15 menit per email, rate-limit 10/menit per IP, audit tercatat — selesai di v12.3.", priority: "P0", effort: "S", status: "DONE", target: "v12.3" },
  { code: "R-076", pillar: "KEAMANAN", title: "Enkripsi At-Rest Dokumen Jamaah", description: "Brankas dokumen dienkripsi level field — bocor database pun isi tetap terlindungi.", priority: "P1", effort: "L", status: "PLANNED", target: "v13" },
  { code: "R-077", pillar: "KEAMANAN", title: "Sesi & Device Management", description: "Sesi kini membawa perangkat (ringkasan UA), IP, dan denyut lastSeenAt; panel Perangkat & Sesi di CMS Keamanan Akun: daftar sesi aktif bertanda sesi-ini, cabut satu perangkat, atau cabut semua perangkat lain — SUPER_ADMIN dapat mencabut sesi akun lain, semua tercatat di audit (selesai v13.0).", priority: "P1", effort: "M", status: "DONE", target: "v13.0" },
  { code: "R-078", pillar: "KEAMANAN", title: "Kepatuhan UU PDP Operasional", description: "Consent wajib (pendaftaran + checkout, dicatat pdpConsentAt), formulir Hak Subjek Data (akses/ekspor & penghapusan) di #/privasi masuk antrean PrivacyRequest dengan SLA 3×24 jam, CMS Permintaan PDP untuk petugas — UU 27/2022 (selesai v12.5).", priority: "P1", effort: "L", status: "DONE", target: "v12.5" },
  { code: "R-079", pillar: "KEAMANAN", title: "Role Matrix Terpusat + Test", description: "Matriks peran jadi sumber kebenaran tunggal dengan uji otomatis konsistensi guard tiap rute.", priority: "P2", effort: "M", status: "PLANNED", target: "v14" },
  { code: "R-080", pillar: "KEAMANAN", title: "Penetration Test Berkala", description: "Uji tembus terjadwal internal dengan daftar remediasi yang dituntaskan terukur.", priority: "P2", effort: "L", status: "PLANNED", target: "v14" },
  { code: "R-081", pillar: "KEAMANAN", title: "Validasi Zod Menyeluruh", description: "Skema validasi input untuk seluruh API — input kotor ditolak di gerbang.", priority: "P2", effort: "L", status: "PLANNED", target: "v14" },
  { code: "R-082", pillar: "KEAMANAN", title: "Anti-Spam & Moderasi Otomatis Forum", description: "Skor spam 0-100 (tautan, kapital, kata terlarang, duplikat & frekuensi 10 menit): ≥60 ditolak 422, 30-59 masuk antrean prioritas bertanda; skor+alasan tampil di CMS moderasi (selesai v12.5).", priority: "P2", effort: "M", status: "DONE", target: "v12.5" },
  { code: "R-083", pillar: "KEAMANAN", title: "Audit Dependensi Otomatis", description: "Pemantauan kerentanan paket dengan patch terjadwal — tak ada celah dari perpustakaan lama.", priority: "P3", effort: "S", status: "PLANNED", target: "v15" },
  { code: "R-084", pillar: "KEAMANAN", title: "Disaster Recovery Runbook", description: "Playbook pemulihan bencana bertahap dengan kontak darurat dan target RTO/RPO jelas.", priority: "P3", effort: "M", status: "PLANNED", target: "v15" },

  // ================= PILAR 6 — EKOSISTEM & PERTUMBUHAN (15) =================
  { code: "R-085", pillar: "EKOSISTEM", title: "WA-AI Bot Layanan 24/7", description: "Chatbot WhatsApp ber-AI jawab pertanyaan jamaah siang malam — tiga bahasa, selalu sabar.", priority: "P1", effort: "XL", status: "DONE", target: "v11.0" },
  { code: "R-086", pillar: "EKOSISTEM", title: "Berita, Artikel & RSS", description: "Kanal informasi resmi dengan feed RSS dan artikel pilihan di halaman depan.", priority: "P2", effort: "M", status: "DONE", target: "v2.0" },
  { code: "R-087", pillar: "EKOSISTEM", title: "Testimoni & Galeri Kegiatan", description: "Cerita jamaah dan dokumentasi kegiatan tumbuhkan kepercayaan calon jamaah baru.", priority: "P2", effort: "M", status: "DONE", target: "v2.0" },
  { code: "R-088", pillar: "EKOSISTEM", title: "Newsletter & Langganan Email", description: "Kabar rutin ekosistem untuk pelanggan yang berlangganan — modul subscribers aktif.", priority: "P2", effort: "S", status: "DONE", target: "v3.0" },
  { code: "R-089", pillar: "EKOSISTEM", title: "Landing Kampanye Musiman", description: "SSR /kampanye/[slug] ber-metadata + JSON-LD Event, form lead anti-spam (honeypot + rate-limit) dengan sumber ?ref=utm, CMS Kampanye Musiman (CRUD + drawer follow-up lead status dengan CTA WA), sitemap ikut terindeks, seed kampanye Ramadan (selesai v13.0).", priority: "P1", effort: "M", status: "DONE", target: "v13.0" },
  { code: "R-090", pillar: "EKOSISTEM", title: "Portal Kemitraan Masjid & Komunitas", description: "Masjid dan komunitas daftar jadi mitra penjangkauan dengan dashboard relasi sendiri.", priority: "P1", effort: "XL", status: "PLANNED", target: "v14" },
  { code: "R-091", pillar: "EKOSISTEM", title: "Konten Edukasi SEO Terstruktur", description: "Meta judul/deskripsi/keywords per artikel di CMS + pustaka manasik & tips terarah kata kunci (3 artikel pilar) + landing terindeks — mesin pencari jadi saluran utama (selesai v12.5).", priority: "P2", effort: "M", status: "DONE", target: "v12.5" },
  { code: "R-092", pillar: "EKOSISTEM", title: "Survei NPS Pasca-Perjalanan", description: "Ukur kepuasan jamaah otomatis setelah tiba; skor NPS tampil di dashboard manajemen.", priority: "P2", effort: "M", status: "PLANNED", target: "v14" },
  { code: "R-093", pillar: "EKOSISTEM", title: "Analitik Funnel Pendaftaran", description: "Lacak langkah calon jamaah dari lihat paket sampai daftar — temukan titik bocor.", priority: "P2", effort: "L", status: "PLANNED", target: "v14" },
  { code: "R-094", pillar: "EKOSISTEM", title: "Broadcast WA Template Terjadwal", description: "Template {{nama}}/{{tanggal}}, 3 audiens opt-in, draf/jadwal/kirim-sekarang via CMS, worker crontab idempoten (klaim atomik), hitungan terkirim-gagal + log per penerima (selesai v12.5).", priority: "P2", effort: "M", status: "DONE", target: "v12.5" },
  { code: "R-095", pillar: "EKOSISTEM", title: "Help Center & FAQ Cerdas", description: "#/bantuan: pencarian terpadu yang langsung menyaring FAQ, chip populer, 4 kategori belajar, 4 layanan cepat, CTA kontak — 3 bahasa; #/faq tetap hidup (selesai v12.5).", priority: "P2", effort: "M", status: "DONE", target: "v12.5" },
  { code: "R-096", pillar: "EKOSISTEM", title: "Duty Officer 24/7", description: "Jadwal piket petugas darurat dengan eskalasi berjenjang — jamaah tak pernah sendirian.", priority: "P3", effort: "S", status: "PLANNED", target: "v15" },
  { code: "R-097", pillar: "EKOSISTEM", title: "Papan Status Layanan Publik", description: "Halaman status uptime transparan agar mitra & jamaah tahu kondisi sistem kapan pun.", priority: "P3", effort: "S", status: "PLANNED", target: "v15" },
  { code: "R-098", pillar: "EKOSISTEM", title: "Sertifikasi ISO 27001", description: "Audit keamanan informasi eksternal menuju sertifikasi — standar kelas enterprise.", priority: "P3", effort: "XL", status: "PLANNED", target: "v16" },
  { code: "R-099", pillar: "EKOSISTEM", title: "MUHDIN Open Core", description: "Ekstraksi modul inti (RBAC, kartu QR, engine compliance) jadi pustaka sumber-terbuka bagi ekosistem digital umrah Indonesia.", priority: "P3", effort: "XL", status: "PLANNED", target: "v20" },
];

async function main() {
  await db.roadmapItem.deleteMany();
  const data = ROWS.map((r, i) => ({ ...r, order: i + 1 }));
  await db.roadmapItem.createMany({ data });

  const by = (k: "status" | "pillar" | "priority") => {
    const m: Record<string, number> = {};
    for (const r of ROWS) m[r[k]] = (m[r[k]] ?? 0) + 1;
    return m;
  };
  console.log(`🎉 Seed roadmap-99 selesai — ${ROWS.length} item.`);
  console.log("  status  :", by("status"));
  console.log("  pilar   :", by("pillar"));
  console.log("  prioritas:", by("priority"));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
