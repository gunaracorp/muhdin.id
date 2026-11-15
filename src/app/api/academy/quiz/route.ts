import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { logAudit } from "@/lib/audit";
import { awardPoints, generateSerial } from "@/lib/membership";
import { notifyCertificate } from "@/lib/whatsapp"; // v11.1 — notifikasi WA
import { notifyEmailCertificate, courseTitleTrilingual } from "@/lib/email"; // v11.1 — notifikasi email

/**
 * v11 — Submit jawaban quiz Academy → nilai → sertifikat otomatis.
 * POST {enrollmentId, answers: number[]}
 * Lulus (score ≥ passScore): status COMPLETED + Certificate diterbitkan +
 * poin diberikan bila email peserta = email member pemegang KTA aktif.
 */
interface QuizItem {
  q: string;
  options: string[];
  answer: number;
}

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "academy-quiz", 15, 60_000)) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json();
    const enrollmentId = String(body.enrollmentId || "");
    const answers = Array.isArray(body.answers) ? (body.answers as number[]) : [];
    const enrollment = await db.academyEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { course: true, certificate: true },
    });
    if (!enrollment) return fail("Pendaftaran tidak ditemukan.", 404);
    if (enrollment.status === "COMPLETED" && enrollment.certificate) {
      return ok({ score: enrollment.score, passed: true, certificate: enrollment.certificate, alreadyDone: true });
    }

    const quiz = JSON.parse(enrollment.course.quiz || "[]") as QuizItem[];
    if (!quiz.length) return fail("Kursus ini belum memiliki quiz.");
    if (answers.length !== quiz.length) return fail("Jawaban belum lengkap.");

    let correct = 0;
    quiz.forEach((item, i) => {
      if (Number(answers[i]) === item.answer) correct += 1;
    });
    const score = Math.round((correct / quiz.length) * 100);
    const passed = score >= enrollment.course.passScore;

    if (!passed) {
      await db.academyEnrollment.update({
        where: { id: enrollmentId },
        data: { score, status: "FAILED" },
      });
      return ok({ score, passed, correct, total: quiz.length });
    }

    // Lulus — terbitkan sertifikat (idempoten bila sudah ada).
    let certificate = enrollment.certificate;
    if (!certificate) {
      const code = await generateSerial("SERT");
      certificate = await db.certificate.create({
        data: {
          code,
          holderName: enrollment.name,
          courseSlug: enrollment.courseSlug,
          courseTitle: enrollment.course.title, // JSON trilingual (snapshot)
          score,
        },
      });
      await db.academyEnrollment.update({
        where: { id: enrollmentId },
        data: { score, status: "COMPLETED", completedAt: new Date(), certificateId: certificate.id },
      });

      // Poin → bila email peserta terdaftar sebagai email member pemegang KTA aktif.
      // Prisma+SQLite tidak mendukung mode "insensitive" → fallback lowercase eksplisit.
      const email = (enrollment.email || "").trim();
      const member =
        (await db.member.findFirst({ where: { email }, include: { card: true } })) ??
        (email.toLowerCase() !== email
          ? await db.member.findFirst({ where: { email: email.toLowerCase() }, include: { card: true } })
          : null);
      if (member?.card && member.card.status === "ACTIVE") {
        await awardPoints(
          member.card.id,
          enrollment.course.rewardPoints,
          "ACADEMY",
          `Lulus kursus ${enrollment.courseSlug} (skor ${score})`
        );
      }
      void logAudit(req, {
        action: "CERTIFICATE_ISSUED",
        entity: "Certificate",
        entityId: code,
        detail: `${enrollment.name} — ${enrollment.courseSlug} (skor ${score})`,
      });
      // v11.1 — teruskan kelulusan + sertifikat ke sekretariat (email + WA).
      void notifyCertificate({
        name: enrollment.name,
        courseTitle: courseTitleTrilingual(enrollment.course.title),
        score,
        certCode: certificate.code,
      });
      void notifyEmailCertificate({
        courseTitle: courseTitleTrilingual(enrollment.course.title),
        name: enrollment.name,
        email: enrollment.email,
        score,
        certCode: certificate.code,
        issuedAt: new Date(),
        refId: certificate.id,
      });
    }

    return ok({ score, passed, correct, total: quiz.length, certificate });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memproses quiz.", 500);
  }
}
