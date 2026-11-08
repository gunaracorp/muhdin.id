import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardRole } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * v11 — Katalog benefit mitra.
 * GET  (publik) ?category= → benefit aktif; ?admin=1 → semua + statistik
 * POST/PUT/DELETE (admin) → kelola benefit
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "";
    const admin = searchParams.get("admin") === "1";
    if (admin) {
      if (await guardRole(["SUPER_ADMIN", "ADMIN"])) return fail("Unauthorized", 401);
    }
    const rows = await db.benefit.findMany({
      where: {
        ...(admin ? {} : { active: true }),
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        member: { select: { name: true, type: true, province: true } },
        _count: { select: { redemptions: true } },
      },
    });
    if (admin) {
      const stats = {
        total: await db.benefit.count(),
        active: await db.benefit.count({ where: { active: true } }),
        redemptions: await db.benefitRedemption.count(),
      };
      const redemptions = await db.benefitRedemption.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          benefit: { select: { title: true } },
          card: { select: { cardNo: true } },
        },
      });
      return ok({ rows, stats, redemptions });
    }
    return ok({ rows });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memuat benefit.", 500);
  }
}

export async function POST(req: NextRequest) {
  if (await guardRole(["SUPER_ADMIN", "ADMIN"])) return fail("Unauthorized", 401);
  try {
    const body = await req.json();
    const title = String(body.title || "").trim();
    const partnerName = String(body.partnerName || "").trim();
    const description = String(body.description || "").trim();
    if (!title || !partnerName || !description) return fail("Judul, mitra, dan deskripsi wajib diisi.");
    const benefit = await db.benefit.create({
      data: {
        title,
        partnerName,
        description,
        memberId: body.memberId ? String(body.memberId) : null,
        category: String(body.category || "LAINNYA"),
        discountText: String(body.discountText || ""),
        pointsCost: Math.max(0, Number(body.pointsCost) || 0),
        quota: body.quota ? Number(body.quota) : null,
        validUntil: body.validUntil ? new Date(String(body.validUntil)) : null,
        icon: String(body.icon || "gift"),
        color: String(body.color || "emerald"),
      },
    });
    void logAudit(req, { action: "BENEFIT_CREATE", entity: "Benefit", entityId: benefit.id, detail: title });
    return ok({ benefit });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal membuat benefit.", 500);
  }
}

export async function PATCH(req: NextRequest) {
  if (await guardRole(["SUPER_ADMIN", "ADMIN"])) return fail("Unauthorized", 401);
  try {
    const body = await req.json();
    const id = String(body.id || "");
    const benefit = await db.benefit.findUnique({ where: { id } });
    if (!benefit) return fail("Benefit tidak ditemukan.", 404);
    const updated = await db.benefit.update({
      where: { id },
      data: { active: Boolean(body.active) },
    });
    void logAudit(req, { action: "BENEFIT_TOGGLE", entity: "Benefit", entityId: id, detail: String(body.active) });
    return ok({ benefit: updated });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memperbarui benefit.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  if (await guardRole(["SUPER_ADMIN", "ADMIN"])) return fail("Unauthorized", 401);
  try {
    const id = new URL(req.url).searchParams.get("id") || "";
    const benefit = await db.benefit.findUnique({ where: { id } });
    if (!benefit) return fail("Benefit tidak ditemukan.", 404);
    await db.benefit.delete({ where: { id } });
    void logAudit(req, { action: "BENEFIT_DELETE", entity: "Benefit", entityId: id, detail: benefit.title });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal menghapus benefit.", 500);
  }
}
