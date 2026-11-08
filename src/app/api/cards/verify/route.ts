import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";

/**
 * v11 — Verifikasi publik KTA Digital (target QR kartu).
 * GET /api/cards/verify?no=KTA-2026-00001
 * Field privasi keras: hanya status kartu + identitas publik member.
 */
export async function GET(req: NextRequest) {
  if (!rateLimit(req, "cards-verify", 30, 60_000)) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const no = new URL(req.url).searchParams.get("no") || "";
    const cardNo = no.trim().toUpperCase();
    if (!/^KTA-\d{4}-\d{5}$/.test(cardNo)) return fail("Format nomor KTA tidak valid.", 400);

    const card = await db.memberCard.findUnique({
      where: { cardNo },
      include: {
        member: {
          select: {
            name: true, type: true, city: true, province: true,
            licenseNo: true, status: true, memberSince: true,
          },
        },
      },
    });
    if (!card) return fail("Kartu tidak ditemukan / tidak terdaftar.", 404);

    // Catat verifikasi (agar audit keaslian kartu terpantau).
    await db.memberCard.update({
      where: { id: card.id },
      data: { verificationCount: { increment: 1 }, lastVerifiedAt: new Date() },
    });

    return ok({
      cardNo: card.cardNo,
      tier: card.tier,
      status: card.status,
      issuedAt: card.issuedAt,
      member: card.member,
    });
  } catch {
    return fail("Gagal memverifikasi kartu.", 500);
  }
}
