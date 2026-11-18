import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * R-024 v14.1 «AKADEMI & MITRA» — Kelas Live & Webinar Terjadwal.
 * GET  publik  : kelas mendatang/berlangsung (tanpa joinUrl & rekaman).
 *      `?all=1` + admin: seluruh kelas untuk CMS/Dashboard Mentor.
 * POST admin   : buat kelas baru (CrudManager CMS). Pendaftaran publik
 *      memakai POST /api/live-classes/register (terpisah, rate-limited).
 */
export async function GET(req: NextRequest) {
  try {
    const wantAll = req.nextUrl.searchParams.get("all") === "1";
    if (wantAll) {
      const denied = await guardAdmin();
      if (denied) return denied;
      const all = await db.liveClass.findMany({
        orderBy: { startsAt: "asc" },
        include: { _count: { select: { registrations: true, forumThreads: true } } },
      });
      // Array polos — dipakai langsung CrudManager & panel mentor.
      return ok(all);
    }
    // R-034 v15.0.0 — kelas DONE ikut tampil (di urutan bawah) supaya peserta
    // dapat mengisi evaluasi instruktur dan mengakses rekaman.
    const upcoming = await db.liveClass.findMany({
      where: { status: { in: ["SCHEDULED", "LIVE", "DONE"] } },
      orderBy: { startsAt: "asc" },
      include: { _count: { select: { registrations: true } } },
    });
    // Bentuk publik: tanpa joinUrl & recording (hanya untuk pendaftar).
    return ok(
      upcoming.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        instructor: c.instructor,
        level: c.level,
        startsAt: c.startsAt,
        durationMin: c.durationMin,
        platform: c.platform,
        capacity: c.capacity,
        registered: c._count.registrations,
        status: c.status,
      }))
    );
  } catch {
    return fail("Gagal memuat kelas live.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const title = String(body.title || "").trim();
    if (title.length < 3) return fail("Judul kelas minimal 3 karakter.");
    const instructor = String(body.instructor || "").trim();
    if (instructor.length < 2) return fail("Nama pengajar minimal 2 karakter.");
    const startsAt = new Date(String(body.startsAt || ""));
    if (isNaN(startsAt.getTime())) return fail("Waktu kelas tidak valid (YYYY-MM-DD HH:mm).");
    const durationMin = Math.max(15, Math.min(600, Math.floor(Number(body.durationMin ?? 90))));
    const capacity = Math.max(1, Math.min(5000, Math.floor(Number(body.capacity ?? 100))));
    const platform = ["ZOOM", "MEET", "OTHER"].includes(String(body.platform)) ? String(body.platform) : "ZOOM";
    const level = ["UMUM", "DASAR", "LANJUTAN", "MENTOR"].includes(String(body.level)) ? String(body.level) : "UMUM";
    const status = ["SCHEDULED", "LIVE", "DONE", "CANCELLED"].includes(String(body.status)) ? String(body.status) : "SCHEDULED";
    const joinUrl = String(body.joinUrl || "").trim().slice(0, 300);
    const description = String(body.description || "").slice(0, 2000);

    const kelas = await db.liveClass.create({
      data: { title, instructor, startsAt, durationMin, capacity, platform, level, status, joinUrl, description },
    });
    await logAudit(req, { action: "CREATE", entity: "LiveClass", entityId: kelas.id, detail: `${title} (${instructor})` });
    return ok(kelas, 201);
  } catch {
    return fail("Gagal membuat kelas live.", 500);
  }
}
