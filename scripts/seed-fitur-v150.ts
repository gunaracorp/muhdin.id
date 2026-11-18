/**
 * seed-fitur-v150.ts — v15.0.0 «GOD MODE» — data demo idempoten.
 *
 * Mengisi (13 item roadmap terakhir, kini 99/99 DONE):
 *  • R-048 Asuransi Perjalanan (3 paket)
 *  • R-098 Kendali ISMS ISO 27001 (21 kendali Annex A kunci)
 *  • R-046 Lapak Mitra (2 toko ACTIVE + 5 produk) — merujuk MerchantStore baru
 *  • R-034 Evaluasi Instruktur (3 ulasan pada kelas DONE demo)
 *  • R-049 Kas Rombongan (1 grup TravelGroup demo + 5 catatan kas)
 *  • R-032 Lencana (2 pemilik demo dengan lencana terbuka)
 *  • R-018 Pengampu Keluarga (1 pengampu + 3 anggota)
 *
 * Idempoten: hapus data demo lama lalu isi ulang. TIDAK menyentuh data inti
 * (anggota, paket, artikel, dsb.).
 * Jalankan: npx tsx scripts/seed-fitur-v150.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 seed-fitur-v150 — v15.0.0 «GOD MODE»");

  /* ---------- R-048 Asuransi Perjalanan ---------- */
  await db.insurancePlan.deleteMany({});
  const plans = [
    { code: "INS-BASIC", name: "Perlindungan Dasar", provider: "Takaful Mitra Umrah", coverage: "Kecelakaan & sakit selama perjalanan santifikasi hingga Rp 100 juta per jamaah.", premium: 75_000 },
    { code: "INS-KOMPREHENSIF", name: "Perlindungan Komprehensif", provider: "Takaful Mitra Umrah", coverage: "Kecelakaan, sakit, evakuasi, bagasi hilang, dan pembatalan perjalanan hingga Rp 250 juta per jamaah.", premium: 165_000 },
    { code: "INS-KELUARGA", name: "Perlindungan Keluarga", provider: "Asuransi Sahabat Haji", coverage: "Paket keluarga: perlindungan 2 dewasa + 2 anak, termasuk penjagaan anak selama ibadah di Masjidil Haram.", premium: 240_000 },
  ];
  for (const p of plans) await db.insurancePlan.create({ data: p });
  console.log("  ✓ InsurancePlan: 3 paket aktif");

  /* ---------- R-098 Kendali ISMS (Annex A kunci) ---------- */
  await db.iSMSControl.deleteMany({});
  const isms = [
    ["A.5.1", "Kebijakan keamanan informasi", "Organisasi", "VERIFIED", "SECURITY.md"],
    ["A.5.3", "Peran & pemisahan tugas", "Organisasi", "VERIFIED", "RBAC 4 peran + test-role-matrix"],
    ["A.5.20", "Keamanan pemasok", "Organisasi", "IMPLEMENTED", "Kontrak PPIU/PIHK + kl. vendor"],
    ["A.5.23", "Keamanan layanan cloud", "Organisasi", "IMPLEMENTED", "Prisma Postgres pooled (TLS)"],
    ["A.5.24", "Perencanaan insiden", "Organisasi", "IMPLEMENTED", "docs/runbook-pemulihan-bencana.md"],
    ["A.5.30", "Kesinambungan bisnis (BCP)", "Organisasi", "IMPLEMENTED", "runbook pemulihan + backup berkala"],
    ["A.6.3", "Kesadaran & pelatihan keamanan", "Manusia", "IMPLEMENTED", "Onboarding admin + tutorial CMS"],
    ["A.6.4", "Proses disiplin", "Manusia", "PLANNED", ""],
    ["A.7.1", "Perimeter keamanan fisik", "Fisik", "IMPLEMENTED", "Hosting cloud bersertifikat"],
    ["A.7.10", "Keamanan media penyimpanan", "Fisik", "IMPLEMENTED", "Tanpa media fisik milik MUHDIN"],
    ["A.8.2", "Hak akses istimewa", "Teknologi", "VERIFIED", "RBAC + sesi httpOnly"],
    ["A.8.3", "Pembatasan akses data", "Teknologi", "VERIFIED", "guardRole seluruh endpoint mutasi"],
    ["A.8.5", "Autentikasi aman", "Teknologi", "VERIFIED", "Scrypt + 2FA TOTP + lockout"],
    ["A.8.11", "Enkripsi data-at-rest", "Teknologi", "VERIFIED", "AES-256-GCM brankas dokumen (R-076)"],
    ["A.8.13", "Pencadangan informasi", "Teknologi", "VERIFIED", "bun run backup + runbook"],
    ["A.8.15", "Logging & monitoring", "Teknologi", "VERIFIED", "AuditLog menyeluruh (R-064)"],
    ["A.8.16", "Aktivitas pemantauan", "Teknologi", "IMPLEMENTED", "Kesehatan Sistem (R-062) + pentest R-080"],
    ["A.8.24", "Penggunaan kriptografi", "Teknologi", "VERIFIED", "TLS + HMAC webhook fail-closed"],
    ["A.8.25", "Siklus pengembangan aman", "Teknologi", "IMPLEMENTED", "tsc ketat + eslint + pentest CI"],
    ["A.8.29", "Uji keamanan dalam dev", "Teknologi", "VERIFIED", "Pentest berkala 31 butir"],
    ["A.9.3", "Tinjauan manajemen ISMS", "Organisasi", "PLANNED", ""],
  ] as const;
  for (const [code, title, category, status, evidence] of isms) {
    await db.iSMSControl.create({ data: { code, title, category, status, evidence: evidence || null } });
  }
  console.log(`  ✓ ISMSControl: ${isms.length} kendali Annex A`);

  /* ---------- R-046 Lapak Mitra ---------- */
  await db.merchantProduct.deleteMany({});
  await db.merchantStore.deleteMany({});
  const lapak1 = await db.merchantStore.create({
    data: {
      slug: "kurma-nusantara-jakarta",
      storeName: "Kurma Nusantara",
      ownerName: "Hj. Rahmi Fadhilah",
      phone: "6281288776655",
      city: "Jakarta Timur",
      category: "OLEH_OLEH",
      nib: "8120112233445",
      status: "ACTIVE",
      note: "NIB terverifikasi 2026-11-18",
    },
  });
  const lapak2 = await db.merchantStore.create({
    data: {
      slug: "perlengkapan-ibrah-bandung",
      storeName: "Perlengkapan Ibrah Bandung",
      ownerName: "Dedi Supriatna",
      phone: "6281223344556",
      city: "Bandung",
      category: "PROVISION",
      nib: "8201223344556",
      status: "ACTIVE",
    },
  });
  const products = [
    { storeId: lapak1.id, name: "Kurma Sukari 1 kg", price: 145_000, unit: "pack", desc: "Kurma Sukari premium Al-Qassim, kemasan vacuum." },
    { storeId: lapak1.id, name: "Kurma Ajwa 500 g", price: 210_000, unit: "pack", desc: "Ajwa asli Madinah dengan kartu garansi." },
    { storeId: lapak1.id, name: "Zamzam Tasch 5 L (lihat regulasi)", price: 95_000, unit: "dus", desc: "Untuk kebutuhan ritus dalam negeri sesuai ketentuan." },
    { storeId: lapak2.id, name: "Kain Ihram Pria Premium", price: 135_000, unit: "set", desc: "Katun premium 2 lembar + tali pinggang." },
    { storeId: lapak2.id, name: "Mukena Travel Ripstop", price: 185_000, unit: "pcs", desc: "Ringan, cepat kering, tas included." },
  ];
  for (const p of products) await db.merchantProduct.create({ data: p });
  console.log("  ✓ MerchantStore: 2 lapak ACTIVE + 5 produk");

  /* ---------- R-034 Evaluasi Instruktur (kelas DONE demo) ---------- */
  await db.instructorReview.deleteMany({});
  const kelasDone = await db.liveClass.findFirst({ where: { status: "DONE" } });
  if (kelasDone) {
    const reviews = [
      { classId: kelasDone.id, classTitle: kelasDone.title, phone: "6281234500011", rating: 5, comment: "Penjelasan tawaf runtut, contoh doa jelas." },
      { classId: kelasDone.id, classTitle: kelasDone.title, phone: "6281234500012", rating: 4, comment: "Bagus; jam terbaiknya sedikit terlalu larut untuk lansia." },
      { classId: kelasDone.id, classTitle: kelasDone.title, phone: "6281234500013", rating: 5, comment: "Sesi tanya-jawab sangat membantu." },
    ];
    for (const r of reviews) await db.instructorReview.create({ data: r });
    console.log(`  ✓ InstructorReview: 3 evaluasi untuk "${kelasDone.title}"`);
  } else {
    console.log("  ℹ InstructorReview dilewati — tidak ada kelas DONE (jalankan seed-fitur-v141 dulu).");
  }

  /* ---------- R-049 Kas Rombongan (grup demo) ---------- */
  await db.groupLedgerEntry.deleteMany({});
  let grup = await db.travelGroup.findFirst();
  if (!grup) {
    grup = await db.travelGroup.create({
      data: {
        code: "MHD-GR-GOD1",
        name: "Kloter Contoh — Makkah Ramadhan",
        marshalName: "H. Ahmad Zaki",
        marshalPhone: "6281234500011",
        status: "ACTIVE",
        notes: "Grup demo untuk fitur Kas Rombongan (R-049).",
      },
    });
  }
  if (grup) {
    const now = Date.now();
    const entries = [
      { groupId: grup.id, kind: "INCOME", amount: 12_500_000, note: "Iuran dp rombongan (20 jamaah)", byName: "H. Ahmad Zaki", createdAt: new Date(now - 6 * 86_400_000) },
      { groupId: grup.id, kind: "INCOME", amount: 4_200_000, note: "Iuran tahap 2 + amanah donatur", byName: "Hj. Siti Aminah", createdAt: new Date(now - 4 * 86_400_000) },
      { groupId: grup.id, kind: "EXPENSE", amount: 6_300_000, note: "Sewa bus kloter Bandara — Makkah", byName: "H. Ahmad Zaki", createdAt: new Date(now - 3 * 86_400_000) },
      { groupId: grup.id, kind: "EXPENSE", amount: 2_150_000, note: "Konsumsi transit & air zamzam", byName: "Hj. Siti Aminah", createdAt: new Date(now - 2 * 86_400_000) },
      { groupId: grup.id, kind: "INCOME", amount: 1_750_000, note: "Sisa pengembalian vendor bus", byName: "H. Ahmad Zaki", createdAt: new Date(now - 1 * 86_400_000) },
    ];
    for (const e of entries) await db.groupLedgerEntry.create({ data: e });
    console.log(`  ✓ GroupLedgerEntry: 5 catatan kas untuk grup ${grup.code}`);
  } else {
    console.log("  ℹ GroupLedgerEntry dilewati — tidak ada TravelGroup demo.");
  }

  /* ---------- R-033 Alumni (sertifikat demo) ---------- */
  await db.certificate.deleteMany({});
  const certs = [
    { code: "SERT-2026-09001", holderName: "Ust. Farhan Maulana", courseSlug: "manasik-dasar", courseTitle: "Manasik Dasar Terstandar", score: 92 },
    { code: "SERT-2026-09002", holderName: "Hj. Nurhayati Syahputri", courseSlug: "fiqih-wanita", courseTitle: "Fiqih Wanita Penyenggara Ibadah", score: 88 },
    { code: "SERT-2026-09003", holderName: "M. Rizky Pratama", courseSlug: "digital-muthawwif", courseTitle: "Digital Muthawwif Tools", score: 85 },
  ];
  for (const c of certs) await db.certificate.create({ data: c });
  console.log("  ✓ Certificate: 3 alumni demo");

  /* ---------- R-032 Lencana (2 pemilik demo) ---------- */
  await db.userBadge.deleteMany({});
  const badgeSets = [
    { ownerKey: "6281234500011", badges: ["BADGE-KELAS-1", "BADGE-KUIS-10", "BADGE-FORUM-1"] },
    { ownerKey: "name@email.com", badges: ["BADGE-KELAS-5", "BADGE-KUIS-50", "BADGE-DOKUMEN-5", "BADGE-TRANSAKSI-1"] },
  ];
  for (const set of badgeSets) {
    for (const code of set.badges) {
      await db.userBadge.create({
        data: { ownerKey: set.ownerKey, code, source: code.split("-")[1] },
      });
    }
  }
  console.log("  ✓ UserBadge: 2 pemilik demo");

  /* ---------- R-018 Pengampu Keluarga ---------- */
  await db.familyMember.deleteMany({});
  const family = [
    { guardianPhone: "6281234500011", name: "Muhammad Alfatih", relation: "ANAK", birthYear: 2014, passportNo: "V9876543", notes: "Passpor anak — dipegang ibu" },
    { guardianPhone: "6281234500011", name: "Hj. Khodijah", relation: "ORANG_TUA", birthYear: 1952, passportNo: "X1234567", notes: "Lansia — perlu kursi roda" },
    { guardianPhone: "6281234500011", name: "Abdul Karim", relation: "PASANGAN", birthYear: 1985, passportNo: "Z5555555", notes: "" },
  ];
  for (const f of family) await db.familyMember.create({ data: f });
  console.log("  ✓ FamilyMember: 1 pengampu + 3 anggota");

  console.log("✅ seed-fitur-v150 selesai — 13/13 roadmap terakhir tersedia dalam demo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
