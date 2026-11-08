import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { isSandbox } from "@/lib/payment";

/**
 * v12.4 «LUNAS» — Lacak pesanan publik.
 * GET ?no=ORD-…&phone=0812… (rate-limit 20/menit/IP).
 * Autentikasi ringan: nomor pesanan + 8 digit terakhir nomor WhatsApp
 * pemesan harus cocok — cukup untuk portal jamaah tanpa akun.
 * Mengembalikan status, ringkasan pembayaran, dan nomor invoice bila LUNAS.
 */
export async function GET(req: NextRequest) {
  if (!rateLimit(req, "order-track", 20, 60_000)) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const no = (req.nextUrl.searchParams.get("no") || "").trim();
    const phone = (req.nextUrl.searchParams.get("phone") || "").trim();
    if (!no || !phone) return fail("Nomor pesanan dan nomor WhatsApp wajib diisi.");

    const order = await db.order.findUnique({
      where: { number: no },
      include: {
        invoice: { select: { number: true, issuedAt: true } },
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!order) return fail("Pesanan tidak ditemukan. Periksa nomor pesanan Anda.", 404);

    const lastDigits = (s: string) => s.replace(/\D/g, "").slice(-8);
    if (lastDigits(phone) !== lastDigits(order.customerPhone)) {
      return fail("Nomor WhatsApp tidak cocok dengan pemesan pesanan ini.", 403);
    }

    return ok({
      order: {
        number: order.number,
        packageTitle: order.packageTitle,
        memberName: order.memberName,
        customerName: order.customerName,
        quantity: order.quantity,
        unitPrice: order.unitPrice,
        amount: order.amount,
        status: order.status,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
      },
      payment: order.payments[0]
        ? { method: order.payments[0].method, provider: order.payments[0].provider, status: order.payments[0].status }
        : null,
      invoice: order.invoice ? { number: order.invoice.number, issuedAt: order.invoice.issuedAt } : null,
      sandbox: isSandbox(),
    });
  } catch {
    return fail("Gagal melacak pesanan.", 500);
  }
}
