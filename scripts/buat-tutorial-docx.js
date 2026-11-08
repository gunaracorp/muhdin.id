/**
 * buat-tutorial-docx.js — susun dokumen TUTORIAL-LENGKAP-Impor-CSV-MUHDIN.docx
 * Jalankan: node scripts/buat-tutorial-docx.js
 */
const {
  Document, Packer, Paragraph, TextRun, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, TableOfContents, buildCoverR4, h1, h2, body, bullet, bulletDash,
  note, tbl, B, BB, CODE, P, FONT_B, FONT_H, fs,
} = require("./tutorial-docx-lib.js");

const OUT = "/home/z/my-project/download/TUTORIAL-LENGKAP-Impor-CSV-MUHDIN.docx";

// ════════════════════════ ISI DOKUMEN ════════════════════════
const isi = [];

// ── 1. Ringkasan cepat ──
isi.push(h1("1. Ringkasan Cepat (Baca 3 Menit, Langsung Bisa)"));
isi.push(body([
  B("Dokumen ini memandu Anda memasukkan data "), BB("PPIU"), B(" (Penyelenggara Perjalanan Ibadah Umrah) dan "),
  BB("PIHK"), B(" (Penyelenggara Ibadah Haji Khusus) ke portal MUHDIN.id memakai berkas CSV — tanpa perlu keahlian teknis. "),
  B("Semua dilakukan dengan tombol "), BB("Impor CSV"), B(" di CMS (panel admin) portal."),
]));
isi.push(body([
  B("Intinya hanya tiga langkah: "), BB("(1) siapkan berkas CSV"), B(" — mulai dari template resmi atau konversi otomatis dari sheet Master Anda; "),
  BB("(2) unggah di CMS"), B(" — menu Direktori Anggota, klik Impor CSV, pilih berkas; "),
  BB("(3) periksa hasil"), B(" — sistem melaporkan berapa baris masuk, diperbarui, atau ditolak beserta alasannya per baris."),
]));
isi.push(...tbl("Tabel 1 — Berkas pendamping yang sudah disiapkan untuk Anda", ["Berkas", "Fungsi"], [
  ["Template-Impor-Anggota-PPIU-PIHK.csv", "Template resmi impor Direktori Anggota (4 baris contoh, tinggal diganti)"],
  ["Template-Impor-Registri-Izin.csv", "Template impor Registri Izin / compliance (kolom mengikuti sheet Master)"],
  ["Template-Impor-Pendaftaran-Anggota.csv", "Template antrian pendaftaran anggota baru (perlu disetujui admin)"],
  ["Template-Master-PPIU-PIHK.xlsx", "Versi Excel dengan dropdown anti-salah (4 sheet: READ ME, Anggota, Registri Izin, Pendaftaran)"],
  ["scripts/master-ke-csv.py", "Konverter otomatis: sheet Master Excel → CSV siap impor (satu perintah)"],
], [3800, 5700]));
isi.push(note([
  BB("Prinsip paling penting: ", { size: 20 }),
  B("impor bersifat cerdas dan aman diulang. Baris dengan nomor izin (atau NIB) yang sama TIDAK diduplikasi — datanya malah diperbarui. Jadi Anda bisa mengimpor versi terbaru kapan saja tanpa takut data ganda.", { size: 20 }),
]));

// ── 2. Ke mana data masuk ──
isi.push(h1("2. Pahami Dulu: Ke Mana Data Anda Masuk?"));
isi.push(body([
  B("Portal MUHDIN punya tiga \u201ctempat\u201d berbeda untuk data penyelenggara. Menentukan tujuan yang tepat sejak awal membuat seluruh proses lancar:"),
]));
isi.push(...tbl("Tabel 2 — Tiga tujuan data penyelenggara", ["Tujuan", "Isinya", "Kapan Dipakai"], [
  ["Direktori Anggota (modul Anggota)", "Daftar publik PPIU/PIHK/KBIHU/IPHI/Travel Wisata yang tampil di menu Anggota dan halaman Verifikasi", "Data utama perusahaan: nama, jenis, kota, nomor izin, kontak. Inilah target utama tutorial ini"],
  ["Pendaftaran (modul Pendaftaran)", "Antrian calon anggota berkode tiket MHD-XXXXXX yang menunggu disetujui verifikator", "Calon anggota baru yang belum lolos verifikasi; setelah disetujui otomatis pindah ke Direktori"],
  ["Registri Izin (modul Compliance)", "Perizinan per NIB: dokumen NIB, Akta, NPWP, izin PPIU/PIHK + masa berlaku — bahan audit Pindai Izin 360\u00b0", "Data legalitas lengkap untuk pemantauan kepatuhan sekretariat"],
], [2600, 3600, 3300]));
isi.push(body([
  B("Satu perusahaan boleh berada di Direktori Anggota sekaligus Registri Izin — keduanya saling melengkapi: direktori untuk publik, registri untuk audit internal. "),
  B("Baris berjenis Maskapai, Hotel, Transport, dan mitra rantai pasok lain "), BB("tidak"), B(" masuk Direktori Anggota (mereka bukan penyelenggara), tetapi tetap bisa masuk Registri Izin."),
]));

// ── 3. Menyiapkan data dari sheet Master ──
isi.push(h1("3. Menyiapkan Data dari Sheet Master"));
isi.push(body([
  B("File "), BB("Master_Penyelenggara_Haji_Umrah.xlsx"), B(" (52 kolom) adalah sumber data terlengkap: identitas, izin, mitra, hingga skor risiko. "),
  B("Ada dua cara mengubahnya menjadi CSV siap impor: "), BB("cara otomatis (disarankan)"), B(" dan cara manual (Bab 4)."),
]));
isi.push(h2("3.1 Cara Otomatis — Konverter master-ke-csv.py"));
isi.push(body([
  B("Buka "), BB("Terminal / Command Prompt"), B(" di folder proyek MUHDIN, lalu jalankan satu perintah:"),
]));
isi.push(new Paragraph({
  spacing: { line: 312, after: 160 },
  children: [CODE("python3 scripts/master-ke-csv.py")],
}));
isi.push(body([
  B("Konverter akan membaca sheet "), BB("Master"), B(", lalu menghasilkan dua berkas di folder "),
  CODE("download/hasil-master/"), B(": "),
  BB("anggota-dari-master.csv"), B(" (hanya baris PPIU/PIHK/KBIHU/IPHI/Travel Wisata) dan "),
  BB("registri-dari-master.csv"), B(" (baris yang memiliki NIB). Hasil nyata dari sheet Master Anda: 13 baris terbaca \u2192 3 anggota + 7 registri, sementara 10 baris mitra rantai pasok dilewati dengan alasan yang jelas di layar."),
]));
isi.push(bulletDash([BB("Kolom gabungan dipecah otomatis. "), B("Isi kolom telepon_email_web seperti \u201c021-5550101;info@pt.id;www.pt.id\u201d langsung dipisah menjadi telepon, email, dan website.")]));
isi.push(bulletDash([BB("Status diterjemahkan. "), B("\u201cAktif\u201d \u2192 TERVERIFIKASI, \u201cDalam Verifikasi\u201d \u2192 PENDING, \u201cDicabut/Nonaktif\u201d \u2192 SUSPENDED.")]));
isi.push(bulletDash([BB("Kota diambil dari alamat. "), B("Bagian akhir alamat_pusat (setelah koma terakhir) menjadi kolom kota — periksa dan betulkan bila kurang pas.")]));
isi.push(bulletDash([BB("Rating dari skor. "), B("kelayakan_score 100 \u2192 rating 5.0; skor 82 \u2192 4.1 (skor dibagi 20).")]));
isi.push(bulletDash([BB("Tanggal dirapikan. "), B("Format apa pun (2027-03-31, 31/08/2026, bahkan angka seri Excel) otomatis menjadi YYYY-MM-DD.")]));
isi.push(bulletDash([BB("Placeholder dibuang. "), B("Sel berisi tanda \u201c-\u201d atau \u201cN/A\u201d dianggap kosong — enam baris Master tanpa NIB otomatis dikeluarkan dari CSV registri agar tidak tergabung menjadi satu data hantu.")]));
isi.push(note([B("Setelah konverter selesai, selalu buka kedua CSV sebentar di Excel/Google Sheets untuk memastikan kolom kota dan provinsi sudah sesuai harapan sebelum diimpor.", { size: 20 })]));

// ── 4. Mengisi template CSV ──
isi.push(h1("4. Mengisi Template CSV (Cara Manual)"));
isi.push(body([
  B("Buka "), BB("Template-Impor-Anggota-PPIU-PIHK.csv"), B(" dengan Excel/Google Sheets. Baris pertama adalah header — "),
  BB("jangan pernah mengubah nama header"), B(". Mulai baris kedua, isi data Anda (contoh baris boleh dihapus). Kolom wajib bertanda \u2713:"),
]));
isi.push(...tbl("Tabel 3 — Kolom CSV Direktori Anggota", ["Kolom", "Wajib", "Format & Contoh"], [
  ["name", "\u2713", "Nama resmi sesuai akta, mis. PT Barokah Wisata Nusantara"],
  ["type", "\u2713", "Salah satu: PPIU / PIHK / KBIHU / IPHI / TRAVEL_WISATA"],
  ["city", "\u2713", "Kota/kabupaten, mis. Jakarta Selatan"],
  ["licenseNo", "\u2713", "Nomor izin Kemenag, mis. U-537/2024 atau PIHK-088/2024"],
  ["province", "", "Provinsi, mis. DKI Jakarta"],
  ["phone", "", "Telepon/WhatsApp, mis. 0812-3456-7890"],
  ["email", "", "Email resmi — akan divalidasi formatnya"],
  ["website", "", "Situs, mis. https://barokahwisata.id"],
  ["description", "", "Deskripsi singkat layanan (boleh berisi koma asal dibungkus tanda kutip)"],
  ["status", "", "TERVERIFIKASI / PENDING / SUSPENDED — kosong berarti TERVERIFIKASI"],
  ["memberSince", "", "Tahun bergabung, mis. 2024"],
  ["rating", "", "Angka 1.0-5.0 — kosong berarti 4.5"],
], [1700, 800, 7000]));
isi.push(h2("4.1 Nama Kolom Bebas — Sistemnya Pintar"));
isi.push(body([
  B("Anda tidak wajib memakai nama kolom Inggris di atas. Importer mengenali nama kolom Indonesia dari sheet Master secara otomatis, termasuk variasinya:"),
]));
isi.push(...tbl("Tabel 4 — Kolom sheet Master yang dikenali langsung oleh importer", ["Kolom Master Anda", "Masuk ke"], [
  ["nama_resmi / nama_dagang / nama_pt", "name"],
  ["jenis_entitas / jenis / tipe", "type (PPIU, PIHK, dst.)"],
  ["kota / kotakabupaten", "city"],
  ["provinsi / prov", "province"],
  ["nomor_izin_Kemenag / no_izin", "licenseNo"],
  ["telepon / no_hp / whatsapp", "phone"],
  ["email / surel", "email"],
  ["website / situs / url", "website"],
  ["deskripsi / keterangan", "description"],
  ["status_izin / status", "status (diterjemahkan otomatis)"],
  ["anggota_sejak / tahun_masuk", "memberSince"],
  ["penilaian / skor", "rating"],
  ["telepon_email_web (gabungan)", "dipecah ke phone + email + website"],
  ["alamat_pusat + wilayah_layanan", "menjadi description bila deskripsi kosong"],
], [4400, 5100]));
isi.push(h2("4.2 Aturan Menulis Sel yang Aman"));
isi.push(bullet([BB("Koma dalam isi sel"), B(" — bungkus seluruh isi dengan tanda kutip ganda: "), CODE("\u201cUmrah Reguler, Plus Turki\u201d"), B(".")]));
isi.push(bullet([BB("Angka nol di depan"), B(" — nomor seperti 0812 bisa hilang nolnya di Excel. Format kolom sebagai Text (klik kanan \u2192 Format Cells \u2192 Text) sebelum mengetik.")]));
isi.push(bullet([BB("Jangan pakai tanda \u201c-\u201d sebagai isi"), B(" — tanda hubung dianggap kosong. Kosongkan saja sel yang tidak ada isinya.")]));
isi.push(bullet([BB("Satu baris = satu perusahaan"), B(". Hapus baris contoh yang tidak dipakai, jangan biarkan kosong setengah-setengah.")]));
isi.push(bullet([BB("Jenis lain selain lima jenis resmi"), B(" (mis. Maskapai, Hotel) akan ditolak dengan pesan jelas — itulah pengaman agar direktori tetap murni penyelenggara.")]));

// ── 5. Menyimpan CSV ──
isi.push(h1("5. Menyimpan sebagai CSV dengan Benar"));
isi.push(h2("5.1 Dari Google Sheets"));
isi.push(bullet("1. File \u2192 Download \u2192 Comma Separated Values (.csv). Selesai — Google Sheets otomatis UTF-8 dan pemisah koma."));
isi.push(h2("5.2 Dari Excel"));
isi.push(bullet("1. File \u2192 Save As \u2192 pilih tipe \u201cCSV UTF-8 (Comma delimited)\u201d bila tersedia."));
isi.push(bullet("2. Bila hanya ada \u201cCSV (Comma delimited)\u201d biasa, tetap boleh dipakai — tetapi karakter khusus bisa rusak; periksa hasilnya di pratinjau impor."));
isi.push(bullet("3. Excel berbahasa Indonesia kadang memakai pemisah titik-koma (;). Tenang — importer MUHDIN menerima koma, titik-koma, maupun TAB secara otomatis."));
isi.push(body([
  B("Simpan "), BB("satu sheet = satu berkas CSV"), B(". Excel tidak bisa menyimpan beberapa sheet dalam satu CSV; impor sheet Anggota dan Registri Izin sebagai dua berkas terpisah."),
]));

// ── 6. Langkah impor ──
isi.push(h1("6. Langkah Impor di CMS (Direktori Anggota)"));
isi.push(bullet([BB("1. Masuk CMS. "), B("Buka portal \u2192 menu Portal Mitra / alamat "), CODE("#/admin"), B(". Masuk dengan akun admin (bawaan: "), CODE("admin@muhdin.web.id"), B("). Ganti sandi bawaan sebelum portal dipublikasikan!")]));
isi.push(bullet([BB("2. Buka menu Direktori Anggota "), B("di sidebar kiri. Perhatikan toolbar kanan atas kini memiliki dua tombol: "), BB("Impor CSV"), B(" dan Ekspor CSV.")]));
isi.push(bullet([BB("3. Klik Impor CSV. "), B("Jendela dialog terbuka dengan petunjuk kolom untuk modul tersebut.")]));
isi.push(bullet([BB("4. Pilih berkas. "), B("Klik kolom Berkas CSV lalu pilih file dari komputer Anda — atau salin-tempel isi CSV ke kotak teks di bawahnya.")]));
isi.push(bullet([BB("5. Cek pratinjau. "), B("Tiga baris pertama ditampilkan; pastikan kolomnya tidak bergeser (tanda kutip salah adalah penyebab paling umum).")]));
isi.push(bullet([BB("6. Klik Impor Sekarang "), B("dan tunggu beberapa detik.")]));
isi.push(bullet([BB("7. Baca ringkasan. "), B("Angka hijau = baris baru; biru = diperbarui; merah = dilewati. Daftar kesalahan per baris tampil di bawahnya sehingga mudah diperbaiki lalu diimpor ulang.")]));

// ── 7. Membaca hasil ──
isi.push(h1("7. Membaca Hasil Impor"));
isi.push(body([
  B("Contoh hasil nyata saat pengujian dengan template resmi (4 baris): percobaan pertama melaporkan "), BB("4 baru, 0 diperbarui, 0 dilewati"),
  B(". Impor ulang berkas yang sama melaporkan "), BB("0 baru, 4 diperbarui"),
  B(" — bukti sistem mengenali nomor izin yang sama. Sementara berkas uji berisi baris rusak melaporkan: "),
]));
isi.push(bullet([CODE("Baris 3: jenis \u201cMaskapai\u201d tidak dikenal (gunakan PPIU/PIHK/KBIHU/IPHI/Travel Wisata)")]));
isi.push(bullet([CODE("Baris 4: kolom wajib kosong — butuh nama, jenis, kota, dan nomor izin")]));
isi.push(body([
  B("Nomor baris mengacu pada baris di berkas CSV (baris 1 = header, data pertama = baris 2). Perbaiki baris yang disebut, simpan, lalu impor ulang — baris yang sudah benar tidak akan terduplikasi."),
]));
isi.push(body([B("Untuk melihat data di sisi publik: buka menu "), BB("Anggota"), B(" atau halaman "), BB("Verifikasi"), B(", ketik nama perusahaan atau nomor izinnya. Lencana "), BB("TERVERIFIKASI"), B(" tampil untuk anggota aktif.")]));

// ── 8. Registri izin ──
isi.push(h1("8. Impor Registri Izin (Fitur Lanjutan)"));
isi.push(body([
  B("Modul "), BB("Compliance"), B(" memiliki tombol Impor CSV tersendiri. CSV-nya memakai kolom sheet Master apa adanya — syarat wajib hanya "),
  BB("NIB"), B(" (Nomor Induk Berusaha, kunci pembaruan) dan "), BB("nama_resmi"), B(". Kolom opsional: jenis_entitas, nomor_izin_Kemenag, masa_berlaku_izin, nomor_badan_hukum (akta), NPWP, akreditasi, kota, provinsi, telepon_email_web, catatan_risiko."),
]));
isi.push(body([
  B("Setiap baris otomatis membangun dokumen izin perusahaan. Dari pengujian nyata, satu baris Master menghasilkan empat dokumen: "),
  BB("NIB"), B(" (8123456789010001), "), BB("AKTA"), B(" (AHU-0011234), "), BB("NPWP"), B(" (01.234.567.8-901.001), dan "),
  BB("izin PPIU"), B(" (U-537/2024, berlaku hingga 2027-03-14). Setelah registri terisi, klik "),
  BB("JALANKAN AUDIT"), B(" untuk menilai seluruh perusahaan dengan Pindai Izin 360\u00b0 (skor, grade A-E, temuan berprioritas)."),
]));
isi.push(note([
  B("Baris tanpa NIB (atau berisi \u201c-\u201d) sengaja ditolak oleh importer — NIB adalah kunci unik pembaruan. Lengkapi NIB dari OSS terlebih dahulu, atau masukkan baris tersebut lewat Direktori Anggota yang tidak mewajibkan NIB.", { size: 20 }),
]));

// ── 9. Impor lainnya ──
isi.push(h1("9. Impor Pendaftaran & Data Lain"));
isi.push(body([
  B("Modul "), BB("Pendaftaran"), B(" memakai kolom: orgName, type, contactName, email, phone, city (wajib) plus province, licenseNo, message (opsional). Setiap baris impor otomatis mendapat "),
  BB("kode tiket unik MHD-XXXXXX"), B(" yang bisa dilacak publik di halaman pelacakan — sebelumnya fitur impor ini hanya mampu satu baris dan kini sudah diperbaiki."),
]));
isi.push(body([
  B("Tombol Impor CSV juga tersedia untuk "), BB("Subscriber"), B(" (kolom email) dan "), BB("Artikel"), B(" (kolom title, slug, excerpt, content, category, dst.) — cara cepat memindahkan konten dari berkas lama Anda."),
]));

// ── 10. Aturan & validasi ──
isi.push(h1("10. Aturan & Validasi Penting"));
isi.push(...tbl("Tabel 5 — Terjemahan status otomatis", ["Anda menulis", "Tersimpan sebagai"], [
  ["Aktif / Active / Terverifikasi / Verified / Disetujui", "TERVERIFIKASI"],
  ["Dalam Verifikasi / Pending / Menunggu / Proses / Tinjauan", "PENDING"],
  ["Dicabut / Nonaktif / Ditangguhkan / Suspensi / Bermasalah", "SUSPENDED"],
  ["(kosong)", "TERVERIFIKASI"],
], [5700, 3800]));
isi.push(bulletDash([BB("Kunci pembaruan. "), B("Direktori Anggota memakai licenseNo; Registri memakai NIB. Pastikan nomornya konsisten antar-impor agar data terbarui, bukan terduplikasi.")]));
isi.push(bulletDash([BB("Batas kecepatan. "), B("Maksimal 5 impor per menit per jaringan untuk melindungi server. Bila muncul \u201cTerlalu banyak impor\u201d, tunggu satu menit.")]));
isi.push(bulletDash([BB("Keamanan data. "), B("Impor hanya bisa dilakukan akun ADMIN/SUPER_ADMIN, dan setiap impor tercatat di log audit portal.")]));

// ── 11. Pemeriksaan hasil ──
isi.push(h1("11. Memeriksa Hasil & Siklus Ekspor-Impor"));
isi.push(bullet([BB("Di CMS: "), B("gunakan kotak pencarian Direktori Anggota (nama/kota/nomor izin).")]));
isi.push(bullet([BB("Di sisi publik: "), B("menu Anggota dengan filter jenis PPIU/PIHK, atau halaman Verifikasi dengan nomor izin.")]));
isi.push(bullet([BB("Siklus ekspor\u2192edit\u2192impor: "), B("klik Ekspor CSV untuk mengunduh seluruh anggota (format berlabel Indonesia), perbaiki di Excel, lalu impor kembali — kolom ekspor dikenali importer, jadi siklus ini mulus untuk pembaruan massal.")]));

// ── 12. Troubleshooting ──
isi.push(h1("12. Pemecahan Masalah (Troubleshooting)"));
isi.push(...tbl("Tabel 6 — Masalah umum dan solusinya", ["Gejala", "Penyebab & Solusi"], [
  ["\u201cKolom `email` wajib ada\u201d / \u201cKolom wajib kosong\u201d", "Header tidak persis sesuai daftar kolom, atau sel wajib kosong/berisi \u201c-\u201d. Perbaiki header dan isi sel wajib."],
  ["\u201cjenis \u2026 tidak dikenal\u201d", "Isi kolom type bukan lima jenis resmi. Tulis PPIU / PIHK / KBIHU / IPHI / TRAVEL_WISATA."],
  ["\u201cemail tidak valid\u201d", "Format email salah atau berisi spasi. Periksa ejaan; kosongkan bila memang tidak ada."],
  ["\u201cKolom `nib` wajib ada untuk impor registri\u201d", "CSV registri tanpa kolom NIB. Tambahkan kolom NIB atau gunakan impor Direktori Anggota."],
  ["\u201cTerlalu banyak impor\u201d (429)", "Batas 5 impor/menit. Tunggu satu menit lalu lanjutkan."],
  ["Pratinjau berantakan / kolom bergeser", "Tanda kutip tidak berpasangan atau pemisah ganda. Buka CSV di editor teks, rapikan baris yang bermasalah."],
  ["Nomor izin berubah (nol hilang / jadi tanggal)", "Excel mengubah sel otomatis. Format kolom sebagai Text sebelum mengetik, atau isi lewat Google Sheets."],
  ["Karakter aneh (\u00e2\u20ac\u2122, kotak-kotak)", "Berkas bukan UTF-8. Simpan ulang sebagai CSV UTF-8 (Excel) atau unduh ulang dari Google Sheets."],
  ["Baris masuk dua kali", "Nomor izin/NIB berbeda tulisan (spasi, huruf besar-kecil, tanda baca). Samakan penulisan lalu hapus duplikat di CMS."],
  ["Impor berhasil tapi belum tampil di publik", "Direktori publik hanya menampilkan status TERVERIFIKASI. Ubah status di CMS bila memang sudah diverifikasi."],
], [3600, 5900]));

// ── 13. Sumber resmi ──
isi.push(h1("13. Sumber Data Resmi PPIU & PIHK"));
isi.push(body([
  B("Untuk melengkapi data di luar sheet Master Anda, gunakan kanal resmi berikut. Aplikasi "),
  BB("Haji Pintar"), B(" dari Kementerian Haji dan Umrah adalah aplikasi layanan jamaah (cek porsi, manasik, info) dan "),
  BB("tidak"), B(" memuat basis data perusahaan — jangan jadikan sumber impor."),
]));
isi.push(bulletDash([BB("SISKOPATUH"), B(" (siskopatuh.haji.go.id) — sistem pengawasan resmi; lebih dari 3.600 PPIU terdaftar.")]));
isi.push(bulletDash([BB("SIMPU"), B(" (simpu.kemenag.go.id) — pencarian legalitas per perusahaan, cocok untuk validasi satu per satu.")]));
isi.push(bulletDash([BB("Kanwil per provinsi"), B(" ({provinsi}.haji.go.id) — pengumuman resmi daftar PPIU & PIHK per tahun hijriah.")]));
isi.push(bulletDash([BB("PPID Kementerian Haji dan Umrah"), B(" — permintaan resmi rekap daftar (wajib dikabulkan sesuai UU Keterbukaan Informasi Publik; umumnya diberikan dalam Excel).")]));

// ── 14. Lampiran ──
isi.push(h1("14. Lampiran: Peta Kolom Sheet Master"));
isi.push(body([
  B("Tabel berikut merangkum keberangkatan seluruh 41 kolom data sheet Master (11 kolom formula risiko tidak diimpor karena dihitung ulang oleh sistem):"),
]));
const masterMap = [
  ["id_entitas", "\u2014 (kode internal, tidak diimpor)"],
  ["nama_resmi", "Anggota: name \u00b7 Registri: nama"],
  ["nama_dagang", "Anggota: name (cadangan)"],
  ["jenis_entitas", "Anggota: type \u00b7 Registri: penentu jenis izin"],
  ["negara_yurisdiksi", "\u2014 (asumsi Indonesia)"],
  ["nomor_badan_hukum", "Registri: dokumen AKTA"],
  ["NIB", "Registri: kunci perusahaan + dokumen NIB"],
  ["NPWP", "Registri: dokumen NPWP"],
  ["nomor_izin_Kemenag", "Anggota: licenseNo \u00b7 Registri: dokumen PPIU/PIHK"],
  ["tanggal_izin", "Anggota: memberSince (tahunnya)"],
  ["masa_berlaku_izin", "Registri: masa berlaku dokumen izin"],
  ["status_izin", "Anggota: status (diterjemahkan) \u00b7 Registri: catatan"],
  ["alamat_pusat", "Anggota: description + kota (bagian akhir)"],
  ["cabang", "\u2014 (belum dipetakan)"],
  ["kontak_pic", "Anggota: description (\u201cKontak PIC: \u2026\u201d)"],
  ["telepon_email_web", "Anggota & Registri: phone + email + website (dipecah)"],
  ["wilayah_layanan", "Anggota: description (\u201cWilayah layanan: \u2026\u201d)"],
  ["mitra_Saudi \u2014 bank_partner", "\u2014 (relasi rantai pasok, tahap berikutnya)"],
  ["platform_tech", "\u2014"],
  ["jumlah_petugas \u2014 range_harga", "\u2014 (profil bisnis)"],
  ["rekor_sanksi / keluhan_publik", "\u2014 (dinilai engine audit, bukan impor)"],
  ["audit_terakhir \u2014 dokumen_bukti", "\u2014 (referensi berkas)"],
  ["kelayakan_score", "Anggota: rating (skor \u00f7 20)"],
];
isi.push(...tbl("Tabel 7 — Peta 41 kolom Master", ["Kolom di Sheet Master", "Dikirim ke"], masterMap, [3800, 5700]));
isi.push(body([
  B("Kolom yang belum dipetakan tetap tersimpan aman di file Excel Anda dan akan menyusul di pengembangan berikutnya (relasi mitra rantai pasok dan riwayat insiden)."),
]));

// ════════════════════════ DOKUMEN ════════════════════════
const footerArabic = new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080", font: FONT_B })],
  })],
});
const footerRoman = new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080", font: FONT_B })],
  })],
});
const headerBody = new Header({
  children: [new Paragraph({
    alignment: AlignmentType.RIGHT,
    border: { bottom: { style: 1, size: 4, color: P.table.innerLine } },
    children: [new TextRun({ text: "Panduan Impor CSV — MUHDIN.id «SINERGI»", size: 16, color: "909090", font: FONT_B })],
  })],
});

const doc = new Document({
  creator: "MUHDIN.id",
  title: "Panduan Lengkap Impor CSV PPIU & PIHK — MUHDIN.id",
  styles: {
    default: {
      document: { run: { font: FONT_B, size: 22, color: P.body }, paragraph: { spacing: { line: 312 } } },
    },
  },
  features: { updateFields: true },
  sections: [
    // Seksi 1 — cover (tanpa nomor halaman)
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } } },
      children: buildCoverR4({
        title: "Panduan Impor CSV",
        englishLabel: "MUHDIN.ID",
        subtitle: "Memasukkan Data PPIU & PIHK dari Sheet Master — Untuk Pemula",
        metaLines: [
          "Dokumen  : Tutorial Lengkap Langkah demi Langkah",
          "Portal   : MUHDIN.id «SINERGI» v12.6",
          "Modul    : Direktori Anggota · Pendaftaran · Registri Izin",
          "Tanggal  : 8 November 2026",
        ],
        footerLeft: "Masyarakat Umroh Haji Digital Indonesia",
        footerRight: "muhdin.web.id",
        palette: P,
      }),
    },
    // Seksi 2 — daftar isi (angka romawi)
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 }, pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN } } },
      footers: { default: footerRoman },
      children: [
        new Paragraph({
          spacing: { before: 200, after: 240 },
          children: [new TextRun({ text: "Daftar Isi", bold: true, size: 32, color: P.primary, font: FONT_H })],
        }),
        new TableOfContents("Daftar Isi", { hyperlink: true, headingStyleRange: "1-2" }),
        new Paragraph({
          spacing: { before: 240 },
          children: [new TextRun({
            text: "Catatan: bila nomor halaman tidak muncul atau bergeser, klik kanan daftar isi \u2192 \u201cUpdate Field\u201d \u2192 \u201cUpdate entire table\u201d.",
            italics: true, size: 18, color: "909090", font: FONT_B,
          })],
        }),
      ],
    },
    // Seksi 3 — isi (angka arab mulai 1)
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 }, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
      headers: { default: headerBody },
      footers: { default: footerArabic },
      children: isi,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("OK — dokumen dibuat:", OUT, `(${(buf.length / 1024).toFixed(1)} KB)`);
});
