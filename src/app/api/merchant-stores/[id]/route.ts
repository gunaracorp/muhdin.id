/**
 * R-046 v15.0.0 — Kelola lapak mitra (CMS).
 * PUT    : ubah status (ACTIVE/SUSPENDED/PENDING), catatan, data inti.
 * DELETE : hapus lapak (produk ikut terhapus, cascade).
 * POST   : tambah produk lapak { name, price, unit, desc }.
 * DELETE dengan ?productId= : hapus produk tunggal.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardRole } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { safeBody, MerchantProductSchema } from "@/lib/validation";
import { bustCache } from "@/lib/hot-cache";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const status = String(body.status || "").toUpperCase();
    if (!["PENDING", "ACTIVE", "SUSPENDED"].includes(status)) {
      return fail("Status lapak tidak dikenal.");
    }
    const store = await db.merchantStore.update({
      where: { id },
      data: {
        status,
        note: body.note ? String(body.note) : null,
        nib: body.nib !== undefined ? String(body.nib || "") || null : undefined,
        category: body.category ? String(body.category) : undefined,
      },
    });
    bustCache("lapak:");
    void logAudit(req, {
      action: "UPDATE",
      entity: "MerchantStore",
      entityId: id,
      detail: `lapak "${store.storeName}" → ${status}`,
    });
    return ok({ message: `Lapak "${store.storeName}" kini berstatus ${status}.` });
  } catch {
    return fail("Gagal memperbarui lapak.", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const productId = req.nextUrl.searchParams.get("productId");
    if (productId) {
      await db.merchantProduct.delete({ where: { id: productId } });
      bustCache("lapak:");
      return ok({ message: "Produk dihapus dari lapak." });
    }
    const store = await db.merchantStore.delete({ where: { id } });
    bustCache("lapak:");
    void logAudit(req, {
      action: "DELETE",
      entity: "MerchantStore",
      entityId: id,
      detail: `lapak "${store.storeName}" dihapus`,
    });
    return ok({ message: `Lapak "${store.storeName}" dihapus.` });
  } catch {
    return fail("Gagal menghapus lapak/produk.", 500);
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const parsed = safeBody(MerchantProductSchema, body);
    if (!parsed.ok) return fail(parsed.error);
    const store = await db.merchantStore.findUnique({ where: { id } });
    if (!store) return fail("Lapak tidak ditemukan.", 404);
    const product = await db.merchantProduct.create({
      data: {
        storeId: id,
        name: parsed.data.name,
        price: parsed.data.price,
        unit: parsed.data.unit || "paket",
        desc: parsed.data.desc || null,
      },
    });
    bustCache("lapak:");
    void logAudit(req, {
      action: "CREATE",
      entity: "MerchantProduct",
      entityId: product.id,
      detail: `produk "${product.name}" di lapak "${store.storeName}"`,
    });
    return ok({ message: `Produk "${product.name}" ditambahkan.`, id: product.id }, 201);
  } catch {
    return fail("Gagal menambah produk.", 500);
  }
}
