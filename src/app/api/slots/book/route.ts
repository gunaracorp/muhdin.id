import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { generateSerial } from "@/lib/membership";
import { notifyBooking } from "@/lib/whatsapp"; // v11.1 — notifikasi WA
import { notifyEmailBooking } from "@/lib/email"; // v11.1 — notifikasi email

/**
 * v11 — Booking slot layanan.
 * POST (publik, rate-limited) {slotId, name, phone, pax, notes?} → kode BKG
 * GET  ?code=BKG-… (publik, rate-limited) → cek status booking
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(req, "slot-book", 8, 60_000)) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json();
    const slotId = String(body.slotId || "");
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const pax = Math.max(1, Math.min(10, Number(body.pax) || 1));
    if (!slotId || !name || !phone) return fail("Slot, nama, dan nomor WhatsApp wajib diisi.");
    if (!/^(\+?62|0)8\d{7,12}$/.test(phone.replace(/[\s-]/g, ""))) {
      return fail("Format nomor WhatsApp Indonesia tidak valid (08xx / +628xx).");
    }

    const slot = await db.serviceSlot.findUnique({ where: { id: slotId } });
    if (!slot || !slot.active) return fail("Slot tidak tersedia.", 404);
    if (slot.startsAt.getTime() < Date.now()) return fail("Slot sudah lewat.");
    if (slot.booked + pax > slot.capacity) {
      return fail(`Sisa kuota hanya ${Math.max(0, slot.capacity - slot.booked)} tempat.`);
    }

    const code = await generateSerial("BKG");
    const [booking] = await db.$transaction([
      db.slotBooking.create({
        data: { code, slotId, name, phone, pax, notes: body.notes ? String(body.notes) : null },
      }),
      db.serviceSlot.update({ where: { id: slotId }, data: { booked: { increment: pax } } }),
    ]);
    // v11.1 — teruskan booking ke sekretariat (email + WA), gagal-aman.
    void notifyBooking({
      code,
      name,
      phone,
      pax,
      service: slot.service,
      slotTitle: slot.title,
      city: slot.city,
      startsAt: slot.startsAt,
    });
    void notifyEmailBooking({
      code,
      service: slot.service,
      slotTitle: slot.title,
      city: slot.city,
      venue: slot.venue,
      startsAt: slot.startsAt,
      name,
      phone,
      pax,
      notes: booking.notes,
      createdAt: booking.createdAt,
      refId: booking.id,
    });
    return ok({ booking, slot: { title: slot.title, city: slot.city, venue: slot.venue, startsAt: slot.startsAt } });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal membuat booking.", 500);
  }
}

export async function GET(req: NextRequest) {
  if (!rateLimit(req, "booking-check", 20, 60_000)) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const raw = new URL(req.url).searchParams.get("code") || "";
    const code = raw.trim().toUpperCase();
    if (!/^BKG-\d{4}-\d{8}$/.test(code)) return fail("Format kode booking tidak valid.", 400);
    const booking = await db.slotBooking.findUnique({
      where: { code },
      include: {
        slot: { select: { service: true, title: true, city: true, venue: true, startsAt: true, durationMin: true } },
      },
    });
    if (!booking) return fail("Booking tidak ditemukan.", 404);
    return ok({ booking });
  } catch {
    return fail("Gagal memuat booking.", 500);
  }
}
