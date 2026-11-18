import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { validateCoupon } from "@/lib/coupon";
import { safeBody, CouponValidateSchema } from "@/lib/validation";

/**
 * R-042 v14.0 — Validasi kupon untuk pratinjau di panel checkout.
 * POST publik rate-limited 10/menit/IP: { code, amount, phone? } →
 * { ok, reason, discount, finalAmount }. HANYA pratinjau — potongan final
 * selalu dihitung ulang server-side di POST /api/checkout, dan tebusan
 * baru dicatat saat order LUNAS. R-081: payload divalidasi Zod di gerbang.
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(req, "coupon-validate", 10, 60_000)) {
    return fail("Terlalu banyak percobaan validasi kupon. Coba lagi nanti.", 429);
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const parsed = safeBody(CouponValidateSchema, body);
    if (!parsed.ok) return fail(parsed.error);
    if (parsed.data.subtotal <= 0) return fail("Nominal pesanan tidak valid.");
    const result = await validateCoupon({
      code: parsed.data.code,
      subtotal: parsed.data.subtotal,
      customerPhone: parsed.data.phone,
    });
    return ok(result);
  } catch {
    return fail("Gagal memvalidasi kupon.", 500);
  }
}
