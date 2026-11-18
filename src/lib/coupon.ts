/**
 * coupon.ts — R-042 v14.0 «KAMPANYE & KAWAL».
 *
 * Logika voucher & kupon kampanye sepenuhnya server-side:
 *   • normalizeCode   — kode di-uppercase, buang spasi; cocok dengan penyimpanan.
 *   • computeDiscount — potongan maksimum tidak melebihi subtotal.
 *   • validateCoupon  — cek aktif, jendela kampanye, kuota total, kuota per
 *     nomor WhatsApp, subtotal minimum → alasan berbahasa (enum) untuk i18n.
 *
 * Diskon TIDAK pernah dihitung di klien: /api/checkout menghitung ulang
 * dari DB dan menyimpan couponCode + discountAmount pada Order; tebusan
 * (CouponRedemption) baru dicatat saat order LUNAS (applyPaid, gagal-aman).
 */
import { db } from "@/lib/db";

export type CouponReason =
  | "OK"
  | "NOT_FOUND"
  | "INACTIVE"
  | "NOT_STARTED"
  | "EXPIRED"
  | "EXHAUSTED"
  | "MIN_AMOUNT"
  | "PHONE_LIMIT";

export interface CouponInput {
  code: string;
  subtotal: number;
  customerPhone?: string;
}

export interface CouponResult {
  ok: boolean;
  reason: CouponReason;
  /** Label kupon ringkas (untuk pratinjau admin/klien). */
  label?: string;
  discountType?: "PERCENT" | "FIXED";
  /** Potongan rupiah final (≤ subtotal). */
  discount?: number;
  finalAmount?: number;
}

export function normalizeCode(raw: string): string {
  return String(raw || "").trim().toUpperCase().replace(/\s+/g, "");
}

/** Hitung nominal potongan dari aturan kupon — tidak pernah melebihi subtotal. */
export function computeDiscount(
  discountType: string,
  value: number,
  subtotal: number,
  maxDiscount?: number | null
): number {
  let disc = 0;
  if (discountType === "PERCENT") {
    disc = Math.floor((subtotal * Math.max(0, value)) / 100);
    if (maxDiscount && maxDiscount > 0) disc = Math.min(disc, maxDiscount);
  } else {
    disc = value;
  }
  return Math.max(0, Math.min(disc, subtotal));
}

/**
 * Validasi menyeluruh terhadap DB. Selalu mengembalikan result (tidak melempar)
 * agar endpoint validasi publik dapat membalas pesan ramah per alasan.
 */
export async function validateCoupon(input: CouponInput): Promise<CouponResult> {
  const code = normalizeCode(input.code);
  const subtotal = Math.max(0, Math.floor(input.subtotal || 0));
  const phone = (input.customerPhone || "").trim();

  if (!code) return { ok: false, reason: "NOT_FOUND" };

  const c = await db.coupon.findUnique({ where: { code } });
  if (!c) return { ok: false, reason: "NOT_FOUND" };
  if (!c.active) return { ok: false, reason: "INACTIVE" };

  const now = new Date();
  if (c.startsAt && now < c.startsAt) return { ok: false, reason: "NOT_STARTED" };
  if (c.endsAt && now > c.endsAt) return { ok: false, reason: "EXPIRED" };

  if (c.usageLimit !== null && c.usageLimit !== undefined && c.usedCount >= c.usageLimit) {
    return { ok: false, reason: "EXHAUSTED" };
  }

  if (c.minAmount > 0 && subtotal < c.minAmount) {
    return { ok: false, reason: "MIN_AMOUNT" };
  }

  if (phone && c.perPhoneLimit > 0) {
    const used = await db.couponRedemption.count({
      where: { couponId: c.id, customerPhone: phone },
    });
    if (used >= c.perPhoneLimit) return { ok: false, reason: "PHONE_LIMIT" };
  }

  const discount = computeDiscount(c.discountType, c.value, subtotal, c.maxDiscount);
  return {
    ok: true,
    reason: "OK",
    label: c.description || c.code,
    discountType: c.discountType === "FIXED" ? "FIXED" : "PERCENT",
    discount,
    finalAmount: subtotal - discount,
  };
}
