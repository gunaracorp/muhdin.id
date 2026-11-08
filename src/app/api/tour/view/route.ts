import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";

/**
 * v5 Fase 4 — Penghitung kunjungan scene tur virtual (publik).
 * POST { slug } → viewCount++ (rate limit 60/menit/IP agar polling tak merusak data).
 */
export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(req, "tour-view", 60, 60_000)) return fail("Terlalu banyak permintaan.", 429);
    const body = await req.json();
    const slug = String(body?.slug || "");
    if (!slug) return fail("Slug scene wajib diisi.");
    const scene = await db.tourScene.findUnique({ where: { slug } });
    if (!scene) return fail("Scene tidak ditemukan.", 404);
    const updated = await db.tourScene.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
      select: { slug: true, viewCount: true },
    });
    return ok(updated);
  } catch {
    return fail("Gagal mencatat kunjungan.", 500);
  }
}
