import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * R-043 v14.1 — PUT ubah aturan harga & DELETE hapus aturan.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const existing = await db.priceRule.findUnique({ where: { id } });
    if (!existing) return fail("Aturan harga tidak ditemukan.", 404);

    const adjustType = ["PERCENT", "FIXED"].includes(String(body.adjustType)) ? String(body.adjustType) : existing.adjustType;
    const value = Math.floor(Number(body.value ?? existing.value));
    if (adjustType === "PERCENT" && (value < 1 || value > 100)) return fail("Potongan persen harus 1–100.");
    if (adjustType === "FIXED" && value < 1) return fail("Potongan rupiah harus lebih dari 0.");
    const kind = ["SEASONAL", "EARLYBIRD"].includes(String(body.kind)) ? String(body.kind) : existing.kind;

    let monthFrom = existing.monthFrom;
    let monthTo = existing.monthTo;
    let deadline = existing.deadline;
    if (kind === "SEASONAL") {
      monthFrom = Math.floor(Number(body.monthFrom ?? existing.monthFrom ?? 0));
      monthTo = Math.floor(Number(body.monthTo ?? existing.monthTo ?? 0));
      if (monthFrom < 1 || monthFrom > 12 || monthTo < 1 || monthTo > 12) return fail("Bulan harus 1–12.");
      deadline = null;
    } else {
      const dl = new Date(String(body.deadline ?? existing.deadline));
      if (isNaN(dl.getTime())) return fail("Deadline early bird tidak valid.");
      deadline = dl;
      monthFrom = null;
      monthTo = null;
    }

    const updated = await db.priceRule.update({
      where: { id },
      data: {
        kind,
        adjustType,
        value,
        monthFrom,
        monthTo,
        deadline,
        label: String(body.label ?? existing.label).slice(0, 100),
        active: typeof body.active === "boolean" ? body.active : existing.active,
      },
    });
    await logAudit(req, { action: "UPDATE", entity: "PriceRule", entityId: id, detail: `${kind} ${value} → ${updated.active ? "aktif" : "nonaktif"}` });
    return ok(updated);
  } catch {
    return fail("Gagal memperbarui aturan harga.", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const existing = await db.priceRule.findUnique({ where: { id } });
    if (!existing) return fail("Aturan harga tidak ditemukan.", 404);
    await db.priceRule.delete({ where: { id } });
    await logAudit(req, { action: "DELETE", entity: "PriceRule", entityId: id, detail: `${existing.kind} ${existing.value}` });
    return ok({ deleted: id });
  } catch {
    return fail("Gagal menghapus aturan harga.", 500);
  }
}
