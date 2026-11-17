/**
 * build_tutorial_docx.js — TUTORIAL-LENGKAP-Impor-CSV-MUHDIN.docx
 * Bahasa Indonesia · pemula · recipe cover R1 + palet WM-1 (Warm Teal, education/training)
 * Arsitektur: Section 1 cover (margin 0) → Section 2 daftar isi (Roman) → Section 3 isi (Arabic mulai 1)
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, NumberFormat, AlignmentType, HeadingLevel,
  WidthType, BorderStyle, ShadingType, SectionType, TableOfContents,
  PageBreak, LevelFormat, TableLayoutType,
} = require("docx");
const fs = require("fs");

// ── Palet WM-1 (Warm Teal — education/training) ─────────────────────────────
const P = {
  bg: "F4F1E9", primary: "15857A", accent: "FF6A3B",
  cover: { titleColor: "15857A", subtitleColor: "606060", metaColor: "707070", footerColor: "A0A0A0" },
  table: { headerBg: "15857A", headerText: "FFFFFF", accentLine: "15857A", innerLine: "D5D0C8", surface: "F0EDE5" },
};
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

const F_BODY = { ascii: "Calibri", eastAsia: "Microsoft YaHei" };
const F_MONO = { ascii: "Consolas", eastAsia: "Microsoft YaHei" };

// ── Helpers dasar ────────────────────────────────────────────────────────────
const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 400, after: 160, line: 312 },
  children: [new TextRun({ text, bold: true, size: 32, color: P.primary, font: F_BODY })],
});
const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 260, after: 120, line: 312 },
  children: [new TextRun({ text, bold: true, size: 26, color: P.primary, font: F_BODY })],
});
const body = (runsOrText, opts = {}) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 120, line: 312 },
  ...opts,
  children: (Array.isArray(runsOrText) ? runsOrText : [new TextRun({ text: runsOrText, size: 22, color: "000000", font: F_BODY })]),
});
const R = (text, extra = {}) => new TextRun({ text, size: 22, color: "000000", font: F_BODY, ...extra });
const RB = (text) => R(text, { bold: true });
const RMONO = (text) => new TextRun({ text, size: 20, color: "0F4C45", font: F_MONO });

// Baris perintah terminal — blok monospace dengan aksen kiri
const cmd = (text) => new Paragraph({
  spacing: { before: 60, after: 140, line: 312 },
  indent: { left: 240, right: 240 },
  shading: { type: ShadingType.CLEAR, fill: "EEF4F3" },
  border: { left: { style: BorderStyle.SINGLE, size: 14, color: P.primary, space: 10 } },
  children: [new TextRun({ text, size: 20, color: "0F4C45", font: F_MONO })],
});

// Kotak catatan (tanpa emoji — aksen oranye)
const note = (label, text) => new Paragraph({
  spacing: { before: 80, after: 160, line: 312 },
  indent: { left: 240, right: 240 },
  shading: { type: ShadingType.CLEAR, fill: "FFF3EC" },
  border: { left: { style: BorderStyle.SINGLE, size: 14, color: P.accent, space: 10 } },
  children: [new TextRun({ text: label + " ", bold: true, size: 20, color: "B24A16", font: F_BODY }),
             new TextRun({ text, size: 20, color: "5A4030", font: F_BODY })],
});

// Item daftar bernomor — tiap daftar reference unik
const num = (ref) => (text) => new Paragraph({
  numbering: { reference: ref, level: 0 },
  spacing: { after: 100, line: 312 },
  children: Array.isArray(text) ? text : [R(text)],
});
const bullet = (text) => new Paragraph({
  bullet: { level: 0 },
  spacing: { after: 80, line: 312 },
  children: Array.isArray(text) ? text : [R(text)],
});

// ── Tabel zebra (header teal, garis horizontal saja) ────────────────────────
let tblNo = 0;
function tbl(caption, widths, header, rows, opts = {}) {
  tblNo += 1;
  const fontSize = opts.fontSize || 19;
  const headerRow = new TableRow({
    tableHeader: true, cantSplit: true,
    children: header.map((htext, i) => new TableCell({
        width: { size: widths[i], type: WidthType.PERCENTAGE },
        children: String(htext).split("\n").map((line) => new Paragraph({
          spacing: { line: 276 },
          children: [new TextRun({ text: line, bold: true, size: fontSize, color: P.table.headerText, font: F_BODY })],
        })),
        shading: { type: ShadingType.CLEAR, fill: P.table.headerBg },
        margins: { top: 70, bottom: 70, left: 120, right: 120 },
      })),
  });
  const dataRows = rows.map((row, ri) => new TableRow({
    cantSplit: true,
    children: row.map((cellText, ci) => new TableCell({
      width: { size: widths[ci], type: WidthType.PERCENTAGE },
      children: String(cellText).split("\n").map((line) => new Paragraph({
        spacing: { line: 276 },
        children: [new TextRun({ text: line, size: fontSize, color: "1A1A1A", font: F_BODY })],
      })),
      shading: { type: ShadingType.CLEAR, fill: ri % 2 === 0 ? "FFFFFF" : P.table.surface },
      margins: { top: 70, bottom: 70, left: 120, right: 120 },
    })),
  }));
  return [
    new Paragraph({
      keepNext: true, spacing: { before: 160, after: 80, line: 312 },
      children: [new TextRun({ text: `Tabel ${tblNo} — ${caption}`, bold: true, size: 20, color: P.primary, font: F_BODY })],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 8, color: P.table.accentLine },
        bottom: { style: BorderStyle.SINGLE, size: 8, color: P.table.accentLine },
        left: NB, right: NB,
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: P.table.innerLine },
        insideVertical: NB,
      },
      rows: [headerRow, ...dataRows],
    }),
    new Paragraph({ spacing: { after: 120 }, children: [] }),
  ];
}

// ── Cover recipe R1 (sesuai design-system.md, tanpa modifikasi struktur) ────
function splitTitleLines(title, charsPerLine) {
  if (title.length <= charsPerLine) return [title];
  const breakAfter = new Set([..."，。、；：！？", ..."的与和及之在于为", ..."-_—–·/", ..." \t"]);
  const lines = [];
  let remaining = title;
  while (remaining.length > charsPerLine) {
    let breakAt = -1;
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
    }
    if (breakAt === -1) {
      const limit = Math.min(remaining.length, Math.ceil(charsPerLine * 1.3));
      for (let i = charsPerLine + 1; i < limit; i++) {
        if (breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
      }
    }
    if (breakAt === -1) breakAt = charsPerLine;
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop();
    lines[lines.length - 1] += last;
  }
  return lines;
}
function calcTitleLayout(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  // Judul dokumen ini beraksara Latin (lebar ± 1/2 CJK) → lebar efektif dikalikan 1.8
  const charWidth = (pt) => pt * 20;
  const charsPerLine = (pt) => Math.floor(maxWidthTwips / charWidth(pt));
  let titlePt = preferredPt, lines;
  while (titlePt >= minPt) {
    const cpl = charsPerLine(titlePt);
    if (cpl < 2) { titlePt -= 2; continue; }
    lines = splitTitleLines(title, cpl);
    if (lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines || lines.length > 3) {
    lines = splitTitleLines(title, charsPerLine(minPt));
    titlePt = minPt;
  }
  return { titlePt, titleLines: lines };
}
function calcCoverSpacing(params) {
  const { titleLineCount = 1, titlePt = 36, hasSubtitle = false, hasEnglishLabel = false,
          metaLineCount = 0, fixedHeight = 800, pageHeight = 16838, marginTop = 0, marginBottom = 0 } = params;
  const SAFETY = 1200;
  const usableHeight = pageHeight - marginTop - marginBottom - SAFETY;
  const titleHeight = titleLineCount * (titlePt * 23 + 200);
  const subtitleHeight = hasSubtitle ? (12 * 23 + 600) : 0;
  const englishLabelHeight = hasEnglishLabel ? (9 * 23 + 600) : 0;
  const metaHeight = metaLineCount * (10 * 23 + 100);
  const implicitParaHeight = 3 * 300;
  const contentHeight = titleHeight + subtitleHeight + englishLabelHeight + metaHeight + fixedHeight + implicitParaHeight;
  const remainingSpace = usableHeight - contentHeight;
  const safeRemaining = Math.max(remainingSpace, 400);
  const FOOTER_MIN = 800;
  const rawTop = Math.floor(safeRemaining * 0.45);
  const rawBottom = Math.floor(safeRemaining * 0.45);
  const bottomSpacing = Math.max(rawBottom, FOOTER_MIN);
  const topSpacing = Math.max(rawTop - Math.max(0, FOOTER_MIN - rawBottom), 400);
  const midSpacing = Math.max(safeRemaining - topSpacing - bottomSpacing, 0);
  return { topSpacing, midSpacing, bottomSpacing };
}
function buildCoverR1(config) {
  const CP = config.palette;
  const padL = 1200, padR = 800;
  const availableWidth = Math.floor((11906 - padL - padR - 300) * 1.8); // *1.8: teks Latin ± setengah lebar CJK
  const { titlePt, titleLines } = calcTitleLayout(config.title, availableWidth, 40, 24);
  const titleSize = titlePt * 2;
  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt,
    hasSubtitle: !!config.subtitle, hasEnglishLabel: !!config.englishLabel,
    metaLineCount: (config.metaLines || []).length, fixedHeight: 400,
  });
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: CP.accent, space: 12 };
  const children = [];
  children.push(new Paragraph({ spacing: { before: spacing.topSpacing } }));
  if (config.englishLabel) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: CP.accent, space: 8 } },
      children: [new TextRun({ text: config.englishLabel.split("").join("  "), size: 18, color: CP.accent,
        font: { ascii: "Calibri", eastAsia: "SimHei" }, characterSpacing: 40 })],
    }));
  }
  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: titleLines[i], size: titleSize, bold: true, color: CP.titleColor,
        font: { eastAsia: "SimHei", ascii: "Arial" } })],
    }));
  }
  if (config.subtitle) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 800, line: 340, lineRule: "atLeast" },
      children: [new TextRun({ text: config.subtitle, size: 24, color: CP.subtitleColor,
        font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    }));
  }
  for (const line of (config.metaLines || [])) {
    children.push(new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: accentLeft },
      children: [new TextRun({ text: line, size: 22, color: CP.metaColor,
        font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    }));
  }
  children.push(new Paragraph({ spacing: { before: spacing.bottomSpacing } }));
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: CP.accent, space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: config.footerLeft || "", size: 16, color: CP.footerColor, font: { ascii: "Arial" } }),
      new TextRun({ text: "                                        " }),
      new TextRun({ text: config.footerRight || "", size: 16, color: CP.footerColor, font: { ascii: "Arial" } }),
    ],
  }));
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: CP.bg }, borders: noBorders,
        children,
      })],
    })],
  })];
}

// ── Header & footer ──────────────────────────────────────────────────────────
const pageHeader = () => new Header({
  children: [new Paragraph({
    alignment: AlignmentType.RIGHT,
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "D8D3C8", space: 4 } },
    children: [new TextRun({ text: "Tutorial Lengkap Impor CSV — MUHDIN.id", size: 16, color: "8C8A84", font: F_BODY })],
  })],
});
const pageFooter = () => new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "666666", font: F_BODY })],
  })],
});

// ═════════════════════════════════════════════════════════════════════════════
// ISI DOKUMEN
// ═════════════════════════════════════════════════════════════════════════════
const isi = [];

// ── BAB 1 ──
isi.push(h1("Bab 1 — Selamat Datang! Baca Ini Dulu"));
isi.push(body("Selamat datang di panduan resmi impor data MUHDIN.id. Dokumen ini ditulis khusus untuk pemula: setiap klik, setiap perintah, dan setiap pesan yang mungkin muncul di layar dijelaskan satu per satu dengan bahasa sehari-hari. Kamu tidak perlu punya latar belakang pemrograman sama sekali — cukup bisa membuka Excel, mengetik, dan menyalin-tempel teks."));
isi.push(body("Tujuan akhirnya satu: memasukkan data penyelenggara ibadah (PPIU, PIHK, KBIHU, IPHI, dan travel wisata) ke database portal MUHDIN.id milikmu, sehingga datanya tampil rapi di halaman direktori anggota dan bisa dikelola lewat CMS. Setelah mengikuti panduan ini sampai habis, kamu akan mampu mengimpor 10 baris maupun 1.000 baris data dengan cara yang persis sama."));

isi.push(h2("1.1 Alur Besar: 5 Langkah dari Excel ke Portal"));
isi.push(body("Seluruh proses hanya terdiri dari lima langkah. Jika suatu saat kamu merasa tersesat, kembali ke daftar ini dan cari tahu kamu sedang berada di langkah yang mana."));
isi.push(...tbl("Alur 5 langkah impor data", [10, 26, 64],
  ["Langkah", "Di mana", "Yang dilakukan"],
  [
    ["1", "File template Excel", "Buka Template-Import-CSV-MUHDIN.xlsx, isi sheet Master (hapus dulu 3 baris contoh)."],
    ["2", "Excel — menu File", "Save As dengan format CSV UTF-8, simpan di folder proyek (mis. db/data-kamu.csv)."],
    ["3", "Terminal", "Jalankan perintah impor mode uji (--dry-run) dan pastikan tidak ada baris yang bermasalah."],
    ["4", "Terminal", "Jalankan perintah impor sungguhan. Data masuk ke database."],
    ["5", "Portal & CMS", "Cek hasilnya di halaman Anggota dan di CMS Direktori Anggota. Selesai."],
  ]));

isi.push(h2("1.2 Istilah Penting untuk Pemula"));
isi.push(body("Lima istilah di bawah ini akan muncul terus-menerus dalam panduan ini. Baca sekali sekarang, lalu kembali ke sini kapan pun ada istilah yang terasa asing. Tidak perlu menghafal — yang penting paham gambaran besarnya."));
isi.push(...tbl("Istilah yang dipakai dalam panduan ini", [22, 78],
  ["Istilah", "Artinya dalam bahasa sehari-hari"],
  [
    ["CSV", "Format file teks sederhana berisi tabel: satu baris = satu data, kolom dipisah koma. Semua program (Excel, Google Sheets, Notepad) bisa membuatnya. Inilah 'bahasa bersama' untuk memindahkan data."],
    ["Database", "Lembar arsip raksasa tempat portal menyimpan semua data (anggota, paket, artikel). File database MUHDIN bernama custom.db di folder db."],
    ["Terminal", "Jendela hitam/putih tempat mengetik perintah langsung ke komputer. Di Windows namanya PowerShell atau CMD, di Mac namanya Terminal."],
    ["Importer", "Program kecil bernama import-members.ts yang membaca file CSV-mu lalu menyalin isinya ke database. Tugas kita hanya memberinya file yang benar."],
    ["CMS", "Panel admin portal (halaman #/admin) untuk mengelola data lewat klik-klik tanpa perintah — tempat kamu bisa menambah, mengubah, dan menghapus anggota."],
  ]));

isi.push(h2("1.3 File-Ffile yang Dipakai"));
isi.push(body("Empat file berikut adalah 'pemain' utama dalam panduan ini. Semuanya sudah tersedia di dalam proyek MUHDIN — kamu tidak perlu membuat file apa pun dari nol."));
isi.push(...tbl("File yang terlibat dalam proses impor", [40, 60],
  ["File", "Fungsinya"],
  [
    ["download/Template-Import-CSV-MUHDIN.xlsx", "Template Excel tempat kamu menulis data. Berisi 4 sheet: MULAI DI SINI, Master, REFERENSI, dan PETA-KOLOM."],
    ["download/Template-Import-Anggota.csv", "Contoh file CSV yang sudah jadi — untuk dilihat bentuknya, bisa dibuka pakai Notepad."],
    ["scripts/import-members.ts", "Program importer: membaca CSV lalu menyalin isinya ke database. Menjalankan dua perintah di Bab 5."],
    ["db/custom.db", "Database portal. Semua data anggota tersimpan di sini. Jangan dihapus, jangan diganti nama."],
  ]));
isi.push(note("Catatan:", "Ada juga workbook lama bernama Master_Penyelenggara_Haji_Umrah.xlsx (52 kolom untuk audit internal). Kalau kamu kebetulan sudah mengisinya, kabar baik: sheet Master-nya bisa langsung diimpor juga tanpa menyalin ulang — caranya dijelaskan di Bab 3 bagian akhir dan di sheet PETA-KOLOM."));

// ── BAB 2 ──
isi.push(h1("Bab 2 — Persiapan Sebelum Mulai"));
isi.push(body("Persiapan hanya dua hal: memastikan 'mesin' portal siap, dan menyiapkan tempat bekerja. Kerjakan pelan-pelan; setiap langkah hanya butuh satu atau dua menit. Jika hasil pemeriksaan sudah sesuai, langsung lompat ke Bab 3."));

isi.push(h2("2.1 Memastikan Alat Siap"));
isi.push(body("Buka terminal (caranya di 2.2), lalu jalankan perintah berikut untuk memastikan alat pemroses file terpasang:"));
isi.push(cmd("bun --version"));
isi.push(body("Jika muncul angka versi (misalnya 1.2.21), artinya alat siap. Jika muncul tulisan 'command not found' atau 'not recognized', berikut solusinya: jalankan bun install di dalam folder proyek untuk memasang semua komponen portal, atau pasang bun terlebih dahulu dari situs resminya bun.sh (di Windows cukup buka PowerShell lalu ikuti satu baris perintah instalasi yang tertulis di sana). Setelah itu ulangi pengecekan versi di atas."));
isi.push(body("Satu pemeriksaan lagi: pastikan kamu berada di dalam folder proyek. Folder proyek adalah folder yang di dalamnya ada file package.json dan folder bernama scripts. Semua perintah dalam panduan ini diasumsikan dijalankan dari folder itu."));

isi.push(h2("2.2 Membuka Terminal di Folder Proyek"));
isi.push(body("Untuk pemula, cara termudah membuka terminal tepat di folder proyek adalah lewat File Explorer (Windows):"));
const winSteps = num("num-terminal-win");
isi.push(winSteps("Buka File Explorer, masuk ke folder proyek MUHDIN (yang berisi package.json)."));
isi.push(winSteps("Klik bilah alamat di bagian atas jendela, hapus isinya, ketik powershell, lalu tekan Enter."));
isi.push(winSteps("Jendela biru PowerShell akan terbuka dan otomatis sudah berada di folder proyek tersebut."));
isi.push(body("Di Mac: klik kanan folder proyek di Finder, pilih Services (atau New Terminal at Folder bila tersedia), atau buka aplikasi Terminal lalu ketik cd diikuti spasi, seret folder proyek ke jendela, dan tekan Enter. Di lingkungan kerja berbasis web (sandbox), terminal sudah tersedia di panel samping — tinggal memastikan path-nya ke folder proyek."));
isi.push(note("Tips:", "Menyalin perintah dari dokumen ini lalu menempelnya di terminal (klik kanan → Paste, atau Ctrl+Shift+V) jauh lebih aman daripada mengetik manual — risiko salah ketik jadi nol."));

// ── BAB 3 ──
isi.push(h1("Bab 3 — Mengisi Sheet Master"));
isi.push(body("Inilah bagian paling penting dari seluruh panduan. Sheet Master adalah 'form isian' yang nantinya dibaca oleh importer. Kualitas isi sheet ini menentukan mulus atau tidaknya impor. Kabar baiknya: aturannya cuma lima, dan sisanya tinggal mengikuti panduan per kolom di bawah."));

isi.push(h2("3.1 Lima Aturan Emas"));
isi.push(bullet([RB("Jangan mengubah baris 1. "), R("Baris pertama berisi nama kolom (name, type, dst.) yang dibaca program. Mengubahnya sama dengan membuat program kehilangan peta — impor akan ditolak.")]));
isi.push(bullet([RB("Hapus 3 baris CONTOH sebelum menyimpan. "), R("Baris abu-abu miring di baris 2-4 hanyalah ilustrasi. Kalau tidak dihapus, data contoh ikut masuk ke database kamu.")]));
isi.push(bullet([RB("Satu baris = satu perusahaan. "), R("Mulai menulis data dari baris 2, satu perusahaan per baris, tanpa baris kosong di tengah.")]));
isi.push(bullet([RB("Nama harus unik. "), R("Nama perusahaan adalah 'kunci' data. Nama yang sudah ada di database akan diperbarui isinya — bukan diduplikasi — sehingga impor aman dijalankan berulang.")]));
isi.push(bullet([RB("Isi kolom type dari dropdown. "), R("Klik sel di kolom type akan memunculkan panah kecil — pilih dari daftar agar tidak ada salah ketik.")]));

isi.push(h2("3.2 Panduan Isi Per Kolom"));
isi.push(body("Tabel berikut merangkum kesebelas kolom sheet Master. Kolom bertanda WAJIB harus diisi; kolom lain boleh dikosongkan karena importer otomatis mengisi nilai yang wajar. Detil nilai yang diizinkan ada di sheet REFERENSI dan di Bab lampiran."));
isi.push(...tbl("Spesifikasi 11 kolom sheet Master", [16, 11, 41, 32],
  ["Kolom", "Wajib?", "Format dan aturan", "Contoh"],
  [
    ["name", "WAJIB", "Nama resmi perusahaan/organisasi, harus unik. Nama yang sudah ada akan diperbarui (idempoten).", "PT Amanah Bersama Tour dan Travel"],
    ["type", "WAJIB", "Salah satu dari 5 nilai: PPIU, PIHK, KBIHU, IPHI, TRAVEL_WISATA. Huruf besar-kecil bebas.", "PPIU"],
    ["city", "Opsional", "Kota domisili. Kosong = otomatis 'Nasional'.", "Jakarta Barat"],
    ["province", "Opsional", "Provinsi. Kosong = otomatis 'Indonesia'.", "DKI Jakarta"],
    ["licenseNo", "Opsional", "Nomor izin Kemenag sebagaimana tertulis di SK/pengumuman. Kosong = otomatis tanda '-'.", "UU-562/2025"],
    ["phone", "Opsional", "Telepon atau WhatsApp.", "021-5550101"],
    ["email", "Opsional", "Email aktif perusahaan.", "info@perusahaan.id"],
    ["website", "Opsional", "Alamat web lengkap dengan https://", "https://perusahaan.id"],
    ["description", "Opsional", "Deskripsi singkat 1-2 kalimat; boleh berisi koma.", "Penyelenggara umrah sejak 2010."],
    ["status", "Opsional", "TERVERIFIKASI, PENDING, atau SUSPENDED. Kosong = TERVERIFIKASI.", "TERVERIFIKASI"],
    ["memberSince", "Opsional", "Tahun 4 digit (atau teks apa pun yang memuat tahun). Kosong = 2026.", "2025"],
  ]));

isi.push(h2("3.3 Nilai yang Diizinkan untuk type dan status"));
isi.push(body("Dua kolom ini 'ketat': isinya harus dari daftar. Penyebabnya bukan birokrasi, melainkan agar portal bisa memfilter dan menampilkan data dengan benar (misalnya pengunjung memfilter 'tampilkan hanya PIHK')."));
isi.push(...tbl("Nilai kolom type", [22, 46, 32],
  ["Nilai", "Arti", "Contoh pemakainya"],
  [
    ["PPIU", "Penyelenggara Perjalanan Ibadah Umrah — pemegang izin umrah dari Kemenag RI", "PT X Wisata Umrah"],
    ["PIHK", "Penyelenggara Ibadah Haji Khusus — pemegang kuota haji khusus lewat SK Menag", "PT Y Haji Khusus"],
    ["KBIHU", "Kelompok Binaan Ibadah Umrah — binaan seorang PPIU", "KBIHU Z Jakarta"],
    ["IPHI", "Anggota organisasi Ikatan Penyelenggara Haji Indonesia", "IPHI cabang Semarang"],
    ["TRAVEL_WISATA", "Travel umum/wisata yang ikut serta dalam ekosistem", "Travel Nusantara"],
  ]));
isi.push(...tbl("Nilai kolom status", [24, 40, 36],
  ["Nilai", "Arti", "Efek di portal"],
  [
    ["TERVERIFIKASI", "Data terverifikasi dan izin berlaku", "Tampil normal sebagai anggota aktif"],
    ["PENDING", "Menunggu verifikasi atau verifikasi ulang", "Tampil dengan penanda Menunggu"],
    ["SUSPENDED", "Dibekukan, dicabut, atau diblokir regulator", "Tidak direkomendasikan untuk transaksi"],
  ]));

isi.push(h2("3.4 Contoh Baris Benar vs Salah"));
isi.push(body("Perbandingan berikut diambil dari kesalahan yang paling sering terjadi. Kolom kanan menjelaskan mengapa sisi kiri gagal — biasanya cuma satu detail kecil."));
isi.push(...tbl("Perbandingan pengisian benar dan salah", [34, 66],
  ["Yang ditulis", "Penilaian"],
  [
    ["type: PPIU", "BENAR — sesuai daftar nilai."],
    ["type: Ppiu umrah & haji", "SALAH — bukan salah satu dari 5 nilai; baris akan dilewati dengan pesan jelas di layar."],
    ["memberSince: 2025", "BENAR — tahun 4 digit."],
    ["memberSince: tahun lalu", "SALAH — tidak ada angka tahun 4-digit; akan dianggap kosong dan diisi 2026."],
    ["name: PT Barokah Wisata", "BENAR — nama unik, satu baris satu perusahaan."],
    ["name: (kosong)", "SALAH — name wajib; baris dilewati. Isi '—' tidak dianjurkan untuk nama."],
  ]));
isi.push(h2("3.5 Punya Data di Workbook Master Besar? Bisa Langsung"));
isi.push(body("Jika kamu sudah mengisi workbook audit Master_Penyelenggara_Haji_Umrah.xlsx (yang 52 kolom), kamu tidak perlu menyalin ulang ke template baru. Importer sekarang mengenali header berbahasa Indonesia secara otomatis: nama_resmi diperlakukan sebagai name, jenis_entitas sebagai type, nomor_izin_Kemenag sebagai licenseNo, kolom gabungan telepon_email_web dipilah otomatis menjadi telepon, email, dan website, sementara status_izin dan tanggal_izin dinormalisasi menjadi status dan tahun memberSince."));
isi.push(body("Caranya: buka sheet Master di workbook besar, lalu lakukan Save As CSV persis seperti Bab 4, dan lanjutkan ke Bab 5. Kolom-kolom audit lainnya (NIB, NPWP, mitra Saudi, dan kawan-kawan) memang tidak ikut terimpor karena database portal hanya menampung 11 kolom — mereka tetap tersimpan aman di workbook untuk kebutuhan audit internalmu. Pemetaan lengkapnya ada di sheet PETA-KOLOM pada template."));

// ── BAB 4 ──
isi.push(h1("Bab 4 — Mengubah Excel Menjadi CSV"));
isi.push(body("Importer tidak membaca file .xlsx secara langsung — ia membaca file .csv. Karena itu setelah selesai mengisi sheet Master, kita perlu menyimpannya dalam format CSV. Ini langkah yang sama mudahnya dengan menyimpan dokumen biasa; hanya pilihan formatnya yang berbeda."));

isi.push(h2("4.1 Cara Save As di Windows (Excel)"));
const winSave = num("num-save-win");
isi.push(winSave("Pastikan kamu sedang berada di sheet Master (klik tab-nya di bagian bawah jendela Excel)."));
isi.push(winSave("Klik menu File, lalu pilih Save As (Simpan Sebagai)."));
isi.push(winSave("Pada bagian lokasi, pilih folder db di dalam folder proyek MUHDIN — supaya perintah impor nantinya pendek."));
isi.push(winSave("Pada kolom File name, beri nama tanpa spasi, misalnya data-kamu.csv."));
isi.push(winSave("Pada kolom Save as type, pilih CSV UTF-8 (Comma delimited) (*.csv) — pilih yang bertuliskan UTF-8, bukan CSV biasa, agar huruf tampil sempurna."));
isi.push(winSave("Klik Save. Excel mungkin menanyakan 'data kalian tidak dapat disimpan...' — klik Yes (atau Keep Current Format). Peringatan itu normal: memang hanya sheet aktif yang disimpan."));
isi.push(note("Penting:", "Excel hanya menyimpan sheet yang sedang aktif. Karena itu pastikan sheet Master yang aktif saat Save As — bukan sheet MULAI DI SINI."));

isi.push(h2("4.2 Cara di Mac dan Google Sheets"));
isi.push(body("Di Mac (Excel atau Numbers): pilih File → Save As / Export To → CSV. Pastikan pilihan 'UTF-8' tercentang bila tersedia. Di Google Sheets: pilih File → Download → Comma Separated Values (.csv) — Sheets otomatis memakai UTF-8 dan pemisah koma, jadi tidak ada pengaturan tambahan. Hasil unduhan langsung siap dipakai."));
isi.push(body("Bila kamu mengisi data langsung di file Template-Import-Anggota.csv memakai Notepad, pastikan saat menyimpan memilih Save As dengan Encoding: UTF-8 (pilihan ada di dropdown bagian bawah dialog Notepad)."));

isi.push(h2("4.3 Jebakan Klasik: CSV Terbuka Jadi Satu Kolom"));
isi.push(body("Sesekali kamu akan membuka file CSV hasil Save As dengan mengklik ganda di Excel, dan seluruh isi menempel di satu kolom. Tenang — file itu TIDAK rusak. Kejadian ini murni soal pengaturan regional: Excel Indonesia mengharapkan pemisah titik-koma (;), sedangkan file kita memakai koma (,)."));
isi.push(body("Untuk importer, hal ini sama sekali tidak menjadi masalah: importer otomatis mendeteksi pemisah, baik koma, titik-koma, maupun tab. Masalah hanya muncul kalau kamu ingin mengedit ulang file CSV tersebut di Excel. Caranya: jangan klik ganda; buka Excel dulu, pilih Data → From Text/CSV, pilih filenya, dan Excel akan menampilkan pratinjau dengan pemisah yang benar. Atau lebih praktis lagi: edit selalu di sheet Master template, lalu Save As ulang — jangan mengedit file CSV-nya langsung."));

// ── BAB 5 ──
isi.push(h1("Bab 5 — Menjalankan Impor"));
isi.push(body("Sampailah kita di bagian yang paling sering ditakuti pemula: mengetik perintah. Sebenarnya hanya ada dua perintah, keduanya pendek, dan keduanya tidak mungkin 'meledak' — importer dirancang ramah: baris yang bermasalah dilewati dengan catatan, bukan menggagalkan seluruh proses. Ikuti urutannya: uji dulu, baru simpan."));

isi.push(h2("5.1 Langkah 1: Uji Coba dengan --dry-run"));
isi.push(body("Mode uji (dry-run) membaca seluruh file CSV-mu, memeriksa tiap baris, dan menampilkan hasil yang AKAN terjadi — tanpa menyentuh database sedikit pun. Jalankan perintah ini di terminal (pastikan di folder proyek, ganti db/data-kamu.csv sesuai nama file-mu):"));
isi.push(cmd("bun scripts/import-members.ts db/data-kamu.csv --dry-run"));
isi.push(body("Perhatikan tampilan ringkasan yang muncul. Contoh hasil yang sehat:"));
isi.push(cmd("== MODE DRY-RUN: tidak ada data yang ditulis ke database ==\n=== RINGKASAN IMPOR ANGGOTA ===\nBaris    : 25\nAkan baru     : 25\nAkan diperbarui: 0\nDilewati : 0\nOK — Semua baris valid. Jalankan lagi TANPA --dry-run untuk menyimpan."));
isi.push(body("Arti tiap barisnya: Baris adalah jumlah baris data yang terbaca (baris judul tidak dihitung). Akan baru adalah data yang belum ada di database dan akan ditambahkan. Akan diperbarui adalah data yang namanya sudah ada dan akan disegarkan. Dilewati adalah baris bermasalah — target kita nol. Jika Dilewati lebih dari nol, gulir ke atas: importer mencantumkan nomor baris dan alasannya (misalnya 'Baris 7: name/type tidak valid'). Perbaiki baris tersebut di Excel, Save As ulang, jalankan uji lagi. Ulangi sampai Dilewati: 0 — atau hingga kamu puas dengan baris yang valid."));

isi.push(h2("5.2 Langkah 2: Impor Sungguhan"));
isi.push(body("Setelah uji bersih, jalankan perintah yang sama TANPA --dry-run:"));
isi.push(cmd("bun scripts/import-members.ts db/data-kamu.csv"));
isi.push(body("Outputnya mirip dengan mode uji, diakhiri pesan konfirmasi dan ajakan memeriksa hasil. Mulai detik ini data sudah tinggal di database dan otomatis terpakai oleh portal."));

isi.push(h2("5.3 Aman Dipakai Berulang (Idempoten)"));
isi.push(body("Importer bekerja berdasarkan nama perusahaan. Kalau nama di CSV sudah ada di database, ia memperbarui data lama dengan data baru; kalau belum ada, ia menambahkan baris baru. Konsekuensinya menyenangkan: menjalankan impor dua kali tidak akan menggandakan data, dan kamu bisa memakai satu file CSV yang sama sebagai 'sumber kebenaran' — kapan pun ada perubahan, perbarui file-nya lalu impor ulang. Inilah cara paling nyaman merawat data jangka panjang."));

// ── BAB 6 ──
isi.push(h1("Bab 6 — Memeriksa Hasil Impor"));
isi.push(body("Setelah impor berhasil, lakukan pemeriksaan singkat dari tiga pintu berbeda. Ketiganya menampilkan data dari sumber yang sama, jadi cukup pilih satu — tapi memeriksa dari dua pintu memberi keyakinan ekstra bahwa semuanya beres."));

isi.push(h2("6.1 Dari Portal Publik"));
isi.push(body("Buka portal MUHDIN, masuk ke menu Anggota (alamatnya diakhiri #/anggota). Data yang baru diimpor dan berstatus TERVERIFIKASI akan tampil di direktori bersama anggota lain. Coba fitur pencarian atau filter jenis mitra untuk memastikan baris barumu muncul dengan detail yang benar — nama, kota, dan nomor izin."));
isi.push(body("Ingat: anggota berstatus PENDING atau SUSPENDED tidak ikut tampil di daftar aktif publik. Kalau datamu tidak terlihat, periksa dulu statusnya di CMS sebelum panik."));

isi.push(h2("6.2 Dari CMS Admin"));
const cmsSteps = num("num-cms-cek");
isi.push(cmsSteps([R("Buka halaman admin portal (alamatnya diakhiri "), RMONO("#/admin"), R(") lalu masuk dengan akun admin — akun bawaan demo: "), RMONO("admin@muhdin.web.id"), R(" dengan kata sandi "), RMONO("muhdin2026"), R(". Ganti sandi ini sebelum portal dipakai sungguhan.")]));
isi.push(cmsSteps("Di bilah samping kiri, klik menu Direktori Anggota."));
isi.push(cmsSteps("Gunakan kotak pencarian untuk mencari salah satu perusahaan yang barusan kamu impor, lalu pastikan detailnya sesuai."));
isi.push(cmsSteps("Perhatikan tombol Ekspor CSV di kanan atas halaman — tombol ini mengunduh seluruh anggota yang ada ke file CSV. File hasil ekspor bisa kamu edit di Excel lalu diimpor ulang; kombinasi Ekspor → Edit → Impor adalah cara paling nyaman merawat data dalam jumlah banyak."));
isi.push(note("Tips:", "Di CMS setiap baris anggota bisa langsung diedit atau dihapus lewat tombol aksi. Untuk perbaikan satu-dua data, CMS lebih cepat daripada mengimpor ulang."));

isi.push(h2("6.3 Dalamat Angka: Cek Lewat API"));
isi.push(body("Buat kamu yang penasaran dengan angka, portal menyediakan antarmuka data terbuka. Buka alamat berikut di peramban (sesuaikan domain/portalmu, misalnya http://localhost:3000 bila dijalankan lokal):"));
isi.push(cmd("GET /api/members?type=PPIU     → daftar anggota PPIU dalam format JSON\nGET /api/stats/public        → statistik ringkas portal"));
isi.push(body("Halaman akan menampilkan teks JSON — struktur data yang sama dipakai situs. Yang perlu diperhatikan cukup angka totalnya: pastikan jumlahnya bertambah sesuai jumlah baris yang kamu impor."));

// ── BAB 7 ──
isi.push(h1("Bab 7 — Memperbaiki Jika Terjadi Kesalahan"));
isi.push(body("Bagian ini adalah 'unit gawat darurat'. Temukan gejala atau pesan yang kamu lihat di kolom kiri, lalu ikuti solusinya. Sebagian besar masalah selesai dalam satu menit dan penyebabnya selalu sama: satu detail kecil di file CSV atau perintah."));
isi.push(...tbl("Pesan error dan gejala yang sering muncul", [32, 30, 38],
  ["Yang terlihat", "Penyebab", "Solusi"],
  [
    ["File tidak ditemukan: db/data-kamu.csv", "Nama atau lokasi file salah; kadang file tersimpan ganda sebagai data-kamu.csv.csv", "Pastikan nama file dan folder-nya. Ketik ulang path dengan teliti; cek isi folder dengan perintah dir (Windows) atau ls (Mac/Linux)."],
    ["Kolom wajib tidak ditemukan: name dan type", "Baris 1 di CSV berubah, terhapus, atau tergeser", "Kembalikan baris 1 persis seperti template (lihat Lampiran A), lalu Save As ulang."],
    ["Baris N: name/type tidak valid", "Kolom type diisi di luar 5 nilai yang diizinkan, atau name kosong", "Perbaiki sesuai daftar nilai (Tabel 5). Baris lain tetap aman — hanya baris itu yang dilewati."],
    ["CSV kosong / tidak berisi data", "File hanya berisi judul kolom, atau sheet yang tersimpan bukan sheet Master", "Isi minimal satu baris data; pastikan sheet Master aktif saat Save As."],
    ["Semua data menempel satu kolom saat CSV dibuka Excel", "Pengaturan regional Excel memakai pemisah titik-koma", "Bukan kerusakan — importer tetap membaca dengan benar. Untuk mengedit: Data → From Text/CSV."],
    ["Huruf aneh atau kotak-kotak muncul", "File disimpan dengan encoding selain UTF-8", "Save As ulang memakai CSV UTF-8 (Comma delimited)."],
    ["Impor gagal: Cannot find module '@prisma/client'", "Komponen portal belum lengkap terpasang", "Jalankan bun install, lalu bunx prisma generate, dan ulangi impor."],
    ["bun: command not found", "Bun belum terpasang di komputer", "Pasang dari bun.sh, tutup dan buka ulang terminal, cek dengan bun --version."],
    ["Tahun tercatat 2026 padahal seharusnya lain", "Kolom memberSince kosong atau tidak memuat angka 4 digit", "Isi tahun secara eksplisit (4 digit), lalu impor ulang."],
    ["Kota tertulis Nasional", "Kolom city dikosongkan; importer mengisi nilai bawaan", "Isi kolom city dengan kota yang benar, lalu impor ulang — data lama akan diperbarui."],
    ["Data tidak muncul di portal publik", "Status anggota PENDING/SUSPENDED, atau portal belum dimuat ulang", "Cek status di CMS; ubah ke TERVERIFIKASI bila memang layak; muat ulang halaman."],
    ["Sudah impor tapi ada data salah", "Kesalahan ketik di sumber data", "Perbaiki CSV lalu impor ulang (nama sama akan diperbarui), atau edit langsung di CMS."],
  ]));

isi.push(h2("7.1 Mengubah atau Menghapus Data yang Salah"));
isi.push(body("Untuk memperbaiki satu-dua data, lewat CMS adalah jalan tercepat: buka Direktori Anggota, klik baris yang dimaksud, ubah nilainya, simpan. Untuk menghapus anggota yang tidak seharusnya ada, gunakan aksi hapus pada baris tersebut di CMS — tidak ada perintah terminal yang dibutuhkan."));
isi.push(body("Untuk perbaikan massal (misalnya 50 perusahaan pindah kota), jangan hapus satu-satu. Perbaiki file CSV-mu sebagai sumber kebenaran, lalu impor ulang — semua nama yang cocok akan diperbarui otomatis. Pola pikirnya: file CSV adalah sumbernya, database adalah cerminannya."));

// ── BAB 8 ──
isi.push(h1("Bab 8 — Pertanyaan yang Sering Diajukan"));
isi.push(body("Kumpulan jawaban singkat untuk hal-hal yang paling sering ditanyakan pengguna baru. Kalau pertanyaanmu tidak ada di sini, bagian Bab 7 dan sheet REFERENSI di template adalah tempat pencarian berikutnya."));
isi.push(...tbl("FAQ impor CSV", [40, 60],
  ["Pertanyaan", "Jawaban singkat"],
  [
    ["Berapa banyak baris bisa diimpor sekaligus?", "Tidak ada batasan praktis. Puluhan hingga ribuan baris diproses dalam hitungan detik karena importer bekerja baris demi baris di komputermu sendiri."],
    ["Apakah kolom selain name dan type boleh kosong semua?", "Boleh. Kota, provinsi, nomor izin, dan tahun akan diisi nilai bawaan yang wajar, dan semuanya bisa diperbarui lewat impor berikutnya atau CMS."],
    ["Bisakah impor dilakukan berkali-kali dengan file yang sama?", "Bisa dan justru dianjurkan. Impor bersifat idempoten: nama yang sudah ada diperbarui, bukan diduplikasi."],
    ["Apakah data lama di database hilang saat impor?", "Tidak. Impor hanya menambah atau memperbarui data yang namanya ada di CSV. Data lain tidak disentuh sama sekali."],
    ["Bisakah mengimpor langsung dari workbook Master 52 kolom?", "Bisa. Header berbahasa Indonesia dikenali otomatis; detail pemetaannya ada di sheet PETA-KOLOM dan Bab 3.5."],
    ["Di mana data sebenarnya tersimpan?", "Di file db/custom.db pada tabel anggota (Member). Rutinlah membuat salinan dengan script backup yang tersedia di folder scripts sebelum perubahan besar."],
    ["Apa bedanya impor CSV dengan input manual di CMS?", "Hasilnya sama persis di database. Impor unggul untuk banyak data sekaligus; CMS unggul untuk satu-dua data atau perbaikan cepat."],
    ["Apakah urutan baris di CSV memengaruhi tampilan portal?", "Tidak. Portal menampilkan anggota menurut data dan filternya sendiri, bukan urutan file."],
  ]));

// ── BAB 9 ──
isi.push(h1("Bab 9 — Dari Mana Mendapatkan Data Resmi"));
isi.push(body("Template sudah di tangan, tapi dari mana sumber datanya? Sebagai konteks: aplikasi Haji Pintar di Play Store adalah aplikasi resmi Kementerian untuk cek porsi haji, manasik, dan layanan jamaah — ia tidak memuat daftar PPIU/PIHK, dan toko aplikasi pun hanya menyimpan keterangan aplikasi, bukan daftar perusahaan. Database resmi para penyelenggara ada di sistem internal pemerintah berikut."));
isi.push(...tbl("Sumber data resmi PPIU dan PIHK", [30, 70],
  ["Sumber", "Cara memanfaatkannya"],
  [
    ["Pengumuman kanwil per provinsi", "Situs kanwil Kementerian Haji dan Umrah per daerah (mis. jakarta.haji.go.id, jatim.haji.go.id) memuat pengumuman daftar PPIU dan PIHK berwenang per tahun — biasanya berupa PDF yang bisa diunduh dan disalin isinya ke template."],
    ["PPID Kementerian Haji dan Umrah", "Melalui formulir permintaan informasi publik di haji.go.id, minta rekap daftar penyelenggara terdaftar SISKOPATUH terbaru; sebagai informasi publik, permintaan semacam ini lazim dikabulkan dan biasanya diberikan dalam Excel."],
    ["SIMPU (simpu.kemenag.go.id)", "Untuk memvalidasi perusahaan satu per satu — cocok sebagai pemeriksa silang nomor izin sebelum data kamu terbitkan."],
  ]));
isi.push(body("Skala datanya besar: tercatat sekitar 3.600-an PPIU terdaftar di SISKOPATUH per September 2026, dan ratusan PIHK lewat SK Menteri per tahun. Karena itu realistislah — mulai dari provinsi atau daftar terbitan terbaru yang paling relevan dengan target pengunjung portalmu, lalu tumbuh bertahap."));
isi.push(body("Cara tercepat kalau kamu sudah memegang file sumber: kirim saja file PDF, Excel, atau bahkan foto pengumumannya ke asisten AI di chat ini. Daftar di dalamnya akan diekstrak, dirapikan sesuai format CSV template, dan diimpor untukmu — kamu tinggal memeriksa hasilnya di portal."));

// ── LAMPIRAN ──
isi.push(h1("Lampiran A — Spesifikasi Kolom CSV (Lembar Acuan)"));
isi.push(body("Halaman ini sengaja dibuat ringkas agar bisa dicetak dan ditempel di samping meja. Urutan kolom di baris 1 CSV harus persis seperti ini:"));
isi.push(cmd("name,type,city,province,licenseNo,phone,email,website,description,status,memberSince"));
isi.push(...tbl("Ringkasan spesifikasi kolom", [18, 14, 42, 26],
  ["Kolom", "Wajib", "Bila dikosongkan", "Nilai yang diizinkan khusus"],
  [
    ["name", "Ya", "Baris ditolak", "Bebas; disarankan nama resmi badan hukum"],
    ["type", "Ya", "Baris ditolak", "PPIU · PIHK · KBIHU · IPHI · TRAVEL_WISATA"],
    ["city", "Tidak", "Nasional", "Bebas"],
    ["province", "Tidak", "Indonesia", "Bebas"],
    ["licenseNo", "Tidak", "—", "Bebas; contoh UU-562/2025"],
    ["phone", "Tidak", "kosong", "Bebas"],
    ["email", "Tidak", "kosong", "Format email"],
    ["website", "Tidak", "kosong", "Diawali https://"],
    ["description", "Tidak", "kosong", "Bebas; boleh memuat koma"],
    ["status", "Tidak", "TERVERIFIKASI", "TERVERIFIKASI · PENDING · SUSPENDED"],
    ["memberSince", "Tidak", "2026", "Angka tahun 4 digit"],
  ]));

isi.push(h1("Lampiran B — Lembar Catatan Perintah (Cheat Sheet)"));
isi.push(body("Semua perintah dalam panduan ini, dirangkum dalam satu tempat. Ganti db/data-kamu.csv dengan nama file milikmu."));
isi.push(...tbl("Perintah penting", [52, 48],
  ["Perintah", "Fungsinya"],
  [
    ["bun --version", "Memastikan alat impor terpasang."],
    ["bun scripts/import-members.ts db/data-kamu.csv --dry-run", "Uji coba: membaca dan memeriksa CSV tanpa mengubah database."],
    ["bun scripts/import-members.ts db/data-kamu.csv", "Impor sungguhan: menambah data baru dan memperbarui data lama."],
    ["bash .zscripts/dev.sh", "Menjalankan portal MUHDIN di komputer ini (untuk melihat hasilnya di peramban)."],
  ]));
isi.push(body("Terakhir, satu kebiasaan kecil yang menyelamatkan: sebelum impor besar-besaran, salin dulu file db/custom.db ke tempat aman. Dengan begitu apa pun yang terjadi, portal selalu punya jalan kembali. Selamat mengimpor — semoga baris-barismu selalu hijau dan Dilewati: 0."));

// ═════════════════════════════════════════════════════════════════════════════
// DOKUMEN
// ═════════════════════════════════════════════════════════════════════════════
const numberingConfigs = ["num-terminal-win", "num-save-win", "num-cms-cek"].map((ref) => ({
  reference: ref,
  levels: [{
    level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 640, hanging: 360 } } },
  }],
}));

const doc = new Document({
  creator: "MUHDIN.id",
  title: "Tutorial Lengkap Impor CSV — Database Anggota MUHDIN.id",
  styles: {
    default: {
      document: {
        run: { font: F_BODY, size: 22, color: "000000" },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: F_BODY, size: 32, bold: true, color: P.primary },
        paragraph: { spacing: { before: 400, after: 160, line: 312 }, outlineLevel: 0 },
      },
      heading2: {
        run: { font: F_BODY, size: 26, bold: true, color: P.primary },
        paragraph: { spacing: { before: 260, after: 120, line: 312 }, outlineLevel: 1 },
      },
    },
  },
  numbering: { config: numberingConfigs },
  sections: [
    { // Section 1 — Cover (margin 0, tanpa footer/header)
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: buildCoverR1({
        title: "Tutorial Lengkap Impor CSV",
        subtitle: "Panduan langkah demi langkah memasukkan data anggota PPIU & PIHK ke database portal — ditulis khusus untuk pemula",
        englishLabel: "PANDUAN OPERASIONAL",
        metaLines: [
          "Dokumen: TUTORIAL-LENGKAP-Impor-CSV-MUHDIN · Versi 1.0 · 8 November 2026",
          "Portal: MUHDIN.id v12.5.0 «SINERGI» · Database: db/custom.db (SQLite)",
          "Peralatan: Template-Import-CSV-MUHDIN.xlsx + scripts/import-members.ts",
          "Level: Pemula — setiap klik dan perintah dijelaskan",
        ],
        footerLeft: "MUHDIN.id — Portal Digital Ekosistem Umrah & Haji Indonesia",
        footerRight: "November 2026",
        palette: { bg: P.bg, titleColor: P.cover.titleColor, subtitleColor: P.cover.subtitleColor,
                   metaColor: P.cover.metaColor, accent: P.accent, footerColor: P.cover.footerColor },
      }),
    },
    { // Section 2 — Daftar isi (angka Romawi)
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN },
        },
      },
      headers: { default: pageHeader() },
      footers: { default: pageFooter() },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 480, after: 360 },
          children: [new TextRun({ text: "DAFTAR ISI", bold: true, size: 32, color: P.primary, font: F_BODY })],
        }),
        new TableOfContents("Daftar isi", { hyperlink: true, headingStyleRange: "1-2" }),
        new Paragraph({
          spacing: { before: 200 },
          children: [new TextRun({
            text: "Catatan: daftar isi ini dibuat dengan field code. Setelah dokumen diedit, klik kanan daftar isi lalu pilih \"Update Field\" agar nomor halamannya akurat.",
            italics: true, size: 18, color: "888888", font: F_BODY,
          })],
        }),
      ],
    },
    { // Section 3 — Isi (angka Arab mulai 1)
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      headers: { default: pageHeader() },
      footers: { default: pageFooter() },
      children: isi,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/home/z/my-project/download/TUTORIAL-LENGKAP-Impor-CSV-MUHDIN.docx", buf);
  console.log("OK → TUTORIAL-LENGKAP-Impor-CSV-MUHDIN.docx");
});
