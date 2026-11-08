import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardRole, parseIntOr } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { logAudit } from "@/lib/audit";
import { issueMissingCards, awardPoints } from "@/lib/membership";

/**
 * v11 — KTA Digital (kartu tanda anggota).
 * GET  ?leaderboard=1  → publik: 10 kartu poin tertinggi
 * GET  ?no=KTA-…       → publik: lookup kartu + buku besar poin (pemegang kartu)
 * GET  (admin)         → daftar penuh + statistik
 * POST (admin)         → terbitkan KTA untuk semua anggota terverifikasi
 * PATCH(admin)         → set-status / adjust-points
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const no = searchParams.get("no");
  const leaderboard = searchParams.get("leaderboard");

  try {
    // Publik — papan peringkat poin (nama member + tier + poin saja).
    if (leaderboard) {
      const top = await db.memberCard.findMany({
        where: { status: "ACTIVE", points: { gt: 0 } },
        orderBy: { points: "desc" },
        take: 10,
        include: { member: { select: { name: true, type: true, province: true } } },
      });
      return ok({
        leaderboard: top.map((c, i) => ({
          rank: i + 1,
          cardNo: c.cardNo,
          tier: c.tier,
          points: c.points,
          memberName: c.member.name,
          memberType: c.member.type,
          province: c.member.province,
        })),
      });
    }

    // Publik (semi-privat) — pemegang nomor kartu melihat kartu + riwayat poin.
    if (no) {
      if (!rateLimit(req, "cards-lookup", 20, 60_000)) {
        return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
      }
      const cardNo = no.trim().toUpperCase();
      const card = await db.memberCard.findUnique({
        where: { cardNo },
        include: {
          member: {
            select: {
              name: true, type: true, city: true, province: true,
              licenseNo: true, status: true, memberSince: true, website: true,
            },
          },
        },
      });
      if (!card) return fail("Kartu tidak ditemukan. Periksa kembali nomor KTA.", 404);
      const ledger = await db.pointLedger.findMany({
        where: { cardId: card.id },
        orderBy: { createdAt: "desc" },
        take: 25,
      });
      return ok({ card, ledger });
    }

    // Admin — daftar penuh.
    if (await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"])) return fail("Unauthorized", 401);
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const page = parseIntOr(searchParams.get("page"), 1);
    const pageSize = parseIntOr(searchParams.get("pageSize"), 20);
    const where = {
      AND: [
        status ? { status } : {},
        q
          ? {
              OR: [
                { cardNo: { contains: q } },
                { referralCode: { contains: q } },
                { member: { name: { contains: q } } },
              ],
            }
          : {},
      ],
    };
    const [total, rows] = await Promise.all([
      db.memberCard.count({ where }),
      db.memberCard.findMany({
        where,
        orderBy: { points: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          member: { select: { name: true, type: true, province: true, status: true } },
        },
      }),
    ]);
    const stats = {
      total: await db.memberCard.count(),
      active: await db.memberCard.count({ where: { status: "ACTIVE" } }),
      platinum: await db.memberCard.count({ where: { tier: "PLATINUM" } }),
      pointsIssued: await db.pointLedger.aggregate({ _sum: { delta: true } }),
    };
    return ok({ rows, total, page, pageSize, stats });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memuat kartu.", 500);
  }
}

export async function POST(req: NextRequest) {
  if (await guardRole(["SUPER_ADMIN", "ADMIN"])) return fail("Unauthorized", 401);
  try {
    const result = await issueMissingCards();
    void logAudit(req, {
      action: "CARDS_ISSUE_MISSING",
      entity: "MemberCard",
      detail: `terbit ${result.issued} KTA baru dari ${result.scanned} kandidat`,
    });
    return ok(result);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal menerbitkan kartu.", 500);
  }
}

export async function PATCH(req: NextRequest) {
  if (await guardRole(["SUPER_ADMIN", "ADMIN"])) return fail("Unauthorized", 401);
  try {
    const body = await req.json();
    const cardId = String(body.cardId || "");
    if (!cardId) return fail("cardId wajib diisi.");
    const card = await db.memberCard.findUnique({ where: { id: cardId } });
    if (!card) return fail("Kartu tidak ditemukan.", 404);

    if (body.action === "set-status") {
      const status = body.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE";
      const updated = await db.memberCard.update({ where: { id: cardId }, data: { status } });
      void logAudit(req, { action: "CARD_STATUS", entity: "MemberCard", entityId: card.cardNo, detail: status });
      return ok(updated);
    }
    if (body.action === "adjust-points") {
      const delta = parseIntOr(String(body.delta), 0);
      if (!delta) return fail("Delta poin tidak boleh 0.");
      const updated = await awardPoints(cardId, delta, "ADMIN", String(body.note || "Penyesuaian admin"));
      void logAudit(req, {
        action: "POINTS_ADJUST", entity: "MemberCard", entityId: card.cardNo,
        detail: `${delta > 0 ? "+" : ""}${delta} poin — ${String(body.note || "")}`,
      });
      return ok(updated);
    }
    return fail("Aksi tidak dikenal.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memperbarui kartu.", 500);
  }
}
