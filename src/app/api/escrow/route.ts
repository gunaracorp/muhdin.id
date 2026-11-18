/**
 * R-050 v15.0.0 «GOD MODE» — Escrow Pembayaran Aman (keputusan panitia).
 * GET  : CMS — daftar escrow (HELD/RELEASED/REFUNDED) + ringkasan nilai.
 * POST : CMS — RELEASE (dana dilepas ke penyelenggara setelah layanan
 *        terverifikasi) atau REFUND (dikembalikan ke jamaah) — ber-audit.
 *
 * HELD dibuat otomatis oleh applyPaid (lib/payment.ts) saat pesanan LUNAS;
 * REFUND otomatis ketika pengajuan refund disetujui (api/refund-requests).
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { safeBody, EscrowActionSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const state = req.nextUrl.searchParams.get("state")?.trim().toUpperCase() ?? "";
    const rows = await db.escrowEvent.findMany({
      where: state && ["HELD", "RELEASED", "REFUNDED"].includes(state) ? { state } : undefined,
      orderBy: { updatedAt: "desc" },
    });
    const held = rows.filter((r) => r.state === "HELD").reduce((s, r) => s + r.amount, 0);
    const released = rows.filter((r) => r.state === "RELEASED").reduce((s, r) => s + r.amount, 0);
    const refunded = rows.filter((r) => r.state === "REFUNDED").reduce((s, r) => s + r.amount, 0);
    return ok({
      summary: { held, released, refunded, total: rows.length },
      rows: rows.map((r) => ({
        id: r.id,
        orderNumber: r.orderNumber,
        amount: r.amount,
        state: r.state,
        reason: r.reason,
        actor: r.actor,
        updatedAt: r.updatedAt,
      })),
    });
  } catch {
    return fail("Gagal memuat escrow.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const parsed = safeBody(EscrowActionSchema, body);
    if (!parsed.ok) return fail(parsed.error);

    const event = await db.escrowEvent.findUnique({ where: { orderNumber: parsed.data.orderNumber } });
    if (!event) return fail("Escrow untuk pesanan ini tidak ditemukan.", 404);
    if (event.state !== "HELD") {
      return fail(`Escrow ini sudah berstatus ${event.state} — tidak dapat diputus ulang.`);
    }
    const newState = parsed.data.action === "RELEASE" ? "RELEASED" : "REFUNDED";
    const updated = await db.escrowEvent.update({
      where: { orderNumber: event.orderNumber },
      data: {
        state: newState,
        reason: parsed.data.reason || null,
        actor: "CMS",
      },
    });
    void logAudit(req, {
      action: "UPDATE",
      entity: "EscrowEvent",
      entityId: updated.id,
      detail: `pesanan ${updated.orderNumber} → ${newState}`,
    });
    return ok({
      message:
        newState === "RELEASED"
          ? `Dana pesanan ${updated.orderNumber} dilepas ke penyelenggara.`
          : `Dana pesanan ${updated.orderNumber} dikembalikan ke jamaah.`,
    });
  } catch {
    return fail("Gagal memutus escrow.", 500);
  }
}
