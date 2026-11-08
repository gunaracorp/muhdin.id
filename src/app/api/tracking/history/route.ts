import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok } from "@/lib/api-helpers";
import { parseIntOr } from "@/lib/api-helpers";

/**
 * v5 Fase 3 — Jejak (trail) perjalanan rombongan untuk digambar sebagai
 * polyline di peta. Kelompokkan ping per perangkat, urut kronologis.
 * Publik, ringan (maks 60 titik per perangkat).
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const limit = Math.min(60, Math.max(2, parseIntOr(sp.get("limit"), 24)));

    const devices = await db.trackingDevice.findMany({
      select: { id: true, code: true },
      orderBy: { code: "asc" },
    });

    const trails = await Promise.all(
      devices.map(async (d) => {
        const pings = await db.gpsPing.findMany({
          where: { deviceId: d.id },
          orderBy: { recordedAt: "desc" },
          take: limit,
          select: { lat: true, lng: true, recordedAt: true },
        });
        return {
          code: d.code,
          points: pings
            .reverse()
            .map((p) => ({ lat: p.lat, lng: p.lng, t: p.recordedAt.toISOString() })),
        };
      })
    );

    return ok({ trails: trails.filter((t) => t.points.length > 1) });
  } catch {
    return ok({ trails: [] });
  }
}
