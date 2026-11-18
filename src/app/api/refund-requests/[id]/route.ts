import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { quoteRefund } from "@/lib/refund";

/**
 * R-044 v14.1 — keputusan panitia atas pengajuan refund (PATCH) dengan
 * verifikasi ulang kebijakan server-side saat APPROVED. Setiap keputusan
 * dicatat di jejak audit (siapa, kapan, nominal).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const existing = await db.refundRequest.findUnique({ where: { id } });
    if (!existing) return fail("Pengajuan tidak ditemukan.", 404);

    const status = String(body.status || "");
    if (!["APPROVED", "REJECTED", "PAID", "CANCELLED"].includes(status)) {
      return fail("Status tidak dikenal (APPROVED | REJECTED | PAID | CANCELLED).");
    }
    if (existing.status === "PAID" && status !== "PAID") {
      return fail("Pengajuan sudah dibayarkan — tidak dapat diubah lagi.");
    }

    // Verifikasi ulang kebijakan saat APPROVED — nominal final dari server.
    let percentApproved = existing.percentApproved;
    let approvedAmount = existing.approvedAmount;
    let tier = existing.tier;
    if (status === "APPROVED") {
      const q = quoteRefund(existing.amountPaid, existing.departureDate);
      percentApproved = q.percent;
      approvedAmount = q.approvedAmount;
      tier = q.tier?.code ?? existing.tier;
    }

    const adminNote = body.adminNote !== undefined ? String(body.adminNote).slice(0, 300) : existing.adminNote;
    const updated = await db.refundRequest.update({
      where: { id },
      data: { status, percentApproved, approvedAmount, tier, adminNote, decidedAt: new Date() },
    });
    await logAudit(req, {
      action: "REFUND_DECIDE",
      entity: "RefundRequest",
      entityId: id,
      detail: `${existing.orderNumber} → ${status} ${percentApproved}% = ${approvedAmount.toLocaleString("id-ID")}${adminNote ? ` · ${adminNote.slice(0, 60)}` : ""}`,
    });
    return ok(updated);
  } catch {
    return fail("Gagal memutuskan pengajuan.", 500);
  }
}
