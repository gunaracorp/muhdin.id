/**
 * seed-duty-officer.ts — v13.1 R-096: roster piket petugas jaga (idempoten).
 * Nomor kontak = kanal resmi sekretariat MUHDIN (BRAND) — data nyata, bukan karangan;
 * nama generik "Petugas Jaga" karena penugasan individu disusun oleh sekretariat
 * dan dapat diperbarui via PUT /api/duty-officer tanpa sentuh kode.
 */
import { makeDb } from "./_db";

async function main() {
  const db = makeDb();
  const count = await db.dutyOfficer.count();
  if (count > 0) {
    console.log(`DutyOfficer sudah ada (${count}) — seed dilewati (idempoten).`);
    await db.$disconnect();
    return;
  }
  // shiftDays: 0=Minggu … 6=Sabtu; eskalasi berjenjang via sortOrder.
  await db.dutyOfficer.createMany({
    data: [
      { name: "Petugas Jaga 1 — Koordinator", phone: "6281222345856", role: "KOORDINATOR", shiftDays: "0,1,2,3,4,5,6", escalationMin: 15, sortOrder: 1 },
      { name: "Petugas Jaga 2 — Marshal Lapangan", phone: "6281222345856", role: "MARSHAL", shiftDays: "0,1,2,3,4,5,6", escalationMin: 15, sortOrder: 2 },
      { name: "Petugas Jaga 3 — Dukungan TI", phone: "6281222345856", role: "IT_SUPPORT", shiftDays: "0,1,2,3,4,5,6", escalationMin: 30, sortOrder: 3 },
    ],
  });
  console.log(`OK: ${await db.dutyOfficer.count()} DutyOfficer dibuat.`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
