/**
 * seed-fitur-v141.ts — v14.1 «AKADEMI & MITRA» — data demo idempoten.
 *
 * Mengisi: Kelas Live (3) + pendaftar, Forum per-kelas (2 thread),
 * Merchant Partner (8) + tebusan, Price Rules (2), Group Order (1),
 * Mosque Partner (5) + aktivitas, ApiPartner (1 dengan kunci demo).
 *
 * Idempoten: hapus data demo lama (by marker) lalu isi ulang.
 * Jalankan: npx tsx scripts/seed-fitur-v141.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 seed-fitur-v141 — v14.1 «AKADEMI & MITRA»");

  /* ---------- R-024/R-025 Kelas Live + pendaftar + forum per-kelas ---------- */
  await db.liveClassRegistration.deleteMany({});
  await db.liveClass.deleteMany({});
  const now = new Date();
  const kelas1 = await db.liveClass.create({
    data: {
      title: "Manasik Praktis: Tata Cara Tawaf & Sa'i",
      description: "Langkah demi langkah tawaf 7 putaran, doa antara rukun yamani–hajar aswad, dan sa'i mulai dari Shafa.",
      instructor: "Ust. H. Saiful Rahmat Dasuki",
      level: "UMUM",
      startsAt: new Date(now.getTime() + 3 * 86_400_000),
      durationMin: 90,
      platform: "ZOOM",
      capacity: 200,
      status: "SCHEDULED",
      joinUrl: "https://zoom.us/j/demo-muhdin-tawaf",
    },
  });
  const kelas2 = await db.liveClass.create({
    data: {
      title: "Kelas Mentor: Metodologi Bimbingan Jamaah Lansia",
      description: "Kelas LANJUTAN bagi muthawwif: pola pendampingan lansia, ritme istirahat, dan manajemen grup besar.",
      instructor: "H. Gugun Gunara, S.E.",
      level: "LANJUTAN",
      startsAt: new Date(now.getTime() + 6 * 86_400_000),
      durationMin: 120,
      platform: "MEET",
      capacity: 60,
      status: "SCHEDULED",
      joinUrl: "https://meet.google.com/demo-muhdin-mentor",
    },
  });
  const kelas3 = await db.liveClass.create({
    data: {
      title: "Webinar Manasik Wanita: Fiqih Haidh Saat Ibadah",
      description: "Ketentuan haidh saat ihram/tawaf/sa'i, badal, dan niat dam — rekaman tersedia setelah kelas.",
      instructor: "Ustzh. N. Rusmiati",
      level: "DASAR",
      startsAt: new Date(now.getTime() - 7 * 86_400_000),
      durationMin: 90,
      platform: "ZOOM",
      capacity: 150,
      status: "DONE",
      recordingUrl: "https://youtube.com/@muhdin/demo-manasik-wanita",
    },
  });
  const regs = [
    { classId: kelas1.id, name: "Ahmad Subarkah", phone: "+6281222340001" },
    { classId: kelas1.id, name: "Fatimah Zahra", phone: "+6281222340002" },
    { classId: kelas1.id, name: "Hj. Siti Maryam", phone: "+6281222340003", attended: false },
    { classId: kelas2.id, name: "Muthawwif H. Ridwan", phone: "+6281222340004" },
    { classId: kelas2.id, name: "Muthawwif Ahmad Dahlan", phone: "+6281222340005" },
    { classId: kelas3.id, name: "Nurul Hidayah", phone: "+6281222340006", attended: true, feedback: "Partisipatif, lanjutkan ke kelas LANJUTAN." },
    { classId: kelas3.id, name: "Kholifah Aminah", phone: "+6281222340007", attended: true, feedback: "Perlu pendalaman rukun ihram — sudah diberi materi tambahan." },
  ];
  for (const r of regs) {
    await db.liveClassRegistration.create({
      data: {
        classId: r.classId,
        name: r.name,
        phone: r.phone,
        attended: r.attended ?? false,
        mentorFeedback: r.feedback ?? null,
      },
    });
  }
  // R-025 — forum per-kelas
  await db.forumThread.deleteMany({ where: { kelasId: { not: null } } });
  await db.forumThread.create({
    data: {
      title: "Putaran tawaf terputus karena shalat berjamaah — ulang dari mana?",
      body: "Assalamu'alaikum, saat tawaf putaran keempat terputus shalat berjamaah. Apakah lanjut dari putaran kelima atau ulang dari awal? Mohon pencerahan mentor.",
      authorName: "Ahmad Subarkah",
      category: "Manasik",
      kelasId: kelas1.id,
      status: "APPROVED",
      pinned: true,
    },
  });
  await db.forumThread.create({
    data: {
      title: "Rekaman webinar manasik wanita sudah tayang di kanal MUHDIN",
      body: "Rekaman kelas 7 hari lalu sudah tayang. Silakan tonton di kanal resmi MUHDIN, dan sampaikan pertanyaan lanjutan di diskusi kelas ini.",
      authorName: "Sekretariat Akademi",
      category: "Manasik",
      kelasId: kelas3.id,
      status: "APPROVED",
    },
  });
  console.log(`  ✓ Kelas Live: 3 (2 mendatang, 1 selesai + rekaman) · pendaftar ${regs.length} · forum per-kelas 2`);

  /* ---------- R-029 Merchant Partner ---------- */
  await db.merchantRedemption.deleteMany({});
  await db.merchantPartner.deleteMany({});
  const merchants = [
    { name: "Toko Kurma Nabawi Jakarta", category: "RITEL", discountText: "20% untuk semua kurma premium", city: "Jakarta Selatan", minTier: "KLASIK", description: "Berlaku seluruh cabang; tunjukkan kartu KTA di kasir." },
    { name: "Hotel Grand Zamzam Madinah", category: "HOTEL", discountText: "Diskon 15% + late checkout 16:00", city: "Madinah", minTier: "VERIFIED", description: "Untuk pemesanan langsung dengan kode anggota." },
    { name: "Laundry Khusyuk Travel", category: "UMUM", discountText: "Paket 5 kg GRATIS 1 kg", city: "Makkah", minTier: "KLASIK", description: "Antar-jemput area central." },
    { name: "Sertifikasi Muthawwif Partner", category: "UMUM", discountText: "Kursus lanjutan potongan Rp 250.000", city: "Jakarta", minTier: "VERIFIED", description: "Untuk anggota yang sedang menempuh jalur sertifikasi." },
    { name: "Butik Ihram Premium", category: "PAKAIAN", discountText: "Beli 2 kain ihram gratis sabuk", city: "Surabaya", minTier: "KLASIK", description: "Kain katun premium dengan saku dokumen." },
    { name: "Klinik Vaksin Sahabat", category: "UMUM", discountText: "Meningitis + flu hemat Rp 100.000", city: "Bekasi", minTier: "KLASIK", description: "Sertifikat vaksin digital langsung ke brankas MUHDIN." },
    { name: "Trans Lokal Madinah", category: "TRANSPORTASI", discountText: "Charter harian potongan 10%", city: "Madinah", minTier: "PLATINUM", description: "Armada VIP 13 kursi, driver berpengalaman." },
    { name: "Katering Haji Ibu Sari", category: "KULINER", discountText: "Paket makan group 10 porsi gratis 1", city: "Cilegon", minTier: "KLASIK", description: "Menu nusantara untuk rombongan." },
  ];
  for (const m of merchants) {
    await db.merchantPartner.create({ data: { ...m, active: true } });
  }
  const firstMerchant = await db.merchantPartner.findFirst({ where: { name: merchants[0].name } });
  const demoCard = await db.memberCard.findFirst({ include: { member: { select: { name: true } } } });
  if (firstMerchant && demoCard) {
    await db.merchantRedemption.create({
      data: { merchantId: firstMerchant.id, cardNo: demoCard.cardNo, holderName: demoCard.member.name, note: "Tebusan demo seed v14.1" },
    });
  }
  console.log(`  ✓ Merchant Partner: ${merchants.length} aktif` + (firstMerchant ? " · 1 tebusan demo" : ""));

  /* ---------- R-043 Price Rules ---------- */
  await db.priceRule.deleteMany({});
  const pkg1 = await db.tourPackage.findFirst({ orderBy: { createdAt: "asc" } });
  const pkg2 = await db.tourPackage.findFirst({ orderBy: { createdAt: "desc" } });
  if (pkg1) {
    await db.priceRule.create({
      data: {
        packageId: pkg1.id,
        kind: "EARLYBIRD",
        deadline: new Date(now.getTime() + 45 * 86_400_000),
        adjustType: "PERCENT",
        value: 8,
        label: "Early Bird Winter Journey",
        active: true,
      },
    });
  }
  if (pkg2) {
    await db.priceRule.create({
      data: {
        packageId: pkg2.id,
        kind: "SEASONAL",
        monthFrom: 11,
        monthTo: 2,
        adjustType: "PERCENT",
        value: 10,
        label: "Promo Musim Dingin Nov–Feb",
        active: true,
      },
    });
  }
  console.log(`  ✓ Price Rules: ${pkg1 ? 1 : 0} early bird + ${pkg2 ? 1 : 0} seasonal`);

  /* ---------- R-045 Group Order B2B ---------- */
  await db.groupOrder.deleteMany({});
  if (pkg1) {
    await db.groupOrder.create({
      data: {
        code: "MHD-B2B-DEMO",
        groupName: "Rombongan Masjid Al-Ikhlas Cilegon",
        coordinatorName: "H. Ridwan Fauzi",
        coordinatorPhone: "+6281222345856",
        packageTitle: pkg1.title,
        departureDate: pkg1.departureDate,
        memberNames: JSON.stringify([
          "Ahmad Subarkah", "Fatimah Zahra", "Abdullah Yusuf", "Hj. Siti Maryam", "Muhammad Rifai",
          "Nurul Hidayah", "Kholifah Aminah", "Hasan Basri", "Aisyah Putri", "Usman Bakar",
          "Dewi Sartika", "Zainal Abidin", "Halimah Saadah", "Rahmat Hidayat",
        ]),
        memberCount: 14,
        unitPrice: pkg1.price,
        totalAmount: pkg1.price * 14,
        status: "PENDING",
        notes: "Demo seed — berangkat dari Pelabuhan Merak",
      },
    });
    console.log("  ✓ Group Order B2B demo: MHD-B2B-DEMO (14 jamaah)");
  }

  /* ---------- R-090 Mosque Partners + aktivitas ---------- */
  await db.partnerActivity.deleteMany({});
  await db.mosquePartner.deleteMany({});
  const partners = [
    { code: "MHD-MP-DEMO", name: "Masjid Agung Al-Ikhlas Cilegon", type: "MASJID", city: "Cilegon", province: "Banten", picName: "H. Ridwan Fauzi", phone: "+6281222345856", reach: 350, program: "UMRAH", status: "ACTIVE" },
    { code: "MHD-MP-AA01", name: "Komunitas Manasik Digital Serang", type: "KOMUNITAS", city: "Serang", province: "Banten", picName: "Ustzh. Halimah Saadah", phone: "+6281222345857", reach: 180, program: "KAJIAN", status: "ACTIVE" },
    { code: "MHD-MP-AA02", name: "Pesantren Tahfizh Al-Furqan", type: "SEKOLAH", city: "Tangerang", province: "Banten", picName: "KH. Zainal Abidin", phone: "+6281222345858", reach: 500, program: "TABARRUJ", status: "PENDING" },
    { code: "MHD-MP-AA03", name: "Yayasan Bunda Lansia Sejahtera", type: "YAYASAN", city: "Jakarta Selatan", province: "DKI Jakarta", picName: "Dewi Sartika", phone: "+6281222345859", reach: 120, program: "TABARRUJ", status: "ACTIVE" },
    { code: "MHD-MP-AA04", name: "Majelis Taklim Assalam Pekanbaru", type: "MASJID", city: "Pekanbaru", province: "Riau", picName: "H. Usman Bakar", phone: "+6281222345860", reach: 260, program: "KAJIAN", status: "PENDING" },
  ];
  for (const p of partners) {
    await db.mosquePartner.create({ data: p });
  }
  const demoPartner = await db.mosquePartner.findUnique({ where: { code: "MHD-MP-DEMO" } });
  if (demoPartner) {
    await db.partnerActivity.create({
      data: { partnerId: demoPartner.id, type: "KAJIAN", title: "Kajian Persiapan Umrah Ramadan", date: new Date(now.getTime() - 12 * 86_400_000), attendance: 210, notes: "Bersama Ust. Saiful Rahmat Dasuki" },
    });
    await db.partnerActivity.create({
      data: { partnerId: demoPartner.id, type: "UMRAH_BERSAMA", title: "Umrah Bersama 14 Jamaah (B2B)", date: new Date(now.getTime() + 20 * 86_400_000), attendance: 14, notes: "Terhubung group order MHD-B2B-DEMO" },
    });
    await db.partnerActivity.create({
      data: { partnerId: demoPartner.id, type: "TABARRUJ", title: "Sosialisasi Vaksin Meningitis", date: new Date(now.getTime() - 5 * 86_400_000), attendance: 95 },
    });
  }
  console.log(`  ✓ Mosque Partners: ${partners.length} (3 aktif, 2 menunggu) · 3 aktivitas demo`);

  /* ---------- R-065 API Partner demo ---------- */
  await db.apiPartner.deleteMany({});
  await db.apiPartner.create({
    data: {
      name: "MITRA DEMO — Sistem Portal Umrah",
      email: "integrasi@mitra-demo.co.id",
      keyHash: require("crypto").createHash("sha256").update("MHD-DEMO-KEY-0000000000000000000000").digest("hex"),
      keyPrefix: "MHD-DEMO",
      quotaDaily: 500,
      webhookUrl: "",
      webhookSecretHash: "",
      active: false, // demo nonaktif — tak bisa dipakai sampai sekretariat mengaktifkan & merotasi kunci
    },
  });
  console.log("  ✓ ApiPartner demo: MITRA DEMO (nonaktif, kunci harus dirotasi via CMS)");

  console.log("✅ seed-fitur-v141 selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
