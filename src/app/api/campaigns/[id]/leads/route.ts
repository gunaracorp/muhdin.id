import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { guardAdmin, ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";

/**
 * R-089 «Landing Kampanye Musiman» — lead konversi (v13.0 «GERBANG»).
 *
 * POST /api/campaigns/[id]/leads — PUBLIK: kirim lead dari landing page
 *   (anti-spam: honeypot + rate-limit; kampanye harus aktif).
 * GET  /api/campaigns/[id]/leads — ADMIN: daftar lead kampanye (terbaru dulu).
 * PUT  /api/campaigns/[id]/leads — ADMIN: ubah status lead {id, status}.
 */

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!rateLimit(req, "campaign-lead", 6, 60_000)) {
    return fail("Terlalu banyak pengiriman. Tunggu sebentar.", 429);
  }
  const { id: slug } = await ctx.params;
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    // Honeypot terisi → bot: balas sukses palsu tanpa menyimpan.
    if (String(body.honey || "")) return ok({ received: true });

    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim() || null;
    const source = String(body.source || "direct").slice(0, 60);
    const message = String(body.message || "").trim() || null;

    if (name.length < 3) return fail("Nama minimal 3 karakter.");
    if (!/^[+\-\s()0-9]{8,20}$/.test(phone)) return fail("Nomor WhatsApp tidak valid.");
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Email tidak valid.");

    const campaign = await db.campaign.findFirst({ where: { slug, active: true } });
    if (!campaign) return fail("Kampanye tidak ditemukan / sudah berakhir.", 404);

    const lead = await db.campaignLead.create({
      data: { campaignId: campaign.id, name, phone, email, source, message },
    });
    return ok({ received: true, id: lead.id });
  } catch {
    return fail("Gagal mengirim pendaftaran.", 500);
  }
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id: slug } = await ctx.params;
  try {
    const campaign = await db.campaign.findUnique({ where: { slug } });
    if (!campaign) return fail("Kampanye tidak ditemukan.", 404);
    const leads = await db.campaignLead.findMany({
      where: { campaignId: campaign.id },
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    return ok({ campaign: { id: campaign.id, title: campaign.title, slug: campaign.slug }, leads });
  } catch {
    return fail("Gagal memuat lead.", 500);
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return fail("Tidak terautentikasi.", 401);
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const id = String(body.id || "");
    const status = String(body.status || "");
    if (!id || !["NEW", "CONTACTED", "CONVERTED", "INVALID"].includes(status)) {
      return fail("id dan status (NEW|CONTACTED|CONVERTED|INVALID) wajib.");
    }
    const lead = await db.campaignLead.update({ where: { id }, data: { status } }).catch(() => null);
    if (!lead) return fail("Lead tidak ditemukan.", 404);
    return ok({ id: lead.id, status: lead.status });
  } catch {
    return fail("Gagal memperbarui lead.", 500);
  }
}
