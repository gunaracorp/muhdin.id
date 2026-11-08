import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { notifyAcademyEnroll } from "@/lib/whatsapp"; // v11.1 — notifikasi WA
import { notifyEmailAcademyEnroll, courseTitleTrilingual } from "@/lib/email"; // v11.1 — notifikasi email

/**
 * v11 — Pendaftaran peserta kursus Academy.
 * POST (publik, rate-limited) {courseSlug, name, email}
 * GET  ?email=&courseSlug= (publik) → lanjutkan quiz yang belum selesai
 * GET  ?admin=1 (admin)  → daftar pendaftaran terbaru
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(req, "academy-enroll", 10, 60_000)) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json();
    const courseSlug = String(body.courseSlug || "").trim();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    if (!courseSlug || !name || !email) return fail("Nama, email, dan kursus wajib diisi.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Format email tidak valid.");

    const course = await db.academyCourse.findUnique({ where: { slug: courseSlug } });
    if (!course || !course.active) return fail("Kursus tidak tersedia.", 404);

    // Idempoten: email + kursus yang sama masih ONGOING → pakai ulang.
    const existing = await db.academyEnrollment.findFirst({
      where: { courseSlug, email, status: "ONGOING" },
    });
    if (existing) return ok({ enrollment: existing, resumed: true });

    const enrollment = await db.academyEnrollment.create({
      data: { courseSlug, name, email },
    });
    // v11.1 — teruskan ke sekretariat (email + WA), gagal-aman fire-and-forget.
    const title = courseTitleTrilingual(course.title);
    void notifyAcademyEnroll({ name, email, courseTitle: title });
    void notifyEmailAcademyEnroll({ courseTitle: title, name, email, startedAt: enrollment.startedAt, refId: enrollment.id });
    return ok({ enrollment, resumed: false });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal mendaftar kursus.", 500);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  try {
    if (searchParams.get("admin")) {
      const { guardRole } = await import("@/lib/api-helpers");
      if (await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"])) return fail("Unauthorized", 401);
      const rows = await db.academyEnrollment.findMany({
        orderBy: { startedAt: "desc" },
        take: 50,
        include: { course: { select: { slug: true } }, certificate: { select: { code: true } } },
      });
      return ok({ rows });
    }
    const email = (searchParams.get("email") || "").trim().toLowerCase();
    const courseSlug = (searchParams.get("courseSlug") || "").trim();
    if (!email || !courseSlug) return fail("email & courseSlug wajib diisi.");
    const enrollment = await db.academyEnrollment.findFirst({
      where: { email, courseSlug },
      orderBy: { startedAt: "desc" },
      include: { course: true, certificate: true },
    });
    if (!enrollment) return fail("Pendaftaran tidak ditemukan.", 404);
    // Soal quiz hanya diberikan kepada peserta terdaftar (semi-privat:
    // butuh pasangan email + kursus yang cocok) — quiz publik tetap tertutup.
    let quiz: unknown[] = [];
    try {
      quiz = JSON.parse(enrollment.course.quiz || "[]") as unknown[];
    } catch {
      quiz = [];
    }
    return ok({
      enrollment,
      quiz,
      status: enrollment.status,
      score: enrollment.score,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memuat pendaftaran.", 500);
  }
}
