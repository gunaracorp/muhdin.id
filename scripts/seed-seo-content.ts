/**
 * seed-seo-content.ts — Task 19 (R-091 Konten Edukasi SEO Terstruktur).
 *
 * Menanam pustaka artikel edukasi terarah kata kunci (manasik & tips perjalanan)
 * lengkap metaTitle/metaDescription/keywords untuk landing page /artikel/[slug].
 *
 * Idempoten: unggah berdasarkan slug — artikel yang sudah ada dilewati.
 * Jalankan: npx tsx scripts/seed-seo-content.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const SEO_ARTICLES = [
  {
    title: "Panduan Manasik Umroh Lengkap: Niat, Rukun, dan Tahapan dari Ihram hingga Tahallul",
    slug: "panduan-manasik-umroh-lengkap-niat-rukun-tahapan",
    category: "Artikel",
    cover: "/images/manasik.jpg",
    featured: false,
    excerpt:
      "Rangkaian manasik umroh dari niat di miqat hingga tahallul, dijelaskan berurutan dengan doa pendek — panduan praktis untuk jamaah pertama kali.",
    metaTitle: "Panduan Manasik Umroh Lengkap 2026 — Niat, Rukun & Tahapan",
    metaDescription:
      "Pelajari manasik umroh berurutan: niat ihram di miqat, tawaf, sa'i, tahallul, hingga menyempurnakan umroh. Panduan praktis jamaah pertama kali, gratis dari MUHDIN.",
    keywords: "manasik umroh, rukun umroh, niat ihram, tawaf, sa'i, tahallul, panduan umroh pemula, doa umroh",
    content: `## Sebelum Berangkat: Siapkan Diri dan Ilmunya

Umroh bukan sekadar perjalanan — ia ibadah yang menuntut kefahaman. Sebelum keberangkatan, ikuti manasik bersama pembimbing Anda dan hafalkan urutan besarnya: ihram, tawaf, sa'i, tahallul.

## 1. Ihram — Niat di Miqat

Kenakan kain ihram sebelum melewati miqat, lalu niatkan umroh: "Labbaika 'umratan". Setelah niat, seluruh larangan ihram berlaku: tidak memakai pewangi, tidak memotong kuku, tidak berburu, dan menjaga lisan dari permusuhan.

## 2. Tawaf — Mengelilingi Ka'bah Tujuh Putaran

Mulai dan akhiri di Hajar Aswad, Ka'bah selalu di sisi kiri. Tujuh putaran penuh tanpa jeda, dianjurkan mendoakan kebaikan dunia dan akhirat di antara Rukun Yamani dan Hajar Aswad.

## 3. Sa'i — Berjalan Safa ke Marwah

Tujuh perjalanan dimulai dari Safa dan berakhir di Marwah. Pada dua lampu hijau, bagi pria disunnahkan berlari-lari kecil sebagai pengingat kisah Hajar mencari air untuk Ismail.

## 4. Tahallul — Mencukur atau Memendekkan Rambut

Setelah sa'i, pria mencukur gundul atau memendekkan rambut, wanita memotong ujung rambut sepanjang ruas jari. Dengan tahallul, larangan ihram gugur dan umroh sah.

## Setelah Umroh: Ibadah Berlanjut

Perbanyak shalat di Masjidil Haram, isi waktu dengan zikir, dan jaga adab terhadap sesama jamaah. MUHDIN menyediakan muthowif tersertifikasi untuk mendampingi setiap tahapan — cek portal #/paket untuk paket dengan pendampingan penuh.`,
  },
  {
    title: "10 Tips Memilih Paket Umroh Terpercaya: Cek legalitas, Harga Wajar, dan Garansi",
    slug: "10-tips-memilih-paket-umroh-terpercaya",
    category: "Artikel",
    cover: "/images/jamaah-handling.jpg",
    featured: false,
    excerpt:
      "Jangan tertipu travel fiktif — 10 langkah memeriksa legalitas PPIU/PIHK, kewajaran harga, hotel, hingga penyimpanan bukti pembayaran sebelum transfer.",
    metaTitle: "10 Tips Memilih Paket Umroh Terpercaya & Aman 2026",
    metaDescription:
      "Cara memilih travel umroh terpercaya: verifikasi izin PPIU/PIHK Kemenag, bandingkan harga wajar, cek hotel & maskapai, pahami kontrak, simpan bukti bayar. Panduan anti-travel fiktif.",
    keywords: "paket umroh terpercaya, travel umroh aman, izin PPIU, PIHK Kemenag, harga umroh wajar, anti travel fiktif, tips umroh",
    content: `## 1. Verifikasi Legalitas Penyelenggara

Pastikan travel memiliki izin PPIU (umroh) atau PIHK (haji) dari Kementerian Agama. Di MUHDIN, setiap penyelenggara melewati verifikasi dokumen — lihat nomor izin di halaman direktori #/verifikasi.

## 2. Bandingkan Harga yang Wajar

Umroh murah di bawah batas wajar (umumnya di bawah Rp 20 juta untuk keberangkatan reguler) layak dicurigai. Harga mencerminkan hotel, jarak ke haramain, makan, dan transportasi.

## 3. Periksa Detail Hotel dan Jaraknya

Minta nama hotel resmi, bukan sekadar "bintang 4 dekat haram". Cek di peta: jalan-jalan kaki ke Masjidil Haram dan Masjid Nabawi menentukan kenyamanan ibadah.

## 4. Kenali Maskapai dan Rutenya

Langsung atau transit? Bagasi berapa kg? Maskapai menentukan letih-tidaknya perjalanan sebelum ibadah dimulai.

## 5. Baca Rincian Itinerary

Program jelas hari-per-hari adalah tanda penyelenggara profesional — lihat contoh itinerary interaktif di setiap paket MUHDIN.

## 6. Pahami Kontrak dan Kebijakan Pembatalan

Baca syarat refund, jadwal keberangkatan ulang, dan jaminan keberangkatan sebelum tanda tangan.

## 7. Simpan Bukti Pembayaran Resmi

Transfer hanya ke rekening atas nama badan usaha, minta invoice bernomor seri. Di portal MUHDIN, setiap pesanan menghasilkan invoice PDF resmi yang bisa dilacak.

## 8. Manfaatkan Escrow dan Perlindungan Dana

Prioritaskan penyelenggara yang melindungi dana jamaah melalui escrow/tafaqul — ciri ekosistem terpercaya.

## 9. Cek Reputasi dan Ulasan Nyata

Cari ulasan jamaah yang benar-benar berangkat, bukan testimoni anonim.

## 10. Manfaatkan Layanan Pengaduan

Ekosistem MUHDIN menyediakan kanal keluhan resmi (#/komunitas) yang ditindaklanjuti verifikator — jamaah tidak pernah berjalan sendiri.`,
  },
  {
    title: "Persiapan Keberangkatan Umroh: Checklist Dokumen, Koper, dan Kesehatan",
    slug: "persiapan-keberangkatan-umroh-checklist-lengkap",
    category: "Artikel",
    cover: "/images/haramain-train.jpg",
    featured: false,
    excerpt:
      "Checklist t-30 hari sebelum terbang: paspor & visa, obat pribadi, koper 28 inci, adaptor, hingga aplikasi yang wajib terpasang di ponsel jamaah.",
    metaTitle: "Checklist Persiapan Umroh — Dokumen, Koper & Kesehatan",
    metaDescription:
      "Daftar periksa lengkap 30 hari sebelum umroh: paspor 6 bulan, visa, vaksin meningitis, obat pribadi, pakaian ihram, adaptor G, e-sim, dan dokumen yang dicetak. Bersiap tenang bersama MUHDIN.",
    keywords: "persiapan umroh, checklist umroh, dokumen umroh, bawaan koper umroh, vaksin meningitis umroh, tips perjalanan umroh",
    content: `## H-30: Dokumen Wajib Beres

- Paspor masa berlaku minimal 6 bulan
- Visa umroh (diurus penyelenggara) dan foto berwarna terbaru
- Vaksin meningitis (ICV) — syarat utama masuk Tanah Suci
- Kartu identitas, KK, buku nikah (untuk mahram)

## H-14: Kesehatan dan Fisik

Mulai jalan kaki 30 menit tiap hari — tawaf dan sa'i menuntut stamina. Siapkan obat pribadi dalam kemasan asli, plus obat flu, sakit kepala, dan minuman elektrolit.

## H-7: Koper dan Bawaan

- Koper 28 inci (maks 23 kg tergantung maskapai) + tas ransel kecil
- Dua set kain ihram dan sabuk ihram (pria), gamis longgar (wanita)
- Sandal empuk, mukena ringan, pembatas kaki untuk tidur
- Adaptor colokan tipe G, power bank, dan e-sim/roaming data

## H-1: Aplikasi dan Digital

Pasang portal MUHDIN di ponsel (PWA), simpan nomor WA resmi 0812 2234 5856, dan cek paspor digital QR di #/paspor — satu QR untuk seluruh titik layanan.

## Di Bandara

Datang 4 jam sebelum keberangkatan, tunjukkan paspor digital ke marshal, dan pastikan kartu bagasi tertempel di setiap koper. Selamat menunaikan ibadah!`,
  },
];

async function main() {
  let created = 0;
  for (const a of SEO_ARTICLES) {
    const exists = await db.article.findUnique({ where: { slug: a.slug } });
    if (exists) {
      console.log(`  lewati (ada): ${a.slug}`);
      continue;
    }
    await db.article.create({ data: { ...a, status: "PUBLISHED", author: "Tim MUHDIN" } });
    created++;
    console.log(`  tanam: ${a.slug}`);
  }
  console.log(`Selesai: ${created} artikel SEO baru.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
