import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * R-029 v14.1 — PUT ubah merchant mitra & DELETE hapus merchant
 * (tebusan lama ikut terhapus via cascade).
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const existing = await db.merchantPartner.findUnique({ where: { id } });
    if (!existing) return fail("Merchant tidak ditemukan.", 404);

    const name = String(body.name ?? existing.name).trim();
    if (name.length < 3) return fail("Nama merchant minimal 3 karakter.");
    const discountText = String(body.discountText ?? existing.discountText).trim();
    if (discountText.length < 3) return fail("Uraian diskon wajib diisi.");
    const category = ["RITEL", "HOTEL", "TRANSPORTASI", "PAKAIAN", "ELEKTRONIK", "KULINER", "UMUM"].includes(String(body.category))
      ? String(body.category)
      : existing.category;
    const minTier = ["KLASIK", "VERIFIED", "PLATINUM"].includes(String(body.minTier)) ? String(body.minTier) : existing.minTier;
    const validUntil = body.validUntil ? new Date(String(body.validUntil)) : body.validUntil === null ? null : existing.validUntil;
    if (validUntil && isNaN(new Date(validUntil).getTime())) return fail("Tanggal berlaku tidak valid.");

    const updated = await db.merchantPartner.update({
      where: { id },
      data: {
        name,
        discountText,
        category,
        minTier,
        validUntil,
        city: String(body.city ?? existing.city).trim().slice(0, 80),
        address: String(body.address ?? existing.address).trim().slice(0, 300),
        phone: String(body.phone ?? existing.phone).trim().slice(0, 30),
        active: typeof body.active === "boolean" ? body.active : existing.active,
        description: String(body.description ?? existing.description).slice(0, 500),
      },
    });
    await logAudit(req, { action: "UPDATE", entity: "MerchantPartner", entityId: id, detail: `${name} → ${updated.active ? "aktif" : "nonaktif"}` });
    return ok(updated);
  } catch {
    return fail("Gagal memperbarui merchant.", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const existing = await db.merchantPartner.findUnique({ where: { id } });
    if (!existing) return fail("Merchant tidak ditemukan.", 404);
    await db.merchantPartner.delete({ where: { id } });
    await logAudit(req, { action: "DELETE", entity: "MerchantPartner", entityId: id, detail: existing.name });
    return ok({ deleted: id });
  } catch {
    return fail("Gagal menghapus merchant.", 500);
  }
}
