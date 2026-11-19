/**
 * Task 40 — Seed kontak resmi MUHDIN:
 *  - SiteSetting: whatsapp / phone / address (pengganti placeholder)
 *  - RegionalBranch: kantor Jakarta Cempaka Putih & Kwitang (baru) + alamat
 *    Jawa Barat disamakan persis dengan teks resmi owner.
 * Idempotent: upsert by key/code.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const SETTINGS: Record<string, string> = {
  whatsapp: "0812 2234 5856",
  phone: "+62 812-2234-5856",
  address:
    "Kantor Jakarta — Jl. Cempaka Putih Tengah, RT.9/RW.7, Cempaka Putih Timur, Kec. Cempaka Putih, Kota Jakarta Pusat, DKI Jakarta 10510",
};

const JABAR_ADDRESS =
  "Perumahan Andalusia Garden Cluster Granada No.11, Mangkubumi, Mangkubumi, Kota Tasikmalaya, Jawa Barat";

const JAKARTA_OFFICES = [
  {
    code: "KANTOR-JKT-CP",
    name: "Kantor Jakarta — Cempaka Putih",
    officeName: "Kantor Perwakilan MUHDIN Jakarta",
    address:
      "Jl. Cempaka Putih Tengah, RT.9/RW.7, Cempaka Putih Timur, Kec. Cempaka Putih, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10510",
    city: "Jakarta Pusat",
    province: "DKI Jakarta",
    order: 1,
  },
  {
    code: "KANTOR-JKT-KWITANG",
    name: "Kantor Jakarta — Kwitang",
    officeName: "Kantor Perwakilan MUHDIN Jakarta",
    address:
      "Jl. Kramat Kwitang No.19 1, RT.1/RW.4, Kwitang, Kec. Senen, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10420",
    city: "Jakarta Pusat",
    province: "DKI Jakarta",
    order: 2,
  },
];

async function main() {
  for (const [key, value] of Object.entries(SETTINGS)) {
    const existing = await db.siteSetting.findUnique({ where: { key } });
    if (existing) {
      await db.siteSetting.update({ where: { key }, data: { value } });
    } else {
      await db.siteSetting.create({ data: { key, value } });
    }
    console.log(`✓ SiteSetting ${key} = ${value.slice(0, 60)}`);
  }

  // Kantor Jawa Barat — samakan alamat dengan teks resmi owner.
  const jabar = await db.regionalBranch.findFirst({
    where: { OR: [{ code: "DPD-JABAR" }, { province: { contains: "Jawa Barat" } }] },
  });
  if (jabar) {
    await db.regionalBranch.update({ where: { id: jabar.id }, data: { address: JABAR_ADDRESS } });
    console.log(`✓ RegionalBranch JABAR address diperbarui (${jabar.code || jabar.name})`);
  }

  for (const o of JAKARTA_OFFICES) {
    const existing = await db.regionalBranch.findFirst({ where: { code: o.code } });
    const data = {
      name: o.name,
      code: o.code,
      officeName: o.officeName,
      address: o.address,
      city: o.city,
      province: o.province,
      published: true,
      order: o.order,
    };
    if (existing) {
      await db.regionalBranch.update({ where: { id: existing.id }, data });
      console.log(`✓ RegionalBranch ${o.code} diperbarui`);
    } else {
      await db.regionalBranch.create({ data });
      console.log(`✓ RegionalBranch ${o.code} dibuat`);
    }
  }

  const total = await db.regionalBranch.count();
  console.log(`Total kantor/cabang terdaftar: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
