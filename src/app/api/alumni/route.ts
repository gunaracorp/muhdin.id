/**
 * R-033 v15.0.0 «GOD MODE» — Jaringan Alumni Akademi.
 * GET publik: direktori alumni terverifikasi dari sertifikat yang benar-benar
 * diterbitkan (Certificate + MuthawwifCert) — nama pemegang, program, tahun,
 * tingkat — untuk rekomendasi kerja dan mentoring silang.
 * Filter ?q= (nama/program), ?tahun=, ?tingkat=.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { cached } from "@/lib/hot-cache";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
    const tahun = req.nextUrl.searchParams.get("tahun")?.trim() ?? "";
    const tingkat = req.nextUrl.searchParams.get("tingkat")?.trim().toUpperCase() ?? "";

    const alumni = await cached("alumni:list", 60_000, async () => {
      // 1) Alumni akademi — pemegang sertifikat kursus.
      const certs = await db.certificate.findMany({
        orderBy: { issuedAt: "desc" },
        select: { code: true, holderName: true, courseSlug: true, courseTitle: true, score: true, issuedAt: true },
      });
      // 2) Alumni jalur sertifikasi muthawwif (DASAR/LANJUTAN/MENTOR) —
      //    hanya yang benar-benar LULUS (PASSED dengan nomor sertifikat).
      const muth = await db.muthawwifCert.findMany({
        where: { status: "PASSED", certNo: { not: null } },
        orderBy: { issuedAt: "desc" },
        select: {
          certNo: true,
          level: true,
          examScore: true,
          issuedAt: true,
          muthowif: { select: { fullName: true } },
        },
      });

      const rows: {
        kind: "AKADEMI" | "MUTHAWWIF";
        ref: string;
        name: string;
        program: string;
        tingkat: string;
        score: number;
        year: number;
        issuedAt: string;
      }[] = [
        ...certs.map((c) => ({
          kind: "AKADEMI" as const,
          ref: c.code,
          name: c.holderName,
          program: c.courseTitle,
          tingkat: "AKADEMI",
          score: c.score,
          year: c.issuedAt.getFullYear(),
          issuedAt: c.issuedAt.toISOString(),
        })),
        ...muth.map((m) => ({
          kind: "MUTHAWWIF" as const,
          ref: m.certNo ?? "",
          name: m.muthowif.fullName,
          program: "Sertifikasi Muthawwif",
          tingkat: m.level,
          score: m.examScore,
          year: (m.issuedAt ?? new Date()).getFullYear(),
          issuedAt: (m.issuedAt ?? new Date()).toISOString(),
        })),
      ];
      return rows;
    });

    let rows = alumni;
    if (q) {
      rows = rows.filter(
        (r) => r.name.toLowerCase().includes(q) || r.program.toLowerCase().includes(q),
      );
    }
    if (tahun) rows = rows.filter((r) => String(r.year) === tahun);
    if (tingkat) rows = rows.filter((r) => r.tingkat === tingkat);

    const years = [...new Set(alumni.map((r) => r.year))].sort((a, b) => b - a);
    return ok({ total: rows.length, years, alumni: rows.slice(0, 200) });
  } catch {
    return fail("Gagal memuat direktori alumni.", 500);
  }
}
