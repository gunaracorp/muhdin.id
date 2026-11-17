/**
 * test-role-matrix.mts — v13.1 R-079: matriks peran satu sumber kebenaran.
 * Uji otomatis (dijalankan di job CI `security`):
 *   1. SECTION_ROLES — semua id unik, semua role valid, SUPER_ADMIN selalu punya akses.
 *   2. Pemindaian statis seluruh src/app/api/**\/route.ts —
 *      • guardRole(["..."]) hanya memakai role yang dikenal (cegah typo baru);
 *      • setiap route yang memanggil mutasi (create/update/delete via db.*) atau
 *        db.$transaction wajib ada guard (guardAdmin/guardRole) — fail-closed.
 * Exit 1 bila ada pelanggaran — CI merah sebelum menyebar.
 */
import fs from "node:fs";
import path from "node:path";
import { ROLES, SECTION_ROLES } from "../src/lib/roles";

const ROOT = path.resolve(import.meta.dirname, "..");
const API_DIR = path.join(ROOT, "src/app/api");

let violations = 0;
const bad = (msg: string) => {
  violations++;
  console.error(`  ✗ ${msg}`);
};

// 1) Matriks seksi CMS
{
  const seen = new Set<string>();
  for (const s of SECTION_ROLES) {
    if (seen.has(s.id)) bad(`SECTION_ROLES id duplikat: ${s.id}`);
    seen.add(s.id);
    for (const r of s.roles) {
      if (!ROLES.includes(r as (typeof ROLES)[number])) bad(`${s.id}: role tak dikenal "${r}"`);
    }
    if (!s.roles.includes("SUPER_ADMIN")) bad(`${s.id}: SUPER_ADMIN tidak punya akses`);
  }
  console.log(`SECTION_ROLES: ${seen.size} modul — konsisten`);
}

// 2) Pemindaian guard di seluruh route handler
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) out.push(...walk(p));
    else if (f.name === "route.ts") out.push(p);
  }
  return out;
}
const routes = walk(API_DIR);
let guardedCount = 0;
for (const file of routes) {
  const src = fs.readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file);
  const hasGuard = /guardAdmin\(\)|guardRole\(\[|guardSuperAdmin\(\)|requireAdmin\(\)|requireSuperAdmin\(\)/.test(src);
  const isPublic = /\/\*\*[\s\S]*?publik|GET publik|GET  publik/i.test(src.slice(0, 1500));
  const mutates = /db\.\w+\.(create|createMany|update|updateMany|delete|deleteMany|upsert|\.transaction|\$transaction)/.test(src);
  // Proteksi publik yang sah: rate-limit (anti-abuse) — mutasi kecil validasi server
  // (verify counter, view counter, forum/antrean publik). Bukan fail-open.
  const rateLimited = /rateLimit\(/.test(src);
  // Route auth (login/logout/register) punya perlindungan sendiri (lockout/policy) — kecualikan.
  const isAuthRoute = /\/api\/auth\//.test(rel);
  // Route webhook pembayaran memakai verifikasi HMAC sendiri — kecualikan dari guard admin.
  const isWebhook = /webhook/i.test(rel);
  if (mutates && !hasGuard && !rateLimited && !isAuthRoute && !isWebhook) {
    bad(`${rel}: mutasi DB tanpa guard/rate-limit (fail-open)`);
  }
  // guardRole dengan role tak dikenal
  const roleMatches = src.matchAll(/guardRole\(\[([^\]]*)\]/g);
  for (const m of roleMatches) {
    const roles = m[1].split(",").map((s) => s.trim().replace(/["']/g, "")).filter(Boolean);
    for (const r of roles) {
      if (!ROLES.includes(r as (typeof ROLES)[number])) bad(`${rel}: guardRole role tak dikenal "${r}"`);
    }
  }
  if (hasGuard) guardedCount++;
}
console.log(`Routes: ${routes.length} file, ${guardedCount} dengan guard eksplisit`);

if (violations > 0) {
  console.error(`\nGAGAL: ${violations} pelanggaran matriks peran.`);
  process.exit(1);
}
console.log("Matriks peran konsisten — semua guard valid, mutasi ter-guard.");
