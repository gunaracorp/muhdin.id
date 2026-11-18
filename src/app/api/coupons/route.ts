import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { normalizeCode } from "@/lib/coupon";
import { logAudit } from "@/lib/audit";

/**
 * R-042 v14.0 «KAMPANYE & KAWAL» — Voucher & Kupon Kampanye.
 * GET  (admin)   : daftar kupon. Tanpa parameter → array polos (dipakai
 *                  CrudManager); `?stats=1` → { coupons, stats } berisi
 *                  ringkasan pemakaian (aktif, terpakai, tebusan, diskon diberikan).
 * POST (admin)   : buat kupon — kode dinormalisasi, duplikat ditolak, aturan
 *                  nilaidivalidasi (persen 1–100, FIXED > 0, tanggal wajar).
 */
export async function GET(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
    if (req.nextUrl.searchParams.get("stats") !== "1") {
      return ok(coupons);
    }
    const [totalRedemptions, discountGiven] = await Promise.all([
      db.couponRedemption.count(),
      db.couponRedemption.aggregate({ _sum: { amount: true } }),
    ]);
    return ok({
      coupons,
      stats: {
        total: coupons.length,
        active: coupons.filter((c) => c.active).length,
        usedCount: coupons.reduce((a, c) => a + c.usedCount, 0),
        totalRedemptions,
        discountGiven: discountGiven._sum.amount ?? 0,
      },
    });
  } catch {
    return fail("Gagal memuat kupon.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const code = normalizeCode(String(body.code || ""));
    if (!/^[A-Z0-9_-]{3,40}$/.test(code)) {
      return fail("Kode 3–40 karakter (huruf, angka, tanda hubung/garis bawah), tanpa spasi.");
    }
    const discountType = body.discountType === "FIXED" ? "FIXED" : "PERCENT";
    const value = Math.floor(Number(body.value ?? 0));
    if (discountType === "PERCENT" && (value < 1 || value > 100)) {
      return fail("Diskon persen harus 1–100.");
    }
    if (discountType === "FIXED" && value < 1) {
      return fail("Diskon rupiah tetap harus lebih dari 0.");
    }
    const minAmount = Math.max(0, Math.floor(Number(body.minAmount ?? 0)));
    // 0/kosong berarti tanpa batas (CrudManager mengirim 0 untuk angka kosong).
    const maxDiscountRaw = !body.maxDiscount || Number(body.maxDiscount) <= 0
      ? null
      : Math.max(0, Math.floor(Number(body.maxDiscount)));
    const usageLimit = !body.usageLimit || Number(body.usageLimit) <= 0
      ? null
      : Math.max(1, Math.floor(Number(body.usageLimit)));
    const perPhoneLimit = Math.max(0, Math.floor(Number(body.perPhoneLimit ?? 1)));

    const dup = await db.coupon.findUnique({ where: { code } });
    if (dup) return fail(`Kode ${code} sudah dipakai kupon lain.`);

    const startsAt = body.startsAt ? new Date(String(body.startsAt)) : null;
    const endsAt = body.endsAt ? new Date(String(body.endsAt)) : null;
    if (startsAt && isNaN(startsAt.getTime())) return fail("Tanggal mulai tidak valid.");
    if (endsAt && isNaN(endsAt.getTime())) return fail("Tanggal berakhir tidak valid.");
    if (startsAt && endsAt && startsAt >= endsAt) return fail("Jendela kampanye tidak wajar (mulai ≥ berakhir).");

    const coupon = await db.coupon.create({
      data: {
        code,
        discountType,
        value,
        minAmount,
        maxDiscount: maxDiscountRaw,
        startsAt,
        endsAt,
        usageLimit,
        perPhoneLimit,
        active: body.active === false ? false : true,
        description: String(body.description || "").slice(0, 300),
      },
    });
    await logAudit(req, {
      action: "COUPON_CREATE",
      entity: "Coupon",
      entityId: coupon.id,
      detail: `${code} ${discountType === "PERCENT" ? `${value}%` : `Rp${value}`}`,
    });
    return ok({ coupon }, 201);
  } catch {
    return fail("Gagal membuat kupon.", 500);
  }
}
