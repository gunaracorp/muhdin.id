/**
 * v12.4 «LUNAS» — R-038 Payment Gateway (pola adapter).
 *
 * Arsitektur: seluruh alur checkout berbicara dengan SATU kontrak
 * `PaymentAdapter`; provider aktif dipilih lewat env `PAYMENT_PROVIDER`
 * (default: SANDBOX). Menyambungkan Midtrans/Xendit riil = menambah satu
 * file adapter + mengisi kredensial di .env — tanpa menyentuh alur lain.
 *
 *   SANDBOX (aktif, mandiri, tanpa kredensial):
 *     • createIntent    → menghasilkan referensi SBOX-* + instruksi bayar
 *     • callback        → POST /api/payments/callback ber-signature HMAC-SHA256
 *     • simulasi        → POST /api/payments/simulate (hanya saat SANDBOX)
 *
 *   Produksi (siap sambung):
 *     • implement adapter createIntent + parseCallback per provider
 *     • set PAYMENT_PROVIDER, kredensial provider, PAYMENT_WEBHOOK_SECRET
 *
 * applyPaid() adalah inti idempoten: callback boleh datang berkali-kali,
 * order hanya berpindah PENDING → PAID satu kali, invoice dibuat satu kali,
 * notifikasi & audit tidak digandakan.
 */

import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { notifyOrderPaid } from "@/lib/whatsapp";
import { notifyEmailOrderPaid } from "@/lib/email";

export type PaymentProviderName = "SANDBOX" | "MIDTRANS" | "XENDIT";

export interface PaymentIntent {
  provider: PaymentProviderName;
  ref: string;
  method: string; // SANDBOX | QRIS | VA | EWALLET
  instructions: string; // teks instruksi pembayaran (ID)
  /** Hanya SANDBOX: tautan simulasi bayar untuk demo/E2E. */
  sandboxPayPath?: string;
}

export interface PaidCallback {
  orderNumber: string;
  ref: string;
  method: string;
  payload?: Record<string, unknown>;
}

export interface PaymentAdapter {
  name: PaymentProviderName;
  createIntent(order: {
    number: string;
    amount: number;
    packageTitle: string;
    customerName: string;
  }): Promise<PaymentIntent>;
}

/* ============ Adapter SANDBOX — mandiri, tanpa kredensial eksternal ============ */

const sandboxAdapter: PaymentAdapter = {
  name: "SANDBOX",
  async createIntent(order) {
    const ref = `SBOX-${Date.now().toString(36).toUpperCase()}-${randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;
    return {
      provider: "SANDBOX",
      ref,
      method: "SANDBOX",
      instructions:
        "Mode SANDBOX (uji coba tanpa uang riil). Buka halaman Pesanan, masukkan nomor pesanan & nomor WhatsApp, lalu tekan «Selesaikan Pembayaran (Sandbox)». Saat produksi, slot ini digantikan QRIS/VA/e-wallet resmi.",
      sandboxPayPath: "pesanan",
    };
  },
};

/** Pilih adapter aktif. Provider riil ditambahkan di sini satu baris per gateway. */
export function getPaymentAdapter(): PaymentAdapter {
  const name = (process.env.PAYMENT_PROVIDER ?? "SANDBOX").toUpperCase();
  switch (name) {
    // case "MIDTRANS": return midtransAdapter;  // plug-in: set env + 1 file
    // case "XENDIT": return xenditAdapter;      // plug-in: set env + 1 file
    default:
      return sandboxAdapter;
  }
}

export function isSandbox(): boolean {
  return (process.env.PAYMENT_PROVIDER ?? "SANDBOX").toUpperCase() === "SANDBOX";
}

/* ============ Signature webhook (HMAC-SHA256, timing-safe) ============ */

function webhookSecret(): string {
  return (
    process.env.PAYMENT_WEBHOOK_SECRET ??
    // Sandbox tanpa kredensial: kunci turunan lokal, cukup untuk uji/E2E.
    `muhdin-sandbox-${process.env.NODE_ENV ?? "dev"}`
  );
}

/** Header callback yang diverifikasi: `x-muhdin-signature: sha256=<hex>`. */
export function signWebhook(rawBody: string): string {
  return `sha256=${createHmac("sha256", webhookSecret()).update(rawBody).digest("hex")}`;
}

export function verifyWebhook(rawBody: string, header: string | null): boolean {
  if (!header) return false;
  const expected = Buffer.from(signWebhook(rawBody), "utf8");
  const given = Buffer.from(header, "utf8");
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

/* ============ Penomoran seri ============ */

function todayStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

export function generateOrderNumber(): string {
  return `ORD-${todayStamp()}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

export function generateInvoiceNumber(): string {
  return `INV-${todayStamp()}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

/* ============ Inti idempoten: terima pembayaran → LUNAS + Invoice ============ */

export interface ApplyPaidResult {
  paid: boolean; // true bila transisi PENDING→PAID terjadi di panggilan ini
  invoiceNumber: string | null;
}

export async function applyPaid(
  order: { id: string; number: string; amount: number; customerName: string; status: string },
  cb: PaidCallback
): Promise<ApplyPaidResult> {
  // Idempoten: order yang sudah PAID (atau ditutup) tidak diproses ulang.
  if (order.status !== "PENDING") {
    const existing = await db.invoice.findUnique({ where: { orderId: order.id } });
    return { paid: false, invoiceNumber: existing?.number ?? null };
  }

  const now = new Date();
  const invoiceNumber = generateInvoiceNumber();

  const updated = await db.order.updateMany({
    where: { id: order.id, status: "PENDING" }, // guard atomik anti-race
    data: { status: "PAID", paidAt: now, paymentRef: cb.ref, paymentProvider: cb.method === "SANDBOX" ? "SANDBOX" : undefined },
  });
  if (updated.count === 0) {
    const existing = await db.invoice.findUnique({ where: { orderId: order.id } });
    return { paid: false, invoiceNumber: existing?.number ?? null };
  }

  // Catat kepala pembayaran SUCCESS + snapshot payload (audit trail).
  await db.payment.create({
    data: {
      orderId: order.id,
      provider: getPaymentAdapter().name,
      providerRef: cb.ref,
      amount: order.amount,
      method: cb.method,
      status: "SUCCESS",
      payload: JSON.stringify({ ...cb.payload, orderNumber: cb.orderNumber, paidAt: now.toISOString() }),
    },
  });

  // Invoice bernomor seri (idempoten bila pernah dibuat oleh panggilan ganda).
  let invNumber = invoiceNumber;
  const existingInvoice = await db.invoice.findUnique({ where: { orderId: order.id } });
  if (existingInvoice) {
    invNumber = existingInvoice.number;
  } else {
    try {
      await db.invoice.create({ data: { orderId: order.id, number: invNumber, amount: order.amount } });
    } catch {
      const again = await db.invoice.findUnique({ where: { orderId: order.id } });
      invNumber = again?.number ?? invNumber;
    }
  }

  // R-013 — Poin KTA lintas layanan: order LUNAS marketplace menghasilkan
  // poin (1 poin per Rp 10.000) bagi penyelenggara anggota pemilik paket.
  // Gagal-aman: kegagalan poin TIDAK boleh menggagalkan pembayaran.
  try {
    if (order.amount > 0) {
      const pkg = await db.tourPackage.findUnique({
        where: { id: (await db.order.findUnique({ where: { id: order.id }, select: { packageId: true } }))?.packageId ?? "" },
        select: { memberId: true, title: true },
      });
      if (pkg) {
        const card = await db.memberCard.findUnique({ where: { memberId: pkg.memberId } });
        if (card) {
          const { awardPoints } = await import("@/lib/membership");
          await awardPoints(card.id, Math.floor(order.amount / 10_000), "BOOKING", `Order ${order.number} — ${pkg.title}`);
        }
      }
    }
  } catch {
    /* poin gagal-aman */
  }

  // Notifikasi sekretariat (gagal-aman) + audit.
  void notifyOrderPaid({
    number: order.number,
    packageTitle: "",
    amount: order.amount,
    method: cb.method,
    invoiceNumber: invNumber,
    customerName: order.customerName,
  });
  void notifyEmailOrderPaid({
    number: order.number,
    amount: order.amount,
    method: cb.method,
    invoiceNumber: invNumber,
    customerName: order.customerName,
  });
  await logAuditFake(order.number, invNumber);

  return { paid: true, invoiceNumber: invNumber };
}

/** Audit untuk pembayaran (identitas sistem — tanpa sesi admin). */
async function logAuditFake(orderNumber: string, invoiceNumber: string) {
  try {
    await db.auditLog.create({
      data: {
        userName: "payment-gateway",
        role: "SYSTEM",
        action: "PAYMENT",
        entity: "Order",
        detail: `${orderNumber} LUNAS → invoice ${invoiceNumber}`,
      },
    });
  } catch {
    /* audit tidak boleh menggagalkan pembayaran */
  }
}

/** Format rupiah untuk pesan notifikasi server-side. */
export function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}
