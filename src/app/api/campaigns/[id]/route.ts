import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * R-089 — ubah/hapus kampanye (v13.0 «GERBANG»).
 * PUT    /api/campaigns/[id] — perbarui field kampanye.
 * DELETE /api/campaigns/[id] — hapus (lead ikut terhapus, cascade).
 */

const SEASONS = ["RAMADAN", "HAJI", "LIBURAN", "HIJRIAH", "LAINNYA"];

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (title.length < 4) return fail("Judul kampanye minimal 4 karakter.");
      data.title = title;
    }
    if (body.season !== undefined && SEASONS.includes(String(body.season))) data.season = String(body.season);
    if (body.subtitle !== undefined) data.subtitle = String(body.subtitle).trim();
    if (body.description !== undefined) data.description = String(body.description).trim();
    if (body.heroImage !== undefined) data.heroImage = String(body.heroImage).trim() || null;
    if (body.ctaText !== undefined) data.ctaText = String(body.ctaText).trim() || "Daftar Sekarang";
    if (body.accent !== undefined && ["gold", "forest", "mint"].includes(String(body.accent))) data.accent = String(body.accent);
    if (body.active !== undefined) data.active = Boolean(body.active);
    if (body.startsAt !== undefined) data.startsAt = body.startsAt ? new Date(String(body.startsAt)) : null;
    if (body.endsAt !== undefined) data.endsAt = body.endsAt ? new Date(String(body.endsAt)) : null;

    const campaign = await db.campaign.update({ where: { id }, data }).catch(() => null);
    if (!campaign) return fail("Kampanye tidak ditemukan.", 404);
    void logAudit(req, { action: "CAMPAIGN_UPDATE", entity: "Campaign", entityId: id, detail: campaign.slug });
    return ok({ id: campaign.id });
  } catch {
    return fail("Gagal memperbarui kampanye.", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const campaign = await db.campaign.delete({ where: { id } }).catch(() => null);
    if (!campaign) return fail("Kampanye tidak ditemukan.", 404);
    void logAudit(req, { action: "CAMPAIGN_DELETE", entity: "Campaign", entityId: id, detail: campaign.slug });
    return ok({ deleted: true });
  } catch {
    return fail("Gagal menghapus kampanye.", 500);
  }
}
