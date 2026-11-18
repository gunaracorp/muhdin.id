/**
 * seed-travel-groups.ts — R-012 (v13.3): grup perjalanan demo.
 * 3 grup terikat paket marketplace, anggota dari kartu jamaah demo,
 * jadwal kumpul, dan percakapan singkat. Idempoten berdasarkan kode grup.
 * Jalankan: bun scripts/seed-travel-groups.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const at = (offsetHours: number) => new Date(Date.now() + offsetHours * 60 * 60 * 1000);

async function main() {
  const pkgs = await prisma.tourPackage.findMany({ orderBy: { createdAt: "asc" }, take: 6 });
  const cards = await prisma.pilgrimCard.findMany({ orderBy: { cardNo: "asc" } });

  const GROUPS = [
    {
      code: "MHD-GR-8F3K",
      name: "Rombl. Bakti Madinah 01",
      pkgIdx: 0,
      marshalName: "Ust. Kholid Ibrahim",
      marshalPhone: "+628219991122",
      notes: "Keberangkatan bandara Soekarno-Hatta Terminal 3. Bagasi maksimal 30 kg tercatat + 7 kg kabin. Jangan lupa paspor asli & vaksin meningen.",
      schedules: [
        { title: "Kumpul Terminal 3 Lane 5", location: "Soekarno-Hatta, pintu 4", startsAt: at(96), note: "Serahkan tas besar di konter MUHDIN; paspor tetap di tangan." },
        { title: "Manasik Prai-Keberangkatan", location: "Aula hotel transit", startsAt: at(48), note: "Materi: ihram, miqat, talbiyah." },
      ],
      messages: [
        { authorName: "Ust. Kholid Ibrahim", body: "Assalamualaikum rombongan. Seluruh paspor sudah dipegang panitia — cek WA masing-masing untuk nomor tiket.", hours: -30 },
        { authorName: "H. Ahmad Sutisna", body: "Waalaikumsalam, siap. Untuk kamar quadruple tetap kelompok asli ya Pak?", hours: -28 },
        { authorName: "Ust. Kholid Ibrahim", body: "Betul, tetap kelompok asli. Yang lansia ada wheelchair — sudah saya catat 2 unit.", hours: -27 },
      ],
    },
    {
      code: "MHD-GR-Q7MB",
      name: "Rombl. Noor Zamzam 04",
      pkgIdx: 1,
      marshalName: "Hj. Halimah Zahra",
      marshalPhone: "+628569988711",
      notes: "Program keluarga (anak 7 tahun ke atas). Menu makanan ramah anak; kursi roda tersedia untuk lansia.",
      schedules: [
        { title: "Rapat Persiapan Keluarga", location: "Zoom — tautan via WA", startsAt: at(120), note: "Bahasan: itinerer, kamar, doa-doa perangkat." },
      ],
      messages: [
        { authorName: "Hj. Halimah Zahra", body: "Ibu-ibu, stiker grup dipasang di koper agar mudah dikenali di bandara.", hours: -50 },
        { authorName: "Dewi Kartika", body: "Alhamdulillah, anak saya sudah latihan talbiyah tiap malam 😄", hours: -47 },
      ],
    },
    {
      code: "MHD-GR-2R9X",
      name: "Rombl. Ziarah Nusantara",
      pkgIdx: 2,
      marshalName: "H. Ahmad Sutisna",
      marshalPhone: "+6281234567890",
      notes: "Kombinasi umrah + ziarah Madinah. Bus AC selama perjalanan; kerudung tanda bus 7.",
      schedules: [
        { title: "Cek Dokumen Terakhir", location: "Kantor MUHDIN Pusat", startsAt: at(240), note: "Tanda tangan lembar pengesahan & serah terima paspor." },
      ],
      messages: [
        { authorName: "H. Ahmad Sutisna", body: "Cek grup ya — jadwal cek dokumen sudah dipasang di sini.", hours: -70 },
      ],
    },
  ];

  let created = 0;
  for (const g of GROUPS) {
    const exists = await prisma.travelGroup.findUnique({ where: { code: g.code } });
    if (exists) continue;
    const pkg = pkgs[g.pkgIdx] ?? null;
    const group = await prisma.travelGroup.create({
      data: {
        code: g.code,
        name: g.name,
        packageId: pkg?.id ?? null,
        departureDate: pkg?.departureDate ?? new Date(Date.now() + 21 * DAY),
        marshalName: g.marshalName,
        marshalPhone: g.marshalPhone,
        notes: g.notes,
        status: "ACTIVE",
      },
    });

    // Marshal jadi anggota pertama.
    await prisma.groupMember.create({
      data: { groupId: group.id, fullName: g.marshalName, phone: g.marshalPhone, role: "MARSHAL" },
    });
    // Anggota dari kartu jamaah demo (maks 4 per grup, hindari duplikat marshal).
    const members = cards.filter((c) => c.fullName !== g.marshalName).slice(created * 2, created * 2 + 4);
    for (const c of members) {
      await prisma.groupMember.create({
        data: { groupId: group.id, fullName: c.fullName, phone: c.phone, cardNo: c.cardNo, role: "ANGGOTA" },
      });
    }
    for (const s of g.schedules) {
      await prisma.groupSchedule.create({
        data: { groupId: group.id, title: s.title, location: s.location, startsAt: s.startsAt, note: s.note },
      });
    }
    for (const m of g.messages) {
      await prisma.groupMessage.create({
        data: { groupId: group.id, authorName: m.authorName, body: m.body, createdAt: at(m.hours) },
      });
    }
    created++;
  }

  const [groupsCount, membersCount, schedCount, msgCount] = await Promise.all([
    prisma.travelGroup.count(),
    prisma.groupMember.count(),
    prisma.groupSchedule.count(),
    prisma.groupMessage.count(),
  ]);
  console.log(`👥 Grup Perjalanan: +${created} baru (total ${groupsCount}), ${membersCount} anggota, ${schedCount} jadwal, ${msgCount} pesan.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); process.exit(1); });
