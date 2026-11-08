/**
 * Task 19 (R-009) — Itinerary harian interaktif per paket.
 *
 * GET  /api/packages/[id]/itinerary — publik: daftar hari terurut.
 * PUT  /api/packages/[id]/itinerary — guardRole 3 peran: ganti-total
 *      (replace-all, atomik per transaksi) dari editor CMS.
 *      Body: { days: [{ day, title, plan, location }] }
 * Sync keberangkatan: notifikasi WA keberangkatan (notifyBooking) sudah
 * menyertakan arah portal; itinerary tampil sebagai sumber kebenaran harian.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail, parseIntOr } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const pkg = await db.tourPackage.findUnique({ where: { id }, select: { id: true, durationDays: true, title: true } });
    if (!pkg) return fail("Paket tidak ditemukan.", 404);
    const days = await db.itineraryDay.findMany({ where: { packageId: id }, orderBy: { day: "asc" } });
    return ok({ packageId: id, durationDays: pkg.durationDays, days });
  } catch {
    return fail("Gagal memuat itinerary.", 500);
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const body = await req.json().catch(() => null);
    const rawDays = Array.isArray(body?.days) ? body.days : null;
    if (!rawDays) return fail("Format `days` tidak valid.");

    const pkg = await db.tourPackage.findUnique({ where: { id }, select: { durationDays: true, title: true } });
    if (!pkg) return fail("Paket tidak ditemukan.", 404);

    const seen = new Set<number>();
    const maxDay = Math.max(pkg.durationDays, rawDays.length);
    const days = rawDays
      .map((d: Record<string, unknown>, i: number) => ({
        day: Math.max(1, parseIntOr(String(d?.day ?? i + 1) || null, i + 1) as number),
        title: String(d?.title || "").trim() || `Hari ke-${i + 1}`,
        plan: String(d?.plan || "").trim(),
        location: String(d?.location || "").trim(),
      }))
      .filter((d: { day: number }) => {
        if (seen.has(d.day)) return false;
        seen.add(d.day);
        return true;
      })
      .filter((d: { day: number }) => d.day <= maxDay);

    if (days.length === 0) return fail("Minimal satu hari itinerary.");

    await db.$transaction([
      db.itineraryDay.deleteMany({ where: { packageId: id } }),
      db.itineraryDay.createMany({ data: days.map((d: { day: number; title: string; plan: string; location: string }) => ({ ...d, packageId: id })) }),
    ]);

    void logAudit(req, { action: "UPDATE", entity: "ItineraryDay", entityId: id, detail: `${days.length} hari — ${pkg.title}` });
    const saved = await db.itineraryDay.findMany({ where: { packageId: id }, orderBy: { day: "asc" } });
    return ok({ packageId: id, days: saved });
  } catch {
    return fail("Gagal menyimpan itinerary.", 500);
  }
}
