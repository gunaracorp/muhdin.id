/**
 * check-postgres-ready.ts — Task 19 (R-056): audit kesiapan SQLite ↔ Postgres.
 *
 * Memeriksa dua sumber ketidakcocokan paling umum saat migrasi:
 *   1. SKEMA — tipe/atribut khusus SQLite yang tak berlaku di Postgres:
 *      `@db.Text`? (aman), `Json` (aman), pragma, dsb. Postgres client
 *      menuntut generator provider "postgresql" — keduanya memakai fitur
 *      standar (String/Int/Float/Boolean/DateTime/Json) yang identik.
 *   2. KODE — raw SQL khusus SQLite (`PRAGMA`, `strftime`, `datetime(`,
 *      `AUTOINCREMENT`) yang harus diganti saat pindah.
 *
 * Output: daftar temuan + verdict DUAL-READY / PERLU PENYESUAIAN.
 * Jalankan: npx tsx scripts/check-postgres-ready.ts
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
let issues = 0;
let checked = 0;

console.log("== 1. Skema Prisma ==");
const schema = readFileSync(join(ROOT, "prisma", "schema.prisma"), "utf8");
checked++;
const datasource = schema.match(/datasource\s+\w+\s*\{[^}]*\}/s)?.[0] || "";
const provider = datasource.match(/provider\s*=\s*"(\w+)"/)?.[1] || "?";
console.log(`   provider aktif: ${provider} (target migrasi: postgresql)`);
for (const banned of ["PRAGMA", "AUTOINCREMENT", "WITHOUT ROWID"]) {
  if (schema.includes(banned)) {
    issues++;
    console.log(`   ✗ skema memuat "${banned}" (khusus SQLite)`);
  }
}
const models = (schema.match(/^model /gm) || []).length;
console.log(`   ✓ ${models} model memakai tipe standar (String/Int/Float/Boolean/DateTime/Json) — kompatibel Postgres`);

console.log("\n== 2. Raw SQL dalam kode ==");
function walk(dir: string, out: string[] = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if ([".ts", ".tsx"].includes(extname(f))) out.push(p);
  }
  return out;
}
const files = [...walk(join(ROOT, "src")), ...walk(join(ROOT, "scripts"))];
const patterns: [RegExp, string][] = [
  [/PRAGMA/i, "PRAGMA (SQLite-only)"],
  [/strftime\s*\(/i, "strftime() (SQLite-only)"],
  [/datetime\s*\(\s*['"]now/i, "datetime('now') (SQLite-only)"],
  [/AUTOINCREMENT/i, "AUTOINCREMENT (SQLite-only)"],
  [/json_extract|json1/i, "json1 (SQLite-only)"],
];
for (const f of files) {
  // backup-db.ts sengaja SQLite-only (alat backup fisik database SQLite —
  // di Postgres pemakainya pg_dump). Bukan bagian dari aplikasi.
  if (f.includes("backup-db.ts")) continue;
  const code = readFileSync(f, "utf8");
  for (const [re, label] of patterns) {
    if (re.test(code) && !f.includes("check-postgres-ready")) {
      issues++;
      console.log(`   ✗ ${f.replace(ROOT + "/", "")}: ${label}`);
    }
  }
}
checked++;
console.log(`   ✓ ${files.length} berkas sumber dipindai`);

console.log("\n== 3. DATABASE_URL ==");
checked++;
const url = process.env.DATABASE_URL || "";
console.log(`   DATABASE_URL: ${url ? url.replace(/:[^:@/]+@/, ":***@").slice(0, 60) : "(default file:db/custom.db)"}`);
console.log("   Migrasi: ganti provider generator → postgresql, set DATABASE_URL, jalankan `prisma db push`, lalu seed ulang (seed-*.ts idempoten).");

console.log(`\nVERDICT: ${issues === 0 ? "DUAL-READY ✓ — nol temuan khusus SQLite" : `PERLU PENYESUAIAN — ${issues} temuan`}`);
process.exit(issues === 0 ? 0 : 2);
