/**
 * seed-itinerary.ts — Task 19 (R-009): itinerary harian contoh.
 *
 * Mengisi ItineraryDay untuk paket unggulan yang belum punya rundown.
 * Idempoten: paket yang sudah beritinerary dilewati.
 * Jalankan: npx tsx scripts/seed-itinerary.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const TEMPLATES: Record<string, { title: string; plan: string; location: string }[]> = {
  UMROH: [
    { title: "Keberangkatan — Jahrom 1", plan: "Kumpul di bandara 4 jam sebelum terbang. Bagian-1 briefing manasik & pembagian rombongan bus.", location: "Jeddah" },
    { title: "Tiba di Jeddah — Menuju Makkah", plan: "Proses imigrasi, naik bus ke Makkah, miqat di perjalanan, tiba hotel, istirahat.", location: "Makkah" },
    { title: "Umroh Pertama", plan: "Ihram, tawaf 7 putaran, sa'i Safa-Marwah, tahallul. Pendampingan penuh muthowif.", location: "Makkah" },
    { title: "Ibadah di Masjidil Haram", plan: "Shalat 5 waktu di Haram, tadarus & zikir, waktu bebas di area hotel.", location: "Makkah" },
    { title: "Ziarah Makkah", plan: "Ziarah Jabal Tsur, Gua Hira, Jabal Rahmah, pabrik kiswah (jadwal panitia).", location: "Makkah" },
    { title: "Perpindahan ke Madinah", plan: "Bus jabal (kereta Haramain bila dijadwalkan), tiba hotel Madinah, istirahat.", location: "Madinah" },
    { title: "Raudhoh & Ziarah Madinah", plan: "Shalat di Masjid Nabawi, kunjungan Raudhoh sesuai jadwal permit, ziarah Masjid Quba.", location: "Madinah" },
    { title: "Bebas & Belanja", plan: "Waktu bebas kurma & suvenir, shalat perpisahan di Nabawi.", location: "Madinah" },
    { title: "Penerbangan Pulang", plan: "Checkout, bus ke bandara Madinah/Jeddah, tiba di Indonesia. Sampai jumpa tahun depan!", location: "Madinah" },
  ],
  HAJI: [
    { title: "Manasik Akhir & Keberangkatan", plan: "Manasik utuh bersama dewan pembimbing, penerbangan ke Jeddah.", location: "Jeddah" },
    { title: "Miqat & Wukuf Arafah", plan: "Menuju Arafah, wukuf hingga matahari terbenam, doa sepanjang siang.", location: "Arafah" },
    { title: "Muzdalifah & Lempar Jumrah", plan: "Overnight Muzdalifah, ambil batu, lempar Jumrah Aqabah, tahallul.", location: "Muzdalifah" },
    { title: "Tawaf Ifadhoh & Sa'i", plan: "Tawaf ifadhoh, sa'i Hajar-Ismail, kembali ke dormitori Mina.", location: "Mina" },
    { title: "Hari Tasyriq di Mina", plan: "Mabit Mina, lempar jumrah Ula & Wusta, sesi tadarus kelompok.", location: "Mina" },
    { title: "Tawaf Wada' & Madinah", plan: "Tawaf perpisahan, pindah ke Madinah, Raudhoh & ziarah.", location: "Madinah" },
  ],
  ZIARAH: [
    { title: "Keberangkatan & Tiba", plan: "Penerbangan, tiba, check-in, orientasi singkat panitia.", location: "Madinah" },
    { title: "Ziarah Inti", plan: "Kunjungan situs sejarah islami sesuai paket, dipandu pemandu bersertifikat.", location: "Madinah" },
    { title: "Hari Bebas Terstruktur", plan: "Ibadah pribadi & belanja, kumpul kembali untuk laporan perjalanan.", location: "Makkah" },
  ],
};

async function main() {
  const packages = await db.tourPackage.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, title: true, type: true, durationDays: true, _count: { select: { itinerary: true } } },
    take: 12,
  });
  let filled = 0;
  for (const p of packages) {
    if (p._count.itinerary > 0) {
      console.log(`  lewati (sudah ada): ${p.title.slice(0, 40)}`);
      continue;
    }
    const base = TEMPLATES[p.type] || TEMPLATES.UMROH;
    const days = Array.from({ length: Math.max(p.durationDays, base.length) }, (_, i) => base[i % base.length]).slice(0, Math.max(p.durationDays, base.length));
    await db.itineraryDay.createMany({
      data: days.map((d, i) => ({ packageId: p.id, day: i + 1, title: d.title, plan: d.plan, location: d.location })),
    });
    filled++;
    console.log(`  isi ${days.length} hari: ${p.title.slice(0, 44)}`);
  }
  console.log(`Selesai: ${filled} paket diberi itinerary.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
