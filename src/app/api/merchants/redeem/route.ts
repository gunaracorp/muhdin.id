import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { safeBody, MerchantRedeemSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/ratelimit";

/**
 * R-029 v14.1 — Tebus offer merchant dengan kartu KTA (POST publik,
 * rate-limit 8/menit). Validasi berlapis server-side:
 *   1. merchant aktif & dalam masa berlaku;
 *   2. nomor KTA terdaftar & kartu aktif;
 *   3. tier KTA pemegang memenuhi syarat minimum merchant.
 * Tebusan dicatat sebagai MerchantRedemption (jejak untuk mitra & CMS).
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(req, "merchant-redeem", 8, 60_000)) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const parsed = safeBody(MerchantRedeemSchema, body);
    if (!parsed.ok) return fail(parsed.error);

    const merchant = await db.merchantPartner.findUnique({ where: { id: parsed.data.merchantId } });
    if (!merchant || !merchant.active) return fail("Offer merchant tidak tersedia.", 404);
    if (merchant.validUntil && merchant.validUntil < new Date()) {
      return fail("Offer merchant ini sudah berakhir.");
    }

    const card = await db.memberCard.findUnique({
      where: { cardNo: parsed.data.cardNo },
      include: { member: { select: { name: true } } },
    });
    if (!card) return fail("Nomor KTA tidak ditemukan. Periksa kartu di #/kartu-anggota.");
    if (card.status !== "ACTIVE") {
      return fail("Kartu KTA tidak aktif — aktifkan kartu terlebih dahulu.");
    }

    // Tier KTA langsung dari kartu (diupdate otomatis dari ledger poin).
    const holderTier = card.tier;
    const tierOrder = ["KLASIK", "VERIFIED", "PLATINUM"];
    if (tierOrder.indexOf(holderTier) < tierOrder.indexOf(merchant.minTier)) {
      return fail(`Offer ini untuk tier ${merchant.minTier} ke atas — tier Anda ${holderTier}. Kumpulkan poin KTA untuk naik tier.`);
    }

    const redemption = await db.merchantRedemption.create({
      data: {
        merchantId: merchant.id,
        cardNo: card.cardNo,
        holderName: card.member.name,
        note: parsed.data.note,
      },
    });

    void logAudit(req, {
      action: "CREATE",
      entity: "MerchantRedemption",
      entityId: redemption.id,
      detail: `${card.cardNo} → ${merchant.name} (${holderTier})`,
    });

    return ok(
      {
        redemption: { id: redemption.id, merchant: merchant.name, discountText: merchant.discountText },
        message: `Selamat! Tunjukkan kartu KTA ${card.cardNo} (tier ${holderTier}) di lokasi ${merchant.name} untuk menikmati: ${merchant.discountText}.`,
      },
      201
    );
  } catch {
    return fail("Gagal menebus offer merchant.", 500);
  }
}
