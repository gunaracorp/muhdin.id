import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardRole } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * v11 — Admin: kelola booking slot.
 * GET  ?status=&q= → daftar booking (join slot)
 * PATCH {id, action: "checkin" | "cancel"}
 */
export async function GET(req: NextRequest) {
  if (await guardRole(["SUPER_ADMIN", "ADMIN"])) return fail("Unauthorized", 401);
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const q = searchParams.get("q") || "";
    const rows = await db.slotBooking.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { code: { contains: q } },
                { name: { contains: q } },
                { phone: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        slot: { select: { service: true, title: true, city: true, venue: true, startsAt: true } },
      },
    });
    const stats = {
      total: await db.slotBooking.count(),
      booked: await db.slotBooking.count({ where: { status: "BOOKED" } }),
      checkedIn: await db.slotBooking.count({ where: { status: "CHECKED_IN" } }),
      cancelled: await db.slotBooking.count({ where: { status: "CANCELLED" } }),
    };
    return ok({ rows, stats });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memuat booking.", 500);
  }
}

export async function PATCH(req: NextRequest) {
  if (await guardRole(["SUPER_ADMIN", "ADMIN"])) return fail("Unauthorized", 401);
  try {
    const body = await req.json();
    const id = String(body.id || "");
    const booking = await db.slotBooking.findUnique({ where: { id } });
    if (!booking) return fail("Booking tidak ditemukan.", 404);

    if (body.action === "checkin") {
      if (booking.status !== "BOOKED") return fail("Hanya booking berstatus BOOKED yang bisa check-in.");
      const updated = await db.slotBooking.update({
        where: { id },
        data: { status: "CHECKED_IN", checkedInAt: new Date() },
      });
      void logAudit(req, { action: "BOOKING_CHECKIN", entity: "SlotBooking", entityId: booking.code });
      return ok({ booking: updated });
    }
    if (body.action === "cancel") {
      if (booking.status === "CANCELLED") return ok({ booking });
      const [updated] = await db.$transaction([
        db.slotBooking.update({ where: { id }, data: { status: "CANCELLED" } }),
        db.serviceSlot.update({
          where: { id: booking.slotId },
          data: { booked: { decrement: booking.pax } },
        }),
      ]);
      void logAudit(req, { action: "BOOKING_CANCEL", entity: "SlotBooking", entityId: booking.code });
      return ok({ booking: updated });
    }
    return fail("Aksi tidak dikenal.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memperbarui booking.", 500);
  }
}
