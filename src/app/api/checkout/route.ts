import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, parseIntOr } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { logAudit } from "@/lib/audit";
import {
  getPaymentAdapter, generateOrderNumber, rupiah, isSandbox,
} from "@/lib/payment";
import { notifyOrderPaid } from "@/lib/whatsapp";
import { validateCoupon, CouponReason } from "@/lib/coupon";

/**
 * v12.4 «LUNAS» — R-010 Checkout Lengkap.
 * POST publik (rate-limit 8/menit/IP): buat Order PENDING + payment intent
 * dari adapter aktif (R-038). Slot TIDAK langsung berkurang — dikunci saat
 * LUNAS oleh panitia/e-tiket (mengikuti pipeline booking existing).
 *
 * Validasi: paket PUBLISHED, sisa slot cukup, qty 1-50, nama/telepon valid.
 * v14.0 «KAMPANYE & KAWAL» — R-042: couponCode opsional divalidasi ulang
 * server-side (potongan klien tidak pernah dipercaya); amount tersimpan
 * sudah setelah diskon, discountAmount + couponCode dicatat pada Order,
 * tebusan baru dicatat saat LUNAS (applyPaid).
 */

/** Pesan ramah per alasan kupon — konsisten dengan panel checkout. */
const COUPON_MSG: Record<CouponReason, string> = {
  OK: "Kupon berlaku.",
  NOT_FOUND: "Kode kupon tidak dikenali.",
  INACTIVE: "Kupon ini sedang tidak aktif.",
  NOT_STARTED: "Kampanye kupon ini belum dimulai.",
  EXPIRED: "Kupon ini sudah kedaluwarsa.",
  EXHAUSTED: "Kuota pemakaian kupon sudah habis.",
  MIN_AMOUNT: "Subtotal belum memenuhi minimum kupon.",
  PHONE_LIMIT: "Nomor WhatsApp Anda sudah pernah memakai kupon ini.",
};
export async function POST(req: NextRequest) {
  if (!rateLimit(req, "checkout", 8, 60_000)) {
    return fail("Terlalu banyak percobaan checkout. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const packageId = String(body.packageId || "");
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const quantity = Math.max(1, Math.min(50, parseIntOr(String(body.quantity ?? "") || null, 1) as number));
    const notes = String(body.notes || "").trim();
    const couponCode = String(body.couponCode || "").trim(); // R-042

    if (!packageId) return fail("Paket tidak valid.");
    if (name.length < 3) return fail("Nama lengkap minimal 3 karakter.");
    if (!/^[+\-\s()0-9]{8,20}$/.test(phone)) return fail("Nomor WhatsApp/telepon tidak valid.");
    // R-078 UU PDP — persetujuan pemrosesan data pribadi wajib saat checkout.
    if (body.pdpConsent !== true) {
      return fail("Persetujuan Pelindungan Data Pribadi (UU PDP) wajib dicentang.");
    }

    const pkg = await db.tourPackage.findUnique({
      where: { id: packageId },
      include: { member: { select: { name: true } } },
    });
    if (!pkg) return fail("Paket tidak ditemukan.", 404);
    if (pkg.status !== "PUBLISHED") return fail("Paket ini sudah tidak menerima pendaftaran.");
    if (pkg.slotsTaken + quantity > pkg.slots) {
      return fail(`Sisa slot hanya ${pkg.slots - pkg.slotsTaken}. Kurangi jumlah jamaah atau hubungi panitia.`);
    }

    const subtotal = pkg.price * quantity;

    // R-042 — validasi ulang kupon server-side; klien tidak pernah dipercaya.
    let discountAmount = 0;
    let appliedCode: string | null = null;
    if (couponCode) {
      const result = await validateCoupon({ code: couponCode, subtotal, customerPhone: phone });
      if (!result.ok) return fail(COUPON_MSG[result.reason]);
      discountAmount = result.discount ?? 0;
      appliedCode = couponCode; // kode valid — dicatat pada Order
    }
    const amount = subtotal - discountAmount;

    // Buat order PENDING + intent pembayaran dari adapter aktif.
    const adapter = getPaymentAdapter();
    const number = generateOrderNumber();
    const intent = await adapter.createIntent({
      number, amount, packageTitle: pkg.title, customerName: name,
    });

    const order = await db.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          number,
          packageId: pkg.id,
          packageTitle: pkg.title,
          memberName: pkg.member?.name ?? "",
          customerName: name,
          customerPhone: phone,
          customerEmail: email || null,
          quantity,
          unitPrice: pkg.price,
          amount,
          discountAmount,
          couponCode: appliedCode,
          status: "PENDING",
          paymentProvider: adapter.name,
          paymentRef: intent.ref,
          notes: notes || null,
          pdpConsent: true, // sudah divalidasi di atas (R-078)
        },
      });
      await tx.payment.create({
        data: {
          orderId: o.id,
          provider: adapter.name,
          providerRef: intent.ref,
          amount,
          method: intent.method,
          status: "INITIATED",
        },
      });
      return o;
    });

    void logAudit(req, {
      action: "CREATE",
      entity: "Order",
      entityId: order.id,
      detail:
        `${name} → ${pkg.title} ×${quantity} = ${rupiah(subtotal)}` +
        (discountAmount > 0 ? ` − kupon ${couponCode} ${rupiah(discountAmount)} = ${rupiah(amount)}` : "") +
        ` (${adapter.name})`,
    });

    // Beri tahu sekretariat ada order baru menunggu pembayaran (gagal-aman).
    void notifyOrderPaid({ number, packageTitle: pkg.title, amount, method: "MENUNGGU BAYAR", invoiceNumber: "-", customerName: name });

    return ok(
      {
        order: {
          number: order.number,
          status: order.status,
          amount: order.amount,
          subtotal,
          discountAmount,
          couponCode: appliedCode,
          packageTitle: order.packageTitle,
        },
        payment: {
          provider: adapter.name,
          method: intent.method,
          ref: intent.ref,
          instructions: intent.instructions,
          sandbox: isSandbox(),
        },
        message: `Pesanan ${number} dibuat. Selesaikan pembayaran agar slot Anda terkunci.`,
      },
      201
    );
  } catch {
    return fail("Gagal membuat pesanan.", 500);
  }
}
