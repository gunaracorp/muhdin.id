import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { verifyWebhook, applyPaid } from "@/lib/payment";

/**
 * v12.4 «LUNAS» — Webhook pembayaran (R-038).
 * POST publik tapi WAJIB ber-signature HMAC-SHA256 pada header
 * `x-muhdin-signature: sha256=<hex>` (kunci = PAYMENT_WEBHOOK_SECRET).
 *
 * Payload minimal:
 *   { "orderNumber": "ORD-…", "status": "SUCCESS",
 *     "ref": "SBOX-…", "method": "SANDBOX", …bebas tambahan }
 *
 * Idempoten: callback berulang untuk order yang sudah LUNAS dijawab
 * 200 dengan invoice yang sama — tidak ada efek ganda.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-muhdin-signature");
  if (!verifyWebhook(raw, sig)) {
    return fail("Signature webhook tidak sah.", 401);
  }

  try {
    const body = JSON.parse(raw) as Record<string, unknown>;
    const orderNumber = String(body.orderNumber || "").trim();
    const status = String(body.status || "").toUpperCase();
    const ref = String(body.ref || body.providerRef || "CB").trim();
    const method = String(body.method || "SANDBOX").trim().toUpperCase();

    if (!orderNumber) return fail("orderNumber wajib ada.");
    if (status !== "SUCCESS") {
      // Status lain (PENDING/FAILED/EXPIRE) diterima dan dicatat — tanpa efek.
      return ok({ received: true, applied: false, note: `status ${status} tidak menuntaskan pembayaran` });
    }

    const order = await db.order.findUnique({ where: { number: orderNumber } });
    if (!order) return fail("Pesanan tidak ditemukan.", 404);

    const result = await applyPaid(order, { orderNumber, ref, method, payload: body });
    return ok({
      received: true,
      applied: result.paid,
      order: { number: orderNumber, status: result.paid ? "PAID" : order.status },
      invoiceNumber: result.invoiceNumber,
    });
  } catch {
    return fail("Payload webhook tidak valid.", 400);
  }
}
