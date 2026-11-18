import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * R-029 v14.1 «AKADEMI & MITRA» — Merchant Partner Benefit KTA.
 * GET  publik: merchant aktif (katalog tebus KTA) — tanpa data sensitif.
 * GET  admin: seluruh merchant + statistik tebusan.
 * POST admin: buat merchant mitra (CrudManager CMS).
 */
export async function GET(req: NextRequest) {
  try {
    // ?stats=1 (admin) → ringkasan tebusan untuk kartu CMS.
    if (req.nextUrl.searchParams.get("stats") === "1") {
      const denied = await guardAdmin();
      if (denied) return denied;
      const redemptions = await db.merchantRedemption.count();
      const merchants = await db.merchantPartner.findMany({ select: { active: true } });
      return ok({
        stats: {
          total: merchants.length,
          active: merchants.filter((m) => m.active).length,
          redemptions,
        },
      });
    }
    if (req.nextUrl.searchParams.get("all") === "1") {
      const denied = await guardAdmin();
      if (denied) return denied;
      const merchants = await db.merchantPartner.findMany({
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { redemptions: true } } },
      });
      return ok(merchants);
    }
    const now = new Date();
    const merchants = await db.merchantPartner.findMany({
      where: { active: true, OR: [{ validUntil: null }, { validUntil: { gt: now } }] },
      orderBy: { createdAt: "asc" },
    });
    return ok(merchants);
  } catch {
    return fail("Gagal memuat merchant mitra.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const name = String(body.name || "").trim();
    if (name.length < 3) return fail("Nama merchant minimal 3 karakter.");
    const discountText = String(body.discountText || "").trim();
    if (discountText.length < 3) return fail("Uraian diskon wajib diisi (mis. '20% untuk semua produk').");
    const category = ["RITEL", "HOTEL", "TRANSPORTASI", "PAKAIAN", "ELEKTRONIK", "KULINER", "UMUM"].includes(String(body.category))
      ? String(body.category)
      : "UMUM";
    const minTier = ["KLASIK", "VERIFIED", "PLATINUM"].includes(String(body.minTier)) ? String(body.minTier) : "KLASIK";
    const validUntil = body.validUntil ? new Date(String(body.validUntil)) : null;
    if (validUntil && isNaN(validUntil.getTime())) return fail("Tanggal berlaku tidak valid.");

    const merchant = await db.merchantPartner.create({
      data: {
        name,
        category,
        discountText,
        city: String(body.city || "").trim().slice(0, 80),
        address: String(body.address || "").trim().slice(0, 300),
        phone: String(body.phone || "").trim().slice(0, 30),
        minTier,
        validUntil,
        active: body.active === false ? false : true,
        description: String(body.description || "").slice(0, 500),
      },
    });
    await logAudit(req, { action: "CREATE", entity: "MerchantPartner", entityId: merchant.id, detail: `${name} (${discountText})` });
    return ok(merchant, 201);
  } catch {
    return fail("Gagal membuat merchant mitra.", 500);
  }
}
