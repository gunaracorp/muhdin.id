import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { buildScan } from "@/lib/license-engine";
import { gradeOf, riskOf } from "@/lib/compliance-engine";

/**
 * v12.1 — GOD-MODE COMPLIANCE SCOREBOARD (publik).
 * GET /api/compliance/scoreboard
 *
 * Papan pantau kepatuhan seluruh perusahaan registri — dihitung LIVE dari
 * engine Pindai Izin 360° (bukan cache), sehingga kedaluwarsa hari-itu pun
 * langsung terlihat. Riwayat skor tersimpan via audit (ComplianceScore).
 * Rate limit 30/menit/IP (endpoint publik).
 */
export async function GET(req: NextRequest) {
  if (!rateLimit(req, "compliance-scoreboard", 30, 60_000)) {
    return fail("Terlalu banyak permintaan — coba lagi sebentar lagi.", 429);
  }
  try {
    const companies = await db.registryCompany.findMany({
      include: {
        docs: true,
        scores: { orderBy: { checkedAt: "desc" }, take: 1 },
      },
      orderBy: { name: "asc" },
    });

    const rows = companies
      .map((c) => {
        const scan = buildScan(
          { nib: c.nib, name: c.name, legalEntity: c.legalEntity, city: c.city, province: c.province, note: c.note },
          c.docs.map((d) => ({
            requirementKey: d.requirementKey,
            docNo: d.docNo,
            issuedBy: d.issuedBy,
            validUntil: d.validUntil ? d.validUntil.toISOString() : null,
          }))
        );
        return {
          id: c.id,
          nib: c.nib,
          name: c.name,
          legalEntity: c.legalEntity,
          city: c.city,
          province: c.province,
          heldClasses: scan.heldClasses,
          currentClass: scan.currentClass,
          score: scan.score,
          grade: gradeOf(scan.score),
          risk: riskOf(scan),
          summary: scan.summary,
          lastCheckedAt: c.scores[0]?.checkedAt?.toISOString() ?? null,
        };
      })
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

    const total = rows.length;
    const avg = total ? Math.round(rows.reduce((s, r) => s + r.score, 0) / total) : 0;
    const summary = {
      total,
      avgScore: avg,
      grades: {
        A: rows.filter((r) => r.grade === "A").length,
        B: rows.filter((r) => r.grade === "B").length,
        C: rows.filter((r) => r.grade === "C").length,
        D: rows.filter((r) => r.grade === "D").length,
        E: rows.filter((r) => r.grade === "E").length,
      },
      risks: {
        RENDAH: rows.filter((r) => r.risk === "RENDAH").length,
        SEDANG: rows.filter((r) => r.risk === "SEDANG").length,
        TINGGI: rows.filter((r) => r.risk === "TINGGI").length,
        KRITIS: rows.filter((r) => r.risk === "KRITIS").length,
      },
      // Dokumen wajib bermasalah di seluruh registri (untuk kartu ringkasan).
      expiredWajib: rows.reduce((s, r) => s + r.summary.expired, 0),
      expiringWajib: rows.reduce((s, r) => s + r.summary.expiring, 0),
    };

    const lastAudit = await db.complianceAudit.findFirst({
      orderBy: { startedAt: "desc" },
      select: { id: true, startedAt: true, finishedAt: true, total: true, passed: true, warnings: true, critical: true, avgScore: true, notified: true },
    });

    return ok({ rows, summary, lastAudit: lastAudit ? { ...lastAudit, startedAt: lastAudit.startedAt.toISOString(), finishedAt: lastAudit.finishedAt?.toISOString() ?? null } : null });
  } catch {
    return fail("Gagal memuat papan kepatuhan.", 500);
  }
}
