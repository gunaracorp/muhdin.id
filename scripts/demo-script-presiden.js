/**
 * Task 9 — Naskah Demo 5 Menit MUHDIN INDONESIA untuk Presiden RI
 * Scene: copywriting (spoken-delivery script) — no cover, no TOC, single section.
 * Font profile B (Visual): Calibri ascii / Microsoft YaHei eastAsia.
 * Line spacing: 400 (scene override). Palette: clean + MUHDIN deep-green accent.
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, AlignmentType, HeadingLevel, WidthType,
  BorderStyle, ShadingType, LevelFormat,
} = require("docx");
const fs = require("fs");

// ---------- Palette (clean, brand-aligned) ----------
const P = {
  primary: "14532D",   // deep green — headings
  body: "1F2937",      // near-black body
  secondary: "6B7280", // grey notes
  accent: "166534",    // green-800 — key highlights
  gold: "B45309",      // amber-700 — time chips
  lightFill: "F0FDF4", // green-50 — table header fill
  metaFill: "F9FAFB",  // grey-50 — meta strip fill
  line: "D1D5DB",      // border grey
};

const FONT = { ascii: "Calibri", eastAsia: "Microsoft YaHei" };

// ---------- Builders ----------
function title(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 80, line: 460, lineRule: "atLeast" },
    children: [new TextRun({ text, bold: true, size: 36, color: P.primary, font: FONT })],
  });
}

function subtitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 60, line: 400 },
    children: [new TextRun({ text, size: 22, color: P.secondary, font: FONT })],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 420, after: 160, line: 400 },
    children: [new TextRun({ text, bold: true, size: 30, color: P.primary, font: FONT })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 340, after: 100, line: 400 },
    children: [new TextRun({ text, bold: true, size: 26, color: P.primary, font: FONT })],
  });
}

// body paragraph from mixed runs
function para(runs, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { before: opts.before ?? 120, after: opts.after ?? 120, line: 400 },
    indent: opts.indent,
    keepNext: opts.keepNext,
    children: runs.map((r) =>
      new TextRun({
        text: r.t,
        bold: !!r.b,
        italics: !!r.i,
        size: r.s || 24,
        color: r.c || P.body,
        font: FONT,
      })
    ),
  });
}

// spoken text paragraph (12pt, line 400)
function speak(runs, opts = {}) {
  return para(runs, { ...opts, after: 160 });
}

// stage direction (grey italic, small)
function aksi(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 60, after: 120, line: 360 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: "AKSI DEMONSTRATOR  ", bold: true, size: 20, color: P.gold, font: FONT }),
      new TextRun({ text, italics: true, size: 21, color: P.secondary, font: FONT }),
    ],
  });
}

// rhythm marker (grey italic tiny)
function marker(text) {
  return new Paragraph({
    spacing: { before: 40, after: 40, line: 320 },
    indent: { left: 360 },
    children: [new TextRun({ text, italics: true, size: 20, color: "999999", font: FONT })],
  });
}

const cellMargins = { top: 80, bottom: 80, left: 140, right: 140 };

function cell(text, opts = {}) {
  return new TableCell({
    width: { size: opts.w, type: WidthType.PERCENTAGE },
    shading: opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill } : undefined,
    margins: cellMargins,
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      spacing: { line: 320 },
      children: [new TextRun({ text, bold: !!opts.b, size: opts.s || 21, color: opts.c || P.body, font: FONT })],
    })],
  });
}

function makeTable(headerCells, rows, widths) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: P.primary },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: P.primary },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: P.line },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: headerCells.map((t, i) => cell(t, { w: widths[i], b: true, fill: P.lightFill, c: P.primary })),
      }),
      ...rows.map((r) => new TableRow({
        cantSplit: true,
        children: r.map((t, i) => cell(t, { w: widths[i] })),
      })),
    ],
  });
}

// ---------- Content ----------
const children = [];

// Title block
children.push(title("NASKAH DEMO 5 MENIT"));
children.push(subtitle("Portal MUHDIN INDONESIA \u2014 Demonstrasi Ekosistem Haji & Umrah Digital"));
children.push(subtitle("Untuk Kunjungan Kehormatan Presiden Republik Indonesia"));

// 1. RINGKASAN EKSEKUSI
children.push(h1("1. RINGKASAN EKSEKUSI"));
children.push(para([
  { t: "Naskah ini dirancang untuk demonstrasi langsung portal MUHDIN INDONESIA di hadapan Presiden RI dengan durasi ketat lima menit. Struktur dibagi menjadi " },
  { t: "delapan segmen", b: true, c: P.accent },
  { t: " yang mengikuti urutan halaman persis seperti yang akan ditampilkan di layar. Setiap segmen memuat dua komponen: baris AKSI DEMONSTRATOR (gerakan di layar) dan teks BICARA (kalimat yang diucapkan, total sekitar 700 kata atau kecepatan bicara formal 140 kata per menit). Seluruh angka dan klaim dalam naskah diambil dari konten portal yang sesungguhnya sehingga aman dari inkonsistensi saat ditanya balik." },
]));
children.push(makeTable(
  ["Komponen", "Keterangan"],
  [
    ["Durasi total", "5 menit (8 segmen, rata-rata 35\u201345 detik per segmen)"],
    ["Audiens", "Presiden RI dan rombongan pendamping"],
    ["Halaman yang didemokan", "Beranda \u2192 Ekosistem 13 Layanan \u2192 Kepercayaan \u2192 Direktori Anggota \u2192 Admin CMS \u2192 Penutup"],
    ["Pesan kunci tunggal", "\u201CEkosistem umrah\u2013haji digital pertama Indonesia: satu jaringan kepercayaan yang benar-benar dikelola\u201D"],
    ["Prasyarat", "Server hidup (HTTP 200), dua tab browser siap: Tab 1 beranda, Tab 2 admin sudah login"],
  ],
  [28, 72]
));

// 2. PERSIAPAN
children.push(h1("2. PERSIAPAN 30 MENIT SEBELUM DEMO"));
children.push(para([
  { t: "Persiapan teknis menentukan 80 persen keberhasilan demo. Kerjakan daftar periksa berikut secara berurutan dan centang satu per satu; jangan melewati satu langkah pun meskipun terasa sederhana. Jika salah satu langkah gagal, selesaikan dulu sebelum melanjutkan karena kegagalan terkecil di depan layar besar akan memakan waktu yang paling berharga." },
], { keepNext: true }));
const prepSteps = [
  "Hidupkan server portal dan pastikan beranda merespons (perintah: bash scripts/dev-keep.sh, lalu cek HTTP 200).",
  "Buka Tab 1: beranda, mode layar penuh (F11), zoom 100 persen, scroll paling atas.",
  "Buka Tab 2: halaman admin dalam keadaan SUDAH LOGIN. Jangan pernah mengetik kata sandi di depan Presiden.",
  "Pastikan strip waktu Makkah yang hidup (live) tampil di beranda \u2014 ini detail kecil yang berkesan.",
  "Pilih satu kartu anggota terverifikasi dengan profil terlengkap untuk dibuka di Segmen 6.",
  "Aktifkan mode jangan ganggu (Do Not Disturb) di perangkat; matikan semua notifikasi.",
  "Uji koneksi internet; siapkan titik hotspot cadangan dan rekaman video 5 menit sebagai pengganti jika jaringan mati.",
  "Latihan penuh dua kali dengan stopwatch; pastikan total bicara maksimal 5 menit 15 detik.",
];
prepSteps.forEach((s, i) => {
  children.push(new Paragraph({
    numbering: { reference: "prep-list", level: 0 },
    spacing: { before: 40, after: 40, line: 380 },
    children: [new TextRun({ text: s, size: 23, color: P.body, font: FONT })],
  }));
});

// 3. PETA ALUR
children.push(h1("3. PETA ALUR DEMO (URUTAN HALAMAN)"));
children.push(para([
  { t: "Tabel berikut adalah peta jalan demonstrator. Angka waktu bersifat ketat: jika satu segmen molor, potong bagian dari segmen berikutnya, jangan dari penutup. Kalau waktu tinggal 30 detik dan demo belum sampai Segmen 7, langsung lompat ke Segmen 8 \u2014 penutup adalah bagian yang paling diingat Presiden." },
], { keepNext: true }));
children.push(makeTable(
  ["No", "Waktu", "Halaman / Rute", "Pesan Kunci"],
  [
    ["1", "0:00\u20130:35", "Beranda \u2014 Hero (#/)", "Identitas, skala, dan alur ekosistem 5 aktor"],
    ["2", "0:35\u20131:10", "Beranda \u2014 The Idea", "Empat pilar: Connect, Verify, Collaborate, Integrate"],
    ["3", "1:10\u20131:50", "Beranda \u2014 Verified & Keanggotaan", "Lencana verifikasi; keanggotaan 100% gratis"],
    ["4", "1:50\u20132:30", "Menu 13 Layanan Bisnis", "Kedalaman layanan end-to-end satu pintu"],
    ["5", "2:30\u20133:05", "Kepercayaan \u2014 Transparansi", "Tata kelola, UU PDP, dewan etik, jalur darurat"],
    ["6", "3:05\u20133:50", "Direktori Anggota + profil", "Jaringan 30+ provinsi terverifikasi"],
    ["7", "3:50\u20134:35", "Admin CMS (#/admin)", "Control tower: portal hidup yang dikelola"],
    ["8", "4:35\u20135:00", "Beranda \u2014 One Record & Penutup", "Visi, permohonan arahan dan dukungan"],
  ],
  [7, 15, 38, 40]
));

// 4. NASKAH
children.push(h1("4. NASKAH DEMO \u2014 SEGMENTASI LENGKAP"));

// Segment 1
children.push(h2("Segmen 1 \u00B7 0:00\u20130:35 \u00B7 Beranda \u2014 Hero"));
children.push(aksi("Tab 1 sudah terbuka layar penuh pada hero beranda. Diamkan dua detik agar gambar Kabah tampil sempurna sebelum bicara. Tangan jangan menyentuh mouse."));
children.push(speak([
  { t: "Assalamualaikum warahmatullahi wabarakatuh. Bapak Presiden yang kami hormati, izinkan kami memperkenalkan " },
  { t: "MUHDIN INDONESIA", b: true, c: P.accent },
  { t: " \u2014 ekosistem umrah dan haji digital pertama di Indonesia. Yang Bapak lihat adalah beranda portal kami: satu pintu yang menghubungkan seluruh perjalanan ibadah, dari Indonesia melalui MUHDIN dan penyelenggara perjalanan, menuju mitra layanan di Tanah Suci, hingga sampai kepada jamaah. Portal ini dibangun dalam tiga bahasa \u2014 Indonesia, Inggris, dan Arab \u2014 siap melayani jamaah di dalam negeri sekaligus mitra internasional." },
]));
children.push(marker("[Jeda 1 detik setelah \u201Cekosistem umrah dan haji digital pertama di Indonesia\u201D \u2014 biarkan pesan utama duduk]"));

// Segment 2
children.push(h2("Segmen 2 \u00B7 0:35\u20131:10 \u00B7 Beranda \u2014 The Idea (Empat Pilar)"));
children.push(aksi("Scroll perlahan (satu kali gerakan halus) ke bagian THE IDEA \u2014 SATU EKOSISTEM UNTUK PERJALANAN YANG TERHUBUNG. Berhenti tepat agar empat kartu pilar terlihat lengkap."));
children.push(speak([
  { t: "Ekosistem haji dan umrah melibatkan banyak pihak yang selama ini berjalan sendiri-sendiri. Kami menyatukannya di atas empat pilar. " },
  { t: "Connect", b: true, c: P.accent },
  { t: " \u2014 menghubungkan pelaku ekosistem yang relevan satu sama lain. " },
  { t: "Verify", b: true, c: P.accent },
  { t: " \u2014 memastikan identitas dan dokumen diperiksa sebelum ada kerja sama. " },
  { t: "Collaborate", b: true, c: P.accent },
  { t: " \u2014 memfasilitasi kemitraan bisnis antaranggota. Dan " },
  { t: "Integrate", b: true, c: P.accent },
  { t: " \u2014 menyiapkan seluruh jaringan menuju sistem operasional digital MHUTU. Satu ekosistem, satu jaringan kepercayaan." },
]));

// Segment 3
children.push(h2("Segmen 3 \u00B7 1:10\u20131:50 \u00B7 Beranda \u2014 MUHDIN Verified & Keanggotaan"));
children.push(aksi("Scroll ke bagian MUHDIN VERIFIED \u2014 KENALI MITRA. VERIFIKASI SEBELUM BERTRANSAKSI. Tahan di kolom \u201CBUKAN\u201D selama kalimat tentang bukan izin pemerintah diucapkan, lalu lanjut scroll ke bagian keanggotaan sampai strip GRATIS terlihat."));
children.push(speak([
  { t: "Inilah kunci kepercayaan kami: " },
  { t: "MUHDIN Verified", b: true, c: P.accent },
  { t: ". Setiap organisasi dan penyedia layanan diperiksa identitas dan dokumennya sebelum mendapat lencana verifikasi. Dan kami jujur menuliskannya di sini: MUHDIN Verified bukan izin pemerintah dan bukan penggantinya \u2014 kami melengkapi regulasi negara, bukan menyalahinya. Yang istimewa, keanggotaan MUHDIN sepenuhnya gratis: tanpa biaya pendaftaran, tanpa iuran. Dua belas kategori pelaku ekosistem, dari penyelenggara perjalanan, hotel, transportasi, hingga profesional teknologi, diterima dengan standar kepercayaan yang sama." },
]));
children.push(marker("[Tekankan kata \u201Cgratis\u201D dengan intonasi turun-naik \u2014 biasanya memancing reaksi positif pendamping]"));

// Segment 4
children.push(h2("Segmen 4 \u00B7 1:50\u20132:30 \u00B7 Menu Utama \u2014 13 Layanan Bisnis"));
children.push(aksi("Arahkan kursor ke menu PERIZINAN hingga dropdown turun, tunjukkan lima detik, tutup. Lalu buka halaman Ekosistem (#/ekosistem) yang memuat 13 layanan bisnis. Jangan buka lebih dari dua dropdown \u2014 hemat waktu."));
children.push(speak([
  { t: "Dari menu utama, Bapak dapat melihat kedalaman layanan kami. Tiga belas layanan bisnis dalam satu pintu: perizinan lima jenis mulai dari IATA, PT, PT BPW, PPIU, hingga PIHK; sertifikasi tiga peran tenaga ibadah \u2014 tour leader, tour guide, dan muthowif; pengurusan paspor beserta empat jenis visa umrah, ziyarah, amil, dan haji; transportasi mulai dari bus, GMC, hingga kereta cepat; serta layanan vaksin perjalanan. Setiap layanan memiliki halaman lengkap berisi persyaratan dan prosedur. Jamaah tidak perlu lagi mengejar informasi yang tercecer \u2014 semuanya sudah satu pintu." },
]));

// Segment 5
children.push(h2("Segmen 5 \u00B7 2:30\u20133:05 \u00B7 Menu KEPERCAYAAN \u2014 Transparansi"));
children.push(aksi("Buka dropdown KEPERCAYAAN, klik TRANSPARANSI. Berhenti di bagian indikator transparansi. Bicara tenang \u2014 segmen ini yang paling menarik perhatian pejabat pendamping."));
children.push(speak([
  { t: "Menu Kepercayaan adalah infrastruktur tata kelola kami: regulasi, transparansi, dewan etik, perlindungan data pribadi sesuai " },
  { t: "Undang-Undang PDP", b: true, c: P.accent },
  { t: ", dan jalur darurat jamaah yang siaga. Data jamaah dilindungi dengan kontrol akses berlapis, setiap aktivitas admin meninggalkan jejak audit, dan setiap keluhan jamaah tercatat sampai selesai ditangani. Kepercayaan bukan slogan di halaman depan \u2014 ia dirancang di dalam sistem." },
]));

// Segment 6
children.push(h2("Segmen 6 \u00B7 3:05\u20133:50 \u00B7 Direktori Anggota + Profil"));
children.push(aksi("Klik menu DIREKTORI ANGGOTA. Setelah daftar tampil, klik satu kartu anggota terverifikasi yang sudah disiapkan. Biarkan profil terbuka saat kalimat terakhir diucapkan."));
children.push(speak([
  { t: "Ini direktori anggota kami \u2014 jaringan pelaku ekosistem lintas lebih dari tiga puluh provinsi. Setiap anggota memiliki profil lengkap: izin usaha, penilaian layanan, dan lencana MUHDIN Verified. Saya buka satu contoh \u2014 Bapak melihat profil paspor pasokan (supply passport): identitas, kategori layanan, kapasitas, dokumen, dan status verifikasi dalam satu halaman. Prinsip kami satu kalimat: " },
  { t: "\u201CNo proof, no trusted inventory\u201D", b: true, c: P.accent },
  { t: " \u2014 tanpa bukti, tidak ada inventaris yang layak dipercaya." },
]));

// Segment 7
children.push(h2("Segmen 7 \u00B7 3:50\u20134:35 \u00B7 Admin CMS \u2014 Control Tower"));
children.push(aksi("Beralih ke Tab 2 (admin sudah login). Tampilkan dashboard beberapa detik, klik satu modul (misalnya kelola konten atau anggota), tunjukkan antarmuka penyuntingan, jangan mengubah apa pun. Kembali ke dashboard."));
children.push(speak([
  { t: "Dan inilah yang membuat MUHDIN lebih dari sekadar situs: " },
  { t: "control tower", b: true, c: P.accent },
  { t: " atau piring kendali. Panel admin kami mengelola seluruh isi portal secara langsung \u2014 konten halaman, berita, agenda, galeri, keanggotaan, hingga pengaduan jamaah dan jejak audit. Apa pun yang tim kami ketik di panel ini, langsung tampil di portal yang baru saja Bapak lihat. Artinya portal ini hidup: dikelola setiap hari oleh tim kami, dengan catatan audit yang dapat diperiksa kapan pun oleh siapa pun yang diberi wewenang." },
]));
children.push(marker("[Jangan tunjukkan nama akun, kata sandi, atau alamat surel di layar \u2014 cukup dashboard dan satu modul]"));

// Segment 8
children.push(h2("Segmen 8 \u00B7 4:35\u20135:00 \u00B7 Beranda \u2014 One Record & Penutup"));
children.push(aksi("Kembali ke Tab 1, scroll ke bagian ONE PILGRIM ONE JOURNEY ONE RECORD, lalu diamkan layar di ajakan terakhir. Tangan dilepaskan dari mouse. Bungkukkan sedikit kepala pada kalimat permohonan arahan."));
children.push(speak([
  { t: "Terakhir, inilah prinsip yang kami perjuangkan: " },
  { t: "one pilgrim, one journey, one record", b: true, c: P.accent },
  { t: " \u2014 satu jamaah, satu perjalanan, satu catatan utuh dari pendaftaran hingga kepulangan di tanah air. Bapak Presiden, MUHDIN Indonesia siap menjadi mitra negara dalam menjaga keselamatan, kenyamanan, dan martabat jamaah Indonesia. Kami memohon arahan dan dukungan Bapak agar ekosistem ini dapat melayani lebih banyak jamaah dari seluruh pelosok negeri. Atas kehadiran dan perhatian Bapak, kami haturkan terima kasih. Wassalamualaikum warahmatullahi wabarakatuh." },
]));

// 5. ANTISIPASI PERTANYAAN
children.push(h1("5. ANTISIPASI PERTANYAAN PRESIDEN"));
children.push(para([
  { t: "Jika Presiden atau menteri pendamping mengajukan pertanyaan setelah demo, jawab dengan struktur satu kalimat inti plus satu kalimat penjelas \u2014 tidak lebih. Jawaban yang terlalu panjang justru melemahkan posisi. Empat pertanyaan berikut adalah yang paling mungkin muncul berdasarkan materi yang ditampilkan." },
], { keepNext: true }));
children.push(makeTable(
  ["Pertanyaan", "Jawaban Inti"],
  [
    ["Apa bedanya MUHDIN dengan sistem pemerintah yang sudah ada?",
     "MUHDIN adalah asosiasi ekosistem pelaku industri yang melengkapi, bukan menggantikan, peran negara. MUHDIN Verified secara eksplisit bukan izin pemerintah \u2014 posisi kami jelas dan tertulis di portal."],
    ["Bagaimana keamanan data jamaah?",
     "Kami mematuhi Undang-Undang Pelindungan Data Pribadi: kontrol akses berlapis per peran, jejak audit seluruh aktivitas admin, dan jalur pengaduan yang tercatat sampai tuntas."],
    ["Bagaimana model pendanaannya?",
     "Keanggotaan sepenuhnya gratis bagi semua kategori anggota. Pendanaan operasional bersumber dari kemitraan strategis yang disepakati secara khusus, bukan dari pungutan anggota."],
    ["Kapan implementasi nasionalnya?",
     "Kampanye Founding Ecosystem 2026 sedang merekrut seratus organisasi dan profesional pertama sebagai fondasi, dengan peta jalan bertahap menuju 2030."],
    ["Apa hubungan MUHDIN dengan MHUTU?",
     "MUHDIN membangun jaringan dan kepercayaan; MHUTU membangun sistem operasional digitalnya. Keduanya dirancang saling terhubung sejak awal."],
  ],
  [38, 62]
));

// 6. ATURAN EMAS
children.push(h1("6. ATURAN EMAS & RENCANA CADANGAN"));
children.push(para([
  { t: "Tiga aturan emas saat tampil. " },
  { t: "Pertama", b: true },
  { t: ", jangan pernah mengetik apa pun yang memuat kredensial di depan Presiden \u2014 halaman admin harus dibuka dalam keadaan sudah masuk. " },
  { t: "Kedua", b: true },
  { t: ", gerakan scroll harus pelan dan selalu berhenti sebelum bicara; layar yang terus bergerak membuat audiens membaca alih-alih mendengarkan. " },
  { t: "Ketiga", b: true },
  { t: ", patuhi angka waktu di peta alur: bila waktu mepet, pangkas isi Segmen 4 (cukup sebut tanpa membuka dropdown) dan jangan pernah memangkas penutup." },
]));
children.push(para([
  { t: "Rencana cadangan bila teknologi berkhianat. Bila beranda gagal dimuat, muat ulang satu kali dengan tenang sambil melanjutkan narasi; bila tetap gagal, beralih ke rekaman video cadangan yang sudah disiapkan dan sampaikan kalimat penjembatan: \u201CUntuk memastikan tampilan paling mulus, izinkan kami menunjukkan rekaman langsung dari portal yang sama.\u201D Bila koneksi mati total, gunakan hotspot pribadi. Apa pun yang terjadi, jangan minta maaf berlebihan \u2014 satu kalimat penjembatan yang tenang jauh lebih profesional daripada berkali-kali meminta maaf." },
]));
children.push(para([
  { t: "Catatan penyusunan: seluruh klaim angka dalam naskah (tiga belas layanan bisnis, dua belas kategori keanggotaan, tiga puluh lebih provinsi, tiga bahasa) diambil langsung dari konten portal dan aman disampaikan. Data anggota yang tampil saat demo adalah data contoh isi portal \u2014 sampaikan sebagai profil contoh tanpa perlu menyorotinya. Latih naskah ini dua kali dengan stopwatch sebelum hari-H; kecepatan bicara formal yang sehat untuk lima menit adalah sekitar seratus empat puluh kata per menit." },
], { after: 200 }));

// ---------- Document ----------
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT, size: 24, color: P.body },
        paragraph: { spacing: { line: 400 } },
      },
      heading1: {
        run: { font: FONT, size: 30, bold: true, color: P.primary },
        paragraph: { spacing: { before: 420, after: 160, line: 400 } },
      },
      heading2: {
        run: { font: FONT, size: 26, bold: true, color: P.primary },
        paragraph: { spacing: { before: 340, after: 100, line: 400 } },
      },
    },
  },
  numbering: {
    config: [
      {
        reference: "prep-list",
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 640, hanging: 360 } } },
        }],
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { line: 240 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: P.line, space: 4 } },
          children: [new TextRun({ text: "MUHDIN INDONESIA \u00B7 Naskah Demo 5 Menit \u00B7 Rahasia \u2014 Internal", size: 16, color: P.secondary, font: FONT })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: 240 },
          children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: P.secondary, font: FONT })],
        })],
      }),
    },
    children,
  }],
});

const OUT = "/home/z/my-project/download/Naskah-Demo-5-Menit-Presiden-MUHDIN.docx";
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("OK ->", OUT, buf.length, "bytes");
});
