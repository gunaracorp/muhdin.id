import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * R-012 (v13.3) — Kelola satu grup perjalanan (CMS).
 * PUT    admin [SUPER_ADMIN, ADMIN, EDITOR]: ubah data grup / arsipkan.
 * DELETE admin [SUPER_ADMIN, ADMIN]: hapus grup beserta anggota, pesan, jadwal (cascade).
 */

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return fail("Data tidak valid.");

    const existing = await db.travelGroup.findUnique({ where: { id } });
    if (!existing) return fail("Grup tidak ditemukan.", 404);

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 3) return fail("Nama grup minimal 3 karakter.");
      data.name = name;
    }
    if (body.packageId !== undefined) {
      if (!body.packageId) data.packageId = null;
      else {
        const pkg = await db.tourPackage.findUnique({ where: { id: String(body.packageId) } });
        if (!pkg) return fail("Paket tidak ditemukan.", 404);
        data.packageId = pkg.id;
      }
    }
    if (body.departureDate !== undefined) {
      if (!body.departureDate) data.departureDate = null;
      else {
        const d = new Date(String(body.departureDate));
        if (Number.isNaN(d.getTime())) return fail("Tanggal keberangkatan tidak valid.");
        data.departureDate = d;
      }
    }
    if (body.marshalName !== undefined) data.marshalName = String(body.marshalName).trim();
    if (body.marshalPhone !== undefined) {
      const phone = String(body.marshalPhone).trim();
      if (phone && !/^[+0-9 ()-]{6,20}$/.test(phone)) return fail("Nomor telepon marshal tidak valid.");
      data.marshalPhone = phone;
    }
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes) : null;
    if (body.status !== undefined && ["ACTIVE", "ARCHIVED"].includes(String(body.status))) {
      data.status = String(body.status);
    }

    const group = await db.travelGroup.update({
      where: { id },
      data,
      include: {
        pkg: { select: { id: true, title: true, departureDate: true } },
        _count: { select: { members: true, messages: true, schedules: true } },
      },
    });
    void logAudit(req, { action: "UPDATE", entity: "TravelGroup", entityId: id, detail: `${group.name} → ${group.status}` });
    return ok(group);
  } catch {
    return fail("Gagal memperbarui grup perjalanan.", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const group = await db.travelGroup.delete({ where: { id } });
    void logAudit(req, { action: "DELETE", entity: "TravelGroup", entityId: id, detail: group.name });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus grup perjalanan.", 500);
  }
}
