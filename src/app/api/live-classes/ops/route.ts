import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * R-024 + R-026 v14.1 — operasi kelas live di sisi panitia/mentor.
 * GET  `?classId=` (admin/mentor) : daftar murid terdaftar per kelas +
 *      ringkasan kehadiran. Tanpa classId: ringkasan seluruh kelas.
 * PATCH `{ id, attended?, mentorFeedback? }` (admin/mentor):
 *      tandai kehadiran / beri umpan balik per murid.
 */
export async function GET(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const classId = req.nextUrl.searchParams.get("classId");
    if (!classId) return fail("classId wajib diisi.");
    const rows = await db.liveClassRegistration.findMany({
      where: { classId },
      orderBy: { createdAt: "asc" },
    });
    const attended = rows.filter((r) => r.attended).length;
    return ok({
      registrations: rows,
      summary: { total: rows.length, attended, absent: rows.length - attended },
    });
  } catch {
    return fail("Gagal memuat pendaftar kelas.", 500);
  }
}

export async function PATCH(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.id !== "string") return fail("Data tidak valid.");
    const id = body.id;
    const data: { attended?: boolean; mentorFeedback?: string | null } = {};
    if (typeof body.attended === "boolean") data.attended = body.attended;
    if (typeof body.mentorFeedback === "string") {
      const fb = body.mentorFeedback.trim().slice(0, 500);
      data.mentorFeedback = fb || null;
    }
    if (Object.keys(data).length === 0) return fail("Tidak ada perubahan yang dikirim.");
    const existing = await db.liveClassRegistration.findUnique({ where: { id } });
    if (!existing) return fail("Pendaftaran tidak ditemukan.", 404);
    const updated = await db.liveClassRegistration.update({ where: { id }, data });
    await logAudit(req, {
      action: "UPDATE",
      entity: "LiveClassRegistration",
      entityId: id,
      detail: `Kehadiran: ${updated.attended ? "hadir" : "tidak hadir"}${updated.mentorFeedback ? ` · umpan balik: ${updated.mentorFeedback.slice(0, 60)}` : ""}`,
    });
    return ok(updated);
  } catch {
    return fail("Gagal memperbarui murid.", 500);
  }
}
