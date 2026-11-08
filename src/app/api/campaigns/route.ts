import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * R-089 «Landing Kampanye Musiman» — kelola kampanye (v13.0 «GERBANG»).
 *
 * GET  /api/campaigns — ADMIN: daftar kampanye + hitungan lead per status.
 * POST /api/campaigns — ADMIN: buat kampanye baru.
 */

const SEASONS = ["RAMADAN", "HAJI", "LIBURAN", "HIJRIAH", "LAINNYA"];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const campaigns = await db.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { leads: true } } },
    });
    const byStatus = await db.campaignLead.groupBy({ by: ["campaignId", "status"], _count: { _all: true } });
    const statMap = new Map<string, Record<string, number>>();
    for (const g of byStatus) {
      const rec = statMap.get(g.campaignId) || {};
      rec[g.status] = g._count._all;
      statMap.set(g.campaignId, rec);
    }
    return ok(
      campaigns.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        season: c.season,
        subtitle: c.subtitle,
        description: c.description,
        heroImage: c.heroImage,
        ctaText: c.ctaText,
        accent: c.accent,
        active: c.active,
        startsAt: c.startsAt,
        endsAt: c.endsAt,
        createdAt: c.createdAt,
        leadTotal: c._count.leads,
        leadStats: statMap.get(c.id) || {},
      })),
    );
  } catch {
    return fail("Gagal memuat kampanye.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const title = String(body.title || "").trim();
    if (title.length < 4) return fail("Judul kampanye minimal 4 karakter.");
    const season = SEASONS.includes(String(body.season)) ? String(body.season) : "LAINNYA";
    const slug = slugify(String(body.slug || title));
    if (!slug) return fail("Slug tidak valid.");

    const exists = await db.campaign.findUnique({ where: { slug } });
    if (exists) return fail("Slug kampanye sudah dipakai.", 409);

    const campaign = await db.campaign.create({
      data: {
        slug,
        title,
        season,
        subtitle: String(body.subtitle || "").trim(),
        description: String(body.description || "").trim(),
        heroImage: String(body.heroImage || "").trim() || null,
        ctaText: String(body.ctaText || "").trim() || "Daftar Sekarang",
        accent: ["gold", "forest", "mint"].includes(String(body.accent)) ? String(body.accent) : "gold",
        active: body.active === undefined ? true : Boolean(body.active),
        startsAt: body.startsAt ? new Date(String(body.startsAt)) : null,
        endsAt: body.endsAt ? new Date(String(body.endsAt)) : null,
      },
    });
    void logAudit(req, { action: "CAMPAIGN_CREATE", entity: "Campaign", entityId: campaign.id, detail: campaign.slug });
    return ok({ id: campaign.id, slug: campaign.slug });
  } catch {
    return fail("Gagal membuat kampanye.", 500);
  }
}
