/**
 * migrate-sqlite-to-postgres.mjs — v11.1 (Task 13)
 * Migrasi seluruh data db/custom.db (SQLite) → Prisma Postgres (cloud).
 *
 * Cara pakai:
 *   node scripts/migrate-sqlite-to-postgres.mjs
 * (DATABASE_URL dibaca dari .env via dotenv override:true — sama dengan CLI.)
 *
 * Strategi:
 *  1. Baca semua tabel user dari SQLite (skip sqlite_% dan _prisma_%).
 *  2. Urutkan target Postgres secara topologis berdasar FK (referensi dulu).
 *  3. TRUNCATE semua tabel target sekaligus (RESTART IDENTITY CASCADE).
 *  4. Per tabel: irisan kolom SQLite ∩ Postgres, konversi tipe sesuai
 *     data_type Postgres, insert per-batch 100 baris; bila batch gagal,
 *     jatuh ke per-baris agar satu baris jelek tidak menghentikan tabel.
 *  5. Reset sequence (bila ada kolom serial) + rekap jumlah baris dua sisi.
 *
 * Konversi tipe:
 *  - boolean: 0/1 → false/true
 *  - timestamp/date: ms epoch / ISO → string UTC polos "YYYY-MM-DD HH:MM:SS.sss"
 *    (konvensi Prisma: timestamp(3) tanpa tz dibaca-ditulis sebagai UTC)
 *  - json/jsonb: string JSON → parse
 *  - angka: Number(); sisanya string apa adanya. NULL dilewatkan.
 */
import Database from "better-sqlite3";
import pg from "pg";
import { config as dotenvConfig } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenvConfig({ override: true });

const SQLITE_PATH = process.env.SQLITE_PATH || path.join(ROOT, "db", "custom.db");
const PG_URL = process.env.DATABASE_URL;

if (!PG_URL || !PG_URL.startsWith("postgres")) {
  console.error("FATAL: DATABASE_URL Postgres tidak ditemukan (.env).");
  process.exit(1);
}

const sqlite = new Database(SQLITE_PATH, { readonly: true });
const pgc = new pg.Client({
  connectionString: PG_URL,
  ssl: { rejectUnauthorized: false },
});

const q = (ident) => `"${String(ident).replace(/"/g, '""')}"`;

async function main() {
  await pgc.connect();

  // 1) Tabel sumber (SQLite) & target (Postgres public)
  const sqliteTables = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '\\_prisma%' ESCAPE '\\' ORDER BY name")
    .all()
    .map((r) => r.name);

  const { rows: pgCols } = await pgc.query(
    `SELECT table_name, column_name, data_type FROM information_schema.columns
     WHERE table_schema='public' ORDER BY table_name, ordinal_position`
  );
  const pgTableCols = new Map();
  for (const c of pgCols) {
    if (!pgTableCols.has(c.table_name)) pgTableCols.set(c.table_name, []);
    pgTableCols.get(c.table_name).push({ name: c.column_name, type: c.data_type });
  }

  const tables = sqliteTables.filter((t) => pgTableCols.has(t));
  const skipped = sqliteTables.filter((t) => !pgTableCols.has(t));
  if (skipped.length) console.log("Dilewati (tidak ada di PG):", skipped.join(", "));

  // 2) Urutan topologis: tabel tanpa/relasi-terpenuhi lebih dulu
  const { rows: fkRows } = await pgc.query(
    `SELECT tc.table_name AS tbl, ccu.table_name AS ref
     FROM information_schema.table_constraints tc
     JOIN information_schema.constraint_column_usage ccu
       ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
     WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public'`
  );
  const deps = new Map(tables.map((t) => [t, new Set()]));
  for (const r of fkRows) {
    if (deps.has(r.tbl) && deps.has(r.ref) && r.tbl !== r.ref) deps.get(r.tbl).add(r.ref);
  }
  const ordered = [];
  const done = new Set();
  while (ordered.length < tables.length) {
    const ready = tables.filter((t) => !done.has(t) && [...deps.get(t)].every((d) => done.has(d)));
    if (ready.length === 0) {
      // siklus FK — paksa sisa tabel (PG nonaktifkan cek via truncate dulu)
      ordered.push(...tables.filter((t) => !done.has(t)));
      break;
    }
    for (const t of ready) { done.add(t); ordered.push(t); }
  }

  // 3) Bersihkan target
  await pgc.query(`TRUNCATE TABLE ${ordered.map(q).join(", ")} RESTART IDENTITY CASCADE`);

  // 4) Migrasi per tabel
  const report = [];
  for (const t of ordered) {
    const cols = pgTableCols.get(t);
    const colSet = new Set(cols.map((c) => c.name));
    const srcCols = sqlite.prepare(`PRAGMA table_info(${q(t)})`).all().map((c) => c.name).filter((c) => colSet.has(c));
    if (srcCols.length === 0) { report.push([t, 0, 0, "tanpa kolom irisan"]); continue; }

    const rows = sqlite.prepare(`SELECT * FROM ${q(t)}`).all();
    let inserted = 0;
    const conv = (v, type) => {
      if (v === null || v === undefined) return null;
      if (type === "boolean") return v === 1 || v === "1" || v === true;
      if (type === "json" || type === "jsonb") {
        if (typeof v !== "string") return JSON.stringify(v);
        try { return JSON.stringify(JSON.parse(v)); } catch { return v; }
      }
      if (type.startsWith("timestamp") || type === "date") {
        const d = typeof v === "number" ? new Date(v)
          : /^-?\d{10,}$/.test(String(v)) ? new Date(Number(v)) : new Date(v);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().replace("T", " ").replace("Z", "");
      }
      if (["integer","smallint","bigint","double precision","real","numeric"].includes(type)) {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      }
      return typeof v === "string" ? v : String(v);
    };

    const insertRow = async (row) => {
      const vals = srcCols.map((c) => conv(row[c], cols.find((x) => x.name === c).type));
      const ph = srcCols.map((_, i) => `$${i + 1}`).join(",");
      await pgc.query(
        `INSERT INTO ${q(t)} (${srcCols.map(q).join(",")}) VALUES (${ph}) ON CONFLICT DO NOTHING`,
        vals
      );
    };

    try {
      const CHUNK = 100;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK);
        if (chunk.length === 0) continue;
        const allVals = chunk.map((row) => srcCols.map((c) => conv(row[c], cols.find((x) => x.name === c).type)));
        const phRow = `(${srcCols.map((_, i) => `$${i + 1}`).join(",")})`;
        const bigPh = allVals.map((_, r) => phRow.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + r * srcCols.length}`)).join(",");
        const flat = allVals.flat();
        await pgc.query(
          `INSERT INTO ${q(t)} (${srcCols.map(q).join(",")}) VALUES ${bigPh} ON CONFLICT DO NOTHING`,
          flat
        );
        inserted += chunk.length;
      }
    } catch (batchErr) {
      // Fallback per-baris
      inserted = 0;
      let failed = 0;
      for (const row of rows) {
        try { await insertRow(row); inserted++; }
        catch { failed++; if (failed <= 2) console.error(`  [${t}] baris gagal:`, batchErr.message.slice(0, 120)); }
      }
      if (failed > 2) console.error(`  [${t}] total baris gagal: ${failed}`);
    }

    // 5) Reset sequence bila kolom id serial
    const idCol = cols.find((c) => c.name === "id");
    if (idCol && /nextval/.test(idCol.type || "")) { /* data_type tak memuat default; lewati */ }
    report.push([t, rows.length, inserted, inserted === rows.length ? "OK" : "SELISIH"]);
  }

  // Reset sequence utk tabel ber-kolom serial (generik via pg_get_serial_sequence)
  for (const t of ordered) {
    const { rows: seqRows } = await pgc.query(
      `SELECT column_name, column_default FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1 AND column_default LIKE 'nextval%'`, [t]
    );
    for (const s of seqRows) {
      await pgc.query(
        `SELECT setval(pg_get_serial_sequence($1, $2), COALESCE((SELECT MAX(${q(s.column_name)}) FROM ${q(t)}), 1))`,
        [t, s.column_name]
      );
    }
  }

  console.log("\n=== REKAP MIGRASI (tabel, sumber, masuk, status) ===");
  for (const r of report) console.log(r.join("  |  "));
  const totalSrc = report.reduce((a, r) => a + r[1], 0);
  const totalIn = report.reduce((a, r) => a + r[2], 0);
  console.log(`\nTOTAL: ${totalIn}/${totalSrc} baris termigrasi.`);
  if (totalIn < totalSrc) process.exitCode = 2;
  await pgc.end();
  sqlite.close();
}

main().catch(async (e) => {
  console.error("FATAL:", e);
  try { await pgc.end(); } catch {}
  sqlite.close();
  process.exit(1);
});
