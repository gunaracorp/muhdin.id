import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { logAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { auditCompany } from "@/lib/compliance-engine";
import { notifyEmailComplianceAudit } from "@/lib/email";
import { notifyComplianceAudit } from "@/lib/whatsapp";

/**
 * v12.1 — GOD-MODE COMPLIANCE AUDIT (CMS).
 *
 * POST /api/compliance/audit
 *   Jalankan audit god-mode: menilai SELURUH RegistryCompany dengan engine
 *   Pindai Izin 360°, menyimpan snapshot skor (riwayat tren), temuan
 *   berprioritas, dan agregat audit. Temuan memicu notifikasi Email
 *   sekretariat + WhatsApp admin (saklar notifyCompliance).
 *   Role: SUPER_ADMIN, ADMIN, VERIFIKATOR. Rate limit 6/menit (operasi berat).
 *
 * GET /api/compliance/audit[?auditId=<id>]
 *   Riwayat audit (20 terakhir) atau detail temuan satu audit.
 *   Role: SUPER_ADMIN, ADMIN, VERIFIKATOR, EDITOR (baca).
 */
export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  if (!rateLimit(req, "compliance-audit-run", 6, 60_000)) {
    return fail("Audit terlalu sering dijalankan — tunggu sebentar.", 429);
  }
  try {
    const user = await requireAdmin().catch(() => null);
    const companies = await db.registryCompany.findMany({
      include: { docs: true },
      orderBy: { name: "asc" },
    });
    if (companies.length === 0) return fail("Registri kosong — tidak ada yang bisa diaudit.", 422);

    const audit = await db.complianceAudit.create({
      data: { scope: "ALL", triggeredBy: user?.email ?? "system" },
    });

    let passed = 0;
    let warnings = 0;
    let critical = 0;
    let scoreSum = 0;
    let expiredDocs = 0;
    let expiringDocs = 0;
    let missingDocs = 0;
    const allFindings: {
      companyId: string;
      companyName: string;
      companyNib: string;
      requirementKey: string;
      letter: string;
      category: string;
      relevance: string;
      status: string;
      tier: number;
      severity: string;
      message: string;
    }[] = [];

    for (const c of companies) {
      const result = auditCompany(
        { nib: c.nib, name: c.name, legalEntity: c.legalEntity, city: c.city, province: c.province, note: c.note },
        c.docs.map((d) => ({
          requirementKey: d.requirementKey,
          docNo: d.docNo,
          issuedBy: d.issuedBy,
          validUntil: d.validUntil ? d.validUntil.toISOString() : null,
        }))
      );

      // Agregat
      scoreSum += result.scan.score;
      if (result.grade === "A" || result.grade === "B") passed += 1;
      else if (result.grade === "C" || result.grade === "D") warnings += 1;
      else critical += 1;
      // Hanya dokumen WAJIB yang dihitung pada agregat dokumen.
      const wajib = result.scan.checklist.filter((x) => x.relevance === "WAJIB");
      expiredDocs += wajib.filter((x) => x.status === "EXPIRED").length;
      expiringDocs += wajib.filter((x) => x.status === "EXPIRING").length;
      missingDocs += wajib.filter((x) => x.status === "MISSING").length;

      // Snapshot skor (riwayat tren)
      await db.complianceScore.create({
        data: {
          companyId: c.id,
          score: result.scan.score,
          grade: result.grade,
          risk: result.risk,
          heldClasses: JSON.stringify(result.scan.heldClasses),
          currentClass: result.scan.currentClass,
          validCount: result.scan.summary.valid,
          expiringCount: result.scan.summary.expiring,
          expiredCount: result.scan.summary.expired,
          missingCount: result.scan.summary.missing,
        },
      });

      // Temuan (non-VALID, tier ≤3)
      for (const f of result.findings) {
        allFindings.push({
          companyId: c.id,
          companyName: c.name,
          companyNib: c.nib,
          requirementKey: f.requirementKey,
          letter: f.letter,
          category: f.category,
          relevance: f.relevance,
          status: f.status,
          tier: f.tier,
          severity: f.severity,
          message: f.message,
        });
      }
    }

    // Tulis temuan + finalisasi agregat audit.
    await db.complianceFinding.createMany({ data: allFindings.map((f) => ({ ...f, auditId: audit.id })) });
    const finishedAt = new Date();
    const total = companies.length;
    const avgScore = total ? scoreSum / total : 0;
    const finalAudit = await db.complianceAudit.update({
      where: { id: audit.id },
      data: {
        total,
        passed,
        warnings,
        critical,
        avgScore,
        expiredDocs,
        expiringDocs,
        missingDocs,
        finishedAt,
      },
    });

    // Notifikasi ganda (gagal-aman) — hanya bila ada temuan.
    const hasFindings = allFindings.length > 0;
    if (hasFindings) {
      const sorted = [...allFindings].sort((a, b) => a.tier - b.tier);
      await Promise.allSettled([
        notifyEmailComplianceAudit({
          auditId: audit.id,
          total,
          passed,
          warnings,
          critical,
          avgScore,
          expiredDocs,
          expiringDocs,
          missingDocs,
          triggeredBy: user?.email ?? "system",
          finishedAt,
          topFindings: sorted,
          refId: audit.id,
        }),
        notifyComplianceAudit({
          total,
          critical,
          warnings,
          avgScore,
          expiredDocs,
          expiringDocs,
          topFinding: sorted[0]?.message ?? null,
        }),
      ]);
    }
    await db.complianceAudit.update({ where: { id: audit.id }, data: { notified: hasFindings } }).catch(() => {});

    void logAudit(req, {
      action: "AUDIT",
      entity: "ComplianceAudit",
      entityId: audit.id,
      detail: `God-mode audit: ${total} perusahaan · rata-rata ${Math.round(avgScore)} · ${critical} kritis · ${allFindings.length} temuan`,
    });

    return ok({
      audit: finalAudit,
      findingsCount: allFindings.length,
      topFindings: [...allFindings].sort((a, b) => a.tier - b.tier).slice(0, 12),
      notified: hasFindings,
    }, 201);
  } catch {
    return fail("Gagal menjalankan audit kepatuhan.", 500);
  }
}

export async function GET(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR", "EDITOR"]);
  if (denied) return denied;
  try {
    const auditId = req.nextUrl.searchParams.get("auditId");
    if (auditId) {
      const audit = await db.complianceAudit.findUnique({ where: { id: auditId } });
      if (!audit) return fail("Audit tidak ditemukan.", 404);
      const findings = await db.complianceFinding.findMany({
        where: { auditId },
        orderBy: [{ tier: "asc" }, { companyName: "asc" }],
        take: 300,
      });
      return ok({ audit, findings });
    }
    const audits = await db.complianceAudit.findMany({
      orderBy: { startedAt: "desc" },
      take: 20,
      include: { _count: { select: { findings: true } } },
    });
    return ok(audits);
  } catch {
    return fail("Gagal memuat riwayat audit.", 500);
  }
}
