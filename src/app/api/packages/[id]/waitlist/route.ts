/**
 * Task 19 (R-040) — Waitlist otomatis paket penuh.
 *
 * POST /api/packages/[id]/waitlist — publik (rate-limit 5/menit):
 *      daftar tunggu saat slot habis; menolak bila slot masih tersedia
 *      (arahkan checkout). Body: { name, phone, quantity }.
 * GET  /api/packages/[id]/waitlist — guardRole 3 peran: antrean per paket.
 *
 * Auto-offer: ketika slot dibebaskan (order dibatalkan / booking
 * dibatalkan / slot ditambah), `offerWaitlistSlot(packageId)` dipanggil —
 * entri teratas diberi tawaran (status OFFERED + offeredAt) dan penerimaan
 * WA (gagal-aman). Jamaah mengonfirmasi via panitia → CONFIRMED.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/ratelimit";
import { offerWaitlistSlot } from "@/lib/waitlist";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!rateLimit(req, "waitlist", 5)) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  const { id } = await ctx.params;
  try {
    const body = await req.json().catch(() => null);
    const name = String(body?.name || "").trim();
    const phone = String(body?.phone || "").replace(/[\s-]/g, "");
    const quantity = Math.max(1, Math.min(20, parseInt(body?.quantity ?? "1", 10) || 1));

    if (name.length < 3) return fail("Nama minimal 3 karakter.");
    if (!/^(\+?62|0)8\d{7,11}$/.test(phone)) return fail("Nomor WhatsApp tidak valid.");

    const pkg = await db.tourPackage.findUnique({ where: { id }, select: { status: true, slots: true, slotsTaken: true, title: true } });
    if (!pkg) return fail("Paket tidak ditemukan.", 404);
    if (pkg.status !== "PUBLISHED") return fail("Paket ini tidak membuka daftar tunggu.");
    if (pkg.slotsTaken + quantity <= pkg.slots) {
      return fail("Kursi masih tersedia — silakan langsung pesan melalui panel checkout.");
    }

    const dup = await db.waitlistEntry.findFirst({
      where: { packageId: id, phone, status: { in: ["WAITING", "OFFERED"] } },
    });
    if (dup) return fail("Anda sudah terdaftar dalam daftar tunggu paket ini.");

    const entry = await db.waitlistEntry.create({
      data: { packageId: id, name, phone, quantity },
    });
    const rank = await db.waitlistEntry.count({ where: { packageId: id, status: "WAITING" } });

    void logAudit(req, { action: "CREATE", entity: "WaitlistEntry", entityId: entry.id, detail: `${name} → ${pkg.title}` });
    return ok(
      {
        id: entry.id,
        rank,
        message: `Anda nomor urut ${rank} dalam daftar tunggu ${pkg.title}. Kami akan mengabari via WhatsApp begitu kursi terbuka.`,
      },
      201
    );
  } catch {
    return fail("Gagal mendaftarkan daftar tunggu.", 500);
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const rows = await db.waitlistEntry.findMany({ where: { packageId: id }, orderBy: { createdAt: "asc" }, take: 200 });
    return ok({ rows });
  } catch {
    return fail("Gagal memuat daftar tunggu.", 500);
  }
}
