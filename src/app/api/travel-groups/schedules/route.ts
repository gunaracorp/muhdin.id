import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * R-012 (v13.3) — Jadwal kumpul rombongan (CMS).
 * POST   admin [SUPER_ADMIN, ADMIN, EDITOR]: tambah jadwal { groupId, title, location, startsAt, note? }.
 * DELETE admin ?id=: hapus jadwal.
 */

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return fail("Data tidak valid.");

    const groupId = String(body.groupId || "").trim();
    if (!groupId) return fail("Grup wajib dipilih.");
    const group = await db.travelGroup.findUnique({ where: { id: groupId } });
    if (!group) return fail("Grup tidak ditemukan.", 404);

    const title = String(body.title || "").trim();
    if (title.length < 3) return fail("Judul jadwal minimal 3 karakter.");
    const startsAt = new Date(String(body.startsAt || ""));
    if (Number.isNaN(startsAt.getTime())) return fail("Waktu kumpul tidak valid.");

    const row = await db.groupSchedule.create({
      data: {
        groupId,
        title,
        location: String(body.location || "").trim(),
        startsAt,
        note: body.note ? String(body.note) : null,
      },
    });
    void logAudit(req, { action: "CREATE", entity: "GroupSchedule", entityId: row.id, detail: `${group.name}: ${title}` });
    return ok(row, 201);
  } catch {
    return fail("Gagal menambah jadwal kumpul.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const id = req.nextUrl.searchParams.get("id")?.trim();
    if (!id) return fail("Parameter id wajib.");
    const row = await db.groupSchedule.delete({ where: { id } });
    void logAudit(req, { action: "DELETE", entity: "GroupSchedule", entityId: id, detail: row.title });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus jadwal kumpul.", 500);
  }
}
