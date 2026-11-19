/**
 * update-bakorwil-jatim.mjs — Struktur resmi Bakorwil Jawa Timur (Task 39).
 *
 * Data resmi dari owner:
 *   - Ketua (penanggung jawab) Bakorwil Jawa Timur: PT ASHANTY PERDANA PRATIWI
 *   - Komisaris Utama PT: Bapak Asmandanu
 *   - Direktur Utama PT: Bapak Handita Aria Perdana
 *
 * Idempoten: aman dijalankan berulang — update bila cabang Jatim sudah ada,
 * create bila belum. Tidak menyentuh cabang lain.
 *
 * Jalankan: bun scripts/update-bakorwil-jatim.mjs
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const JATIM = {
  name: "Badan Koordinator Wilayah Provinsi Jawa Timur",
  code: "BAKORWIL-JATIM",
  province: "Jawa Timur",
  city: "Surabaya",
  officeName: "Branch Office MUHDIN — Jawa Timur",
  picName: "PT Ashanty Perdana Pratiwi",
  description:
    "Badan Koordinator Wilayah (Bakorwil) MUHDIN Provinsi Jawa Timur — mengoordinasi Bakorcab " +
    "kabupaten/kota, keanggotaan, pembinaan penyelenggara, dan pelayanan jamaah di Jawa Timur. " +
    "Kepengurusan Bakorwil Jawa Timur dipegang oleh PT Ashanty Perdana Pratiwi, di bawah pimpinan " +
    "Bapak Asmandanu selaku Komisaris Utama dan Bapak Handita Aria Perdana selaku Direktur Utama " +
    "PT Ashanty Perdana Pratiwi. Dibentuk melalui penunjukan oleh Pengurus Pusat.",
  published: true,
};

async function main() {
  console.log("== Sebelum ==");
  const before = await db.regionalBranch.findMany({
    where: { OR: [{ code: { in: ["BAKORWIL-JATIM", "DPD-JATIM"] } }, { province: { contains: "Jawa Timur" } }] },
  });
  for (const r of before) {
    console.log(`  [${r.code || "-"}] ${r.name} — pic: ${r.picName || "—"}`);
  }
  if (before.length === 0) console.log("  (belum ada cabang Jawa Timur)");

  const existing = before.find((r) => r.code === "BAKORWIL-JATIM") ?? before[0];

  if (existing) {
    await db.regionalBranch.update({ where: { id: existing.id }, data: JATIM });
    console.log(`\n✓ RegionalBranch diperbarui → ${JATIM.code}`);
  } else {
    await db.regionalBranch.create({ data: { ...JATIM, order: before.length + 1 } });
    console.log(`\n✓ RegionalBranch dibuat → ${JATIM.code}`);
  }

  console.log("\n== Sesudah ==");
  const after = await db.regionalBranch.findFirst({ where: { code: JATIM.code } });
  console.log(`  [${after.code}] ${after.name}`);
  console.log(`  Provinsi  : ${after.province} — ${after.city}`);
  console.log(`  Ketua/PIC : ${after.picName}`);
  console.log(`  Deskripsi : ${after.description.slice(0, 140)}…`);
  console.log(`  Published : ${after.published}`);

  const total = await db.regionalBranch.count();
  console.log(`\nTotal cabang terdaftar: ${total}`);
  console.log("✅ Struktur Bakorwil Jawa Timur resmi terpasang.");
}

main()
  .catch((e) => {
    console.error("❌ Gagal:", e.message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
