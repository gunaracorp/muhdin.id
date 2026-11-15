import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail, parseIntOr } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * v6.0 — Detail muthowif. PUT admin [SUPER_ADMIN, ADMIN, EDITOR]; DELETE [SUPER_ADMIN, ADMIN].
 */

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const existing = await db.muthowif.findUnique({ where: { id } });
    if (!existing) return fail("Muthowif tidak ditemukan.", 404);

    const data: Record<string, unknown> = {};
    if (body.fullName !== undefined) {
      const fullName = String(body.fullName).trim();
      if (fullName.length < 3) return fail("Nama muthowif minimal 3 karakter.");
      data.fullName = fullName;
    }
    if (body.certNo !== undefined) data.certNo = String(body.certNo);
    if (body.agency !== undefined) data.agency = String(body.agency);
    if (body.languages !== undefined) data.languages = String(body.languages).toUpperCase();
    if (body.specialties !== undefined) data.specialties = String(body.specialties);
    if (body.experienceYears !== undefined)
      data.experienceYears = Math.max(0, parseIntOr(String(body.experienceYears) || null, existing.experienceYears) as number);
    if (body.phone !== undefined) data.phone = String(body.phone);
    if (body.rating !== undefined) {
      const r = Number(body.rating);
      data.rating = Number.isFinite(r) ? Math.min(5, Math.max(0, r)) : existing.rating;
    }
    if (body.availability !== undefined && ["AVAILABLE", "ASSIGNED", "UNAVAILABLE"].includes(String(body.availability))) {
      data.availability = String(body.availability);
    }
    if (body.memberId !== undefined) {
      if (!body.memberId) data.memberId = null;
      else {
        const member = await db.member.findUnique({ where: { id: String(body.memberId) } });
        if (!member) return fail("Anggota afiliasi tidak ditemukan.", 404);
        data.memberId = member.id;
      }
    }

    const muthowif = await db.muthowif.update({
      where: { id },
      data,
      include: { member: { select: { id: true, name: true, city: true } } },
    });
    void logAudit(req, { action: "UPDATE", entity: "Muthowif", entityId: id, detail: muthowif.fullName });
    return ok(muthowif);
  } catch {
    return fail("Gagal memperbarui muthowif.", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const muthowif = await db.muthowif.delete({ where: { id } });
    void logAudit(req, { action: "DELETE", entity: "Muthowif", entityId: id, detail: muthowif.fullName });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus muthowif.", 500);
  }
}
