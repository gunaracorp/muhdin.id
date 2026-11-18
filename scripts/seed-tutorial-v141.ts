/**
 * seed-tutorial-v141.ts — v14.1 «AKADEMI & MITRA».
 *
 * Menanam 7 tutorial baru (order 23–29) yang memandu fitur sprint v14.1:
 *   1. doa-dzikir-audio          — Panduan Doa & Dzikir Audio (#/doa)
 *   2. kelas-live-pendaftaran    — Kelas Live & Webinar + forum per-kelas
 *   3. dashboard-mentor-cms      — Dashboard Mentor & kehadiran/umpan balik
 *   4. kurikulum-builder         — Kurikulum Builder drag-and-drop
 *   5. rombongan-b2b             — Pendaftaran Rombongan B2B satu tagihan
 *   6. refund-pembatalan         — Refund & pembatalan berjenjang
 *   7. merchant-kta-api-masjid   — Merchant mitra + kemitraan masjid + API mitra
 *
 * Idempoten: upsert berdasarkan slug.
 * Jalankan: npx tsx scripts/seed-tutorial-v141.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

interface TutorialUpsert {
  slug: string;
  title: string;
  category: string;
  level: string;
  duration: number;
  order: number;
  summary: string;
  content: string[];
}

const NEW_TUTORIALS: TutorialUpsert[] = [
  {
    slug: "panduan-doa-dzikir-audio",
    title: "Panduan Doa & Dzikir Audio (Teks Arab + Lafal)",
    category: "Ibadah",
    level: "Pemula",
    duration: 7,
    order: 23,
    summary: "Buka #/doa: 16 doa perangkat ibadah dengan teks Arab, latin, terjemahan, dan tombol putar audio dari perangkat Anda.",
    content: [
      "Halaman **Panduan Doa & Dzikir Audio** (#/doa) mengumpulkan doa-doa perangkat ibadah umrah & haji — dari doa naik kendaraan, talbiyah, doa tawaf, sampai dzikir wukuf dan takbir rami — lengkap dengan **teks Arab, bacaan latin, terjemahan dua bahasa, dan sumber riwayat yang jujur** (Al-Qur'an, HR. Muslim, Bukhari, Abu Dawud).",
      "## Cara Memakai",
      "Pilih **kategori** (Perjalanan · Ihram & Miqat · Tawaf · Sa'i · Wukuf & Mabit · Pelengkap Ibadah) atau tampilkan semua. Tekan tombol **Putar** pada kartu doa — portal memutar lafal Arab memakai suara perangkat Anda (Web Speech API) dengan kecepatan pelan agar mudah diikuti. Tekan lagi untuk berhenti.",
      "## Jaminan Jujur",
      "Audio TIDAK diunduh dari mana pun: portal memanfaatkan **suara yang terpasang di perangkat Anda**, sehingga tetap bekerja tanpa kuota dan di jaringan lambat. Bila perangkat tidak punya suara Arab, portal menandai \"pakai suara bawaan\" — kualitas lafal bisa berbeda. Untuk hafalan serius, tetap ikuti bimbingan ustadz/mentor rombongan Anda.",
      "## Masalah Umum",
      "**Tombol putar tidak bersuara** — periksa volume perangkat; beberapa browser memblokir suara sebelum interaksi pertama (tekan tombol sekali lagi). **Pengucapan aneh** — pasang paket suara Arab di pengaturan perangkat Anda. **Lupa doa saat ibadah** — simpan halaman ini ke layar utama (PWA) agar bisa dibuka cepat tanpa internet.",
    ],
  },
  {
    slug: "kelas-live-webinar-pendaftaran",
    title: "Kelas Live & Webinar: Daftar, Ikuti, Diskusikan",
    category: "Akademi",
    level: "Pemula",
    duration: 8,
    order: 24,
    summary: "Daftar kelas daring di #/kelas, dapatkan pengingat dua kanal, ikuti kelas, dan lanjut diskusi per-kelas di forum.",
    content: [
      "Halaman **Kelas Live & Webinar Terjadwal** (#/kelas) adalah agenda kelas daring Akademi MUHDIN: manasik praktis, kelas mentor, webinar khusus wanita, dan lainnya — dengan kuota kursi yang terlihat jelas.",
      "## Mendaftar",
      "Klik **Daftar** pada kartu kelas, isi **nama** dan **nomor WhatsApp**, kirim. Satu nomor hanya boleh mendaftar **sekali per kelas** (anti ganda), dan kuota kelas divalidasi server — bila penuh, tombol berubah jadi \"Kuota Penuh\". Setelah terdaftar, pengingat datang lewat **dua kanal**: WhatsApp dan notifikasi push (bila Anda sudah mengaktifkan notifikasi di #/pesanan).",
      "## Mengikuti Kelas",
      "Tautan meeting (Zoom/Meet) dibagikan kepada pendaftar menjelang kelas. Kelas yang sudah selesai menampilkan **URL rekaman** di kartunya — belajar ulang kapan saja.",
      "## Diskusi Per-Kelas",
      "Setiap kartu kelas punya tombol **forum** yang membuka diskusi khusus kelas itu (#/forum?kelasId=…) — terpisah dari Forum Jamaah umum dan tetap dimoderasi. Tanyakan hal spesifik dari materi kelas di sana; pertanyaan bagus akan dibaca mentor saat kelas berikutnya.",
      "## Masalah Umum",
      "\"Nomor ini sudah terdaftar\" — satu nomor satu kelas; gunakan kelas lain atau hubungi panitia. \"Kuota penuh\" — pantau kelas lain yang dibuka. Tidak menerima pengingat — pastikan nomor WhatsApp aktif dan notifikasi portal sudah dinyalakan.",
    ],
  },
  {
    slug: "dashboard-mentor-cms-kehadiran-umpan-balik",
    title: "Dashboard Mentor: Kehadiran & Umpan Balik Murid",
    category: "CMS",
    level: "Menengah",
    duration: 8,
    order: 25,
    summary: "Untuk panitia/mentor: pilih kelas di CMS, tandai kehadiran murid satu klik, dan tulis umpan balik per murid.",
    content: [
      "Modul CMS **Kelas Live & Mentor** (id `liveclasses`) menggabungkan dua kebutuhan: mengelola kelas (CRUD) dan **Dashboard Mentor** — papan tunggal untuk memantau murid.",
      "## Pilih Kelas",
      "Panel Dashboard Mentor menampilkan chip setiap kelas beserta jumlah pendaftarnya. Klik chip — daftar murid muncul dengan nomor WhatsApp **dimasking** (hanya 6 karakter awal) demi pelindungan data.",
      "## Tandai Kehadiran",
      "Klik tombol **Tandai Hadir** per murid (atau ubah kembali). Ringkasan di kepala tabel menghitung hadir/total secara langsung. Setiap perubahan tercatat di **jejak audit** — siapa mengubah apa dan kapan.",
      "## Umpan Balik",
      "Tulis umpan balik di kolom per murid (mis. \"Partisipatif, lanjut ke LANJUTAN\") lalu klik di luar kolom — tersimpan otomatis. Umpan balik ini membantu keputusan jalur sertifikasi muthawwif berjenjang.",
      "## Masalah Umum",
      "Kelas tidak muncul — buat kelas dulu di CRUD di bawah panel mentor. Perubahan tak tersimpan — pastikan Anda mengklik keluar dari kolom (blur) dan koneksi stabil; bila gagal ada toast peringatan.",
    ],
  },
  {
    slug: "kurikulum-builder-drag-drop",
    title: "Kurikulum Builder: Susun Silabus Geser-Taruh",
    category: "CMS",
    level: "Menengah",
    duration: 7,
    order: 26,
    summary: "Susun modul, kuis, dan sertifikasi per kursus Akademi dengan drag-and-drop; tersimpan atomik.",
    content: [
      "Modul CMS **Kurikulum Builder** (id `syllabus`) menyusun silabus setiap kursus Akademi: **MODUL** (materi), **KUIS** (evaluasi), dan **SERTIFIKASI** (penutup).",
      "## Cara Menyusun",
      "Pilih kursus di dropdown, tambahkan entri dengan tombol **Modul/Kuis/Sertifikasi**, lalu **geser-taruh** pemegang kotak (atau pakai tombol naik/turun untuk aksesibilitas keyboard) untuk mengatur urutan. Setiap entri punya judul dan deskripsi opsional.",
      "## Penyimpanan Atomik",
      "Klik **Simpan** — seluruh urutan disimpan sekali jalan (replace-all). Bila ada entri tanpa judul, server menolak dengan pesan jelas. Penghitung di kanan atas menampilkan jumlah modul/kuis/sertifikasi secara langsung, dan jumlah MODUL ikut memperbarui metadata kursus.",
      "## Masalah Umum",
      "Drag tidak jalan di HP — gunakan tombol chevron naik/turun. \"Belum tersimpan\" muncul — badge emas menandai perubahan belum disimpan; jangan tinggalkan halaman sebelum klik Simpan.",
    ],
  },
  {
    slug: "rombongan-b2b-satu-tagihan",
    title: "Rombongan B2B: Anggota Massal, Satu Tagihan",
    category: "Bisnis",
    level: "Menengah",
    duration: 9,
    order: 27,
    summary: "Koordinator rombongan ≥10 jamaah: unggah daftar anggota massal di #/rombongan dan terima satu tagihan group order.",
    content: [
      "Halaman **Pendaftaran Rombongan B2B** (#/rombongan) melayani koordinator rombongan besar: bukan satu-satu checkout, melainkan **satu pengajuan dengan satu tagihan**.",
      "## Alur Pengajuan",
      "Isi nama rombongan, koordinator + WhatsApp, pilih paket, lalu tempel **daftar anggota** — satu nama per baris (boleh juga dipisah koma). Portal otomatis membersihkan nama ganda dan menghitung: **min. 10, maks. 200** anggota per pengajuan. Centang persetujuan UU PDP, kirim.",
      "## Harga & Kode",
      "Harga per jamaah **dihitung ulang server** saat pengajuan diproses — promo harga musiman & early bird ikut berlaku. Anda menerima **kode rombongan MHD-B2B-XXXX** untuk memantau status (kotak \"Pantau Status Rombongan\" di halaman yang sama) tanpa perlu login.",
      "## Setelah Pengajuan",
      "Pengajuan berstatus **PENDING** — panitia mengonfirmasi ketersediaan slot lalu menerbitkan **tagihan tunggal** sebesar harga × jumlah anggota. Slot rombongan baru dikunci setelah tagihan LUNAS. Kebijakan refund berjenjang tetap berlaku seperti checkout biasa.",
      "## Masalah Umum",
      "\"Terbaca 8 nama\" — kurang dari 10; tambah anggota atau pakai checkout biasa. Kode tidak ditemukan — periksa ejaan kode (huruf besar). Ingin membagi rombongan 250 orang — buat dua pengajuan (maks 200 per pengajuan).",
    ],
  },
  {
    slug: "refund-pembatalan-berjenjang",
    title: "Refund & Pembatalan: Kebijakan Berjenjang",
    category: "Jamaah",
    level: "Pemula",
    duration: 7,
    order: 28,
    summary: "Ajukan pembatalan pesanan LUNAS dari #/pesanan; pahami tier kebijakan H−30 s.d. H−2 dan proses audit-nya.",
    content: [
      "Pesanan yang sudah **LUNAS** dapat diajukan pembatalan dari halaman **#/pesanan** — panel **Pembatalan & Refund** muncul otomatis pada pesanan berstatus PAID.",
      "## Kebijakan Berjenjang",
      "Persen refund ditentukan **sisa hari menuju keberangkatan**: H−30 ke atas **100%** · H−29 s.d. H−14 **70%** · H−13 s.d. H−7 **50%** · H−6 s.d. H−3 **25%** · H−2 ke bawah **0%** (transfer ke rombongan lain dianjurkan). Bila tanggal keberangkatan belum ditetapkan, sistem memakai tier konservatif dan keputusan final ada di panitia.",
      "## Cara Mengajukan",
      "Buka panel, baca tabel kebijakan, tulis **alasan** (min. 5 karakter), klik **Ajukan Pembatalan**. Sistem memverifikasi nomor pesanan + nomor WhatsApp pemiliknya, lalu menampilkan **tier, persen, dan nominal estimasi** — semua dihitung server, bukan dari klien.",
      "## Proses & Audit",
      "Pengajuan diproses maksimal **7 hari kerja**. Keputusan panitia (Setujui/Tolak/Terbayar) dicatat di **jejak audit** — termasuk nominal final yang diverifikasi ulang saat disetujui. Anda dapat menghubungi panitia lewat tombol WhatsApp di halaman pesanan untuk progres.",
      "## Masalah Umum",
      "\"Hanya pesanan LUNAS\" — pesanan PENDING/CANCELLED tidak dapat diajukan; PENDING cukup dibiarkan hangus. \"Nomor WhatsApp tidak cocok\" — gunakan nomor yang dipakai saat checkout. Sudah pernah diajukan — satu pesanan satu pengajuan aktif; pantau statusnya di panitia.",
    ],
  },
  {
    slug: "merchant-kta-kemitraan-masjid-api-mitra",
    title: "Merchant Mitra, Kemitraan Masjid & API Mitra",
    category: "Bisnis",
    level: "Menengah",
    duration: 10,
    order: 29,
    summary: "Tiga gerbang kemitraan v14.1: tebus diskon merchant dengan KTA, daftar masjid/komunitas jadi mitra, dan integrasi via API publik v1.",
    content: [
      "Sprint v14.1 membuka tiga gerbang kemitraan sekaligus — untuk **jamaah** (diskon merchant), **masjid/komunitas** (portal penjangkauan), dan **mitra teknologi** (API publik).",
      "## 1. Merchant Partner KTA (#/benefit)",
      "Di bawah katalog benefit poin, ada seksi **Merchant Partner KTA**: diskon toko kurma, hotel, laundry, klinik vaksin, dan lainnya. Klik **Tebus dengan KTA**, masukkan nomor kartu — sistem memvalidasi **tier minimum** (KLASIK/VERIFIED/PLATINUM) secara server. Tunjukkan kartu di lokasi mitra; tebusan tercatat sebagai jejak untuk mitra dan CMS.",
      "## 2. Kemitraan Masjid & Komunitas (#/masjid)",
      "Masjid, komunitas, sekolah, dan yayasan dapat mendaftar jadi **mitra penjangkauan**: pilih program utama (Kajian / Tabarru & Kesehatan / Umrah Bersama), isi data lembaga + narahubung, kirim. Anda menerima **kode relasi MHD-MP-XXXX** untuk membuka **dashboard relasi** — status mitra, aktivitas kemitraan, dan catatan sekretariat. Pendaftaran diverifikasi maksimal 5 hari kerja.",
      "## 3. API Publik v1 untuk Mitra Teknologi",
      "Mitra integrasi mendapat **kunci API** (header `X-API-Key`) untuk membaca tiga endpoint publik: `/api/public/v1/status`, `/api/public/v1/packages`, dan `/api/public/v1/members` — dengan **kuota harian** yang direset tiap tanggal. Kunci hanya tampil **sekali** saat dibuat (sistem menyimpan hash); rotasi menghasilkan kunci baru. Webhook event ditandatangani **HMAC-SHA256** sehingga mitra bisa memverifikasi keaslian. Hubungi sekretariat untuk pendaftaran mitra API.",
      "## Masalah Umum",
      "Tebusan ditolak karena tier — kumpulkan poin KTA untuk naik tier. Kode MHD-MP tidak ditemukan — periksa huruf besar; bila baru mendaftar, status masih PENDING namun dashboard tetap bisa dibuka. API 403 QUOTA — kuota harian habis, reset otomatis pukul 00:00 WIB.",
    ],
  },
];

async function upsertTutorial(t: TutorialUpsert) {
  await db.tutorial.upsert({
    where: { slug: t.slug },
    create: {
      slug: t.slug,
      title: t.title,
      category: t.category,
      level: t.level,
      duration: t.duration,
      order: t.order,
      summary: t.summary,
      content: t.content.join("\n\n"),
      published: true,
    },
    update: {
      title: t.title,
      category: t.category,
      level: t.level,
      duration: t.duration,
      order: t.order,
      summary: t.summary,
      content: t.content.join("\n\n"),
      published: true,
    },
  });
}

async function main() {
  console.log("🌱 seed-tutorial-v141 — menanam 7 tutorial v14.1 «AKADEMI & MITRA»");
  for (const t of NEW_TUTORIALS) {
    await upsertTutorial(t);
    console.log(`  ✓ ${t.slug} (order ${t.order})`);
  }
  const total = await db.tutorial.count();
  const published = await db.tutorial.count({ where: { published: true } });
  console.log(`  Total tutorial: ${total} (published ${published})`);
  console.log("✅ seed-tutorial-v141 selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
