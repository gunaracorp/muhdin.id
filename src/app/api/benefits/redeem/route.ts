import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { logAudit } from "@/lib/audit";
import { awardPoints, generateSerial } from "@/lib/membership";
import { notifyBenefit } from "@/lib/whatsapp"; // v11.1 — notifikasi WA
import { notifyEmailBenefit } from "@/lib/email"; // v11.1 — notifikasi email

/**
 * v11 — Tebus benefit dengan KTA Digital.
 * POST (publik, rate-limited) {cardNo, benefitId}
 * Validasi berlapis: kartu aktif → benefit aktif → kuota → saldo poin.
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(req, "benefit-redeem", 8, 60_000)) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json();
    const cardNo = String(body.cardNo || "").trim().toUpperCase();
    const benefitId = String(body.benefitId || "");
    if (!cardNo || !benefitId) return fail("Nomor KTA dan benefit wajib diisi.");

    const card = await db.memberCard.findUnique({
      where: { cardNo },
      include: { member: { select: { name: true } } },
    });
    if (!card) return fail("KTA tidak ditemukan. Periksa nomor kartu.", 404);
    if (card.status !== "ACTIVE") return fail("Kartu berstatus non-aktif — hubungi sekretariat.");

    const benefit = await db.benefit.findUnique({ where: { id: benefitId } });
    if (!benefit || !benefit.active) return fail("Benefit tidak tersedia.", 404);
    if (benefit.quota !== null && benefit.claimed >= benefit.quota) {
      return fail("Kuota benefit sudah habis.");
    }
    if (benefit.validUntil && benefit.validUntil.getTime() < Date.now()) {
      return fail("Masa berlaku benefit sudah berakhir.");
    }
    if (card.points < benefit.pointsCost) {
      return fail(
        `Poin tidak cukup (butuh ${benefit.pointsCost}, saldo ${card.points}). Kumpulkan poin lewat Akademi & referal.`
      );
    }

    const code = await generateSerial("BNF");
    const redemption = await db.$transaction(async (tx) => {
      const r = await tx.benefitRedemption.create({
        data: {
          code,
          benefitId,
          cardId: card.id,
          holderName: card.member.name,
        },
      });
      if (benefit.pointsCost > 0) {
        await tx.pointLedger.create({
          data: {
            cardId: card.id,
            delta: -benefit.pointsCost,
            reason: "REDEEM",
            note: `Tebus benefit: ${benefit.title}`,
            balanceAfter: card.points - benefit.pointsCost,
          },
        });
        await tx.memberCard.update({
          where: { id: card.id },
          data: { points: { decrement: benefit.pointsCost } },
        });
      }
      await tx.benefit.update({
        where: { id: benefitId },
        data: { claimed: { increment: 1 } },
      });
      return r;
    });

    void logAudit(req, {
      action: "BENEFIT_REDEEM",
      entity: "BenefitRedemption",
      entityId: code,
      detail: `${card.cardNo} → ${benefit.title}`,
    });

    // v11.1 — teruskan penebusan ke sekretariat (email + WA), gagal-aman.
    void notifyBenefit({
      code,
      holderName: card.member.name,
      cardNo: card.cardNo,
      benefitTitle: benefit.title,
      pointsCost: benefit.pointsCost,
    });
    void notifyEmailBenefit({
      code,
      benefitTitle: benefit.title,
      cardNo: card.cardNo,
      holderName: card.member.name,
      pointsCost: benefit.pointsCost,
      createdAt: redemption.createdAt,
      refId: redemption.id,
    });

    const pointsLeft = card.points - benefit.pointsCost;
    return ok({ redemption, pointsLeft });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal menebus benefit.", 500);
  }
}
