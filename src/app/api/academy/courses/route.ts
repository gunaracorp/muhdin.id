import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardRole } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/api-helpers";

/**
 * v11 — Manasik Academy: katalog kursus.
 * GET  (publik)        → daftar kursus aktif; judul/ringkasan JSON trilingual
 *                        diparse → {id,en,ar}; admin otomatis dapat data mentah.
 * POST/PUT/DELETE      → kelola kursus (admin).
 */
type T = Record<"id" | "en" | "ar", string>;

function parseTrilingual(raw: string, fallback: string): T {
  try {
    const o = JSON.parse(raw) as Partial<T>;
    return { id: o.id || fallback, en: o.en || o.id || fallback, ar: o.ar || o.id || fallback };
  } catch {
    return { id: fallback, en: fallback, ar: fallback };
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const admin = searchParams.get("admin") === "1";

    if (slug) {
      const course = await db.academyCourse.findUnique({
        where: { slug },
        include: { _count: { select: { enrollments: true } } },
      });
      if (!course) return fail("Kursus tidak ditemukan.", 404);
      return ok({
        course: {
          ...course,
          title: parseTrilingual(course.title, course.slug),
          summary: parseTrilingual(course.summary, ""),
          quiz: admin ? course.quiz : "[]", // soal quiz tidak dibocorkan sebelum enroll
        },
      });
    }

    const rows = await db.academyCourse.findMany({
      where: admin ? {} : { active: true },
      orderBy: { order: "asc" },
      include: {
        _count: { select: { enrollments: true } },
      },
    });
    if (admin) return ok({ rows });
    return ok({
      rows: rows.map((c) => ({
        ...c,
        quiz: "[]",
        title: parseTrilingual(c.title, c.slug),
        summary: parseTrilingual(c.summary, ""),
      })),
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memuat kursus.", 500);
  }
}

export async function POST(req: NextRequest) {
  if (await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"])) return fail("Unauthorized", 401);
  try {
    const body = await req.json();
    const slug = slugify(String(body.slug || body.titleId || "")) || `kursus-${Date.now()}`;
    const course = await db.academyCourse.create({
      data: {
        slug,
        title: String(body.title || "{}"),
        summary: String(body.summary || "{}"),
        category: String(body.category || "MANASIK"),
        level: String(body.level || "DASAR"),
        durationMin: Number(body.durationMin) || 60,
        modules: Number(body.modules) || 4,
        quiz: String(body.quiz || "[]"),
        passScore: Number(body.passScore) || 70,
        rewardPoints: Number(body.rewardPoints) || 30,
        icon: String(body.icon || "book-open"),
        color: String(body.color || "emerald"),
        order: Number(body.order) || 99,
      },
    });
    void logAudit(req, { action: "COURSE_CREATE", entity: "AcademyCourse", entityId: slug });
    return ok({ course });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal membuat kursus.", 500);
  }
}

export async function PUT(req: NextRequest) {
  if (await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"])) return fail("Unauthorized", 401);
  try {
    const body = await req.json();
    const id = String(body.id || "");
    const course = await db.academyCourse.findUnique({ where: { id } });
    if (!course) return fail("Kursus tidak ditemukan.", 404);
    const data: Record<string, unknown> = {};
    for (const k of ["title", "summary", "category", "level", "quiz", "icon", "color"]) {
      if (body[k] !== undefined) data[k] = String(body[k]);
    }
    for (const k of ["durationMin", "modules", "passScore", "rewardPoints", "order"]) {
      if (body[k] !== undefined) data[k] = Number(body[k]) || 0;
    }
    if (body.active !== undefined) data.active = Boolean(body.active);
    const updated = await db.academyCourse.update({ where: { id }, data });
    void logAudit(req, { action: "COURSE_UPDATE", entity: "AcademyCourse", entityId: course.slug });
    return ok({ course: updated });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memperbarui kursus.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  if (await guardRole(["SUPER_ADMIN", "ADMIN"])) return fail("Unauthorized", 401);
  try {
    const id = new URL(req.url).searchParams.get("id") || "";
    const course = await db.academyCourse.findUnique({ where: { id } });
    if (!course) return fail("Kursus tidak ditemukan.", 404);
    await db.academyCourse.delete({ where: { id } });
    void logAudit(req, { action: "COURSE_DELETE", entity: "AcademyCourse", entityId: course.slug });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal menghapus kursus.", 500);
  }
}
