import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * v5 Fase 4 — Virtual Tour 360°.
 * GET   : daftar scene (publik = aktif saja; ?admin=1 = semua + statistik).
 * PATCH : ubah status aktif / urutan scene (SUPER_ADMIN/ADMIN).
 */

type Tri = Record<string, unknown>;

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function hotspotCount(raw: string): number {
  const v = parseJson<unknown[]>(raw, []);
  return Array.isArray(v) ? v.length : 0;
}

export async function GET(req: NextRequest) {
  try {
    const admin = req.nextUrl.searchParams.get("admin") === "1";
    if (admin) {
      const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
      if (denied) return denied;
    }
    const scenes = await db.tourScene.findMany({
      where: admin ? {} : { active: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    const views = await db.tourScene.aggregate({ _sum: { viewCount: true } });
    return ok({
      scenes: scenes.map((s) => ({
        id: s.id,
        slug: s.slug,
        site: s.site,
        image: s.image,
        name: parseJson<Tri>(s.name, {}),
        description: parseJson<Tri>(s.description, {}),
        initialView: parseJson<{ yaw: number; pitch: number; hfov?: number }>(s.initialView, { yaw: 0, pitch: 0 }),
        hotspots: parseJson<Tri[]>(s.hotspots, []),
        order: s.order,
        active: s.active,
        viewCount: s.viewCount,
      })),
      stats: {
        scenes: scenes.length,
        hotspots: scenes.reduce((acc, s) => acc + hotspotCount(s.hotspots), 0),
        views: views._sum.viewCount || 0,
      },
    });
  } catch {
    return fail("Gagal memuat tur virtual.", 500);
  }
}

export async function PATCH(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const body = await req.json();
    const id = String(body.id || "");
    if (!id) return fail("ID scene wajib diisi.");
    const existing = await db.tourScene.findUnique({ where: { id } });
    if (!existing) return fail("Scene tidak ditemukan.", 404);

    const data: Record<string, unknown> = {};
    if (typeof body.active === "boolean") data.active = body.active;
    if (typeof body.order === "number") data.order = Math.max(0, Math.min(99, Math.trunc(body.order)));
    if (!Object.keys(data).length) return fail("Tidak ada perubahan.");

    const scene = await db.tourScene.update({ where: { id }, data });
    await logAudit(req, {
      action: "TOUR_SCENE_UPDATE",
      entity: "TourScene",
      entityId: scene.id,
      detail: `${scene.slug} → ${JSON.stringify(data)}`,
    });
    return ok(scene);
  } catch {
    return fail("Gagal memperbarui scene.", 500);
  }
}
