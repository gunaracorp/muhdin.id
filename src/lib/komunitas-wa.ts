/**
 * komunitas-wa.ts — MASTER WHATSAPP COMMUNITY ARCHITECTURE — FINAL EDITION
 * (Keputusan arsitektural super final owner, 2026-11-18: 17 grup spesialis +
 *  1 kanal pengumuman resmi = 18 kanal komunikasi, 6 ekosistem utama.)
 *
 * Prinsip MUHDIN: Satu fungsi memiliki satu rumah koordinasi. Satu anggota
 * memiliki satu grup utama. Kolaborasi lintas grup hanya berdasarkan
 * kebutuhan pekerjaan.
 *
 * Deskripsi grup adalah naskah resmi SIAP COPAS WhatsApp — tetap dalam bahasa
 * Indonesia asli (proper noun organisasi); nama grup resmi bilingual.
 */

export interface WaChannel {
  /** Nomor kanal 00–17. */
  no: string;
  /** Nama grup resmi (format "MUHDIN | …" — as-is keputusan owner). */
  name: string;
  /** Key i18n singkat: waChannel.<key> untuk kartu UI. */
  key: string;
  /** Fungsi utama (id — as-is). */
  fn: string;
  /** Profil anggota (id — as-is dari naskah resmi). */
  members: string;
  /** Deskripsi resmi siap copas WhatsApp (id — as-is). */
  desc: string;
  icon: string;
  /** Ekosistem utama (1–6). */
  eco: 1 | 2 | 3 | 4 | 5 | 6;
  /** true = kanal pengumuman resmi (bukan grup diskusi). */
  announce?: boolean;
}

export const ECOSYSTEMS = [
  { id: 1, key: "gov", icon: "landmark" },      // Governance & Leadership
  { id: 2, key: "member", icon: "users" },      // Membership & Industry
  { id: 3, key: "services", icon: "briefcase" },// Business & Services
  { id: 4, key: "global", icon: "globe" },      // Institutional & Global Relations
  { id: 5, key: "knowledge", icon: "graduation-cap" }, // Knowledge, Technology & Professional Development
  { id: 6, key: "regional", icon: "map" },      // Regional Organization
] as const;

export const WA_CHANNELS: WaChannel[] = [
  {
    no: "00", name: "MUHDIN | OFFICIAL ANNOUNCEMENT", key: "c00",
    fn: "Pengumuman seluruh komunitas",
    members: "Seluruh komunitas MUHDIN.",
    desc: "Kanal pengumuman resmi Masyarakat Umroh Haji Digital Indonesia. Menyampaikan keputusan DPP, agenda nasional, undangan, kegiatan organisasi, kebijakan, informasi keanggotaan dan pemberitahuan resmi kepada seluruh dewan, pengurus, anggota serta mitra MUHDIN. Dikelola secara terpusat oleh administrator resmi.",
    icon: "megaphone", eco: 1, announce: true,
  },
  {
    no: "01", name: "MUHDIN | LEADERSHIP & COUNCIL", key: "c01",
    fn: "Pimpinan dan seluruh dewan",
    members: "Dewan Pendiri, Dewan Penasihat, Dewan Kehormatan, Dewan Pakar, Dewan Pengawas, Ketua Umum dan jajaran pimpinan inti.",
    desc: "Forum komunikasi strategis pimpinan dan seluruh unsur dewan MUHDIN. Menjadi ruang musyawarah, konsultasi, nasihat strategis, pertukaran pemikiran, evaluasi kelembagaan, pengawasan serta pengembangan visi dan arah organisasi untuk membangun ekosistem haji dan umrah Indonesia yang profesional dan berkelanjutan.",
    icon: "landmark", eco: 1,
  },
  {
    no: "02", name: "MUHDIN | DPP MANAGEMENT", key: "c02",
    fn: "Pengurus dan departemen DPP",
    members: "Seluruh pengurus DPP, Sekretariat Jenderal, Bendahara, Ketua Departemen, Ketua Bidang dan jajaran pelaksana.",
    desc: "Pusat koordinasi dan pelaksanaan program kerja DPP MUHDIN. Mengintegrasikan urusan organisasi, administrasi, hukum, hubungan kelembagaan, pengembangan anggota, keuangan organisasi, pengawasan internal, kegiatan, komunikasi dan pelaporan seluruh departemen serta bidang untuk memastikan tata kelola organisasi berjalan terpadu, profesional dan akuntabel.",
    icon: "network", eco: 1,
  },
  {
    no: "03", name: "MUHDIN | MEMBER HUB", key: "c03",
    fn: "Seluruh anggota",
    members: "Seluruh anggota resmi MUHDIN dari unsur PPIU, PIHK, BPW, KBIHU, profesional dan anggota kelembagaan lainnya.",
    desc: "Pusat silaturahmi, komunikasi dan kolaborasi seluruh anggota resmi MUHDIN. Menjadi wadah berbagi informasi, penyampaian aspirasi, edukasi industri, pengembangan jaringan, pertukaran pengalaman, peluang kolaborasi dan penguatan solidaritas untuk membangun ekosistem haji dan umrah Indonesia yang saling menguntungkan.",
    icon: "heart-handshake", eco: 2,
  },
  {
    no: "04", name: "MUHDIN | PPIU & PIHK NETWORK", key: "c04",
    fn: "Travel umrah dan haji khusus",
    members: "Pemilik, pimpinan, direktur dan perwakilan resmi PPIU serta PIHK anggota MUHDIN.",
    desc: "Forum strategis penyelenggara perjalanan ibadah umrah dan haji khusus. Membahas regulasi, pembinaan usaha, operasional, konsorsium jamaah, pengembangan paket, kolaborasi antartavel, kepatuhan, efisiensi biaya, kemitraan dan peningkatan kualitas pelayanan jamaah.",
    icon: "building", eco: 2,
  },
  {
    no: "05", name: "MUHDIN | BPW & KBIHU NETWORK", key: "c05",
    fn: "BPW, KBIHU dan manasik",
    members: "Pemilik dan pengelola BPW, KBIHU, pembimbing ibadah dan praktisi wisata religi.",
    desc: "Forum pengembangan jaringan Biro Perjalanan Wisata dan Kelompok Bimbingan Ibadah Haji dan Umrah. Mengembangkan kemitraan perjalanan, wisata religi, jaringan pemasaran, manasik, pendidikan jamaah, kompetensi pembimbing serta kolaborasi produktif dengan PPIU dan PIHK.",
    icon: "compass", eco: 2,
  },
  {
    no: "06", name: "MUHDIN | SAUDI & GLOBAL ALLIANCE", key: "c06",
    fn: "Mitra Saudi dan internasional",
    members: "Mitra Arab Saudi, syarikah, penyedia layanan internasional, mitra luar negeri dan pengurus kerja sama internasional.",
    desc: "Forum kemitraan internasional MUHDIN yang menghubungkan ekosistem Indonesia dengan Arab Saudi dan jaringan global. Mengembangkan kerja sama dengan syarikah, perusahaan Saudi, penyedia layanan, mitra strategis dan investor internasional melalui kemitraan bisnis, kelembagaan, kontrak layanan dan pengembangan jaringan global.",
    icon: "globe", eco: 4,
  },
  {
    no: "07", name: "MUHDIN | AIRLINE & AVIATION", key: "c07",
    fn: "Maskapai dan penerbangan",
    members: "Maskapai, konsolidator tiket, agen penerbangan, penyedia layanan penerbangan dan perwakilan travel terkait.",
    desc: "Forum koordinasi penerbangan dan transportasi udara untuk ekosistem haji dan umrah. Membahas kerja sama maskapai, negosiasi tarif, kontrak korporasi, ketersediaan kursi, rute, ticketing, perubahan jadwal, layanan penerbangan dan solusi gangguan perjalanan jamaah.",
    icon: "plane", eco: 3,
  },
  {
    no: "08", name: "MUHDIN | VISA & TRAVEL DOCUMENTATION", key: "c08",
    fn: "Visa dan dokumen perjalanan",
    members: "Praktisi visa, pengelola dokumen perjalanan, penyedia layanan administrasi dan perwakilan PPIU/PIHK yang ditunjuk.",
    desc: "Forum koordinasi visa dan dokumen perjalanan haji serta umrah. Menjadi wadah pembaruan informasi persyaratan, prosedur administrasi, koordinasi mitra, kelengkapan dokumen, kepatuhan ketentuan perjalanan dan penyelesaian kendala dokumentasi jamaah.",
    icon: "file-text", eco: 3,
  },
  {
    no: "09", name: "MUHDIN | HOSPITALITY & GROUND SERVICES", key: "c09",
    fn: "Hotel, katering dan transportasi",
    members: "Hotel, katering, transportasi darat, penyedia logistik, akomodasi dan layanan pendukung jamaah.",
    desc: "Forum pengembangan jaringan layanan akomodasi dan operasional darat. Menghubungkan hotel, penyedia konsumsi, transportasi, logistik dan perlengkapan jamaah untuk membangun kemitraan, negosiasi harga, pengadaan kolektif, efisiensi rantai pasok serta peningkatan standar pelayanan.",
    icon: "bed", eco: 3,
  },
  {
    no: "10", name: "MUHDIN | BUSINESS & INVESTMENT", key: "c10",
    fn: "Pengembangan usaha dan investasi",
    members: "Pengusaha, investor, pengurus bidang usaha, mitra komersial, koperasi dan pengembang bisnis.",
    desc: "Forum pengembangan usaha dan investasi ekosistem MUHDIN. Membahas peluang bisnis, investasi, koperasi, pengembangan produk, kemitraan komersial, pengadaan strategis, rantai pasok, penguatan ekonomi anggota dan penciptaan nilai tambah industri haji dan umrah.",
    icon: "trending-up", eco: 3,
  },
  {
    no: "11", name: "MUHDIN | FINANCE, BANKING & INSURANCE", key: "c11",
    fn: "Keuangan, bank dan asuransi",
    members: "Profesional perbankan, lembaga keuangan, perusahaan asuransi, mitra pembiayaan dan pengurus bidang keuangan.",
    desc: "Forum kolaborasi keuangan, perbankan dan asuransi MUHDIN. Mengembangkan kemitraan perbankan, sistem pembayaran, pembiayaan usaha, perlindungan risiko, produk asuransi, literasi keuangan dan solusi transaksi yang mendukung keberlanjutan bisnis serta perlindungan jamaah.",
    icon: "coins", eco: 3,
  },
  {
    no: "12", name: "MUHDIN | DIGITAL & DATA TECHNOLOGY", key: "c12",
    fn: "Teknologi dan digitalisasi",
    members: "Praktisi IT, pengembang sistem, ahli digital, pengelola data, keamanan informasi dan pengurus digitalisasi.",
    desc: "Forum transformasi digital dan teknologi informasi MUHDIN. Mengembangkan sistem informasi, digitalisasi organisasi, integrasi data, interoperabilitas, otomatisasi proses, infrastruktur teknologi, keamanan siber dan pelindungan data pribadi untuk mendukung ekosistem haji dan umrah yang modern dan terintegrasi.",
    icon: "brain-circuit", eco: 5,
  },
  {
    no: "13", name: "MUHDIN | ACADEMY & PROFESSIONAL DEVELOPMENT", key: "c13",
    fn: "Pendidikan, pakar dan profesional",
    members: "Akademisi, profesional, konsultan, peneliti, tenaga ahli lintas bidang, instruktur dan pengelola MUHDIN Academy.",
    desc: "Pusat pengembangan ilmu pengetahuan, kompetensi dan profesionalisme MUHDIN. Mengintegrasikan pendidikan, pelatihan, pengembangan SDM, penelitian, kajian industri, inovasi, konsultasi profesional dan pengembangan kompetensi PPIU, PIHK, BPW, KBIHU, tour leader serta tenaga profesional haji dan umrah.",
    icon: "graduation-cap", eco: 5,
  },
  {
    no: "14", name: "MUHDIN | LEGAL, QUALITY & COMPLIANCE", key: "c14",
    fn: "Hukum, mutu dan kepatuhan",
    members: "Advokat, konsultan hukum, praktisi kepatuhan, ahli tata kelola, auditor internal dan pengurus bidang standardisasi.",
    desc: "Forum pengembangan tata kelola, hukum, kepatuhan dan mutu internal MUHDIN. Membahas konsultasi hukum, regulasi, kode etik, manajemen risiko, standardisasi internal, evaluasi kualitas layanan, perlindungan kepentingan organisasi dan peningkatan profesionalisme anggota. Tidak menggantikan kewenangan pengawasan atau akreditasi pemerintah.",
    icon: "scale", eco: 5,
  },
  {
    no: "15", name: "MUHDIN | PILGRIM PROTECTION & CRISIS RESPONSE", key: "c15",
    fn: "Perlindungan dan keadaan darurat jamaah",
    members: "Tim perlindungan jamaah, tenaga kesehatan, koordinator operasional, pengelola pengaduan dan perwakilan PPIU/PIHK yang ditunjuk.",
    desc: "Forum koordinasi perlindungan jamaah dan respons keadaan darurat. Menangani koordinasi pengaduan, gangguan penerbangan, perubahan perjalanan, masalah akomodasi, kesehatan, keselamatan, keadaan darurat dan kepulangan jamaah melalui komunikasi cepat, terstruktur dan bertanggung jawab bersama pihak terkait.",
    icon: "shield-heart", eco: 5,
  },
  {
    no: "16", name: "MUHDIN | MEDIA & PUBLIC RELATIONS", key: "c16",
    fn: "Humas, media dan publikasi",
    members: "Humas, jurnalis, praktisi komunikasi, pengelola media sosial, desain, dokumentasi dan publikasi.",
    desc: "Pusat komunikasi strategis, hubungan media dan publikasi MUHDIN. Mengembangkan identitas merek, hubungan pers, dokumentasi kegiatan, publikasi program, komunikasi publik, pengelolaan media sosial, produksi konten dan reputasi kelembagaan secara profesional, akurat dan konsisten.",
    icon: "megaphone", eco: 5,
  },
  {
    no: "17", name: "MUHDIN | REGIONAL NETWORK", key: "c17",
    fn: "DPW, DPD dan DPC",
    members: "Ketua dan pengurus DPW, DPD, DPC serta koordinator wilayah resmi MUHDIN.",
    desc: "Forum koordinasi jaringan kewilayahan MUHDIN seluruh Indonesia. Menjadi pusat komunikasi, konsolidasi organisasi, pengembangan keanggotaan, pelaksanaan program nasional di daerah, pengembangan kemitraan lokal, pelaporan, evaluasi dan pemerataan pertumbuhan organisasi dari pusat hingga daerah.",
    icon: "map", eco: 6,
  },
];

/* ============================================================ *
 * Pemetaan 15 departemen DPP ke grup (dari keputusan final)
 * ============================================================ */

export const DEPT_MAPPING: { dept: string; groups: string }[] = [
  { dept: "Organisasi, Keanggotaan & Kelembagaan", groups: "02, 03" },
  { dept: "Pembinaan PPIU & Ekosistem Umrah", groups: "04" },
  { dept: "Pembinaan PIHK & Ekosistem Haji Khusus", groups: "04" },
  { dept: "KBIHU, Manasik & Pembinaan Jamaah", groups: "05" },
  { dept: "Hubungan Pemerintah & Antarlembaga", groups: "02" },
  { dept: "Kerja Sama Internasional & Arab Saudi", groups: "06" },
  { dept: "Akomodasi, Katering & Layanan Pendukung", groups: "09" },
  { dept: "Transformasi Digital, Data & Teknologi", groups: "12" },
  { dept: "Pendidikan, Pelatihan & Sertifikasi", groups: "13" },
  { dept: "Standardisasi, Mutu & Pengawasan Internal", groups: "14" },
  { dept: "Perlindungan Jamaah, Pengaduan & Mediasi", groups: "15" },
  { dept: "Pengembangan Usaha, Koperasi & Investasi", groups: "10" },
  { dept: "Penelitian, Kebijakan & Pengembangan Industri", groups: "13" },
  { dept: "Hubungan Masyarakat, Media & Publikasi", groups: "16" },
  { dept: "Sosial, Keagamaan & Pemberdayaan Masyarakat", groups: "13" },
];

/* ============================================================ *
 * Aturan keanggotaan: Primary Membership + Functional Access
 * ============================================================ */

export const MEMBERSHIP_RULES: { profile: string; main: string }[] = [
  { profile: "Dewan dan pimpinan", main: "01" },
  { profile: "Pengurus operasional DPP", main: "02" },
  { profile: "Anggota umum", main: "03" },
  { profile: "Pemilik/pimpinan PPIU dan PIHK", main: "04" },
  { profile: "BPW dan KBIHU", main: "05" },
  { profile: "Mitra Saudi/internasional", main: "06" },
  { profile: "Mitra maskapai", main: "07" },
  { profile: "Mitra visa dan dokumen", main: "08" },
  { profile: "Hotel, katering dan transportasi", main: "09" },
  { profile: "Pengusaha dan investor", main: "10" },
  { profile: "Bank dan asuransi", main: "11" },
  { profile: "Profesional IT", main: "12" },
  { profile: "Akademisi, konsultan dan pakar", main: "13" },
  { profile: "Profesional hukum dan mutu", main: "14" },
  { profile: "Tim perlindungan jamaah", main: "15" },
  { profile: "Media dan humas", main: "16" },
  { profile: "Pengurus wilayah", main: "17" },
];

/* ============================================================ *
 * Koordinator per grup (usulan penanggung jawab fungsi)
 * ============================================================ */

export const COORDINATORS: { no: string; role: string }[] = [
  { no: "00", role: "Sekjen" },
  { no: "01", role: "Ketua Umum" },
  { no: "02", role: "Sekjen" },
  { no: "03", role: "Ketua Departemen Organisasi dan Keanggotaan" },
  { no: "04", role: "Ketua Departemen Pembinaan PPIU/PIHK" },
  { no: "05", role: "Ketua Departemen BPW/KBIHU" },
  { no: "06", role: "Ketua Bidang Kerja Sama Luar Negeri" },
  { no: "07", role: "Ketua Bidang Penerbangan" },
  { no: "08", role: "Ketua Bidang Visa" },
  { no: "09", role: "Ketua Departemen Layanan Pendukung" },
  { no: "10", role: "Ketua Bidang Pengembangan Usaha" },
  { no: "11", role: "Ketua Bidang Keuangan dan Perbankan" },
  { no: "12", role: "Ketua Bidang Digitalisasi" },
  { no: "13", role: "Ketua Departemen Pendidikan dan Pengembangan SDM" },
  { no: "14", role: "Ketua Bidang Hukum dan Legal" },
  { no: "15", role: "Ketua Bidang Perlindungan Jamaah" },
  { no: "16", role: "Ketua Bidang Humas dan Publikasi" },
  { no: "17", role: "Ketua Bidang Organisasi Wilayah" },
];

/* ============================================================ *
 * Rencana implementasi 3 tahap
 * ============================================================ */

export const PHASES = [
  { n: 1, key: "p1", groups: ["00", "01", "02", "03"] },
  { n: 2, key: "p2", groups: ["04", "05", "06", "07", "08", "09"] },
  { n: 3, key: "p3", groups: ["10", "11", "12", "13", "14", "15", "16", "17"] },
] as const;

/** Statistik arsitektur untuk hero. */
export const WA_STATS = {
  total: WA_CHANNELS.length, // 18
  groups: 17,
  announce: 1,
  ecosystems: ECOSYSTEMS.length, // 6
} as const;

/** Statistik per ekosistem (untuk badge hero). */
export const ECO_COUNTS: Record<number, number> = WA_CHANNELS.reduce(
  (acc, c) => {
    acc[c.eco] = (acc[c.eco] ?? 0) + 1;
    return acc;
  },
  {} as Record<number, number>
);
