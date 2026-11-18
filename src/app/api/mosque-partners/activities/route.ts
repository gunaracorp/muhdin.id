import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * R-090 v14.1 — Log aktivitas kemitraan (CMS): POST catat kegiatan
 * (kajian/tabarruj/pelatihan/umrah bersama), DELETE hapus.
 */
export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const partnerId = String(body.partnerId || "");
    if (!partnerId) return fail("Mitra wajib dipilih.");
    const partner = await db.mosquePartner.findUnique({ where: { id: partnerId } });
    if (!partner) return fail("Mitra tidak ditemukan.", 404);
    const title = String(body.title || "").trim();
    if (title.length < 3) return fail("Judul aktivitas minimal 3 karakter.");
    const date = new Date(String(body.date || ""));
    if (isNaN(date.getTime())) return fail("Tanggal aktivitas tidak valid.");
    const attendance = Math.max(0, Math.min(100_000, Math.floor(Number(body.attendance ?? 0))));
    const type = ["KAJIAN", "TABARRUJ", "PELATIHAN", "UMRAH_BERSAMA"].includes(String(body.type)) ? String(body.type) : "KAJIAN";

    const activity = await db.partnerActivity.create({
      data: { partnerId, type, title, date, attendance, notes: String(body.notes || "").slice(0, 300) },
    });
    await logAudit(req, {
      action: "CREATE",
      entity: "PartnerActivity",
      entityId: activity.id,
      detail: `${partner.name}: ${title} (${type}, ${attendance} peserta)`,
    });
    return ok(activity, 201);
  } catch {
    return fail("Gagal mencatat aktivitas.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const id = req.nextUrl.searchParams.get("id") ?? "";
    if (!id) return fail("id aktivitas wajib diisi.");
    const existing = await db.partnerActivity.findUnique({ where: { id } });
    if (!existing) return fail("Aktivitas tidak ditemukan.", 404);
    await db.partnerActivity.delete({ where: { id } });
    await logAudit(req, { action: "DELETE", entity: "PartnerActivity", entityId: id, detail: existing.title });
    return ok({ deleted: id });
  } catch {
    return fail("Gagal menghapus aktivitas.", 500);
  }
}
