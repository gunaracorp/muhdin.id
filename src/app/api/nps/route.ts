/**
 * R-092 «Survei NPS Pasca-Perjalanan» — ukur kepuasan jamaah otomatis.
 * POST publik (rateLimit): kirim skor 0-10 + komentar opsional + cardNo opsional.
 * GET  admin: agregat NPS = %promoter − %detractor + distribusi + tren 30 hari.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

function bucket(score: number): "PROMOTER" | "PASSIVE" | "DETRACTOR" {
  if (score >= 9) return "PROMOTER";
  if (score >= 7) return "PASSIVE";
  return "DETRACTOR";
}

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(req, "nps-survey", 3, 60_000)) {
      return fail("Terlalu banyak pengiriman. Coba lagi beberapa menit lagi.", 429);
    }
    const b = await req.json().catch(() => null);
    const score = Number(b?.score);
    if (!Number.isInteger(score) || score < 0 || score > 10) {
      return fail("Skor NPS harus bilangan 0-10.");
    }
    const comment = String(b?.comment || "").trim().slice(0, 500) || null;
    const cardNo = String(b?.cardNo || "").trim().toUpperCase().slice(0, 20) || null;
    const source = ["TRACKING", "ORDER", "WA", "CMS"].includes(String(b?.source)) ? String(b?.source) : "TRACKING";
    const row = await db.npsResponse.create({ data: { score, comment, cardNo, source } });
    void logAudit(req, { action: "CREATE", entity: "NpsResponse", entityId: row.id, detail: `skor ${score} (${bucket(score)}) via ${source}` });
    return ok({ success: true, bucket: bucket(score), message: "Terima kasih! Masukan Anda membantu MUHDIN makin amanah." }, 201);
  } catch {
    return fail("Gagal menyimpan jawaban survei.", 500);
  }
}

export async function GET(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const [total, promoters, passives, detractors, bySource] = await Promise.all([
      db.npsResponse.count(),
      db.npsResponse.count({ where: { score: { gte: 9 } } }),
      db.npsResponse.count({ where: { score: { in: [7, 8] } } }),
      db.npsResponse.count({ where: { score: { lte: 6 } } }),
      db.npsResponse.groupBy({ by: ["source"], _count: true }),
    ]);
    const nps = total ? Math.round(((promoters - detractors) / total) * 100) : null;
    // tren harian 30 hari terakhir (rata-rata skor per hari)
    const since = new Date(Date.now() - 30 * 86400_000);
    const rows = await db.npsResponse.findMany({
      where: { createdAt: { gte: since } },
      select: { score: true, createdAt: true },
    });
    const trend: { date: string; avg: number; n: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = new Date(Date.now() - i * 86400_000);
      const key = day.toISOString().slice(0, 10);
      const scores = rows.filter((r) => r.createdAt.toISOString().slice(0, 10) === key).map((r) => r.score);
      trend.push({ date: key, avg: scores.length ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0, n: scores.length });
    }
    return ok({
      total,
      promoters,
      passives,
      detractors,
      nps,
      bySource: bySource.map((s) => ({ source: s.source, count: s._count })),
      trend,
    });
  } catch {
    return fail("Gagal memuat agregat NPS.", 500);
  }
}
