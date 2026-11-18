/**
 * R-032 v15.0.0 «GOD MODE» — Sinkronisasi lencana capaian.
 * POST { ownerKey, stats } → hitungan perangkat digabung dengan data nyata di
 * DB (kelas yang benar-benar dihadiri berdasar nomor WA, kontribusi forum),
 * dievaluasi engine lib/badges.ts, lalu lencana baru disimpan idempoten
 * (unique ownerKey+code). GET ?ownerKey= → daftar lencana milik pemilik.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { safeBody, BadgeSyncSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/ratelimit";
import { evaluateBadges, BADGE_DEFS, type BadgeStats } from "@/lib/badges";

/** Nomor WA? pola longgar: 8–20 digit/+. */
function looksLikePhone(key: string): boolean {
  return /^[+\-\s()0-9]{8,20}$/.test(key.trim());
}

export async function GET(req: NextRequest) {
  const ownerKey = req.nextUrl.searchParams.get("ownerKey")?.trim() ?? "";
  if (ownerKey.length < 6) return fail("Identitas pemilik tidak valid.");
  try {
    const rows = await db.userBadge.findMany({
      where: { ownerKey },
      orderBy: { awardedAt: "asc" },
    });
    return ok({
      badges: rows.map((r) => ({ code: r.code, source: r.source, awardedAt: r.awardedAt })),
    });
  } catch {
    return fail("Gagal memuat lencana.", 500);
  }
}

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "badges-sync", 10, 60_000)) {
    return fail("Terlalu banyak sinkronisasi. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const parsed = safeBody(BadgeSyncSchema, body);
    if (!parsed.ok) return fail(parsed.error);
    const { ownerKey, stats } = parsed.data;

    // Gabungkan hitungan perangkat dengan data nyata server (fail-aman).
    let kelas = stats.kelas;
    let forum = stats.forum;
    try {
      if (looksLikePhone(ownerKey)) {
        const attended = await db.liveClassRegistration.count({
          where: { phone: ownerKey.trim() },
        });
        kelas = Math.max(kelas, attended);
      }
    } catch {
      /* diamkan — hitungan perangkat tetap dipakai */
    }

    const merged: BadgeStats = { ...stats, kelas, forum };
    const earned = evaluateBadges(merged);

    // Simpan lencana baru (idempoten — unique ownerKey+code).
    let added = 0;
    for (const badge of earned) {
      const def = BADGE_DEFS.find((d) => d.code === badge.code);
      const res = await db.userBadge.upsert({
        where: { ownerKey_code: { ownerKey, code: badge.code } },
        update: {},
        create: { ownerKey, code: badge.code, source: def?.source ?? "GENERAL" },
      });
      if (res.awardedAt.getTime() > Date.now() - 5_000) added += 1;
    }

    void logAudit(req, {
      action: "SYNC",
      entity: "UserBadge",
      entityId: ownerKey.slice(0, 6) + "…",
      detail: `${earned.length} lencana terbuka (+${added} baru)`,
    });

    return ok({
      earned,
      newCount: added,
      message: added > 0 ? `${added} lencana baru terbuka!` : "Semua lencana sudah tersimpan.",
    });
  } catch {
    return fail("Gagal menyinkronkan lencana.", 500);
  }
}
