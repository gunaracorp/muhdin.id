import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { isSandbox, applyPaid } from "@/lib/payment";

/**
 * v12.4 «LUNAS» — Simulasi pembayaran SANDBOX (hanya mode uji).
 * POST publik (rate-limit 6/menit/IP): menuntaskan order PENDING tanpa uang
 * riil — dipakai demo portal & E2E. Endpoint ini MENOLAK bekerja bila
 * PAYMENT_PROVIDER bukan SANDBOX (produksi pakai webhook ber-signature).
 *
 * Body: { orderNumber, phone } — phone harus cocok dengan pemesan
 * (perbandingan digit terakhir, abaikan pemisah) → anti mainan orang lain.
 */
export async function POST(req: NextRequest) {
  if (!isSandbox()) {
    return fail("Simulasi hanya tersedia di mode SANDBOX.", 403);
  }
  if (!rateLimit(req, "pay-sim", 6, 60_000)) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const orderNumber = String(body.orderNumber || "").trim();
    const phone = String(body.phone || "").trim();
    if (!orderNumber || !phone) return fail("Nomor pesanan dan nomor WhatsApp wajib diisi.");

    const order = await db.order.findUnique({ where: { number: orderNumber } });
    if (!order) return fail("Pesanan tidak ditemukan.", 404);

    const lastDigits = (s: string) => s.replace(/\D/g, "").slice(-8);
    if (!lastDigits(phone) || lastDigits(phone) !== lastDigits(order.customerPhone)) {
      return fail("Nomor WhatsApp tidak cocok dengan pemesan pesanan ini.", 403);
    }

    const result = await applyPaid(order, {
      orderNumber,
      ref: order.paymentRef ?? `SBOX-SIM-${Date.now()}`,
      method: "SANDBOX",
      payload: { simulated: true, via: "simulate-endpoint" },
    });

    return ok({
      applied: result.paid,
      order: { number: orderNumber, status: result.paid ? "PAID" : order.status },
      invoiceNumber: result.invoiceNumber,
      message: result.paid
        ? `Pembayaran (sandbox) diterima. Invoice ${result.invoiceNumber ?? ""} siap diunduh.`
        : "Pesanan sudah diproses sebelumnya.",
    });
  } catch {
    return fail("Gagal memproses pembayaran simulasi.", 500);
  }
}
