/**
 * Fase 1 — Agenda (7 baru), Galeri (8 baru), Testimoni (8 baru), DPD (7 baru).
 */

export type NewEvent = {
  title: string; description: string; location: string;
  startIn: number; endIn: number; // hari dari sekarang
  category: string;
};

export type NewGallery = {
  title: string; caption: string; category: string; imageUrl: string; order: number;
};

export type NewTestimonial = {
  name: string; role: string; content: string; rating: number;
};

export type NewBranch = {
  name: string; code: string; province: string; city: string; officeName: string;
  address: string; picName: string; picPhone: string; email: string; description: string; order: number;
};

export const NEW_EVENTS: NewEvent[] = [
  { title: "Bimtek CMS Portal Mitra — Sesi Dasar", description: "Pelatihan daring 90 menit untuk pengelola dashboard baru: navigasi, unggah konten, dan etika respons pengaduan. Kuota 200 peserta.", location: "Daring (Zoom) — tautan dikirim via dashboard", startIn: 12, endIn: 12, category: "Pelatihan" },
  { title: "Klinik Manasik Bersama DPD Jawa Barat", description: "Manasik publik gratis di Bandung untuk 300 jamaah calon keberangkatan, didampingi mentor IPHI dan mutawif bersertifikat.", location: "Masjid Agung Bandung, Jl. Alun-alun Utara", startIn: 20, endIn: 20, category: "Kegiatan" },
  { title: "Rakernas II — Evaluasi Standar Layanan Tunggal", description: "Evaluasi penerapan standar layanan tunggal 13 ekosistem, penyusunan indeks kepuasan jamaah nasional, dan rapor kuartal anggota.", location: "Hotel Aula Sentral, Jakarta Selatan", startIn: 45, endIn: 47, category: "Rakernas" },
  { title: "Safari Dakwah & Silaturahmi DPD Indonesia Timur", description: "Kunjungan pengurus pusat ke DPD Ternate, Ambon, dan Jayapura: silaturahmi anggota, temuan lapangan, dan pembukaan klinik manasik.", location: "Ternate — Ambon — Jayapura", startIn: 60, endIn: 68, category: "Safari" },
  { title: "Gelombang III Ujian Sertifikasi Mutawif", description: "Ujian praktik dua hari bagi 500 peserta Gelombang II: simulasi rombongan penuh, crisis handling, dan ujian fiqih lisan.", location: "Akademi Mitra, Jakarta & Makassar (cabang ujian)", startIn: 75, endIn: 76, category: "Pelatihan" },
  { title: "Puncak Koordinasi Musim Ramadhan 1448 H", description: "Penyelarasan kapasitas maskapai, hotel, dan slot Nusuk menjelang musim puncak Ramadhan. Khusus pengurus anggota dan DPD.", location: "Aula Sekretariat Pusat, Jakarta", startIn: 100, endIn: 100, category: "Rakernas" },
  { title: "Mabit Ekosistem — Malam Kebersamaan Anggota Nasional", description: "Malam apresiasi anggota: penghargaan layanan tercepat, rating tertinggi, dan DPD paling aktif. Dibuka untuk seluruh kategori keanggotaan.", location: "Jakarta Convention Center", startIn: 130, endIn: 130, category: "Kegiatan" },
];

export const NEW_GALLERY: NewGallery[] = [
  { title: "Pelayanan Keberangkatan Bandara", caption: "Tim handling mendampingi rombongan jamaah di check-in counter khusus umrah.", category: "Perjalanan", imageUrl: "/images/jamaah-handling.jpg", order: 10 },
  { title: "Briefing Rombongan Pra-Keberangkatan", caption: "Briefing final 24 jam sebelum terbang: jadwal, kamar, dan protokol kesehatan.", category: "Kegiatan", imageUrl: "/images/command-center.jpg", order: 11 },
  { title: "Praktik Manasik Tawaf", caption: "Sesi praktik gerakan tawaf dengan penanda lingkaran di pelataran manasik.", category: "Manasik", imageUrl: "/images/manasik.jpg", order: 12 },
  { title: "Fasilitas Hotel Ring 1 Makkah", caption: "Salah satu hotel mitra ring 1 Masjidil Haram yang menjadi standar paket plus.", category: "Fasilitas", imageUrl: "/images/hotel-makkah.jpg", order: 13 },
  { title: "Perjalanan Haramain High Speed Railway", caption: "Perjalanan Makkah–Madinah 2 jam memakai kereta cepat HHR yang kini jadi standar rombongan.", category: "Perjalanan", imageUrl: "/images/haramain-train.jpg", order: 14 },
  { title: "Command Center Pemantauan Rombongan", caption: "Ruang pemantauan 24/7: pelacakan rombongan, koordinasi darurat, dan log Nusuk.", category: "Fasilitas", imageUrl: "/images/command-center.jpg", order: 15 },
  { title: "Kunjungan Riadhul Jannah Terjadwal", caption: "Antrean terjadwal kunjungan Riadhul Jannah melalui integrasi Nusuk Hub.", category: "Perjalanan", imageUrl: "/images/masjid-nabawi.jpg", order: 16 },
  { title: "Panorama Masjidil Haram Senja", caption: "Dokumentasi rombongan anggota di pelataran Masjidil Haram waktu maghrib.", category: "Kegiatan", imageUrl: "/images/hero-kaaba.jpg", order: 17 },
];

export const NEW_TESTIMONIALS: NewTestimonial[] = [
  { name: "H. Rahmat Hidayat", role: "Jamaah Umrah — PT Semarang Tawakal Tour", content: "Pertama kalinya saya tidak bingung selama umrah. Jadwal jelas, mutawif sabar, dan tiap perubahan jadwal diberi tahu lewat grup sebelum saya sempat bertanya. Portal verifikasi MUHDIN membuat saya berani memilih.", rating: 5 },
  { name: "Ibu Siti Aminah", role: "Jamaah Lansia 71 Tahun — Rombongan Bandung", content: "Anak saya di luar negeri, saya berangkat sendiri tapi tidak merasa sendiri. Pendamping menggandeng saya di setiap poin, obat saya diingatkan tiap hari. Terima kasih untuk standar pelayanan lansia yang sungguh berlaku.", rating: 5 },
  { name: "Ustaz Fauzi Rahman", role: "Pendamping Rombongan — KBIHU Jember", content: "Sertifikasi mutawif MUHDIN mengubah cara saya mendampingi. Modul crisis handling-nya bukan teori — kami berlatih skenario nyata, dan di lapangan itu menyelamatkan waktu saat ada jamaah jatuh sakit.", rating: 5 },
  { name: "Dedi Kurniawan", role: "Pemilik Travel — CV Solo Ngalam Barokah", content: "Sebagai anggota baru, pendaftaran dan verifikasi jujur dan terstruktur. Nomor urut dan tiket pelacakan membuat klien percaya dari awal. Dashboard mitranya membantu kami mengelola rombongan dengan rapi.", rating: 5 },
  { name: "Hj. Nurhaliza Yusuf", role: "Jamaah Umrah — Makassar", content: "Berangkat dari Makassar dulu selalu ribet transit lama. Sekarang ada frekuensi tambahan dan command center yang memantau — keluarga di rumah bisa lihat rombongan kami aman sampai hotel.", rating: 5 },
  { name: "Ahmad Zaki", role: "Jamaah Umrah Keluarga — Jakarta", content: "Berangkat berempat dengan orang tua usia 68. Skema dana terlindungi membuat kami tenang — pembayaran bertahap jelas milestone-nya. Hotel persis seperti dijanjikan, tidak ada kata 'setara'.", rating: 5 },
  { name: "Rina Marlina", role: "Pengurus Majelis Taklim — Bekasi", content: "Klinik manasik keliling datang ke majelis kami. Dua jam yang sangat padat, buku sakunya dipakai jamaah sampai sekarang. 14 dari kami sudah daftar umrah ke anggota MUHDIN.", rating: 4 },
  { name: "H. Baso Ampa", role: "Alumni Haji & Pendamping IPHI Makassar", content: "Saya mendampingi rombongan sejak 2009, dan portal ini akhirnya menyatukan data yang dulu tercecer: izin, rating, pengaduan. Transparansi beginilah yang selama ini kami impikan untuk jamaah.", rating: 5 },
];

export const NEW_BRANCHES: NewBranch[] = [
  { name: "Dewan Pimpinan Daerah Jawa Barat", code: "DPD-JABAR", province: "Jawa Barat", city: "Bandung", officeName: "Branch Office MUHDIN JABAR", address: "Jl. Asia Afrika No. 88, Sumur Bandung, Bandung 40111", picName: "Drs. Hendra Saputra", picPhone: "+62 811 2101 1010", email: "jabar@muhdin.web.id", description: "DPD terbesar dengan 100+ anggota aktif; program klinik manasik keliling dan kartu layanan anggota digital.", order: 4 },
  { name: "Dewan Pimpinan Daerah Jawa Timur", code: "DPD-JATIM", province: "Jawa Timur", city: "Surabaya", officeName: "Branch Office MUHDIN JATIM", address: "Jl. Pemuda No. 27, Karangmenjangan, Surabaya 60281", picName: "Siti Rahmawati, S.E.", picPhone: "+62 813 3101 2020", email: "jatim@muhdin.web.id", description: "Pusat koordinasi jamaah Indonesia timur via pelabuhan dan bandara Juanda; aktif pelatihan mutawif daerah.", order: 5 },
  { name: "Dewan Pimpinan Daerah Sumatera Utara", code: "DPD-SUMUT", province: "Sumatera Utara", city: "Medan", officeName: "Branch Office MUHDIN SUMUT", address: "Jl. Sisingamangaraja No. 12, Medan 20112", picName: "Zulfikar Tanjung, S.H.", picPhone: "+62 812 6101 3030", email: "sumut@muhdin.web.id", description: "Gerbang jamaah Sumatera: konsolidasi keberangkatan Kualanamu dan pendampingan manasik berbahasa daerah.", order: 6 },
  { name: "Dewan Pimpinan Daerah Kalimantan Selatan", code: "DPD-KALSEL", province: "Kalimantan Selatan", city: "Banjarmasin", officeName: "Branch Office MUHDIN KALSEL", address: "Jl. Panglima Batur No. 5, Banjarmasin 71111", picName: "H. Anwar Maddukan", picPhone: "+62 811 5301 4040", email: "kalsel@muhdin.web.id", description: "Pelopor skema umrah petani dan koperasi syariah; pertumbuhan anggota tercepat kawasan Kalimantan.", order: 7 },
  { name: "Dewan Pimpinan Daerah Sulawesi Selatan", code: "DPD-SULSEL", province: "Sulawesi Selatan", city: "Makassar", officeName: "Branch Office MUHDIN SULSEL", address: "Jl. Ahmad Yani No. 21, Makassar 90133", picName: "Dr. A. Fahmi Ampa, M.Si.", picPhone: "+62 811 4101 5050", email: "sulsel@muhdin.web.id", description: "Hub Indonesia Timur: konsolidasi rombongan Maluku dan Papua, command center regional, akademi mutawif cabang.", order: 8 },
  { name: "Dewan Pimpinan Daerah Maluku Utara", code: "DPD-MALUT", province: "Maluku Utara", city: "Ternate", officeName: "Branch Office MUHDIN MALUT", address: "Jl. Merdeka No. 9, Ternate 97712", picName: "Abdul Karim Fadillah", picPhone: "+62 813 9801 6060", email: "malut@muhdin.web.id", description: "DPD baru hasil pelantikan terbaru; pemetaan penyelenggara lokal dan klinik manasik kepulauan.", order: 9 },
  { name: "Dewan Pimpinan Daerah Papua", code: "DPD-PAPUA", province: "Papua", city: "Jayapura", officeName: "Branch Office MUHDIN PAPUA", address: "Jl. Percetakan Negara No. 3, Jayapura 99112", picName: "Yulius Wonda, S.Pd.", picPhone: "+62 811 9101 7070", email: "papua@muhdin.web.id", description: "Layanan khusus jamaah Papua: skrining kesehatan lanjut, pendampingan dokumen, dan konsolidasi via Makassar.", order: 10 },
];
