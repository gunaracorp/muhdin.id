import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { normalizeCode } from "@/lib/coupon";
import { logAudit } from "@/lib/audit";

/**
 * R-042 v14.0 — PUT ubah kupon (kode juga dinormalisasi + cek duplikat)
 * dan DELETE hapus kupon (tebusan lama ikut terhapus via onDelete: Cascade).
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing) return fail("Kupon tidak ditemukan.", 404);

    const code = normalizeCode(String(body.code || existing.code));
    if (!/^[A-Z0-9_-]{3,40}$/.test(code)) {
      return fail("Kode 3–40 karakter (huruf, angka, tanda hubung/garis bawah), tanpa spasi.");
    }
    const dup = await db.coupon.findFirst({ where: { code, id: { not: id } } });
    if (dup) return fail(`Kode ${code} sudah dipakai kupon lain.`);

    const discountType = body.discountType === "FIXED" ? "FIXED" : "PERCENT";
    const value = Math.floor(Number(body.value ?? existing.value));
    if (discountType === "PERCENT" && (value < 1 || value > 100)) {
      return fail("Diskon persen harus 1–100.");
    }
    if (discountType === "FIXED" && value < 1) {
      return fail("Diskon rupiah tetap harus lebih dari 0.");
    }
    const startsAt = body.startsAt ? new Date(String(body.startsAt)) : null;
    const endsAt = body.endsAt ? new Date(String(body.endsAt)) : null;
    if (startsAt && isNaN(startsAt.getTime())) return fail("Tanggal mulai tidak valid.");
    if (endsAt && isNaN(endsAt.getTime())) return fail("Tanggal berakhir tidak valid.");
    if (startsAt && endsAt && startsAt >= endsAt) return fail("Jendela kampanye tidak wajar (mulai ≥ berakhir).");

    const coupon = await db.coupon.update({
      where: { id },
      data: {
        code,
        discountType,
        value,
        minAmount: Math.max(0, Math.floor(Number(body.minAmount ?? existing.minAmount))),
        maxDiscount:
          !body.maxDiscount || Number(body.maxDiscount) <= 0
            ? null
            : Math.max(0, Math.floor(Number(body.maxDiscount))),
        startsAt,
        endsAt,
        usageLimit:
          !body.usageLimit || Number(body.usageLimit) <= 0
            ? null
            : Math.max(1, Math.floor(Number(body.usageLimit))),
        perPhoneLimit: Math.max(0, Math.floor(Number(body.perPhoneLimit ?? existing.perPhoneLimit))),
        active: body.active !== false,
        description: String(body.description ?? existing.description).slice(0, 300),
      },
    });
    await logAudit(req, { action: "COUPON_UPDATE", entity: "Coupon", entityId: id, detail: code });
    return ok({ coupon });
  } catch {
    return fail("Gagal memperbarui kupon.", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing) return fail("Kupon tidak ditemukan.", 404);
    await db.coupon.delete({ where: { id } });
    await logAudit(req, { action: "COUPON_DELETE", entity: "Coupon", entityId: id, detail: existing.code });
    return ok({ deleted: true });
  } catch {
    return fail("Gagal menghapus kupon.", 500);
  }
}
