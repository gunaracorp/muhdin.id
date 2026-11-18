/**
 * panen-gabung-28.mts — Task 28: import gabungan seluruh sumber data resmi
 * ke tabel Member dengan dedupe nama + pengayaan kontak.
 *
 * Urutan prioritas (berizin menang atas tanpa-izin):
 *   1. anggota-resmi.csv              (SAPUHI + PIHK Kemenag — Task 22)
 *   2. pihk-kemenag-19-87.csv         (Task 24)
 *   3. pihk-kemenag-19-87-baru.csv    (Task 24)
 *   4. pihk-ppiu-jateng-satu-haji-2025.csv (Task 25)
 *   5. anggota-himpuh.csv             (Task 23)
 *   6. anggota-amphuri.csv            (Task 26)
 *   7. direktori-nasional-2087.csv    (Task 28 — direktori PDF 124 hal., tanpa izin)
 *
 * Dedupe: kunci = nama dinormalisasi (uppercase, buang prefiks PT., dsb.).
 * - Entri berizin menang; keduanya berizin → gabung licenseNo " // " bila berbeda.
 * - Kontak kosong diisi dari sumber duplikat (pengayaan), sitasi sumber disatukan.
 * Idempoten: jalankan ulang = angka tidak berubah (dedupe terhadap DB juga).
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const db = new PrismaClient();
const DIR = "/home/z/my-project/download/data-resmi";

const SOURCES: { file: string; label: string }[] = [
  { file: "anggota-resmi.csv", label: "SAPUHI + PIHK Kemenag (Task 22)" },
  { file: "pihk-kemenag-19-87.csv", label: "PIHK Kemenag 19-87 (Task 24)" },
  { file: "pihk-kemenag-19-87-baru.csv", label: "PIHK Kemenag baru (Task 24)" },
  { file: "pihk-ppiu-jateng-satu-haji-2025.csv", label: "SATU HAJI Jateng (Task 25)" },
  { file: "anggota-himpuh.csv", label: "HIMPUH (Task 23)" },
  { file: "anggota-amphuri.csv", label: "AMPHURI (Task 26)" },
  { file: "direktori-nasional-2087.csv", label: "Direktori Nasional 2.087 (Task 28)" },
];

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuote = false;
  const clean = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (inQuote) {
      if (c === '"') {
        if (clean[i + 1] === '"') { field += '"'; i++; }
        else inQuote = false;
      } else field += c;
    } else if (c === '"') inQuote = true;
    else if (c === ",") { cur.push(field); field = ""; }
    else if (c === "\n") { cur.push(field); field = ""; rows.push(cur); cur = []; }
    else if (c !== "\r") field += c;
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  const headers = (rows.shift() || []).map((h) => h.trim());
  return { headers, rows: rows.filter((r) => r.some((c) => c.trim())) };
}

function normName(v: string): string {
  return v
    .toUpperCase()
    .replace(/^PT\.\s*/,"").replace(/^PT\s+/,"").replace(/^P\.T\.\s*/,"")
    .replace(/[.,'’`"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tahunDari(license: string): number | null {
  const m = license.match(/(?:tahun|TAHUN)[\s.]*(19|20)(\d{2})/) || license.match(/\/(19|20)(\d{2})\b/);
  if (m) return Number(`${m[1]}${m[2]}`);
  return null;
}

type Draft = {
  name: string; type: string; city: string; province: string; licenseNo: string;
  phone: string | null; email: string | null; website: string | null; description: string;
  sources: string[]; hasLicense: boolean;
};

async function main() {
  const totalBefore = await db.member.count();
  console.log(`DB sebelum  : ${totalBefore} anggota`);

  const byKey = new Map<string, Draft>();
  const report: Record<string, { baru: number; kaya: number; dup: number }> = {};

  for (const { file, label } of SOURCES) {
    const p = path.join(DIR, file);
    if (!fs.existsSync(p)) { console.log(`SKIP (hilang): ${file}`); continue; }
    const { headers, rows } = parseCsv(fs.readFileSync(p, "utf8"));
    const ix: Record<string, number> = {};
    headers.forEach((h, i) => { ix[h.toLowerCase().replace(/[^a-z]/g, "")] = i; });
    const col = (names: string[]): number => {
      for (const n of names) { const k = n.toLowerCase().replace(/[^a-z]/g, ""); if (k in ix) return ix[k]; }
      return -1;
    };
    const iName = col(["name", "nama"]);
    const iType = col(["type"]);
    const iCity = col(["city", "kota"]);
    const iProv = col(["province", "provinsi"]);
    const iLic = col(["licenseNo", "nomorizin", "izin"]);
    const iPhone = col(["phone", "telepon"]);
    const iEmail = col(["email"]);
    const iWeb = col(["website"]);
    const iDesc = col(["description", "deskripsi"]);

    const rep = { baru: 0, kaya: 0, dup: 0 };
    for (const r of rows) {
      const name = (r[iName] || "").trim();
      if (!name) continue;
      const lic = iLic >= 0 ? (r[iLic] || "").trim() : "";
      const draft: Draft = {
        name,
        type: iType >= 0 ? (r[iType] || "TRAVEL_WISATA").trim() : "TRAVEL_WISATA",
        city: iCity >= 0 ? (r[iCity] || "").trim() : "",
        province: iProv >= 0 ? (r[iProv] || "").trim() : "",
        licenseNo: lic,
        phone: iPhone >= 0 && r[iPhone]?.trim() ? r[iPhone].trim() : null,
        email: iEmail >= 0 && r[iEmail]?.trim() ? r[iEmail].trim().toLowerCase() : null,
        website: iWeb >= 0 && r[iWeb]?.trim() ? r[iWeb].trim() : null,
        description: iDesc >= 0 ? (r[iDesc] || "").trim() : "",
        sources: [label],
        hasLicense: !!lic,
      };
      const key = normName(name);
      const existing = byKey.get(key);
      if (!existing) { byKey.set(key, draft); rep.baru++; continue; }
      // dedupe — pengayaan dua arah
      if (lic && existing.licenseNo && lic.toUpperCase() !== existing.licenseNo.toUpperCase()) {
        existing.licenseNo = `${existing.licenseNo} // ${lic}`;
      } else if (lic && !existing.licenseNo) {
        existing.licenseNo = lic; existing.hasLicense = true;
      }
      if (!existing.phone && draft.phone) existing.phone = draft.phone;
      if (!existing.email && draft.email) existing.email = draft.email;
      if (!existing.website && draft.website) existing.website = draft.website;
      if (!existing.city && draft.city) existing.city = draft.city;
      if (!existing.province && draft.province) existing.province = draft.province;
      for (const s of draft.sources) if (!existing.sources.includes(s)) existing.sources.push(s);
      rep.kaya++;
    }
    report[label] = rep;
    console.log(`${label.padEnd(40)} baru=${rep.baru} kaya=${rep.kaya}`);
  }

  // dedupe terhadap DB yang sudah ada (idempoten)
  const existingRows = await db.member.findMany({
    select: { id: true, name: true, licenseNo: true, phone: true, email: true, city: true, province: true, description: true },
  });
  const dbKeys = new Set<string>();
  const dbByNorm = new Map<string, { id: string; licenseNo: string; phone: string | null; email: string | null }>();
  for (const m of existingRows) {
    const k = normName(m.name);
    dbKeys.add(k);
    if (!dbByNorm.has(k)) dbByNorm.set(k, m);
  }

  let created = 0, enrichedDb = 0, skipped = 0;
  const batch: Parameters<typeof db.member.createMany>[0]["data"] = [];
  for (const [key, d] of byKey) {
    const inDb = dbByNorm.get(key);
    if (inDb) {
      const upd: Record<string, string | null> = {};
      if (d.licenseNo && inDb.licenseNo && !inDb.licenseNo.includes(d.licenseNo) && d.licenseNo.toUpperCase() !== inDb.licenseNo.toUpperCase()) {
        upd.licenseNo = `${inDb.licenseNo} // ${d.licenseNo}`;
      } else if (d.licenseNo && !inDb.licenseNo) upd.licenseNo = d.licenseNo;
      if (!inDb.phone && d.phone) upd.phone = d.phone;
      if (!inDb.email && d.email) upd.email = d.email;
      if (Object.keys(upd).length) {
        await db.member.update({ where: { id: inDb.id }, data: upd });
        enrichedDb++;
      } else skipped++;
      continue;
    }
    const year = tahunDari(d.licenseNo);
    batch.push({
      name: d.name,
      type: d.type,
      city: d.city,
      province: d.province,
      licenseNo: d.licenseNo,
      phone: d.phone,
      email: d.email,
      website: d.website,
      description: `${d.description}${d.sources.length ? `${d.description ? " · " : ""}Sumber panen: ${d.sources.join(" + ")}` : ""}`,
      memberSince: year && year >= 2000 && year <= 2026 ? year : 2026,
    });
    created++;
    if (batch.length >= 400) {
      await db.member.createMany({ data: batch }); batch.length = 0;
    }
  }
  if (batch.length) await db.member.createMany({ data: batch });

  const totalAfter = await db.member.count();
  const byType = await db.member.groupBy({ by: ["type"], _count: true });
  const byProv = await db.member.groupBy({ by: ["province"], _count: true });
  console.log(`\n=== HASIL ===`);
  console.log(`DB sebelum  : ${totalBefore}`);
  console.log(`Baru dibuat : ${created}`);
  console.log(`DB diperkaya: ${enrichedDb}`);
  console.log(`Skip (sudah ada, lengkap): ${skipped}`);
  console.log(`DB sesudah  : ${totalAfter}`);
  console.log(`Per tipe    : ${byType.map((t) => `${t.type}=${t._count}`).join(", ")}`);
  console.log(`Provinsi    : ${byProv.length} wilayah`);
  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
