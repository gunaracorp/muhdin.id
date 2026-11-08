import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";

/**
 * v11 — Verifikasi publik sertifikat digital (target QR sertifikat).
 * GET /api/certificates/verify?code=SERT-2026-12340001
 */
export async function GET(req: NextRequest) {
  if (!rateLimit(req, "cert-verify", 30, 60_000)) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const raw = new URL(req.url).searchParams.get("code") || "";
    const code = raw.trim().toUpperCase();
    if (!/^SERT-\d{4}-\d{8}$/.test(code)) return fail("Format kode sertifikat tidak valid.", 400);

    const cert = await db.certificate.findUnique({ where: { code } });
    if (!cert) return fail("Sertifikat tidak ditemukan / tidak terdaftar.", 404);

    await db.certificate.update({
      where: { id: cert.id },
      data: { verificationCount: { increment: 1 }, lastVerifiedAt: new Date() },
    });

    // courseTitle snapshot berbentuk JSON trilingual — kirim apa adanya,
    // client memilih bahasa.
    let courseTitle: string | Record<string, string> = cert.courseTitle;
    try {
      courseTitle = JSON.parse(cert.courseTitle) as Record<string, string>;
    } catch {
      /* biarkan string mentah */
    }

    return ok({
      code: cert.code,
      holderName: cert.holderName,
      courseSlug: cert.courseSlug,
      courseTitle,
      score: cert.score,
      issuedAt: cert.issuedAt,
      verificationCount: cert.verificationCount,
    });
  } catch {
    return fail("Gagal memverifikasi sertifikat.", 500);
  }
}
