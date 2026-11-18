/**
 * seed-tutorial-impor-csv.ts — tanam tutorial "Impor Data PPIU & PIHK dari CSV"
 * ke modul Tutorial portal (tampil publik di menu Tutorial, kategori CMS).
 *
 * Idempoten: upsert berdasarkan slug.
 * Jalankan: npx tsx scripts/seed-tutorial-impor-csv.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const content = [
  "Tutorial ini memandu Anda — langkah demi langkah — memasukkan data PPIU/PIHK dari berkas CSV ke portal MUHDIN, baik dari nol maupun dari **sheet Master** Excel yang sudah Anda siapkan. Tidak perlu keahlian teknis: semua dilakukan lewat CMS dengan tombol **Impor CSV**.",
  "## Tiga Cara Input Data",
  "1. **Input manual** — CMS → Direktori Anggota → Tambah Anggota. Cocok untuk 1-5 data.",
  "2. **Impor CSV** ⭐ — unggah berkas CSV berisi puluhan hingga ribuan baris sekaligus. Data dengan nomor izin yang sama otomatis **diperbarui**, bukan diduplikasi, jadi aman diulang kapan saja.",
  "3. **Konverter otomatis** — skrip `scripts/master-ke-csv.py` mengubah file `Master_Penyelenggara_Haji_Umrah.xlsx` menjadi CSV siap impor dalam sekali jalan.",
  "## Siapkan Berkas CSV",
  "Kolom wajib: `name` (nama resmi), `type` (PPIU/PIHK/KBIHU/IPHI/TRAVEL_WISATA), `city` (kota), `licenseNo` (nomor izin). Kolom opsional: `province`, `phone`, `email`, `website`, `description`, `status`, `memberSince`, `rating`.",
  "Tidak perlu mengubah nama kolom sheet Master Anda — sistem mengenali `nama_resmi`, `jenis_entitas`, `nomor_izin_Kemenag`, `status_izin`, `telepon_email_web`, `wilayah_layanan`, dan kawan-kawannya secara otomatis. Kolom gabungan `telepon_email_web` bahkan dipecah sendiri menjadi telepon, email, dan website.",
  "Nilai `status` bebas ditulis: *Aktif* → TERVERIFIKASI, *Dalam Verifikasi/Menunggu* → PENDING, *Dicabut/Nonaktif/Ditangguhkan* → SUSPENDED. Nilai lain dianggap TERVERIFIKASI.",
  "## Langkah Impor di CMS",
  "1. Masuk ke **Portal Mitra → CMS** (`#/admin`) sebagai admin.",
  "2. Buka menu **Direktori Anggota**.",
  "3. Klik tombol **Impor CSV** di kanan atas.",
  "4. Klik **Berkas CSV** dan pilih file Anda — atau tempel isinya langsung ke kotak teks.",
  "5. Periksa **pratinjau** 3 baris pertama.",
  "6. Klik **Impor Sekarang** dan tunggu beberapa detik.",
  "7. Baca ringkasan: angka hijau = baris baru, biru = diperbarui, merah = dilewati beserta alasannya per baris.",
  "## Memeriksa Hasil",
  "Buka menu publik **Anggota** dan cari nama perusahaan yang baru diimpor, atau gunakan halaman **Verifikasi** dengan nomor izinnya. Di CMS, gunakan kotak pencarian Direktori Anggota untuk memastikan data masuk, lalu klik untuk menyunting bila ada yang perlu diperbaiki.",
  "## Memasukkan NIB & Dokumen Izin (Registri Compliance)",
  "Selain direktori anggota, MUHDIN punya **Registri Izin** yang menjadi bahan audit kepatuhan (Pindai Izin 360°). CSV-nya memakai kolom sheet Master apa adanya: `NIB` (wajib), `nama_resmi`, `jenis_entitas`, `nomor_izin_Kemenag`, `masa_berlaku_izin`, `nomor_badan_hukum`, `NPWP`, `telepon_email_web`, `catatan_risiko`. Impor lewat CMS → modul **Compliance** → **Impor CSV**. Baris dengan NIB sama diperbarui beserta dokumen izinnya (NIB, Akta, NPWP, izin PPIU/PIHK + masa berlaku).",
  "## Menggunakan Konverter Sheet Master",
  "Jalankan perintah berikut di folder proyek: `python3 scripts/master-ke-csv.py`. Konverter membaca sheet **Master**, lalu menghasilkan `download/hasil-master/anggota-dari-master.csv` (hanya baris PPIU/PIHK/KBIHU/IPHI/Travel Wisata) dan `registri-dari-master.csv` (baris bernomor NIB). Ia juga memecah kolom kontak gabungan, menerjemahkan status izin, mengambil kota dari alamat, dan mengubah skor kelayakan menjadi rating 1-5.",
  "## Masalah Umum",
  "**\"Kolom wajib kosong\"** — pastikan name/type/city/licenseNo terisi; placeholder seperti tanda `-` dianggap kosong. **\"jenis tidak dikenal\"** — kolom type hanya menerima PPIU, PIHK, KBIHU, IPHI, atau Travel Wisata; baris Maskapai/Hotel memang bukan anggota direktori. **Email tidak valid** — periksa salah ketik. **429 Terlalu banyak impor** — tunggu satu menit, batas 5 impor/menit. **Angka berubah jadi tanggal di Excel** — format sel sebagai *Text* sebelum mengetik nomor izin.",
  "## Sumber Data Resmi",
  "Untuk melengkapi daftar resmi seluruh PPIU/PIHK Indonesia: **SISKOPATUH** (siskopatuh.haji.go.id), **SIMPU** (simpu.kemenag.go.id) untuk cek per perusahaan, pengumuman kanwil per provinsi (`{provinsi}.haji.go.id`), atau permintaan resmi lewat **PPID Kementerian Haji dan Umrah** sesuai UU Keterbukaan Informasi Publik.",
]

async function main() {
  const slug = "impor-csv-ppiu-pihk-dari-sheet-master";
  const data = {
    title: "Impor Data PPIU & PIHK dari CSV (Sheet Master)",
    slug,
    category: "CMS",
    level: "Pemula",
    duration: 15,
    order: 14,
    published: true,
    summary:
      "Panduan lengkap memasukkan data PPIU/PIHK lewat tombol Impor CSV di CMS: menyiapkan berkas, mengenal kolom, memakai konverter sheet Master otomatis, membaca hasil impor, hingga mengatasi masalah umum.",
    content: content.join("\n\n"),
  };
  await db.tutorial.upsert({ where: { slug }, create: data, update: data });
  const total = await db.tutorial.count();
  console.log(`✅ Tutorial tersimpan (upsert): ${slug} — total tutorial kini ${total}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
