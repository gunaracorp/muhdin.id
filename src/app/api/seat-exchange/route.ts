import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail, parseIntOr } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * v6.0 — Bursa Kursi B2B antar penyelenggara (diferensiasi utama: kompetitor
 * tidak punya). OFFER = jual sisa kursi, WANTED = mencari kursi rombongan.
 * GET  publik: listing OPEN; ?status=all butuh sesi admin. Filter ?side= &q=
 * POST admin [SUPER_ADMIN, ADMIN, EDITOR]: pasang listing atas nama anggota.
 */

const memberSelect = {
  select: { id: true, name: true, type: true, city: true, licenseNo: true, status: true },
};

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const statusParam = sp.get("status");
    let statusFilter: string[] | undefined = ["OPEN"];
    if (statusParam === "all") {
      const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR", "VERIFIKATOR"]);
      if (denied) return denied;
      statusFilter = undefined;
    } else if (statusParam) {
      statusFilter = [statusParam];
    }

    const side = sp.get("side");
    const q = sp.get("q")?.trim();

    const where: Record<string, unknown> = { status: statusFilter ? { in: statusFilter } : undefined };
    if (side) where.side = side;
    if (q) {
      where.OR = [
        { route: { contains: q } },
        { note: { contains: q } },
        { member: { is: { name: { contains: q } } } },
        { pkg: { is: { title: { contains: q } } } },
      ];
    }

    const rows = await db.seatListing.findMany({
      where,
      include: {
        member: memberSelect,
        pkg: { select: { id: true, title: true, type: true, city: true } },
        taker: { select: { id: true, name: true } },
      },
      orderBy: [{ departureDate: "asc" }, { createdAt: "desc" }],
    });
    return ok(rows);
  } catch {
    return fail("Gagal memuat bursa kursi.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const memberId = String(body.memberId || "");
    if (!memberId) return fail("Anggota penjual/peminta kursi wajib dipilih.");
    const member = await db.member.findUnique({ where: { id: memberId } });
    if (!member) return fail("Anggota tidak ditemukan.", 404);

    const seats = parseIntOr(String(body.seats ?? "") || null, 1) as number;
    if (seats < 1) return fail("Jumlah kursi minimal 1.");

    let packageId: string | null = null;
    if (body.packageId) {
      const pkg = await db.tourPackage.findUnique({ where: { id: String(body.packageId) } });
      if (!pkg) return fail("Paket tidak ditemukan.", 404);
      packageId = pkg.id;
    }

    const departureDate = body.departureDate ? new Date(String(body.departureDate)) : null;
    if (departureDate && Number.isNaN(departureDate.getTime())) return fail("Tanggal keberangkatan tidak valid.");

    const pricePerSeat = parseIntOr(String(body.pricePerSeat ?? "") || null, 0) as number;

    const listing = await db.seatListing.create({
      data: {
        memberId,
        packageId,
        side: ["OFFER", "WANTED"].includes(String(body.side)) ? String(body.side) : "OFFER",
        seats: Math.max(1, seats),
        pricePerSeat: Math.max(0, pricePerSeat),
        departureDate,
        route: String(body.route || ""),
        note: body.note ? String(body.note) : null,
        status: ["OPEN", "CLOSED"].includes(String(body.status)) ? String(body.status) : "OPEN",
      },
      include: {
        member: memberSelect,
        pkg: { select: { id: true, title: true, type: true, city: true } },
        taker: { select: { id: true, name: true } },
      },
    });

    void logAudit(req, { action: "CREATE", entity: "SeatListing", entityId: listing.id, detail: `${member.name} — ${listing.side} ${listing.seats} kursi` });
    return ok(listing, 201);
  } catch {
    return fail("Gagal memasang listing bursa kursi.", 500);
  }
}
