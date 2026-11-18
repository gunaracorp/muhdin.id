/**
 * R-034 v15.0.0 «GOD MODE» — Evaluasi instruktur berkala.
 * POST : murid kelas DONE memberi nilai 1–5 + catatan tertutup — satu
 *        evaluasi per peserta per kelas (unique classId+phone), Zod + rate-limit.
 * GET  ?classId= : ringkasan publik (rata-rata & jumlah; komentar tanpa identitas).
 * GET  ?all=1    : CMS — daftar evaluasi + agregat per kelas (guardAdmin).
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { safeBody, InstructorReviewSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  try {
    const all = req.nextUrl.searchParams.get("all") === "1";
    if (all) {
      const { requireAdmin } = await import("@/lib/auth");
      const user = await requireAdmin();
      if (!user) return fail("Tidak diizinkan — silakan login sebagai admin.", 401);
      const rows = await db.instructorReview.findMany({ orderBy: { createdAt: "desc" } });
      const grouped = new Map<string, { n: number; sum: number }>();
      for (const r of rows) {
        const g = grouped.get(r.classId) ?? { n: 0, sum: 0 };
        g.n += 1;
        g.sum += r.rating;
        grouped.set(r.classId, g);
      }
      return ok({
        total: rows.length,
        rows,
        summary: [...grouped.entries()].map(([classId, g]) => ({
          classId,
          count: g.n,
          avg: Math.round((g.sum / g.n) * 10) / 10,
        })),
      });
    }

    const classId = req.nextUrl.searchParams.get("classId")?.trim() ?? "";
    if (!classId) return fail("Parameter classId wajib diisi.");
    const rows = await db.instructorReview.findMany({ where: { classId }, orderBy: { createdAt: "desc" } });
    const n = rows.length;
    const avg = n > 0 ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / n) * 10) / 10 : null;
    return ok({
      count: n,
      avg,
      // Komentar tampil tanpa identitas — umpan balik tertutup.
      comments: rows.filter((r) => r.comment).slice(0, 10).map((r) => ({ rating: r.rating, comment: r.comment })),
    });
  } catch {
    return fail("Gagal memuat evaluasi.", 500);
  }
}

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "instruktur-review", 5, 60_000)) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const parsed = safeBody(InstructorReviewSchema, body);
    if (!parsed.ok) return fail(parsed.error);

    const kelas = await db.liveClass.findUnique({ where: { id: parsed.data.classId } });
    if (!kelas) return fail("Kelas tidak ditemukan.", 404);
    if (kelas.status !== "DONE") {
      return fail("Evaluasi dibuka setelah kelas selesai dilaksanakan.");
    }
    const registered = await db.liveClassRegistration.findUnique({
      where: { classId_phone: { classId: kelas.id, phone: parsed.data.phone } },
    });
    if (!registered) {
      return fail("Evaluasi hanya untuk peserta yang terdaftar di kelas ini.");
    }
    const dup = await db.instructorReview.findUnique({
      where: { classId_phone: { classId: kelas.id, phone: parsed.data.phone } },
    });
    if (dup) return fail("Anda sudah memberi evaluasi untuk kelas ini. Terima kasih!");

    const review = await db.instructorReview.create({
      data: {
        classId: kelas.id,
        classTitle: kelas.title,
        phone: parsed.data.phone,
        rating: parsed.data.rating,
        comment: parsed.data.comment || null,
      },
    });
    void logAudit(req, {
      action: "CREATE",
      entity: "InstructorReview",
      entityId: review.id,
      detail: `evaluasi ${parsed.data.rating}/5 untuk "${kelas.title}"`,
    });
    return ok(
      { message: "Terima kasih! Evaluasi Anda membantu menjaga mutu pengajar." },
      201,
    );
  } catch {
    return fail("Gagal mengirim evaluasi.", 500);
  }
}
