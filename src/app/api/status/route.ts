/**
 * R-097 «Papan Status Layanan Publik» — transparansi uptime untuk mitra & jamaah.
 * GET publik: sampel kesehatan on-request (DB latency, uptime, memori, jumlah data inti)
 * + riwayat 60 sampel terakhir. Setiap panggilan mencatat satu StatusCheck
 * (dipangkas >200) — jadwal uptime monitor eksternal tinggal memanggil endpoint ini.
 */
import { NextRequest } from "next/server";
import os from "node:os";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // pencatatan sampel + agregat ringan — rate-limit mencegah spam sampel
  if (!rateLimit(req, "status-board", 30, 60_000)) {
    return fail("Terlalu banyak permintaan status. Coba lagi sekejap.", 429);
  }
  const started = Date.now();
  let dbOk = false;
  let dbLatencyMs = 0;
  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
    dbLatencyMs = Date.now() - started;
  } catch {
    dbOk = false;
  }

  let counts = { members: 0, packages: 0, orders: 0, reviews: 0 };
  if (dbOk) {
    try {
      const [members, packages, orders, reviews] = await Promise.all([
        db.member.count(),
        db.tourPackage.count(),
        db.order.count(),
        db.pilgrimReview.count({ where: { status: "APPROVED" } }),
      ]);
      counts = { members, packages, orders, reviews };
    } catch {
      /* data inti gagal dihitung tidak menurunkan status DB */
    }
  }

  const sample = {
    dbLatencyMs,
    uptimeSec: Math.round(process.uptime()),
    memoryMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
    ok: dbOk,
  };
  try {
    await db.statusCheck.create({ data: sample });
    const total = await db.statusCheck.count();
    if (total > 200) {
      await db.statusCheck.deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - 7 * 86400_000) } },
      });
    }
  } catch {
    /* pencatatan gagal tidak boleh merusak respons */
  }

  const history = await db.statusCheck.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
    select: { dbLatencyMs: true, uptimeSec: true, memoryMb: true, ok: true, createdAt: true },
  });

  const okCount = history.filter((h) => h.ok).length;
  const uptimePct = history.length ? Number(((okCount / history.length) * 100).toFixed(2)) : null;
  const avgLatency = history.length
    ? Math.round(history.reduce((a, h) => a + h.dbLatencyMs, 0) / history.length)
    : null;

  return ok({
    ok: dbOk,
    service: "muhdin.id",
    version: "v13.1.0",
    runtime: {
      node: process.version,
      platform: `${os.platform()}-${os.arch()}`,
      uptimeSec: sample.uptimeSec,
      memoryMb: sample.memoryMb,
    },
    db: { ok: dbOk, latencyMs: dbLatencyMs },
    data: counts,
    history,
    metrics: { uptimePct, avgLatency, samples: history.length },
    timestamp: new Date().toISOString(),
  });
}
