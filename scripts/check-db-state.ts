// check-db-state.ts — cek cepat jumlah data inti per tabel
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const out: Record<string, number | string> = {};
  out.tourPackage = await prisma.tourPackage.count();
  out.packageBooking = await prisma.packageBooking.count();
  out.pilgrimCard = await prisma.pilgrimCard.count();
  out.forumThread = await prisma.forumThread.count();
  out.anggota = await prisma.member.count();
  out.roadmap = await prisma.roadmapItem.count();
  const anyP = prisma as any;
  if (anyP.waGroup) out.waGroup = await anyP.waGroup.count();
  if (anyP.orgUnit) out.orgUnit = await anyP.orgUnit.count();
  if (anyP.leader) out.leader = await anyP.leader.count();
  console.log(JSON.stringify(out, null, 2));
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
