import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardRole } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * v11 — Slot layanan terjadwal (pola booking ala Nusuk Rawdah).
 * GET  (publik) ?service= → slot aktif mendatang + sisa kuota
 * POST/PUT/DELETE (admin) → kelola slot
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const service = searchParams.get("service") || "";
    const admin = searchParams.get("admin") === "1";
    if (admin) {
      if (await guardRole(["SUPER_ADMIN", "ADMIN"])) return fail("Unauthorized", 401);
    }
    const rows = await db.serviceSlot.findMany({
      where: {
        ...(admin ? {} : { active: true, startsAt: { gte: new Date() } }),
        ...(service ? { service } : {}),
      },
      orderBy: { startsAt: "asc" },
      include: { _count: { select: { bookings: { where: { status: { not: "CANCELLED" } } } } } },
    });
    return ok({
      rows: rows.map((s) => ({ ...s, remaining: Math.max(0, s.capacity - s.booked) })),
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memuat slot.", 500);
  }
}

export async function POST(req: NextRequest) {
  if (await guardRole(["SUPER_ADMIN", "ADMIN"])) return fail("Unauthorized", 401);
  try {
    const body = await req.json();
    const service = String(body.service || "");
    const title = String(body.title || "").trim();
    const city = String(body.city || "").trim();
    const venue = String(body.venue || "").trim();
    const startsAt = body.startsAt ? new Date(String(body.startsAt)) : null;
    if (!["KELAS_MANASIK", "KONSULTASI_SYARIAH", "KLINIK_VAKSIN"].includes(service)) {
      return fail("Jenis layanan tidak valid.");
    }
    if (!title || !city || !venue || !startsAt || Number.isNaN(startsAt.getTime())) {
      return fail("Judul, kota, venue, dan waktu mulai wajib diisi dengan benar.");
    }
    const slot = await db.serviceSlot.create({
      data: {
        service,
        title,
        city,
        venue,
        startsAt,
        durationMin: Number(body.durationMin) || 90,
        capacity: Number(body.capacity) || 30,
      },
    });
    void logAudit(req, { action: "SLOT_CREATE", entity: "ServiceSlot", entityId: slot.id, detail: `${service} — ${title}` });
    return ok({ slot });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal membuat slot.", 500);
  }
}

export async function PATCH(req: NextRequest) {
  if (await guardRole(["SUPER_ADMIN", "ADMIN"])) return fail("Unauthorized", 401);
  try {
    const body = await req.json();
    const id = String(body.id || "");
    const slot = await db.serviceSlot.findUnique({ where: { id } });
    if (!slot) return fail("Slot tidak ditemukan.", 404);
    const updated = await db.serviceSlot.update({
      where: { id },
      data: { active: Boolean(body.active) },
    });
    void logAudit(req, { action: "SLOT_TOGGLE", entity: "ServiceSlot", entityId: id, detail: String(body.active) });
    return ok({ slot: updated });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memperbarui slot.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  if (await guardRole(["SUPER_ADMIN", "ADMIN"])) return fail("Unauthorized", 401);
  try {
    const id = new URL(req.url).searchParams.get("id") || "";
    const slot = await db.serviceSlot.findUnique({ where: { id } });
    if (!slot) return fail("Slot tidak ditemukan.", 404);
    await db.serviceSlot.delete({ where: { id } });
    void logAudit(req, { action: "SLOT_DELETE", entity: "ServiceSlot", entityId: id });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal menghapus slot.", 500);
  }
}
