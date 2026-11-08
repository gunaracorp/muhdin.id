import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { generateInvoicePdf } from "@/lib/invoice-pdf";

/**
 * v12.4 «LUNAS» — Unduh Invoice PDF (R-039).
 * GET /api/invoices/<INV-…>?phone=0812…
 *   • Pelanggan: verifikasi 8 digit terakhir nomor WhatsApp pemesan.
 *   • Admin (sesi CMS): boleh unduh semua tanpa phone.
 * Respons application/pdf (inline) dengan nomor invoice sebagai nama file.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ number: string }> }) {
  if (!rateLimit(req, "invoice-pdf", 15, 60_000)) {
    return fail("Terlalu banyak permintaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const { number } = await ctx.params;
    const phone = (req.nextUrl.searchParams.get("phone") || "").trim();

    const invoice = await db.invoice.findUnique({
      where: { number },
      include: {
        order: {
          select: {
            number: true, packageTitle: true, memberName: true, customerName: true,
            customerPhone: true, customerEmail: true, quantity: true, unitPrice: true,
            amount: true, status: true, paidAt: true, paymentProvider: true, paymentRef: true,
          },
        },
      },
    });
    if (!invoice) return fail("Invoice tidak ditemukan.", 404);

    // Otorisasi: sesi admin ATAU cocok nomor WhatsApp pemesan.
    const admin = await requireAdmin().catch(() => null);
    if (!admin) {
      if (!phone) return fail("Verifikasi diperlukan: lampirkan nomor WhatsApp pemesan.", 401);
      const lastDigits = (s: string) => s.replace(/\D/g, "").slice(-8);
      if (lastDigits(phone) !== lastDigits(invoice.order.customerPhone)) {
        return fail("Nomor WhatsApp tidak cocok dengan pemesan.", 403);
      }
    }

    if (invoice.order.status !== "PAID" && !admin) {
      return fail("Invoice terbit hanya untuk pesanan yang sudah LUNAS.", 409);
    }

    const pdf = await generateInvoicePdf({
      invoiceNumber: invoice.number,
      issuedAt: invoice.issuedAt,
      order: {
        number: invoice.order.number,
        packageTitle: invoice.order.packageTitle,
        memberName: invoice.order.memberName,
        customerName: invoice.order.customerName,
        customerPhone: invoice.order.customerPhone,
        customerEmail: invoice.order.customerEmail,
        quantity: invoice.order.quantity,
        unitPrice: invoice.order.unitPrice,
        amount: invoice.amount,
        paidAt: invoice.order.paidAt,
        paymentMethod: invoice.order.paymentProvider,
        paymentProvider: invoice.order.paymentRef ? invoice.order.paymentRef : undefined,
      },
      trackUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://muhdin.web.id"}/#/pesanan?no=${invoice.order.number}`,
    });

    return new NextResponse(pdf as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return fail("Gagal membuat PDF invoice.", 500);
  }
}
