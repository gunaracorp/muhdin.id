/**
 * roles.ts — model peran multi-admin (Task 15-c) + VERIFIKATOR (Task 17).
 * Dipakai bersama oleh API routes (server) dan UI CMS (client).
 *
 * SUPER_ADMIN : seluruh akses + kelola admin (tambah/ubah/nonaktif/hapus).
 * ADMIN       : seluruh modul operasional, kecuali kelola admin.
 * VERIFIKATOR : tim verifikasi keanggotaan — dashboard, pendaftaran,
 *               direktori anggota (setujui/tolak, tanpa hapus data).
 * EDITOR      : fokus konten (berita, tutorial, FAQ, testimoni, dll).
 */

export type Role = "SUPER_ADMIN" | "ADMIN" | "VERIFIKATOR" | "EDITOR";

export const ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "VERIFIKATOR", "EDITOR"];

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  VERIFIKATOR: "Verifikator",
  EDITOR: "Editor",
};

export function isRole(value: string): value is Role {
  return (ROLES as string[]).includes(value);
}

/** Semua modul CMS + peran yang boleh melihatnya (urutan = urutan menu). */
export const SECTION_ROLES: { id: string; roles: Role[] }[] = [
  { id: "dashboard", roles: ["SUPER_ADMIN", "ADMIN", "VERIFIKATOR", "EDITOR"] },
  { id: "ai-studio", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { id: "nusuk", roles: ["SUPER_ADMIN", "ADMIN"] },
  { id: "articles", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { id: "ecosystems", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { id: "journey", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { id: "roadmap", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { id: "members", roles: ["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"] },
  { id: "applications", roles: ["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"] },
  // v5.0 — Marketplace paket + pipeline booking
  { id: "packages", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { id: "bookings", roles: ["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"] },
  // v12.4 «LUNAS» — Pesanan & Invoice (checkout + payment gateway)
  { id: "orders", roles: ["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"] },
  // v13.0 «GERBANG» — Dashboard Omzet Manajemen (R-051)
  { id: "omzet", roles: ["SUPER_ADMIN", "ADMIN"] },
  // v13.2 — Analitik Funnel Pendaftaran (R-093)
  { id: "funnel", roles: ["SUPER_ADMIN", "ADMIN"] },
  // v13.2 — Web Push Pengumuman Keberangkatan (R-011)
  { id: "push", roles: ["SUPER_ADMIN", "ADMIN"] },
  // v13.0 «GERBANG» — Kampanye Musiman (R-089)
  { id: "kampanye", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { id: "tutorials", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { id: "messages", roles: ["SUPER_ADMIN", "ADMIN"] },
  { id: "complaints", roles: ["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"] },
  // v5.0 — Forum jamaah (moderasi) + kartu jamaah digital
  { id: "forum", roles: ["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"] },
  { id: "cards", roles: ["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"] },
  // v6.0 — Pusat Bisnis B2B (hulu) + Operasi Jamaah (proses & hilir)
  { id: "bisnis", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { id: "jamaahops", roles: ["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"] },
  // v12.1 — God-Mode Izin Compliance Checker
  { id: "compliance", roles: ["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"] },
  // v12.2 — 99 Roadmap Upgrade
  { id: "roadmap99", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  // v12.3 «AMANAH» — Keamanan Akun (semua peran kelola 2FA akunnya sendiri)
  { id: "keamanan", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "VERIFIKATOR"] },
  // GABUNG v11 — Power Pack Layanan Digital
  { id: "passport", roles: ["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"] },
  { id: "academy", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { id: "booking", roles: ["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"] },
  { id: "benefits", roles: ["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"] },
  { id: "tour", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { id: "subscribers", roles: ["SUPER_ADMIN", "ADMIN"] },
  { id: "faqs", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { id: "testimonials", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { id: "management", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { id: "branches", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { id: "settings", roles: ["SUPER_ADMIN", "ADMIN"] },
  { id: "translator", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { id: "gallery", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { id: "agenda", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { id: "resources", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { id: "pdp", roles: ["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"] },
  { id: "sistem", roles: ["SUPER_ADMIN", "ADMIN"] },
  { id: "growth", roles: ["SUPER_ADMIN", "ADMIN"] },
  { id: "audit", roles: ["SUPER_ADMIN"] },
  { id: "users", roles: ["SUPER_ADMIN"] },
];

/** Daftar id modul yang boleh dilihat oleh suatu peran (untuk gating menu UI). */
export function visibleSections(role: string | null | undefined): Set<string> {
  const set = new Set<string>();
  for (const s of SECTION_ROLES) {
    if (role && (s.roles as string[]).includes(role)) set.add(s.id);
  }
  return set;
}

/** Boleh mengelola akun admin lain = hanya SUPER_ADMIN. */
export function canManageUsers(role: string | null | undefined): boolean {
  return role === "SUPER_ADMIN";
}
