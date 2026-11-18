/**
 * seed-tutorial-v14.ts — v14.0 «KAMPANYE & KAWAL» (Task 31).
 *
 * 1) Menanam 8 tutorial baru (order 15–22) yang memandu fitur-fitur terbaru
 *    portal: checkout & invoice, KTA & poin, grup perjalanan, latihan manasik,
 *    brankas dokumen, kanal WhatsApp & struktur DPP, kupon CMS, push & pesanan.
 * 2) Menyegarkan 2 tutorial lama yang isinya tertinggal (memulai + CMS pusat
 *    tutorial) supaya daftar modul CMS selaras dengan platform hari ini.
 * 3) Menanam 3 kupon demo kampanye (idempoten).
 * 4) Membalik status roadmap R-042/R-017/R-080/R-066 → DONE dengan bukti.
 *
 * Idempoten: upsert berdasarkan slug/kode.
 * Jalankan: npx tsx scripts/seed-tutorial-v14.ts
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
    slug: "checkout-paket-hingga-invoice-pdf",
    title: "Checkout Paket: Dari Katalog ke Invoice PDF",
    category: "Jamaah",
    level: "Pemula",
    duration: 10,
    order: 15,
    summary: "Pesan paket umrah/haji langsung di portal: kupon diskon, pembayaran terarah, status LUNAS, dan invoice PDF otomatis.",
    content: [
      "Tutorial ini memandu Anda memesan paket perjalanan ibadah langsung di portal MUHDIN — dari memilih paket, memakai kupon diskon, hingga mengunduh invoice PDF resmi. Seluruh proses tanpa perlu datang ke kantor.",
      "## 1. Temukan Paket yang Tepat",
      "Buka menu **Paket** untuk membandingkan paket terverifikasi: filter harga, tanggal keberangkatan, dan baca **ulasan jamaah** pasca-perjalanan (satu ulasan per kartu per paket — anti-manipulasi). Untuk menentukan waktu berangkat yang hemat, buka **Kalender Musim Umrah & Haji**; di sana terlihat bulan puncak (Ramadan, musim haji) dan bulan hemat.",
      "## 2. Isi Formulir Checkout",
      "Di halaman detail paket ada panel **Pesan & Bayar Sekarang**: nama pemesan, nomor WhatsApp, jumlah jamaah (1–50), email opsional, dan catatan. Centang persetujuan **UU PDP** — wajib, karena data pribadi Anda diproses untuk pesanan ini.",
      "## 3. Pakai Kupon Diskon (Jika Ada)",
      "Tulis **kode kupon** lalu klik *Cek kupon*. Portal menampilkan potongan sebelum Anda membayar. Kupon punya aturan: jendela kampanye, kuota total, minimum belanja, dan batas per nomor WhatsApp. Nilai final **selalu dihitung ulang server saat checkout**, jadi tidak ada cara memakai kupon kedaluwarsa lewat pengubahan di sisi klien.",
      "## 4. Bayar & Lacak",
      "Setelah submit, Anda menerima **nomor pesanan** (ORD-…) + instruksi pembayaran dari penyedia pembayaran. Saat ini portal berjalan di **mode sandbox** (uji coba tanpa uang riil) — QRIS/VA riil menyusul dengan kredensial Midtrans/Xendit. Cek status kapan saja di **#/pesanan**; begitu LUNAS, **invoice PDF bernomor seri** terbit otomatis dan dapat diunduh.",
      "## 5. Aktifkan Notifikasi Keberangkatan",
      "Di halaman pesanan ada kartu **Aktifkan Notifikasi** (Web Push). Sekali aktif, pengumuman keberangkatan penting muncul langsung di perangkat Anda — tanpa aplikasi tambahan.",
      "## Masalah Umum",
      "**Kupon ditolak** — periksa masa berlaku/kuota/minimum belanja; satu nomor WhatsApp punya batas pemakaian per kupon. **Nominal berubah** — potongan kupon memang mengurangi total, lihat baris *Diskon kupon*. **Pesanan tidak LUNAS** — pesanan PENDING menunggu pembayaran; bila terlanjur lewat, hubungi panitia lewat tombol WhatsApp di halaman pesanan.",
    ],
  },
  {
    slug: "kartu-kta-digital-poin-tier-benefit",
    title: "Kartu KTA Digital: Poin, Tier & Benefit",
    category: "Jamaah",
    level: "Pemula",
    duration: 8,
    order: 16,
    summary: "Kenali kartu anggota digital, cara mengumpulkan poin, tiga tier keanggotaan, dan cara menukarkan benefit mitra.",
    content: [
      "Kartu Tanda Anggota (KTA) digital adalah identitas satu-satunya Anda di ekosistem MUHDIN. Kartu ini punya QR anti-palsu yang bisa dipindai oleh marshal di lapangan maupun masyarakat di halaman verifikasi publik.",
      "## Mengumpulkan Poin",
      "Ledger poin terekam otomatis dari tiga sumber: **pembayaran LUNAS** di marketplace (1 poin per Rp 10.000), **referral** (kode undangan di kartu Anda — pendaftaran yang Anda referensikan disetujui = poin masuk), dan **aktivitas Akademi** (kelulusan/kursus). Poin tidak bisa ditransfer dan tidak bisa diubah manual.",
      "## Tiga Tier Keanggotaan",
      "Tier dihitung otomatis dari total poin: **KLASIK** (awal) → **VERIFIED** (300 poin) → **PLATINUM** (800 poin). Semakin tinggi tier, semakin kaya katalog benefit yang bisa ditebus — diskon mitra, prioritas layanan, dan fasilitas ekosistem.",
      "## Menukar Benefit",
      "Di halaman **Benefit & Poin KTA** pilih benefit mitra, klik tebus, dan poin terpotong otomatis dengan catatan di ledger. Benefit terpakai langsung terlihat di kartu Anda.",
      "## Verifikasi Anti-Palsu",
      "Setiap kartu punya QR. Memindainya membuka **#/kta-verify** yang menampilkan identitas kartu dan **counter verifikasi** naik satu — panitia dapat menandai kartu yang pernah dipindai. Bila QR gagal dibaca, ketik kode kartu di halaman yang sama.",
      "## Masalah Umum",
      "**Poin tidak naik setelah pembayaran** — poin hanya terbit saat pesanan LUNAS (bukan saat PENDING). **Tier tidak berubah** — tier menunggu perhitungan ledger terbaru; muat ulang halaman keanggotaan. **Kartu hilang** — kartu digital tidak bisa hilang; buka kembali lewat dashboard Anda.",
    ],
  },
  {
    slug: "grup-perjalanan-digital-kode-rombongan",
    title: "Grup Perjalanan Digital: Bergabung dengan Kode Rombongan",
    category: "Jamaah",
    level: "Pemula",
    duration: 6,
    order: 17,
    summary: "Masuk ruang rombongan lewat kode MHD-GR-XXXX: anggota, jadwal kumpul, chat singkat, dan kontak marshal satu layar.",
    content: [
      "Grup Perjalanan Digital adalah ruang khusus per rombongan. Tidak perlu aplikasi tambahan: cukup buka **#/grup** dan masukkan kode bergabung dari panitia.",
      "## Masuk Ruang",
      "Panitia rombongan membuat grup di CMS lalu membagikan **kode MHD-GR-XXXX** (tanpa karakter membingungkan). Buka **#/grup**, tulis kode Anda, isi nama (dan nomor kartu bila diminta), klik **Gabung**. Nama dobel pada grup yang sama otomatis ditolak agar daftar anggota tetap jujur.",
      "## Isi Ruang",
      "Di dalam ruang ada: **kontak marshal** (tombol WhatsApp satu ketuk), **daftar anggota** (marshal ditandai), **jadwal kumpul** (mendatang & sudah lewat), dan **chat singkat** maksimal 500 karakter yang menyegarkan tiap 15 detik. Chat dipantau panitia — pesanan melanggar dapat dihapus moderator.",
      "## Untuk Panitia",
      "Di CMS: menu **Grup Perjalanan** untuk membuat grup (kode dibangkitkan server, tidak bisa diedit) dan **Jadwal Grup & Chat** untuk menambah jadwal kumpul serta memoderasi pesan. Bagikan kode segera setelah grup dibuat.",
      "## Masalah Umum",
      "**Kode tidak dikenal** — periksa huruf/angka (kode menghindari 0/O dan 1/l yang mirip). **Chat tidak bergerak** — halaman memeriksa pesan baru tiap 15 detik; tunggu sebentar. **Sudah bergabung salah nama** — minta panitia menghapus entri Anda di CMS, lalu gabung ulang.",
    ],
  },
  {
    slug: "latihan-manasik-berjenjang-di-portal",
    title: "Latihan Manasik Berjenjang: Dasar, Lanjutan, Mentor",
    category: "Jamaah",
    level: "Pemula",
    duration: 12,
    order: 18,
    summary: "Berlatih soal manasik per jenjang dengan pembahasan — pengacakan server, kunci jawaban tak pernah dikirim ke klien.",
    content: [
      "Portal menyediakan **bank soal manasik berjenjang** di **#/latihan** untuk mempersiapkan ibadah sekaligus menjadi jalur persiapan sertifikasi muthawwif. Butir soal dikurasi per jenjang: **DASAR** (21 butir), **LANJUTAN** (21), **MENTOR** (21) dalam kategori Umum, Rukun, Larangan, Doa, Waktu, dan Wanita.",
      "## Alur Latihan",
      "1. Pilih jenjang di halaman latihan (lihat jumlah butir aktif per jenjang).\n2. Sesi berisi **10 soal** yang diacak **server-side** — urutan soal dan urutan opsi berubah tiap sesi.\n3. Jawab sambil berpindah-pindah; progres tampil di bar atas.\n4. Kumpulkan → sistem mengoreksi di server dan menampilkan **skor 0–100 + pembahasan per butir**.\n5. Klik **Ulangi** untuk sesi baru (soal & opsi diacak ulang).",
      "## Kenapa Jawaban Tidak Bisa Dibocorkan",
      "Kunci jawaban dan pembahasan **tidak pernah dikirim ke perangkat Anda** sebelum Anda mengumpulkan jawaban. Pengacakan Fisher-Yates dilakukan di server. Ini menjamin skor latihan benar-benar mencerminkan pemahaman.",
      "## Kaitan dengan Sertifikasi Muthawwif",
      "Jalur sertifikasi **DASAR → LANJUTAN → MENTOR** mensyaratkan skor ujian (≥70/≥80/≥85), jam pelayanan (≥0/200/500), dan pengalaman ≥3 tahun untuk Mentor. Latihan di portal adalah cara terbaik berlatih sebelum evaluasi resmi; lulus jenjang sebelumnya wajib sebelum naik jenjang.",
      "## Untuk Pengajar",
      "Butir baru ditambah lewat CMS (endpoint soal-manasik) lengkap dengan kategori, empat opsi, kunci, dan pembahasan. Bila butir usang, nonaktifkan — sesi otomatis hanya mengambil butir aktif.",
    ],
  },
  {
    slug: "brankas-dokumen-jamaah-enkripsi",
    title: "Brankas Dokumen Jamaah: Simpan & Enkripsi",
    category: "Jamaah",
    level: "Menengah",
    duration: 9,
    order: 19,
    summary: "Simpan paspor/visa/vaksin satu tempat dengan enkripsi at-rest AES-256-GCM dan masking nomor dokumen di portal.",
    content: [
      "Brankas Dokumen adalah tempat tunggal menyimpan referensi dokumen penting jamaah: nomor paspor, visa, kartu vaksin, dan dokumen pendukung lain — lengkap dengan pengingat masa berlaku.",
      "## Mengakses Brankas",
      "Buka **#/vault** (menu footer), masukkan **kode kartu jamaah** Anda. Portal menampilkan daftar dokumen milik kartu itu dengan **nomor disamarkan** (contoh `C12••••67`) — cukup untuk memastikan dokumen mana yang mana tanpa memamerkan nomor penuh.",
      "## Cara Kerja Enkripsi (Kenapa Aman)",
      "Sejak v13.3, setiap nomor dokumen **dienkripsi at-rest dengan AES-256-GCM** (kunci VAULT_KEY di server, bukan di database). Artinya: bila ada yang menyalin isi database, nomor dokumen Anda tetap terbaca sebagai ciphertext — tidak berguna tanpa kunci. Saat Anda membuka brankas, server mendekripsi sementara untuk tampilan, dan mencari dokumen tetap berdasarkan **teks asli** hasil dekripsi (pencarian admin).",
      "## Menambah Dokumen (Panitia)",
      "Panitia menambah dokumen lewat CMS **Operasi Jamaah → Brankas Dokumen**: pilih kartu, jenis dokumen, nomor, tanggal kedaluwarsa, dan catatan. Data tersimpan terenkripsi otomatis; tidak ada langkah manual tambahan.",
      "## Masalah Umum",
      "**Nomor tampak aneh (enc:v1:…)** — itu ciphertext yang terlihat bila enkripsi gagal dijalankan; laporkan ke admin untuk migrasi ulang. **Tidak menemukan dokumen** — pastikan kode kartu benar; dokumen milik kartu lain tidak akan tampil. **Lupa kedaluwarsa** — kolom tanggal kedaluwarsa memicu pengingat; lengkapi saat input.",
    ],
  },
  {
    slug: "kanal-whatsapp-resmi-dan-struktur-dpp",
    title: "18 Kanal WhatsApp Resmi & Struktur DPP 2026–2031",
    category: "Umum",
    level: "Pemula",
    duration: 7,
    order: 20,
    summary: "Peta resmi komunikasi organisasi: 17 grup spesialis + 1 kanal pengumuman, aturan Primary Membership, dan struktur kepengurusan.",
    content: [
      "MUHDIN mengelola komunikasi organisasi lewat **Master WhatsApp Community Architecture — Final Edition**: **17 grup spesialis + 1 kanal pengumuman** dalam **6 ekosistem**. Halaman **#/komunitas** adalah direktori resminya.",
      "## Aturan Dasar (Penting)",
      "**Primary Membership**: setiap anggota memiliki **satu grup utama** sesuai identitas/tugasnya. **Functional Access**: akses ke grup lain diberikan hanya bila memang punya tugas khusus. Prinsip kunci: *satu fungsi satu rumah koordinasi · satu anggota satu grup utama · kolaborasi sesuai kebutuhan pekerjaan*. Grup 00 adalah kanal pengumuman — bukan grup diskusi kedua.",
      "## Memilih Grup yang Tepat",
      "Di #/komunitas setiap kartu grup memuat: nama resmi, fungsi utama, profil anggota, dan **naskah deskripsi siap-copas** (tombol SALIN). Filter per ekosistem: Governance & Leadership, Membership & Industry, Business & Services, Institutional & Global, Knowledge & Innovation, Regional Organization. Pemetaan **15 departemen DPP → grup** tersedia dalam tabel di halaman yang sama.",
      "## Struktur Kepengurusan",
      "Halaman **#/pengurus** memuat Master Final DPP 2026–2031: dua pilar (Ketua Umum & Sekjen), empat dewan (Penasihat, Kehormatan, Pakar, Pengawas), pimpinan inti, **15 bidang strategis** dengan subbidang, **3 bidang khusus**, 38 DPW, dan standar kerja 5 unsur + 11 KPI. Status personalia ditampilkan apa adanya (USULAN / PERLU KONFIRMASI / BELUM DITETAPKAN) — portal tidak pernah mengklaim jabatan yang belum ditetapkan.",
      "## Untuk Koordinator",
      "Koordinator tiap grup tercantum di #/komunitas. Saat menambah anggota: cocokkan Primary Membership dari profil anggota, jangan memasukkan satu orang ke banyak grup, dan gunakan naskah deskripsi resmi agar aturan grup konsisten di seluruh wilayah.",
    ],
  },
  {
    slug: "cms-voucher-dan-kupon-kampanye",
    title: "CMS: Voucher & Kupon Kampanye",
    category: "CMS",
    level: "Menengah",
    duration: 10,
    order: 21,
    summary: "Rancang kode diskon berbatas waktu untuk checkout marketplace — kuota, segmen minimum, dan pantau tebusan nyata.",
    content: [
      "Modul **Voucher & Kupon** (CMS) adalah amunisi kampanye musiman: kode diskon untuk checkout marketplace dengan kendali penuh atas jangkauan dan kuota.",
      "## Membuat Kupon",
      "Masuk CMS → **Voucher & Kupon** → Tambah. Isi: **kode** (3–40 karakter, huruf besar, tanpa spasi), **jenis potongan** (PERCENT 1–100% atau FIXED rupiah), **nilai**, **subtotal minimum**, **batas maksimum diskon** (untuk PERCENT), **jendela kampanye** (mulai/berakhir, kosong = langsung/tanpa batas), **kuota total**, **batas per nomor WhatsApp** (default 1), dan label keterangan.",
      "## Cara Kupon Dihitung (Anti-Manipulasi)",
      "Panel checkout jamaah hanya **pratinjau**. Saat checkout benar-benar dikirim, server menghitung ulang dari database: kupon aktif, dalam jendela kampanye, kuota belum habis, subtotal memenuhi minimum, dan nomor WhatsApp belum melewati batas. Potongan = paling kecil dari nilai kupon dan subtotal. **Teberaan (redemption) baru dicatat saat pesanan LUNAS** — idempoten: order yang sama tidak pernah menaikkan kuota dua kali.",
      "## Memantau Kampanye",
      "Empat kartu ringkasan di atas modul: kupon terdaftar, sedang aktif, kali dipakai, dan **total diskon diberikan pada pesanan LUNAS**. Kolom *Terpakai* menampilkan `usedCount/kuota` berwarna merah saat kuota penuh.",
      "## Resep Kampanye",
      "**Ramadan**: PERCENT 10% + maxDiscount Rp 1.000.000 + kuota 100 + perPhone 1 + jendela 1 bulan. **Early bird bulan hemat** (lihat Kalender Musim): FIXED Rp 500.000 tanpa minAmount untuk menarik pemesan awal. **Grup besar**: kuota besar + minAmount tinggi agar hanya rombongan yang memenuhi.",
      "## Masalah Umum",
      "**Kupon tidak berlaku di checkout** — cek aktif, jendela, kuota, minimum, dan batas per nomor. **Angka kosong jadi batas** — kolom angka yang dikosongkan dianggap tanpa batas (0 = tanpa batas), bukan nol rupiah. **Kuota meleset** — tebusan hanya dihitung dari pesanan LUNAS; pesanan PENDING tidak memakan kuota.",
    ],
  },
  {
    slug: "cms-pesanan-invoice-dan-push-keberangkatan",
    title: "CMS: Pesanan, Invoice & Push Keberangkatan",
    category: "CMS",
    level: "Menengah",
    duration: 9,
    order: 22,
    summary: "Kelola pesanan checkout hingga LUNAS, pahami invoice otomatis, dan kirim pengumuman keberangkatan Web Push.",
    content: [
      "Tiga modul CMS bekerja satu alur: **Pesanan & Invoice** (status pembayaran), **Dashboard Omzet** (pendapatan), dan **Push Keberangkatan** (notifikasi jamaah).",
      "## Alur Pesanan",
      "Setiap checkout jamaah membuat pesanan **PENDING** dengan intent pembayaran dari penyedia aktif (mode SANDBOX saat ini). Ketika webhook pembayaran ber-signature HMAC datang, server menerapkan **applyPaid** atomik: status → **PAID**, invoice bernomor seri terbit, poin KTA mengalir ke penyelenggara pemilik paket, dan tebusan kupon tercatat bila ada. Callback berulang untuk pesanan yang sudah LUNAS dijawab dengan invoice yang sama — **tidak ada efek ganda**. Transisi manual: `paid` (terima pembayaran luar) dan `refund`; status PAID tidak bisa ditimpa.",
      "## Membaca Invoice",
      "Invoice berisi nomor seri + ringkasan pesanan + QR lacak. Jamaah mengunduhnya dari #/pesanan; admin melihat tautan yang sama di kolom invoice modul Pesanan.",
      "## Push Keberangkatan",
      "Modul **Push Keberangkatan** menampilkan jumlah langganan notifikasi dan status kunci VAPID. Pilih pesanan/kartu tujuan, tulis judul + isi, kirim. Server otomatis **membersihkan langganan mati** (respons 404/410 dari browser) agar daftar tetap sehat, dan mencatat audit pengiriman. Jamaah mengizinkan lewat kartu *Aktifkan Notifikasi* di #/pesanan atau #/lacak.",
      "## Masalah Umum",
      "**Webhook gagal 401** — signature HMAC salah/kunci PAYMENT_WEBHOOK_SECRET tidak sinkron; webhook tanpa signature memang selalu ditolak (fail-closed). **Push terkirim 0** — langganan memang kosong atau telah dibersihkan; minta jamaah mengaktifkan notifikasi. **Poin tidak masuk** — poin hanya untuk paket milik penyelenggara anggota berkartu.",
    ],
  },
];

/** Penyegaran dua tutorial lama — konten baru (bukan patch). */
const REFRESH: { slug: string; title: string; summary: string; content: string[] }[] = [
  {
    slug: "panduan-memulai-mengenal-portal-muhdin",
    title: "Panduan Memulai: Mengenal Portal MUHDIN",
    summary:
      "Tur singkat seluruh fitur portal — dari direktori resmi 2.500+ penyelenggara, marketplace paket, KTA digital, hingga ruang rombongan dan latihan manasik.",
    content: [
      "Portal MUHDIN adalah rumah digital Masyarakat Umroh Haji Digital Indonesia — asosiasi payung penyelenggara ibadah Indonesia yang diposisikan sebagai titik koordinasi tunggal akses platform Nusuk. Tutorial ini memandu Anda mengenal seluruh fitur utama portal dalam waktu kurang dari sepuluh menit.",
      "## Peta Fitur Utama",
      "- **Direktori Anggota**: 2.500+ penyelenggara (PPIU/PIHK/travel) dengan pindai izin & compliance checker — cek legalitas sebelum membayar apa pun.",
      "- **Marketplace Paket**: katalog paket terverifikasi dengan itinerary harian, seat map, ulasan ber-agregat, checkout hingga invoice PDF, dan kupon diskon kampanye.",
      "- **Kalender Musim**: peta permintaan 12 bulan + indikasi harga agar memilih waktu keberangkatan terbaik.",
      "- **KTA Digital**: kartu ber-QR anti-palsu, poin lintas layanan, tier KLASIK→VERIFIED→PLATINUM, dan katalog benefit mitra.",
      "- **Grup Perjalanan Digital**: ruang rombongan berbasis kode — anggota, jadwal kumpul, chat, kontak marshal.",
      "- **Latihan Manasik**: bank soal berjenjang dengan pembahasan; jalur sertifikasi muthawwif DASAR→LANJUTAN→MENTOR.",
      "- **Brankas Dokumen**: paspor/visa/vaksin satu tempat, terenkripsi AES-256-GCM at-rest.",
      "- **Organisasi**: struktur DPP 2026–2031 (#/pengurus) dan 18 kanal WhatsApp resmi (#/komunitas).",
      "- **Layanan Publik**: papan status (#/status), Duty Officer 24/7 (#/darurat), Nusuk (6 jenis izin), tur virtual 360°.",
      "## Untuk Penyelenggara (Mitra)",
      "- **Gabung & Pendaftaran**: alur pendaftaran anggota dengan verifikasi tim.",
      "- **Pusat Bisnis B2B**: bursa kursi, vendor, muthawwif, dan kepatuhan izin.",
      "- **Dashboard Mitra**: omzet, funnel pendaftaran, kampanye & kupon, push keberangkatan.",
      "## Bahasa & Akses",
      "Portal penuh tiga bahasa (Indonesia/English/العربية) — pilih lewat pemilih bahasa di navbar; mode gelap tersedia. Tanpa akun pun Anda dapat menelusuri direktori, paket, verifikasi, dan tutorial ini.",
    ],
  },
  {
    slug: "menggunakan-cms-pusat-tutorial-faq-testimoni",
    title: "Menggunakan CMS: Pusat Tutorial, FAQ & Testimoni",
    summary:
      "Kelola tiga modul konten edukasi sekaligus — Tutorial, FAQ, dan Testimoni — plus daftar seluruh modul CMS yang tersedia hari ini.",
    content: [
      "Tiga modul konten edukasi — Tutorial, FAQ, dan Testimoni — bekerja bersama membangun literasi dan kepercayaan jamaah. Tutorial ini membahas pengelolaan ketiganya melalui CMS, dan menutup dengan peta seluruh modul CMS agar Anda tidak lagi mencari-cari.",
      "## Mengelola Tutorial",
      "Modul Tutorial mendukung kategori (Umum/CMS/Jamaah/Mitra), tingkat (Pemula/Menengah/Mahir), estimasi durasi, urutan tampil, dan status terbit. Konten memakai **Markdown** (## judul seksi, **tebal**, daftar bernomor). Saat ini terdapat 20+ tutorial terkurasi — dari checkout hingga kupon kampanye. Publikasikan dengan urutan wajar: tutorial dasar di depan.",
      "## Mengelola FAQ",
      "FAQ tampil di halaman bantuan dan kontak. Pertanyaan umum dikelompokkan per kategori dengan urutan tayang. Pertanyaan yang muncul berulang di pesan masuk adalah kandidat FAQ baru — jawab sekali, dinikmati semua.",
      "## Memoderasi Testimoni",
      "Testimoni jamaah tampil setelah disetujui. Jangan mengubah isi tulisan asli; cukup setujui/tolak. Satu jamaah satu testimoni per paket (dedupe otomatis).",
      "## Peta Modul CMS (Berkembang)",
      "Berita & Artikel · 13 Ekosistem · Alur Perjalanan · Direktori Anggota & Impor CSV · Pendaftaran · Marketplace Paket · Booking · **Pesanan & Invoice** · **Dashboard Omzet** · **Funnel Pendaftaran** · **Push Keberangkatan** · **Kampanye Musiman** · **Voucher & Kupon** · Tutorial · FAQ · Testimoni · Pesan Masuk · Pengaduan · Forum · Kartu Jamaah · Pusat Bisnis B2B · Operasi Jamaah (brankas & GPS) · **Grup Perjalanan** · **Jadwal Grup & Chat** · Compliance Checker · Roadmap 99 · Keamanan Akun (2FA) · Paspor & GPS · Akademi & Sertifikat · Booking & Slot · Benefit & Poin · Tur Virtual · Permintaan PDP · Kesehatan Sistem · Broadcast & Vendor · Nusuk · Galeri · Agenda · Pusat Unduhan · Log Aktivitas · Kelola Admin. Teks tebal adalah modul yang baru di v13–v14.",
    ],
  },
];

/* ============================ KUPON DEMO ============================ */

async function seedCoupons() {
  const year = new Date().getFullYear();
  const end = new Date(`${year}-12-31T23:59:59`);
  const rows = [
    {
      code: "UMRAH14",
      discountType: "PERCENT",
      value: 14,
      minAmount: 5_000_000,
      maxDiscount: 1_000_000,
      usageLimit: 100,
      perPhoneLimit: 1,
      description: "Kampanye demo v14 — 14% maks Rp 1 juta",
      endsAt: end,
    },
    {
      code: "HEMAT2JT",
      discountType: "FIXED",
      value: 2_000_000,
      minAmount: 25_000_000,
      maxDiscount: null,
      usageLimit: 20,
      perPhoneLimit: 1,
      description: "Diskon tetap Rp 2 juta untuk grup besar",
      endsAt: end,
    },
    {
      code: "EARLYBIRD",
      discountType: "PERCENT",
      value: 8,
      minAmount: 0,
      maxDiscount: 500_000,
      usageLimit: null,
      perPhoneLimit: 2,
      description: "Pemesan awal — 8% maks Rp 500 ribu",
      endsAt: end,
    },
  ];
  for (const r of rows) {
    await db.coupon.upsert({ where: { code: r.code }, create: { ...r }, update: {} });
  }
  console.log(`  kupon demo: ${rows.length} tersedia (UMRAH14, HEMAT2JT, EARLYBIRD)`);
}

/* ============================ TUTORIALS ============================ */

async function upsertTutorial(t: TutorialUpsert) {
  const data = {
    title: t.title,
    category: t.category,
    level: t.level,
    duration: t.duration,
    order: t.order,
    summary: t.summary,
    content: t.content.join("\n\n"),
    published: true,
  };
  await db.tutorial.upsert({
    where: { slug: t.slug },
    create: { slug: t.slug, ...data },
    update: data,
  });
}

async function main() {
  console.log("== seed-tutorial-v14 ==");

  for (const t of NEW_TUTORIALS) {
    await upsertTutorial(t);
  }
  console.log(`  tutorial baru: ${NEW_TUTORIALS.length} upsert`);

  for (const r of REFRESH) {
    const existing = await db.tutorial.findUnique({ where: { slug: r.slug } });
    if (!existing) {
      console.log(`  ⚠ refresh dilewati (tidak ditemukan): ${r.slug}`);
      continue;
    }
    await db.tutorial.update({
      where: { slug: r.slug },
      data: {
        title: r.title,
        summary: r.summary,
        content: r.content.join("\n\n"),
        published: true,
      },
    });
  }
  console.log(`  tutorial refresh: ${REFRESH.length}`);

  await seedCoupons();

  /* -------- Flip roadmap R-042, R-017, R-080, R-066 → DONE -------- */
  const flips: Record<string, string> = {
    "R-042":
      "Kupon kampanye end-to-end: model Coupon + CouponRedemption, lib/coupon.ts (validasi aktif/jendela/kuota/per-WA/minAmount, potongan ≤ subtotal), /api/coupons CRUD guardAdmin + audit, /api/coupons/validate publik rate-limit 10/menit, checkout memvalidasi ulang server-side (klien tak pernah dipercaya) + kolom discountAmount/couponCode pada Order, tebusan tercatat idempoten saat LUNAS di applyPaid (upsert orderId unik + usedCount di bawah kuota), panel checkout dengan pratinjau potongan + baris diskon, CMS Voucher & Kupon (4 kartu ringkasan + CrudManager, CrudConfig.onSaved baru), i18n 3 bahasa, seed 3 kupon demo (selesai v14.0).",
    "R-017":
      "Halaman #/kalender: peta permintaan 12 bulan (bar grafik + kartu per bulan), tingkat permintaan RENDAH→PUNCAK, indikasi harga HEMAT→PUNCAK, catatan & saran praktis tri-bahasa di sumber data (lib/season-calendar.ts), statistik bulan hemat & puncak, disclaimer jujur 'pola umum industri, bukan harga final', CTA ke katalog paket; menu Layanan Digital + i18n 3 bahasa (selesai v14.0).",
    "R-080":
      "scripts/pentest-berkala.mts (bun run pentest) — pentest black-box runtime: 4 butir security headers, 16 endpoint mutasi admin wajib 401/403, webhook fail-closed (tanpa & signature palsu), burst rate-limit + backoff adaptif, probe SQL/XSS/path-traversal pada pencarian publik, IDOR & method probing; laporan PASS/FAIL per butir + exit 1 saat CRITICAL (CI-ready). Hasil perdana: temuan header keamanan hilang (A1–A4) diperbaiki di next.config.ts (X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy) (selesai v14.0).",
    "R-066":
      "docs/design-system.md — rujukan resmi identitas visual terukur dari kode: 3 keluarga font (Plus Jakarta Sans/Amiri/Noto Kufi Arabic), token warna oklch mode terang & gelap (primary/forest/gold lengkap dengan audit kontras Spectrum 8), radius & pola kartu, animasi framer-motion (EASE_PREMIUM [0.21,0.47,0.32,0.98], 0.55s, stagger 0.08), registry 107 ikon, pola halaman portal, konvensi kode (i18n dot-key, data-testid, guard+rate-limit+audit), do&don't, checklist komponen baru (selesai v14.0).",
  };
  for (const [code, desc] of Object.entries(flips)) {
    const row = await db.roadmapItem.findUnique({ where: { code } });
    if (!row) {
      console.log(`  ⚠ roadmap ${code} tidak ditemukan`);
      continue;
    }
    await db.roadmapItem.update({
      where: { code },
      data: { status: "DONE", description: desc },
    });
    console.log(`  roadmap ${code} → DONE`);
  }

  const total = await db.tutorial.count();
  const done = await db.roadmapItem.count({ where: { status: "DONE" } });
  const coupons = await db.coupon.count();
  console.log(`  TOTAL tutorial: ${total} · roadmap DONE: ${done}/99 · kupon: ${coupons}`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
