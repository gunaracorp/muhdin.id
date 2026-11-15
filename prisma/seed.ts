/**
 * ============================================================
 * SEED DATA MUHDIN — Masyarakat Umroh Haji Digital Indonesia
 * "Asosiasi di Atas Asosiasi" — titik koordinasi akses Nusuk bagi industri
 * Tagline: Bersama Melayani Tamu Allah
 * ------------------------------------------------------------
 * Jalankan: cd /home/z/my-project && bun prisma/seed.ts
 * Idempotent: menghapus seluruh data lama sebelum insert.
 * ============================================================
 */

import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes } from "node:crypto";

// Fallback agar seed dapat dijalankan langsung dari akar proyek
// (relatif terhadap cwd — jangan hardcoded path mesin tertentu).
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${process.cwd()}/db/custom.db`;
}

const prisma = new PrismaClient();

// ---------- Helper ----------
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return salt + ":" + hash;
}

// ============================================================
// DATA
// ============================================================

// ---------- 1. USER ADMIN ----------
const adminPassword = hashPassword("muhdin2026");

// ---------- 2. SITE SETTINGS ----------
const siteSettings: { key: string; value: string }[] = [
  { key: "siteName", value: "MUHDIN" },
  { key: "tagline", value: "Masyarakat Umroh Haji Digital Indonesia" },
  {
    key: "heroTitle",
    value: "Transformasi Digitalisasi Umroh & Haji Indonesia 2030",
  },
  {
    key: "heroSubtitle",
    value:
      "Syurga bagi pengusaha pelayan Tamu Allah dan kenyamanan jamaah dalam ibadah — Melayani dengan Amanah, Profesional, Terstandar dan Penuh Keberkahan.",
  },
  {
    key: "vision",
    value:
      "Menjadi jaringan ekosistem layanan umroh dan haji paling tepercaya, terstandar, dan terdigitalisasi dari dan menuju Indonesia pada tahun 2030, sehingga setiap jamaah dapat menunaikan ibadah dengan tenang, aman, dan penuh keberkahan.",
  },
  {
    key: "mission",
    value:
      "1) Mengonsolidasikan penyelenggara jasa ibadah Indonesia dalam satu payung tata kelola; 2) Mengintegrasikan seluruh rantai layanan jamaah melalui platform digital real-time dengan Nusuk; 3) Meningkatkan profesionalisme SDM ibadah melalui sertifikasi; 4) Melindungi jamaah melalui transparansi harga dan perlindungan finansial; 5) Meningkatkan daya saing industri Indonesia dalam kemitraan dengan Arab Saudi.",
  },
  { key: "email", value: "info@muhdin.web.id" },
  { key: "phone", value: "+62 21 1234 5678" },
  {
    key: "address",
    value: "Gedung Asosiasi MUHDIN, Jakarta Pusat, Indonesia",
  },
  { key: "website", value: "https://muhdin.web.id" },
  { key: "instagram", value: "https://instagram.com/muhdin.official" },
  { key: "youtube", value: "https://youtube.com/@muhdinofficial" },
  { key: "facebook", value: "https://facebook.com/muhdin.official" },
  { key: "twitter", value: "https://twitter.com/muhdin_official" },
  { key: "whatsapp", value: "+6281222345856" },
];

// ---------- 3. ECOSYSTEM (13) ----------
const ecosystems = [
  {
    number: 1,
    name: "Visa Umroh & Haji",
    cluster: "Akses & Mobilitas",
    scope: "Pengurusan visa dan dokumen perjalanan ibadah",
    standard: "Integrasi resmi Nusuk; kuota dan jadwal terverifikasi",
    icon: "passport",
    color: "emerald",
    description:
      "Pelayanan pengurusan visa umroh dan haji melalui integrasi resmi dengan platform Nusuk, memastikan setiap dokumen diproses cepat, aman, dan sesuai ketentuan Arab Saudi. Kuota serta jadwal keberangkatan terverifikasi secara sistem, sehingga jamaah dapat memantau status visa secara real time sejak pengajuan hingga terbit.",
  },
  {
    number: 2,
    name: "Handling di Indonesia",
    cluster: "Akses & Mobilitas",
    scope: "Check-in, imigrasi, lounge, dan pendampingan keberangkatan",
    standard: "SLA waktu proses; personel terstandar di bandara utama",
    icon: "plane-takeoff",
    color: "teal",
    description:
      "Layanan check-in, imigrasi, lounge, dan pendampingan keberangkatan di bandara-bandara utama Indonesia dengan personel yang terstandar. Mekanisme SLA waktu proses menjamin rombongan melewati seluruh titik keberangkatan secara cepat, tertib, dan tanpa antrean yang melelahkan.",
  },
  {
    number: 3,
    name: "Tour Leader Bersertifikasi",
    cluster: "Akses & Mobilitas",
    scope: "Pendampingan rombongan sejak titik kumpul hingga kepulangan",
    standard: "Sertifikasi kompetensi dan manasik; rasio pendamping terukur",
    icon: "users",
    color: "sky",
    description:
      "Pendampingan rombongan oleh tour leader bersertifikasi sejak titik kumpul di Indonesia hingga kepulangan kembali ke tanah air. Sertifikasi mencakup kompetensi manajemen rombongan, manasik, dan penanganan situasi darurat, dengan rasio pendamping terukur untuk menjamin kualitas layanan.",
  },
  {
    number: 4,
    name: "Handling di Saudi",
    cluster: "Akses & Mobilitas",
    scope: "Penerimaan, fast track, imigrasi, bagasi, transport awal",
    standard: "Mitra handler terverifikasi; pemantauan kedatangan real time",
    icon: "plane-landing",
    color: "blue",
    description:
      "Penerimaan rombongan di bandara Jeddah dan Madinah meliputi fast track, pendampingan imigrasi, pengurusan bagasi, hingga transport awal menuju hotel. Seluruh mitra handler terverifikasi dan setiap kedatangan dipantau secara real time agar bus serta tour leader telah menunggu di posisi.",
  },
  {
    number: 5,
    name: "Mutawif Bersertifikasi",
    cluster: "Akses & Mobilitas",
    scope: "Pembimbing ibadah profesional di Tanah Suci",
    standard: "Standar kompetensi, bahasa, dan akhlak; penilaian oleh jamaah",
    icon: "book-open",
    color: "indigo",
    description:
      "Pembimbing ibadah profesional yang mendampingi jamaah di Tanah Suci dengan standar kompetensi, penguasaan bahasa, dan akhlak yang teruji. Setiap mutawif dinilai langsung oleh jamaah melalui aplikasi, menjadikan mutu pembinaan ibadah terjaga secara berkelanjutan.",
  },
  {
    number: 6,
    name: "Akomodasi Hotel",
    cluster: "Pengalaman Ibadah",
    scope: "Hotel berstandar Nusuk di Makkah, Madinah, dan Jeddah",
    standard: "Verifikasi jarak, fasilitas, dan rating mutu berkala",
    icon: "building-2",
    color: "violet",
    description:
      "Jaringan hotel berstandar Nusuk di Makkah, Madinah, dan Jeddah yang diverifikasi jarak, fasilitas, serta rating mutunya secara berkala. Jamaah menerima voucher digital dengan kepastian kelas kamar sesuai paket yang dibeli, tanpa perbedaan antara janji dan kenyataan.",
  },
  {
    number: 7,
    name: "Transportasi",
    cluster: "Pengalaman Ibadah",
    scope: "Bus, kereta Haramain, dan kendaraan city tour",
    standard: "Armada terstandar; jadwal terintegrasi dalam satu sistem",
    icon: "bus",
    color: "purple",
    description:
      "Penyediaan bus, kereta Haramain, dan kendaraan city tour dengan armada terstandar serta pengemudi berpengalaman. Seluruh jadwal dan rute terintegrasi dalam satu sistem, sehingga perpindahan antar kota maupun dalam kota berjalan tepat waktu.",
  },
  {
    number: 8,
    name: "Wisata Ziarah",
    cluster: "Pengalaman Ibadah",
    scope: "Kurasi ziarah Makkah, Madinah, dan destinasi sejarah Islam",
    standard: "Rute dan narasi terkurasi; pemandu berlisensi",
    icon: "map",
    color: "fuchsia",
    description:
      "Kurasi perjalanan ziarah di Makkah, Madinah, dan destinasi sejarah Islam dengan rute serta narasi yang terstandar. Didampingi pemandu berlisensi, jamaah memperoleh pengalaman ziarah yang mendalam, edukatif, dan nyaman.",
  },
  {
    number: 9,
    name: "Raudah",
    cluster: "Pengalaman Ibadah",
    scope: "Manajemen jadwal dan akses resmi berkunjung ke Raudah",
    standard: "Distribusi slot yang adil antar rombongan",
    icon: "landmark",
    color: "pink",
    description:
      "Manajemen jadwal dan akses resmi berkunjung ke Raudah di Masjid Nabawi melalui sistem yang terintegrasi dengan Nusuk. Distribusi slot diatur secara adil antar rombongan sehingga setiap jamaah memperoleh kesempatan beribadah dengan tenang.",
  },
  {
    number: 10,
    name: "Konsumsi & Restoran",
    cluster: "Pengalaman Ibadah",
    scope: "Penyediaan makanan dan minuman selama perjalanan",
    standard: "Halal, higienis, cita rasa Indonesia dan internasional",
    icon: "utensils",
    color: "rose",
    description:
      "Penyediaan makanan dan minuman sepanjang perjalanan oleh mitra katering yang menjamin kehalalan dan kebersihan pangan. Menu dirancang menghadirkan cita rasa Indonesia dan internasional sesuai kebutuhan jamaah, dengan umpan balik mutu yang terdokumentasi.",
  },
  {
    number: 11,
    name: "Oleh-oleh & Retail",
    cluster: "Nilai Tambah & Jaminan Mutu",
    scope: "Pusat oleh-oleh terpercaya dan produk halal berkualitas",
    standard: "Merchant terverifikasi; keterkaitan dengan UMKM Indonesia",
    icon: "shopping-bag",
    color: "amber",
    description:
      "Pusat oleh-oleh terpercaya dan produk halal berkualitas yang seluruh merchant-nya terverifikasi. Ekosistem retail juga membuka ruang keterkaitan dengan UMKM Indonesia, menjadikan perjalanan ibadah berdampak pada penguatan ekonomi umat.",
  },
  {
    number: 12,
    name: "Registrasi & Layanan Satu Pintu",
    cluster: "Nilai Tambah & Jaminan Mutu",
    scope: "Konsultasi, verifikasi legalitas, dan pembelian layanan",
    standard: "Kanal resmi; perlindungan dana jamaah",
    icon: "clipboard-list",
    color: "orange",
    description:
      "Kanal resmi untuk konsultasi, verifikasi legalitas penyelenggara, dan pembelian layanan ibadah dalam satu pintu. Dilengkapi perlindungan dana jamaah melalui skema escrow dan takaful, setiap transaksi terdokumentasi dalam kontrak elektronik yang mengikat.",
  },
  {
    number: 13,
    name: "Pengawalan & Pengawasan",
    cluster: "Nilai Tambah & Jaminan Mutu",
    scope: "Monitoring real time, keamanan, dan layanan 24/7",
    standard: "Command center; eskalasi insiden terstruktur",
    icon: "shield-check",
    color: "red",
    description:
      "Monitoring real time, keamanan, dan layanan darurat 24/7 oleh command center MUHDIN sepanjang masa perjalanan. Eskalasi insiden yang terstruktur memastikan setiap kendala — kesehatan, logistik, maupun jadwal — tertangani cepat oleh pihak yang tepat.",
  },
];

// ---------- 4. JOURNEY STEPS (13) ----------
const journeySteps = [
  {
    step: 1,
    title: "Registrasi & Konsultasi",
    activity: "Konsultasi paket, verifikasi legalitas, pendaftaran jamaah",
    actor: "MUHDIN, PPIU/PIHK",
    output: "Profil jamaah digital, kontrak elektronik",
    icon: "clipboard-list",
  },
  {
    step: 2,
    title: "Visa & Dokumen",
    activity: "Pengurusan visa dan kelengkapan dokumen",
    actor: "MUHDIN–Nusuk, mitra",
    output: "Status visa real time di aplikasi",
    icon: "passport",
  },
  {
    step: 3,
    title: "Handling di Indonesia",
    activity: "Check-in, imigrasi, lounge, keberangkatan",
    actor: "Mitra handling, tour leader",
    output: "Konfirmasi keberangkatan, manifest digital",
    icon: "plane-takeoff",
  },
  {
    step: 4,
    title: "Tour Leader",
    activity: "Pendampingan rombongan sejak titik kumpul",
    actor: "Tour leader bersertifikasi",
    output: "Log aktivitas rombongan",
    icon: "users",
  },
  {
    step: 5,
    title: "Handling di Saudi",
    activity: "Penerimaan, fast track, imigrasi, bagasi",
    actor: "Mitra handling Saudi",
    output: "Status kedatangan real time",
    icon: "plane-landing",
  },
  {
    step: 6,
    title: "Mutawif",
    activity: "Pembimbingan manasik dan ibadah",
    actor: "Mutawif bersertifikasi",
    output: "Jadwal ibadah, catatan pembinaan",
    icon: "book-open",
  },
  {
    step: 7,
    title: "Akomodasi Hotel",
    activity: "Check-in hotel dan pengelolaan kamar",
    actor: "Hotel mitra",
    output: "Voucher digital, penilaian mutu",
    icon: "building-2",
  },
  {
    step: 8,
    title: "Transportasi",
    activity: "Pergerakan antar kota dan dalam kota",
    actor: "Operator transportasi",
    output: "Rute dan jadwal real time",
    icon: "bus",
  },
  {
    step: 9,
    title: "Wisata Ziarah",
    activity: "Kunjungan ziarah terkurasi",
    actor: "Pemandu ziarah berlisensi",
    output: "Itinerary tercatat",
    icon: "map",
  },
  {
    step: 10,
    title: "Raudah",
    activity: "Penjadwalan dan akses resmi Raudah",
    actor: "MUHDIN, pengelola Masjid Nabawi",
    output: "Slot terdistribusi, konfirmasi kunjungan",
    icon: "landmark",
  },
  {
    step: 11,
    title: "Konsumsi & Restoran",
    activity: "Penyediaan makanan selama perjalanan",
    actor: "Mitra katering",
    output: "Menu terjadwal, umpan balik mutu",
    icon: "utensils",
  },
  {
    step: 12,
    title: "Oleh-oleh & Retail",
    activity: "Pembelian oleh-oleh dan produk halal",
    actor: "Merchant terverifikasi",
    output: "Transaksi digital, jaminan produk",
    icon: "shopping-bag",
  },
  {
    step: 13,
    title: "Pengawalan & Pengawasan",
    activity: "Monitoring, keamanan, layanan 24/7",
    actor: "Command center MUHDIN",
    output: "Dashboard insiden, laporan penutupan perjalanan",
    icon: "shield-check",
  },
];

// ---------- 5. ROADMAP (4) ----------
const roadmaps = [
  {
    phase: "Fase 1: Fondasi",
    period: "2026",
    focus: "Kelembagaan, legalitas, dan kesepakatan akses",
    deliverables:
      "Badan hukum asosiasi; struktur keanggotaan; MoU dengan Nusuk dan pemangku kepentingan; MVP aplikasi (registrasi dan visa); standar layanan dasar",
    order: 1,
  },
  {
    phase: "Fase 2: Integrasi",
    period: "2027",
    focus: "Integrasi penuh sistem dan sertifikasi SDM",
    deliverables:
      "Onboarding gelombang pertama mitra; integrasi API Nusuk; GPS tracking; command center 24/7; gelombang pertama sertifikasi tour leader dan mutawif",
    order: 2,
  },
  {
    phase: "Fase 3: Skala",
    period: "2028",
    focus: "Perluasan pasar dan kecerdasan data",
    deliverables:
      "Marketplace 13 ekosistem penuh; modul AI prediksi kuota dan harga; dashboard regulator; ekspansi kota keberangkatan",
    order: 3,
  },
  {
    phase: "Fase 4: Keunggulan",
    period: "2029-2030",
    focus: "Kelembagaan mutu dan skala penuh",
    deliverables:
      "Akreditasi mutu oleh lembaga eksternal; interoperabilitas penuh dengan standar Saudi; laporan mutu tahunan publik; target layanan lebih dari satu juta jamaah per tahun",
    order: 4,
  },
];

// ---------- 6. MEMBERS (12) ----------
const members = [
  {
    name: "PT Insan Barokah Wisata",
    type: "PPIU",
    city: "Jakarta",
    province: "DKI Jakarta",
    licenseNo: "PPIU-2026-0011",
    phone: "+6281130100111",
    email: "info@insanbarokah.co.id",
    website: "https://insanbarokah.co.id",
    description:
      "Penyelenggara umroh dan haji khusus dengan fokus layanan keluarga dan komunitas korporat, telah melayani lebih dari 5.000 jamaah.",
    rating: 4.9,
    status: "TERVERIFIKASI",
    memberSince: 2024,
  },
  {
    name: "PT Andalan Pelayanan Umrah",
    type: "PPIU",
    city: "Surabaya",
    province: "Jawa Timur",
    licenseNo: "PPIU-2025-0018",
    phone: "+6281130100112",
    email: "cs@andalanumrah.co.id",
    website: "https://andalanumrah.co.id",
    description:
      "Penyelenggara umroh reguler dan plus dengan jadwal keberangkatan mingguan dari Surabaya, didukung mutawif bersertifikasi.",
    rating: 4.8,
    status: "TERVERIFIKASI",
    memberSince: 2024,
  },
  {
    name: "Koperasi Jamaah Indonesia Sejahtera",
    type: "KBIHU",
    city: "Bandung",
    province: "Jawa Barat",
    licenseNo: "KBIHU-2025-0027",
    phone: "+6281130100113",
    email: "sekretariat@koperasijns.co.id",
    website: null,
    description:
      "Badan usaha koperasi yang melayani jamaah anggota koperasi di Jawa Barat dengan skema pembayaran cicilan syariah.",
    rating: 4.7,
    status: "TERVERIFIKASI",
    memberSince: 2025,
  },
  {
    name: "PT Safar Madinah Tour",
    type: "PIHK",
    city: "Medan",
    province: "Sumatera Utara",
    licenseNo: "PIHK-2026-0009",
    phone: "+6281130100114",
    email: "info@safarmadinah.co.id",
    website: "https://safarmadinah.co.id",
    description:
      "Penyelenggara haji khusus dengan paket haji reguler dan draft haji, berpengalaman menangani jamaah Sumatera Utara.",
    rating: 4.6,
    status: "TERVERIFIKASI",
    memberSince: 2025,
  },
  {
    name: "CV Rihlah Barokah Travel",
    type: "TRAVEL_WISATA",
    city: "Semarang",
    province: "Jawa Tengah",
    licenseNo: "TW-2026-0031",
    phone: "+6281130100115",
    email: "hello@rihlahbarokah.co.id",
    website: "https://rihlahbarokah.co.id",
    description:
      "Biro perjalanan wisata dan umroh yang menggabungkan paket ziarah dengan wisata edukatif untuk komunitas dan sekolah.",
    rating: 4.4,
    status: "TERVERIFIKASI",
    memberSince: 2025,
  },
  {
    name: "PT Hikmah Wisata Indonesia",
    type: "PPIU",
    city: "Makassar",
    province: "Sulawesi Selatan",
    licenseNo: "PPIU-2026-0042",
    phone: "+6281130100116",
    email: "info@hikmahwisata.co.id",
    website: "https://hikmahwisata.co.id",
    description:
      "Penyelenggara umroh timur Indonesia dengan kota keberangkatan Makassar, fokus pada layanan jamaah perantau dan pelajar.",
    rating: 4.5,
    status: "TERVERIFIKASI",
    memberSince: 2026,
  },
  {
    name: "PT Baitullah Prima Perjalanan",
    type: "IPHI",
    city: "Yogyakarta",
    province: "Daerah Istimewa Yogyakarta",
    licenseNo: "IPHI-2024-0056",
    phone: "+6281130100117",
    email: "admin@baitullahprima.co.id",
    website: "https://baitullahprima.co.id",
    description:
      "Anggota asosiasi IPHI dengan spesialisasi umroh senior dan layanan pendampingan medis lengkap selama perjalanan.",
    rating: 4.8,
    status: "TERVERIFIKASI",
    memberSince: 2024,
  },
  {
    name: "PT Mabrur Sejahtera Wisata",
    type: "PPIU",
    city: "Bekasi",
    province: "Jawa Barat",
    licenseNo: "PPIU-2024-0073",
    phone: "+6281130100118",
    email: "info@mabrursejahtera.co.id",
    website: "https://mabrursejahtera.co.id",
    description:
      "Penyelenggara umroh yang tumbuh pesat dari komunitas masjid, dengan rekam jejak tanpa keberangkatan gagal selama tiga tahun.",
    rating: 4.9,
    status: "TERVERIFIKASI",
    memberSince: 2024,
  },
  {
    name: "PT Zamzam Tour Indonesia",
    type: "PIHK",
    city: "Malang",
    province: "Jawa Timur",
    licenseNo: "PIHK-2025-0015",
    phone: "+6281130100119",
    email: "cs@zamzamtour.co.id",
    website: "https://zamzamtour.co.id",
    description:
      "Penyelenggara haji khusus dengan kuota terjadwal dan program pembinaan manasik pra-haji yang intensif.",
    rating: 4.6,
    status: "TERVERIFIKASI",
    memberSince: 2025,
  },
  {
    name: "CV Nur Hidayah Travel",
    type: "KBIHU",
    city: "Palembang",
    province: "Sumatera Selatan",
    licenseNo: "KBIHU-2026-0038",
    phone: "+6281130100120",
    email: "info@nurhidayahtravel.co.id",
    website: null,
    description:
      "Badan usaha haji dan umroh lokal Palembang yang tengah menyelesaikan proses verifikasi keanggotaan MUHDIN.",
    rating: 4.3,
    status: "PENDING",
    memberSince: 2026,
  },
  {
    name: "PT Thaha Trip Utama",
    type: "PPIU",
    city: "Jakarta",
    province: "DKI Jakarta",
    licenseNo: "PPIU-2025-0064",
    phone: "+6281130100121",
    email: "corporate@thahatrip.co.id",
    website: "https://thahatrip.co.id",
    description:
      "Penyelenggara umroh korporat dan eksklusif dengan akomodasi hotel berstandar Nusuk jarak dekat ke Masjidil Haram.",
    rating: 4.7,
    status: "TERVERIFIKASI",
    memberSince: 2025,
  },
  {
    name: "PT Andalusia Perdana Wisata",
    type: "TRAVEL_WISATA",
    city: "Bandung",
    province: "Jawa Barat",
    licenseNo: "TW-2024-0089",
    phone: "+6281130100122",
    email: "info@andalusiaperdana.co.id",
    website: "https://andalusiaperdana.co.id",
    description:
      "Biro perjalanan yang memadukan umroh dengan wisata Islami Turki dan Uni Emirat Arab untuk keluarga muda.",
    rating: 4.2,
    status: "TERVERIFIKASI",
    memberSince: 2024,
  },
];

// ---------- 7. TUTORIALS (10) ----------
const tutorials = [
  {
    title: "Panduan Memulai: Mengenal Portal MUHDIN",
    category: "Umum",
    level: "Pemula",
    duration: 10,
    order: 1,
    published: true,
    views: 1520,
    summary:
      "Tur singkat seluruh fitur portal MUHDIN: beranda, menu navigasi, direktori anggota, hingga cara memeriksa status verifikasi penyelenggara.",
    content: [
      "Portal MUHDIN adalah rumah digital Masyarakat Umroh Haji Digital Indonesia — asosiasi payung penyelenggara ibadah Indonesia yang diposisikan sebagai titik koordinasi tunggal akses platform Nusuk. Tutorial ini memandu Anda mengenal seluruh fitur utama portal dalam waktu kurang dari sepuluh menit.",
      "## Halaman Utama (Beranda)",
      "Saat membuka muhdin.web.id, Anda akan disambut tagline **Bersama Melayani Tamu Allah** beserta visi Transformasi Digitalisasi Umroh dan Haji Indonesia 2030. Dari beranda Anda dapat langsung:",
      "1. Mengakses **Direktori Anggota** untuk melihat seluruh penyelenggara yang telah bergabung.",
      "2. Membuka **13 Ekosistem** — peta lengkap layanan jamaah dari visa hingga oleh-oleh.",
      "3. Menelusuri **Alur Perjalanan** 13 tahap yang dijalani setiap jamaah.",
      "4. Membaca **Berita dan Artikel** terbaru seputar industri ibadah.",
      "## Navigasi Menu Utama",
      "Menu portal tersusun logis mengikuti kebutuhan pengunjung:",
      "- **Beranda**: ringkasan profil, statistik, dan sorotan konten.",
      "- **Tentang**: visi, misi, struktur pengurus, dan peta jalan 2026-2030.",
      "- **Ekosistem**: 13 layanan dalam tiga kelompok besar — Akses dan Mobilitas, Pengalaman Ibadah, serta Nilai Tambah dan Jaminan Mutu.",
      "- **Anggota**: direktori PPIU, PIHK, KBIHU, dan mitra lain lengkap dengan rating dan status verifikasi.",
      "- **Tutorial**: panduan penggunaan portal dan CMS bagi jamaah maupun mitra.",
      "- **Kontak**: formulir pesan resmi yang langsung masuk ke inbox admin.",
      "## Memeriksa Status Verifikasi Anggota",
      "Fitur terpenting bagi jamaah adalah memastikan penyelenggara yang dipilih tergabung resmi di MUHDIN. Caranya:",
      "1. Buka menu **Anggota** atau halaman **Verifikasi**.",
      "2. Ketik nama penyelenggara pada kolom pencarian.",
      "3. Periksa lencana status: **TERVERIFIKASI** berarti legalitas dan standar layanan telah diperiksa tim MUHDIN; **PENDING** berarti proses verifikasi masih berjalan; **SUSPENDED** berarti keanggotaan dihentikan sementara.",
      "4. Catat nomor izin (license number) dan cocokkan dengan dokumen yang diberikan penyelenggara.",
      "## Mencari Informasi Lebih Lanjut",
      "Setiap halaman dilengkapi bagian FAQ yang menjawab pertanyaan paling umum, mulai dari keanggotaan hingga perlindungan dana jamaah. Jika jawaban tidak ditemukan, gunakan formulir kontak; tim sekretariat menjawab pada jam kerja (09.00-17.00 WIB).",
      "## Ringkasan",
      "Portal MUHDIN dirancang sebagai satu pintu informasi industri jasa ibadah: transparan, terstandar, dan mudah dinavigasi. Kenali menu utama, biasakan memeriksa status verifikasi sebelum bertransaksi, dan manfaatkan tutorial lain di kategori yang sama untuk memperdalam pemahaman Anda. Selamat datang di ekosistem digital pelayanan Tamu Allah.",
    ].join("\n\n"),
  },
  {
    title: "Cara Cek Legalitas & Verifikasi Penyelenggara Umroh",
    category: "Jamaah",
    level: "Pemula",
    duration: 7,
    order: 2,
    published: true,
    views: 2430,
    summary:
      "Langkah demi langkah menggunakan halaman Verifikasi MUHDIN, memahami arti setiap status keanggotaan, dan mengenali ciri penyelenggara ilegal.",
    content: [
      "Memilih penyelenggara umroh yang legal adalah langkah pertama perlindungan diri Anda sebagai jamaah. Tutorial ini menjelaskan cara menggunakan halaman Verifikasi MUHDIN, membaca arti setiap status, dan mengenali ciri-ciri penyelenggara ilegal.",
      "## Langkah-Langkah Memeriksa Legalitas",
      "1. Buka halaman **Verifikasi** di muhdin.web.id.",
      "2. Masukkan nama penyelenggara atau nomor izin (contoh: PPIU-2026-0011) pada kolom pencarian.",
      "3. Baca kartu hasil pencarian: nama resmi, jenis badan usaha, kota, provinsi, rating jamaah, tahun bergabung, dan status keanggotaan.",
      "4. Klik kartu untuk melihat deskripsi lengkap, kontak resmi, dan rekam jejak mutu layanan.",
      "5. Cocokkan nomor izin pada kartu dengan yang tertera pada brosur, kontrak, atau kuitansi yang diberikan petugas.",
      "## Arti Setiap Status",
      "- **TERVERIFIKASI**: legalitas izin telah dicek silang dengan Kemenag, reputasi layanan baik, dan penyelenggara tunduk pada standar MUHDIN serta mekanisme perlindungan dana jamaah.",
      "- **PENDING**: pendaftaran diterima namun proses pemeriksaan dokumen dan kunjungan lapangan masih berjalan. Gunakan kehati-hatian ekstra hingga status berubah.",
      "- **SUSPENDED**: keanggotaan dihentikan sementara karena ditemukan pelanggaran standar atau keluhan jamaah yang belum selesai. Jangan bertransaksi hingga status pulih.",
      "## Ciri Penyelenggara yang Perlu Diwaspadai",
      "1. Harga jauh di bawah rata-rata pasar tanpa rincian akomodasi yang jelas.",
      "2. Menolak memberikan nomor izin PPIU/PIHK yang dapat diverifikasi.",
      "3. Transaksi diminta ke rekening pribadi, bukan rekening perusahaan atau escrow.",
      "4. Mengklaim kerja sama langsung tanpa bukti tertulis dan tanpa tercatat di asosiasi mana pun.",
      "5. Memasarkan paket intensif lewat grup pesan singkat tanpa identitas legal yang jelas.",
      "## Jika Menemukan Penyelenggara Mencurigakan",
      "Laporkan melalui formulir kontak MUHDIN dengan melampirkan bukti — tangkapan layar, kuitansi, atau nomor rekening. Tim pengawasan akan menindaklanjuti dan mengedukasi publik. Anda juga dapat mengadu ke Kemenag apabila terdapat indikasi pelanggaran izin, atau ke aparat penegak hukum bila melibatkan indikasi penggelapan dana.",
      "## Ringkasan",
      "Dua menit memeriksa status verifikasi dapat menyelamatkan puluhan juta rupiah tabungan ibadah Anda. Jadikan halaman Verifikasi MUHDIN kebiasaan pertama sebelum memilih paket umroh, dan sebarkan kebiasaan baik ini kepada keluarga serta komunitas Anda.",
    ].join("\n\n"),
  },
  {
    title: "Panduan Pendaftaran Anggota MUHDIN untuk PPIU/PIHK",
    category: "Mitra",
    level: "Pemula",
    duration: 15,
    order: 3,
    published: true,
    views: 860,
    summary:
      "Panduan lengkap bagi PPIU, PIHK, dan KBIHU: menyiapkan dokumen izin, mengisi formulir pendaftaran, hingga memahami alur verifikasi dan persetujuan.",
    content: [
      "Bergabung sebagai anggota MUHDIN membuka akses ke 13 ekosistem layanan, integrasi Nusuk, program sertifikasi SDM, dan visibilitas di direktori publik. Tutorial ini memandu PPIU, PIHK, KBIHU, serta penyelenggara travel menyelesaikan pendaftaran dari awal hingga disetujui.",
      "## Persyaratan Dokumen",
      "Siapkan dokumen berikut sebelum memulai:",
      "1. Nomor izin PPIU/PIHK yang masih berlaku dari Kemenag.",
      "2. Akta pendirian dan NPWP badan usaha.",
      "3. KTP dan kontak penanggung jawab (direktur atau pemilik).",
      "4. Profil perusahaan: pengalaman menyelenggarakan ibadah, kapasitas jamaah per tahun, dan rekening escrow/perusahaan.",
      "5. Foto kantor atau keterangan alamat operasional yang dapat dikunjungi petugas.",
      "## Mengisi Formulir Pendaftaran",
      "1. Buka menu **Keanggotaan** lalu pilih **Daftar Anggota**.",
      "2. Isi **Nama Organisasi** sesuai akta, bukan singkatan tidak resmi.",
      "3. Pilih **Tipe** yang sesuai: PPIU, PIHK, KBIHU, IPHI, atau Travel Wisata.",
      "4. Masukkan nama, email, dan telepon penanggung jawab yang aktif — seluruh notifikasi verifikasi dikirim ke kanal ini.",
      "5. Tulis nomor izin dengan format standar, contoh: PPIU-2026-0011.",
      "6. Gunakan kolom pesan untuk menonjolkan keunggulan layanan, misalnya program takaful, mutawif bersertifikasi, atau rekam jejak tanpa keberangkatan gagal.",
      "7. Klik **Kirim Pendaftaran**. Sistem menyimpan data Anda dengan status **PENDING**.",
      "## Alur Verifikasi dan Persetujuan",
      "1. Tim sekretariat memeriksa kelengkapan dokumen paling lambat 7 hari kerja.",
      "2. Verifikasi silang nomor izin dilakukan ke basis data Kemenag.",
      "3. Petugas dapat menghubungi Anda untuk klarifikasi atau kunjungan lapangan.",
      "4. Setelah lulus, status berubah menjadi **TERVERIFIKASI** dan profil perusahaan tampil di Direktori Anggota publik.",
      "5. Anda menerima email resmi berisi panduan onboarding, termasuk akses ke program sertifikasi tour leader dan mutawif.",
      "Bila pendaftaran ditolak, alasan akan dikirimkan dan Anda dapat memperbaiki dokumen lalu mendaftar ulang tanpa biaya.",
      "## Setelah Disetujui",
      "Anggota baru wajib mengikuti orientasi standar layanan MUHDIN, menandatangani pakta integritas, dan mengaktifkan perlindungan dana jamaah melalui skema escrow serta takaful. Mulailah mencantumkan lencana keanggotaan MUHDIN pada materi pemasaran resmi perusahaan Anda.",
      "## Ringkasan",
      "Pendaftaran anggota dirancang cepat namun tetap ketat demi menjaga kepercayaan publik. Siapkan dokumen lengkap, isi formulir dengan data yang valid, dan manfaatkan kolom pesan untuk menampilkan keunggulan Anda. Selamat bergabung dalam payung besar **Bersama Melayani Tamu Allah**.",
    ].join("\n\n"),
  },
  {
    title: "Menggunakan CMS: Manajemen Berita & Artikel",
    category: "CMS",
    level: "Pemula",
    duration: 12,
    order: 4,
    published: true,
    views: 640,
    summary:
      "Panduan admin membuat dan menerbitkan berita: login CMS, mengisi artikel dengan Markdown, mengatur kategori, status, dan sorotan beranda.",
    content: [
      "CMS MUHDIN memungkinkan admin mengelola seluruh berita, pengumuman, dan artikel tanpa menyentuh kode. Tutorial ini membahas login, membuat artikel baru, mengatur kategori dan status, hingga menampilkan artikel di beranda.",
      "## Masuk ke CMS",
      "1. Buka halaman login admin portal MUHDIN.",
      "2. Masukkan email administrator, contohnya admin@muhdin.web.id, dan kata sandi Anda.",
      "3. Setelah berhasil, Anda diarahkan ke dashboard dengan ringkasan statistik konten.",
      "## Membuat Artikel Baru",
      "1. Buka menu **Artikel** lalu klik **Tambah Artikel**.",
      "2. Isi **Judul** dengan jelas, misalnya Gelombang Kedua Sertifikasi Mutawif Dibuka untuk Lima Kota.",
      "3. **Slug** terisi otomatis dari judul (huruf kecil, spasi menjadi tanda hubung). Anda bisa menyuntingnya agar lebih ringkas.",
      "4. Tulis **Excerpt** 1-2 kalimat — teks ini tampil pada daftar artikel dan hasil pencarian.",
      "5. Susun isi di kolom **Content** dengan format Markdown: awali judul bagian dengan tanda pagar ganda (##), gunakan tanda bintang ganda untuk menegaskan istilah penting, dan daftar bernomor untuk langkah-langkah.",
      "6. Pilih **Kategori**: Berita, Pengumuman, Artikel, atau Press Release.",
      "7. Isi **Cover** dengan path gambar, contoh: /images/hero-kaaba.jpg.",
      "8. Aktifkan **Featured** bila artikel layak tampil di sorotan beranda — idealnya maksimal 2-3 artikel sekaligus.",
      "9. Klik **Simpan**.",
      "## Mengelola Artikel yang Ada",
      "- **Draft vs Publish**: gunakan status PUBLISHED hanya bila konten final; artikel dengan status lain tidak tampil di publik.",
      "- **Sunting**: klik ikon pensil untuk memperbaiki salah ketik, memperbarui isi, atau mengganti cover.",
      "- **Hapus**: gunakan hanya untuk konten duplikat; pertimbangkan pengarsipan bila artikel masih relevan secara historis.",
      "- **Views**: jumlah pembacaan terekam otomatis; gunakan untuk menilai topik yang diminati jamaah.",
      "## Praktik Terbaik",
      "1. Satu artikel satu ide besar — pecah topik kompleks menjadi seri.",
      "2. Cantumkan angka konkret: jumlah peserta, tanggal, dan nama kota.",
      "3. Tutup dengan ajakan tindakan, misalnya menghubungi sekretariat atau membaca tutorial terkait.",
      "4. Periksa kembali penulisan nama institusi: Masyarakat Umroh Haji Digital Indonesia (MUHDIN), Nusuk, dan Kemenag.",
      "## Ringkasan",
      "Dengan alur sederhana ini, tim konten dapat menerbitkan berita resmi dalam hitungan menit. Kuncinya: judul yang jelas, excerpt menarik, Markdown yang rapi, dan kategori yang tepat agar portal selalu segar dan tepercaya.",
    ].join("\n\n"),
  },
  {
    title: "Menggunakan CMS: Kelola 13 Ekosistem & Alur Perjalanan",
    category: "CMS",
    level: "Menengah",
    duration: 15,
    order: 5,
    published: true,
    views: 420,
    summary:
      "Cara menyunting data 13 ekosistem layanan (scope, standar, ikon, klaster) dan menjaga konsistensi 13 tahap alur perjalanan jamaah.",
    content: [
      "Data 13 Ekosistem dan 13 tahap alur perjalanan adalah jantung narasi MUHDIN. Tutorial ini menjelaskan cara menjaga kedua data tersebut tetap akurat melalui CMS.",
      "## Memahami Struktur Data",
      "**Ekosistem** terdiri atas 13 layanan dalam 3 klaster: Akses dan Mobilitas (nomor 1-5), Pengalaman Ibadah (6-10), serta Nilai Tambah dan Jaminan Mutu (11-13). **Journey Step** berisi 13 tahapan pengalaman jamaah, dari registrasi hingga pengawalan, lengkap dengan aktor dan keluaran tiap tahap.",
      "## Mengedit Data Ekosistem",
      "1. Buka menu **Ekosistem** di CMS.",
      "2. Pilih kartu layanan, misalnya **Visa Umroh dan Haji**, lalu klik **Edit**.",
      "3. Perbarui **Scope** (cakupan layanan) dan **Standard** (standar mutu yang dijanjikan) bila ada kebijakan baru.",
      "4. Untuk **Icon**, gunakan nama ikon konsisten yang dipakai portal, contohnya: passport, plane-takeoff, users, plane-landing, book-open, building-2, bus, map, landmark, utensils, shopping-bag, clipboard-list, shield-check.",
      "5. Sesuaikan **Cluster** bila layanan dipindahkan antar kelompok — pastikan nomor urut tetap logis.",
      "6. Perbaiki **Description** agar tetap profesional, minimal dua kalimat, tanpa promosi merek tertentu.",
      "7. Simpan dan periksa tampilan publik di halaman Ekosistem.",
      "## Menjaga Konsistensi Ikon dan Klaster",
      "Kesalahan umum: nama ikon ditulis salah kapital atau tidak sesuai daftar. Selalu salin nama ikon dari data yang sudah benar. Klaster tidak boleh kosong; bila ragu, tempatkan layanan pada klaster Nilai Tambah dan Jaminan Mutu.",
      "## Mengelola 13 Tahap Journey",
      "1. Buka menu **Journey** atau **Alur Perjalanan**.",
      "2. Setiap tahap memiliki: **Step** (urutan 1-13), **Title**, **Activity**, **Actor**, **Output**, dan **Icon**.",
      "3. Pastikan **Actor** menuliskan pihak yang benar — misalnya MUHDIN-Nusuk untuk visa, mitra handling Saudi untuk penerimaan, dan command center untuk tahap 13.",
      "4. **Output** harus konkret: manifest digital, status visa real time, voucher, dashboard insiden.",
      "5. Jangan mengubah nomor urut kecuali ada keputusan resmi; urutan ini dipakai di banyak halaman dan materi promosi.",
      "## Uji Setelah Menyimpan",
      "Setelah perubahan, buka halaman publik terkait: pastikan teks tidak terpotong, ikon tampil dengan benar, dan urutan tidak melompat. Melaporkan anomali data segera ke tim teknis mencegah inkonsistensi konten berlarut.",
      "## Ringkasan",
      "Kelola ekosistem dan journey seperti mengelola dokumen resmi: akurat, konsisten, dan terukur. Data yang rapi menjaga kredibilitas MUHDIN sebagai titik koordinasi akses Nusuk di mata jamaah, mitra, dan regulator.",
    ].join("\n\n"),
  },
  {
    title: "Menggunakan CMS: Direktori Anggota & Verifikasi",
    category: "CMS",
    level: "Menengah",
    duration: 12,
    order: 6,
    published: true,
    views: 380,
    summary:
      "Panduan admin menambah anggota, mengubah status verifikasi (TERVERIFIKASI/PENDING/SUSPENDED), dan memproses pendaftaran masuk dari menu Pendaftaran.",
    content: [
      "Direktori Anggota adalah etalase kepercayaan MUHDIN. Tutorial ini memandu admin menambah anggota baru, memperbarui status verifikasi, serta memproses pendaftaran yang masuk melalui menu Pendaftaran.",
      "## Menambah Anggota Baru",
      "1. Buka menu **Anggota** di CMS, klik **Tambah Anggota**.",
      "2. Isi **Nama** sesuai dokumen legal (contoh: PT Insan Barokah Wisata).",
      "3. Pilih **Tipe**: PPIU, PIHK, KBIHU, IPHI, atau Travel Wisata.",
      "4. Lengkapi **Kota** dan **Provinsi** — dua kolom ini wajib karena dipakai filter publik.",
      "5. Tulis **License No** dengan format konsisten, misalnya PPIU-2026-0011; nomor ini adalah kunci pencarian di halaman Verifikasi.",
      "6. Isi kontak, website, rating (1.0-5.0), tahun bergabung, dan deskripsi singkat yang netral serta informatif.",
      "7. Simpan, lalu cek tampilan kartu anggota di direktori publik.",
      "## Mengubah Status Anggota",
      "Status yang tersedia: TERVERIFIKASI, PENDING, SUSPENDED.",
      "- **TERVERIFIKASI** hanya diberikan setelah verifikasi dokumen dan pengecekan silang izin selesai.",
      "- **PENDING** dipakai saat pemeriksaan berjalan; anggota belum boleh memasang lencana keanggotaan.",
      "- **SUSPENDED** diberlakukan bila ada pelanggaran standar atau keluhan jamaah berat. Catat alasannya pada berita acara internal atau pengumuman resmi.",
      "Untuk mengubah: buka detail anggota, pilih status baru, simpan. Seluruh perubahan langsung tercermin di halaman publik — pastikan keputusan sudah final sebelum menyimpan.",
      "## Memproses Pendaftaran Masuk",
      "1. Buka menu **Pendaftaran**; seluruh pendaftaran publik tampil dengan status PENDING.",
      "2. Periksa data organisasi: nama, tipe, kontak, nomor izin, dan pesan.",
      "3. Lakukan verifikasi silang nomor izin ke Kemenag dan riset reputasi layanan.",
      "4. Bila lolos, buat anggota baru pada menu Anggota dengan data dari pendaftaran, lalu tandai pendaftaran **APPROVED**.",
      "5. Bila tidak lolos, tandai **REJECTED** dan tambahkan catatan penolakan agar tim dapat menghubungi pelamar.",
      "## Pemeliharaan Rutin",
      "Lakukan audit kuartalan: perbarui kontak, periksa nomor izin yang kedaluwarsa, dan evaluasi rating berdasarkan keluhan jamaah. Anggota dengan performa buruk diberi teguran tertulis sebelum suspensi diberlakukan.",
      "## Ringkasan",
      "Akurasi data anggota adalah fondasi kepercayaan jamaah. Disiplinkan alurnya: verifikasi sebelum publikasi, perubahan status dengan alasan yang jelas, dan audit berkala — itulah yang membedakan asosiasi tepercaya dari sekadar daftar perusahaan.",
    ].join("\n\n"),
  },
  {
    title: "Menggunakan CMS: Pusat Tutorial, FAQ & Testimoni",
    category: "CMS",
    level: "Menengah",
    duration: 14,
    order: 7,
    published: true,
    views: 350,
    summary:
      "Mengelola konten edukasi: menulis tutorial dengan Markdown dan level, menyusun FAQ per kategori, dan memoderasi testimoni jamaah.",
    content: [
      "Tiga modul konten edukasi — Tutorial, FAQ, dan Testimoni — bekerja bersama membangun literasi dan kepercayaan jamaah. Tutorial ini membahas pengelolaan ketiganya melalui CMS.",
      "## Mengelola Tutorial",
      "1. Buka menu **Tutorial**, klik **Tambah Tutorial**.",
      "2. Tentukan **Kategori**: CMS (untuk admin), Jamaah, Mitra, atau Umum.",
      "3. Pilih **Level**: Pemula, Menengah, atau Mahir agar pembaca menemukan materi sesuai kemampuan.",
      "4. Isi **Duration** dalam menit (5-20) dan **Summary** 1-2 kalimat.",
      "5. Susun **Content** dengan Markdown: judul bagian memakai tanda pagar ganda, langkah bernomor, dan istilah penting ditebalkan.",
      "6. Atur **Order** agar tutorial berurutan logis di halaman publik; nomor 1 biasanya panduan memulai.",
      "7. Gunakan opsi **Published** untuk menyembunyikan draf dari publik tanpa menghapusnya.",
      "Tips penulisan: satu tutorial menyelesaikan satu masalah; buka dengan konteks, lanjutkan langkah bernomor, tutup dengan ringkasan.",
      "## Mengelola FAQ",
      "1. Buka menu **FAQ**; susun pertanyaan berdasarkan **Order** dari yang paling sering ditanyakan.",
      "2. Kategori yang tersedia: Umum, Keanggotaan, Jamaah, dan Teknologi.",
      "3. Jawab dengan gaya profesional namun hangat — hindari jargon teknis pada FAQ kategori Jamaah.",
      "4. Panjang ideal 2-4 kalimat; bila butuh penjelasan panjang, tulis jawaban singkat lalu tautkan ke tutorial terkait.",
      "## Memoderasi Testimoni",
      "1. Buka menu **Testimoni**; seluruh masukan tampil dengan nama, peran, rating, dan isi.",
      "2. Opsi **Published** mengendalikan tampilan publik — tampilkan hanya testimoni asli dan relevan.",
      "3. Rating tampil sebagai bintang 1-5; testimoni negatif jangan dihapus semata, gunakan sebagai bahan perbaikan layanan.",
      "4. Jaga keseimbangan profil: jamaah, tour leader, mutawif, pemilik PPIU, dan mitra UMKM agar narasi ekosistem utuh.",
      "Perhatikan privasi: bila jamaah tidak nyaman nama lengkapnya dipublikasikan, gunakan nama dan kota saja, misalnya Hj. Ratna D., Jakarta.",
      "## Ringkasan",
      "Konten edukasi yang terorganisir membuat portal MUHDIN hidup dan bermanfaat setiap hari. Disiplinkan kategori, level, dan urutan; moderasi testimoni dengan integritas — maka kepercayaan publik akan tumbuh bersama konten Anda.",
    ].join("\n\n"),
  },
  {
    title: "Menggunakan CMS: Dashboard, Pesan & Pengaturan Situs",
    category: "CMS",
    level: "Mahir",
    duration: 18,
    order: 8,
    published: true,
    views: 290,
    summary:
      "Modul admin tingkat lanjut: membaca statistik dashboard, menindaklanjuti inbox pesan, dan mengubah pengaturan situs (hero, kontak, sosial media).",
    content: [
      "Modul tingkat lanjut — Dashboard, Pesan, dan Pengaturan Situs — adalah kokpit admin MUHDIN. Tutorial ini untuk admin yang telah menguasai modul konten dasar.",
      "## Membaca Dashboard",
      "Dashboard merangkum kesehatan portal:",
      "1. **Statistik konten**: jumlah artikel, tutorial, anggota, dan testimoni — gunakan untuk mengejar target publikasi bulanan.",
      "2. **Pesan belum dibaca**: indikator kecepatan layanan; target MUHDIN adalah merespons dalam 1x24 jam kerja.",
      "3. **Pendaftaran menunggu**: pengingat antrean verifikasi anggota; jangan biarkan menumpuk lebih dari tujuh hari.",
      "## Mengelola Inbox Pesan",
      "1. Buka menu **Pesan**; seluruh kiriman formulir kontak publik tampil dengan status UNREAD atau READ.",
      "2. Prioritaskan pesan keluhan jamaah dan potensi kemitraan strategis.",
      "3. Tandai READ setelah ditindaklanjuti agar kolaborasi tim tidak tumpang tindih.",
      "4. Untuk keluhan serius (indikasi penyelenggara bermasalah), eskalasikan ke komite pengawasan dan catat pada laporan insiden.",
      "Hindari membalas dari alamat pribadi; gunakan email resmi info@muhdin.web.id agar jejak komunikasi terpusat.",
      "## Mengubah Pengaturan Situs",
      "Menu **Pengaturan** memetakan SiteSetting berpasangan kunci-nilai:",
      "- **siteName** dan **tagline**: identitas utama, misalnya MUHDIN dan Masyarakat Umroh Haji Digital Indonesia.",
      "- **heroTitle** dan **heroSubtitle**: teks besar beranda; perubahan kecil di sini mengubah kesan seluruh portal — tulis dengan cermat.",
      "- **vision** dan **mission**: visi misi resmi; hanya diubah melalui keputusan pengurus.",
      "- **email, phone, address, website**: kontak resmi; pastikan selalu aktif.",
      "- **instagram, youtube, facebook, twitter, whatsapp**: tautan sosial media resmi — hanya akun terverifikasi, tulis alamat lengkap dengan benar.",
      "Karena perubahan langsung tampil di publik, uji tampilan di layar kecil dan desktop setelah menyimpan. Salah ketik pada heroSubtitle akan terlihat oleh ribuan pengunjung.",
      "## Tata Kelola Akses",
      "Bagikan kredensial admin melalui kanal yang aman, ganti sandi secara berkala, dan catat setiap perubahan pengaturan strategis (visi, misi, kontak) pada berita acara internal.",
      "## Ringkasan",
      "Dashboard menjaga Anda proaktif, inbox menjaga respons tetap cepat, dan pengaturan situs menjaga identitas tetap konsisten. Kuasai ketiganya, maka CMS MUHDIN menjadi mesin tata kelola digital yang benar-benar melayani Tamu Allah.",
    ].join("\n\n"),
  },
  {
    title: "Persiapan Keberangkatan Jamaah: Checklist Lengkap",
    category: "Jamaah",
    level: "Pemula",
    duration: 8,
    order: 9,
    published: true,
    views: 1890,
    summary:
      "Checklist praktis sebelum berangkat: dokumen perjalanan, kesiapan manasik, kesehatan, pengaturan bagasi, dan persiapan sehari sebelum keberangkatan.",
    content: [
      "Keberangkatan yang tenang dimulai dari persiapan yang tertata. Checklist ini merangkum dokumen, manasik, kesehatan, dan bagasi yang perlu Anda siapkan sebelum berangkat ke Tanah Suci.",
      "## Dokumen Perjalanan",
      "1. Paspor dengan masa berlaku minimal enam bulan dari tanggal keberangkatan.",
      "2. Visa umroh atau haji yang diterbitkan melalui proses resmi — pastikan penyelenggara Anda tergabung di MUHDIN sehingga status visa dapat dipantau real time.",
      "3. Tiket dan itinerary resmi dari penyelenggara; simpan salinan digital dan cetak.",
      "4. Identitas dan kontak tour leader serta nomor darurat command center MUHDIN.",
      "5. Bukti pembayaran dan kontrak elektronik yang mencantumkan perlindungan dana (escrow/takaful).",
      "## Manasik dan Bacaan Ibadah",
      "- Ikuti manasik hingga tuntas; bila tertinggal, manfaatkan rekaman bimbingan dari mutawif.",
      "- Hafalkan niat ihram, talbiyah, dan doa sa'i minimal; bawa buku panduan kecil.",
      "- Tanyakan pada mutawif tentang tata cara kunjungan Raudah — akses dijadwalkan dan didistribusikan secara adil antar rombongan.",
      "## Kesehatan",
      "1. Periksa kesehatan 2-4 minggu sebelum berangkat; bawa obat pribadi dalam kemasan asli beserta resepnya.",
      "2. Lengkapi vaksin meningitis sesuai ketentuan.",
      "3. Siapkan cairan elektrolit, masker, dan power bank kecil.",
      "4. Bagi jamaah lanjut usia, koordinasikan kebutuhan kursi roda dengan petugas handling bandara dan hotel.",
      "## Bagasi",
      "1. Tas kabin: dokumen, obat, perlengkapan shalat, mukena, dan bekal ringan.",
      "2. Tas utama: pakaian secukupnya (warna terang memudahkan identifikasi rombongan), sandal, alat mandi, dan adaptor.",
      "3. Tempelkan label nama dan tanda pengenal rombongan pada kedua tas.",
      "4. Simpan uang pada dua tempat berbeda; hindari memakai perhiasan berlebihan.",
      "## Sehari Sebelum Berangkat",
      "- Konfirmasi jam kumpul dan titik temu dengan tour leader.",
      "- Berangkat lebih awal ke bandara; layanan handling MUHDIN memandu check-in, imigrasi, dan lounge agar proses cepat.",
      "- Sempurnakan persiapan hati: niat ibadah, saling memaafkan bersama keluarga, dan doa perjalanan.",
      "## Ringkasan",
      "Checklist ini melengkapi layanan ekosistem MUHDIN — dari visa hingga mutawif — namun kesiapan pribadi tetap tidak tergantikan. Rapikan dokumen, rawat tubuh, dan sempurnakan niat; semoga perjalanan Anda mabrur dan penuh keberkahan.",
    ].join("\n\n"),
  },
  {
    title: "Memahami Alur 13 Tahap Perjalanan Jamaah",
    category: "Umum",
    level: "Menengah",
    duration: 10,
    order: 10,
    published: true,
    views: 1240,
    summary:
      "Penjelasan end-to-end 13 tahap perjalanan jamaah MUHDIN dan prinsip zero-gap handover yang menjamin tidak ada jamaah tertinggal tanpa penjaga.",
    content: [
      "Alur 13 tahap adalah peta pengalaman jamaah MUHDIN dari rumah hingga kembali membawa keberkahan. Memahaminya membantu jamaah mengetahui siapa yang melayani, kapan, dan hasil apa yang bisa diharapkan pada setiap titik.",
      "## Tiga Kelompok Besar",
      "**Tahap 1-2: Persiapan.** Registrasi dan konsultasi menghasilkan profil jamaah digital serta kontrak elektronik; lalu visa dan dokumen diselesaikan lewat integrasi Nusuk dengan status real time di aplikasi.",
      "**Tahap 3-10: Pelaksanaan.** Handling di Indonesia, tour leader, handling di Saudi, mutawif, hotel, transportasi, ziarah, dan Raudah — delapan tahap di mana jamaah bergerak dan beribadah, masing-masing dengan aktor dan keluaran yang jelas.",
      "**Tahap 11-13: Nilai tambah dan pengawalan.** Konsumsi, oleh-oleh, dan pengawalan-pengawasan 24/7 oleh command center yang menutup perjalanan dengan laporan.",
      "## Prinsip Zero-Gap Handover",
      "Inti kualitas MUHDIN adalah serah terima tanpa celah antar penanggung jawab:",
      "1. Setiap tahap memiliki **aktor tunggal yang bertanggung jawab** — tidak ada jamaah menggantung tanpa penjaga.",
      "2. Setiap serah terima menghasilkan **keluaran digital** yang dapat diperiksa: manifest keberangkatan, status kedatangan, log aktivitas rombongan, dan voucher hotel.",
      "3. Command center memantau seluruh transisi; insiden sekecil apa pun dieskalasi melalui alur yang terstruktur.",
      "Sebagai contoh: saat rombongan tiba di Jeddah, mitra handling Saudi mengonfirmasi kedatangan secara real time sebelum bagasi selesai diurut — tour leader dan bus sudah menunggu di posisi.",
      "## Peran Jamaah dalam Alur",
      "- Perbarui data pada profil digital bila ada perubahan (kontak darurat, kondisi kesehatan).",
      "- Ikuti instruksi tour leader dan mutawif; jadwal ibadah disusun agar tenang, bukan terburu-buru.",
      "- Berikan penilaian mutu setelah tiap layanan utama (hotel, konsumsi) — data ini menentukan peringkat mitra.",
      "## Mengapa Ini Penting",
      "Alur terstandar mengubah pengalaman ibadah dari bergantung pada keberuntungan menjadi dijamin sistem. Bagi penyelenggara, alur yang sama menjadi checklist mutu; bagi regulator, dashboard transparansi.",
      "## Ringkasan",
      "Tiga belas tahap, tiga belas aktor, satu tujuan: jamaah beribadah dengan tenang. Pelajari alur ini sebelum berangkat, dan gunakan aplikasi MUHDIN untuk memantau setiap tahap secara real time — Bersama Melayani Tamu Allah.",
    ].join("\n\n"),
  },
];

// ---------- 8. ARTICLES (6) ----------
const articles = [
  {
    title: "MUHDIN Diposisikan sebagai Titik Koordinasi Akses Nusuk bagi Industri Ibadah",
    category: "Press Release",
    featured: true,
    cover: "/images/hero-kaaba.jpg",
    views: 1840,
    excerpt:
      "Whitepaper MUHDIN Edisi 1.0 (September 2026) menegaskan posisi MUHDIN sebagai titik koordinasi tunggal akses platform Nusuk bagi industri penyelenggara ibadah Indonesia — mengubah kompetisi kacau menjadi kompetisi mutu.",
    content: [
      "Jakarta — Masyarakat Umroh Haji Digital Indonesia (MUHDIN) menegaskan posisi strategisnya sebagai titik koordinasi tunggal akses platform Nusuk bagi industri penyelenggara ibadah Indonesia. Penegasan ini tertuang dalam Whitepaper MUHDIN Edisi 1.0 — September 2026, kertas kerja strategis yang disusun sebagai dasar konsultasi pemangku kepentingan.",
      "## Posisi: Asosiasi di Atas Asosiasi",
      "MUHDIN didesain bukan sebagai pesaing pelaku industri, melainkan lapisan federasi yang menaungi PPIU, PIHK, KBIHU, IPHI, dan penyelenggara travel wisata halal-ziarah. Sebagaimana IATA bagi industri penerbangan, MUHDIN menyediakan infrastruktur bersama, standar interoperabilitas, dan penjaminan mutu — sementara setiap anggota tetap menjalankan bisnisnya masing-masing dengan identitasnya sendiri.",
      "Ketua Ummu MUHDIN, H. Ahmad Syaiful Bahri, S.E., M.M., menyatakan bahwa posisi federasi ini adalah amanah sekaligus tanggung jawab besar. Selama ini industri ibadah kita terfragmentasi: ribuan penyelenggara bekerja sendiri-sendiri, standar tidak seragam, dan jamaah kerap menjadi pihak yang paling rentan. Melalui MUHDIN, kami membangun satu tata kelola yang membuat jamaah tenang dan pelaku usaha tumbuh.",
      "## Tiga Pilar Akses Kolektif",
      "Integrasi kolektif terhadap Nusuk melalui satu entitas asosiasi berpijak pada tiga pilar utama:",
      "1. **Integrasi sistem.** Akses pengurusan visa, verifikasi akomodasi berstandar Nusuk, dan manajemen jadwal ibadah termasuk akses Raudah melalui platform Nusuk (umrah.nusuk.sa dan hajj.nusuk.sa).",
      "2. **Sertifikasi SDM.** Tour leader dan mutawif bersertifikasi menjadi standar layanan, dengan penilaian kompetensi, bahasa, dan akhlak yang melibatkan umpan balik jamaah.",
      "3. **Perlindungan jamaah.** Transparansi harga, kontrak elektronik, escrow, dan takaful menjadi syarat keanggotaan untuk memastikan dana jamaah terlindungi.",
      "## Manfaat bagi Jamaah dan Industri",
      "Bagi jamaah, akses kolektif berarti kepastian: status visa dapat dipantau dari aplikasi, penerimaan di bandara Jeddah dan Madinah terkonfirmasi real time oleh command center, dan setiap tahap perjalanan — 13 tahap lengkap dari registrasi hingga oleh-oleh — memiliki aktor dan standar yang jelas. Bagi industri, daya tawar kolektif menghasilkan efisiensi biaya serta persaingan yang bergeser dari perang harga menuju perang mutu layanan.",
      "## Status Kesepakatan dan Peta Jalan",
      "Kesepakatan formal dengan pemangku kepentingan — termasuk MoU dengan Nusuk — merupakan deliverable Fase Fondasi (2026) sebagaimana peta jalan Whitepaper. Fase Integrasi (2027) menghadirkan onboarding gelombang pertama mitra, GPS tracking, dan command center 24/7. Fase Skala (2028) meluncurkan marketplace 13 ekosistem penuh dan modul kecerdasan data. Fase Keunggulan (2029-2030) menargetkan akreditasi mutu eksternal dan layanan lebih dari satu juta jamaah per tahun. Kemajuan kesepakatan akan dilaporkan secara transparan melalui kanal resmi MUHDIN.",
      "Sekretaris Jenderal Drs. H. Ridwan Kamil Hasyim menutup rangkaian penegasan dengan ajakan: undangan ini terbuka bagi seluruh penyelenggara yang bersedia tunduk pada standar. Semakin rapi barisannya, semakin tenang langkah jamaah. Bersama Melayani Tamu Allah.",
      "Whitepaper MUHDIN Edisi 1.0 dapat diperoleh melalui halaman Unduhan di muhdin.web.id. Informasi keanggotaan dan verifikasi penyelenggara tersedia pada kanal resmi MUHDIN atau email info@muhdin.web.id.",
    ].join("\n\n"),
  },
  {
    title:
      "Transformasi Digitalisasi Umroh-Haji Indonesia 2030: 13 Ekosistem Terintegrasi",
    category: "Artikel",
    featured: true,
    cover: "/images/jamaah-handling.jpg",
    views: 1520,
    excerpt:
      "MUHDIN menghimpun seluruh rantai layanan jamaah ke dalam 13 ekosistem terintegrasi — dari visa hingga oleh-oleh — dalam peta jalan digitalisasi menuju 2030.",
    content: [
      "Industri jasa ibadah Indonesia sedang menghadapi titik balik. Dengan lebih dari sejuta calon jamaah yang setiap tahun menempuh perjalanan ibadah, tuntutan akan layanan yang terstandar, transparan, dan terdigitalisasi bukan lagi pilihan — melainkan keharusan. MUHDIN menjawab tantangan tersebut dengan satu arsitektur besar: Transformasi Digitalisasi Umroh dan Haji Indonesia 2030, yang menghimpun seluruh rantai layanan jamaah ke dalam 13 ekosistem terintegrasi.",
      "## Mengapa 13 Ekosistem?",
      "Pengalaman jamaah tidak pernah berdiri pada satu layanan tunggal. Seorang jamaah menyentuh belasan penyedia: pengurus visa, petugas handling, tour leader, mutawif, hotel, transportasi, hingga penjual oleh-oleh. Selama ini, setiap mata rantai bekerja terpisah — inilah akar keterlambatan, salah informasi, dan celah penyalahgunaan.",
      "MUHDIN mengelompokkan 13 ekosistem ke dalam tiga klaster:",
      "1. **Akses dan Mobilitas** — visa umroh dan haji, handling di Indonesia, tour leader bersertifikasi, handling di Saudi, dan mutawif bersertifikasi.",
      "2. **Pengalaman Ibadah** — akomodasi hotel berstandar Nusuk, transportasi, wisata ziarah, Raudah, serta konsumsi dan restoran.",
      "3. **Nilai Tambah dan Jaminan Mutu** — oleh-oleh dan retail, registrasi dan layanan satu pintu, serta pengawalan dan pengawasan 24/7.",
      "Setiap ekosistem memiliki scope layanan dan standar mutu yang terukur. Handling di Indonesia, misalnya, diikat SLA waktu proses; akomodasi hotel diverifikasi jarak dan fasilitasnya secara berkala; distribusi slot Raudah diatur agar adil antar rombongan.",
      "## Digitalisasi yang Menghubungkan, Bukan Sekadar Mencatat",
      "Transformasi digital MUHDIN bukan sekadar memindahkan formulir ke layar. Prinsipnya adalah zero-gap handover: setiap serah terima antar layanan menghasilkan data digital yang dapat dipantau. Status visa tampil real time di aplikasi; manifest keberangkatan terbentuk otomatis saat check-in; kedatangan rombongan di Tanah Suci terkonfirmasi sebelum bagasi selesai diurut; dan command center memantau seluruh pergerakan melalui GPS tracking.",
      "Dengan satu sistem terintegrasi, jamaah mengetahui posisi perjalanannya kapan pun, penyelenggara mengelola operasional dengan data, dan regulator memperoleh dashboard yang memotret kondisi industri secara jujur.",
      "## Peta Jalan Empat Fase",
      "Transformasi ini berjalan dalam empat fase. **Fondasi (2026)** menuntaskan kelembagaan, legalitas, MoU dengan Nusuk, dan MVP aplikasi. **Integrasi (2027)** menghadirkan onboarding gelombang pertama mitra, mengaktifkan API Nusuk, GPS tracking, dan command center 24/7, serta membuka sertifikasi tour leader dan mutawif. **Skala (2028)** meluncurkan marketplace 13 ekosistem penuh, modul AI prediksi kuota dan harga, dashboard regulator, dan ekspansi kota keberangkatan. **Keunggulan (2029-2030)** mengunci mutu lewat akreditasi eksternal, interoperabilitas penuh dengan standar Saudi, dan laporan mutu tahunan publik menuju layanan lebih dari satu juta jamaah per tahun.",
      "## Standar yang Melindungi",
      "Digitalisasi tanpa perlindungan hanya mempercepat penipuan. Karena itu, MUHDIN menautkan seluruh ekosistem pada standar keanggotaan: verifikasi legalitas, transparansi harga, escrow, dan takaful. Jamaah dapat memeriksa status TERVERIFIKASI penyelenggara secara publik sebelum bertransaksi — langkah sederhana yang mengubah pasar dari asimetri informasi menjadi persaingan mutu.",
      "## Undangan Bergerak Bersama",
      "Transformasi ini bukan proyek satu lembaga, melainkan gerakan industri. PPIU, PIHK, KBIHU, penyedia transportasi, hotel, katering, hingga pelaku UMKM oleh-oleh — seluruhnya memiliki tempat dalam 13 ekosistem. Semakin lengkap barisan mitra, semakin rapat jaringan perlindungan jamaah.",
      "Visi menuju 2030 sederhana namun ambisius: menjadikan ekosistem layanan umroh dan haji Indonesia paling tepercaya, terstandar, dan terdigitalisasi — sehingga setiap jamaah dapat menunaikan ibadah dengan tenang, aman, dan penuh keberkahan. Bersama Melayani Tamu Allah.",
    ].join("\n\n"),
  },
  {
    title:
      "Integrasi Nusuk: Satu Pintu Visa, Kuota, dan Jadwal untuk Industri Indonesia",
    category: "Berita",
    featured: false,
    cover: "/images/hero-kaaba.jpg",
    views: 980,
    excerpt:
      "Integrasi sistem Nusuk ke ekosistem MUHDIN resmi berjalan, menghadirkan layanan satu pintu visa, kuota, dan jadwal bagi seluruh anggota.",
    content: [
      "Jakarta — Integrasi sistem Nusuk ke ekosistem MUHDIN resmi berjalan, membuka era baru layanan satu pintu bagi industri jasa ibadah Indonesia. Melalui kemitraan ini, pengurusan visa, alokasi kuota, dan penjadwalan ibadah yang selama ini tersebar di banyak kanal kini terhimpun dalam satu sistem digital yang sama bagi seluruh anggota MUHDIN.",
      "## Satu Kanal, Tiga Layanan Inti",
      "Integrasi ini menyatukan tiga layanan inti yang paling krusial bagi penyelenggara:",
      "1. **Visa.** Pengajuan visa umroh dan haji diproses melalui jalur resmi Nusuk dengan kuota dan jadwal terverifikasi. Status setiap pengajuan tampil real time di aplikasi — tidak ada lagi pengecekan manual berantai antar pihak.",
      "2. **Kuota.** Alokasi kuota keberangkatan tercatat dan terpantau dalam sistem, memberi kepastian bagi penyelenggara dalam merencanakan paket dan bagi jamaah dalam menilai kapasitas rombongan.",
      "3. **Jadwal.** Jadwal ibadah, termasuk manajemen akses Raudah di Masjid Nabawi, terintegrasi sehingga distribusi slot antar rombongan berjalan adil dan terukur.",
      "Direktur bidang teknologi MUHDIN, Ir. Fachruddin Mangunjaya, M.T., menjelaskan bahwa integrasi ini mengubah cara kerja industri. Dulu satu urusan visa bisa bergantung pada tiga orang dan lima kanal pesan. Sekarang satu sistem, satu status, dan satu sumber kebenaran. Waktu yang dihemat kembali kepada jamaah dalam bentuk layanan yang lebih tenang.",
      "## Dampak Langsung bagi Penyelenggara",
      "Bagi anggota MUHDIN, integrasi Nusuk menghadirkan tiga dampak praktis. Pertama, efisiensi operasional: dokumen jamaah terkirim sekali dan terlacak sampai terbit. Kedua, kredibilitas: status keanggotaan TERVERIFIKASI di portal MUHDIN kini disertai jejak sistem yang dapat diverifikasi, bukan sekadar klaim brosur. Ketiga, kesetaraan akses: penyelenggara kecil dan menengah memperoleh kanal yang sama dengan pemain besar untuk mengakses kuota dan jadwal.",
      "## Peningkatan Pengalaman Jamaah",
      "Di sisi jamaah, manfaat integrasi terasa pada kepastian. Status visa yang tampil real time menghapus kecemasan menjelang keberangkatan. Verifikasi hotel berstandar Nusuk memastikan jarak, fasilitas, dan rating mutu sesuai yang dijanjikan. Dan ketika rombongan mendarat di Tanah Suci, pemantauan kedatangan real time membuat petugas handling, bus, dan tour leader telah menunggu di posisi — bukan sebaliknya.",
      "## Tahapan Lanjutan",
      "Integrasi ini merupakan bagian dari fase Integrasi 2027 dalam peta jalan Transformasi Digitalisasi Umroh-Haji Indonesia 2030. Tahap lanjutan mencakup perluasan modul: GPS tracking rombongan, notifikasi insiden ke command center 24/7, hingga interoperabilitas penuh dengan standar digital Saudi pada fase Keunggulan 2029-2030.",
      "MUHDIN mengundang seluruh penyelenggara jasa ibadah yang belum bergabung untuk menyelesaikan pendaftaran keanggotaan dan menikmati integrasi satu pintu ini. Panduan pendaftaran tersedia di portal muhdin.web.id, atau hubungi sekretariat melalui email info@muhdin.web.id dan telepon +62 21 1234 5678.",
      "Bersama Melayani Tamu Allah — kini bukan sekadar tagline, melainkan sistem yang bekerja setiap hari.",
    ].join("\n\n"),
  },
  {
    title: "Gelombang Pertama Sertifikasi Tour Leader & Mutawif Dibuka",
    category: "Pengumuman",
    featured: false,
    cover: "/images/manasik.jpg",
    views: 760,
    excerpt:
      "MUHDIN membuka gelombang pertama program sertifikasi tour leader dan mutawif untuk seluruh anggota — bagian dari Fase Integrasi 2027.",
    content: [
      "Jakarta — MUHDIN resmi membuka gelombang pertama program sertifikasi Tour Leader dan Mutawif bagi seluruh anggota. Program ini merupakan implementasi Fase Integrasi 2027 dan bagian tak terpisahkan dari upaya menaikkan standar profesionalisme SDM ibadah Indonesia.",
      "## Mengapa Sertifikasi Dibutuhkan",
      "Tour leader dan mutawif adalah dua wajah layanan yang paling dekat dengan jamaah. Mereka menentukan kenyamanan perjalanan, kekhusyukan ibadah, bahkan keselamatan rombongan. Namun selama ini praktiknya sangat beragam: sebagian telah luar biasa, sebagian belum pernah mendapat pembinaan terstruktur. Sertifikasi MUHDIN hadir menyatukan standar kompetensi, penguasaan bahasa, dan akhlak dalam satu bingkai yang terukur.",
      "## Skema Program",
      "Program gelombang pertama mencakup:",
      "1. **Sertifikasi Tour Leader** — pembekalan manajemen rombongan, komunikasi, penanganan situasi darurat, dan penguasaan alur 13 tahap perjalanan jamaah; dengan rasio pendamping terukur sejak titik kumpul hingga kepulangan.",
      "2. **Sertifikasi Mutawif** — pendalaman manasik, tata cara ibadah di Tanah Suci, panduan kunjungan Raudah, dan etika pembinaan; penilaian mutu dilakukan langsung oleh jamaah melalui aplikasi.",
      "3. **Penilaian berkelanjutan** — sertifikasi bukan ijazah sekali seumur hidup. Skor kepuasan jamaah dan rekam insiden menjadi dasar perpanjangan kualifikasi.",
      "## Siapa yang Bisa Mendaftar",
      "Pendaftaran dibuka untuk personel anggota MUHDIN dari seluruh tipe: PPIU, PIHK, KBIHU, dan mitra layanan. Prioritas diberikan kepada anggota dengan status TERVERIFIKASI yang telah menuntaskan orientasi standar layanan. Setiap penyelenggara dapat mengusulkan hingga lima calon peserta pada gelombang pertama.",
      "## Jadwal dan Lokasi",
      "Gelombang pertama diselenggarakan secara hibrid: materi teori melalui modul digital dalam aplikasi MUHDIN, sementara ujian praktik dan simulasi digelar di lima kota — Jakarta, Surabaya, Bandung, Medan, dan Makassar. Pengumuman jadwal rinci dikirim melalui kontak resmi penyelenggara dan halaman Pengumuman portal MUHDIN.",
      "## Manfaat bagi Penyelenggara dan Jamaah",
      "Bagi penyelenggara, memiliki SDM bersertifikasi berarti memperkuat profil di Direktori Anggota publik dan meningkatkan kepercayaan calon jamaah. Bagi jamaah, lencana sertifikasi pada petugas menjadi jaminan bahwa pembimbing perjalanannya telah lulus standar — kompetensi, bahasa, dan akhlak — dan dinilai secara terbuka oleh jamaah-jamaah sebelumnya.",
      "## Komitmen Jangka Panjang",
      "Sertifikasi ini adalah salah satu pilar menjadikan industri ibadah Indonesia paling profesional di kawasan. Target Fase Skala 2028 adalah ribuan SDM bersertifikasi yang tersebar di seluruh kota keberangkatan, mendukung target layanan lebih dari satu juta jamaah per tahun pada 2029-2030.",
      "Informasi dan pendaftaran peserta dapat diajukan oleh pengurus anggota melalui sekretariat MUHDIN di info@muhdin.web.id. Seluruh proses tidak dipungut biaya tambahan di luar komitmen program anggota — karena kualitas SDM ibadah adalah investasi bersama seluruh ekosistem.",
      "Bersama Melayani Tamu Allah — dengan amanah, profesional, terstandar, dan penuh keberkahan.",
    ].join("\n\n"),
  },
  {
    title: "Perlindungan Dana Jamaah: Escrow dan Takaful Menjadi Standar Ekosistem",
    category: "Artikel",
    featured: false,
    cover: "/images/hotel-makkah.jpg",
    views: 640,
    excerpt:
      "MUHDIN menetapkan escrow dan takaful sebagai standar wajib keanggotaan, menjadikan perlindungan dana jamaah fondasi — bukan bonus — layanan ibadah.",
    content: [
      "Bayar dulu, berangkat kemudian — pola transaksi yang dominan di industri jasa ibadah menempatkan jamaah pada posisi paling rentan. Kabar baiknya, MUHDIN menetapkan escrow dan takaful sebagai standar wajib ekosistem, menjadikan perlindungan dana jamaah bukan lagi bonus, melainkan fondasi keanggotaan.",
      "## Akar Masalah yang Lama Dibiarkan",
      "Kasus pembatalan keberangkatan, penyelenggara yang menghilang, hingga penyalahgunaan setoran jamaah hampir selalu berakar pada satu hal: dana jamaah dikelola sebagai kas pribadi penyelenggara, tercampur dengan operasional lain. Ketika usaha goyah, dana ibadah ikut goyah. Jamaah kehilangan bukan hanya uang, tetapi juga waktu dan harapan yang telah dipersiapkan bertahun-tahun.",
      "## Skema Escrow: Dana Terpisah, Keberangkatan Terlindungi",
      "Dalam standar MUHDIN, setoran jamaah disimpan pada rekening escrow — rekening penampungan yang dananya cair kepada penyelenggara secara bertahap, mengikuti progres layanan:",
      "1. Saat kontrak elektronik ditandatangani, sebagian dana rilis untuk pengurusan visa dan dokumen.",
      "2. Menjelang keberangkatan, rilis berikutnya menutup kebutuhan akomodasi dan transportasi.",
      "3. Sisa dana rilis setelah layanan selesai dan jamaah memberikan konfirmasi pelaksanaan yang layak.",
      "Dengan mekanisme ini, kegagalan penyelenggara tidak serta-merta menghanguskan dana jamaah. Dana yang belum layak rilis dapat dikembalikan atau dialihkan ke penyelenggara pengganti dari jaringan anggota MUHDIN.",
      "## Takaful: Saling Menjaga Sesuai Sunnah",
      "Lapisan kedua adalah takaful — perlindungan bersama berbasis tolong-menolong. Setiap rombongan berkontribusi pada dana perlindungan yang siap menampung risiko: keberangkatan tertunda karena force majeure, kebutuhan medis darurat, hingga repatriasi. Skema ini selaras dengan nilai syariah sekaligus menstabilkan usaha penyelenggara dari guncangan risiko tak terduga.",
      "## Transparansi sebagai Deterjen Pasar",
      "Standar perlindungan dana bekerja beriringan dengan transparansi harga. Rincian paket — kelas hotel, jarak ke Masjidil Haram, komposisi konsumsi, dan biaya ziarah — wajib dinyatakan jelas sejak registrasi satu pintu. Jamaah dapat membandingkan penawaran secara apel-dengan-apel, dan penyelenggara bersaing pada mutu, bukan pada tipu daya.",
      "Bagaimana jamaah memastikan penyelenggaranya tunduk pada standar ini? Cukup periksa status keanggotaan di portal MUHDIN. Penyelenggara berstatus TERVERIFIKASI telah melewati verifikasi legalitas dan terikat pakta standar layanan, termasuk escrow dan takaful. Status PENDING berarti verifikasi masih berjalan; status SUSPENDED adalah sinyal untuk menahan langkah.",
      "## Dampak bagi Industri",
      "Kehadiran standar perlindungan dana mengubah struktur pasar. Penyelenggara serius justru diuntungkan karena biaya kepercayaan turun — mereka tidak lagi bersaing dengan pelaku ilegal yang menjual harga murah tanpa jaminan. Perbankan dan lembaga pembiayaan pun lebih mudah mendukung anggota dengan rekam perlindungan yang jelas, membuka akses permodalan yang sehat.",
      "MUHDIN yakin, industri yang melindungi jamaahnya akan dilindungi pertumbuhannya. Escrow menjaga dana, takaful menjaga risiko, sertifikasi menjaga SDM, dan command center menjaga perjalanan — empat lapis perlindungan yang saling mengunci menuju visi 2030: setiap jamaah beribadah dengan tenang, aman, dan penuh keberkahan. Bersama Melayani Tamu Allah.",
    ].join("\n\n"),
  },
  {
    title: "MUHDIN Hadirkan Command Center 24/7 untuk Pengawalan Jamaah",
    category: "Berita",
    featured: false,
    cover: "/images/command-center.jpg",
    views: 820,
    excerpt:
      "Pusat pemantauan dan pengawalan jamaah resmi beroperasi sepanjang hari — menutup alur 13 tahap perjalanan dengan pengawasan yang tak pernah tidur.",
    content: [
      "Jakarta — MUHDIN resmi mengoperasikan Command Center 24/7, pusat pemantauan dan pengawalan jamaah yang bekerja sepanjang hari selama masa perjalanan ibadah. Fasilitas ini menjadi lapisan pengaman teratas dalam 13 ekosistem layanan MUHDIN, menutup keseluruhan alur perjalanan jamaah dengan pengawasan yang tak pernah tidur.",
      "## Apa yang Dipantau Command Center",
      "Command center mengawal perjalanan dari tiga sumber data utama:",
      "1. **GPS tracking rombongan.** Posisi bus dan rombongan di Tanah Suci serta jalur keberangkatan di Indonesia terpantau peta terkini, memudahkan antisipasi keterlambatan.",
      "2. **Status layanan real time.** Dari penerbitan visa, keberangkatan, check-in hotel, hingga jadwal Raudah — setiap tahapan mengalirkan status ke satu dashboard.",
      "3. **Kanal insiden jamaah.** Laporan dari tour leader, mutawif, dan jamaah masuk melalui kanal terstruktur dengan tingkat prioritas yang jelas.",
      "## Eskalasi Insiden yang Terstruktur",
      "Kekuatan command center bukan pada teknologi semata, melainkan pada disiplin proses. Setiap insiden mengikuti alur eskalasi baku: deteksi, verifikasi, penugasan penanggung jawab terdekat, penanganan, dan pemantauan penyelesaian. Insiden kesehatan lanjut usia, kehilangan bagasi, keterlambatan bus, hingga perubahan jadwal mendadak memiliki prosedur siap pakai — sehingga respons tidak bergantung pada kebetulan ada orang yang peduli, melainkan dijamin sistem.",
      "Jamaah tidak perlu tahu seluruh kerumitan di baliknya. Cukup satu nomor, satu laporan, dan seluruh ekosistem bergerak. Demikian disampaikan pengurus MUHDIN dalam peluncuran fasilitas ini.",
      "## Terhubung ke Seluruh Ekosistem",
      "Command center bukan pulau. Ia terhubung dengan mitra handling di bandara Indonesia dan Saudi, operator transportasi, manajemen hotel, penyedia konsumsi, hingga kantor perwakilan di Tanah Suci. Ketika satu titik bermasalah, penyelesaian dapat memindahkan sumber daya lintas layanan — misalnya mengatur ulang bus, menggeser jadwal check-in, dan memberi tahu mutawif dalam satu koordinasi yang sama.",
      "Bagi keluarga jamaah di tanah air, kehadiran command center memberi ketenangan tambahan: perjalanan orang tercinta tidak lagi menjadi kotak hitam yang hanya diketahui saat kabar baik atau buruk tiba.",
      "## Bagian dari Komitmen Mutu Jangka Panjang",
      "Operasional penuh command center merupakan tonggak Fase Integrasi 2027 dalam peta jalan Transformasi Digitalisasi Umroh-Haji Indonesia 2030. Pada fase berikutnya, data insiden dan mutu layanan akan diagregasi menjadi laporan mutu tahunan publik dan dashboard regulator — menjadikan pengawasan bukan rahasia internal, melainkan keterbukaan yang membangun kepercayaan industri.",
      "Jamaah dan keluarga dapat mengakses nomor darurat command center melalui aplikasi MUHDIN dan informasi rombongan masing-masing. Penyelenggara anggota memperoleh panduan integrasi layanan pengawalan melalui sekretariat di info@muhdin.web.id.",
      "Dengan command center 24/7, tagline MUHDIN semakin bermakna: Bersama Melayani Tamu Allah — siaga siang dan malam, dari berangkat hingga pulang membawa keberkahan.",
    ].join("\n\n"),
  },
];

// ---------- 9. FAQ (10) ----------
const faqs = [
  {
    question: "Apa itu MUHDIN?",
    answer:
      "MUHDIN (Masyarakat Umroh Haji Digital Indonesia) adalah asosiasi payung penyelenggara jasa ibadah Indonesia — Asosiasi di Atas Asosiasi — yang diposisikan sebagai titik koordinasi tunggal akses platform Nusuk bagi industri. MUHDIN memayungi PPIU, PIHK, KBIHU, dan mitra layanan jamaah dalam satu tata kelola terstandar dengan tagline Bersama Melayani Tamu Allah.",
    category: "Umum",
    order: 1,
  },
  {
    question: "Apa manfaat bergabung menjadi anggota MUHDIN?",
    answer:
      "Anggota memperoleh akses ke 13 ekosistem layanan, program akses kolektif Nusuk (visa, kuota, jadwal), program sertifikasi tour leader dan mutawif, visibilitas di Direktori Anggota publik, serta jaringan perlindungan dana jamaah melalui skema escrow dan takaful. Keanggotaan menjadi tanda kredibilitas yang dapat diverifikasi calon jamaah.",
    category: "Keanggotaan",
    order: 2,
  },
  {
    question: "Bagaimana proses verifikasi anggota MUHDIN?",
    answer:
      "Setelah mendaftar, tim sekretariat memeriksa kelengkapan dokumen paling lambat 7 hari kerja, melakukan verifikasi silang nomor izin ke Kemenag, dan bila perlu melakukan klarifikasi atau kunjungan lapangan. Setelah lulus, status berubah menjadi TERVERIFIKASI dan profil perusahaan tampil di Direktori Anggota publik.",
    category: "Keanggotaan",
    order: 3,
  },
  {
    question: "Apakah dana jamaah dilindungi?",
    answer:
      "Ya. Standar ekosistem MUHDIN mewajibkan perlindungan dana jamaah melalui rekening escrow yang pencairannya bertahap mengikuti progres layanan, serta lapisan takaful untuk menampung risiko seperti keberangkatan tertunda dan kebutuhan medis darurat. Setiap transaksi terdokumentasi dalam kontrak elektronik yang mengikat.",
    category: "Jamaah",
    order: 4,
  },
  {
    question: "Bagaimana cara jamaah memeriksa legalitas penyelenggara?",
    answer:
      "Gunakan halaman Verifikasi di portal MUHDIN: masukkan nama penyelenggara atau nomor izin, lalu periksa statusnya. TERVERIFIKASI berarti legal telah diperiksa dan layanan terstandar; PENDING berarti verifikasi masih berjalan; SUSPENDED berarti keanggotaan dihentikan sementara dan sebaiknya jangan bertransaksi.",
    category: "Jamaah",
    order: 5,
  },
  {
    question: "Apa itu 13 Ekosistem MUHDIN?",
    answer:
      "13 Ekosistem adalah peta lengkap layanan jamaah yang terintegrasi dalam satu tata kelola: visa, handling di Indonesia, tour leader bersertifikasi, handling di Saudi, mutawif bersertifikasi, hotel, transportasi, wisata ziarah, Raudah, konsumsi, oleh-oleh, registrasi satu pintu, serta pengawalan dan pengawasan 24/7. Ketiganya dikelompokkan dalam klaster Akses & Mobilitas, Pengalaman Ibadah, dan Nilai Tambah & Jaminan Mutu.",
    category: "Umum",
    order: 6,
  },
  {
    question: "Bagaimana MUHDIN terintegrasi dengan Nusuk?",
    answer:
      "Melalui program akses kolektif Nusuk, MUHDIN menghubungkan seluruh anggotanya ke layanan Nusuk untuk pengurusan visa, verifikasi akomodasi berstandar Nusuk, manajemen jadwal ibadah termasuk akses Raudah, dan pemantauan kedatangan jamaah secara real time — satu sumber kebenaran bagi seluruh industri. Status kesepakatan formal mengikuti peta jalan Whitepaper dan dilaporkan transparan melalui kanal resmi MUHDIN.",
    category: "Teknologi",
    order: 7,
  },
  {
    question: "Apa manfaat aplikasi dan GPS tracking bagi jamaah?",
    answer:
      "Melalui aplikasi, jamaah dapat memantau status visa, jadwal ibadah, voucher hotel, dan posisi rombongan secara real time. GPS tracking terhubung ke command center 24/7 yang mengawal seluruh perjalanan, sehingga setiap insiden cepat ditangani dan keluarga di tanah air memperoleh ketenangan.",
    category: "Teknologi",
    order: 8,
  },
  {
    question: "Siapa saja 5 mitra utama dalam ekosistem MUHDIN?",
    answer:
      "Lima mitra utama yang menopang layanan jamaah adalah: mitra handling bandara di Indonesia dan Saudi, tour leader bersertifikasi, mutawif bersertifikasi, hotel berstandar Nusuk di Makkah-Madinah-Jeddah, serta operator transportasi (bus dan kereta Haramain). Seluruhnya terikat standar mutu MUHDIN dan dinilai secara berkala.",
    category: "Keanggotaan",
    order: 9,
  },
  {
    question: "Bagaimana cara menghubungi MUHDIN?",
    answer:
      "Anda dapat menghubungi sekretariat melalui email info@muhdin.web.id, telepon +62 21 1234 5678, atau formulir kontak resmi di muhdin.web.id. Kantor sekretariat berada di Gedung Asosiasi MUHDIN, Jakarta Pusat, dan melayani pada jam kerja 09.00-17.00 WIB.",
    category: "Umum",
    order: 10,
  },
];

// ---------- 10. TESTIMONIALS (6) ----------
const testimonials = [
  {
    name: "Hj. Ratna Dewi Kumalasari",
    role: "Jamaah Umrah, Jakarta",
    rating: 5,
    published: true,
    content:
      "Umrah pertama saya sangat tenang. Status visa bisa dipantau dari aplikasi, di bandara sudah ada petugas handling yang memandu, dan mutawifnya sabar sekali membimbing ibadah. Rasanya benar-benar dilayani oleh ekosistem yang rapi dan amanah.",
  },
  {
    name: "Ust. Fajar Ramadhan, S.E.",
    role: "Pemilik PPIU, PT Insan Barokah Wisata",
    rating: 5,
    published: true,
    content:
      "Sejak bergabung dengan MUHDIN, kepercayaan calon jamaah kami meningkat pesat. Lencana TERVERIFIKASI dan integrasi Nusuk membuat pengurusan visa jauh lebih cepat. Akhirnya kami bisa fokus pada mutu layanan, bukan memperjuangkan kredibilitas.",
  },
  {
    name: "Siti Aminah",
    role: "Tour Leader Bersertifikasi, Surabaya",
    rating: 5,
    published: true,
    content:
      "Pelatihan sertifikasi tour leader MUHDIN sangat berbeda: ada standar yang jelas, simulasi situasi darurat, dan alur 13 tahap yang membuat saya tahu persis tanggung jawab di tiap titik. Jamaah lebih tenang, dan saya pun lebih percaya diri.",
  },
  {
    name: "Ust. H. Ahmad Zaki",
    role: "Mutawif Bersertifikasi, Jakarta",
    rating: 5,
    published: true,
    content:
      "Penilaian langsung dari jamaah melalui aplikasi membuat kami terus memperbaiki diri. Jadwal ibadah yang teratur dan dukungan command center membantu pembinaan berjalan khusyuk. Inilah penghormatan tertinggi bagi profesi mutawif.",
  },
  {
    name: "H. Bambang Sutrisno",
    role: "Ketua KBIHU Kota Bandung",
    rating: 4,
    published: true,
    content:
      "Payung MUHDIN membantu anggota kami kecil-kecil naik kelas: akses kuota lebih adil, ada pelatihan SDM, dan nama baik industri terjaga. Saya berharap proses administrasi keanggotaan berikutnya semakin ringkas agar lebih banyak anggota terbantu.",
  },
  {
    name: "Rina Marlina",
    role: "Pelaku UMKM Oleh-oleh, Bekasi",
    rating: 5,
    published: true,
    content:
      "Melalui ekosistem oleh-oleh MUHDIN, produk kurma dan olek UMKM kami masuk ke pusat retail terpercaya di Tanah Suci. Jangkauan pasarnya jauh lebih luas, pembayaran transparan, dan yang terpenting, nama produk Indonesia mulai dikenal jamaah.",
  },
];

// ---------- 11. MANAGEMENT (5) ----------
const managements = [
  {
    name: "H. Drs. Muhammad Hidayatullah, M.M.",
    position: "Ketua Dewan Penasihat",
    order: 1,
    bio: "Pengusaha dan dai senior dengan pengalaman lebih dari 30 tahun di industri jasa ibadah, menjadi penjaga arah strategis dan nilai-nilai MUHDIN.",
  },
  {
    name: "H. Ahmad Syaiful Bahri, S.E., M.M.",
    position: "Ketua Ummu",
    order: 2,
    bio: "Praktisi manajemen yang memimpin konsolidasi asosiasi dan kemitraan strategis MUHDIN dengan Nusuk serta pemangku kepentingan nasional.",
  },
  {
    name: "Drs. H. Ridwan Kamil Hasyim",
    position: "Sekretaris Jenderal",
    order: 3,
    bio: "Menjalankan sekretariat, keanggotaan, dan tata kelola operasional asosiasi dengan fokus pada kecepatan layanan bagi mitra.",
  },
  {
    name: "Hj. Siti Nurhaliza, S.E., Ak., CA.",
    position: "Bendahara Umum",
    order: 4,
    bio: "Akuntan profesional yang menjaga integritas keuangan dan transparansi laporan asosiasi, termasuk tata kelola perlindungan dana jamaah.",
  },
  {
    name: "Ir. Fachruddin Mangunjaya, M.T.",
    position: "Dirjen Teknologi & Digital",
    order: 5,
    bio: "Insinyur teknologi informasi yang memimpin integrasi digital Nusuk, pengembangan aplikasi, dan operasional command center MUHDIN.",
  },
];

// ---------- 9a. RESOURCES (unduhan publik) ----------
const resources = [
  {
    title: "Whitepaper MUHDIN — Edisi 1.0 (September 2026)",
    description:
      "Kertas kerja strategis MUHDIN: arsitektur 13 ekosistem layanan umroh-haji terintegrasi, lima mitra utama, enam pilar teknologi, model bisnis berakar akad syariah, dan peta jalan 2026-2030. Dokumen konsultasi pemangku kepentingan.",
    category: "Panduan",
    fileUrl: "/dokumen/whitepaper-muhdin-2026.pdf",
    fileType: "PDF",
    published: true,
    downloads: 0,
  },
];

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log("Memulai seed MUHDIN...");

  // ---------- Hapus data lama (idempotent, urutan aman FK) ----------
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.membershipApplication.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.article.deleteMany();
  await prisma.ecosystem.deleteMany();
  await prisma.journeyStep.deleteMany();
  await prisma.roadmap.deleteMany();
  await prisma.member.deleteMany();
  await prisma.tutorial.deleteMany();
  await prisma.faq.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.management.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.resource.deleteMany();
  console.log("Data lama berhasil dihapus.");

  // ---------- 1. User admin ----------
  await prisma.user.create({
    data: {
      email: "admin@muhdin.web.id",
      name: "Administrator MUHDIN",
      role: "ADMIN",
      password: adminPassword,
    },
  });
  console.log("User admin dibuat: admin@muhdin.web.id (role ADMIN)");

  // ---------- 2. Site settings ----------
  await prisma.siteSetting.createMany({ data: siteSettings });

  // ---------- 3. Ecosystem ----------
  await prisma.ecosystem.createMany({ data: ecosystems });

  // ---------- 4. Journey steps ----------
  await prisma.journeyStep.createMany({ data: journeySteps });

  // ---------- 5. Roadmap ----------
  await prisma.roadmap.createMany({ data: roadmaps });

  // ---------- 6. Members ----------
  await prisma.member.createMany({ data: members });

  // ---------- 7. Tutorials ----------
  await prisma.tutorial.createMany({
    data: tutorials.map((t) => ({ ...t, slug: slugify(t.title) })),
  });

  // ---------- 8. Articles ----------
  await prisma.article.createMany({
    data: articles.map((a) => ({
      title: a.title,
      slug: slugify(a.title),
      excerpt: a.excerpt,
      content: a.content,
      category: a.category,
      cover: a.cover,
      status: "PUBLISHED",
      featured: a.featured,
      views: a.views,
      author: "Tim MUHDIN",
    })),
  });

  // ---------- 9. FAQ ----------
  await prisma.faq.createMany({ data: faqs });

  // ---------- 9a. Resources (unduhan publik — whitepaper) ----------
  await prisma.resource.createMany({ data: resources });

  // ---------- 10. Testimonials ----------
  await prisma.testimonial.createMany({ data: testimonials });

  // ---------- 11. Management ----------
  await prisma.management.createMany({ data: managements });

  // ---------- Verifikasi ----------
  const [
    userCount,
    siteSettingCount,
    ecosystemCount,
    journeyStepCount,
    roadmapCount,
    memberCount,
    tutorialCount,
    articleCount,
    faqCount,
    testimonialCount,
    managementCount,
    resourceCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.siteSetting.count(),
    prisma.ecosystem.count(),
    prisma.journeyStep.count(),
    prisma.roadmap.count(),
    prisma.member.count(),
    prisma.tutorial.count(),
    prisma.article.count(),
    prisma.faq.count(),
    prisma.testimonial.count(),
    prisma.management.count(),
    prisma.resource.count(),
  ]);

  console.log("\n=== SEED MUHDIN SELESAI — JUMLAH RECORD PER MODEL ===");
  console.log("User          :", userCount);
  console.log("SiteSetting   :", siteSettingCount);
  console.log("Ecosystem     :", ecosystemCount);
  console.log("JourneyStep   :", journeyStepCount);
  console.log("Roadmap       :", roadmapCount);
  console.log("Member        :", memberCount);
  console.log("Tutorial      :", tutorialCount);
  console.log("Article       :", articleCount);
  console.log("Faq           :", faqCount);
  console.log("Testimonial   :", testimonialCount);
  console.log("Management    :", managementCount);
  console.log("Resource      :", resourceCount);
  console.log("\nSeed sukses. Bersama Melayani Tamu Allah.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Seed GAGAL:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
