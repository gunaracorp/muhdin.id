/**
 * Task 19 (R-062) — Observability: papan kesehatan sistem untuk CMS.
 * GET /api/metrics (guardRole SUPER_ADMIN/ADMIN):
 *   • runtime: uptime, memori, node
 *   • database: latensi & jumlah antrean penting (PDP, order, thread, apply)
 *   • adaptif: statistik rate-limit (IP diblokir / melanggar, bucket aktif)
 *   • logs: ring buffer terakhir + statistik level 1 jam
 * Semua angka dihitung on-request — nol dependensi eksternal.
 */
import { NextRequest } from "next/server";
import os from "node:os";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { adaptiveStats } from "@/lib/ratelimit";
import { recentLogs, logStats } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;

  const started = Date.now();
  let dbOk = false;
  let dbLatencyMs = 0;
  let dbError: string | null = null;
  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
    dbLatencyMs = Date.now() - started;
  } catch (e) {
    dbError = (e as Error).message.slice(0, 200);
  }

  const queues = {
    privacyPending: await db.privacyRequest.count({ where: { status: "PENDING" } }).catch(() => -1),
    ordersPending: await db.order.count({ where: { status: "PENDING" } }).catch(() => -1),
    threadsPending: await db.forumThread.count({ where: { status: "PENDING" } }).catch(() => -1),
    applicationsPending: await db.membershipApplication.count({ where: { status: "PENDING" } }).catch(() => -1),
  };

  return ok({
    generatedAt: new Date().toISOString(),
    runtime: {
      node: process.version,
      platform: `${os.platform()}-${os.arch()}`,
      uptimeSec: Math.round(process.uptime()),
      memoryMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
      loadAvg1: os.loadavg()[0]?.toFixed(2) ?? null,
    },
    database: { ok: dbOk, latencyMs: dbLatencyMs, error: dbError, queues },
    adaptive: adaptiveStats(),
    logs: { stats: logStats(), recent: recentLogs(60) },
  });
}
