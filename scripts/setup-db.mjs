/**
 * setup-db — bootstrap database SQLite saat first-run.
 *
 * Kalau db/custom.db belum ada: jalankan `prisma db push` + seed demo.
 * Kalau sudah ada: tidak melakukan apa pun (seed PRISMA/seed.ts destruktif —
 * menghapus data lama — jadi hanya boleh jalan sekali saat awal).
 *
 * Pakai: bun run setup
 */
import { existsSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const dbFile = path.join(process.cwd(), "db", "custom.db");
mkdirSync(path.dirname(dbFile), { recursive: true });

// Clone baru tanpa .env → prisma.config.ts tidak menemukan DATABASE_URL
// (P1012). Set URL SQLite lokal; deploy berbasis Postgres yang punya .env
// tidak tersentuh (prisma.config.ts selalu memprioritaskan .env).
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${dbFile}`;
}

if (existsSync(dbFile)) {
  console.log("[setup-db] db/custom.db sudah ada — lewati bootstrap.");
  console.log("[setup-db] Skema berubah? Jalankan: bun run db:push");
  process.exit(0);
}

console.log("[setup-db] db/custom.db belum ada — bootstrap: prisma db push + seed …");
try {
  execSync("npx prisma db push", { stdio: "inherit" });
  execSync("bun prisma/seed.ts", { stdio: "inherit" });
} catch (err) {
  console.error("[setup-db] Bootstrap gagal. Pastikan `bun` ter-install (https://bun.sh).");
  console.error(err?.message ?? err);
  process.exit(1);
}
console.log("[setup-db] Selesai — database demo siap (login demo ada di prisma/seed.ts).");
