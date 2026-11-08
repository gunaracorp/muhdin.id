/**
 * Fase 1 — 20 berita/artikel baru (total 11 lama + 20 = 31).
 * Konten markdown lengkap, slug unik, cover dari aset public/images/.
 * Idempoten: skip bila slug sudah ada.
 */

export type NewArticle = {
  title: string; slug: string; excerpt: string; content: string;
  category: string; cover: string; featured: boolean; views: number;
  author: string; daysAgo: number; // offset dari hari ini
};

const IMG = "/images";

export const NEW_ARTICLES: NewArticle[] = [
  {
    title: "Rakernas I MUHDIN Tetapkan Standar Layanan Tunggal untuk 13 Ekosistem",
    slug: "rakernas-i-muhdin-standar-layanan-tunggal-13-ekosistem",
    excerpt: "Rapat Kerja Nasional perdana menyepakati satu standar pelayanan terukur untuk seluruh kategori anggota — dari PPIU hingga penyedia katering — berlaku mulai gelombang verifikasi 2027.",
    category: "Berita", cover: `${IMG}/command-center.jpg`, featured: true, views: 2140, author: "Sekretariat MUHDIN", daysAgo: 2,
    content: `Jakarta — Rapat Kerja Nasional (Rakernas) pertama MUHDIN ditutup dengan satu kesepakatan besar: **standar layanan tunggal** yang mengikat seluruh 13 ekosistem layanan asosiasi. Dokumen hasil Rakernas ini menjadi rujukan verifikasi anggota gelombang 2027 dan menggantikan pedoman yang sebelumnya bersifat per kategori.

## Pokok-pokok kesepakatan

Pertama, setiap anggota wajib memasang **nomor layanan pengaduan internal** yang terhubung ke command center MUHDIN selama jam operasional. Kedua, seluruh kontrak jamaah wajib mencantumkan empat elemen: harga final, jadwal, hotel yang dijanjikan, dan kanal penyelesaian sengketa. Ketiga, penyelenggara yang mengalami penundaan keberangkatan melebihi tujuh hari wajib melapor dan menawarkan tiga opsi penyelesaian kepada jamaah.

## Reaksi anggota

Perwakilan dari Makassar menyebut standar ini "menyamakan arena". Menurutnya, selama ini persaingan sering tidak sehat karena sebagian penyelenggara menjanjikan hotel yang tidak pernah dikunci. Dengan standar tunggal, jamaah punya dasar menuntut yang sama di semua daerah.

## Jadwal implementasi

Sosialisasi dilakukan berlapis: bimtek daring untuk anggota lama pada bulan pertama, pendampingan DPD untuk anggota baru, lalu audit acak oleh Dewan Verifikasi. Pelanggaran pertama berupa teguran, pelanggaran kedua memengaruhi skor rating publik di direktori anggota.

Rakernas berikutnya dijadwalkan bertepatan dengan puncak musim umrah, dengan agenda utama evaluasi penerapan standar dan penyusunan indeks kepuasan jamaah nasional.`
  },
  {
    title: "DPD MUHDIN Jawa Barat Dilantik, Jaringan Anggota Menembus 100 Penyelenggara",
    slug: "dpd-muhdin-jawa-barat-dilantik-100-penyelenggara",
    excerpt: "Pelantikan DPD Jawa Barat menandai provinsi dengan jaringan anggota terbesar. Target dua tahun: seluruh kabupaten/kota punya titik layanan resmi MUHDIN.",
    category: "Berita", cover: `${IMG}/jamaah-handling.jpg`, featured: false, views: 1320, author: "Tim MUHDIN", daysAgo: 5,
    content: `Bandung — Dewan Pimpinan Daerah (DPD) MUHDIN Jawa Barat resmi dilantik dalam acara serentak bersama pelantikan enam DPD lainnya. Jabar menjadi provinsi dengan jumlah anggota tertinggi: lebih dari 100 penyelenggara aktif dari lima kategori keanggotaan.

## Tugas pertama DPD

Ketua DPD memaparkan tiga prioritas kerja: **verifikasi lapangan** anggota baru se-Jabar, pembentukan titik layanan di tiap kabupaten/kota, dan klinik manasik keliling untuk majelis taklim. Klinik manasik ini dirancang gratis bagi komunitas — bagian dari program penguatan literatur ibadah ekosistem.

## Program unggulan

Jabar memperkenalkan kartu layanan anggota digital yang nanti terhubung langsung dengan portal verifikasi nasional. Jamaah cukup memindai kode pada kartu untuk melihat status izin, rating, dan riwayat pengaduan penyelenggara.

## Penguatan Daerah

Sekretariat pusat menegaskan DPD bukan sekadar perwakilan administratif. DPD diberi kewenangan menampung pengaduan tingkat pertama, mengusulkan anggota calon, dan membawahkan pelatihan mutawif daerah. Insentif operasional dihitung dari indeks mutu, bukan sekadar jumlah anggota.

Dengan bertambahnya Jabar, total titik layanan MUHDIN nasional kini menjangkau lebih dari 30 provinsi. Pelantikan gelombang berikutnya menyasar provinsi di kawasan Indonesia Timur.`
  },
  {
    title: "Gelombang II Sertifikasi Tour Leader & Mutawif Dibuka, Kuota 500 Peserta",
    slug: "gelombang-ii-sertifikasi-tour-leader-mutawif-kuota-500",
    excerpt: "Kurikulum 6 modul mencakup fiqih perjalanan, crisis handling, hingga etika pelayanan lansia. Lulusan terdaftar di direktori nasional dan bisa diverifikasi jamaah.",
    category: "Pengumuman", cover: `${IMG}/manasik.jpg`, featured: false, views: 1870, author: "Dewan Edukasi MUHDIN", daysAgo: 8,
    content: `Setelah gelombang pertama menampung 320 peserta, Dewan Edukasi MUHDIN resmi membuka **Gelombang II Sertifikasi Tour Leader & Mutawif** dengan kuota 500 peserta dari seluruh Indonesia.

## Kurikulum enam modul

1. **Fiqih Perjalanan** — masalah umrah/haji dalam berbagai mazhab dan praktik di lapangan
2. **Manajemen Rombongan** — kelembagaan, jadwal, dan pengendalian 40+ jamaah
3. **Crisis Handling** — kehilangan dokumen, jamaah terpisah, kondisi medis darurat
4. **Etika Pelayanan Lansia** — mobilitas, gizi, dan komunikasi lansia
5. **Digital Tooling** — aplikasi Nusuk, portal MUHDIN, dan pelaporan harian
6. **Ujian Praktik** — simulasi perjalanan penuh selama dua hari

## Syarat dan biaya

Peserta disarankan dari anggota MUHDIN atau rekomendasi DPD. Lulusan mendapat sertifikat bernomor terdaftar yang dapat diperiksa jamaah melalui portal Cek Verifikasi — langkah nyata memberantas "mutawif dadakan".

## Cara mendaftar

Pendaftaran melalui formulir resmi di halaman Gabung dengan memilih kategori pelatihan. Kuota tiap DPD dialokasikan proporsional agar seluruh daerah terlayani. Informasi jadwal per angkatan diumumkan melalui kanal resmi sekretariat.`
  },
  {
    title: "Pembaruan Integrasi Nusuk: Permit Umrah Kini Diterbitkan Rata-rata 6 Jam",
    slug: "pembaruan-integrasi-nusuk-permit-umrah-6-jam",
    excerpt: "Setelah penyetelan ulang antrean, durasi terbit permit umrah dari portal MUHDIN turun dari 24 jam menjadi rata-rata 6 jam pada jam kerja Saudi.",
    category: "Berita", cover: `${IMG}/command-center.jpg`, featured: false, views: 1580, author: "Tim Teknologi MUHDIN", daysAgo: 11,
    content: `Tim integrasi Nusuk mengumumkan hasil penyetelan ulang antrean penerbitan permit: **rata-rata waktu terbit kini 6 jam** untuk pengajuan di jam kerja Arab Saudi — turun dari rata-rata 24 jam sebelumnya.

## Apa yang berubah

Penyetelan dilakukan pada tiga titik: deduplikasi data jamaah sebelum pengajuan, pembagian jendela waktu pengajuan per rombongan, dan pembersihan antrean permit bermasalah secara otomatis. Log sinkronisasi kini juga menampilkan alasan penolakan yang lebih jelas sehingga operator cepat memperbaiki data.

## Dampak untuk penyelenggara

Anggota yang sebelumnya mengunggah berkas tiga hari sebelum keberangkatan kini cukup satu hari — dengan syarat data paspor dan foto sesuai spesifikasi. Tingkat penolakan permit turun signifikan berkat validasi awal otomatis.

## Catatan teknis

Permit masih diterbitkan mengikuti ketersediaan slot resmi pemerintah Arab Saudi. Pada puncak musim, jendela slot menipis — penyelenggara disarankan memakai fitur penjadwalan izin di dashboard mitra. Log lengkap tersedia di CMS untuk setiap pengajuan, termasuk jejak waktu hingga detik.`
  },
  {
    title: "MUHDIN Teken Kerja Sama Escrow: Dana Jamaah Dikunci Sampai Ibadah Tuntas",
    slug: "kerja-sama-escrow-dana-jamaah-dikunci-sampai-tuntas",
    excerpt: "Skema rekening bersama memastikan dana jamaah baru dibebaskan ke penyelenggara bertahap mengikuti milestone perjalanan — pelanggaran berarti dana kembali.",
    category: "Berita", cover: `${IMG}/hotel-makkah.jpg`, featured: true, views: 2870, author: "Sekretariat MUHDIN", daysAgo: 14,
    content: `MUHDIN menandatangani kerja sama tata kelola dana jamaah berbasis **rekening escrow** dengan mitra perbankan syariah. Skema ini menjawab salah satu keluhan tertua jamaah: uang sudah lunas, pelayanan tidak jelas.

## Cara kerjanya

Dana jamaah masuk rekening bersama, bukan rekening penyelenggara. Pencairan ke penyelenggara berjalan bertahap mengikuti milestone: penandatanganan kontrak, penerbitan visa, keberangkatan, dan kepulangan. Jika milestone tidak tercapai, dana berhenti dibebaskan dan mekanisme penyelesaian berjalan.

## Siapa yang tercakup

Skema pertama menjangkau anggota PPIU dan PIHK yang lolos verifikasi keuangan: laporan arus kas sehat, tidak ada sengketa aktif, dan asuransi takaful berjalan. Anggota lain dijadwalkan mengikuti dengan pendampingan keuangan dari asosiasi.

## Pesan untuk jamaah

Jamaah kini dapat memilih penyelenggara berlambang **Dana Terlindungi** di direktori. Lambang ini menandakan skema escrow aktif — bukan sekadar klaim brosur. Dewan Verifikasi akan menarik lambang dari anggota yang keluar dari skema tanpa pemberitahuan.

Program ini menjadi bagian dari pilar perlindungan jamaah: transparansi biaya, dana terlindungi, asuransi, dan penyelesaian sengketa.`
  },
  {
    title: "Statistik Umrah 2026: Keberangkatan Rombongan Anggota Naik 34 Persen",
    slug: "statistik-umrah-2026-keberangkatan-naik-34-persen",
    excerpt: "Data agregat dari 57 anggota menunjukkan pertumbuhan tertinggi di kategori umrah keluarga. Rata-rata rating pelayanan naik ke 4,6.",
    category: "Berita", cover: `${IMG}/city-makkah.png`, featured: false, views: 990, author: "Dewan Data MUHDIN", daysAgo: 18,
    content: `Dewan Data MUHDIN merilis agregat keberangkatan semester pertama: total rombongan anggota tumbuh **34 persen** dibanding periode yang sama tahun lalu.

## Sorotan angka

Kategori pertumbuhan tertinggi adalah **umrah keluarga** (naik 52 persen), disusul program umrah lansia (41 persen) dan umrah santri (38 persen). Rata-rata rating pelayanan anggota naik dari 4,4 menjadi 4,6 — indikator bahwa penguatan standar mulai terasa.

## Sebaran daerah

Pertumbuhan tidak lagi terpusat di Jawa. Provinsi dengan pertumbuhan tercepat antara lain Kepulauan Riau, Kalimantan Selatan, dan Maluku Utara — daerah yang setahun lalu belum punya anggota aktif.

## Makna data

Angka ini dihimpun otomatis dari pelaporan harian anggota di portal mitra, bukan survei manual. Dewan Data menegaskan agregat hanya dipublikasikan bila jumlah penyelenggara per provinsi cukup untuk menjaga anonimitas, sejalan dengan komitmen perlindungan data.

Laporan lengkap tersedia bagi anggota melalui dashboard, termasuk pembanding antarwilayah dan prediksi musim sibuk berikutnya.`
  },
  {
    title: "Klinik Manasik Keliling Tahun Ini Sasar 120 Majelis Taklim",
    slug: "klinik-manasik-keliling-sasar-120-majelis-taklim",
    excerpt: "Tim pendamping DPD berkeliling ke majelis taklim dengan modul ringkas dua jam: dari niat ihram sampai etika di Masjidil Haram.",
    category: "Kegiatan", cover: `${IMG}/manasik.jpg`, featured: false, views: 760, author: "Tim MUHDIN", daysAgo: 21,
    content: `Program Klinik Manasik Keliling kembali digulirkan dengan target **120 majelis taklim** hingga akhir tahun. Program ini membawa pendidikan manasik langsung ke komunitas — tanpa biaya bagi peserta.

## Format dua jam

Sesi dirancang ringkas: satu jam materi inti (niat ihram, tawaf, sa'i, tahallul), setengah jam tanya jawab dengan kasus nyata dari lapangan, dan setengah jam sesi praktik gerakan bersama. Setiap peserta menerima buku saku manasik bergambar.

## Siapa pendampingnya

Tim pendamping adalah alumni haji bersertifikat yang tergabung di IPHI, ditambah mutawif lulusan akademi anggota. Mereka mengajar dengan bahasa daerah saat diperlukan — dari Aceh sampai Papua.

## Cara mengajukan

Pengurus majelis taklim dapat mengajukan jadwal melalui DPD setempat atau formulir kontak portal dengan kategori "Klinik Manasik". Prioritas diberikan ke majelis yang mayoritas pengurusnya berencana berangkat dalam 12 bulan.

Program ini berjalan bersama agenda pemerintah peningkatan literasi ibadah dan telah menghasilkan ribuan jamaah yang lebih siap sebelum bertolak.`
  },
  {
    title: "Kolaborasi Maskapai: Tambahan 12 Frekuensi Keberangkatan Umrah Musim Dingin",
    slug: "kolaborasi-maskapai-12-frekuensi-musim-dingin",
    excerpt: "Perjanjian dengan tiga maskapai menambah kapasitas ke Jeddah dan Madinah untuk musim dingin — jadwal tersedia di dashboard mitra.",
    category: "Berita", cover: `${IMG}/haramain-train.jpg`, featured: false, views: 1140, author: "Tim Kemitraan MUHDIN", daysAgo: 26,
    content: `Tim Kemitraan MUHDIN mengumumkan penambahan **12 frekuensi keberangkatan** ke Jeddah dan Madinah untuk musim dingin, hasil perundingan dengan tiga maskapai mitra.

## Rute dan jadwal

Tambahan kapasitas terkonsentrasi pada rute Jakarta–Jeddah, Surabaya–Madinah, dan Makassar–Jeddah. Jadwal lengkap tersedia di dashboard mitra dengan penanda "kapasitas kerja sama" — rombongan anggota mendapat prioritas alokasi kursi blok.

## Cara memakai

Penyelenggara mengajukan blok kursi melalui dashboard dengan menyertakan estimasi jumlah jamaah. Tim kemitraan memvalidasi dalam satu hari kerja. Alokasi yang tidak dikonfirmasi tujuh hari sebelum terbang dilepas ke umum agar tidak ada kursi kosong.

## Manfaat jamaah

Frekuensi tambahan memperpendek waktu tunggu konsolidasi antardaerah — jamaah Indonesia Timur kini bisa terbang tanpa menginap terlalu lama di Jakarta. Keberangkatan lebih rapat juga menstabilkan harga tiket rombongan.

Perundingan tahap berikutnya menyasar kapasitas musim Ramadhan, yang selama ini menjadi puncak antrean.`
  },
  {
    title: "Panduan Memilih Penyelenggara Umrah Terpercaya: 7 Pemeriksaan Wajib",
    slug: "panduan-memilih-penyelenggara-umrah-terpercaya",
    excerpt: "Sebelum menyetor uang, pastikan tujuh hal ini: izin, verifikasi MUHDIN, kontrak tertulis, skema dana, asuransi, mutawif bersertifikat, dan kanal pengaduan.",
    category: "Artikel", cover: `${IMG}/masjid-nabawi.jpg`, featured: true, views: 3240, author: "Dewan Edukasi MUHDIN", daysAgo: 31,
    content: `Memilih penyelenggara umrah bukan sekadar membandingkan harga. Cerita buruk umrah hampir selalu bermula dari satu hal: jamaah tidak memeriksa dasar sebelum menyetor. Artikel ini merangkum tujuh pemeriksaan wajib sebelum Anda tanda tangan apa pun.

## 1. Cek izin resmi

Penyelenggara umrah wajib memiliki izin dari Kementerian Agama. Nomor izin harus tercantum di kontrak — bukan hanya di brosur.

## 2. Cek status verifikasi MUHDIN

Buka portal Cek Verifikasi, masukkan nama penyelenggara. Status TERVERIFIKASI berarti izin diperiksa, operasional aktif, dan tidak ada sengketa terbuka.

## 3. Minta kontrak tertulis

Kontrak wajib memuat harga final, jadwal, nama hotel (bukan "hotel setara"), dan rincian apa yang tidak termasuk. Tolak kesepakatan lisan.

## 4. Pahami skema dana

Tanyakan ke mana uang mengalir. Penyelenggara berlambang Dana Terlindungi memakai rekening escrow — dana Anda tidak bercampur kas perusahaan.

## 5. Pastikan asuransi aktif

Asuransi/takaful perjalanan harus disebut namanya dan periode aktifnya di kontrak.

## 6. Tanyakan mutawifnya

Mutawif bersertifikat terdaftar di direktori MUHDIN dan bisa diverifikasi nomornya.

## 7. Simpan kanal pengaduan

Catat nomor layanan pengaduan internal dan tiket pelacakan MUHDIN. Semoga tidak terpakai — tapi harus ada.

Tujuh pemeriksaan ini mengambil waktu kurang dari satu jam dan melindungi tabungan bertahun-tahun Anda.`
  },
  {
    title: "Manasik yang Benar: Kesalahan Umum Jamaah di Lapangan dan Cara Menghindarinya",
    slug: "manasik-yang-benar-kesalahan-umum-di-lapangan",
    excerpt: "Dari batalnya ihram karena salah niat sampai tawaf yang tidak menyempurnakan tujuh putaran — rangkuman kesalahan paling sering terjadi beserta solusinya.",
    category: "Artikel", cover: `${IMG}/manasik.jpg`, featured: false, views: 2110, author: "Dewan Fiqih MUHDIN", daysAgo: 36,
    content: `Setiap musim, pendamping lapangan mencatat kesalahan manasik yang berulang. Sebagian besar bukan karena kelalaian, melainkan karena informasi yang bertabrakan. Berikut kesalahan paling umum dan cara menghindarinya.

## Niat ihram yang tergesa

Banyak jamaah melafalkan niat di pesawat tanpa tahu lokasi miqat. Akibatnya ihram dimulai terlambat. Solusi: ikuti pengumuman kru dan mutawif — miqat dimulai persis saat pesawat melewatinya, biasanya sekitar 30 menit sebelum mendarat di Jeddah.

## Tawaf yang kurang putaran

Menghitung tawaf sambil berbincang sering kacau. Kuncinya: mulai hitungan dari sudut Hajar Aswad dengan penanda fisik (angka di aplikasi atau jari), dan ulang dari awal bila ragu — lebih aman menambah satu putaran daripada berhenti di tengah.

## Sa'i dengan langkah tidak penuh

Sa'i sah dilakukan dengan berjalan normal antara Safa dan Marwah, bukan berlari menyeluruh. Bagi lansia, alat bantu roda disediakan — gunakan, jangan memaksakan.

## Tahallul terburu-buru

Tahallul sah dengan pemotongan sekurang-kurangnya tiga helai rambut. Membiarkan barber memutuskan sering membuat jamaah tidak yakin apakah sudah cukup. Minta diperlihatkan helai rambut yang dipotong.

## Belajar sebelum berangkat

Seluruh kesalahan di atas bisa dicegah dengan satu kebiasaan: mengikuti manasik sampai tuntas sebelum berangkat. Daftar klinik manasik anggota MUHDIN tersedia gratis di tiap DPD.`
  },
  {
    title: "Teknologi di Balik Verifikasi MUHDIN: Bagaimana Status TERVERIFIKASI Dihasilkan",
    slug: "teknologi-di-balik-verifikasi-muhdin",
    excerpt: "Bukan cap manual. Status verifikasi lahir dari pipeline dokumen, pemeriksaan silang izin, audit lapangan DPD, dan pemantauan pengaduan berjalan terus.",
    category: "Artikel", cover: `${IMG}/command-center.jpg`, featured: false, views: 1340, author: "Tim Teknologi MUHDIN", daysAgo: 42,
    content: `Banyak yang bertanya: apa arti lencana TERVERIFIKASI di direktori anggota? Jawabannya bukan sekadar "pernah jadi anggota". Lencana itu adalah hasil dari pipeline verifikasi berlapis yang berjalan otomatis dan manusiawi sekaligus.

## Lapis pertama: dokumen

Calon anggota mengunggah izin, akta, NPWP, dan data pengurus. Sistem memeriksa kelengkapan dan format secara otomatis — berkas yang cacat tidak pernah masuk antrean manusia.

## Lapis kedua: pemeriksaan silang

Nomor izin dicocokkan dengan basis data resmi. Di sini banyak aplikasi gugur: nomor izin milik perusahaan lain, izin kedaluwarsa, atau alamat tidak cocok.

## Lapis ketiga: audit lapangan

DPD setempat mengunjungi kantor calon anggota. Yang diperiksa sederhana tapi penting: kantor benar-benar beroperasi, staf ada, dan tanda pengembalian dana jamaah terpasang.

## Lapis keempat: pemantauan berjalan

Verifikasi bukan kejadian sekali saja. Pengaduan masuk dianalisis setiap hari; pola keluhan berulang menurunkan rating, dan kasus serius mengaktifkan peninjauan ulang. Lencana bisa dicabut — dan beberapa kali sudah dicabut.

## Untuk jamaah

Karena itu, angka rating di direktori adalah gabungan audit awal dan perilaku berjalan. Ketika Anda melihat TERVERIFIKASI, Anda melihat organisasi yang sedang diawasi — bukan sekadar pernah lolos.`
  },
  {
    title: "Merawat Jamaah Usia Lanjut: Protokol Kesehatan Rombongan yang Terbukti",
    slug: "merawat-jamaah-usia-lanjut-protokol-kesehatan",
    excerpt: "Panduan praktis dari pengalaman ratusan rombongan: skrining pra-berangkat, pembagian pendamping, konsumsi obat, hingga tanda bahaya yang wajib dievakuasi.",
    category: "Artikel", cover: `${IMG}/jamaah-handling.jpg`, featured: false, views: 1690, author: "Tim Sehat MUHDIN", daysAgo: 47,
    content: `Jamaah usia lanjut adalah tulang punggung umrah Indonesia — dan juga kelompok paling rentan. Protokol berikut dirangkum dari pengalaman ratusan rombongan anggota yang rating pelayanannya tertinggi.

## Skrining pra-berangkat

Empat minggu sebelum terbang, setiap jamaah lansia idealnya melalui pemeriksaan: tekanan darah, gula, riwayat jantung, dan kemampuan jalan 500 meter tanpa berhenti. Hasilnya menentukan pembagian kelompok pendamping — bukan alasan menolak jamaah.

## Pembagian pendamping

Rasio aman: satu pendamping untuk maksimal tujuh jamaah lansia. Pendamping memegang salinan resep, tahu letak unit medis terdekat di tiap lokasi, dan mengenali tanda dehidrasi.

## Konsumsi obat di perjalanan

Kesalahan paling sering: obat tertinggal di koper bagasi. Aturan sederhana — semua obat harian masuk tas punggung, bukan koper. Jam minum obat disesuaikan pergeseran waktu sejak hari pertama, bukan setelah jet lag selesai.

## Tanda bahaya

Napas memendek saat istirahat, nyeri dada, bicara pelo tiba-tiba, atau bingung mendadak adalah tanda evakuasi segera — bukan "dilihat dulu sampai pagi". Rombongan yang berlatih skenario ini lewat modul crisis handling bertindak jauh lebih cepat.

## Setelah pulang

Pemulihan berlanjut di rumah: cek ulang tekanan darah dan gula dalam tujuh hari pertama. Beberapa anggota menyediakan kunjungan pasca-umrah — nilai tambah yang layak ditanyakan saat memilih penyelenggara.`
  },
  {
    title: "Pembukaan Pendaftaran Anggota Gelombang III — Fokus Indonesia Timur",
    slug: "pembukaan-pendaftaran-anggota-gelombang-iii-indonesia-timur",
    excerpt: "Gelombang ini memprioritaskan penyelenggara dari Kepri, Maluku, Papua, dan NTT dengan pendampingan dokumen gratis dari tim verifikasi.",
    category: "Pengumuman", cover: `${IMG}/city-madinah.png`, featured: false, views: 830, author: "Sekretariat MUHDIN", daysAgo: 52,
    content: `Sekretariat membuka **Pendaftaran Anggota Gelombang III** dengan prioritas khusus penyelenggara dari Indonesia Timur: Kepulauan Riau, Maluku, Maluku Utara, Papua, Papua Barat, Papua Barat Daya, dan Nusa Tenggara Timur.

## Mengapa diprioritaskan

Data direktori menunjukkan ketimpangan: jamaah Indonesia Timur sering dilayani penyelenggara luar daerah dengan biaya konsolidasi tinggi. Memperkuat anggota lokal berarti memperpendek rantai layanan bagi jamaah daerah.

## Pendampingan gratis

Untuk gelombang ini, tim verifikasi memandang penyusunan dokumen tanpa biaya: pemeriksaan awal berkas, konsultasi perbaikan, dan pendampingan audit lapangan bersama DPD. Pendampingan dilakukan daring agar tidak menambah biaya daerah.

## Alur pendaftaran

Isi formulir pendaftaran di portal, pilih kategori keanggotaan, lalu sistem mengeluarkan nomor urut dan tiket pelacakan. Status dapat dipantau kapan saja lewat halaman lacak — transparan dari awal sampai keputusan.

Seluruh penyelenggara Indonesia tetap dapat mendaftar di luar prioritas ini; alokasi kuota tetap tersedia untuk semua wilayah.`
  },
  {
    title: "Jadwal Bimtek CMS Mitra November — Wajib bagi Pengelola Dashboard Baru",
    slug: "jadwal-bimtek-cms-mitra-november",
    excerpt: "Dua sesi daring: dasar-dasar dashboard (unggah konten, jawab pengaduan) dan lanjutan (laporan keberangkatan, integrasi Nusuk). Rekam tersedia.",
    category: "Pengumuman", cover: `${IMG}/command-center.jpg`, featured: false, views: 610, author: "Tim Teknologi MUHDIN", daysAgo: 58,
    content: `Tim Teknologi menyiapkan dua sesi Bimbingan Teknis (Bimtek) CMS Portal Mitra pada bulan November, terbuka gratis untuk seluruh pengelola dashboard anggota.

## Sesi 1 — Dasar (durasi 90 menit)

Materi: navigasi dashboard, unggah agenda dan galeri, mengelola profil publik anggota, menjawab pesan dan pengaduan, serta etika kecepatan respons (standar: balasan pertama maksimal 24 jam).

## Sesi 2 — Lanjutan (durasi 120 menit)

Materi: laporan keberangkatan harian, pembacaan log integrasi Nusuk, memakai AI Content Studio untuk menyusun draf artikel (dengan tetap melalui kurasi editor), dan cara membaca statistik rating.

## Format dan pendaftaran

Kedua sesi berjalan daring dengan kuota 200 peserta per sesi. Pendaftaran melalui pengumuman di dashboard mitra. Rekaman dan modul dibagikan setelah sesi bagi yang berhalangan.

Pengelola baru yang belum pernah mengikuti bimtek dasar diprioritaskan pada Sesi 1. Sertifikat kehadiran tercatat di profil anggota.`
  },
  {
    title: "Pemberlakuan Nomor Tiket Seragam untuk Seluruh Formulir Publik",
    slug: "pemberlakuan-nomor-tiket-seragam-formulir-publik",
    excerpt: "Mulai bulan ini, setiap formulir — pendaftaran, pengaduan, pesan, testimoni — menghasilkan tiket pelacakan seragam. Jamaah bisa memantau status tanpa menelepon.",
    category: "Pengumuman", cover: `${IMG}/command-center.jpg`, featured: false, views: 540, author: "Sekretariat MUHDIN", daysAgo: 63,
    content: `Sekretariat menerapkan **nomor tiket seragam** untuk seluruh formulir publik portal: pendaftaran anggota, pengaduan, pesan kontak, dan testimoni. Satu tiket, satu jalur status.

## Apa yang berubah

Sebelumnya, pengaduan dan pendaftaran memakai penanda berbeda. Kini semua saluran menghasilkan tiket dengan format seragam yang dapat dilacak di halaman Lacak. Jamaah tidak lagi perlu menelepon sekretariat hanya untuk bertanya "sudah dibaca belum".

## Manfaat bagi penyelenggara

Bagi anggota, tiket seragam memangkas komunikasi ganda: pengaduan yang diteruskan ke penyelenggara membawa tiket yang sama, sehingga riwayat penyelesaiannya utuh di satu tempat — baik di dashboard mitra maupun di sisi jamaah.

## Komitmen waktu layanan

Standar balasan pertama tetap 24 jam kerja. Tiket yang melewati batas otomatis naik prioritas ke pengawas. Statistik kecepatan layanan per anggota akan dipublikasikan agregat tiap kuartal.

Tiket lama tetap berlaku; tidak ada data yang berpindah.`
  },
  {
    title: "Siaran Pers: MUHDIN Lantik Dua DPD Baru di Maluku Utara dan Papua",
    slug: "siaran-pers-lantik-dpd-maluku-utara-papua",
    excerpt: "Pelantikan DPD Ternate dan Jayapura memperluas titik layanan asosiasi ke kawasan timur. Seluruh DPD kini berjumlah sepuluh dengan target 15 tahun ini.",
    category: "Press Release", cover: `${IMG}/city-madinah.png`, featured: false, views: 720, author: "Sekretariat MUHDIN", daysAgo: 70,
    content: `**Ternate, Jakarta —** MUHDIN resmi melantik Dewan Pimpinan Daerah (DPD) Maluku Utara dan DPD Papua dalam satu rangkaian acara. Pelantikan ini memperluas cakupan titik layanan asosiasi ke kawasan timur Indonesia.

## Mengapa kawasan timur

Rombongan dari Maluku Utara dan Papua rata-rata menempuh perjalanan konsolidasi lebih dari 24 jam. Kehadiran DPD lokal memendek rantai: verifikasi anggota, penanganan pengaduan tingkat pertama, dan edukasi manasik kini ditangani lebih dekat dengan jamaah.

## Struktur dan tugas

Masing-masing DPD dipimpin kepengurusan lintas unsur: penyelenggara aktif, alumni haji dari IPHI, dan tokoh masyarakat. Mandat pertama mereka: pemetaan penyelenggara lokal, pembukaan klinik manasik, dan penanganan pelaporan rombongan di musim ramai.

## Angka terkini

Dengan dua DPD baru, total DPD aktif berjumlah sepuluh. Target akhir tahun adalah lima belas DPD, dengan prioritas berikutnya Nusa Tenggara Timur dan Kalimantan Utara.

Rangkaian pelantikan ditutup dengan penandatanganan komitmen mutu layanan: setiap DPD berjanji menindaklanjuti pengaduan jamaah daerahnya maksimal 48 jam sebelum eskalasi ke pusat.`
  },
  {
    title: "Siaran Pers: Portal MUHDIN Buka Data Publik Kecepatan Layanan Anggota",
    slug: "siaran-pers-data-publik-kecepatan-layanan",
    excerpt: "Mulai kuartal ini, statistik kecepatan respons pengaduan per anggota dipublikasikan agregat. Jamaah dapat membandingkan bukan hanya harga, tetapi juga kesiapan melayani.",
    category: "Press Release", cover: `${IMG}/command-center.jpg`, featured: false, views: 960, author: "Sekretariat MUHDIN", daysAgo: 76,
    content: `**Jakarta —** Portal MUHDIN memperluas transparansi publik: statistik **kecepatan layanan** anggota kini dihimpun dan akan dipublikasikan secara agregat setiap kuartal.

## Data apa yang terbuka

Publikasi mencakup: median waktu balasan pertama pengaduan, persentase pengaduan tuntas dalam tujuh hari, dan jumlah pengaduan per seratus jamaah. Angka disajikan agregat per anggota tanpa membuka identitas jamaah — sesuai komitmen perlindungan data.

## Mengapa penting

Selama ini jamaah membandingkan penyelenggara dari harga dan testimoni. Statistik layanan menambah dimensi ketiga yang lebih sulit dipalsukan: perilaku saat ada masalah.

## Dampak untuk anggota

Anggota dengan layanan cepat mendapat keunggulan nyata di direktori. Anggota yang tertinggal mendapat rekomendasi perbaikan dari tim mutu — pelatihan respons, template balasan, dan eskalasi yang benar.

## Ketersediaan

Halaman transparansi di portal menampilkan rilis pertama. Saran publik atas bentuk penyajian data dapat dikirim melalui formulir kontak dengan kategori "Transparansi".`
  },
  {
    title: "Refleksi Perjalanan Iman: Ketika Ibadah Menyatu dengan Layanan yang Benar",
    slug: "refleksi-perjalanan-iman-ibadah-layanan-yang-benar",
    excerpt: "Umrah yang baik tidak berhenti di keabsahan rukun; ia juga tentang bagaimana jamaah diperlakukan sebelum, saat, dan sesudah ibadah.",
    category: "Artikel", cover: `${IMG}/hero-kaaba.jpg`, featured: false, views: 1480, author: "Dewan Fiqih MUHDIN", daysAgo: 84,
    content: `Ada dua hal yang sering dipisahkan padahal menyatu: keabsahan ibadah dan kebaikan layanan. Rukun bisa sah, niat bisa benar — namun perjalanan tetap menyakitkan bila jamaah diperlakukan seolah hanya angka kursi.

## Layanan adalah bagian dari ikhsan

Islam mengajarkan ihsan dalam segala urusan, termasuk melayani tamu Allah. Penyelenggara yang tepat waktu, transparan biayanya, dan sigap saat ada masalah sedang mengamalkan ihsan — bukan sekadar operasional bisnis.

## Sebelum berangkat

Kebaikan layanan dimulai sebelum keberangkatan: informasi yang jujur, kontrak yang jelas, manasik yang menyeluruh. Jamaah yang tenang sebelum berangkat lebih fokus dalam ibadahnya.

## Di Tanah Suci

Di lapangan, detail kecil terasa besar: jadwal makan yang tidak membuat jamaah kelaparan saat tawaf, pendamping yang sabar pada lansia, susunan kamar yang menghormati kelompok kajian.

## Sesudah pulang

Perjalanan iman tidak berakhir di bandara. Jamaah kembali membawa perubahan; penyelenggara yang baik ikut merawatnya — komunitas pasca-umrah, kajian lanjutan, dan silaturahmi rombongan.

Ekosistem MUHDIN dibangun dari keyakinan ini: menjaga keabsahan ibadah adalah tugas jamaah bersama pembimbingnya; menjaga kebaikan layanan adalah tugas kita bersama.`
  },
  {
    title: "Musim Dingin 2026: Prediksi Slot Penerbitan Permit dan Strategi Penjadwalan",
    slug: "prediksi-slot-permit-musim-dingin-2026",
    excerpt: "Analisis tiga musim terakhir menunjukkan slot penerbitan permit menipis di minggu kedua Desember. Penyelenggara disarankan mengunci jadwal dua minggu lebih awal.",
    category: "Artikel", cover: `${IMG}/command-center.jpg`, featured: false, views: 1060, author: "Tim Teknologi MUHDIN", daysAgo: 92,
    content: `Memasuki musim dingin, pertanyaan paling sering di dashboard mitra adalah: kapan slot permit mulai menipis? Analisis tiga musim terakhir memberi pola yang cukup konsisten.

## Pola historis

Slot penerbitan relatif lega awal November, mulai memadat minggu kedua Desember, dan paling ketat sepuluh hari terakhir Desember hingga awal Januari — bertepatan libur sekolah dan gelombang rombongan keluarga.

## Strategi bagi penyelenggara

1. **Kunci jadwal dua minggu lebih awal** dari rencana keberangkatan, terutama untuk rombongan besar.
2. **Pecah rombongan 40+** menjadi dua jendela pengajuan; pengajuan besar di jam sibuk paling rawan tertunda.
3. **Rapikan data sebelum mengajukan** — penolakan karena foto tidak sesuai adalah penyebab tertunda paling mudah dicegah.
4. **Pantau log sinkronisasi** di dashboard; pengajuan bermasalah ditandai dengan alasan yang jelas dan bisa langsung diperbaiki.

## Dampak bagi jamaah

Jamaah tidak perlu berubah apa-apa — pengelolaan izin adalah tanggung jawab penyelenggara. Namun memahami musim membantu jamaah menahan diri dari tuntutan jadwal yang secara teknis tidak mungkin.

Tim integrasi terus mengoptimalkan antrean dan akan mengumumkan pembaruan bila ada perubahan kebijakan sisi Saudi.`
  },
];
