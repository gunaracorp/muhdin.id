import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * R-045 v14.1 — keputusan panitia atas group order B2B (PATCH status).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const existing = await db.groupOrder.findUnique({ where: { id } });
    if (!existing) return fail("Rombongan tidak ditemukan.", 404);
    const status = String(body.status || "");
    if (!["PENDING", "CONFIRMED", "CANCELLED"].includes(status)) {
      return fail("Status tidak dikenal (PENDING | CONFIRMED | CANCELLED).");
    }
    const notes = body.notes !== undefined ? String(body.notes).slice(0, 500) : existing.notes;
    const updated = await db.groupOrder.update({ where: { id }, data: { status, notes } });
    await logAudit(req, {
      action: "UPDATE",
      entity: "GroupOrder",
      entityId: id,
      detail: `${existing.code} → ${status} (${existing.memberCount} jamaah, ${existing.totalAmount.toLocaleString("id-ID")})`,
    });
    return ok(updated);
  } catch {
    return fail("Gagal memperbarui rombongan.", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const existing = await db.groupOrder.findUnique({ where: { id } });
    if (!existing) return fail("Rombongan tidak ditemukan.", 404);
    await db.groupOrder.delete({ where: { id } });
    await logAudit(req, { action: "DELETE", entity: "GroupOrder", entityId: id, detail: existing.code });
    return ok({ deleted: id });
  } catch {
    return fail("Gagal menghapus rombongan.", 500);
  }
}
