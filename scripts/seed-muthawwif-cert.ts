/**
 * seed-muthawwif-cert.ts — R-021 (v13.3): status sertifikasi berjenjang demo
 * untuk kolam muthawwif. Profil deterministik per indeks:
 *   [0] MENTOR lulus · [1] LANJUTAN lulus · [2] LANJUTAN lulus
 *   [3] DASAR lulus · [4] DASAR lulus · [5] CANDIDATE DASAR (ujian kurang)
 *   [6] CANDIDATE LANJUTAN (jam kurang)
 * Idempoten: catatan muthawif+level yang sudah ada dilewati.
 * Jalankan: bun scripts/seed-muthawwif-cert.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const YEAR = new Date().getFullYear();
const TWO_YEARS = 24 * 30 * 24 * 60 * 60 * 1000;

const PROFILES = [
  [
    { level: "DASAR", serviceHours: 520, examScore: 92, status: "PASSED" },
    { level: "LANJUTAN", serviceHours: 520, examScore: 88, status: "PASSED" },
    { level: "MENTOR", serviceHours: 520, examScore: 86, status: "PASSED" },
  ],
  [
    { level: "DASAR", serviceHours: 240, examScore: 84, status: "PASSED" },
    { level: "LANJUTAN", serviceHours: 240, examScore: 82, status: "PASSED" },
  ],
  [
    { level: "DASAR", serviceHours: 210, examScore: 80, status: "PASSED" },
    { level: "LANJUTAN", serviceHours: 210, examScore: 81, status: "PASSED" },
  ],
  [{ level: "DASAR", serviceHours: 60, examScore: 75, status: "PASSED" }],
  [{ level: "DASAR", serviceHours: 45, examScore: 71, status: "PASSED" }],
  [{ level: "DASAR", serviceHours: 10, examScore: 62, status: "CANDIDATE" }],
  [{ level: "LANJUTAN", serviceHours: 120, examScore: 80, status: "CANDIDATE" }],
];

const certNo = (level: string, seq: number) => `MHD-MT-${level}-${YEAR}-${String(seq).padStart(4, "0")}`;

async function main() {
  const muthowifs = await prisma.muthowif.findMany({ orderBy: { fullName: "asc" } });
  if (muthowifs.length === 0) {
    console.log("Kolam muthawif kosong — jalankan seed-fitur-v6 dahulu.");
    return;
  }

  let added = 0;
  const counters: Record<string, number> = {};

  for (let i = 0; i < muthowifs.length; i++) {
    const m = muthowifs[i];
    const profile = PROFILES[i % PROFILES.length];
    for (const row of profile) {
      const exists = await prisma.muthawwifCert.findFirst({ where: { muthowifId: m.id, level: row.level } });
      if (exists) continue;
      counters[row.level] = (counters[row.level] ?? 0) + 1;
      await prisma.muthawwifCert.create({
        data: {
          muthowifId: m.id,
          level: row.level,
          serviceHours: row.serviceHours,
          examScore: row.examScore,
          status: row.status,
          certNo: row.status === "PASSED" ? certNo(row.level, counters[row.level]) : null,
          issuedAt: row.status === "PASSED" ? new Date() : null,
          expiresAt: row.status === "PASSED" ? new Date(Date.now() + TWO_YEARS) : null,
          reviewer: row.status === "PASSED" ? "Tim Akademi MUHDIN" : null,
          note: row.status === "CANDIDATE" ? (row.examScore < 70 ? "Skor ujian di bawah ambang 70." : "Jam pelayanan belum 200 jam.") : null,
        },
      });
      added++;
    }
  }

  const total = await prisma.muthawwifCert.count();
  console.log(`🎓 Sertifikasi muthawwif: +${added} catatan baru (total ${total}).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); process.exit(1); });
