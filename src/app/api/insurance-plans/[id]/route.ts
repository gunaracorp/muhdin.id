/**
 * R-048 v15.0.0 — Kelola paket asuransi (CMS).
 * PUT    : ubah nama/penyedia/perlindungan/premi/aktif.
 * DELETE : hapus paket (pesanan lama tetap menyimpan snapshot kode+premi).
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { bustCache } from "@/lib/hot-cache";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const premium = body.premium !== undefined ? Number(body.premium) : undefined;
    if (premium !== undefined && (!Number.isFinite(premium) || premium < 0)) {
      return fail("Premi tidak valid.");
    }
    const plan = await db.insurancePlan.update({
      where: { id },
      data: {
        name: body.name ? String(body.name).trim() : undefined,
        provider: body.provider ? String(body.provider).trim() : undefined,
        coverage: body.coverage !== undefined ? String(body.coverage).trim() : undefined,
        premium: premium !== undefined ? Math.round(premium) : undefined,
        active: body.active !== undefined ? Boolean(body.active) : undefined,
      },
    });
    bustCache("asuransi:");
    void logAudit(req, {
      action: "UPDATE",
      entity: "InsurancePlan",
      entityId: id,
      detail: `paket ${plan.code} diperbarui`,
    });
    return ok({ message: `Paket "${plan.name}" diperbarui.` });
  } catch {
    return fail("Gagal memperbarui paket asuransi.", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const plan = await db.insurancePlan.delete({ where: { id } });
    bustCache("asuransi:");
    void logAudit(_req, {
      action: "DELETE",
      entity: "InsurancePlan",
      entityId: id,
      detail: `paket ${plan.code} dihapus`,
    });
    return ok({ message: `Paket "${plan.name}" dihapus.` });
  } catch {
    return fail("Gagal menghapus paket asuransi.", 500);
  }
}
