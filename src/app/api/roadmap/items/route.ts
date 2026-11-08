import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, ok, fail } from "@/lib/api-helpers";
import { localeFromRequest, applyEntityTranslations } from "@/lib/i18n-server";

// v12.2 «99 ROADMAP UPGRADE» — daftar 99 item upgrade (publik).
export async function GET(req: NextRequest) {
  try {
    const items = await db.roadmapItem.findMany({ orderBy: { order: "asc" } });
    const locale = localeFromRequest(req);
    const localized = await applyEntityTranslations({
      entity: "RoadmapItem",
      rows: items,
      locale,
      keyOf: (r) => r.id,
      fields: ["title", "description"],
    });
    return ok(localized);
  } catch {
    return fail("Gagal memuat item roadmap.", 500);
  }
}

const PILLARS = ["JAMAAH", "AKADEMI", "BISNIS", "PLATFORM", "KEAMANAN", "EKOSISTEM"];
const PRIORITIES = ["P0", "P1", "P2", "P3"];
const EFFORTS = ["S", "M", "L", "XL"];
const STATUSES = ["DONE", "IN_PROGRESS", "PLANNED"];

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    const code = String(body.code || "").trim().toUpperCase();
    if (!code) return fail("Kode item wajib diisi.", 400);
    if (await db.roadmapItem.findUnique({ where: { code } }))
      return fail(`Kode ${code} sudah dipakai.`, 409);
    const last = await db.roadmapItem.findFirst({ orderBy: { order: "desc" } });
    const item = await db.roadmapItem.create({
      data: {
        code,
        pillar: PILLARS.includes(body.pillar) ? body.pillar : "PLATFORM",
        title: String(body.title || "Upgrade baru"),
        description: String(body.description || ""),
        priority: PRIORITIES.includes(body.priority) ? body.priority : "P2",
        effort: EFFORTS.includes(body.effort) ? body.effort : "M",
        status: STATUSES.includes(body.status) ? body.status : "PLANNED",
        target: String(body.target || "v13"),
        order: parseInt(body.order, 10) || (last?.order ?? 0) + 1,
      },
    });
    return ok(item, 201);
  } catch {
    return fail("Gagal membuat item roadmap.", 500);
  }
}
