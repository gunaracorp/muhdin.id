/**
 * R-098 v15.0.0 — Kelola kendali ISMS (CMS, dipakai CrudManager).
 * PUT    : ubah status/bukti/kategori.
 * DELETE : hapus kendali.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardRole } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { bustCache } from "@/lib/hot-cache";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const status = String(body.status || "").toUpperCase();
    if (!["PLANNED", "IMPLEMENTED", "VERIFIED"].includes(status)) {
      return fail("Status kendali tidak dikenal.");
    }
    const control = await db.iSMSControl.update({
      where: { id },
      data: {
        status,
        category: body.category ? String(body.category) : undefined,
        title: body.title ? String(body.title).trim() : undefined,
        evidence: body.evidence !== undefined ? String(body.evidence || "") || null : undefined,
      },
    });
    bustCache("isms:");
    void logAudit(req, {
      action: "UPDATE",
      entity: "ISMSControl",
      entityId: id,
      detail: `kendali ${control.code} → ${status}`,
    });
    return ok(control);
  } catch {
    return fail("Gagal memperbarui kendali.", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const control = await db.iSMSControl.delete({ where: { id } });
    bustCache("isms:");
    void logAudit(_req, {
      action: "DELETE",
      entity: "ISMSControl",
      entityId: id,
      detail: `kendali ${control.code} dihapus`,
    });
    return ok({ message: `Kendali ${control.code} dihapus.` });
  } catch {
    return fail("Gagal menghapus kendali.", 500);
  }
}
