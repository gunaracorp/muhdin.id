/**
 * org-master.ts — MASTER FINAL RANCANGAN ORGANISASI DPP MUHDIN 2026–2031
 * (Keputusan super final owner — hanya penyempurnaan nama & edit gelar yang menyusul.)
 *
 * Sumber: dokumen resmi owner "MASTER FINAL — RANCANGAN ORGANISASI DPP MUHDIN
 * 2026–2031" (Diupload 2026-11-18). Semua nama ditulis apa adanya; hanya tanda
 * baca gelar yang dirapikan. Status personalia dipertahankan apa adanya sesuai
 * dokumen (Usulan / Menunggu persetujuan / Belum ditetapkan) demi integritas —
 * MUHDIN tidak mengklaim seseorang telah menerima jabatan sebelum ada SK.
 *
 * Dipakai oleh: pengurus-view.tsx, pengurus-detail.tsx, komunitas-view.tsx,
 * sitemap-view.tsx.
 */

/* ============================================================ *
 * 0 — PILLAR KEPIMIMPINAN (dua pilar tertinggi)
 * ============================================================ */

/** Titel profesional Sekretaris Jenderal (keputusan final owner, 2026-11-18). */
export const SEKJEN_TITLES = [
  "Master Polymath",
  "Universal Sage",
  "The Ultimate Problem Solver",
  "Senior Investigative Researcher",
  "National Institutional Architect",
  "Political & Government Relations Analyst",
  "Global Hajj & Umrah Industry Strategist",
] as const;

export const KETUA_UMUM = {
  id: "ketum",
  name: "Bunda Hj. Inna Hadianala, S.E.",
  icon: "star",
  roleKey: "ketum",
} as const;

export const SEKJEN = {
  id: "sekjen",
  name: "H. Gugun Gunara, S.E.",
  icon: "scroll-text",
  roleKey: "sekjen",
  titles: SEKJEN_TITLES,
  /** Deskripsi profesional resmi (dari dokumen master, siap kutip). */
  bio: "Arsitektur organisasi & kelembagaan · Strategi bisnis & pengembangan ekosistem · Transformasi digital & integrasi sistem · Tata kelola, SOP & standar kerja · Konsolidasi organisasi nasional · Model kolaborasi & kemitraan · Pengendalian program strategis DPP.",
} as const;

/* ============================================================ *
 * 1 — STATUS PERSONELIA (apa adanya dari dokumen)
 * ============================================================ */

export type PersonStatus = "USULAN" | "PERLU_KONFIRMASI" | "BELUM_DITETAPKAN" | "TERPASANG";

/** Label i18n key per status — lihat locale org-master.ts (status.<key>). */
export const STATUS_KEYS: Record<PersonStatus, string> = {
  USULAN: "usulan",
  PERLU_KONFIRMASI: "perluKonfirmasi",
  BELUM_DITETAPKAN: "belumDitetapkan",
  TERPASANG: "terpasang",
};

export interface OrgPerson {
  /** Nama lengkap + gelar (apa adanya, tanda baca dirapikan). */
  name: string;
  /** Ruang lingkup / profil singkat (bukan biografi terverifikasi). */
  scope?: string;
  /** Catatan integritas dari dokumen master (opsional). */
  note?: string;
  /** Status penetapan personalia. */
  status: PersonStatus;
}

export interface Council {
  id: string;
  /** Key i18n: orgMaster.council.<id>.* */
  code: string;
  icon: string;
  people: OrgPerson[];
  /** Mandat ringkas — i18n: orgMaster.council.<id>.mandat. */
  mandatKey: string;
}

/* ============================================================ *
 * 2 — EMPAT DEWAN
 * ============================================================ */

export const COUNCILS: Council[] = [
  {
    id: "penasihat",
    code: "DEWAN PENASIHAT",
    icon: "compass",
    mandatKey: "penasihat",
    people: [
      { name: "Dr. H. Anwar Sanusi", scope: "Nasihat strategis & pertimbangan kebijakan", note: "Identitas dicocokkan dengan CV resmi", status: "USULAN" },
      { name: "H. Anshori", scope: "Kesinambungan kelembagaan", note: "Tokoh IPHI — jabatan & wilayah perlu konfirmasi", status: "USULAN" },
      { name: "KH. Umar Effendi", scope: "Nilai keumatan & amanah", note: "Tokoh IPHI — rekam pengabdian diverifikasi", status: "USULAN" },
    ],
  },
  {
    id: "kehormatan",
    code: "DEWAN KEHORMATAN",
    icon: "medal",
    mandatKey: "kehormatan",
    people: [
      { name: "Drs. H. Lukman Hakim Saifuddin", scope: "Moderasi beragama, hubungan antarlembaga", note: "Menteri Agama RI 2014–2019; Waketum MPR RI 2009–2014", status: "USULAN" },
      { name: "Dr. H. Zainut Tauhid Sa'adi, M.Si.", scope: "Kebijakan keagamaan, tata kelola, ekonomi umat", note: "Waketum BAZNAS RI 2026–2031; Wamenag RI 2019–2023", status: "USULAN" },
      { name: "Dr. H. Sandiaga Salahuddin Uno, B.B.A., M.B.A.", scope: "Pariwisata, kewirausahaan, investasi", note: "Menteri Pariwisata & Ekonomi Kreatif RI 2020–2024", status: "USULAN" },
      { name: "Dr. N. Rusmiati, M.Si., M.H.", scope: "Industri perjalanan & jejaring asosiasi", note: "Ketua Umum DPP ASITA (perlu persetujuan pribadi)", status: "USULAN" },
    ],
  },
  {
    id: "pakar",
    code: "DEWAN PAKAR",
    icon: "brain-circuit",
    mandatKey: "pakar",
    people: [
      { name: "Saiful Rahmat Dasuki", scope: "Kebijakan keagamaan, pemerintahan & kelembagaan", note: "Wamenag RI 2023–2024", status: "USULAN" },
      { name: "Dr. H. Khoirizi H. Dasir, S.Sos., M.M.", scope: "Penyelenggaraan haji & kebijakan teknis", note: "Mantan Direktur Bina Haji / Plt. Dirjen PHU — dicocokkan dengan CV", status: "USULAN" },
      { name: "Dr. H. A. Iskandar Zulkarnain, S.E., M.M.", scope: "Keuangan, investasi & tata kelola dana", note: "Anggota BPKH (laporan tahunan BPKH)", status: "USULAN" },
      { name: "Prof. Ir. Teddy Mantoro, M.Sc., Ph.D., SMIEEE", scope: "TI, kecerdasan buatan, keamanan siber & transformasi digital", note: "Guru Besar Ilmu Komputer — doktoral ANU", status: "USULAN" },
      { name: "dr. Fatri Idana, M.Biomed., AAM", scope: "Kesehatan, keselamatan & pelayanan medis jamaah", note: "Kepala UPT Labkesmas Kab. Sumbawa (2026)", status: "USULAN" },
    ],
  },
  {
    id: "pengawas",
    code: "DEWAN PENGAWAS",
    icon: "shield-check",
    mandatKey: "pengawas",
    people: [
      { name: "Drs. H. Arif Rachman Hakim", scope: "Ketua Dewan Pengawas — akuntabilitas & kepatuhan", note: "CV, gelar & persetujuan dikonfirmasi", status: "USULAN" },
      { name: "KH. Qasim Saleh", scope: "Anggota — pengawasan internal", note: "Keterkaitan KBIHU — konfirmasi jabatan", status: "USULAN" },
    ],
  },
];

/* ============================================================ *
 * 3 — PIMPINAN INTI DPP
 * ============================================================ */

export interface LeaderRow {
  /** Key jabatan i18n: orgMaster.leader.<key>. */
  key: string;
  /** Nama orang (string kosong = belum ditetapkan). */
  name: string;
  /** Portofolio (id — proper noun organisasi). */
  portfolio: string;
  icon: string;
  status: PersonStatus;
  /** Catatan profil dari dokumen. */
  note?: string;
}

export const WAKETUM: LeaderRow[] = [
  { key: "waketum1", name: "KH. Qasim Saleh, Lc., M.A.", portfolio: "KBIHU, manasik, pembinaan jamaah & keagamaan", icon: "moon-star", status: "USULAN" },
  { key: "waketum2", name: "H. Anshori", portfolio: "Hubungan kelembagaan & konsolidasi organisasi", icon: "handshake", status: "USULAN", note: "Profil lengkap perlu konfirmasi" },
  { key: "waketum3", name: "Dr. H. Khoirizi H. Dasir, S.Sos., M.M.", portfolio: "Pembinaan haji, kebijakan teknis & pelayanan jamaah", icon: "landmark", status: "USULAN" },
  { key: "waketum4", name: "Dr. H. A. Iskandar Zulkarnain, S.E., M.M.", portfolio: "Keuangan, investasi & pengembangan ekosistem", icon: "coins", status: "USULAN" },
  { key: "waketum5", name: "Dr. H. Heri Solahudin", portfolio: "Pengembangan wilayah, jejaring daerah & konsolidasi regional", icon: "map", status: "PERLU_KONFIRMASI", note: "Nama lengkap & jabatan publik diverifikasi sebelum dicantumkan" },
  { key: "waketum6", name: "Dr. Abdul Manan", portfolio: "Operasional, visa, dokumentasi & layanan penyelenggara", icon: "plane", status: "PERLU_KONFIRMASI", note: "Identitas & CV dilengkapi" },
  { key: "waketum7", name: "Hj. Qonita Lutfiyah, S.E., M.M.", portfolio: "Hubungan politik, kelembagaan, pemberdayaan & aspirasi masyarakat", icon: "megaphone", status: "USULAN", note: "Anggota DPRD Kota Depok (PPP, Dapil 6, 2024–2029)" },
];

export const WASEKJEN: LeaderRow[] = [
  { key: "wasekjen1", name: "Ibu Atik", portfolio: "Administrasi organisasi, koordinasi anggota & sekretariat", icon: "clipboard-list", status: "PERLU_KONFIRMASI", note: "Owner Mumtazmu — ejaan nama lengkap disahkan sebelum SK" },
  { key: "wasekjen2", name: "Gemilang", portfolio: "Koordinasi program, dokumentasi & pelaporan", icon: "file-check", status: "PERLU_KONFIRMASI", note: "Nama lengkap & profil dilengkapi" },
  { key: "wasekjen3", name: "", portfolio: "Data organisasi, digitalisasi administrasi & pengembangan wilayah", icon: "database", status: "BELUM_DITETAPKAN" },
];

export const BENDAHARA: LeaderRow[] = [
  { key: "bemdam", name: "Mirfad Habibi", portfolio: "Kas, anggaran tahunan, laporan keuangan & pengendalian internal", icon: "wallet", status: "PERLU_KONFIRMASI", note: "Direktur Utama Kanomas (per informasi) — nama legal & jabatan terkini diverifikasi" },
  { key: "wabemdam1", name: "Jonaidi, M.Pd.", portfolio: "Administrasi keuangan & pelaporan", icon: "calculator", status: "PERLU_KONFIRMASI", note: "Riwayat pekerjaan dilengkapi" },
  { key: "wabemdam2", name: "", portfolio: "Pengendalian anggaran, pelaporan & administrasi keuangan", icon: "receipt", status: "BELUM_DITETAPKAN" },
];

/* ============================================================ *
 * 4 — 15 BIDANG STRATEGIS DPP
 * ============================================================ */

export interface BidangStrategis {
  /** Nomor bidang 01–15. */
  no: string;
  /** Key i18n: orgMaster.bidang.<key>.title (nama resmi id). */
  key: string;
  icon: string;
  /** Nama resmi bidang (Indonesia — proper noun organisasi). */
  title: string;
  /** Tujuan ringkas (id). */
  tujuan: string;
  /** Nama-nama subbidang (apa adanya dokumen). */
  sub: string[];
  /** Catatan koordinasi strategis (opsional). */
  note?: string;
}

export const BIDANG_STRATEGIS: BidangStrategis[] = [
  { no: "01", key: "b01", icon: "users", title: "Organisasi, Keanggotaan & Kelembagaan", tujuan: "Membangun organisasi nasional yang tertib, terukur, dan memiliki keanggotaan yang valid.", sub: ["Organisasi", "Keanggotaan & Registrasi Anggota", "Kelembagaan & Pengembangan Wilayah (DPW/DPD)", "Pembentukan & Pengembangan DPC", "Administrasi & Tata Kelola Organisasi"] },
  { no: "02", key: "b02", icon: "building", title: "Pembinaan PPIU & Ekosistem Umrah", tujuan: "Pembinaan anggota PPIU, penguatan operasional, kolaborasi antarpenyelenggara, dan kualitas pengalaman jamaah.", sub: ["Pembinaan PPIU", "Pengembangan Ekosistem Umrah", "Pengembangan Usaha Penyelenggara Umrah", "Operasional & Manajemen Perjalanan Umrah", "Pelayanan & Kepuasan Jamaah Umrah"] },
  { no: "03", key: "b03", icon: "landmark", title: "Pembinaan PIHK & Ekosistem Haji Khusus", tujuan: "Pembinaan anggota PIHK, koordinasi ekosistem haji khusus, peningkatan kualitas layanan & kemitraan.", sub: ["Pembinaan PIHK", "Pengembangan Ekosistem Haji Khusus", "Operasional & Manajemen Haji Khusus", "Pelayanan & Kepuasan Jamaah Haji Khusus", "Pengembangan Kemitraan Penyelenggara Haji"] },
  { no: "04", key: "b04", icon: "moon-star", title: "KBIHU, Manasik & Pembinaan Jamaah", tujuan: "Pengembangan kompetensi pembimbing ibadah dan edukasi jamaah.", sub: ["KBIHU", "Manasik & Bimbingan Ibadah", "Pembinaan & Pendampingan Jamaah", "Pengembangan Kompetensi Pembimbing Ibadah", "Edukasi & Literasi Haji Umrah"], note: "Koordinasi strategis: Wakil Ketua Umum I (KH. Qasim Saleh, Lc., M.A.)" },
  { no: "05", key: "b05", icon: "scale", title: "Hubungan Pemerintah & Antarlembaga", tujuan: "Agenda komunikasi pemerintah, pemetaan pemangku kepentingan & advokasi kebijakan.", sub: ["Hubungan Pemerintah", "Hubungan Kementerian & Lembaga Negara", "Hubungan Pemerintah Daerah", "Hubungan Antarorganisasi & Asosiasi", "Advokasi Kebijakan Kelembagaan"] },
  { no: "06", key: "b06", icon: "globe", title: "Kerja Sama Internasional & Arab Saudi", tujuan: "Hubungan internasional, pemetaan mitra Arab Saudi, kerja sama syarikah & jejaring global.", sub: ["Kerja Sama Internasional", "Hubungan & Kemitraan Arab Saudi", "Hubungan Syarikah & Mitra Luar Negeri", "Diplomasi & Kemitraan Global", "Kerja Sama Strategis Internasional"] },
  { no: "07", key: "b07", icon: "plane", title: "Akomodasi, Katering & Layanan Pendukung Jamaah", tujuan: "Mitra layanan, standar kualitas pendukung perjalanan & rantai pasok layanan jamaah.", sub: ["Akomodasi & Perhotelan", "Katering & Konsumsi Jamaah", "Transportasi Darat", "Logistik & Perlengkapan Jamaah", "Pengembangan Mitra Layanan Pendukung", "Penerbangan — Miftah (nama lengkap dikonfirmasi)"] },
  { no: "08", key: "b08", icon: "brain-circuit", title: "Transformasi Digital, Data & Teknologi Informasi", tujuan: "Sistem informasi anggota, digitalisasi sekretariat, integrasi data, keamanan sistem & platform layanan.", sub: ["Transformasi Digital", "Teknologi Informasi & Sistem Informasi", "Integrasi Data & Interoperabilitas Sistem", "Infrastruktur Digital & Pengembangan Platform", "Keamanan Siber", "Pelindungan Data Pribadi & Tata Kelola Data"], note: "Kerja sama potensial dengan Dewan Pakar (Prof. Teddy Mantoro)" },
  { no: "09", key: "b09", icon: "graduation-cap", title: "Pendidikan, Pelatihan & Sertifikasi Kompetensi", tujuan: "Pelatihan, pengembangan kompetensi, kurikulum & program profesionalisme anggota.", sub: ["Pendidikan & Akademik", "Pengembangan MUHDIN Academy", "Pelatihan & Pengembangan SDM", "Sertifikasi & Kompetensi", "Pendidikan Profesional PPIU, PIHK & KBIHU", "Pengembangan Tour Leader & Mutawif"] },
  { no: "10", key: "b10", icon: "badge-check", title: "Standardisasi, Mutu & Pengawasan Internal", tujuan: "Standar internal, evaluasi, pengendalian risiko & kepatuhan — tidak menggantikan kewenangan Dewan Pengawas.", sub: ["Standardisasi & Standar Mutu Organisasi", "Kode Etik & Etika Profesi", "Evaluasi & Peningkatan Mutu Pelayanan", "Audit Internal", "Manajemen Risiko & Kepatuhan", "Tata Kelola & Pengendalian Internal"] },
  { no: "11", key: "b11", icon: "shield-heart", title: "Perlindungan Jamaah, Pengaduan & Mediasi", tujuan: "Mekanisme pengaduan, rujukan penyelesaian sengketa, edukasi hak jamaah & perlindungan konsumen.", sub: ["Perlindungan Jamaah", "Pengaduan & Penanganan Keluhan", "Advokasi Hak Konsumen", "Mediasi & Penyelesaian Sengketa", "Keselamatan & Penanganan Keadaan Darurat", "Pemantauan Kualitas Pelayanan Jamaah"] },
  { no: "12", key: "b12", icon: "briefcase", title: "Pengembangan Usaha, Koperasi & Investasi", tujuan: "Peluang ekonomi anggota, kerja sama bisnis, akses pembiayaan & penguatan rantai pasok — dengan batas jelas dari fungsi perkumpulan.", sub: ["Pengembangan Usaha & Kemitraan", "Koperasi & Ekonomi Anggota", "Investasi & Pembiayaan", "Pengadaan & Rantai Pasok", "Pengembangan Bisnis Ekosistem Haji Umrah", "Kemitraan Strategis & Komersial"] },
  { no: "13", key: "b13", icon: "microscope", title: "Penelitian, Kebijakan & Pengembangan Industri", tujuan: "Riset industri, kajian kebijakan, pemetaan kebutuhan anggota, statistik & publikasi rekomendasi.", sub: ["Penelitian & Kajian Strategis", "Kajian Kebijakan & Regulasi Industri", "Statistik & Analisis Data Industri", "Riset & Pengembangan Ekosistem", "Inovasi & Pengembangan Industri", "Dokumentasi & Publikasi Hasil Penelitian"] },
  { no: "14", key: "b14", icon: "megaphone", title: "Hubungan Masyarakat, Media & Publikasi", tujuan: "Komunikasi resmi, publikasi, dokumentasi kegiatan, reputasi & komunikasi krisis.", sub: ["Hubungan Masyarakat", "Media & Hubungan Pers", "Publikasi & Dokumentasi", "Komunikasi Strategis", "Branding & Reputasi Kelembagaan", "Informasi & Komunikasi Publik"] },
  { no: "15", key: "b15", icon: "heart-handshake", title: "Sosial, Keagamaan & Pemberdayaan Masyarakat", tujuan: "Program sosial, dakwah, pemberdayaan, pelayanan masyarakat & kegiatan kemanusiaan.", sub: ["Sosial & Kemanusiaan", "Keagamaan & Dakwah", "Pemberdayaan Masyarakat", "Pengabdian & Pelayanan Masyarakat", "Kepedulian & Bantuan Sosial", "Pembinaan Spiritual & Karakter"] },
];

/* ============================================================ *
 * 5 — TIGA BIDANG KHUSUS
 * ============================================================ */

export interface BidangKhusus {
  no: string;
  key: string;
  icon: string;
  title: string;
  ketua: string;
  ketuaNote?: string;
  sub: string[];
  /** Keluaran wajib. */
  out: string[];
}

export const BIDANG_KHUSUS: BidangKhusus[] = [
  {
    no: "K1", key: "k1", icon: "scale",
    title: "Hukum, Legal, Regulasi, Perizinan & Advokasi",
    ketua: "Mayor Art. (Purn.) Cecep Sumarno, S.I.P., S.H.",
    ketuaNote: "Identitas, gelar & kesediaan dikonfirmasi langsung",
    sub: ["Hukum & perundang-undangan", "Legalitas & kelembagaan", "Regulasi haji & umrah", "Perizinan & kepatuhan usaha", "Advokasi & pendampingan hukum", "Kontrak & kerja sama kelembagaan"],
    out: ["Kajian legal organisasi", "Pedoman kontrak & kerja sama", "Matriks kepatuhan", "SOP penanganan persoalan hukum", "Kajian regulasi haji & umrah", "Pendampingan hukum sesuai kewenangan"],
  },
  {
    no: "K2", key: "k2", icon: "coins",
    title: "Keuangan, Perbankan & Sistem Pembayaran",
    ketua: "Mirza",
    ketuaNote: "Nama lengkap, gelar & jabatan terakhir (mantan Panin) belum terkonfirmasi",
    sub: ["Hubungan perbankan", "Sistem pembayaran & transaksi digital", "Manajemen keuangan", "Literasi & inklusi keuangan", "Pembiayaan ekosistem haji & umrah", "Tata kelola & transparansi keuangan"],
    out: ["Pemetaan mitra perbankan", "Kajian sistem pembayaran", "Rekomendasi pembiayaan", "Edukasi keuangan", "Kebijakan transparansi"],
  },
  {
    no: "K3", key: "k3", icon: "heart-pulse",
    title: "Kesehatan, Keselamatan & Pelayanan Medis Jamaah",
    ketua: "dr. Fatri Idana, M.Biomed., AAM",
    ketuaNote: "Kepala UPT Labkesmas Kab. Sumbawa (2026) — penugasan perlu persetujuan",
    sub: ["Pelayanan kesehatan jamaah", "Edukasi kesehatan & kebugaran", "Kesehatan pra-keberangkatan", "Pendampingan medis jamaah", "Keselamatan & kedaruratan medis", "Kemitraan rumah sakit & fasilitas kesehatan"],
    out: ["Panduan edukasi kesehatan", "Protokol rujukan", "Peta fasilitas kesehatan", "SOP koordinasi darurat", "Program edukasi jamaah"],
  },
];

/* ============================================================ *
 * 6 — PERSONALIA TAMBAHAN (kandidat konsolidasi)
 * ============================================================ */

export const PERSONALIA_TAMBAHAN: { name: string; info: string; action: string }[] = [
  { name: "Farid Al Jawi", info: "Pernah diusulkan untuk organisasi & keanggotaan", action: "Konfirmasi nama lengkap, CV & kesediaan" },
  { name: "Habib Suarif", info: "Pernah diusulkan untuk hubungan internasional & Arab Saudi", action: "Konfirmasi identitas & pengalaman" },
  { name: "Miftah", info: "Diusulkan untuk bidang penerbangan", action: "Lengkapi nama lengkap, perusahaan & pengalaman" },
  { name: "Gemilang", info: "Diusulkan sebagai Wasekjen", action: "Lengkapi nama lengkap & profil" },
  { name: "Atik / Ati", info: "Owner Mumtazmu", action: "Pastikan ejaan nama & profil" },
  { name: "Mirza", info: "Mantan Panin", action: "Lengkapi identitas & riwayat jabatan" },
  { name: "Cecep Sumarno", info: "Ketua Bidang Hukum (usulan)", action: "Verifikasi nama, gelar, profesi & persetujuan" },
  { name: "Abdul Manan", info: "Waketum VI (usulan)", action: "Lengkapi nama & rekam jejak" },
  { name: "Pak Wawan", info: "Nama muncul dalam pembahasan", action: "Belum ditempatkan" },
  { name: "Pak Dian", info: "Konsolidasi Jawa Barat", action: "Konfirmasi nama lengkap & jabatan" },
  { name: "Perwakilan Milenial Jawa Barat", info: "Usulan representasi generasi muda", action: "Menunggu nama" },
  { name: "Ahmad", info: "Nama disebut tanpa identitas lengkap", action: "Perlu identifikasi" },
  { name: "Jonaidi, M.Pd.", info: "Wakil Bendahara Umum I", action: "Lengkapi profil profesional" },
  { name: "Mirfad Habibi", info: "Bendahara Umum — Direktur Utama Kanomas (per informasi)", action: "Verifikasi nama legal & jabatan" },
];

/* ============================================================ *
 * 7 — REGISTER 38 DPW (38 provinsi Indonesia)
 * ============================================================ */

export interface DpwRow { no: number; provinsi: string; ibuKota: string }

export const DPW_38: DpwRow[] = [
  { no: 1, provinsi: "Aceh", ibuKota: "Banda Aceh" },
  { no: 2, provinsi: "Sumatera Utara", ibuKota: "Medan" },
  { no: 3, provinsi: "Sumatera Barat", ibuKota: "Padang" },
  { no: 4, provinsi: "Riau", ibuKota: "Pekanbaru" },
  { no: 5, provinsi: "Jambi", ibuKota: "Jambi" },
  { no: 6, provinsi: "Sumatera Selatan", ibuKota: "Palembang" },
  { no: 7, provinsi: "Bengkulu", ibuKota: "Bengkulu" },
  { no: 8, provinsi: "Lampung", ibuKota: "Bandar Lampung" },
  { no: 9, provinsi: "Kepulauan Bangka Belitung", ibuKota: "Pangkalpinang" },
  { no: 10, provinsi: "Kepulauan Riau", ibuKota: "Tanjungpinang" },
  { no: 11, provinsi: "Daerah Khusus Jakarta", ibuKota: "Jakarta" },
  { no: 12, provinsi: "Jawa Barat", ibuKota: "Bandung" },
  { no: 13, provinsi: "Jawa Tengah", ibuKota: "Semarang" },
  { no: 14, provinsi: "Daerah Istimewa Yogyakarta", ibuKota: "Yogyakarta" },
  { no: 15, provinsi: "Jawa Timur", ibuKota: "Surabaya" },
  { no: 16, provinsi: "Banten", ibuKota: "Serang" },
  { no: 17, provinsi: "Bali", ibuKota: "Denpasar" },
  { no: 18, provinsi: "Nusa Tenggara Barat", ibuKota: "Mataram" },
  { no: 19, provinsi: "Nusa Tenggara Timur", ibuKota: "Kupang" },
  { no: 20, provinsi: "Kalimantan Barat", ibuKota: "Pontianak" },
  { no: 21, provinsi: "Kalimantan Tengah", ibuKota: "Palangka Raya" },
  { no: 22, provinsi: "Kalimantan Selatan", ibuKota: "Banjarbaru" },
  { no: 23, provinsi: "Kalimantan Timur", ibuKota: "Samarinda" },
  { no: 24, provinsi: "Kalimantan Utara", ibuKota: "Tanjung Selor" },
  { no: 25, provinsi: "Sulawesi Utara", ibuKota: "Manado" },
  { no: 26, provinsi: "Sulawesi Tengah", ibuKota: "Palu" },
  { no: 27, provinsi: "Sulawesi Selatan", ibuKota: "Makassar" },
  { no: 28, provinsi: "Sulawesi Tenggara", ibuKota: "Kendari" },
  { no: 29, provinsi: "Gorontalo", ibuKota: "Gorontalo" },
  { no: 30, provinsi: "Sulawesi Barat", ibuKota: "Mamuju" },
  { no: 31, provinsi: "Maluku", ibuKota: "Ambon" },
  { no: 32, provinsi: "Maluku Utara", ibuKota: "Sofifi" },
  { no: 33, provinsi: "Papua Barat", ibuKota: "Manokwari" },
  { no: 34, provinsi: "Papua Barat Daya", ibuKota: "Sorong" },
  { no: 35, provinsi: "Papua", ibuKota: "Jayapura" },
  { no: 36, provinsi: "Papua Selatan", ibuKota: "Merauke" },
  { no: 37, provinsi: "Papua Tengah", ibuKota: "Nabire" },
  { no: 38, provinsi: "Papua Pegunungan", ibuKota: "Wamena" },
];

/** Struktur standar setiap DPW (13 fungsi). */
export const DPW_STRUKTUR = [
  "Ketua DPW", "Wakil Ketua DPW I", "Wakil Ketua DPW II", "Sekretaris DPW", "Bendahara DPW",
  "Bidang Organisasi & Keanggotaan", "Bidang PPIU & PIHK", "Bidang KBIHU, Manasik & Pembinaan Jamaah",
  "Bidang Hubungan Pemerintah & Kelembagaan", "Bidang Kemitraan & Pengembangan Usaha",
  "Bidang Digitalisasi & Komunikasi", "Bidang Hukum, Advokasi & Perlindungan Jamaah",
  "Bidang Pendidikan, Pelatihan & SDM",
] as const;

/* ============================================================ *
 * 8 — STANDAR KERJA PENGURUS (5 unsur + siklus + KPI)
 * ============================================================ */

export const WORK_STANDARDS = {
  unsur: ["mandat", "wewenang", "keluaran", "indikator", "akuntabilitas"] as const,
  siklus: [
    { freqKey: "mingguan", kegiatanKey: "mingguan", outKey: "mingguan" },
    { freqKey: "bulanan", kegiatanKey: "bulanan", outKey: "bulanan" },
    { freqKey: "triwulan", kegiatanKey: "triwulan", outKey: "triwulan" },
    { freqKey: "semester", kegiatanKey: "semester", outKey: "semester" },
    { freqKey: "tahunan", kegiatanKey: "tahunan", outKey: "tahunan" },
  ],
  kpi: 11, // jumlah KPI di locale (kpi.1 … kpi.11)
} as const;

/* ============================================================ *
 * 9 — STATISTIK RINGKAS (hero)
 * ============================================================ */

export const ORG_STATS = {
  dewans: COUNCILS.length,
  councilPeople: COUNCILS.reduce((n, c) => n + c.people.length, 0),
  waketum: WAKETUM.length,
  wasekjen: WASEKJEN.length,
  bendahara: BENDAHARA.length,
  bidangStrategis: BIDANG_STRATEGIS.length,
  bidangKhusus: BIDANG_KHUSUS.length,
  dpw: DPW_38.length,
  dppDept: 15, // departemen strategis DPP yang dipetakan ke grup WA
} as const;
