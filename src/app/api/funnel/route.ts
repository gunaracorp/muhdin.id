import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { isFunnelStage, recordFunnel, FUNNEL_STAGES, FUNNEL_LABELS } from "@/lib/funnel";
import { safeBody, FunnelTrackSchema } from "@/lib/validation";

/**
 * R-093 — Analitik Funnel Pendaftaran.
 *
 * POST /api/funnel — track event publik (anonim) dari portal:
 *   body { stage: "VIEW_PAKET" | "VIEW_DAFTAR", refId? }
 *   rate-limit 30/menit per IP; hanya stage client yang diizinkan
 *   (stage server-side dijangkau di route terkait — anti pemalsuan).
 *
 * GET /api/funnel — (guardRole SUPER_ADMIN/ADMIN) agregasi funnel:
 *   - hitungan total per stage
 *   - konversi antar-stage (%)
 *   - tren 30 hari (per hari semua stage)
 *   - drop-off terbesar (titik bocor)
 */
const CLIENT_STAGES = new Set(["VIEW_PAKET", "VIEW_DAFTAR"]);

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "funnel-track", 30, 60_000)) {
    return fail("Terlalu sering. Coba lagi nanti.", 429);
  }
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = safeBody(FunnelTrackSchema, body); // R-081
    if (!parsed.ok) return fail(parsed.error, 400);
    if (!CLIENT_STAGES.has(parsed.data.stage)) {
      return fail("Stage tidak valid.", 400);
    }
    const refId = typeof body?.refId === "string" && body.refId ? body.refId.slice(0, 120) : null;
    recordFunnel(parsed.data.stage, refId, "WEB");
    return ok({ tracked: true });
  } catch {
    return fail("Gagal mencatat event.", 500);
  }
}

export async function GET(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Total per stage (seluruh waktu) — satu query grup.
    const grouped = await db.funnelEvent.groupBy({
      by: ["stage"],
      _count: { _all: true },
    });
    const totals = FUNNEL_STAGES.map((s) => ({
      stage: s,
      label: FUNNEL_LABELS[s],
      count: grouped.find((g) => g.stage === s)?._count._all ?? 0,
    }));

    // Konversi antar-stage berurutan.
    const steps = totals.map((t, i) => {
      const prev = i > 0 ? totals[i - 1].count : null;
      return {
        ...t,
        conversionFromPrev: prev && prev > 0 ? Math.round((t.count / prev) * 1000) / 10 : null,
      };
    });

    // Tren 30 hari per hari (semua stage gabungan) untuk sparkline.
    const events = await db.funnelEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { stage: true, createdAt: true },
    });
    const days: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, count: 0 });
    }
    const dayIndex = new Map(days.map((d) => [d.date, d]));
    for (const e of events) {
      const k = e.createdAt.toISOString().slice(0, 10);
      const bucket = dayIndex.get(k);
      if (bucket) bucket.count++;
    }

    // Titik bocor = selisih absolut terbesar antar-stage berurutan.
    let leak = null as null | { from: string; to: string; lost: number };
    for (let i = 1; i < totals.length; i++) {
      const lost = totals[i - 1].count - totals[i].count;
      if (!leak || lost > leak.lost) {
        leak = { from: FUNNEL_LABELS[totals[i - 1].stage], to: FUNNEL_LABELS[totals[i].stage], lost };
      }
    }

    return ok({
      stages: steps,
      last30: days,
      last30Total: events.length,
      leak,
    });
  } catch {
    return fail("Gagal memuat analitik funnel.", 500);
  }
}
