import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * v12.4 «LUNAS» — Aksi admin atas satu pesanan.
 * PUT admin [SUPER_ADMIN, ADMIN, VERIFIKATOR]:
 *   action "cancel"  : PENDING → CANCELLED (bebas slot tetap, tak ada bayar)
 *   action "refund"  : PAID → REFUNDED (dicatat; dana riil di luar sistem)
 *   action "reopen"  : CANCELLED → PENDING (salah tekan)
 * Transisi lain ditolak (400). Status PAID tidak bisa di-overwrite manual —
 * hanya via webhook/simulasi terverifikasi agar jejak audit bersih.
 */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const action = String((body as { action?: string } | null)?.action || "");

    const order = await db.order.findUnique({ where: { id } });
    if (!order) return fail("Pesanan tidak ditemukan.", 404);

    let next: string | null = null;
    if (action === "cancel" && order.status === "PENDING") next = "CANCELLED";
    else if (action === "refund" && order.status === "PAID") next = "REFUNDED";
    else if (action === "reopen" && order.status === "CANCELLED") next = "PENDING";
    if (!next) {
      return fail(`Aksi "${action}" tidak berlaku untuk pesanan berstatus ${order.status}.`);
    }

    const updated = await db.order.update({ where: { id }, data: { status: next } });
    await logAudit(req, {
      action: "UPDATE",
      entity: "Order",
      entityId: id,
      detail: `${order.number}: ${order.status} → ${next}`,
    });
    return ok({ order: updated });
  } catch {
    return fail("Gagal memperbarui pesanan.", 500);
  }
}
