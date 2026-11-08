import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail, parseIntOr } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * v6.0 — Detail listing bursa kursi.
 * PUT admin [SUPER_ADMIN, ADMIN, EDITOR]: ubah listing / transaksikan
 *   (RESERVED → takerMemberId+takerNote, DEAL final, CLOSED menutup).
 * DELETE admin [SUPER_ADMIN, ADMIN].
 */

const memberSelect = {
  select: { id: true, name: true, type: true, city: true, licenseNo: true, status: true },
};

const includeAll = {
  member: memberSelect,
  pkg: { select: { id: true, title: true, type: true, city: true } },
  taker: { select: { id: true, name: true } },
};

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const existing = await db.seatListing.findUnique({ where: { id } });
    if (!existing) return fail("Listing tidak ditemukan.", 404);

    // Aksi transaksional: claim / deal / close / reopen.
    const action = body.action ? String(body.action) : null;
    if (action) {
      if (!["CLAIM", "DEAL", "CLOSE", "REOPEN"].includes(action)) return fail("Aksi tidak dikenal.");
      if (action === "CLAIM") {
        if (existing.status !== "OPEN") return fail("Listing tidak terbuka untuk diambil.");
        const takerMemberId = String(body.takerMemberId || "");
        if (!takerMemberId) return fail("Anggota pengambil wajib dipilih.");
        const taker = await db.member.findUnique({ where: { id: takerMemberId } });
        if (!taker) return fail("Anggota pengambil tidak ditemukan.", 404);
        if (taker.id === existing.memberId) return fail("Tidak bisa mengambil listing sendiri.");
        const listing = await db.seatListing.update({
          where: { id },
          data: { status: "RESERVED", takerMemberId, takerNote: body.takerNote ? String(body.takerNote) : null },
          include: includeAll,
        });
        void logAudit(req, { action: "UPDATE", entity: "SeatListing", entityId: id, detail: `RESERVED oleh ${taker.name}` });
        return ok(listing);
      }
      if (action === "DEAL") {
        if (existing.status !== "RESERVED" && existing.status !== "OPEN") return fail("Hanya listing RESERVED/OPEN yang bisa disepakati.");
        const listing = await db.seatListing.update({ where: { id }, data: { status: "DEAL" }, include: includeAll });
        void logAudit(req, { action: "UPDATE", entity: "SeatListing", entityId: id, detail: "DEAL — transaksi disepakati" });
        return ok(listing);
      }
      if (action === "CLOSE") {
        const listing = await db.seatListing.update({ where: { id }, data: { status: "CLOSED" }, include: includeAll });
        void logAudit(req, { action: "UPDATE", entity: "SeatListing", entityId: id, detail: "CLOSED" });
        return ok(listing);
      }
      // REOPEN
      const listing = await db.seatListing.update({
        where: { id },
        data: { status: "OPEN", takerMemberId: null, takerNote: null },
        include: includeAll,
      });
      void logAudit(req, { action: "UPDATE", entity: "SeatListing", entityId: id, detail: "dibuka kembali" });
      return ok(listing);
    }

    // Edit biasa.
    const data: Record<string, unknown> = {};
    if (body.memberId !== undefined) {
      const member = await db.member.findUnique({ where: { id: String(body.memberId) } });
      if (!member) return fail("Anggota tidak ditemukan.", 404);
      data.memberId = String(body.memberId);
    }
    if (body.packageId !== undefined) {
      if (!body.packageId) data.packageId = null;
      else {
        const pkg = await db.tourPackage.findUnique({ where: { id: String(body.packageId) } });
        if (!pkg) return fail("Paket tidak ditemukan.", 404);
        data.packageId = pkg.id;
      }
    }
    if (body.side !== undefined && ["OFFER", "WANTED"].includes(String(body.side))) data.side = String(body.side);
    if (body.seats !== undefined) data.seats = Math.max(1, parseIntOr(String(body.seats) || null, existing.seats) as number);
    if (body.pricePerSeat !== undefined)
      data.pricePerSeat = Math.max(0, parseIntOr(String(body.pricePerSeat) || null, existing.pricePerSeat) as number);
    if (body.departureDate !== undefined) {
      if (!body.departureDate) data.departureDate = null;
      else {
        const d = new Date(String(body.departureDate));
        if (Number.isNaN(d.getTime())) return fail("Tanggal keberangkatan tidak valid.");
        data.departureDate = d;
      }
    }
    if (body.route !== undefined) data.route = String(body.route);
    if (body.note !== undefined) data.note = body.note ? String(body.note) : null;
    if (body.takerNote !== undefined) data.takerNote = body.takerNote ? String(body.takerNote) : null;
    if (body.status !== undefined && ["OPEN", "RESERVED", "DEAL", "CLOSED"].includes(String(body.status))) {
      data.status = String(body.status);
    }

    const listing = await db.seatListing.update({ where: { id }, data, include: includeAll });
    void logAudit(req, { action: "UPDATE", entity: "SeatListing", entityId: id, detail: `${listing.route || listing.side} → ${listing.status}` });
    return ok(listing);
  } catch {
    return fail("Gagal memperbarui listing.", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const listing = await db.seatListing.delete({ where: { id } });
    void logAudit(req, { action: "DELETE", entity: "SeatListing", entityId: id, detail: `${listing.side} ${listing.seats} kursi` });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus listing.", 500);
  }
}
