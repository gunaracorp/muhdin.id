import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * R-090 v14.1 — CMS keputusan kemitraan (PATCH status + catatan) dan
 * DELETE mitra. Aktivitas dikelola di /api/mosque-partners/activities.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const existing = await db.mosquePartner.findUnique({ where: { id } });
    if (!existing) return fail("Mitra tidak ditemukan.", 404);
    const status = String(body.status || existing.status);
    if (!["PENDING", "ACTIVE", "SUSPENDED"].includes(status)) {
      return fail("Status tidak dikenal (PENDING | ACTIVE | SUSPENDED).");
    }
    const data: {
      status: string;
      notes: string;
      reach?: number;
    } = {
      status,
      notes: body.notes !== undefined ? String(body.notes).slice(0, 500) : existing.notes,
    };
    if (body.reach !== undefined) {
      const reach = Math.max(0, Math.min(1_000_000, Math.floor(Number(body.reach))));
      if (!Number.isFinite(reach)) return fail("Jangkauan tidak valid.");
      data.reach = reach;
    }
    const updated = await db.mosquePartner.update({ where: { id }, data });
    await logAudit(req, {
      action: "UPDATE",
      entity: "MosquePartner",
      entityId: id,
      detail: `${existing.name} → ${status}`,
    });
    return ok(updated);
  } catch {
    return fail("Gagal memperbarui mitra.", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const existing = await db.mosquePartner.findUnique({ where: { id } });
    if (!existing) return fail("Mitra tidak ditemukan.", 404);
    await db.mosquePartner.delete({ where: { id } });
    await logAudit(req, { action: "DELETE", entity: "MosquePartner", entityId: id, detail: existing.name });
    return ok({ deleted: id });
  } catch {
    return fail("Gagal menghapus mitra.", 500);
  }
}
