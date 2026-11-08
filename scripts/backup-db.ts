/**
 * backup-db.ts — v12.3 «AMANAH» — R-063 Backup Terjadwal + Drill Pemulihan.
 *
 * Satu perintah, tiga langkah:
 *   1. Salin snapshot SQLite → backups/muhdin-<timestamp>.db
 *   2. DRILL: buka snapshot dengan bun:sqlite → PRAGMA integrity_check +
 *      hitung baris tabel kunci (pemulihan terbukti, bukan sekadar file ada).
 *   3. Retensi: simpan 14 snapshot terbaru, sisanya dihapus.
 *
 * Jalankan manual: bun scripts/backup-db.ts   (atau: bun run backup)
 * Jadwal produksi (hosting), contoh crontab tiap 6 jam:
 *   0 0,6,12,18 * * * cd /path/muhdin && bun scripts/backup-db.ts >> backups/backup.log 2>&1
 */
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join, basename } from "node:path";
import { Database } from "bun:sqlite";

const DB_PATH = process.env.DATABASE_FILE || "db/custom.db";
const BACKUP_DIR = "backups";
const KEEP = 14;

if (!existsSync(DB_PATH)) {
  console.error(`✗ Database tidak ditemukan: ${DB_PATH}`);
  process.exit(1);
}

// ---------- 1. Snapshot ----------
mkdirSync(BACKUP_DIR, { recursive: true });
const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
const target = join(BACKUP_DIR, `muhdin-${stamp}.db`);
copyFileSync(DB_PATH, target);
const sizeKb = Math.round(statSync(target).size / 1024);
console.log(`✓ Snapshot: ${target} (${sizeKb} KB)`);

// ---------- 2. Drill pemulihan ----------
const drill = new Database(target, { readonly: true });
const integrity = (drill.query("PRAGMA integrity_check").get() as { integrity_check: string } | null)?.integrity_check;
console.log(`✓ Drill integrity_check: ${integrity}`);
if (integrity !== "ok") {
  console.error("✗ GAGAL — snapshot korup! Jangan andalkan backup ini.");
  drill.close();
  process.exit(1);
}
const tables = ["User", "Member", "TourPackage", "RoadmapItem", "AuditLog"];
const counts: string[] = [];
for (const t of tables) {
  try {
    const row = drill.query(`SELECT COUNT(*) AS n FROM "${t}"`).get() as { n: number };
    counts.push(`${t}=${row.n}`);
  } catch {
    counts.push(`${t}=—`);
  }
}
console.log(`✓ Drill baris tabel kunci: ${counts.join(" · ")}`);
drill.close();

// ---------- 3. Retensi ----------
const snaps = readdirSync(BACKUP_DIR)
  .filter((f) => f.startsWith("muhdin-") && f.endsWith(".db"))
  .sort()
  .reverse();
let removed = 0;
for (const old of snaps.slice(KEEP)) {
  unlinkSync(join(BACKUP_DIR, old));
  removed += 1;
}
console.log(`✓ Retensi: ${Math.min(snaps.length, KEEP)} snapshot disimpan (${KEEP} terbaru), ${removed} dihapus.`);
console.log(`🎉 Backup selesai — ${basename(target)} terverifikasi siap-pulih.`);
