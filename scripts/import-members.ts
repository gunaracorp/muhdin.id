/**
 * import-members.ts — Impor massal Anggota (PPIU/PIHK/KBIHU/IPHI/TRAVEL_WISATA) dari CSV.
 *
 * Pemakaian:
 *   bun scripts/import-members.ts db/ppiu-pihk-starter.csv
 *   bun scripts/import-members.ts file-lain.csv
 *
 * Kolom CSV (header baris pertama, tidak peka besar-kecil):
 *   name (wajib), type (wajib), city, province, licenseNo, phone, email,
 *   website, description, status, memberSince
 *
 * Aturan:
 * • Idempoten — nama yang sudah ada diperbarui (field yang terisi di CSV saja).
 * • type valid: PPIU | PIHK | KBIHU | IPHI | TRAVEL_WISATA
 * • status valid: TERVERIFIKASI | PENDING | SUSPENDED (default TERVERIFIKASI)
 * • Parser CSV mendukung kutip ganda, koma di dalam kutip, CRLF/LF, BOM UTF-8.
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const TYPES = ["PPIU", "PIHK", "KBIHU", "IPHI", "TRAVEL_WISATA"] as const;
const STATUSES = ["TERVERIFIKASI", "PENDING", "SUSPENDED"] as const;

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const clean = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();
  if (!clean) return { headers: [], rows: [] };
  const lines: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (inQuotes) {
      if (c === '"') {
        if (clean[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === "," || c === ";" || c === "\t") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); field = ""; lines.push(row); row = []; }
    else field += c;
  }
  row.push(field);
  lines.push(row);
  const headers = (lines.shift() || []).map((h) => h.trim());
  return { headers, rows: lines.filter((r) => r.some((f) => f.trim() !== "")) };
}

const cell = (row: string[], i: number) => (row[i] ?? "").trim();

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Pemakaian: bun scripts/import-members.ts <file.csv>");
    process.exit(1);
  }
  let raw: string;
  try {
    raw = readFileSync(file, "utf-8");
  } catch {
    console.error(`File tidak ditemukan: ${file}`);
    process.exit(1);
  }

  const { headers, rows } = parseCsv(raw);
  if (!headers.length || !rows.length) {
    console.error("CSV kosong / tidak berisi data.");
    process.exit(1);
  }
  const ix = (name: string) => headers.findIndex((h) => h.toLowerCase() === name.toLowerCase());
  const iName = ix("name");
  const iType = ix("type");
  if (iName < 0 || iType < 0) {
    console.error('Kolom wajib: `name` dan `type`.');
    process.exit(1);
  }
  const map = {
    city: ix("city"), province: ix("province"), licenseNo: ix("licenseNo"),
    phone: ix("phone"), email: ix("email"), website: ix("website"),
    description: ix("description"), status: ix("status"), memberSince: ix("memberSince"),
  };

  let inserted = 0, updated = 0, skipped = 0;
  const errors: string[] = [];

  for (const [n, row] of rows.entries()) {
    const name = cell(row, iName);
    const type = cell(row, iType).toUpperCase();
    if (!name || !TYPES.includes(type as (typeof TYPES)[number])) {
      skipped++;
      errors.push(`Baris ${n + 2}: name/type tidak valid ("${name}", "${type}")`);
      continue;
    }
    const statusRaw = map.status >= 0 ? cell(row, map.status).toUpperCase() : "";
    const status = STATUSES.includes(statusRaw as (typeof STATUSES)[number]) ? statusRaw : "TERVERIFIKASI";
    const memberSince = map.memberSince >= 0 && cell(row, map.memberSince) ? parseInt(cell(row, map.memberSince), 10) || 2026 : 2026;

    const data: Record<string, string | number> = {};
    for (const k of ["city", "province", "licenseNo", "phone", "email", "website", "description"] as const) {
      if (map[k] >= 0 && cell(row, map[k]) !== "") data[k] = cell(row, map[k]);
    }

    // licenseNo wajib di skema — pakai "—" bila baris CSV tidak mengisinya.
    if (!(data as Record<string, unknown>).licenseNo) data.licenseNo = "—";

    const existing = await db.member.findFirst({ where: { name } });
    if (existing) {
      await db.member.update({ where: { id: existing.id }, data: { ...data, type, status, memberSince } });
      updated++;
    } else {
      await db.member.create({ data: { name, type, status, memberSince, ...data } });
      inserted++;
    }
  }

  console.log("=== RINGKASAN IMPOR ANGGOTA ===");
  console.log(`File     : ${file}`);
  console.log(`Baris    : ${rows.length}`);
  console.log(`Baru     : ${inserted}`);
  console.log(`Diperbarui: ${updated}`);
  console.log(`Dilewati : ${skipped}`);
  if (errors.length) console.log("Catatan:\n" + errors.slice(0, 10).join("\n"));
}

main()
  .catch((e) => { console.error("Impor gagal:", e); process.exit(1); })
  .finally(() => db.$disconnect());
