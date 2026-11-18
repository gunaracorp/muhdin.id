import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * R-027 v14.1 «AKADEMI & MITRA» — Kurikulum Builder (drag-and-drop di CMS).
 * GET `?courseId=` : silabus kursus (array modul terurut).
 * PUT  { courseId, syllabus } : simpan urutan atomik (replace-all).
 * Struktur item: { title, type: MODUL|KUIS|SERTIFIKASI, desc }
 */
export async function GET(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const courseId = req.nextUrl.searchParams.get("courseId") ?? "";
    if (!courseId) return fail("courseId wajib diisi.");
    const course = await db.academyCourse.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, syllabus: true },
    });
    if (!course) return fail("Kursus tidak ditemukan.", 404);
    let syllabus: { title: string; type: string; desc: string }[] = [];
    try {
      const parsed = JSON.parse(course.syllabus);
      if (Array.isArray(parsed)) syllabus = parsed as typeof syllabus;
    } catch {
      syllabus = [];
    }
    return ok({ course: { id: course.id, title: course.title }, syllabus });
  } catch {
    return fail("Gagal memuat silabus.", 500);
  }
}

export async function PUT(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const courseId = String(body.courseId || "");
    if (!courseId) return fail("courseId wajib diisi.");
    const course = await db.academyCourse.findUnique({ where: { id: courseId } });
    if (!course) return fail("Kursus tidak ditemukan.", 404);

    const items = Array.isArray(body.syllabus) ? body.syllabus : [];
    if (items.length > 60) return fail("Maksimal 60 entri silabus per kursus.");
    const cleaned = items.map((raw: { title?: unknown; type?: unknown; desc?: unknown }) => {
      const title = String(raw.title || "").trim().slice(0, 150);
      const type = ["MODUL", "KUIS", "SERTIFIKASI"].includes(String(raw.type)) ? String(raw.type) : "MODUL";
      const desc = String(raw.desc || "").trim().slice(0, 300);
      return { title, type, desc };
    });
    if (cleaned.some((c: { title: string }) => !c.title)) {
      return fail("Setiap entri silabus wajib punya judul.");
    }

    const updated = await db.academyCourse.update({
      where: { id: courseId },
      data: { syllabus: JSON.stringify(cleaned), modules: cleaned.filter((c: { type: string }) => c.type === "MODUL").length || course.modules },
    });
    await logAudit(req, {
      action: "UPDATE",
      entity: "AcademyCourse",
      entityId: courseId,
      detail: `Silabus ${updated.title} — ${cleaned.length} entri tersimpan`,
    });
    return ok({ saved: true, count: cleaned.length });
  } catch {
    return fail("Gagal menyimpan silabus.", 500);
  }
}
