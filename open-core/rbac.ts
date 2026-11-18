/**
 * open-core/rbac.ts — Pemetaan peran → modul CMS (referensi open core).
 *
 * Mirror dari pola guard repo (guardRole di src/lib/api-helpers.ts):
 *   SUPER_ADMIN : seluruh modul + kelola akun admin
 *   ADMIN       : seluruh modul operasional (tanpa kelola admin)
 *   EDITOR      : modul konten (artikel, tutorial, FAQ, galeri, agenda…)
 *   VERIFIKATOR : modul verifikasi & operasi jamaah (kartu, paspor, refund)
 * Fungsi murni — bisa dipakai di server maupun browser.
 */

export type Role = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "VERIFIKATOR";

/** Modul khusus konten (EDITOR). */
export const CONTENT_MODULES = [
  "articles", "tutorials", "faqs", "testimonials", "gallery", "agenda",
  "resources", "management", "branches", "settings",
] as const;

/** Modul verifikasi lapangan (VERIFIKATOR). */
export const VERIFY_MODULES = [
  "cards", "passport", "jamaahops", "refunds", "orders", "booking",
] as const;

/** Modul yang hanya untuk SUPER_ADMIN. */
export const SUPER_ONLY_MODULES = ["users"] as const;

/** Modul seluruh ADMIN (operasional penuh kecuali kelola akun). */
export const ADMIN_MODULES = [
  "dashboard", "members", "membership", "applications", "messages", "complaints",
  "packages", "bisnis", "compliance", "roadmap99", "keamanan", "pdp", "sistem",
  "growth", "omzet", "funnel", "push", "kampanye", "coupons",
  "liveclasses", "pricerules", "grouporders", "merchants", "apipartners",
  "mosquepartners", "syllabus", "groups", "groupops",
  // v15.0.0 «GOD MODE»
  "instruktur-reviews", "lapak", "insurance", "escrow", "isms",
] as const;

/** Periksa hak akses satu modul untuk satu peran. */
export function canAccess(role: Role, module: string): boolean {
  if (role === "SUPER_ADMIN") return true;
  if (role === "ADMIN") {
    return !SUPER_ONLY_MODULES.includes(module as (typeof SUPER_ONLY_MODULES)[number]);
  }
  if (role === "EDITOR") {
    return CONTENT_MODULES.includes(module as (typeof CONTENT_MODULES)[number]);
  }
  return VERIFY_MODULES.includes(module as (typeof VERIFY_MODULES)[number]);
}

/** Daftar modul yang boleh diakses satu peran (untuk menu sidebar dinamis). */
export function modulesFor(role: Role): string[] {
  const all = [
    "dashboard",
    ...ADMIN_MODULES,
    ...CONTENT_MODULES,
    ...VERIFY_MODULES,
    ...SUPER_ONLY_MODULES,
  ];
  return all.filter((m) => canAccess(role, m));
}
