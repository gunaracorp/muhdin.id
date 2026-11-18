import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * R-024 v14.1 — PUT ubah kelas live & DELETE hapus kelas (murid ikut
 * terhapus via cascade; forum per-kelas melepas kaitan via SetNull).
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const existing = await db.liveClass.findUnique({ where: { id } });
    if (!existing) return fail("Kelas tidak ditemukan.", 404);

    const title = String(body.title ?? existing.title).trim();
    if (title.length < 3) return fail("Judul kelas minimal 3 karakter.");
    const instructor = String(body.instructor ?? existing.instructor).trim();
    if (instructor.length < 2) return fail("Nama pengajar minimal 2 karakter.");
    const startsAt = new Date(String(body.startsAt ?? existing.startsAt));
    if (isNaN(startsAt.getTime())) return fail("Waktu kelas tidak valid.");
    const durationMin = Math.max(15, Math.min(600, Math.floor(Number(body.durationMin ?? existing.durationMin))));
    const capacity = Math.max(1, Math.min(5000, Math.floor(Number(body.capacity ?? existing.capacity))));
    const platform = ["ZOOM", "MEET", "OTHER"].includes(String(body.platform)) ? String(body.platform) : existing.platform;
    const level = ["UMUM", "DASAR", "LANJUTAN", "MENTOR"].includes(String(body.level)) ? String(body.level) : existing.level;
    const status = ["SCHEDULED", "LIVE", "DONE", "CANCELLED"].includes(String(body.status)) ? String(body.status) : existing.status;
    const joinUrl = String(body.joinUrl ?? existing.joinUrl).trim().slice(0, 300);
    const recordingUrl = body.recordingUrl ? String(body.recordingUrl).trim().slice(0, 300) : existing.recordingUrl;
    const description = String(body.description ?? existing.description).slice(0, 2000);

    const updated = await db.liveClass.update({
      where: { id },
      data: { title, instructor, startsAt, durationMin, capacity, platform, level, status, joinUrl, recordingUrl, description },
    });
    await logAudit(req, { action: "UPDATE", entity: "LiveClass", entityId: id, detail: `${title} → ${status}` });
    return ok(updated);
  } catch {
    return fail("Gagal memperbarui kelas.", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const existing = await db.liveClass.findUnique({ where: { id } });
    if (!existing) return fail("Kelas tidak ditemukan.", 404);
    await db.liveClass.delete({ where: { id } });
    await logAudit(req, { action: "DELETE", entity: "LiveClass", entityId: id, detail: existing.title });
    return ok({ deleted: id });
  } catch {
    return fail("Gagal menghapus kelas.", 500);
  }
}
