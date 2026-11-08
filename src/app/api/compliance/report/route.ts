import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { buildScan } from "@/lib/license-engine";
import { gradeOf, riskOf } from "@/lib/compliance-engine";

/**
 * v12.1 — GOD-MODE COMPLIANCE REPORT (publik).
 * GET /api/compliance/report?id=<companyId>
 *
 * Dossier kepatuhan mendalam satu perusahaan: scan penuh 12 syarat a–l,
 * grade + risiko, RIWAYAT TREN skor (hingga 12 snapshot terakhir dari
 * ComplianceScore), dan ringkasan status. Dokumen sensitif tetap tidak
 * diungkap — hanya nomor dokumen, penerbit, dan masa berlaku.
 */
export async function GET(req: NextRequest) {
  if (!rateLimit(req, "compliance-report", 30, 60_000)) {
    return fail("Terlalu banyak permintaan — coba lagi sebentar lagi.", 429);
  }
  try {
    const id = req.nextUrl.searchParams.get("id") || "";
    if (!id) return fail("Parameter id perusahaan wajib diisi.", 422);

    const company = await db.registryCompany.findUnique({
      where: { id },
      include: {
        docs: { orderBy: { requirementKey: "asc" } },
        scores: { orderBy: { checkedAt: "asc" }, take: 12 },
      },
    });
    if (!company) return fail("Perusahaan tidak ditemukan pada registri.", 404);

    const scan = buildScan(
      { nib: company.nib, name: company.name, legalEntity: company.legalEntity, city: company.city, province: company.province, note: company.note },
      company.docs.map((d) => ({
        requirementKey: d.requirementKey,
        docNo: d.docNo,
        issuedBy: d.issuedBy,
        validUntil: d.validUntil ? d.validUntil.toISOString() : null,
      }))
    );

    return ok({
      report: {
        company: {
          id: company.id,
          nib: company.nib,
          name: company.name,
          legalEntity: company.legalEntity,
          city: company.city,
          province: company.province,
        },
        scan,
        grade: gradeOf(scan.score),
        risk: riskOf(scan),
        trend: company.scores.map((s) => ({
          score: s.score,
          grade: s.grade,
          risk: s.risk,
          checkedAt: s.checkedAt.toISOString(),
        })),
      },
    });
  } catch {
    return fail("Gagal memuat laporan kepatuhan.", 500);
  }
}
