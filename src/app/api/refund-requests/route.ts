import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { safeBody, RefundRequestSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/ratelimit";
import { quoteRefund, isRefundableStatus, REFUND_TIERS, REFUND_SLA_DAYS } from "@/lib/refund";

/**
 * R-044 v14.1 «AKADEMI & MITRA» — Refund & Pembatalan Berjenjang.
 * GET  `?policy=1` publik: tabel kebijakan + SLA (tanpa data pribadi).
 * GET  admin: seluruh pengajuan untuk CMS keputusan.
 * POST publik (rate-limit 4/menit): ajukan pembatalan dengan verifikasi
 *      nomor pesanan + nomor WhatsApp pemilik order; persen & nominal
 *      DIHITUNG ULANG SERVER-SIDE dari kebijakan + tanggal keberangkatan —
 *      tidak pernah dipercaya dari klien.
 */
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("policy") === "1") {
    return ok({ tiers: REFUND_TIERS, slaDays: REFUND_SLA_DAYS });
  }
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    // ?stats=1 → ringkasan untuk kartu CMS; tanpa parameter → array pengajuan.
    if (req.nextUrl.searchParams.get("stats") === "1") {
      const rows = await db.refundRequest.findMany({ select: { status: true, approvedAmount: true } });
      return ok({
        stats: {
          total: rows.length,
          pending: rows.filter((r) => r.status === "PENDING").length,
          approved: rows.filter((r) => r.status === "APPROVED").length,
          paid: rows.filter((r) => r.status === "PAID").length,
          rejected: rows.filter((r) => r.status === "REJECTED").length,
          totalApprovedAmount: rows
            .filter((r) => r.status === "APPROVED" || r.status === "PAID")
            .reduce((a, r) => a + r.approvedAmount, 0),
        },
      });
    }
    const rows = await db.refundRequest.findMany({ orderBy: { createdAt: "desc" } });
    return ok(rows);
  } catch {
    return fail("Gagal memuat pengajuan refund.", 500);
  }
}

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "refund", 4, 60_000)) {
    return fail("Terlalu banyak pengajuan. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const parsed = safeBody(RefundRequestSchema, body);
    if (!parsed.ok) return fail(parsed.error);

    const order = await db.order.findUnique({
      where: { number: parsed.data.orderNumber },
    });
    if (!order) return fail("Nomor pesanan tidak ditemukan. Periksa kembali ORD Anda.", 404);
    if (order.customerPhone.replace(/\D/g, "").slice(-8) !== parsed.data.phone.replace(/\D/g, "").slice(-8)) {
      return fail("Nomor WhatsApp tidak cocok dengan pemilik pesanan.");
    }
    if (!isRefundableStatus(order.status)) {
      return fail(`Pesanan berstatus ${order.status} — hanya pesanan LUNAS yang dapat diajukan pembatalan.`);
    }
    const dup = await db.refundRequest.findUnique({ where: { orderNumber: order.number } });
    if (dup && dup.status !== "REJECTED" && dup.status !== "CANCELLED") {
      return fail(`Pesanan ini sudah memiliki pengajuan aktif (${dup.status}).`);
    }

    // Tanggal keberangkatan dari paket (bila ada) — dihitung server-side.
    const pkg = order.packageId
      ? await db.tourPackage.findUnique({ where: { id: order.packageId }, select: { departureDate: true } })
      : null;
    const paid = order.amount; // amount sudah setelah diskon kupon
    const q = quoteRefund(paid, pkg?.departureDate ?? null);

    const row = await db.refundRequest.create({
      data: {
        orderNumber: order.number,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        packageTitle: order.packageTitle,
        departureDate: pkg?.departureDate ?? null,
        amountPaid: paid,
        tier: q.tier?.code ?? "T5",
        percentApproved: q.percent,
        approvedAmount: q.approvedAmount,
        reason: parsed.data.reason,
        status: "PENDING",
      },
    });

    void logAudit(req, {
      action: "CREATE",
      entity: "RefundRequest",
      entityId: row.id,
      detail: `${order.number} tier ${q.tier?.code} ${q.percent}% = ${q.approvedAmount.toLocaleString("id-ID")}`,
    });

    return ok(
      {
        request: {
          orderNumber: row.orderNumber,
          tier: row.tier,
          percentApproved: row.percentApproved,
          approvedAmount: row.approvedAmount,
          status: row.status,
          daysLeft: q.daysLeft,
          knownDeparture: q.knownDeparture,
        },
        message: `Pengajuan diterima. Kebijakan ${row.tier}: ${row.percentApproved}% dari ${paid.toLocaleString("id-ID")} = ${row.approvedAmount.toLocaleString("id-ID")} (diproses maks ${REFUND_SLA_DAYS} hari kerja). Keputusan final oleh panitia dengan jejak audit.`,
      },
      201
    );
  } catch {
    return fail("Gagal mengajukan refund.", 500);
  }
}
