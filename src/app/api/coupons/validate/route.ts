import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { validateCoupon } from "@/lib/coupon";

/**
 * R-042 v14.0 — Validasi kupon untuk pratinjau di panel checkout.
 * POST publik rate-limited 10/menit/IP: { code, amount, phone? } →
 * { ok, reason, discount, finalAmount }. HANYA pratinjau — potongan final
 * selalu dihitung ulang server-side di POST /api/checkout, dan tebusan
 * baru dicatat saat order LUNAS.
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(req, "coupon-validate", 10, 60_000)) {
    return fail("Terlalu banyak percobaan validasi kupon. Coba lagi nanti.", 429);
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const amount = Math.max(0, Math.floor(Number(body.amount ?? 0)));
    if (amount <= 0) return fail("Nominal pesanan tidak valid.");
    const result = await validateCoupon({
      code: String(body.code || ""),
      subtotal: amount,
      customerPhone: String(body.phone || "").trim(),
    });
    return ok(result);
  } catch {
    return fail("Gagal memvalidasi kupon.", 500);
  }
}
