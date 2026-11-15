/**
 * seed-membership.ts — v11 Keanggotaan Power Pack.
 *
 * Isi idempoten: KTA Digital (auto untuk semua anggota TERVERIFIKASI),
 * kursus Manasik Academy (trilingual + quiz), contoh pendaftar + sertifikat,
 * slot layanan mendatang, dan katalog benefit mitra.
 *
 * Jalankan: npx tsx scripts/seed-membership.ts
 */
import { PrismaClient } from "@prisma/client";


const db = new PrismaClient();

const tril = (id: string, en: string, ar: string) => JSON.stringify({ id, en, ar });

interface Q { q: string; options: string[]; answer: number }

const COURSES: Array<{
  slug: string; /** sudah JSON trilingual dari tril() */ title: string; summary: string;
  category: string; level: string; durationMin: number; modules: number;
  rewardPoints: number; icon: string; color: string; order: number; quiz: Q[];
}> = [
  {
    slug: "manasik-umrah-dasar", title: tril("Manasik Umrah Dasar", "Basic Umrah Manasik", "مناسك العمرة الأساسية"),
    summary: tril("Rukun, wajib, dan tata cara umrah dari niat ihram hingga tahallul — panduan resmi untuk jamaah dan pendamping.",
      "Pillars, obligations, and step-by-step umrah ritual from ihram intention to tahallul.",
      "الأركان والواجبات وطريقة العمرة من الإحرام إلى التحلل."),
    category: "MANASIK", level: "DASAR", durationMin: 90, modules: 5, rewardPoints: 30,
    icon: "moon-star", color: "emerald", order: 1,
    quiz: [
      { q: "Berapa rukun umrah?", options: ["4", "5", "6", "7"], answer: 1 },
      { q: "Niat umrah disebut juga…", options: ["Talbiyah", "Ihram", "Tawaf", "Sa'i"], answer: 1 },
      { q: "Melakukurun antara Shafa dan Marwah disebut…", options: ["Tawaf", "Sa'i", "Tahallul", "Wukuf"], answer: 1 },
    ],
  },
  {
    slug: "manasik-haji-lengkap", title: tril("Manasik Haji Lengkap", "Complete Hajj Manasik", "مناسك الحج الكاملة"),
    summary: tril("Alur haji dari miqat, wukuf Arafah, mabit Mina hingga tawaf ifadhah — termasuk skenario darurat.",
      "Full hajj flow from miqat to ifadhah tawaf including emergency scenarios.",
      "تسلسل الحج من الميقات إلى طواف الإفاضة مع سيناريوهات الطوارئ."),
    category: "MANASIK", level: "MENENGAH", durationMin: 120, modules: 7, rewardPoints: 40,
    icon: "landmark", color: "emerald", order: 2,
    quiz: [
      { q: "Wukuf dilaksanakan di…", options: ["Mina", "Muzdalifah", "Arafah", "Makkah"], answer: 2 },
      { q: "Hari tasyriq berjumlah…", options: ["2 hari", "3 hari", "4 hari", "5 hari"], answer: 1 },
      { q: "Melempar jumrah pertama dilakukan di hari…", options: ["Idul Adha", "11 Dzulhijjah", "12 Dzulhijjah", "13 Dzulhijjah"], answer: 0 },
    ],
  },
  {
    slug: "kompetensi-muthowif", title: tril("Kompetensi Muthowif Profesional", "Professional Mutawwif Competency", "كفاءة المطوّف المحترف"),
    summary: tril("Standar kompetensi muthowif: fiqh manasik, komunikasi antarbudaya, penanganan jamaah lansia & darurat medis.",
      "Mutawwif competency standards: manasik fiqh, cross-cultural communication, elderly & medical emergency handling.",
      "معايير كفاءة المطوّف: فقه المناسك والتواصل والتعامل مع الحالات الطارئة."),
    category: "KOMPETENSI", level: "LANJUT", durationMin: 150, modules: 8, rewardPoints: 50,
    icon: "users", color: "teal", order: 3,
    quiz: [
      { q: "Rasio maksimal muthowif terhadap jamaah sesuai standar MUHDIN…", options: ["1:30", "1:45", "1:60", "1:100"], answer: 1 },
      { q: "Jamaah tertinggal di titik kumpul — langkah PERTAMA…", options: ["Cari sendiri", "Lapor command center & aktifkan GPS rombongan", "Lanjut itinerary", "Tunggu 3 jam"], answer: 1 },
      { q: "Dokumen wajib yang dibawa muthowif selama itinerary…", options: ["Paspor jamaah semua", "Daftar rombongan + kartu identitas + izin", "Uang jamaah", "Tiket semua jamaah"], answer: 1 },
    ],
  },
  {
    slug: "fiqh-wanita-jamaah", title: tril("Fiqh Jamaah Wanita", "Women Pilgrim Fiqh", "فقه الحاجات النسائية"),
    summary: tril("Masalah fiqh khusus jamaah wanita: ihram, haid & nifas, penundaan umrah, dan pendampingan mahram.",
      "Women-specific fiqh: ihram, menstruation, umrah postponement, and mahram companionship.",
      "أحكام خاصة بالنساء: الإحرام والحيض وتأجيل العمرة والمحرم."),
    category: "SYARIAH", level: "MENENGAH", durationMin: 75, modules: 4, rewardPoints: 30,
    icon: "heart", color: "rose", order: 4,
    quiz: [
      { q: "Jamaah wanita yang haid saat ihram umrah…", options: ["Batal umrahnya", "Menunggu suci lalu melanjutkan", "Diganti pria", "Tawaf saja"], answer: 1 },
      { q: "Sarung tangan bagi wanita berihram haji…", options: ["Haram", "Makruh", "Wajib", "Sunnah"], answer: 1 },
    ],
  },
  {
    slug: "digital-marketing-pelayanan", title: tril("Digital Marketing Layanan Ibadah", "Digital Marketing for Pilgrim Services", "التسويق الرقمي لخدمات الحج"),
    summary: tril("Strategi pemasaran digital yang halal & profesional untuk PPIU/PIHK: konten, iklan, hingga penanganan review negatif.",
      "Halal, professional digital marketing for pilgrim operators: content, ads, and review handling.",
      "تسويق رقمي مهني لمشغلي الحج: المحتوى والإعلانات وإدارة التقييمات."),
    category: "DIGITAL", level: "DASAR", durationMin: 60, modules: 4, rewardPoints: 20,
    icon: "megaphone", color: "gold", order: 5,
    quiz: [
      { q: "Konten promosi paket umrah WAJIB…", options: ["Melebih-lebihkan", "Jujur sesuai kontrak & tidak menyesatkan", "Meniru kompetitor", "Menjanjikan pasti haji"], answer: 1 },
      { q: "Review negatif terbaik ditangani dengan…", options: ["Menghapus", "Membantah keras", "Empati + solusi terdokumentasi", "Mengabaikan"], answer: 2 },
    ],
  },
  {
    slug: "first-aid-jamaah", title: tril("Pertolongan Pertama Jamaah", "Pilgrim First Aid", "الإسعافات الأولية للحجاج"),
    summary: tril("Penanganan awal kondisi darurat jamaah: heatstroke, dehidrasi, sesak, hingga protokol rujukan rumah sakit Saudi.",
      "First response for pilgrim emergencies: heatstroke, dehydration, breathing issues, Saudi hospital referral protocol.",
      "الاستجابة الأولى لحالات الطوارئ: ضربة الشمس والجفاف وبروتوكول الإحالة."),
    category: "KOMPETENSI", level: "MENENGAH", durationMin: 90, modules: 5, rewardPoints: 30,
    icon: "heart-pulse", color: "rose", order: 6,
    quiz: [
      { q: "Gejala heatstroke berat — tindakan pertama…", options: ["Beri minum banyak", "Pindahkan ke tempat sejuk + kompres + panggil medis", "Biarkan istirahat", "Beri kopi"], answer: 1 },
      { q: "Nomor darurat ambulans di Arab Saudi…", options: ["110", "997", "911", "112"], answer: 1 },
    ],
  },
];

const SERVICES = ["KELAS_MANASIK", "KONSULTASI_SYARIAH", "KLINIK_VAKSIN"] as const;
const CITIES: Array<[string, string]> = [
  ["Jakarta", "Kantor Pusat MUHDIN, Jakarta Selatan"],
  ["Surabaya", "Kantor DPD Jawa Timur"],
  ["Bandung", "Kantor DPD Jawa Barat"],
  ["Makassar", "Kantor DPD Sulawesi Selatan"],
];

const BENEFITS: Array<{
  title: string; partnerName: string; category: string; description: string;
  discountText: string; pointsCost: number; quota: number | null; icon: string; color: string;
}> = [
  { title: "Diskon 20% malam pertama hotel Makkah", partnerName: "Hotel Zamzam Grand", category: "HOTEL", description: "Diskon khusus pemegang KTA Digital untuk menginap minimal 3 malam di musim ramai maupun low season.", discountText: "Diskon 20%", pointsCost: 0, quota: 100, icon: "hotel", color: "emerald" },
  { title: "Upgrade kamar Madinah tanpa biaya", partnerName: "Taiba Suites Partner", category: "HOTEL", description: "Upgrade ke kamar view Masjid Nabawi selama ketersediaan ada, untuk rombongan anggota MUHDIN.", discountText: "Free Upgrade", pointsCost: 100, quota: 40, icon: "building", color: "teal" },
  { title: "Diskon 15% sewa bus rombongan", partnerName: "Trans Haramain Fleet", category: "TRANSPORT", description: "Diskon sewa bus antar kota (Jeddah–Makkah–Madinah) untuk rombongan dengan KTA aktif.", discountText: "Diskon 15%", pointsCost: 50, quota: 60, icon: "bus", color: "gold" },
  { title: "Vaksin meningitis gratis biaya layanan", partnerName: "Klinik Sehat Jamaah", category: "VAKSIN", description: "Bebas biaya layanan pemeriksaan pra-vaksinasi untuk jamaah yang membawa kartu KTA Digital.", discountText: "Gratis Biaya Layanan", pointsCost: 0, quota: 200, icon: "syringe", color: "emerald" },
  { title: "Konsultasi syariah kontrak umrah 1 jam gratis", partnerName: "Dewan Syariah MUHDIN", category: "EDUKASI", description: "Sesi konsultasi kontrak & sengketa layanan ibadah dengan pendamping Dewan Syariah.", discountText: "1 Jam Gratis", pointsCost: 0, quota: null, icon: "scale", color: "teal" },
  { title: "Potongan 250.000 paket umrah reguler", partnerName: "Anggota PPIU Terverifikasi (rotasi)", category: "UMRAH_PAKET", description: "Potongan langsung paket umrah reguler 9–12 hari untuk pemegang KTA tier VERIFIED ke atas.", discountText: "Potongan Rp 250rb", pointsCost: 300, quota: 30, icon: "plane", color: "gold" },
  { title: "Diskon 25% kelas manasik privat", partnerName: "Manasik Academy Partner", category: "EDUKASI", description: "Diskon kelas manasik privat offline untuk keluarga jamaah anggota.", discountText: "Diskon 25%", pointsCost: 150, quota: 50, icon: "graduation-cap", color: "emerald" },
  { title: "Handling bagasi prioritas bandara", partnerName: "Ground Handling Partner", category: "TRANSPORT", description: "Layanan penanganan bagasi prioritas kedatangan rombongan di Jeddah/King Abdulaziz.", discountText: "Prioritas", pointsCost: 200, quota: 25, icon: "package", color: "teal" },
];

async function main() {
  console.log("=== v11 Seed: Keanggotaan Power Pack ===");

  // ---------- 1) KTA Digital untuk semua anggota TERVERIFIKASI ----------
  const members = await db.member.findMany({ where: { status: "TERVERIFIKASI" }, orderBy: { createdAt: "asc" } });
  let issued = 0;
  for (const m of members) {
    const exists = await db.memberCard.findUnique({ where: { memberId: m.id } });
    if (exists) continue;
    const count = await db.memberCard.count();
    const cardNo = `KTA-2026-${String(count + 1).padStart(5, "0")}`;
    const card = await db.memberCard.create({ data: { cardNo, memberId: m.id, referralCode: "" } });
    const referralCode = `MHD-REF-${card.id.slice(-8).toUpperCase().replace(/[^A-Z0-9]/g, "X")}`;
    const points = 50 + (issued % 3) * 60; // variasi demo: 50/110/170
    await db.memberCard.update({ where: { id: card.id }, data: { referralCode, points, tier: points >= 300 ? "VERIFIED" : "KLASIK" } });
    await db.pointLedger.create({ data: { cardId: card.id, delta: 50, reason: "REGISTER", note: "Pendaftaran awal KTA Digital", balanceAfter: 50 } });
    if (points > 50) {
      await db.pointLedger.create({ data: { cardId: card.id, delta: points - 50, reason: "REFERRAL", note: "Riwayat referal anggota (demo)", balanceAfter: points } });
    }
    issued += 1;
  }
  console.log(`KTA terbit: ${issued} (total ${await db.memberCard.count()})`);

  // Satu kartu mencapai PLATINUM untuk demo leaderboard
  const topCard = await db.memberCard.findFirst({ orderBy: { points: "desc" } });
  if (topCard && topCard.points < 800) {
    await db.pointLedger.create({ data: { cardId: topCard.id, delta: 800 - topCard.points, reason: "ADMIN", note: "Penghargaan komitmen kualitas layanan (demo)", balanceAfter: 800 } });
    await db.memberCard.update({ where: { id: topCard.id }, data: { points: 800, tier: "PLATINUM" } });
  }

  // ---------- 2) Kursus Academy ----------
  let coursesCreated = 0;
  for (const c of COURSES) {
    const exists = await db.academyCourse.findUnique({ where: { slug: c.slug } });
    if (exists) continue;
    await db.academyCourse.create({
      data: {
        slug: c.slug,
        title: c.title,
        summary: c.summary,
        category: c.category, level: c.level, durationMin: c.durationMin,
        modules: c.modules, rewardPoints: c.rewardPoints, passScore: 70,
        quiz: JSON.stringify(c.quiz), icon: c.icon, color: c.color, order: c.order,
      },
    });
    coursesCreated += 1;
  }
  console.log(`Kursus baru: ${coursesCreated} (total ${await db.academyCourse.count()})`);

  // ---------- 3) Contoh pendaftar + sertifikat ----------
  const demoEnrolls: Array<{ slug: string; name: string; email: string; score: number }> = [
    { slug: "manasik-umrah-dasar", name: "Hj. Siti Aminah (Tour Leader Garuda Jamaah)", email: "siti.aminah@garudajamaah.id", score: 90 },
    { slug: "kompetensi-muthowif", name: "Ust. Abdul Karim", email: "karim.muthowif@muhdin.web.id", score: 85 },
  ];
  for (const de of demoEnrolls) {
    const course = await db.academyCourse.findUnique({ where: { slug: de.slug } });
    if (!course) continue;
    const exists = await db.academyEnrollment.findFirst({ where: { email: de.email, courseSlug: de.slug } });
    if (exists) continue;
    const enroll = await db.academyEnrollment.create({
      data: { courseSlug: de.slug, name: de.name, email: de.email, score: de.score, status: "ONGOING" },
    });
    const certCount = await db.certificate.count();
    const cert = await db.certificate.create({
      data: {
        code: `SERT-2026-${String(1000 + certCount + 1).slice(-4)}${String(certCount + 1).padStart(4, "0")}`,
        holderName: de.name, courseSlug: de.slug, courseTitle: course.title, score: de.score,
      },
    });
    await db.academyEnrollment.update({
      where: { id: enroll.id },
      data: { status: "COMPLETED", completedAt: new Date(), certificateId: cert.id },
    });
    console.log(`Sertifikat demo: ${cert.code} → ${de.name}`);
  }

  // ---------- 4) Slot layanan mendatang ----------
  let slotsCreated = 0;
  const existingSlots = await db.serviceSlot.count();
  if (existingSlots === 0) {
    const day = 24 * 60 * 60 * 1000;
    const plan: Array<{ svc: (typeof SERVICES)[number]; title: string; idx: number; hour: number; cap: number }> = [
      { svc: "KELAS_MANASIK", title: "Manasik Umrah Kelas Reguler Batch 12", idx: 3, hour: 9, cap: 40 },
      { svc: "KELAS_MANASIK", title: "Manasik Haji Kelas Intensif Wanita", idx: 5, hour: 13, cap: 35 },
      { svc: "KELAS_MANASIK", title: "Manasik Fokus Doa & Talbiyah", idx: 9, hour: 10, cap: 30 },
      { svc: "KONSULTASI_SYARIAH", title: "Konsultasi Kontrak & Sengketa Layanan", idx: 2, hour: 14, cap: 8 },
      { svc: "KONSULTASI_SYARIAH", title: "Konsultasi Akad & Pembatalan Paket", idx: 6, hour: 14, cap: 8 },
      { svc: "KLINIK_VAKSIN", title: "Klinik Vaksin Meningitis + Sertifikat ICC", idx: 4, hour: 8, cap: 60 },
      { svc: "KLINIK_VAKSIN", title: "Klinik Vaksin Flu & Polio Jamaah", idx: 8, hour: 8, cap: 50 },
    ];
    for (const p of plan) {
      const [city, venue] = CITIES[p.idx % CITIES.length];
      const startsAt = new Date(Date.now() + p.idx * day);
      startsAt.setHours(p.hour, 0, 0, 0);
      await db.serviceSlot.create({
        data: { service: p.svc, title: p.title, city, venue, startsAt, durationMin: 90, capacity: p.cap },
      });
      slotsCreated += 1;
    }
  }
  console.log(`Slot baru: ${slotsCreated} (total ${await db.serviceSlot.count()})`);

  // ---------- 5) Benefit mitra ----------
  let benefitsCreated = 0;
  for (const b of BENEFITS) {
    const exists = await db.benefit.findFirst({ where: { title: b.title } });
    if (exists) continue;
    // Tautkan ke anggota dengan nama mirip partner bila ada (opsional).
    await db.benefit.create({ data: { ...b, validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) } });
    benefitsCreated += 1;
  }
  console.log(`Benefit baru: ${benefitsCreated} (total ${await db.benefit.count()})`);

  console.log("=== SEED SELESAI ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
